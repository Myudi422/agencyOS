from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.database import get_db
from backend.models.models import Post, PostTarget, SocialAccount, PostType, PostStatus, ActivityLog, UserSubscription
from backend.services.queue_service import queue_service
from backend.services.postforme_service import postforme_service

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
        res = await postforme_service.create_upload_url(content_type=data.content_type)
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
    first_comment: Optional[str] = ""
    location: Optional[str] = ""
    alt_text: Optional[str] = ""
    media_urls: List[str] = []
    platform_configurations: Optional[Dict[str, Any]] = None # PostForMe platform configs
    scheduled_at: Optional[str] = None # ISO format string
    action: Optional[str] = "publish_now" # publish_now, schedule, save_draft
    publish_now: Optional[bool] = None

class PostUpdate(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    first_comment: Optional[str] = None
    location: Optional[str] = None
    alt_text: Optional[str] = None
    media_urls: Optional[List[str]] = None
    platform_configurations: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[str] = None
    status: Optional[str] = None  # Allow frontend to update status (draft, scheduled, etc.)

class PostPatch(BaseModel):
    """Partial update payload from frontend queue manager."""
    caption: Optional[str] = None
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

@router.get("/")
def get_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="draft, scheduled, processing, processed (aliases supported)"),
    client_id: Optional[str] = Query(None, description="Client filter"),
    search: Optional[str] = Query(None, description="Search in caption"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves posts for a workspace with target account statuses."""
    query = db.query(Post).filter(Post.workspace_id == workspace_id)

    if status:
        # Map frontend alias to DB enum value
        db_status = STATUS_ALIAS_TO_DB.get(status.lower(), status.lower())
        try:
            query = query.filter(Post.status == PostStatus(db_status))
        except ValueError:
            pass  # Unknown status — ignore filter

    if search:
        query = query.filter(Post.caption.ilike(f"%{search}%"))
    if client_id:
        query = query.filter(Post.client_id == client_id)

    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    results = []

    for p in posts:
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
                "status": STATUS_DB_TO_ALIAS.get(t.status.value, t.status.value),
                "platform_post_id": t.platform_post_id,
                "error_message": t.error_message
            })

        db_status = p.status.value
        results.append({
            "id": p.id,
            "workspace_id": p.workspace_id,
            "client_id": p.client_id,
            "post_type": p.post_type.value,
            # Nested content object (frontend expects { text })
            "content": {"text": p.caption or ""},
            "caption": p.caption,
            "hashtags": p.hashtags,
            "first_comment": p.first_comment,
            "location": p.location,
            "alt_text": p.alt_text,
            "media_urls": p.media_urls or [],
            "platform_configurations": p.platform_configurations,
            "platforms": platforms,
            "postforme_post_id": p.postforme_post_id,
            "scheduled_at": p.scheduled_at.isoformat() if p.scheduled_at else None,
            "published_at": p.published_at.isoformat() if p.published_at else None,
            # Map DB status to frontend alias
            "status": STATUS_DB_TO_ALIAS.get(db_status, db_status),
            "targets": targets,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })

    return {"data": results, "total": total, "limit": limit, "offset": offset}

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
    selected_account_ids = data.account_ids or data.target_account_ids or []
    action_type = data.action or ("publish_now" if data.publish_now else ("schedule" if data.scheduled_at else "save_draft"))

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
    if data.scheduled_at:
        try:
            sched_dt = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
        except Exception:
            sched_dt = datetime.utcnow()

    # Determine status
    if action_type == "save_draft":
        initial_status = PostStatus.DRAFT
    elif action_type == "schedule":
        initial_status = PostStatus.SCHEDULED
    else:
        initial_status = PostStatus.PUBLISHING

    post = Post(
        workspace_id=data.workspace_id,
        client_id=data.client_id,
        post_type=PostType(data.post_type) if data.post_type in [p.value for p in PostType] else PostType.IMAGE,
        caption=data.caption,
        hashtags=data.hashtags,
        first_comment=data.first_comment,
        location=data.location,
        alt_text=data.alt_text,
        media_urls=data.media_urls,
        platform_configurations=data.platform_configurations,
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
        workspace_id=data.workspace_id,
        action=f"CREATE_POST_{action_type.upper()}",
        details=f"Created post ({data.post_type}) targeting {len(selected_account_ids)} accounts.",
        entity_type="Post",
        entity_id=post.id
    ))

    db.commit()
    db.refresh(post)

    # If Publish Now or Schedule, dispatch background queue task to send post to PostForMe API
    if action_type in ("publish_now", "schedule"):
        background_tasks.add_task(queue_service.enqueue_post_publishing, db, post.id)

    return {"status": "success", "post_id": post.id, "post_status": post.status.value}


@router.put("/{post_id}")
def update_post(post_id: str, data: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if data.caption is not None:
        post.caption = data.caption
    if data.hashtags is not None:
        post.hashtags = data.hashtags
    if data.first_comment is not None:
        post.first_comment = data.first_comment
    if data.location is not None:
        post.location = data.location
    if data.alt_text is not None:
        post.alt_text = data.alt_text
    if data.media_urls is not None:
        post.media_urls = data.media_urls
    if data.scheduled_at is not None:
        post.scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    if data.status is not None:
        db_status = STATUS_ALIAS_TO_DB.get(data.status.lower(), data.status.lower())
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
        post.caption = data.caption
    elif data.content is not None and "text" in data.content:
        post.caption = data.content["text"]

    if data.scheduled_at is not None:
        post.scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))

    if data.status is not None:
        db_status = STATUS_ALIAS_TO_DB.get(data.status.lower(), data.status.lower())
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
def delete_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    workspace_id = post.workspace_id
    db.delete(post)
    db.add(ActivityLog(
        workspace_id=workspace_id,
        action="DELETE_POST",
        details=f"Deleted post {post_id}",
        entity_type="Post"
    ))
    db.commit()
    return {"status": "success", "message": "Post deleted"}


# ─── /v1/social-posts alias ─────────────────────────────────────────────────
# Mirrors the same CRUD so the frontend can call /v1/social-posts/* or /posts/*
v1_router = APIRouter(prefix="/v1/social-posts", tags=["Social Posts v1"])

v1_router.get("/")(get_posts)
v1_router.patch("/{post_id}")(patch_post)
v1_router.put("/{post_id}")(update_post)
v1_router.delete("/{post_id}")(delete_post)
