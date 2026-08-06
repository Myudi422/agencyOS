import logging
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.database import get_db
from backend.models.models import Post, PostTarget, SocialAccount, PostType, PostStatus, ActivityLog, UserSubscription
from backend.services.queue_service import queue_service
from backend.services.postforme_service import postforme_service
from backend.security import sanitize_payload, sanitize_text

logger = logging.getLogger("PostsRouter")

router = APIRouter(prefix="/posts", tags=["Posts"])

class UploadUrlRequest(BaseModel):
    content_type: str = "image/jpeg"

@router.post("/media/create-upload-url")
async def create_media_upload_url(data: UploadUrlRequest):
    """
    Requests a signed upload URL from PostForMe API (/v1/media/create-upload-url).
    Returns { media_url, upload_url }.
    """
    try:
        content_type = sanitize_text(data.content_type, max_length=120, allow_newlines=False) or "image/jpeg"
        if "/" not in content_type:
            raise HTTPException(status_code=400, detail="content_type is invalid")
        res = await postforme_service.create_upload_url(content_type=content_type)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PostCreate(BaseModel):
    workspace_id: str
    client_id: Optional[str] = None
    account_ids: Optional[List[str]] = None # List of selected target social account IDs
    target_account_ids: Optional[List[str]] = None # Alias field support
    post_type: str = "image" # image, carousel, video
    caption: Optional[str] = ""
    hashtags: Optional[str] = ""
    ai_brief: Optional[str] = None # Briefing AI text
    first_comment: Optional[str] = ""
    location: Optional[str] = ""
    alt_text: Optional[str] = ""
    media_urls: List[str] = []
    platform_configurations: Optional[Dict[str, Any]] = None # PostForMe platform configs
    scheduled_at: Optional[str] = None # ISO format string
    action: Optional[str] = "publish_now" # publish_now, schedule, save_draft
    publish_now: Optional[bool] = None
    apply_watermark: Optional[bool] = False

