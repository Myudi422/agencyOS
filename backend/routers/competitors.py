"""
Competitor Spy Router — /competitors
Endpoints for tracking competitor Instagram accounts, syncing profile stats,
fetching top performing posts, and retrieving benchmark comparison matrices.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from datetime import datetime
import logging

from backend.database import get_db
from backend.models.models import (
    User, Workspace, WorkspaceMember, CompetitorAccount, CompetitorPost, ActivityLog
)
from backend.services.firebase_service import verify_firebase_token
from backend.services.instagrapi_service import instagrapi_service

logger = logging.getLogger("CompetitorsRouter")
router = APIRouter(prefix="/competitors", tags=["Competitor Spy"])


# ─── Auth Dependency ──────────────────────────────────────────────────────────

def get_current_user_and_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> tuple[User, Workspace]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    id_token = authorization.split(" ", 1)[1]
    firebase_user = verify_firebase_token(id_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid token.")

    user = db.query(User).filter(User.firebase_uid == firebase_user["firebase_uid"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    if not x_workspace_id:
        membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
        if not membership:
            raise HTTPException(status_code=404, detail="User has no workspace assigned.")
        workspace_id = membership.workspace_id
    else:
        workspace_id = x_workspace_id

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    return user, workspace


# ─── Request Schemas ──────────────────────────────────────────────────────────

class AddCompetitorRequest(BaseModel):
    username: str

class CompetitorResponse(BaseModel):
    id: str
    workspace_id: str
    username: str
    full_name: Optional[str] = None
    instagram_pk: Optional[str] = None
    profile_pic_url: Optional[str] = None
    biography: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    media_count: int = 0
    is_verified: bool = False
    category_name: Optional[str] = None
    avg_likes: float = 0.0
    avg_comments: float = 0.0
    engagement_rate: float = 0.0
    top_hashtags: List[str] = []
    last_synced_at: Optional[str] = None
    created_at: str

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
def list_competitors(
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """List all tracked competitors for active workspace."""
    _, workspace = ctx
    competitors = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id
    ).order_by(CompetitorAccount.followers_count.desc()).all()

    result = []
    for c in competitors:
        result.append({
            "id": c.id,
            "workspace_id": c.workspace_id,
            "username": c.username,
            "full_name": c.full_name,
            "instagram_pk": c.instagram_pk,
            "profile_pic_url": c.profile_pic_url,
            "biography": c.biography,
            "followers_count": c.followers_count,
            "following_count": c.following_count,
            "media_count": c.media_count,
            "is_verified": c.is_verified,
            "category_name": c.category_name,
            "avg_likes": c.avg_likes,
            "avg_comments": c.avg_comments,
            "engagement_rate": c.engagement_rate,
            "top_hashtags": c.top_hashtags or [],
            "last_synced_at": c.last_synced_at.isoformat() if c.last_synced_at else None,
            "created_at": c.created_at.isoformat(),
            "posts_count": db.query(CompetitorPost).filter(CompetitorPost.competitor_id == c.id).count()
        })

    return {"competitors": result, "total": len(result)}


@router.post("/")
def add_competitor(
    req: AddCompetitorRequest,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Add a new competitor by Instagram username and sync profile + posts."""
    user, workspace = ctx
    clean_username = req.username.strip().lstrip("@").lower()

    if not clean_username:
        raise HTTPException(status_code=400, detail="Username Instagram tidak boleh kosong.")

    # Check duplicate
    existing = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id,
        CompetitorAccount.username == clean_username
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail=f"Kompetitor @{clean_username} sudah ada dalam daftar pantau.")

    # Fetch profile via instagrapi
    try:
        profile_data = instagrapi_service.fetch_competitor_profile(db, clean_username)
    except Exception as e:
        logger.error(f"Failed to fetch profile for @{clean_username}: {e}")
        raise HTTPException(status_code=400, detail=f"Gagal mengambil profil Instagram @{clean_username}: {str(e)}")

    account = CompetitorAccount(
        workspace_id=workspace.id,
        username=profile_data["username"],
        full_name=profile_data["full_name"],
        instagram_pk=profile_data["instagram_pk"],
        profile_pic_url=profile_data["profile_pic_url"],
        biography=profile_data["biography"],
        followers_count=profile_data["followers_count"],
        following_count=profile_data["following_count"],
        media_count=profile_data["media_count"],
        is_verified=profile_data["is_verified"],
        category_name=profile_data["category_name"],
        last_synced_at=datetime.utcnow()
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    # Automatically sync posts
    try:
        posts_data = instagrapi_service.fetch_competitor_posts(db, account.username, amount=20)
        account.avg_likes = posts_data["avg_likes"]
        account.avg_comments = posts_data["avg_comments"]
        account.engagement_rate = posts_data["engagement_rate"]
        account.top_hashtags = posts_data["top_hashtags"]

        for p in posts_data["posts"]:
            c_post = CompetitorPost(
                competitor_id=account.id,
                instagram_media_id=p["instagram_media_id"],
                code=p["code"],
                post_type=p["post_type"],
                caption=p["caption"],
                thumbnail_url=p["thumbnail_url"],
                media_urls=p["media_urls"],
                like_count=p["like_count"],
                comment_count=p["comment_count"],
                engagement_rate=p["engagement_rate"],
                is_top_performer=p["is_top_performer"],
                posted_at=datetime.fromisoformat(p["posted_at"]) if p["posted_at"] else datetime.utcnow()
            )
            db.add(c_post)

        db.commit()
    except Exception as e:
        logger.warning(f"Initial post sync warning for @{clean_username}: {e}")

    # Activity log
    log = ActivityLog(
        workspace_id=workspace.id,
        user_name=user.full_name,
        action="ADD_COMPETITOR",
        details=f"Menambahkan kompetitor @{account.username} untuk dipantau",
        entity_type="Competitor",
        entity_id=account.id
    )
    db.add(log)
    db.commit()

    return {
        "status": "ok",
        "message": f"Kompetitor @{account.username} berhasil ditambahkan!",
        "competitor_id": account.id
    }


@router.post("/{competitor_id}/sync")
def sync_competitor(
    competitor_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Re-sync profile stats and recent posts from Instagram via instagrapi."""
    user, workspace = ctx
    account = db.query(CompetitorAccount).filter(
        CompetitorAccount.id == competitor_id,
        CompetitorAccount.workspace_id == workspace.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Kompetitor tidak ditemukan.")

    # Re-fetch profile
    try:
        profile_data = instagrapi_service.fetch_competitor_profile(db, account.username)
        account.full_name = profile_data["full_name"]
        account.profile_pic_url = profile_data["profile_pic_url"]
        account.biography = profile_data["biography"]
        account.followers_count = profile_data["followers_count"]
        account.following_count = profile_data["following_count"]
        account.media_count = profile_data["media_count"]
        account.is_verified = profile_data["is_verified"]
        account.category_name = profile_data["category_name"]
    except Exception as e:
        logger.warning(f"Profile refresh warning for @{account.username}: {e}")

    # Re-fetch posts
    try:
        posts_data = instagrapi_service.fetch_competitor_posts(db, account.username, amount=25)
        account.avg_likes = posts_data["avg_likes"]
        account.avg_comments = posts_data["avg_comments"]
        account.engagement_rate = posts_data["engagement_rate"]
        account.top_hashtags = posts_data["top_hashtags"]
        account.last_synced_at = datetime.utcnow()

        # Delete existing saved posts to avoid duplicates
        db.query(CompetitorPost).filter(CompetitorPost.competitor_id == account.id).delete()

        for p in posts_data["posts"]:
            c_post = CompetitorPost(
                competitor_id=account.id,
                instagram_media_id=p["instagram_media_id"],
                code=p["code"],
                post_type=p["post_type"],
                caption=p["caption"],
                thumbnail_url=p["thumbnail_url"],
                media_urls=p["media_urls"],
                like_count=p["like_count"],
                comment_count=p["comment_count"],
                engagement_rate=p["engagement_rate"],
                is_top_performer=p["is_top_performer"],
                posted_at=datetime.fromisoformat(p["posted_at"]) if p["posted_at"] else datetime.utcnow()
            )
            db.add(c_post)

        db.commit()
    except Exception as e:
        logger.error(f"Sync posts failed for @{account.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal melakukan sync postingan Instagram @{account.username}: {str(e)}")

    return {
        "status": "ok",
        "message": f"Data kompetitor @{account.username} berhasil diperbarui!",
        "posts_scraped": len(posts_data.get("posts", []))
    }


@router.delete("/{competitor_id}")
def delete_competitor(
    competitor_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Delete a tracked competitor account."""
    user, workspace = ctx
    account = db.query(CompetitorAccount).filter(
        CompetitorAccount.id == competitor_id,
        CompetitorAccount.workspace_id == workspace.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Kompetitor tidak ditemukan.")

    username = account.username
    db.delete(account)

    log = ActivityLog(
        workspace_id=workspace.id,
        user_name=user.full_name,
        action="DELETE_COMPETITOR",
        details=f"Menghapus kompetitor @{username} dari daftar pantau",
        entity_type="Competitor",
        entity_id=competitor_id
    )
    db.add(log)
    db.commit()

    return {"status": "ok", "message": f"Kompetitor @{username} berhasil dihapus."}


@router.get("/{competitor_id}/posts")
def get_competitor_posts(
    competitor_id: str,
    top_only: bool = Query(False),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Get tracked posts for a specific competitor."""
    _, workspace = ctx
    account = db.query(CompetitorAccount).filter(
        CompetitorAccount.id == competitor_id,
        CompetitorAccount.workspace_id == workspace.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Kompetitor tidak ditemukan.")

    query = db.query(CompetitorPost).filter(CompetitorPost.competitor_id == account.id)
    if top_only:
        query = query.filter(CompetitorPost.is_top_performer == True)

    posts = query.order_by(CompetitorPost.like_count.desc(), CompetitorPost.posted_at.desc()).all()

    result = []
    for p in posts:
        result.append({
            "id": p.id,
            "competitor_id": p.competitor_id,
            "instagram_media_id": p.instagram_media_id,
            "code": p.code,
            "post_type": p.post_type,
            "caption": p.caption,
            "thumbnail_url": p.thumbnail_url,
            "media_urls": p.media_urls or [],
            "like_count": p.like_count,
            "comment_count": p.comment_count,
            "engagement_rate": p.engagement_rate,
            "is_top_performer": p.is_top_performer,
            "posted_at": p.posted_at.isoformat() if p.posted_at else None,
            "instagram_url": f"https://www.instagram.com/p/{p.code}/" if p.code else None
        })

    return {
        "competitor": {
            "id": account.id,
            "username": account.username,
            "full_name": account.full_name,
            "profile_pic_url": account.profile_pic_url,
            "followers_count": account.followers_count,
            "engagement_rate": account.engagement_rate,
        },
        "posts": result,
        "total": len(result)
    }


@router.get("/benchmark/matrix")
def get_benchmark_matrix(
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Comparative analytics matrix across all tracked competitors."""
    _, workspace = ctx
    competitors = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id
    ).all()

    if not competitors:
        return {"matrix": [], "avg_industry_er": 0.0}

    matrix = []
    total_er = 0.0

    for c in competitors:
        total_er += c.engagement_rate
        top_posts_count = db.query(CompetitorPost).filter(
            CompetitorPost.competitor_id == c.id,
            CompetitorPost.is_top_performer == True
        ).count()

        matrix.append({
            "id": c.id,
            "username": c.username,
            "full_name": c.full_name,
            "profile_pic_url": c.profile_pic_url,
            "followers_count": c.followers_count,
            "following_count": c.following_count,
            "media_count": c.media_count,
            "avg_likes": c.avg_likes,
            "avg_comments": c.avg_comments,
            "engagement_rate": c.engagement_rate,
            "top_posts_count": top_posts_count,
            "top_hashtags": c.top_hashtags[:5] if c.top_hashtags else []
        })

    avg_industry_er = round(total_er / len(competitors), 2) if competitors else 0.0

    return {
        "matrix": sorted(matrix, key=lambda x: x["engagement_rate"], reverse=True),
        "avg_industry_er": avg_industry_er,
        "total_competitors": len(competitors)
    }
