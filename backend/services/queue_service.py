import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.models import (
    Post, PostTarget, PublishJob, PostStatus, JobStatus, AccountPlatform
)
from backend.services.meta_adapter import meta_adapter
from backend.services.instagrapi_service import instagrapi_service, SessionExpired

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

            raw_token = meta_adapter.decrypt_token(account.access_token_encrypted)

            try:
                if account.platform == AccountPlatform.INSTAGRAM_BUSINESS:
                    # Check if session cookie/settings JSON from instagrapi
                    if raw_token.startswith("{") or "authorization_data" in raw_token or "sessionid" in raw_token:
                        logger.info(f"Publishing to Instagram @{account.username} using Instagrapi Cookie...")
                        try:
                            session_settings = json.loads(raw_token)
                        except Exception:
                            session_settings = {"sessionid": raw_token}

                        first_media = post.media_urls[0] if post.media_urls else ""
                        is_video = post.post_type.value == "video" or first_media.endswith(".mp4")
                        
                        res = await instagrapi_service.publish_post(
                            session_settings=session_settings,
                            media_urls=post.media_urls or [],
                            caption=post.caption or "",
                            is_video=is_video
                        )
                        platform_post_id = res.get("id") or f"ig_cookie_{account.platform_account_id}"
                    else:
                        platform_post_id = await meta_adapter.publish_to_instagram(
                            ig_user_id=account.platform_account_id,
                            access_token=raw_token,
                            media_urls=post.media_urls or [],
                            caption=post.caption or "",
                            post_type=post.post_type.value
                        )
                else: # FACEBOOK_PAGE
                    platform_post_id = await meta_adapter.publish_to_facebook(
                        page_id=account.platform_account_id,
                        page_access_token=raw_token,
                        message=post.caption or "",
                        media_urls=post.media_urls or []
                    )

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
                # Detect expired/revoked Instagram session — no point retrying, mark account for reconnect
                is_login_required = (
                    "login_required" in err_msg.lower()
                    or "LoginRequired" in err_msg
                    or isinstance(e, SessionExpired)
                )

                if is_login_required:
                    logger.error(f"Job {job_id}: Instagram session EXPIRED for @{account.username}. Marking account as need_reconnect.")
                    # Update account status to need_reconnect in DB
                    account.status = __import__("backend.models.models", fromlist=["AccountStatus"]).AccountStatus.NEED_RECONNECT
                    job.status = JobStatus.FAILED
                    job.last_error = f"Session expired — please reconnect @{account.username} with a fresh Instagram sessionid cookie."
                    target.status = PostStatus.FAILED
                    target.error_message = "Instagram session expired. Please reconnect the account via Accounts page."
                    db.commit()
                    self._update_parent_post_status(db, post.id)
                    return

                logger.error(f"Job {job_id} attempt {job.attempts} failed: {err_msg}")
                job.last_error = err_msg

                if job.attempts < job.max_attempts:
                    job.status = JobStatus.RETRYING
                    # Exponential backoff (e.g. 5s, 10s, 20s, 40s)
                    delay_seconds = 2 ** job.attempts * 5
                    job.next_retry_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
                    target.status = PostStatus.FAILED
                    target.error_message = f"Attempt {job.attempts} failed: {err_msg}. Retrying in {delay_seconds}s..."
                    db.commit()

                    # Schedule retry
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