class PostUpdate(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    ai_brief: Optional[str] = None
    first_comment: Optional[str] = None
    location: Optional[str] = None
    alt_text: Optional[str] = None
    media_urls: Optional[List[str]] = None
    platform_configurations: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[str] = None
    status: Optional[str] = None  # Allow frontend to update status (draft, scheduled, etc.)
    account_ids: Optional[List[str]] = None
    target_account_ids: Optional[List[str]] = None
    action: Optional[str] = None
    publish_now: Optional[bool] = None
    apply_watermark: Optional[bool] = None

class PostPatch(BaseModel):
    """Partial update payload from frontend queue manager."""
    caption: Optional[str] = None
    ai_brief: Optional[str] = None
    content: Optional[Dict[str, Any]] = None  # Frontend sends { text: str }
    scheduled_at: Optional[str] = None
    status: Optional[str] = None

# ─── Status alias mapping: frontend uses processing/processed, DB uses publishing/published ───
STATUS_ALIAS_TO_DB: Dict[str, str] = {
    "processing": "publishing",
    "processed": "published",
    "draft": "draft",
    "scheduled": "scheduled",
}
STATUS_DB_TO_ALIAS: Dict[str, str] = {
    "publishing": "processing",
    "published": "processed",
    "draft": "draft",
    "scheduled": "scheduled",
    "failed": "failed",
    "cancelled": "cancelled",
}


def _sanitize_post_payload(data: PostCreate | PostUpdate) -> Dict[str, Any]:
    payload = data.dict(exclude_unset=True)
    sanitized = sanitize_payload(payload, max_length=4000, allow_newlines=True)

    for field in ("caption", "hashtags", "ai_brief", "first_comment", "location", "alt_text"):
        if field in sanitized and sanitized[field] is not None:
            val = sanitize_text(sanitized[field], max_length=2200, allow_newlines=True)
            if isinstance(val, str):
                val = val.replace("\\n", "\n")
            sanitized[field] = val

    if "workspace_id" in sanitized:
        sanitized["workspace_id"] = sanitize_text(sanitized["workspace_id"], max_length=120)
    if "client_id" in sanitized and sanitized["client_id"] is not None:
        sanitized["client_id"] = sanitize_text(sanitized["client_id"], max_length=120)
    if "post_type" in sanitized:
        sanitized["post_type"] = sanitize_text(sanitized["post_type"], max_length=24)
    if "action" in sanitized and sanitized["action"] is not None:
        sanitized["action"] = sanitize_text(sanitized["action"], max_length=24)
    if "media_urls" in sanitized and isinstance(sanitized["media_urls"], list):
        sanitized["media_urls"] = [sanitize_text(url, max_length=2048) for url in sanitized["media_urls"][:20]]
    if "account_ids" in sanitized and isinstance(sanitized["account_ids"], list):
        sanitized["account_ids"] = [sanitize_text(acc_id, max_length=120) for acc_id in sanitized["account_ids"][:50]]
    if "target_account_ids" in sanitized and isinstance(sanitized["target_account_ids"], list):
        sanitized["target_account_ids"] = [sanitize_text(acc_id, max_length=120) for acc_id in sanitized["target_account_ids"][:50]]
    if "platform_configurations" in sanitized and isinstance(sanitized["platform_configurations"], dict):
        sanitized["platform_configurations"] = sanitize_payload(sanitized["platform_configurations"], max_length=2000)

    return sanitized


@router.get("/")
async def get_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="draft, scheduled, processing, processed"),
    client_id: Optional[str] = Query(None, description="Client filter"),
    search: Optional[str] = Query(None, description="Search in caption"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Hybrid endpoint: 
    - Fetches ACTIVE posts (scheduled/processing/processed) directly from PostForMe (source of truth).
    - Local DB draft posts (no postforme_post_id) are merged in.
    - Search and status filtering applied after merge.
    """
    results = []

    # ─── 1. Load LOCAL posts for this workspace ────────────────────────────
    local_query = db.query(Post).filter(Post.workspace_id == workspace_id)
    if client_id:
        local_query = local_query.filter(Post.client_id == client_id)
    local_posts = local_query.order_by(Post.created_at.desc()).all()

    # ─── 2. Fetch from PostForMe API (live status source) ─────────────────
    pf_posts_by_id: Dict[str, Dict[str, Any]] = {}
    try:
        pf_status_filter = None
        if status and status in ("draft", "scheduled", "processing", "processed"):
            pf_status_filter = [status]

        pf_response = await postforme_service.get_posts(
            limit=min(limit * 3, 100),
            status=pf_status_filter
        )
        pf_data = pf_response.get("data", [])
        for pf_item in pf_data:
            if pf_item.get("id"):
                pf_posts_by_id[pf_item["id"]] = pf_item
    except Exception as e:
        logger.warning(f"PostForMe fetch failed, falling back to local DB: {e}")

    # ─── 3. Build unified results starting from ALL local posts ───────────
    processed_local_pf_ids = set()

    for p in local_posts:
        pf_post = pf_posts_by_id.get(p.postforme_post_id) if p.postforme_post_id else None
        if p.postforme_post_id:
            processed_local_pf_ids.add(p.postforme_post_id)

        # Status: PostForMe status takes precedence if available, otherwise map local DB status
        if pf_post and pf_post.get("status"):
            post_status = pf_post["status"]
        else:
            db_st = p.status.value if p.status else "draft"
            post_status = STATUS_DB_TO_ALIAS.get(db_st, db_st)

        targets = []
        platforms = []
        for t in p.targets:
            acc = t.social_account
            plat = acc.platform.value if acc else "unknown"
            if plat not in platforms:
                platforms.append(plat)
            targets.append({
                "target_id": t.id,
                "account_id": acc.id if acc else None,
                "platform": plat,
                "username": acc.username if acc else "deleted",
                "name": acc.name if acc else "Deleted Account",
                "avatar_url": acc.avatar_url if acc else None,
                "status": post_status,
                "platform_post_id": t.platform_post_id,
            })

        sched_at_val = (pf_post.get("scheduled_at") if pf_post else None) or (p.scheduled_at.isoformat() if p.scheduled_at else None)
        updated_at_val = (pf_post.get("updated_at") if pf_post else None) or (p.updated_at.isoformat() if p.updated_at else None)

        results.append({
            "id": p.id,
            "postforme_post_id": p.postforme_post_id,
            "workspace_id": p.workspace_id,
            "client_id": p.client_id,
            "post_type": p.post_type.value if p.post_type else "image",
            "content": {"text": p.caption or ""},
            "caption": p.caption,
            "hashtags": p.hashtags,
            "ai_brief": p.ai_brief,
            "media_urls": p.media_urls or [],
            "platform_configurations": p.platform_configurations,
            "platforms": platforms,
            "scheduled_at": sched_at_val,
            "published_at": p.published_at.isoformat() if p.published_at else None,
            "status": post_status,
            "targets": targets,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": updated_at_val,
            "_source": "hybrid",
        })

    # ─── 4. Filter & search on merged results ─────────────────────────────
    if status:
        results = [r for r in results if r["status"] == status]
    if search:
        sq = search.lower()
        results = [r for r in results if sq in (r.get("caption") or "").lower()]

    # Sort: most recently updated first
    results.sort(key=lambda r: r.get("updated_at") or r.get("created_at") or "", reverse=True)

    # Paginate
    total = len(results)
    paginated = results[offset: offset + limit]

    return {"data": paginated, "total": total, "limit": limit, "offset": offset}

from backend.routers.firebase_auth import require_user
from backend.models.models import User, UserSubscription

@router.post("/")
async def create_post(
    data: PostCreate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new post and generates publish jobs for each selected account.
    Supports Publish Now, Schedule, and Save Draft actions via PostForMe API.
    Enforces subscription plans and posts quota.
    """
    payload = _sanitize_post_payload(data)
    selected_account_ids = payload.get("account_ids") or payload.get("target_account_ids") or []
    action_type = payload.get("action") or ("publish_now" if payload.get("publish_now") else ("schedule" if payload.get("scheduled_at") else "save_draft"))

    if not selected_account_ids and action_type != "save_draft":
        raise HTTPException(status_code=400, detail="At least one target social account must be selected.")

    # Quota validation for non-admin users
    if not current_user.is_admin and action_type in ("publish_now", "schedule"):
        sub = current_user.subscription
        if not sub or sub.status not in ("active", "trial"):
            raise HTTPException(
                status_code=402, 
                detail="Anda tidak memiliki paket aktif. Silakan berlangganan terlebih dahulu."
            )
        if sub.expires_at and sub.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=402, 
                detail="Paket Anda telah kedaluwarsa. Silakan perpanjang paket Anda."
            )
        required_quota = len(selected_account_ids)
        if sub.posts_used + required_quota > sub.posts_limit:
            remaining = max(0, sub.posts_limit - sub.posts_used)
            raise HTTPException(
                status_code=402, 
                detail=f"Kuota post tidak mencukupi. Sisa kuota Anda adalah {remaining} post, sedangkan aksi ini membutuhkan {required_quota} post."
            )
        
        # CATATAN: Kredit (posts_used) TIDAK dikurangi di sini.
        # Kredit akan dikurangi oleh queue_service setelah PostForMe
        # mengkonfirmasi bahwa post berhasil dipublikasikan (success=true).
        # Ini mencegah pengguna kehilangan kredit untuk post yang gagal.

    # Parse scheduled_at if provided
    sched_dt = None
    scheduled_at = payload.get("scheduled_at")
    if scheduled_at:
        try:
            sched_dt = datetime.fromisoformat(str(scheduled_at).replace("Z", "+00:00"))
        except Exception:
            sched_dt = datetime.utcnow()

    # Determine status
    if action_type == "save_draft":
        initial_status = PostStatus.DRAFT
    elif action_type == "schedule":
        initial_status = PostStatus.SCHEDULED
    else:
        initial_status = PostStatus.PUBLISHING

    # Brief is only kept for draft or scheduled posts; clear if publishing now
    final_brief = None if action_type == "publish_now" else payload.get("ai_brief")

    platform_configs = payload.get("platform_configurations") or {}
    apply_watermark = payload.get("apply_watermark")
    if apply_watermark is not None:
        platform_configs["apply_watermark"] = apply_watermark

    post = Post(
        workspace_id=payload.get("workspace_id"),
        client_id=payload.get("client_id"),
        post_type=PostType(payload.get("post_type")) if payload.get("post_type") in [p.value for p in PostType] else PostType.IMAGE,
        caption=payload.get("caption"),
        hashtags=payload.get("hashtags"),
        ai_brief=final_brief,
        first_comment=payload.get("first_comment"),
        location=payload.get("location"),
        alt_text=payload.get("alt_text"),
        media_urls=payload.get("media_urls") or [],
        platform_configurations=platform_configs,
        scheduled_at=sched_dt,
        status=initial_status,
        created_by=current_user.full_name,
        created_by_user_id=current_user.id  # Simpan user_id untuk deduct kredit nanti
    )
    db.add(post)
    db.flush()

    # Create targets for each selected social account
    for acc_id in selected_account_ids:
        target = PostTarget(
            post_id=post.id,
            social_account_id=acc_id,
            status=initial_status
        )
        db.add(target)

    # Activity Log
    db.add(ActivityLog(
        workspace_id=payload.get("workspace_id"),
        action=f"CREATE_POST_{action_type.upper()}",
        details=f"Created post ({payload.get('post_type')}) targeting {len(selected_account_ids)} accounts.",
        entity_type="Post",
        entity_id=post.id
    ))

    db.commit()
    db.refresh(post)

    # Dispatch background queue task ONLY for publish_now or schedule (Drafts stay 100% local in Shiera DB)
    if action_type in ("publish_now", "schedule"):
        background_tasks.add_task(queue_service.enqueue_post_publishing, db, post.id)

    return {"status": "success", "post_id": post.id, "post_status": post.status.value}


