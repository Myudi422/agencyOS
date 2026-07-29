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

        # Keep SCHEDULED status if post is scheduled, otherwise mark as PUBLISHING
        is_scheduled = post.scheduled_at is not None or post.status == PostStatus.SCHEDULED
        initial_target_status = PostStatus.SCHEDULED if is_scheduled else PostStatus.PUBLISHING
        post.status = initial_target_status
        db.commit()

        for target in post.targets:
            target.status = initial_target_status

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

            # Format SocialPostMediaDto (URL, thumbnail_url, thumbnail_timestamp_ms)
            media_list = []
            media_thumbs = (post.platform_configurations or {}).get("media_thumbnails") or {}
            for idx, u in enumerate(post.media_urls or []):
                item: Dict[str, Any] = {"url": u}
                thumb_info = media_thumbs.get(str(idx)) or media_thumbs.get("0")
                if thumb_info:
                    if thumb_info.get("thumbnail_url"):
                        item["thumbnail_url"] = thumb_info["thumbnail_url"]
                    if thumb_info.get("thumbnail_timestamp_ms") is not None:
                        try:
                            item["thumbnail_timestamp_ms"] = int(thumb_info["thumbnail_timestamp_ms"])
                        except (ValueError, TypeError):
                            pass
                media_list.append(item)

            # Strip internal-only keys from platform_configurations before sending to PostForMe API
            raw_configs = post.platform_configurations or {}
            pf_platform_configs: Dict[str, Any] = {}
            INTERNAL_ONLY_KEYS = {"media_thumbnails"}
            for platform_key, platform_val in raw_configs.items():
                if platform_key in INTERNAL_ONLY_KEYS:
                    continue
                if not isinstance(platform_val, dict):
                    continue
                # Remove None values at top-level to keep payload clean
                cleaned = {k: v for k, v in platform_val.items() if v is not None}
                if cleaned:
                    pf_platform_configs[platform_key] = cleaned

            try:
                logger.info(f"Publishing via PostForMe API targeting account @{account.username} ({account.platform.value})...")
                res = await postforme_service.create_post(
                    caption=post.caption or "",
                    social_accounts=[target_account_id],
                    media=media_list if media_list else None,
                    platform_configurations=pf_platform_configs if pf_platform_configs else None,
                    scheduled_at=post.scheduled_at.isoformat() if post.scheduled_at else None,
                    external_id=post.id
                )

                postforme_post_id = res.get("id") or f"pf_{account.platform.value}_{account.id}"

                # ⭐ COMMIT PENTING: Simpan platform_post_id & status SUCCESS ke DB SEGERA!
                target.platform_post_id = postforme_post_id
                post.postforme_post_id = postforme_post_id
                job.status = JobStatus.SUCCESS
                job.completed_at = datetime.utcnow()

                if post.scheduled_at:
                    target.status = PostStatus.SCHEDULED
                    post.status = PostStatus.SCHEDULED

                self._update_parent_post_status(db, post.id)
                db.commit()  # <-- TERPERCAYA: Disimpan ke database sekarang!
                logger.info(f"✅ Job {job_id} sent to PostForMe. postforme_post_id={postforme_post_id}")

                # Jika dipublish sekarang (bukan terjadwal), coba sync hasilnya beberapa kali
                if not post.scheduled_at:
                    # Coba sync pada detik 3, 8, dan 15 untuk memberikan waktu bagi PostForMe memproses
                    for delay in [3, 5, 7]:
                        await asyncio.sleep(delay)
                        synced = await self.sync_post_result_for_target(db, target.id, postforme_post_id)
                        if synced:
                            break  # Berhasil dapat hasil, tidak perlu retry sleep lagi

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

    async def sync_post_result_for_target(self, db: Session, target_id: str, postforme_post_id: str, source: str = "sync") -> bool:
        """
        Sinkronisasi hasil publish dari PostForMe untuk satu target.
        Mengambil data dari /v1/social-post-results, update status, dan deduct kredit jika sukses.
        Returns True jika ada hasil yang diproses, False jika belum ada.
        """
        target = db.query(PostTarget).filter(PostTarget.id == target_id).first()
        if not target:
            logger.warning(f"PostTarget {target_id} not found for sync.")
            return False

        post = target.post

        try:
            # Ambil hasil dari PostForMe tanpa filter social_account_id agar pasti dapat
            results = await postforme_service.get_post_results(
                post_id=[postforme_post_id]
            )

            result_list = results.get("data", [])
            if not result_list:
                logger.info(f"No results yet from PostForMe for post {postforme_post_id}.")
                return False

            processed_any = False
            for result_data in result_list:
                pf_result_id = result_data.get("id")

                # Skip if no valid result ID — cannot safely deduplicate
                if not pf_result_id:
                    logger.warning(f"Skipping result with no id for target {target_id}")
                    continue

                existing = db.query(PostPublishResult).filter(
                    PostPublishResult.post_target_id == target_id,
                    PostPublishResult.postforme_result_id == pf_result_id
                ).first()

                success = result_data.get("success", False)
                platform_data = result_data.get("platform_data") or {}
                platform_url = platform_data.get("url")
                platform_post_id = platform_data.get("id")

                if not existing:
                    publish_result = PostPublishResult(
                        post_target_id=target_id,
                        postforme_result_id=pf_result_id,
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
                    db.flush()
                    logger.info(f"✅ New PostPublishResult created for target {target_id}, result_id={pf_result_id}")
                else:
                    publish_result = existing
                    # Update existing record if we now have better data (e.g. platform_url was missing)
                    if platform_url and not existing.platform_url:
                        existing.platform_url = platform_url
                        logger.info(f"Updated platform_url for existing result {pf_result_id}")
                    if platform_post_id and not existing.platform_post_id:
                        existing.platform_post_id = platform_post_id
                    if success and existing.success is False:
                        existing.success = True
                        existing.error_data = None

                if success:
                    target.status = PostStatus.PUBLISHED
                    target.platform_post_id = platform_post_id or target.platform_post_id
                    target.error_message = None

                    # ⭐ DEDUCT KREDIT — hanya saat PostForMe konfirmasi sukses
                    self._deduct_user_credit(db, post, publish_result)
                    logger.info(f"✅ Target {target_id} published successfully. URL: {platform_url}")
                else:
                    error_info = result_data.get("error") or {}
                    target.status = PostStatus.FAILED
                    target.error_message = str(error_info) if error_info else "PostForMe reported failure"
                    logger.warning(f"❌ Target {target_id} failed. Error: {error_info}")

                db.commit()
                processed_any = True

            self._update_parent_post_status(db, post.id)
            return processed_any

        except Exception as e:
            logger.error(f"Error syncing PostForMe results for target {target_id}: {e}")
            return False

    def _deduct_user_credit(self, db: Session, post: Post, publish_result: PostPublishResult):
        """
        Kurangi 1 kredit dari user yang membuat post setelah PostForMe konfirmasi sukses.
        Dicegah double-deduction dengan flag credit_deducted.
        """
        if publish_result.credit_deducted:
            return

        user_id = post.created_by_user_id
        if not user_id:
            # Fallback: ambil user pertama di workspace
            from backend.models.models import WorkspaceMember
            wm = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == post.workspace_id).first()
            if wm:
                user_id = wm.user_id

        if not user_id:
            logger.warning(f"Post {post.id} has no user_id to deduct credit.")
            return

        sub = db.query(UserSubscription).filter(
            UserSubscription.user_id == user_id
        ).first()

        if sub:
            sub.posts_used = (sub.posts_used or 0) + 1
            db.add(sub)
            publish_result.credit_deducted = True
            logger.info(f"💳 Deducted 1 credit from user {user_id}. Total used: {sub.posts_used}/{sub.posts_limit}")
        else:
            logger.warning(f"No subscription found for user {user_id}. Credit not deducted.")

    async def sync_all_publishing_posts(self, db: Session, workspace_id: str) -> Dict[str, Any]:
        """
        Sinkronisasi manual komprehensif:
        Ambil 100 hasil publikasi terbaru dari PostForMe API,
        cocokkan dengan target/post di database kita, update status dan buat riwayat.
        """
        synced = 0
        errors = 0

        try:
            # Fetch 100 latest results from PostForMe
            pf_results = await postforme_service.get_post_results(limit=100)
            data_list = pf_results.get("data", [])
            logger.info(f"Fetched {len(data_list)} results from PostForMe API for workspace sync.")

            for res_item in data_list:
                pf_post_id = res_item.get("post_id")
                pf_result_id = res_item.get("id")
                if not pf_post_id:
                    continue

                # Cari target di DB kita
                target = (
                    db.query(PostTarget)
                    .join(Post, PostTarget.post_id == Post.id)
                    .filter(
                        Post.workspace_id == workspace_id,
                        (PostTarget.platform_post_id == pf_post_id) | (Post.postforme_post_id == pf_post_id)
                    )
                    .first()
                )

                if not target:
                    # Fallback: cari post berdasarkan workspace_id yang statusnya PUBLISHING/FAILED
                    target = (
                        db.query(PostTarget)
                        .join(Post, PostTarget.post_id == Post.id)
                        .filter(
                            Post.workspace_id == workspace_id,
                            PostTarget.status == PostStatus.PUBLISHING
                        )
                        .order_by(PostTarget.created_at.desc())
                        .first()
                    )
                    if target and not target.platform_post_id:
                        target.platform_post_id = pf_post_id
                        target.post.postforme_post_id = pf_post_id
                        db.commit()

                if target:
                    try:
                        await self._apply_result_to_target(db, target, res_item, source="manual_sync")
                        synced += 1
                    except Exception as e:
                        errors += 1
                        logger.error(f"Error applying result {pf_result_id} to target {target.id}: {e}")

            # Pastikan semua job yang targetnya sudah PUBLISHED/FAILED diupdate status job-nya
            publishing_jobs = (
                db.query(PublishJob)
                .join(PostTarget, PublishJob.post_target_id == PostTarget.id)
                .join(Post, PostTarget.post_id == Post.id)
                .filter(
                    Post.workspace_id == workspace_id,
                    PublishJob.status == JobStatus.PROCESSING
                )
                .all()
            )
            for j in publishing_jobs:
                if j.post_target.status in (PostStatus.PUBLISHED, PostStatus.FAILED):
                    j.status = JobStatus.SUCCESS if j.post_target.status == PostStatus.PUBLISHED else JobStatus.FAILED
                    j.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            logger.error(f"Error in sync_all_publishing_posts: {e}", exc_info=True)

        return {"synced": synced, "errors": errors}

    async def _apply_result_to_target(self, db: Session, target: PostTarget, res_item: dict, source: str = "sync"):
        """Applies a single PostForMe result to a PostTarget and creates PostPublishResult."""
        post = target.post
        pf_result_id = res_item.get("id")
        pf_post_id = res_item.get("post_id")
        success = res_item.get("success", False)
        platform_data = res_item.get("platform_data") or {}
        platform_url = platform_data.get("url")
        platform_post_id = platform_data.get("id")

        if not pf_result_id:
            logger.warning(f"Skipping _apply_result_to_target for target {target.id}: no postforme result id")
            return

        existing = db.query(PostPublishResult).filter(
            PostPublishResult.post_target_id == target.id,
            PostPublishResult.postforme_result_id == pf_result_id
        ).first()

        if not existing:
            publish_result = PostPublishResult(
                post_target_id=target.id,
                postforme_result_id=pf_result_id,
                postforme_post_id=pf_post_id,
                social_account_id=res_item.get("social_account_id"),
                success=success,
                platform_url=platform_url,
                platform_post_id=platform_post_id,
                error_data=res_item.get("error"),
                raw_result=res_item,
                credit_deducted=False,
                source=source
            )
            db.add(publish_result)
            db.flush()
        else:
            publish_result = existing
            # Update existing record with newer platform data
            if platform_url and not existing.platform_url:
                existing.platform_url = platform_url
            if platform_post_id and not existing.platform_post_id:
                existing.platform_post_id = platform_post_id
            if success and existing.success is False:
                existing.success = True
                existing.error_data = None

        if success:
            target.status = PostStatus.PUBLISHED
            target.platform_post_id = platform_post_id or target.platform_post_id or pf_post_id
            target.error_message = None
            self._deduct_user_credit(db, post, publish_result)
        else:
            error_info = res_item.get("error") or {}
            target.status = PostStatus.FAILED
            target.error_message = str(error_info) if error_info else "PostForMe reported failure"

        # Simpan job status juga
        job = db.query(PublishJob).filter(PublishJob.post_target_id == target.id).first()
        if job:
            job.status = JobStatus.SUCCESS if success else JobStatus.FAILED
            job.completed_at = datetime.utcnow()

        db.commit()
        self._update_parent_post_status(db, post.id)

    def _update_parent_post_status(self, db: Session, post_id: str):
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return

        statuses = [t.status for t in post.targets]
        if not statuses:
            return

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
        elif any(s == PostStatus.SCHEDULED for s in statuses) or all(s == PostStatus.SCHEDULED for s in statuses):
            post.status = PostStatus.SCHEDULED
        elif any(s == PostStatus.DRAFT for s in statuses):
            post.status = PostStatus.DRAFT
        db.commit()

queue_service = QueueService()
