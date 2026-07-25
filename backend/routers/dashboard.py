from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, time
from backend.database import get_db
from backend.models.models import (
    SocialAccount, Post, PostTarget, Client, ActivityLog, PublishJob, PostStatus, AccountStatus, JobStatus
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard Overview"])

@router.get("/")
def get_dashboard_overview(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db)
):
    """
    Sub-300ms fast executive dashboard endpoint returning real-time metrics,
    queue health, active client stats, and recent activity logs.
    """
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)

    # 1. Accounts
    total_accounts = db.query(SocialAccount).filter(SocialAccount.workspace_id == workspace_id).count()
    connected_accounts = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == workspace_id,
        SocialAccount.status == AccountStatus.CONNECTED
    ).count()

    # 2. Today's Post Metrics
    scheduled_today = db.query(Post).filter(
        Post.workspace_id == workspace_id,
        Post.status == PostStatus.SCHEDULED,
        Post.scheduled_at >= today_start,
        Post.scheduled_at <= today_end
    ).count()

    published_today = db.query(PostTarget).join(Post, PostTarget.post_id == Post.id).filter(
        Post.workspace_id == workspace_id,
        PostTarget.status == PostStatus.PUBLISHED,
        PostTarget.created_at >= today_start
    ).count()

    failed_today = db.query(PostTarget).join(Post, PostTarget.post_id == Post.id).filter(
        Post.workspace_id == workspace_id,
        PostTarget.status == PostStatus.FAILED,
        PostTarget.created_at >= today_start
    ).count()

    # 3. Clients
    active_clients = db.query(Client).filter(Client.workspace_id == workspace_id).count()

    # 4. Queue metrics
    active_jobs = db.query(PublishJob).join(PostTarget).join(Post).filter(
        Post.workspace_id == workspace_id,
        PublishJob.status.in_([JobStatus.PENDING, JobStatus.PROCESSING, JobStatus.RETRYING])
    ).count()

    # 5. Recent Activity
    recent_activity = (
        db.query(ActivityLog)
        .filter(ActivityLog.workspace_id == workspace_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(6)
        .all()
    )

    return {
        "metrics": {
            "total_accounts": total_accounts,
            "connected_accounts": connected_accounts,
            "scheduled_today": scheduled_today,
            "published_today": published_today,
            "failed_today": failed_today,
            "active_clients": active_clients,
            "active_queue_jobs": active_jobs
        },
        "recent_activity": [
            {
                "id": a.id,
                "user_name": a.user_name,
                "action": a.action,
                "details": a.details,
                "entity_type": a.entity_type,
                "created_at": a.created_at
            } for a in recent_activity
        ]
    }
