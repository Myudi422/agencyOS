"""
Webhook handler untuk menerima event dari PostForMe API.
PostForMe mengirim POST request ke endpoint ini saat event terjadi.

Webhook URL yang harus didaftarkan ke PostForMe:
    https://shiera.web.id/api/backend/webhook/postforme

Event yang dihandle:
    - social.post.result.created  → update status publish & deduct kredit
    - social.post.updated         → update metadata post
"""
import logging
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.config import settings
from backend.models.models import Post, PostTarget, PostPublishResult, PostStatus, User
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("WebhookRouter")

router = APIRouter(prefix="/webhook", tags=["Webhooks"])


def _verify_webhook_secret(request_secret: str) -> bool:
    """
    Verifikasi bahwa request berasal dari PostForMe menggunakan secret di header.
    Header: Post-For-Me-Webhook-Secret
    Fail-closed: jika secret belum dikonfigurasi, tolak semua request.
    """
    configured_secret = settings.POSTFORME_WEBHOOK_SECRET
    if not configured_secret:
        # Fail-closed: tolak semua webhook jika secret belum dikonfigurasi
        logger.error("POSTFORME_WEBHOOK_SECRET tidak dikonfigurasi. Menolak semua webhook request.")
        return False
    return hmac.compare_digest(configured_secret, request_secret)


async def _process_post_result_event(data: dict, source: str = "webhook"):
    """
    Background task: Proses event social.post.result.created.
    Update status PostTarget dan deduct kredit user jika sukses.
    """
    from backend.database import SessionLocal
    from backend.models.models import UserSubscription
    db = SessionLocal()
    try:
        postforme_result_id = data.get("id")
        postforme_post_id = data.get("post_id")
        success = data.get("success", False)
        social_account_id = data.get("social_account_id")
        platform_data = data.get("platform_data") or {}
        platform_url = platform_data.get("url")
        platform_post_id_from_result = platform_data.get("id")

        if not postforme_post_id:
            logger.warning(f"Webhook payload missing post_id. Data: {data}")
            return

        # Cari PostTarget berdasarkan postforme_post_id
        target = (
            db.query(PostTarget)
            .join(Post, PostTarget.post_id == Post.id)
            .filter(
                (PostTarget.platform_post_id == postforme_post_id) | (Post.postforme_post_id == postforme_post_id)
            )
            .first()
        )

        if not target and social_account_id:
            # Fallback 1: match via PostForMe social_account_id & status PUBLISHING
            from backend.models.models import SocialAccount
            target = (
                db.query(PostTarget)
                .join(SocialAccount, PostTarget.social_account_id == SocialAccount.id)
                .filter(
                    SocialAccount.postforme_account_id == social_account_id,
                    PostTarget.status == PostStatus.PUBLISHING
                )
                .order_by(PostTarget.created_at.desc())
                .first()
            )

        if not target:
            # Fallback 2: grab most recent target in PUBLISHING status
            target = (
                db.query(PostTarget)
                .filter(PostTarget.status == PostStatus.PUBLISHING)
                .order_by(PostTarget.created_at.desc())
                .first()
            )

        if target and not target.platform_post_id:
            target.platform_post_id = postforme_post_id
            if target.post:
                target.post.postforme_post_id = postforme_post_id

        if not target:
            logger.warning(f"Tidak bisa menemukan PostTarget untuk postforme_post_id={postforme_post_id}.")
            return

        # Cek apakah result ini sudah diproses
        existing = db.query(PostPublishResult).filter(
            PostPublishResult.postforme_result_id == postforme_result_id
        ).first()
        if existing:
            logger.info(f"Webhook result {postforme_result_id} sudah diproses sebelumnya. Skip.")
            return

        post = target.post

        # Simpan hasil ke PostPublishResult
        publish_result = PostPublishResult(
            post_target_id=target.id,
            postforme_result_id=postforme_result_id,
            postforme_post_id=postforme_post_id,
            social_account_id=social_account_id,
            success=success,
            platform_url=platform_url,
            platform_post_id=platform_post_id_from_result,
            error_data=data.get("error"),
            raw_result=data,
            credit_deducted=False,
            source=source
        )
        db.add(publish_result)

        if success:
            target.status = PostStatus.PUBLISHED
            target.platform_post_id = platform_post_id_from_result or target.platform_post_id or postforme_post_id
            target.error_message = None
            logger.info(f"✅ Webhook: PostTarget {target.id} published. URL: {platform_url}")

            # ⭐ Deduct kredit — hanya setelah PostForMe konfirmasi sukses
            user_id = post.created_by_user_id if post else None
            if not user_id and post:
                from backend.models.models import WorkspaceMember
                wm = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == post.workspace_id).first()
                if wm:
                    user_id = wm.user_id

            if user_id:
                sub = db.query(UserSubscription).filter(
                    UserSubscription.user_id == user_id
                ).first()
                if sub:
                    sub.posts_used = (sub.posts_used or 0) + 1
                    db.add(sub)
                    publish_result.credit_deducted = True
                    logger.info(f"💳 Webhook deduct 1 kredit dari user {user_id}. Total used: {sub.posts_used}/{sub.posts_limit}")
        else:
            error_info = data.get("error") or {}
            target.status = PostStatus.FAILED
            target.error_message = str(error_info) if error_info else "PostForMe reported failure via webhook"
            logger.warning(f"❌ Webhook: PostTarget {target.id} gagal. Error: {error_info}")

        # Update PublishJob status
        from backend.models.models import PublishJob, JobStatus
        job = db.query(PublishJob).filter(PublishJob.post_target_id == target.id).first()
        if job:
            job.status = JobStatus.SUCCESS if success else JobStatus.FAILED
            job.completed_at = __import__("datetime").datetime.utcnow()

        db.commit()

        # Update status post utama
        if post:
            statuses = [t.status for t in post.targets]
            if all(s == PostStatus.PUBLISHED for s in statuses):
                post.status = PostStatus.PUBLISHED
                post.published_at = post.published_at or __import__("datetime").datetime.utcnow()
            elif any(s == PostStatus.PUBLISHED for s in statuses):
                post.status = PostStatus.PUBLISHED
                post.published_at = post.published_at or __import__("datetime").datetime.utcnow()
            elif any(s == PostStatus.FAILED for s in statuses):
                post.status = PostStatus.FAILED
            db.commit()

    except Exception as e:
        logger.error(f"Error processing webhook event: {e}", exc_info=True)
    finally:
        db.close()


