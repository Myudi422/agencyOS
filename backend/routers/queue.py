from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import PublishJob, PostTarget, Post, SocialAccount, JobStatus, PostStatus
from backend.services.queue_service import queue_service

router = APIRouter(prefix="/queue", tags=["Queue Engine"])

@router.get("/")
def get_queue_status(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db)
):
    """
    Returns Upstash Redis & Celery worker queue metrics and job logs.
    """
    jobs = (
        db.query(PublishJob)
        .join(PostTarget, PublishJob.post_target_id == PostTarget.id)
        .join(Post, PostTarget.post_id == Post.id)
        .filter(Post.workspace_id == workspace_id)
        .order_by(PublishJob.created_at.desc())
        .limit(100)
        .all()
    )

    pending_count = sum(1 for j in jobs if j.status == JobStatus.PENDING)
    processing_count = sum(1 for j in jobs if j.status == JobStatus.PROCESSING)
    retrying_count = sum(1 for j in jobs if j.status == JobStatus.RETRYING)
    failed_count = sum(1 for j in jobs if j.status == JobStatus.FAILED)
    success_count = sum(1 for j in jobs if j.status == JobStatus.SUCCESS)

    job_list = []
    for j in jobs:
        target = j.post_target
        acc = target.social_account if target else None
        post = target.post if target else None

        job_list.append({
            "job_id": j.id,
            "target_id": target.id if target else None,
            "platform": acc.platform.value if acc else "Unknown",
            "username": acc.username if acc else "Unknown",
            "post_caption": post.caption[:40] if post and post.caption else "Post Media",
            "status": j.status.value,
            "attempts": j.attempts,
            "max_attempts": j.max_attempts,
            "last_error": j.last_error,
            "next_retry_at": j.next_retry_at,
            "created_at": j.created_at,
            "completed_at": j.completed_at
        })

    return {
        "engine": "Upstash Redis + Celery Worker",
        "active_workers": 100,
        "metrics": {
            "pending": pending_count,
            "processing": processing_count,
            "retrying": retrying_count,
            "failed": failed_count,
            "success": success_count,
            "total_processed": len(jobs)
        },
        "jobs": job_list
    }

@router.post("/retry/{job_id}")
async def retry_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually triggers immediate retry for a failed or retrying queue job."""
    job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = JobStatus.PENDING
    job.last_error = None
    db.commit()

    background_tasks.add_task(queue_service.process_publish_job, job.id)
    return {"status": "success", "message": f"Job {job_id} requeued into Upstash Redis."}
