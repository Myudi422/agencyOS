import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models.models import (
    Post, PostTarget, PublishJob, PostPublishResult,
    PostStatus, JobStatus, User, UserSubscription
)
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("QueueService")

class QueueService:
    """
    Queue Engine menggunakan background tasks FastAPI.
    Mengelola publish job per target social account dengan exponential backoff retries.
    Kredit user HANYA dikurangi setelah PostForMe mengkonfirmasi keberhasilan.
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

            # Execute job synchronously
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

                # Simpan PostForMe post ID ke PostTarget untuk sinkronisasi hasil nanti
                postforme_post_id = res.get("id") or f"pf_{account.platform.value}_{account.id}"
                target.platform_post_id = postforme_post_id
                post.postforme_post_id = postforme_post_id  # update juga di post utama

                # Job berhasil dikirim ke PostForMe — tapi belum tentu dipublish di platform
                # Status tetap PUBLISHING sampai sync_post_results konfirmasi
                job.status = JobStatus.SUCCESS
                job.completed_at = datetime.utcnow()

                # Untuk post yang dipublish sekarang (bukan terjadwal), langsung cek hasilnya
                if not post.scheduled_at:
                    # Tunggu sebentar agar PostForMe memproses, lalu ambil hasil
                    await asyncio.sleep(5)
                    await self.sync_post_result_for_target(db, target.id, postforme_post_id)
                else:
                    # Post terjadwal: tandai sebagai SCHEDULED, sync nanti via webhook/manual
                    target.status = PostStatus.SCHEDULED
                    db.commit()

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

    async def sync_post_result_for_target(self, db: Session, target_id: str, postforme_post_id: str, source: str = "sync"):
        """
        Sinkronisasi hasil publish dari PostForMe untuk satu target.
        Mengambil data dari /v1/social-post-results, update status, dan deduct kredit jika sukses.
        """
        target = db.query(PostTarget).filter(PostTarget.id == target_id).first()
        if not target:
            logger.warning(f"PostTarget {target_id} not found for sync.")
            return

        post = target.post
        account = target.social_account

        try:
            postforme_account_id = account.postforme_account_id if account else None
            results = await postforme_service.get_post_results(
                post_id=[postforme_post_id],
                social_account_id=[postforme_account_id] if postforme_account_id else None
            )

            result_list = results.get("data", [])
            if not result_list:
                logger.info(f"No results yet from PostForMe for post {postforme_post_id}. Will retry on next sync.")
                return

            for result_data in result_list:
                # Cek apakah sudah ada record hasil untuk target ini
                existing = db.query(PostPublishResult).filter(
                    PostPublishResult.post_target_id == target_id,
                    PostPublishResult.postforme_result_id == result_data.get("id")
                ).first()

                if existing:
                    continue  # Sudah diproses sebelumnya

                success = result_data.get("success", False)
                platform_data = result_data.get("platform_data") or {}
                platform_url = platform_data.get("url")
                platform_post_id = platform_data.get("id")

                # Simpan hasil ke database
                publish_result = PostPublishResult(
                    post_target_id=target_id,
                    postforme_result_id=result_data.get("id"),
                    postforme_post_id=postforme_post_id,
                    social_account_id=result_data.get("social_account_id"),
                    success=success,
                    platform_url=platform_url,
                    platform_post_id=platform_post_id,
                    error_data=result_data.get("error"),
                    raw_result=result_data,
                    credit_deducted=False,
                    source=source
                )
                db.add(publish_result)

                if success:
                    # Update target status ke PUBLISHED
                    target.status = PostStatus.PUBLISHED
                    target.platform_post_id = platform_post_id or target.platform_post_id
                    target.error_message = None

                    # ⭐ DEDUCT KREDIT — hanya saat PostForMe konfirmasi sukses
                    self._deduct_user_credit(db, post, publish_result)

                    logger.info(f"✅ Target {target_id} published successfully. URL: {platform_url}")
                else:
                    # Update target status ke FAILED
                    error_info = result_data.get("error") or {}
                    target.status = PostStatus.FAILED
                    target.error_message = str(error_info) if error_info else "PostForMe reported failure"
                    logger.warning(f"❌ Target {target_id} failed. Error: {error_info}")

                db.commit()

            # Update status post utama
            self._update_parent_post_status(db, post.id)

        except Exception as e:
            logger.error(f"Error syncing PostForMe results for target {target_id}: {e}")

    def _deduct_user_credit(self, db: Session, post: Post, publish_result: PostPublishResult):
        """
        Kurangi 1 kredit dari user yang membuat post setelah PostForMe konfirmasi sukses.
        Dicegah double-deduction dengan flag credit_deducted.
        """
        if publish_result.credit_deducted:
            return

        if not post.created_by_user_id:
            logger.warning(f"Post {post.id} has no created_by_user_id. Cannot deduct credit.")
            return

        sub = db.query(UserSubscription).filter(
            UserSubscription.user_id == post.created_by_user_id
        ).first()

        if sub:
            sub.posts_used = (sub.posts_used or 0) + 1
            db.add(sub)
            publish_result.credit_deducted = True
            logger.info(f"💳 Deducted 1 credit from user {post.created_by_user_id}. Total used: {sub.posts_used}/{sub.posts_limit}")
        else:
            logger.warning(f"No subscription found for user {post.created_by_user_id}. Credit not deducted.")

    async def sync_all_publishing_posts(self, db: Session, workspace_id: str) -> Dict[str, Any]:
        """
        Sinkronisasi manual semua post yang masih dalam status PUBLISHING untuk sebuah workspace.
        Dipanggil dari endpoint /queue/sync-results.
        """
        from sqlalchemy import or_
        publishing_targets = (
            db.query(PostTarget)
            .join(Post, PostTarget.post_id == Post.id)
            .filter(
                Post.workspace_id == workspace_id,
                PostTarget.status == PostStatus.PUBLISHING
            )
            .all()
        )

        synced = 0
        errors = 0
        for target in publishing_targets:
            if target.platform_post_id:
                try:
                    await self.sync_post_result_for_target(db, target.id, target.platform_post_id, source="manual_sync")
                    synced += 1
                except Exception as e:
                    errors += 1
                    logger.error(f"Error syncing target {target.id}: {e}")

        return {"synced": synced, "errors": errors, "total": len(publishing_targets)}

    def _update_parent_post_status(self, db: Session, post_id: str):
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return

        statuses = [t.status for t in post.targets]
        if all(s == PostStatus.PUBLISHED for s in statuses):
            post.status = PostStatus.PUBLISHED
            post.published_at = datetime.utcnow()
        elif any(s == PostStatus.PUBLISHED for s in statuses):
            post.status = PostStatus.PUBLISHED
            post.published_at = datetime.utcnow()
        elif any(s == PostStatus.FAILED for s in statuses):
            post.status = PostStatus.FAILED
        elif any(s == PostStatus.PUBLISHING for s in statuses):
            post.status = PostStatus.PUBLISHING
        db.commit()

queue_service = QueueService()
