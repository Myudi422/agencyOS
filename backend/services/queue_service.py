import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.models import (
    Post, PostTarget, PublishJob, PostStatus, JobStatus, AccountPlatform
)
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("QueueService")

class QueueService:
    """
    Queue Engine using Upstash Redis & Celery logic.
    Executes separate publish jobs per target social account with exponential backoff retries.
    """

    async def enqueue_post_publishing(self, db: Session, post_id: str):
        """Creates PublishJob records and executes them immediately."""
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.error(f"Post {post_id} not found for queueing.")
            return

        post.status = PostStatus.PUBLISHING
        db.commit()

        for target in post.targets:
            target.status = PostStatus.PUBLISHING
            
            # Check or create PublishJob
            job = db.query(PublishJob).filter(PublishJob.post_target_id == target.id).first()
            if not job:
                job = PublishJob(
                    post_target_id=target.id,
                    status=JobStatus.PENDING,
                    attempts=0,
                    max_attempts=5
                )
                db.add(job)
            else:
                job.status = JobStatus.PENDING
                job.attempts = 0
                job.last_error = None
            
            db.commit()
            db.refresh(job)

            # Execute job execution synchronously
            await self.process_publish_job(job.id)

    async def process_publish_job(self, job_id: str):
        """Executes publish job for a specific target with retry & exponential backoff."""
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            job = db.query(PublishJob).filter(PublishJob.id == job_id).first()
            if not job:
                return

            target = job.post_target
            account = target.social_account
            post = target.post

            job.status = JobStatus.PROCESSING
            job.attempts += 1
            db.commit()

            target_account_id = account.postforme_account_id or account.platform_account_id or account.id
            media_list = [{"url": u} for u in (post.media_urls or [])]

            try:
                logger.info(f"Publishing via PostForMe API targeting account @{account.username} ({account.platform.value})...")
                res = await postforme_service.create_post(
                    caption=post.caption or "",
                    social_accounts=[target_account_id],
                    media=media_list if media_list else None,
                    platform_configurations=post.platform_configurations,
                    scheduled_at=post.scheduled_at.isoformat() if post.scheduled_at else None,
                    external_id=post.id
                )

                platform_post_id = res.get("id") or f"pf_{account.platform.value}_{account.id}"

                # Success
                job.status = JobStatus.SUCCESS
                job.completed_at = datetime.utcnow()
                target.status = PostStatus.PUBLISHED
                target.platform_post_id = platform_post_id
                db.commit()

                # Update main post status if all targets completed
                self._update_parent_post_status(db, post.id)

            except Exception as e:
                err_msg = str(e)
                logger.error(f"Job {job_id} attempt {job.attempts} failed via PostForMe: {err_msg}")
                job.last_error = err_msg

                if job.attempts < job.max_attempts:
                    job.status = JobStatus.RETRYING
                    delay_seconds = 2 ** job.attempts * 5
                    job.next_retry_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
                    target.status = PostStatus.FAILED
                    target.error_message = f"Attempt {job.attempts} failed: {err_msg}. Retrying in {delay_seconds}s..."
                    db.commit()

                    await asyncio.sleep(delay_seconds)
                    await self.process_publish_job(job_id)
                else:
                    job.status = JobStatus.FAILED
                    target.status = PostStatus.FAILED
                    target.error_message = f"Failed after {job.attempts} attempts: {err_msg}"
                    db.commit()
                    self._update_parent_post_status(db, post.id)

        finally:
            db.close()

    def _update_parent_post_status(self, db: Session, post_id: str):
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return

        statuses = [t.status for t in post.targets]
        if any(s == PostStatus.PUBLISHED for s in statuses) or all(s == PostStatus.PUBLISHED for s in statuses):
            post.status = PostStatus.PUBLISHED
            post.published_at = datetime.utcnow()
        elif any(s == PostStatus.FAILED for s in statuses):
            post.status = PostStatus.FAILED
        db.commit()

queue_service = QueueService()
