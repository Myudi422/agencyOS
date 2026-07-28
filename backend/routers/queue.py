from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.models import (
    PublishJob, PostTarget, Post, PostPublishResult,
    SocialAccount, JobStatus, PostStatus
)
from backend.services.queue_service import queue_service

router = APIRouter(prefix="/queue", tags=["Queue Engine"])


@router.get("/")
def get_queue_status(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db)
):
    """Returns queue metrics and job logs for a workspace."""
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
        "engine": "AgencyOS Queue Engine",
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


@router.get("/history")
def get_publish_history(
    workspace_id: str = Query(..., description="Workspace ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID (created_by_user_id)"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    limit: int = Query(50, description="Max results"),
    offset: int = Query(0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Riwayat hasil publikasi per workspace/user dari PostForMe.
    Menampilkan status aktual (sukses/gagal), URL post di platform, dan info kredit.
    """
    query = (
        db.query(PostPublishResult)
        .join(PostTarget, PostPublishResult.post_target_id == PostTarget.id)
        .join(Post, PostTarget.post_id == Post.id)
        .filter(Post.workspace_id == workspace_id)
    )

    if user_id:
        query = query.filter(Post.created_by_user_id == user_id)

    if success is not None:
        query = query.filter(PostPublishResult.success == success)

    total = query.count()
    results = query.order_by(PostPublishResult.created_at.desc()).offset(offset).limit(limit).all()

    history_list = []
    for r in results:
        target = r.post_target
        acc = target.social_account if target else None
        post = target.post if target else None

        # Filter platform jika diminta
        if platform and acc and acc.platform.value != platform:
            continue

        history_list.append({
            "result_id": r.id,
            "postforme_result_id": r.postforme_result_id,
            "postforme_post_id": r.postforme_post_id,
            "post_id": post.id if post else None,
            "post_caption": (post.caption or "")[:60] if post else "",
            "post_type": post.post_type.value if post else "unknown",
            "media_urls": (post.media_urls or [])[:1] if post else [],  # Thumbnail
            "platform": acc.platform.value if acc else "unknown",
            "username": acc.username if acc else "Unknown",
            "avatar_url": acc.avatar_url if acc else None,
            "success": r.success,
            "platform_url": r.platform_url,
            "platform_post_id": r.platform_post_id,
            "error_data": r.error_data,
            "credit_deducted": r.credit_deducted,
            "source": r.source,
            "created_by": post.created_by if post else None,
            "created_by_user_id": post.created_by_user_id if post else None,
            "published_at": post.published_at if post else None,
            "scheduled_at": post.scheduled_at if post else None,
            "result_at": r.created_at
        })

    return {
        "data": history_list,
        "meta": {
            "total": total,
            "offset": offset,
            "limit": limit,
            "workspace_id": workspace_id,
            "user_id": user_id
        }
    }


@router.post("/sync-results")
async def sync_post_results(
    workspace_id: str = Query(..., description="Workspace ID"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Sinkronisasi manual: Ambil hasil publish dari PostForMe untuk semua post
    yang masih berstatus PUBLISHING di workspace ini.
    Akan update status target dan deduct kredit jika ada yang sukses.
    """
    background_tasks.add_task(queue_service.sync_all_publishing_posts, db, workspace_id)
    return {
        "status": "sync_started",
        "message": f"Sinkronisasi hasil publishing dimulai di background untuk workspace {workspace_id}.",
        "workspace_id": workspace_id
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
    return {"status": "success", "message": f"Job {job_id} requeued."}


@router.delete("/{job_id}")
def delete_queue_job(job_id: str, db: Session = Depends(get_db)):
    """Deletes/cancels a specific queue job."""
    job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Queue job not found")
    db.delete(job)
    db.commit()
    return {"status": "success", "message": "Queue job deleted"}
