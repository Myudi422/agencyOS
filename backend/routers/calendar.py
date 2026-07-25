from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from backend.database import get_db
from backend.models.models import Post, ActivityLog

router = APIRouter(prefix="/calendar", tags=["Calendar"])

class RescheduleRequest(BaseModel):
    new_scheduled_at: str # ISO datetime

@router.get("/")
def get_calendar_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    start_date: Optional[str] = Query(None, description="Start date ISO"),
    end_date: Optional[str] = Query(None, description="End date ISO"),
    db: Session = Depends(get_db)
):
    """Retrieves posts formatted for Calendar view (Month, Week, Day)."""
    query = db.query(Post).filter(
        Post.workspace_id == workspace_id,
        Post.scheduled_at.isnot(None)
    )

    if start_date:
        dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        query = query.filter(Post.scheduled_at >= dt_start)
    if end_date:
        dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        query = query.filter(Post.scheduled_at <= dt_end)

    posts = query.order_by(Post.scheduled_at.asc()).all()
    
    events = []
    for p in posts:
        target_accounts = []
        for t in p.targets:
            if t.social_account:
                target_accounts.append({
                    "id": t.social_account.id,
                    "platform": t.social_account.platform.value,
                    "username": t.social_account.username,
                    "avatar_url": t.social_account.avatar_url
                })

        events.append({
            "id": p.id,
            "title": p.caption[:40] + ("..." if p.caption and len(p.caption) > 40 else "") or "Scheduled Post",
            "post_type": p.post_type.value,
            "caption": p.caption,
            "scheduled_at": p.scheduled_at.isoformat(),
            "status": p.status.value,
            "media_urls": p.media_urls or [],
            "target_accounts": target_accounts
        })

    return events

@router.put("/{post_id}/reschedule")
def reschedule_post(
    post_id: str,
    data: RescheduleRequest,
    db: Session = Depends(get_db)
):
    """Reschedules a post (e.g. from Drag & Drop calendar interaction)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_dt = datetime.fromisoformat(data.new_scheduled_at.replace("Z", "+00:00"))
    old_dt_str = post.scheduled_at.isoformat() if post.scheduled_at else "Unscheduled"
    
    post.scheduled_at = new_dt
    
    db.add(ActivityLog(
        workspace_id=post.workspace_id,
        action="SCHEDULE_POST",
        details=f"Rescheduled post from {old_dt_str} to {new_dt.isoformat()}",
        entity_type="Post",
        entity_id=post.id
    ))
    db.commit()

    return {"status": "success", "post_id": post.id, "new_scheduled_at": post.scheduled_at.isoformat()}