@router.put("/{post_id}")
async def update_post(
    post_id: str,
    data: PostUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    payload = _sanitize_post_payload(data)
    selected_account_ids = payload.get("account_ids") or payload.get("target_account_ids")
    action_type = payload.get("action") or ("publish_now" if payload.get("publish_now") else ("schedule" if payload.get("scheduled_at") else None))

    if payload.get("caption") is not None:
        post.caption = payload.get("caption")
    if payload.get("hashtags") is not None:
        post.hashtags = payload.get("hashtags")
    if action_type == "publish_now":
        post.ai_brief = None
    elif payload.get("ai_brief") is not None:
        post.ai_brief = payload.get("ai_brief")
    if payload.get("first_comment") is not None:
        post.first_comment = payload.get("first_comment")
    if payload.get("location") is not None:
        post.location = payload.get("location")
    if payload.get("alt_text") is not None:
        post.alt_text = payload.get("alt_text")
    if payload.get("media_urls") is not None:
        post.media_urls = payload.get("media_urls")
    if payload.get("platform_configurations") is not None:
        post.platform_configurations = payload.get("platform_configurations")
    if payload.get("apply_watermark") is not None:
        configs = dict(post.platform_configurations or {})
        configs["apply_watermark"] = payload.get("apply_watermark")
        post.platform_configurations = configs
    if payload.get("scheduled_at") is not None:
        try:
            post.scheduled_at = datetime.fromisoformat(str(payload.get("scheduled_at")).replace("Z", "+00:00"))
        except Exception:
            post.scheduled_at = datetime.utcnow()

    # Update account targets if provided
    if selected_account_ids is not None and len(selected_account_ids) > 0:
        db.query(PostTarget).filter(PostTarget.post_id == post_id).delete()
        for acc_id in selected_account_ids:
            target = PostTarget(
                post_id=post.id,
                social_account_id=acc_id,
                status=post.status
            )
            db.add(target)

    # Determine status & action
    if action_type == "save_draft":
        post.status = PostStatus.DRAFT
    elif action_type == "schedule":
        post.status = PostStatus.SCHEDULED
    elif action_type == "publish_now":
        post.status = PostStatus.PUBLISHING
    elif payload.get("status") is not None:
        db_status = STATUS_ALIAS_TO_DB.get(str(payload.get("status")).lower(), str(payload.get("status")).lower())
        try:
            post.status = PostStatus(db_status)
        except ValueError:
            pass

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    # Trigger queue if publish_now or schedule
    if action_type in ("publish_now", "schedule"):
        background_tasks.add_task(queue_service.enqueue_post_publishing, db, post.id)

    return {
        "status": "success",
        "id": post.id,
        "post_status": STATUS_DB_TO_ALIAS.get(post.status.value, post.status.value),
        "caption": post.caption,
        "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }


@router.patch("/{post_id}")
def patch_post(post_id: str, data: PostPatch, db: Session = Depends(get_db)):
    """Partial update — used by frontend queue manager for draft edit & schedule."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Accept caption from flat field or from content.text
    if data.caption is not None:
        post.caption = sanitize_text(data.caption, max_length=2200, allow_newlines=True)
    elif data.content is not None and "text" in data.content:
        post.caption = sanitize_text(str(data.content["text"]), max_length=2200, allow_newlines=True)

    if data.ai_brief is not None:
        post.ai_brief = sanitize_text(data.ai_brief, max_length=2200, allow_newlines=True)

    if data.scheduled_at is not None:
        post.scheduled_at = datetime.fromisoformat(str(data.scheduled_at).replace("Z", "+00:00"))

    if data.status is not None:
        db_status = STATUS_ALIAS_TO_DB.get(str(data.status).lower(), str(data.status).lower())
        try:
            post.status = PostStatus(db_status)
        except ValueError:
            pass

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    return {
        "id": post.id,
        "status": STATUS_DB_TO_ALIAS.get(post.status.value, post.status.value),
        "caption": post.caption,
        "content": {"text": post.caption or ""},
        "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }

@router.delete("/{post_id}")
async def delete_post(post_id: str, db: Session = Depends(get_db)):
    """Delete post from local DB AND from PostForMe (if postforme_post_id exists)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    workspace_id = post.workspace_id
    pf_id = post.postforme_post_id

    # Delete from PostForMe first (if it was submitted there)
    if pf_id:
        try:
            await postforme_service.delete_post(pf_id)
            logger.info(f"Deleted post {pf_id} from PostForMe.")
        except Exception as e:
            logger.warning(f"Failed to delete post {pf_id} from PostForMe: {e}")
            # Continue with local deletion even if PostForMe fails

    db.delete(post)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="DELETE_POST",
        details=f"Deleted post {post_id} (PostForMe: {pf_id})",
        entity_type="Post"
    ))
    db.commit()
    return {"status": "success", "message": "Post deleted"}