@router.post("/postforme")
async def postforme_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Menerima event dari PostForMe API.
    
    PostForMe mengirim POST request dengan:
    - Header: Post-For-Me-Webhook-Secret: <secret>
    - Body: { "event_type": "...", "data": {...} }
    """
    # Verifikasi secret dari header
    received_secret = request.headers.get("Post-For-Me-Webhook-Secret", "")
    if not _verify_webhook_secret(received_secret):
        logger.warning("Webhook received with invalid secret. Rejecting.")
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event_type", "")
    data = payload.get("data", {})

    logger.info(f"📨 PostForMe webhook received: event_type={event_type}")

    if event_type == "social.post.result.created":
        background_tasks.add_task(_process_post_result_event, data, "webhook")
    elif event_type == "social.post.updated":
        logger.info(f"social.post.updated event received for post_id={data.get('id')}. Logged.")
    else:
        logger.info(f"Unhandled webhook event_type: {event_type}")

    # Selalu kembalikan 200 agar PostForMe tidak retry
    return {"received": True, "event_type": event_type}


@router.post("/setup")
async def setup_postforme_webhook(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    from backend.routers.admin import require_admin
    require_admin(authorization=authorization, db=db)
    """
    Setup / daftarkan webhook ke PostForMe secara otomatis.
    Panggil endpoint ini sekali setelah deploy untuk mendaftarkan webhook URL.
    Simpan 'secret' dari response ke POSTFORME_WEBHOOK_SECRET di .env.
    """
    webhook_url = settings.POSTFORME_WEBHOOK_URL
    try:
        result = await postforme_service.ensure_webhook_registered(webhook_url)
        if result:
            secret = result.get("secret", "")
            return {
                "status": "success",
                "webhook_id": result.get("id"),
                "webhook_url": result.get("url"),
                "event_types": result.get("event_types", []),
                "secret": secret,
                "next_step": f"Simpan secret ini ke POSTFORME_WEBHOOK_SECRET di .env backend Anda: {secret}"
            }
        return {"status": "failed", "message": "Gagal mendaftarkan webhook"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_postforme_webhooks(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Tampilkan semua webhook yang terdaftar di PostForMe. Admin only."""
    from backend.routers.admin import require_admin
    require_admin(authorization=authorization, db=db)
    try:
        result = await postforme_service.list_webhooks()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
