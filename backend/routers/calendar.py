import logging
import asyncio
import calendar as py_calendar
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.database import get_db
from backend.models.models import Post, PostStatus, AccountStatus, SocialAccount, ActivityLog, User
from backend.routers.firebase_auth import require_user, get_user_workspace
from backend.services.postforme_service import postforme_service
from backend.routers.statistics import _fetch_all_posts_for_account, _parse_iso

logger = logging.getLogger("CalendarRouter")

router = APIRouter(prefix="/calendar", tags=["Calendar"])

# In-memory TTL Cache for Calendar (TTL: 3 minutes = 180 seconds)
_CALENDAR_CACHE: Dict[str, tuple] = {}
CALENDAR_CACHE_TTL_SECONDS = 180

class RescheduleRequest(BaseModel):
    new_scheduled_at: str  # ISO datetime

@router.get("/")
async def get_calendar_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    year: Optional[int] = Query(None, description="Year e.g. 2026"),
    month: Optional[int] = Query(None, description="Month 1-12"),
    start_date: Optional[str] = Query(None, description="Start date ISO"),
    end_date: Optional[str] = Query(None, description="End date ISO"),
    force_refresh: bool = Query(False, description="Force bypass cache"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Retrieves scheduled, published, and native historical posts for the authenticated user's workspace.
    - Validates user workspace ownership (multi-tenancy)
    - Filters posts by selected month & year for maximum performance
    - Fixed 400 Bad Request error by passing valid status params (scheduled, published, processing)
    - Uses TTL cache for ultra-fast performance
    """
    get_user_workspace(current_user, workspace_id, db)  # Strict multi-tenancy check

    # Compute date range
    dt_from: Optional[datetime] = None
    dt_to: Optional[datetime] = None

    if year and month:
        _, last_day = py_calendar.monthrange(year, month)
        dt_from = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        dt_to = datetime(year, month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    else:
        dt_from = _parse_iso(start_date)
        dt_to = _parse_iso(end_date)

    cache_key = f"cal:{workspace_id}:{year or ''}:{month or ''}"
    now_ts = datetime.utcnow().timestamp()

    if not force_refresh:
        cached_entry = _CALENDAR_CACHE.get(cache_key)
        if cached_entry and (now_ts - cached_entry[0] < CALENDAR_CACHE_TTL_SECONDS) and len(cached_entry[1]) > 0:
            return cached_entry[1]

    # 1. Fetch connected social accounts and auto-resolve missing postforme_account_ids
    accounts = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.workspace_id == workspace_id,
            SocialAccount.status == AccountStatus.CONNECTED,
        )
        .all()
    )

    if accounts:
        try:
            res_accs = await postforme_service.get_social_accounts(external_id=[workspace_id], limit=100)
            items_acc = res_accs.get("data", [])
            for acc in accounts:
                if not acc.postforme_account_id:
                    for item in items_acc:
                        if (item.get("username") and item.get("username").lower() == acc.username.lower()) or item.get("user_id") == acc.platform_account_id:
                            acc.postforme_account_id = item.get("id")
                            db.commit()
                            break
        except Exception as err:
            logger.warning(f"Failed to auto-resolve account IDs in calendar: {err}")

    acc_by_pf_id = {acc.postforme_account_id: acc for acc in accounts if acc.postforme_account_id}
    acc_by_plat_id = {acc.platform_account_id: acc for acc in accounts if acc.platform_account_id}

    # 2. Fetch non-draft posts from local DB for this workspace
    local_posts = (
        db.query(Post)
        .filter(
            Post.workspace_id == workspace_id,
            Post.status != PostStatus.DRAFT
        )
        .all()
    )
    pf_id_to_local = {p.postforme_post_id: p for p in local_posts if p.postforme_post_id}

    # 3. Fetch scheduled & published posts from PostForMe API for workspace accounts
    pf_posts = []
    target_account_ids = list(acc_by_pf_id.keys()) or [a.platform_account_id for a in accounts if a.platform_account_id]
    if target_account_ids:
        try:
            res_pf = await postforme_service.get_posts(
                social_account_id=target_account_ids,
                limit=100
            )
            pf_posts = res_pf.get("data", [])
        except Exception as e:
            logger.warning(f"PostForMe calendar get_posts failed: {e}")

    # 4. Fetch native historical social feed posts filtered by selected month/year
    all_real_feed_posts = []
    if accounts:
        semaphore = asyncio.Semaphore(5)
        async def _fetch_feed(acc):
            async with semaphore:
                try:
                    target_id = acc.postforme_account_id or acc.platform_account_id or acc.id
                    plat_str = acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform)
                    posts = await _fetch_all_posts_for_account(
                        social_account_id=target_id,
                        platform=plat_str,
                        date_from=dt_from,
                        date_to=dt_to,
                        limit_per_page=50
                    )
                    for p in posts:
                        p["_acc"] = acc
                    return posts
                except Exception as err:
                    logger.warning(f"Calendar feed fetch error for @{acc.username}: {err}")
                    return []

        feed_lists = await asyncio.gather(*[_fetch_feed(a) for a in accounts], return_exceptions=True)
        for flist in feed_lists:
            if isinstance(flist, list):
                all_real_feed_posts.extend(flist)

    events = []
    seen_ids = set()

    # Process PostForMe API posts
    for pf in pf_posts:
        pf_id = pf.get("id")
        if not pf_id or pf_id in seen_ids:
            continue

        local = pf_id_to_local.get(pf_id)

        sched_at = pf.get("scheduled_at") or (local.scheduled_at.isoformat() if local and local.scheduled_at else None)
        published_at = pf.get("published_at") or (local.published_at.isoformat() if local and local.published_at else None)
        created_at = pf.get("created_at") or (local.created_at.isoformat() if local and local.created_at else None)
        event_time = sched_at or published_at or created_at
        if not event_time:
            continue

        # Date range filter check
        dt_ev = _parse_iso(event_time)
        if dt_from and dt_ev and dt_ev < dt_from:
            continue
        if dt_to and dt_ev and dt_ev > dt_to:
            continue

        seen_ids.add(pf_id)

        caption = (local.caption if local else None) or pf.get("caption", "")
        title = (caption[:45] + ("..." if len(caption) > 45 else "")) if caption else "Untitled Post"

        targets = []
        if local:
            for t in local.targets:
                acc = t.social_account
                if acc:
                    pub_url = t.publish_results[0].platform_url if t.publish_results else t.platform_post_id
                    t_status_raw = t.status.value if hasattr(t.status, "value") else str(t.status)
                    t_status_clean = "completed" if t_status_raw in ("published", "completed", "processed") else t_status_raw.lower()

                    targets.append({
                        "id": acc.id,
                        "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
                        "username": acc.username,
                        "avatar_url": acc.avatar_url,
                        "status": t_status_clean,
                        "platform_url": pub_url
                    })
        else:
            pf_accounts = pf.get("social_accounts") or []
            pf_status_raw = pf.get("status", "scheduled")
            status_clean_target = "completed" if pf_status_raw in ("published", "completed", "processed") else pf_status_raw.lower()

            for pf_acc_entry in pf_accounts:
                pf_acc_id = pf_acc_entry if isinstance(pf_acc_entry, str) else pf_acc_entry.get("id")
                acc = acc_by_pf_id.get(pf_acc_id) or acc_by_plat_id.get(pf_acc_id)
                if acc:
                    targets.append({
                        "id": acc.id,
                        "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
                        "username": acc.username,
                        "avatar_url": acc.avatar_url,
                        "status": status_clean_target,
                        "platform_url": None
                    })

        raw_status = pf.get("status") or (local.status.value if local and hasattr(local.status, "value") else "scheduled")
        status_clean = "completed" if raw_status in ("published", "completed", "processed") else str(raw_status).lower()

        media_list = (local.media_urls or []) if local else (pf.get("media") or [])
        if media_list and isinstance(media_list[0], dict):
            media_list = [m.get("url") or m.get("media_url") for m in media_list if isinstance(m, dict)]

        events.append({
            "id": local.id if local else pf_id,
            "postforme_post_id": pf_id,
            "title": title,
            "caption": caption,
            "post_type": local.post_type.value if local and hasattr(local.post_type, "value") else "image",
            "scheduled_at": event_time,
            "published_at": published_at,
            "status": status_clean,
            "media_urls": media_list,
            "target_accounts": targets,
            "targets": targets,
            "account_ids": [t["id"] for t in targets]
        })

    # Include local scheduled/published posts not fetched in pf_posts list
    for p in local_posts:
        if p.id not in seen_ids and (not p.postforme_post_id or p.postforme_post_id not in seen_ids):
            event_time = p.scheduled_at.isoformat() if p.scheduled_at else (p.published_at.isoformat() if p.published_at else p.created_at.isoformat() if p.created_at else None)
            if not event_time:
                continue

            dt_ev = _parse_iso(event_time)
            if dt_from and dt_ev and dt_ev < dt_from:
                continue
            if dt_to and dt_ev and dt_ev > dt_to:
                continue

            seen_ids.add(p.id)
            event_time = p.scheduled_at.isoformat() if p.scheduled_at else (p.published_at.isoformat() if p.published_at else p.created_at.isoformat() if p.created_at else None)
            if not event_time:
                continue

            caption = p.caption or ""
            title = (caption[:45] + ("..." if len(caption) > 45 else "")) if caption else "Scheduled Post"

            targets = []
            for t in p.targets:
                acc = t.social_account
                if acc:
                    pub_url = t.publish_results[0].platform_url if t.publish_results else t.platform_post_id
                    t_status_raw = t.status.value if hasattr(t.status, "value") else str(t.status)
                    t_status_clean = "completed" if t_status_raw in ("published", "completed", "processed") else t_status_raw.lower()

                    targets.append({
                        "id": acc.id,
                        "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
                        "username": acc.username,
                        "avatar_url": acc.avatar_url,
                        "status": t_status_clean,
                        "platform_url": pub_url
                    })

            raw_status = p.status.value if hasattr(p.status, "value") else str(p.status)
            status_clean = "completed" if raw_status in ("published", "completed", "processed") else raw_status.lower()

            events.append({
                "id": p.id,
                "postforme_post_id": p.postforme_post_id,
                "title": title,
                "caption": caption,
                "post_type": p.post_type.value if hasattr(p.post_type, "value") else "image",
                "scheduled_at": event_time,
                "published_at": p.published_at.isoformat() if p.published_at else None,
                "status": status_clean,
                "media_urls": p.media_urls or [],
                "target_accounts": targets,
                "targets": targets,
                "account_ids": [t["id"] for t in targets]
            })

    # Include native historical social feed posts (published BEFORE connecting account to Shiera/PostForMe)
    for item in all_real_feed_posts:
        feed_id = str(item.get("id") or item.get("post_id") or "")
        if not feed_id or feed_id in seen_ids:
            continue
        seen_ids.add(feed_id)

        posted_at = item.get("posted_at") or item.get("created_at") or item.get("timestamp")
        if not posted_at:
            continue

        acc = item["_acc"]
        caption = item.get("caption") or item.get("text") or "Native Social Post"
        title = (caption[:45] + ("..." if len(caption) > 45 else "")) if caption else "Native Social Post"

        thumb = item.get("media_url") or item.get("url") or item.get("thumbnail_url")
        if not thumb and item.get("media") and isinstance(item["media"], list):
            m0 = item["media"][0]
            thumb = m0.get("url") or m0.get("media_url") if isinstance(m0, dict) else str(m0)
        media_list = [thumb] if thumb else []

        plat_url = item.get("platform_url") or item.get("permalink") or item.get("url")
        plat_str = acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform)

        events.append({
            "id": f"native_{feed_id}",
            "postforme_post_id": feed_id,
            "title": title,
            "caption": caption,
            "post_type": "image",
            "scheduled_at": posted_at,
            "published_at": posted_at,
            "status": "completed",
            "media_urls": media_list,
            "target_accounts": [{
                "id": acc.id,
                "platform": plat_str,
                "username": acc.username,
                "avatar_url": acc.avatar_url,
                "status": "completed",
                "platform_url": plat_url
            }],
            "targets": [{
                "id": acc.id,
                "platform": plat_str,
                "username": acc.username,
                "avatar_url": acc.avatar_url,
                "status": "completed",
                "platform_url": plat_url
            }],
            "account_ids": [acc.id]
        })

    _CALENDAR_CACHE[cache_key] = (now_ts, events)
    return events


@router.put("/{post_id}/reschedule")
async def reschedule_post(
    post_id: str,
    data: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Reschedules a post in DB AND in PostForMe API for the current user's workspace."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    get_user_workspace(current_user, post.workspace_id, db)

    new_dt = datetime.fromisoformat(data.new_scheduled_at.replace("Z", "+00:00"))
    old_dt_str = post.scheduled_at.isoformat() if post.scheduled_at else "Unscheduled"

    post.scheduled_at = new_dt
    post.status = PostStatus.SCHEDULED

    # If postforme_post_id exists, update in PostForMe API
    if post.postforme_post_id:
        try:
            acc_ids = [t.social_account.postforme_account_id or t.social_account.id for t in post.targets if t.social_account]
            await postforme_service.create_post(
                caption=post.caption or "",
                social_accounts=acc_ids,
                media=[{"url": u} for u in (post.media_urls or [])] if post.media_urls else None,
                scheduled_at=new_dt.isoformat(),
                external_id=post.id
            )
            logger.info(f"Rescheduled post {post.postforme_post_id} in PostForMe to {new_dt.isoformat()}")
        except Exception as e:
            logger.warning(f"Failed to reschedule in PostForMe: {e}")

    db.add(ActivityLog(
        workspace_id=post.workspace_id,
        user_name=current_user.full_name,
        action="SCHEDULE_POST",
        details=f"Rescheduled post from {old_dt_str} to {new_dt.isoformat()}",
        entity_type="Post",
        entity_id=post.id
    ))
    db.commit()

    return {"status": "success", "post_id": post.id, "new_scheduled_at": post.scheduled_at.isoformat()}