# ─── CLIENT REVIEW & ONE-CLICK ACC ENDPOINTS ─────────────────────────────

@router.get("/public/review/{post_id}")
async def get_public_post_review(post_id: str, db: Session = Depends(get_db)):
    """
    Public endpoint: Returns preview metadata for client review without login.
    Strictly sanitized & scoped to prevent IDOR/Enumeration attacks.
    """
    clean_post_id = sanitize_text(post_id, max_length=64, allow_newlines=False)
    if not clean_post_id:
        raise HTTPException(status_code=400, detail="ID Posting tidak valid.")

    post = db.query(Post).filter(Post.id == clean_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Posting tidak ditemukan atau link sudah kedaluwarsa.")

    workspace = post.workspace
    targets = []
    platforms = []
    for t in post.targets:
        acc = t.social_account
        plat = acc.platform.value if acc else "unknown"
        if plat not in platforms:
            platforms.append(plat)
        targets.append({
            "platform": plat,
            "username": acc.username if acc else "Account",
            "name": acc.name if acc else "Social Account",
            "avatar_url": acc.avatar_url if acc else None,
        })

    return {
        "id": post.id,
        "workspace_name": workspace.name if workspace else "Shiera Agency",
        "post_type": post.post_type.value if post.post_type else "image",
        "caption": post.caption or "",
        "hashtags": post.hashtags or "",
        "media_urls": post.media_urls or [],
        "platforms": platforms,
        "targets": targets,
        "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
        "status": post.status.value if post.status else "draft",
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


@router.post("/public/review/{post_id}/approve")
async def approve_public_post_review(
    post_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Public endpoint: One-Click ACC from Client.
    Transitions post status from DRAFT to SCHEDULED and triggers queue.
    """
    clean_post_id = sanitize_text(post_id, max_length=64, allow_newlines=False)
    if not clean_post_id:
        raise HTTPException(status_code=400, detail="ID Posting tidak valid.")

    post = db.query(Post).filter(Post.id == clean_post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Posting tidak ditemukan.")

    if post.status in (PostStatus.PUBLISHED, PostStatus.PUBLISHING):
        return {
            "status": "already_approved",
            "message": "Postingan ini sudah disetujui dan sedang dalam proses tayang!",
            "post_status": post.status.value,
        }

    # Set status to SCHEDULED
    post.status = PostStatus.SCHEDULED
    post.updated_at = datetime.utcnow()

    # Update targets status
    for t in post.targets:
        t.status = post.status

    db.add(ActivityLog(
        workspace_id=post.workspace_id,
        action="CLIENT_ACC_APPROVED",
        details=f"Post {post.id} was ACC & Approved by Client via WA Review Link.",
        entity_type="Post",
        entity_id=post.id
    ))

    db.commit()
    db.refresh(post)

    # Dispatch background queue task to PostForMe
    background_tasks.add_task(queue_service.enqueue_post_publishing, db, post.id)

    return {
        "status": "success",
        "message": "Postingan berhasil di-ACC & dijadwalkan tayang otomatis!",
        "post_status": post.status.value,
        "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None,
    }


# ─── AI CAPTION VISION ENDPOINT ─────────────────────────────────────────────

class GenerateAICaptionRequest(BaseModel):
    workspace_id: str
    account_ids: Optional[List[str]] = None
    image_url: str
    post_type: Optional[str] = "image"
    custom_instructions: Optional[str] = None


@router.post("/generate-ai-caption")
async def generate_ai_caption(
    req: GenerateAICaptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    Generate AI Copywriting Caption & 5 Hashtags using Gemini Vision API by analyzing
    the uploaded image (slide ke-1 or video thumbnail cover).
    Incorporates Social Account Briefings for selected account_ids.
    """
    from backend.services.gemini_service import gemini_service

    if not req.image_url:
        raise HTTPException(status_code=400, detail="URL gambar tidak ditemukan.")

    accounts_info = []
    if req.account_ids:
        accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.workspace_id == req.workspace_id,
                SocialAccount.id.in_(req.account_ids)
            )
            .all()
        )
        accounts_info = [
            {
                "id": a.id,
                "name": a.name,
                "username": a.username,
                "platform": a.platform.value if a.platform else "social",
                "briefing": a.briefing or {}
            }
            for a in accounts
        ]

    try:
        res = await gemini_service.generate_caption_from_image(
            image_url=req.image_url,
            post_type=req.post_type or "image",
            accounts_info=accounts_info,
            custom_instructions=req.custom_instructions,
            db=db,
        )
        return {
            "status": "ok",
            "caption": res.get("caption", ""),
            "hashtags": res.get("hashtags", ""),
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as exc:
        logger.error(f"AI Caption vision generation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail=str(exc) or "Gagal membuat caption AI dari gambar."
        )


# ─── /v1/social-posts alias ─────────────────────────────────────────────────
# Mirrors the same CRUD so the frontend can call /v1/social-posts/* or /posts/*
v1_router = APIRouter(prefix="/v1/social-posts", tags=["Social Posts v1"])

v1_router.get("/")(get_posts)
v1_router.patch("/{post_id}")(patch_post)
v1_router.put("/{post_id}")(update_post)
v1_router.delete("/{post_id}")(delete_post)
v1_router.get("/public/review/{post_id}")(get_public_post_review)
v1_router.post("/public/review/{post_id}/approve")(approve_public_post_review)
v1_router.post("/generate-ai-caption")(generate_ai_caption)


