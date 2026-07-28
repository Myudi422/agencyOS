from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
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
    Menampilkan status aktual (sukses/gagal/processing), URL post di platform, dan info kredit.
    """
    # ─── 1. Ambil PostPublishResult yang sudah ada (has_result) ─────────
    result_query = (
        db.query(PostPublishResult)
        .join(PostTarget, PostPublishResult.post_target_id == PostTarget.id)
        .join(Post, PostTarget.post_id == Post.id)
        .filter(Post.workspace_id == workspace_id)
    )
    if user_id:
        result_query = result_query.filter(Post.created_by_user_id == user_id)
    if success is not None:
        result_query = result_query.filter(PostPublishResult.success == success)

    # IDs of post_targets that already have a PostPublishResult
    result_target_ids = {r.post_target_id for r in result_query.all()}

    # ─── 2. Ambil PostTarget yang masih PUBLISHING (belum ada result) ───
    # Only include when no success filter is active (processing is neither true/false)
    processing_targets = []
    if success is None:
        pt_query = (
            db.query(PostTarget)
            .join(Post, PostTarget.post_id == Post.id)
            .filter(
                Post.workspace_id == workspace_id,
                PostTarget.status == PostStatus.PUBLISHING,
                PostTarget.id.notin_(result_target_ids) if result_target_ids else True
            )
        )
        if user_id:
            pt_query = pt_query.filter(Post.created_by_user_id == user_id)
        if platform:
            pt_query = pt_query.join(SocialAccount, PostTarget.social_account_id == SocialAccount.id).filter(
                SocialAccount.platform == platform
            )
        processing_targets = pt_query.order_by(PostTarget.created_at.desc()).all()

    # ─── 3. Build total count & paginated results ────────────────────────
    total_results = result_query.count()
    total = total_results + len(processing_targets)

    history_list = []

    # Insert processing targets first (they're most recent & pending)
    for target in processing_targets:
        acc = target.social_account
        post = target.post
        if platform and acc and acc.platform.value != platform:
            continue

        # Find the associated job to get job status
        job = db.query(PublishJob).filter(PublishJob.post_target_id == target.id).order_by(PublishJob.created_at.desc()).first()
        job_status = job.status.value if job else "processing"

        history_list.append({
            "result_id": None,
            "postforme_result_id": None,
            "postforme_post_id": target.platform_post_id,
            "post_id": post.id if post else None,
            "post_caption": (post.caption or "")[:60] if post else "",
            "post_type": post.post_type.value if post else "unknown",
            "media_urls": (post.media_urls or [])[:1] if post else [],
            "platform": acc.platform.value if acc else "unknown",
            "username": acc.username if acc else "Unknown",
            "avatar_url": acc.avatar_url if acc else None,
            "success": None,          # null = still processing
            "status": "processing",   # explicit status field
            "job_status": job_status,
            "platform_url": None,
            "platform_post_id": None,
            "error_data": None,
            "credit_deducted": False,
            "source": "queue",
            "created_by": post.created_by if post else None,
            "created_by_user_id": post.created_by_user_id if post else None,
            "published_at": None,
            "scheduled_at": post.scheduled_at if post else None,
            "result_at": target.created_at
        })

    # Then append paginated real results
    real_results = result_query.order_by(PostPublishResult.created_at.desc()).offset(offset).limit(limit).all()
    for r in real_results:
        target = r.post_target
        acc = target.social_account if target else None
        post = target.post if target else None

        if platform and acc and acc.platform.value != platform:
            continue

        history_list.append({
            "result_id": r.id,
            "postforme_result_id": r.postforme_result_id,
            "postforme_post_id": r.postforme_post_id,
            "post_id": post.id if post else None,
            "post_caption": (post.caption or "")[:60] if post else "",
            "post_type": post.post_type.value if post else "unknown",
            "media_urls": (post.media_urls or [])[:1] if post else [],
            "platform": acc.platform.value if acc else "unknown",
            "username": acc.username if acc else "Unknown",
            "avatar_url": acc.avatar_url if acc else None,
            "success": r.success,
            "status": "success" if r.success is True else ("failed" if r.success is False else "pending"),
            "job_status": None,
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
