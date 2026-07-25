from fastapi import APIRouter, Depends, HTTPException, Query
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

@router.delete("/{log_id}")
def delete_activity_log(log_id: str, db: Session = Depends(get_db)):
    """Deletes a specific activity log entry."""
    log = db.query(ActivityLog).filter(ActivityLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Activity log entry not found")
    db.delete(log)
    db.commit()
    return {"status": "success", "message": "Activity log deleted"}

@router.delete("/clear/all")
def clear_all_activity_logs(workspace_id: str = Query(...), db: Session = Depends(get_db)):
    """Clears all activity logs for a workspace."""
    db.query(ActivityLog).filter(ActivityLog.workspace_id == workspace_id).delete()
    db.commit()
    return {"status": "success", "message": "All activity logs cleared"}
