import logging
import asyncio
import calendar as py_calendar
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models.models import Post, PostStatus, AccountStatus, SocialAccount, ActivityLog, User
from backend.routers.firebase_auth import require_user, get_user_workspace
from backend.services.postforme_service import postforme_service
from backend.routers.statistics import _parse_iso

logger = logging.getLogger("CalendarRouter")

router = APIRouter(prefix="/calendar", tags=["Calendar"])

# In-memory TTL Cache for Calendar (per workspace+month, TTL: 2 minutes)
_CALENDAR_CACHE: Dict[str, tuple] = {}
CALENDAR_CACHE_TTL_SECONDS = 120


class RescheduleRequest(BaseModel):
    new_scheduled_at: str  # ISO datetime


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Guarantee a datetime is UTC-aware, never naive."""
    if not dt:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _parse_and_ensure_utc(dt_val: Any) -> Optional[datetime]:
    """Parse ISO string or datetime and ensure UTC-aware result."""
    if not dt_val:
        return None
    if isinstance(dt_val, datetime):
        return _ensure_utc(dt_val)
    return _ensure_utc(_parse_iso(str(dt_val)))


def _in_range(dt_ev: Optional[datetime], dt_from: Optional[datetime], dt_to: Optional[datetime]) -> bool:
    """Return True if dt_ev is within [dt_from, dt_to] (inclusive), all UTC-aware."""
    if dt_ev is None:
        return True
    if dt_from and dt_ev < dt_from:
        return False
    if dt_to and dt_ev > dt_to:
        return False
    return True


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
    Calendar: PostForMe-first data source.
    - Fetches scheduled/processing/processed posts from PostForMe API
    - Supplements with local non-draft posts that have no PostForMe ID yet
    - Filters by month/year for maximum performance (no full feed scanning)
    - All datetime comparisons are UTC-aware (no TypeError)
    - Draft posts are excluded (draft-only stays in Queue/local)
    - TTL cache per workspace+month key
    """
    get_user_workspace(current_user, workspace_id, db)

    # ── 1. Compute UTC date range ──────────────────────────────────────────
    dt_from: Optional[datetime] = None
    dt_to: Optional[datetime] = None

    if year and month:
        _, last_day = py_calendar.monthrange(year, month)
        dt_from = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        dt_to = datetime(year, month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    else:
        dt_from = _ensure_utc(_parse_iso(start_date))
        dt_to = _ensure_utc(_parse_iso(end_date))

    cache_key = f"cal:{workspace_id}:{year or ''}:{month or ''}"
    now_ts = datetime.utcnow().timestamp()

    if not force_refresh:
        cached = _CALENDAR_CACHE.get(cache_key)
        if cached and (now_ts - cached[0] < CALENDAR_CACHE_TTL_SECONDS) and len(cached[1]) > 0:
            return cached[1]

    # ── 2. Fetch connected social accounts, auto-resolve postforme IDs ────
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
                        if (
                            (item.get("username") and item.get("username").lower() == acc.username.lower())
                            or item.get("user_id") == acc.platform_account_id
                        ):
                            acc.postforme_account_id = item.get("id")
                            db.commit()
                            break
        except Exception as err:
            logger.warning(f"Calendar: auto-resolve account IDs failed: {err}")

    acc_by_pf_id = {acc.postforme_account_id: acc for acc in accounts if acc.postforme_account_id}
    acc_by_plat_id = {acc.platform_account_id: acc for acc in accounts if acc.platform_account_id}

    # ── 3. Local non-draft posts lookup ───────────────────────────────────
    local_posts = (
        db.query(Post)
        .filter(
            Post.workspace_id == workspace_id,
            Post.status != PostStatus.DRAFT
        )
        .all()
    )
    pf_id_to_local = {p.postforme_post_id: p for p in local_posts if p.postforme_post_id}

    # ── 4. Fetch PostForMe posts (no status filter to avoid 400) ──────────
    pf_posts = []
    target_acc_ids = list(acc_by_pf_id.keys())
    if not target_acc_ids:
        # Fallback to platform_account_id if no pf IDs resolved yet
        target_acc_ids = [a.platform_account_id for a in accounts if a.platform_account_id]

    if target_acc_ids:
        try:
            res_pf = await postforme_service.get_posts(
                social_account_id=target_acc_ids,
                limit=100
            )
            pf_posts = res_pf.get("data", [])
        except Exception as e:
            logger.warning(f"Calendar: PostForMe get_posts failed: {e}")

    # ── 5. Build events ────────────────────────────────────────────────────
    events = []
    seen_ids: set = set()

    def _build_targets_from_local(post_obj):
        targets = []
        for t in post_obj.targets:
            acc = t.social_account
            if not acc:
                continue
            pub_url = t.publish_results[0].platform_url if t.publish_results else None
            t_status = t.status.value if hasattr(t.status, "value") else str(t.status)
            t_status = "completed" if t_status in ("published", "completed", "processed") else t_status.lower()
            targets.append({
                "id": acc.id,
                "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
                "username": acc.username,
                "avatar_url": acc.avatar_url,
                "status": t_status,
                "platform_url": pub_url
            })
        return targets

    def _build_targets_from_pf(pf_item, raw_status):
        targets = []
        status_clean = "completed" if raw_status in ("published", "completed", "processed") else raw_status.lower()
        for pf_acc_entry in (pf_item.get("social_accounts") or []):
            pf_acc_id = pf_acc_entry if isinstance(pf_acc_entry, str) else pf_acc_entry.get("id")
            acc = acc_by_pf_id.get(pf_acc_id) or acc_by_plat_id.get(pf_acc_id)
            if acc:
                targets.append({
                    "id": acc.id,
                    "platform": acc.platform.value if hasattr(acc.platform, "value") else str(acc.platform),
                    "username": acc.username,
                    "avatar_url": acc.avatar_url,
                    "status": status_clean,
                    "platform_url": None
                })
        return targets

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

        dt_ev = _parse_and_ensure_utc(event_time)
        if not _in_range(dt_ev, dt_from, dt_to):
            continue

        seen_ids.add(pf_id)

        caption = (local.caption if local else None) or pf.get("caption", "")
        title = (caption[:45] + "...") if len(caption) > 45 else caption or "Untitled Post"
        raw_status = pf.get("status") or (local.status.value if local and hasattr(local.status, "value") else "scheduled")
        status_clean = "completed" if raw_status in ("published", "completed", "processed") else str(raw_status).lower()
        targets = _build_targets_from_local(local) if local else _build_targets_from_pf(pf, raw_status)
        media_list = (local.media_urls or []) if local else (pf.get("media") or [])
        if media_list and isinstance(media_list[0], dict):
            media_list = [m.get("url") or m.get("media_url") for m in media_list if isinstance(m, dict)]

        events.append({
            "id": local.id if local else pf_id,
            "postforme_post_id": pf_id,
            "title": title,
            "caption": caption,
            "post_type": (local.post_type.value if local and hasattr(local.post_type, "value") else None) or "image",
            "scheduled_at": event_time,
            "published_at": published_at,
            "created_at": created_at,
            "status": status_clean,
            "media_urls": media_list,
            "targets": targets,
            "account_ids": [t["id"] for t in targets],
            "source": "postforme"
        })

    # Supplement with local posts not tracked in PostForMe
    for p in local_posts:
        if p.id in seen_ids or (p.postforme_post_id and p.postforme_post_id in seen_ids):
            continue
        event_time = (
            p.scheduled_at.isoformat() if p.scheduled_at
            else (p.published_at.isoformat() if p.published_at
                  else (p.created_at.isoformat() if p.created_at else None))
        )
        if not event_time:
            continue
        dt_ev = _parse_and_ensure_utc(event_time)
        if not _in_range(dt_ev, dt_from, dt_to):
            continue

        seen_ids.add(p.id)
        caption = p.caption or ""
        title = (caption[:45] + "...") if len(caption) > 45 else caption or "Scheduled Post"
        raw_status = p.status.value if hasattr(p.status, "value") else str(p.status)
        status_clean = "completed" if raw_status in ("published", "completed", "processed") else raw_status.lower()
        targets = _build_targets_from_local(p)

        events.append({
            "id": p.id,
            "postforme_post_id": p.postforme_post_id,
            "title": title,
            "caption": caption,
            "post_type": (p.post_type.value if hasattr(p.post_type, "value") else None) or "image",
            "scheduled_at": event_time,
            "published_at": p.published_at.isoformat() if p.published_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "status": status_clean,
            "media_urls": p.media_urls or [],
            "targets": targets,
            "account_ids": [t["id"] for t in targets],
            "source": "local"
        })

    # Sort by event time ascending
    events.sort(key=lambda e: e.get("scheduled_at") or e.get("published_at") or "")

    if events:
        _CALENDAR_CACHE[cache_key] = (now_ts, events)
    return events


@router.put("/{post_id}/reschedule")
async def reschedule_post(
    post_id: str,
    data: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Reschedules a post in DB AND in PostForMe API."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    get_user_workspace(current_user, post.workspace_id, db)

    new_dt = _ensure_utc(datetime.fromisoformat(data.new_scheduled_at.replace("Z", "+00:00")))
    old_dt_str = post.scheduled_at.isoformat() if post.scheduled_at else "Unscheduled"

    post.scheduled_at = new_dt
    post.status = PostStatus.SCHEDULED

    if post.postforme_post_id:
        try:
            acc_ids = [
                t.social_account.postforme_account_id or t.social_account.id
                for t in post.targets if t.social_account
            ]
            await postforme_service.create_post(
                caption=post.caption or "",
                social_accounts=acc_ids,
                media=[{"url": u} for u in (post.media_urls or [])] if post.media_urls else None,
                scheduled_at=new_dt.isoformat(),
                external_id=post.id
            )
        except Exception as e:
            logger.warning(f"Failed to reschedule in PostForMe: {e}")

    db.add(ActivityLog(
        workspace_id=post.workspace_id,
        user_name=current_user.full_name,
        action="SCHEDULE_POST",
        details=f"Rescheduled from {old_dt_str} to {new_dt.isoformat()}",
        entity_type="Post",
        entity_id=post.id
    ))
    db.commit()

    # Invalidate calendar cache for this workspace
    for k in list(_CALENDAR_CACHE.keys()):
        if k.startswith(f"cal:{post.workspace_id}:"):
            del _CALENDAR_CACHE[k]

    return {"status": "success", "post_id": post.id, "new_scheduled_at": post.scheduled_at.isoformat()}
