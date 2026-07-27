from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.database import get_db
from backend.models.models import Post, PostTarget, SocialAccount, PostType, PostStatus, ActivityLog
from backend.services.queue_service import queue_service

router = APIRouter(prefix="/posts", tags=["Posts"])

class PostCreate(BaseModel):
    workspace_id: str
    client_id: Optional[str] = None
    account_ids: List[str] # List of selected target social account IDs
    post_type: str = "image" # image, carousel, video
    caption: Optional[str] = ""
    hashtags: Optional[str] = ""
    first_comment: Optional[str] = ""
    location: Optional[str] = ""
    alt_text: Optional[str] = ""
    media_urls: List[str] = []
    platform_configurations: Optional[Dict[str, Any]] = None # PostForMe platform configs
    scheduled_at: Optional[str] = None # ISO format string
    action: str = "publish_now" # publish_now, schedule, save_draft

class PostUpdate(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    first_comment: Optional[str] = None
    location: Optional[str] = None
    alt_text: Optional[str] = None
    media_urls: Optional[List[str]] = None
    platform_configurations: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[str] = None

@router.get("/")
def get_posts(
    workspace_id: str = Query(..., description="Workspace ID"),
    status: Optional[str] = Query(None, description="Draft, Scheduled, Publishing, Published, Failed"),
    client_id: Optional[str] = Query(None, description="Client filter"),
    db: Session = Depends(get_db)
):
    """Retrieves posts for a workspace with target account statuses."""
    query = db.query(Post).filter(Post.workspace_id == workspace_id)

    if status:
        query = query.filter(Post.status == PostStatus(status))
    if client_id:
        query = query.filter(Post.client_id == client_id)

    posts = query.order_by(Post.created_at.desc()).all()
    results = []

    for p in posts:
        targets = []
        for t in p.targets:
            acc = t.social_account
            targets.append({
                "target_id": t.id,
                "account_id": acc.id if acc else None,
                "platform": acc.platform.value if acc else "unknown",
                "username": acc.username if acc else "deleted",
                "name": acc.name if acc else "Deleted Account",
                "avatar_url": acc.avatar_url if acc else None,
                "status": t.status.value,
                "platform_post_id": t.platform_post_id,
                "error_message": t.error_message
            })

        results.append({
            "id": p.id,
            "workspace_id": p.workspace_id,
            "client_id": p.client_id,
            "post_type": p.post_type.value,
            "caption": p.caption,
            "hashtags": p.hashtags,
            "first_comment": p.first_comment,
            "location": p.location,
            "alt_text": p.alt_text,
            "media_urls": p.media_urls or [],
            "platform_configurations": p.platform_configurations,
            "postforme_post_id": p.postforme_post_id,
            "scheduled_at": p.scheduled_at,
            "published_at": p.published_at,
            "status": p.status.value,
            "targets": targets,
            "created_at": p.created_at
        })

    return results

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
    Supports Publish Now, Schedule, and Save Draft actions.
    Enforces subscription plans and posts quota.
    """
    if not data.account_ids and data.action != "save_draft":
        raise HTTPException(status_code=400, detail="At least one target social account must be selected.")

    # Quota validation for non-admin users
    if not current_user.is_admin and data.action in ("publish_now", "schedule"):
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
        required_quota = len(data.account_ids)
        if sub.posts_used + required_quota > sub.posts_limit:
            remaining = max(0, sub.posts_limit - sub.posts_used)
            raise HTTPException(
                status_code=402, 
                detail=f"Kuota post tidak mencukupi. Sisa kuota Anda adalah {remaining} post, sedangkan aksi ini membutuhkan {required_quota} post."
            )
        
        # Deduct quota
        sub.posts_used += required_quota
        db.add(sub)

    # Parse scheduled_at if provided
    sched_dt = None
    if data.scheduled_at:
        try:
            sched_dt = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
        except Exception:
            sched_dt = datetime.utcnow()

    # Determine status
    if data.action == "save_draft":
        initial_status = PostStatus.DRAFT
    elif data.action == "schedule":
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
        created_by=current_user.full_name
    )
    db.add(post)
    db.flush()

    # Create targets for each selected social account
    for acc_id in data.account_ids:
        target = PostTarget(
            post_id=post.id,
            social_account_id=acc_id,
            status=initial_status
        )
        db.add(target)

    # Activity Log
    db.add(ActivityLog(
        workspace_id=data.workspace_id,
        action=f"CREATE_POST_{data.action.upper()}",
        details=f"Created post ({data.post_type}) targeting {len(data.account_ids)} accounts.",
        entity_type="Post",
        entity_id=post.id
    ))

    db.commit()
    db.refresh(post)

    # If Publish Now, dispatch background queue task immediately
    if data.action == "publish_now":
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

    db.commit()
    return post

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
