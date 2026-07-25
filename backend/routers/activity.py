from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.models import ActivityLog

router = APIRouter(prefix="/activity", tags=["Activity Logs"])

@router.get("/")
def get_activity_logs(
    workspace_id: str = Query(..., description="Workspace ID"),
    limit: int = Query(50, ge=1, le=200),
    entity_type: Optional[str] = Query(None, description="Account, Post, Client, Media"),
    db: Session = Depends(get_db)
):
    """Retrieves chronological activity audit logs."""
    query = db.query(ActivityLog).filter(ActivityLog.workspace_id == workspace_id)

    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)

    logs = query.order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "workspace_id": l.workspace_id,
            "user_name": l.user_name,
            "action": l.action,
            "details": l.details,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "created_at": l.created_at
        } for l in logs
    ]
