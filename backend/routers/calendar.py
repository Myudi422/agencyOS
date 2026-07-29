import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.database import get_db
from backend.models.models import Post, ActivityLog
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("CalendarRouter")

router = APIRouter(prefix="/calendar", tags=["Calendar"])

class RescheduleRequest(BaseModel):
    new_scheduled_at: str # ISO datetime

@router.get("/")
async def get_calendar_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    start_date: Optional[str] = Query(None, description="Start date ISO"),
    end_date: Optional[str] = Query(None, description="End date ISO"),
    db: Session = Depends(get_db)
):
    """Retrieves posts formatted for Calendar view live from PostForMe API + local enrichment."""
    local_posts = db.query(Post).filter(Post.workspace_id == workspace_id).all()
    pf_id_to_local = {p.postforme_post_id: p for p in local_posts if p.postforme_post_id}

    # Fetch from PostForMe API
    pf_posts = []
    try:
        res = await postforme_service.get_posts(limit=100)
        pf_posts = res.get("data", [])
    except Exception as e:
        logger.warning(f"PostForMe calendar fetch failed: {e}")

    events = []
    seen_ids = set()

    for pf in pf_posts:
        pf_id = pf.get("id")
        if not pf_id or pf_id in seen_ids:
            continue
        seen_ids.add(pf_id)

        local = pf_id_to_local.get(pf_id)
        if local and local.workspace_id != workspace_id:
            continue

        sched_at = pf.get("scheduled_at") or (local.scheduled_at.isoformat() if local and local.scheduled_at else None)
        created_at = pf.get("created_at") or (local.created_at.isoformat() if local and local.created_at else None)
        event_time = sched_at or created_at
        if not event_time:
            continue

        caption = (local.caption if local else None) or pf.get("caption", "")
        title = (caption[:45] + ("..." if len(caption) > 45 else "")) if caption else "Untitled Post"

        targets = []
        if local:
            for t in local.targets:
                acc = t.social_account
                if acc:
                    targets.append({
                        "id": acc.id,
                        "platform": acc.platform.value,
                        "username": acc.username,
                        "avatar_url": acc.avatar_url
                    })

        events.append({
            "id": local.id if local else pf_id,
            "postforme_post_id": pf_id,
            "title": title,
            "caption": caption,
            "post_type": local.post_type.value if local else "image",
            "scheduled_at": event_time,
            "status": pf.get("status", "scheduled"),
            "media_urls": (local.media_urls or []) if local else [],
            "target_accounts": targets,
            "targets": targets,
            "account_ids": [t["id"] for t in targets]
        })

    # Include local drafts not yet sent to PostForMe
    for p in local_posts:
        if not p.postforme_post_id:
            event_time = p.scheduled_at.isoformat() if p.scheduled_at else (p.created_at.isoformat() if p.created_at else None)
            if not event_time:
                continue
            caption = p.caption or ""
            title = (caption[:45] + ("..." if len(caption) > 45 else "")) if caption else "Draft Post"

            targets = []
            for t in p.targets:
                acc = t.social_account
                if acc:
                    targets.append({
                        "id": acc.id,
                        "platform": acc.platform.value,
                        "username": acc.username,
                        "avatar_url": acc.avatar_url
                    })

            events.append({
                "id": p.id,
                "postforme_post_id": None,
                "title": title,
                "caption": caption,
                "post_type": p.post_type.value,
                "scheduled_at": event_time,
                "status": "draft",
                "media_urls": p.media_urls or [],
                "target_accounts": targets,
                "targets": targets,
                "account_ids": [t["id"] for t in targets]
            })

    return events


@router.put("/{post_id}/reschedule")
async def reschedule_post(
    post_id: str,
    data: RescheduleRequest,
    db: Session = Depends(get_db)
):
    """Reschedules a post in DB AND in PostForMe API."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

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
        action="SCHEDULE_POST",
        details=f"Rescheduled post from {old_dt_str} to {new_dt.isoformat()}",
        entity_type="Post",
        entity_id=post.id
    ))
    db.commit()

    return {"status": "success", "post_id": post.id, "new_scheduled_at": post.scheduled_at.isoformat()}
