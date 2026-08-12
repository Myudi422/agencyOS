import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.models import ActivityLog

router = APIRouter(prefix="/activity", tags=["Activity Logs"])

def trim_activity_logs(db: Session, workspace_id: str, max_logs: int = 50):
    """
    Ensures that a workspace maintains at most `max_logs` activity log records.
    Deletes the oldest records if total count exceeds `max_logs`.
    """
    total_count = db.query(ActivityLog).filter(ActivityLog.workspace_id == workspace_id).count()
    if total_count > max_logs:
        excess = total_count - max_logs
        # Subquery to get IDs of oldest excess records
        oldest_ids = (
            db.query(ActivityLog.id)
            .filter(ActivityLog.workspace_id == workspace_id)
            .order_by(ActivityLog.created_at.asc())
            .limit(excess)
            .all()
        )
        if oldest_ids:
            ids_to_delete = [r[0] for r in oldest_ids]
            db.query(ActivityLog).filter(ActivityLog.id.in_(ids_to_delete)).delete(synchronize_session=False)
            db.commit()


@router.get("/")
def get_activity_logs(
    workspace_id: str = Query(..., description="Workspace ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    entity_type: Optional[str] = Query(None, description="Account, Post, Client, Media"),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological activity audit logs with server-side pagination.
    Automatically trims logs beyond top 50 oldest per workspace.
    """
    # Enforce capping to max 50 items in DB
    trim_activity_logs(db, workspace_id, max_logs=50)

    query = db.query(ActivityLog).filter(ActivityLog.workspace_id == workspace_id)

    if entity_type and entity_type.lower() != "all":
        query = query.filter(ActivityLog.entity_type == entity_type)

    total = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = [
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

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "max_limit": 50
    }

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
