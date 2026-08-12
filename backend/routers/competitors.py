"""
Competitor Spy Router — /competitors
Endpoints for tracking competitor Instagram accounts, syncing profile stats,
fetching top performing posts, and retrieving benchmark comparison matrices.

Performance & Reliability:
- sync-all runs in a background thread pool (non-blocking, concurrent per brand)
- daily-feed and benchmark/matrix responses are cached in Upstash Redis (3 min TTL)
- sync status stored in Redis — shared across all worker processes/instances
- rate limiting: 3 min cooldown per workspace/account for sync-all and individual sync
- per-connected Instagram account isolation (max 5 competitors per connected IG account)
- 2-step add process: validation preview -> background async fetch with progress bar
- graceful fallback to in-memory if Redis is unavailable
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import time
import uuid
import random

from backend.database import get_db, SessionLocal
from backend.models.models import (
    User, Workspace, WorkspaceMember, CompetitorAccount, CompetitorPost, ActivityLog,
    SocialAccount, AccountPlatform
)
from backend.services.firebase_service import verify_firebase_token
from backend.services.ensta_scraper_service import ensta_scraper_service
from backend.services.tiktok_scraper_service import tiktok_scraper_service
from backend.models.models import Setting

def _fetch_profile(db: Session, username: str, platform: str = "instagram") -> dict:
    if str(platform).lower().strip() == "tiktok":
        return tiktok_scraper_service.fetch_competitor_profile(db, username)
    return ensta_scraper_service.fetch_competitor_profile(db, username)

def _fetch_posts(db: Session, username: str, amount: int = 20, platform: str = "instagram") -> dict:
    if str(platform).lower().strip() == "tiktok":
        return tiktok_scraper_service.fetch_competitor_posts(db, username, amount=amount)
    return ensta_scraper_service.fetch_competitor_posts(db, username, amount=amount)




from backend.services.redis_service import (
    cache_get, cache_set, cache_delete_prefix,
    sync_status_get, sync_status_set, sync_status_increment_done,
    check_rate_limit, set_rate_limit
)

logger = logging.getLogger("CompetitorsRouter")
router = APIRouter(prefix="/competitors", tags=["Competitor Spy"])

# TTL and Cooldown values (3 minutes)
_CACHE_TTL = 180              # 3 minutes for list/benchmark/daily-feed
_SYNC_COOLDOWN = 180         # 3 minutes cooldown between sync-all runs
_ACCOUNT_SYNC_COOLDOWN = 180 # 3 minutes cooldown for individual competitor sync


def _get_cached_competitor_profile(db: Session, username: str, max_age_hours: int = 6) -> Optional[CompetitorAccount]:
    """Check if any workspace already has fresh synced profile data for this competitor (< max_age_hours)."""
    cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
    clean_user = username.strip().lstrip("@").lower()
    return db.query(CompetitorAccount).filter(
        CompetitorAccount.username == clean_user,
        CompetitorAccount.last_synced_at >= cutoff
    ).order_by(CompetitorAccount.last_synced_at.desc()).first()


def _get_primary_competitor_account(db: Session, username: str) -> Optional[CompetitorAccount]:
    """Get the canonical primary CompetitorAccount record for a given username (Single Source of Truth for posts)."""
    clean_user = username.strip().lstrip("@").lower()
    return db.query(CompetitorAccount).filter(
        CompetitorAccount.username == clean_user
    ).order_by(CompetitorAccount.created_at.asc()).first()


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

class ValidateUsernameRequest(BaseModel):
    username: str
    platform: Optional[str] = "instagram"

class AddCompetitorRequest(BaseModel):
    social_account_id: Optional[str] = None
    username: str
    platform: Optional[str] = "instagram"

class CompetitorResponse(BaseModel):
    id: str
    workspace_id: str
    social_account_id: Optional[str] = None
    platform: str = "instagram"
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

@router.get("/ig-accounts")
def list_connected_ig_accounts(
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """List connected Instagram accounts for active workspace to let user select which one to track competitors for."""
    _, workspace = ctx
    accounts = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == workspace.id,
        SocialAccount.platform.in_([AccountPlatform.INSTAGRAM, AccountPlatform.INSTAGRAM_BUSINESS])
    ).all()
    
    result = []
    for a in accounts:
        comp_count = db.query(CompetitorAccount).filter(
            CompetitorAccount.social_account_id == a.id,
            CompetitorAccount.platform == "instagram"
        ).count()
        result.append({
            "id": a.id,
            "username": a.username,
            "name": a.name,
            "avatar_url": a.avatar_url,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "followers_count": a.followers_count,
            "competitors_count": comp_count,
            "max_competitors": 5
        })
    return {"accounts": result, "total": len(result)}


@router.post("/validate")
def validate_competitor_username(
    req: ValidateUsernameRequest,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Step 1 of adding competitor: check if username exists on target platform and preview profile."""
    clean_username = req.username.strip().lstrip("@").lower()
    plat = (req.platform or "instagram").strip().lower()
    if not clean_username:
        raise HTTPException(status_code=400, detail="Username tidak boleh kosong.")
    
    if plat == "instagram":
        cached = _get_cached_competitor_profile(db, clean_username)
        if cached:
            return {
                "valid": True,
                "profile": {
                    "platform": "instagram",
                    "username": cached.username,
                    "instagram_pk": cached.instagram_pk,
                    "full_name": cached.full_name or cached.username,
                    "profile_pic_url": cached.profile_pic_url,
                    "biography": cached.biography,
                    "followers_count": cached.followers_count,
                    "following_count": cached.following_count,
                    "media_count": cached.media_count,
                    "is_verified": cached.is_verified,
                    "category_name": cached.category_name,
                },
                "message": f"Akun @{cached.username} ditemukan (Global Cache)."
            }

    try:
        profile_data = _fetch_profile(db, clean_username, platform=plat)
        return {
            "valid": True,
            "profile": profile_data,
            "message": f"Akun {plat.upper()} @{profile_data['username']} ditemukan."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Akun {plat.upper()} @{clean_username} tidak ditemukan: {str(e)}")


@router.get("/")
def list_competitors(
    social_account_id: Optional[str] = Query(None),
    platform: Optional[str] = Query("instagram"),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """List tracked competitors for active workspace & target platform. Cached 3 min in Redis."""
    _, workspace = ctx
    plat = (platform or "instagram").strip().lower()
    cache_key = f"competitors:list:{workspace.id}:{plat}:{social_account_id or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    from sqlalchemy import func
    query = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id,
        CompetitorAccount.platform == plat
    )
    if social_account_id and plat == "instagram":
        query = query.filter(CompetitorAccount.social_account_id == social_account_id)

    competitors = query.order_by(CompetitorAccount.followers_count.desc()).all()


    competitor_ids = [c.id for c in competitors]
    post_counts = {}
    if competitor_ids:
        rows = db.query(
            CompetitorPost.competitor_id, func.count(CompetitorPost.id)
        ).filter(
            CompetitorPost.competitor_id.in_(competitor_ids)
        ).group_by(CompetitorPost.competitor_id).all()
        post_counts = {r[0]: r[1] for r in rows}

    result = []
    for c in competitors:
        result.append({
            "id": c.id,
            "workspace_id": c.workspace_id,
            "social_account_id": c.social_account_id,
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
            "last_synced_at": c.last_synced_at.strftime("%Y-%m-%dT%H:%M:%SZ") if c.last_synced_at else None,
            "created_at": c.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if c.created_at else None,
            "posts_count": post_counts.get(c.id, 0)
        })

    payload = {"competitors": result, "total": len(result)}
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


def _run_add_competitor_bg(job_id: str, competitor_id: str, username: str, workspace_id: str, social_account_id: str):
    """Background task to fetch initial posts for a newly added competitor."""
    cache_set(f"add_job:{job_id}", {
        "status": "running", "percent": 40, "message": f"Mengambil postingan & menghitung statistik @{username}...", "competitor_id": competitor_id
    }, ttl_seconds=600)
    
    db = SessionLocal()
    try:
        account = db.query(CompetitorAccount).filter(CompetitorAccount.id == competitor_id).first()
        if account:
            # Check if another workspace already has recent cached profile data for this competitor
            cached_source = db.query(CompetitorAccount).filter(
                CompetitorAccount.username == username,
                CompetitorAccount.id != competitor_id,
                CompetitorAccount.last_synced_at >= datetime.utcnow() - timedelta(hours=6)
            ).order_by(CompetitorAccount.last_synced_at.desc()).first()

            if cached_source:
                logger.info(f"Reusing existing master posts for @{username} without duplicating rows in DB")
                account.avg_likes = cached_source.avg_likes
                account.avg_comments = cached_source.avg_comments
                account.engagement_rate = cached_source.engagement_rate
                account.top_hashtags = cached_source.top_hashtags
                db.commit()
            else:
                posts_data = _fetch_posts(db, username, amount=20)

                account.avg_likes = posts_data["avg_likes"]
                account.avg_comments = posts_data["avg_comments"]
                account.engagement_rate = posts_data["engagement_rate"]
                account.top_hashtags = posts_data["top_hashtags"]

                primary_acc = _get_primary_competitor_account(db, username) or account
                target_comp_id = primary_acc.id

                # Replace master posts for primary account
                db.query(CompetitorPost).filter(CompetitorPost.competitor_id == target_comp_id).delete()

                for p in posts_data["posts"]:
                    c_post = CompetitorPost(
                        competitor_id=target_comp_id,
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
                        posted_at=datetime.fromisoformat(p["posted_at"].rstrip("Z")) if p.get("posted_at") else datetime.utcnow()
                    )
                    db.add(c_post)
                db.commit()

        # Invalidate caches
        cache_delete_prefix(f"competitors:list:{workspace_id}")
        cache_delete_prefix(f"competitors:benchmark:{workspace_id}")
        cache_delete_prefix(f"competitors:daily:{workspace_id}")

        cache_set(f"add_job:{job_id}", {
            "status": "done", "percent": 100, "message": f"Kompetitor @{username} berhasil ditambahkan!", "competitor_id": competitor_id
        }, ttl_seconds=600)
    except Exception as e:
        logger.warning(f"Background add post sync warning for @{username}: {e}")
        cache_set(f"add_job:{job_id}", {
            "status": "done", "percent": 100, "message": f"Profil @{username} ditambahkan.", "competitor_id": competitor_id
        }, ttl_seconds=600)
    finally:
        db.close()


@router.post("/")
def add_competitor(
    req: AddCompetitorRequest,
    background_tasks: BackgroundTasks,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Step 2: Save competitor profile immediately and trigger non-blocking background post fetching."""
    user, workspace = ctx
    clean_username = req.username.strip().lstrip("@").lower()
    plat = (req.platform or "instagram").strip().lower()

    if not clean_username:
        raise HTTPException(status_code=400, detail="Username tidak boleh kosong.")

    social_account = None
    if plat == "instagram":
        if not req.social_account_id:
            raise HTTPException(status_code=400, detail="social_account_id wajib diisi untuk kompetitor Instagram.")
        social_account = db.query(SocialAccount).filter(
            SocialAccount.id == req.social_account_id,
            SocialAccount.workspace_id == workspace.id
        ).first()
        if not social_account:
            raise HTTPException(status_code=404, detail="Akun Instagram terhubung tidak ditemukan.")

        existing_count = db.query(CompetitorAccount).filter(
            CompetitorAccount.social_account_id == social_account.id,
            CompetitorAccount.platform == "instagram"
        ).count()
        if existing_count >= 5:
            raise HTTPException(
                status_code=400,
                detail=f"Maksimal 5 akun kompetitor per akun Instagram terhubung."
            )

        existing = db.query(CompetitorAccount).filter(
            CompetitorAccount.social_account_id == social_account.id,
            CompetitorAccount.username == clean_username,
            CompetitorAccount.platform == "instagram"
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Kompetitor @{clean_username} sudah ada dalam daftar pantau.")
    else:
        existing = db.query(CompetitorAccount).filter(
            CompetitorAccount.workspace_id == workspace.id,
            CompetitorAccount.username == clean_username,
            CompetitorAccount.platform == "tiktok"
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Kompetitor TikTok @{clean_username} sudah ada dalam daftar pantau.")

    try:
        profile_data = _fetch_profile(db, clean_username, platform=plat)
    except Exception as e:
        logger.error(f"Failed to fetch profile for @{clean_username} ({plat}): {e}")
        raise HTTPException(status_code=400, detail=f"Gagal mengambil profil @{clean_username}: {str(e)}")

    account = CompetitorAccount(
        workspace_id=workspace.id,
        social_account_id=social_account.id if social_account else None,
        platform=plat,
        username=profile_data["username"],
        full_name=profile_data.get("full_name") or profile_data.get("nickname"),
        instagram_pk=profile_data.get("instagram_pk"),
        profile_pic_url=profile_data.get("profile_pic_url"),
        biography=profile_data.get("biography"),
        followers_count=profile_data.get("followers_count", 0),
        following_count=profile_data.get("following_count", 0),
        media_count=profile_data.get("media_count", 0),
        is_verified=profile_data.get("is_verified", False),
        category_name=profile_data.get("category_name"),
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    # Activity log
    log_details = f"Menambahkan kompetitor @{account.username} untuk dipantau di akun @{social_account.username}" if social_account else f"Menambahkan kompetitor TikTok @{account.username}"
    log = ActivityLog(
        workspace_id=workspace.id,
        user_name=user.full_name,
        action="ADD_COMPETITOR",
        details=log_details,
        entity_type="Competitor",
        entity_id=account.id
    )
    db.add(log)
    db.commit()

    # Queue background task for fetching posts
    job_id = f"add_{uuid.uuid4().hex[:8]}"
    cache_set(f"add_job:{job_id}", {
        "status": "running", "percent": 15, "message": f"Menyimpan @{account.username} & memproses postingan di background...", "competitor_id": account.id
    }, ttl_seconds=600)

    background_tasks.add_task(
        _run_add_competitor_bg,
        job_id, account.id, account.username, workspace.id, social_account.id if social_account else None
    )

    # Invalidate list cache immediately so newly added competitor profile appears
    cache_delete_prefix(f"competitors:list:{workspace.id}")

    return {
        "status": "queued",
        "job_id": job_id,
        "message": f"Kompetitor @{account.username} berhasil ditambahkan! Memproses postingan di background.",
        "competitor_id": account.id
    }



@router.get("/add-status/{job_id}")
def get_add_competitor_status(
    job_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace)
):
    """Poll progress status of background competitor creation task."""
    status = cache_get(f"add_job:{job_id}")
    if not status:
        return {"status": "done", "percent": 100, "message": "Proses selesai."}
    return status


@router.post("/{competitor_id}/sync")
def sync_competitor(
    competitor_id: str,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Re-sync profile stats and recent posts for a specific competitor. Rate limited 3 min."""
    user, workspace = ctx
    account = db.query(CompetitorAccount).filter(
        CompetitorAccount.id == competitor_id,
        CompetitorAccount.workspace_id == workspace.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Kompetitor tidak ditemukan.")

    # 3 min cooldown per competitor account
    rate_key = f"sync_account:{competitor_id}"
    is_limited, remaining = check_rate_limit(rate_key, _ACCOUNT_SYNC_COOLDOWN)
    if is_limited:
        minutes = round(remaining / 60, 1)
        return {
            "status": "cooldown",
            "message": f"Sync @{account.username} baru bisa dilakukan lagi dalam {minutes} menit.",
            "retry_after_seconds": remaining
        }

    # Re-fetch profile & posts
    try:
        profile_data = _fetch_profile(db, account.username)
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
        profile_data = _fetch_profile(db, account.username)
        posts_data = _fetch_posts(db, account.username, amount=25)


        primary_acc = _get_primary_competitor_account(db, account.username) or account
        target_comp_id = primary_acc.id

        # Delete existing saved posts for primary account
        db.query(CompetitorPost).filter(CompetitorPost.competitor_id == target_comp_id).delete()

        for p in posts_data["posts"]:
            c_post = CompetitorPost(
                competitor_id=target_comp_id,
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

        # Update stats across all competitor accounts for this username
        all_accounts = db.query(CompetitorAccount).filter(CompetitorAccount.username == account.username).all()
        for acc in all_accounts:
            acc.full_name = profile_data["full_name"]
            acc.profile_pic_url = profile_data["profile_pic_url"]
            acc.biography = profile_data["biography"]
            acc.followers_count = profile_data["followers_count"]
            acc.following_count = profile_data["following_count"]
            acc.media_count = profile_data["media_count"]
            acc.is_verified = profile_data["is_verified"]
            acc.category_name = profile_data["category_name"]
            acc.avg_likes = posts_data["avg_likes"]
            acc.avg_comments = posts_data["avg_comments"]
            acc.engagement_rate = posts_data["engagement_rate"]
            acc.top_hashtags = posts_data["top_hashtags"]
            acc.last_synced_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        logger.error(f"Sync posts failed for @{account.username}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal melakukan sync postingan Instagram @{account.username}: {str(e)}")

    # Set rate limit cooldown (3 min)
    set_rate_limit(rate_key, _ACCOUNT_SYNC_COOLDOWN)

    # Invalidate caches
    cache_delete_prefix(f"competitors:list:{workspace.id}")
    cache_delete_prefix(f"competitors:benchmark:{workspace.id}")
    cache_delete_prefix(f"competitors:daily:{workspace.id}")
    cache_delete_prefix(f"competitors:posts:{competitor_id}")

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

    # Invalidate caches
    cache_delete_prefix(f"competitors:list:{workspace.id}")
    cache_delete_prefix(f"competitors:benchmark:{workspace.id}")
    cache_delete_prefix(f"competitors:daily:{workspace.id}")
    cache_delete_prefix(f"competitors:posts:{competitor_id}")

    return {"status": "ok", "message": f"Kompetitor @{username} berhasil dihapus."}


@router.get("/{competitor_id}/posts")
def get_competitor_posts(
    competitor_id: str,
    top_only: bool = Query(False),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Get tracked posts for a specific competitor. Cached 3 min in Redis."""
    _, workspace = ctx
    cache_key = f"competitors:posts:{competitor_id}:{top_only}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    account = db.query(CompetitorAccount).filter(
        CompetitorAccount.id == competitor_id,
        CompetitorAccount.workspace_id == workspace.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Kompetitor tidak ditemukan.")

    # Use master primary competitor account to fetch shared single-source posts
    primary_acc = _get_primary_competitor_account(db, account.username)
    target_comp_id = primary_acc.id if primary_acc else account.id

    query = db.query(CompetitorPost).filter(CompetitorPost.competitor_id == target_comp_id)
    if top_only:
        query = query.filter(CompetitorPost.is_top_performer == True)

    posts = query.order_by(CompetitorPost.like_count.desc(), CompetitorPost.posted_at.desc()).all()

    result = []
    for p in posts:
        result.append({
            "id": p.id,
            "competitor_id": account.id,
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
            "posted_at": p.posted_at.strftime("%Y-%m-%dT%H:%M:%SZ") if p.posted_at else None,
            "instagram_url": f"https://www.instagram.com/p/{p.code}/" if p.code else None
        })

    payload = {
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
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


@router.get("/benchmark/matrix")
def get_benchmark_matrix(
    social_account_id: Optional[str] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """Comparative analytics matrix across tracked competitors. Cached 3 min in Redis."""
    from sqlalchemy import func
    _, workspace = ctx
    cache_key = f"competitors:benchmark:{workspace.id}:{social_account_id or 'all'}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    query = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id
    )
    if social_account_id:
        query = query.filter(CompetitorAccount.social_account_id == social_account_id)

    competitors = query.all()

    if not competitors:
        return {"matrix": [], "avg_industry_er": 0.0, "total_competitors": 0}

    matrix = []
    total_er = 0.0

    for c in competitors:
        total_er += c.engagement_rate
        primary_acc = _get_primary_competitor_account(db, c.username)
        target_id = primary_acc.id if primary_acc else c.id

        top_posts_count = db.query(func.count(CompetitorPost.id)).filter(
            CompetitorPost.competitor_id == target_id,
            CompetitorPost.is_top_performer == True
        ).scalar() or 0

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
    payload = {
        "matrix": sorted(matrix, key=lambda x: x["engagement_rate"], reverse=True),
        "avg_industry_er": avg_industry_er,
        "total_competitors": len(competitors)
    }
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


@router.get("/daily-feed")
def get_daily_feed(
    days: int = Query(1, ge=1, le=30),
    social_account_id: Optional[str] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    Get daily update feed across tracked competitor brands in workspace/account.
    Cached 3 min in Redis.
    """
    _, workspace = ctx
    cache_key = f"competitors:daily:{workspace.id}:{social_account_id or 'all'}:{days}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    comp_query = db.query(CompetitorAccount).filter(CompetitorAccount.workspace_id == workspace.id)
    if social_account_id:
        comp_query = comp_query.filter(CompetitorAccount.social_account_id == social_account_id)

    workspace_comps = comp_query.all()
    if not workspace_comps:
        return {"days": days, "is_fallback": False, "total_posts": 0, "active_brands_count": 0, "top_viral_post": None, "posts": []}

    username_map = {c.username: c for c in workspace_comps}
    tracked_usernames = list(username_map.keys())

    posts_query = db.query(CompetitorPost, CompetitorAccount).join(
        CompetitorAccount, CompetitorPost.competitor_id == CompetitorAccount.id
    ).filter(
        CompetitorAccount.username.in_(tracked_usernames)
    )

    recent_posts = posts_query.filter(
        CompetitorPost.posted_at >= cutoff_date
    ).order_by(CompetitorPost.posted_at.desc()).all()

    is_fallback = False
    if not recent_posts:
        recent_posts = posts_query.order_by(CompetitorPost.posted_at.desc()).limit(30).all()
        is_fallback = True

    result = []
    active_brands = set()
    top_viral_post = None
    max_er = -1.0

    for post, account_rel in recent_posts:
        display_acc = username_map.get(account_rel.username, account_rel)
        active_brands.add(display_acc.username)
        post_data = {
            "id": post.id,
            "competitor_id": display_acc.id,
            "username": display_acc.username,
            "full_name": display_acc.full_name,
            "profile_pic_url": display_acc.profile_pic_url,
            "is_verified": display_acc.is_verified,
            "instagram_media_id": post.instagram_media_id,
            "code": post.code,
            "post_type": post.post_type,
            "caption": post.caption,
            "thumbnail_url": post.thumbnail_url,
            "media_urls": post.media_urls or [],
            "like_count": post.like_count,
            "comment_count": post.comment_count,
            "engagement_rate": post.engagement_rate,
            "is_top_performer": post.is_top_performer,
            "posted_at": post.posted_at.strftime("%Y-%m-%dT%H:%M:%SZ") if post.posted_at else None,
            "instagram_url": f"https://www.instagram.com/p/{post.code}/" if post.code else None
        }
        result.append(post_data)
        if post.engagement_rate > max_er:
            max_er = post.engagement_rate
            top_viral_post = post_data

    payload = {
        "days": days,
        "is_fallback": is_fallback,
        "total_posts": len(result),
        "active_brands_count": len(active_brands),
        "top_viral_post": top_viral_post,
        "posts": result
    }
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


def _sync_one_brand(account_id: str, account_username: str, workspace_id: str) -> dict:
    """Worker function: syncs one brand in its own DB session with global DB cache reuse & staggered delay."""
    db = SessionLocal()
    try:
        account = db.query(CompetitorAccount).filter(CompetitorAccount.id == account_id).first()
        if not account:
            return {"username": account_username, "ok": False, "error": "Account not found"}

        # 1. Check if another workspace's competitor account was synced in last 6 hours
        cached_source = db.query(CompetitorAccount).filter(
            CompetitorAccount.username == account_username,
            CompetitorAccount.id != account_id,
            CompetitorAccount.last_synced_at >= datetime.utcnow() - timedelta(hours=6)
        ).order_by(CompetitorAccount.last_synced_at.desc()).first()

        if cached_source:
            logger.info(f"[sync-all worker] Reusing cached stats for @{account_username} without duplicating post rows")
            account.followers_count = cached_source.followers_count
            account.following_count = cached_source.following_count
            account.media_count = cached_source.media_count
            account.is_verified = cached_source.is_verified
            account.full_name = cached_source.full_name
            account.profile_pic_url = cached_source.profile_pic_url
            account.avg_likes = cached_source.avg_likes
            account.avg_comments = cached_source.avg_comments
            account.engagement_rate = cached_source.engagement_rate
            account.top_hashtags = cached_source.top_hashtags
            account.last_synced_at = datetime.utcnow()
            db.commit()
            return {"username": account_username, "ok": True, "cached": True}

        # 2. Otherwise add random delay (2-5s) to space out requests across workers
        time.sleep(random.uniform(2.0, 5.0))

        profile_data = instagrapi_service.fetch_competitor_profile(db, account_username)
        posts_data = instagrapi_service.fetch_competitor_posts(db, account_username, amount=20)

        primary_acc = _get_primary_competitor_account(db, account_username) or account
        target_comp_id = primary_acc.id

        # Replace master posts for primary account
        db.query(CompetitorPost).filter(CompetitorPost.competitor_id == target_comp_id).delete()

        for p in posts_data["posts"]:
            db.add(CompetitorPost(
                competitor_id=target_comp_id,
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
                posted_at=datetime.fromisoformat(p["posted_at"].rstrip("Z")) if p.get("posted_at") else datetime.utcnow()
            ))

        # Update stats across all competitor accounts for this username
        all_accounts = db.query(CompetitorAccount).filter(CompetitorAccount.username == account_username).all()
        for acc in all_accounts:
            acc.followers_count = profile_data["followers_count"]
            acc.following_count = profile_data["following_count"]
            acc.media_count = profile_data["media_count"]
            acc.is_verified = profile_data["is_verified"]
            acc.full_name = profile_data["full_name"]
            acc.profile_pic_url = profile_data["profile_pic_url"]
            acc.avg_likes = posts_data["avg_likes"]
            acc.avg_comments = posts_data["avg_comments"]
            acc.engagement_rate = posts_data["engagement_rate"]
            acc.top_hashtags = posts_data["top_hashtags"]
            acc.last_synced_at = datetime.utcnow()

        db.commit()
        return {"username": account_username, "ok": True}
    except Exception as e:
        db.rollback()
        logger.warning(f"[sync-all worker] @{account_username}: {e}")
        return {"username": account_username, "ok": False, "error": str(e)}
    finally:
        db.close()


def _run_sync_all_bg(workspace_id: str, social_account_id: Optional[str], accounts: list):
    """Background task: runs all brand syncs concurrently for selected IG account."""
    sync_key = f"{workspace_id}:{social_account_id or 'all'}"
    sync_status_set(sync_key, {
        "running": True, "done": 0, "total": len(accounts), "errors": []
    })

    errors = []
    max_workers = min(3, len(accounts))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(_sync_one_brand, acc["id"], acc["username"], workspace_id): acc
            for acc in accounts
        }
        for future in as_completed(futures):
            result = future.result()
            done = sync_status_increment_done(sync_key)
            if not result["ok"]:
                errors.append(f"@{result['username']}: {result.get('error', 'Unknown error')}")
                status = sync_status_get(sync_key) or {}
                status["errors"] = errors
                sync_status_set(sync_key, status)

    # Invalidate all caches for this workspace
    cache_delete_prefix(f"competitors:list:{workspace_id}")
    cache_delete_prefix(f"competitors:benchmark:{workspace_id}")
    cache_delete_prefix(f"competitors:daily:{workspace_id}")

    final_status = sync_status_get(sync_key) or {}
    final_status["running"] = False
    final_status["errors"] = errors
    sync_status_set(sync_key, final_status)

    logger.info(
        f"[sync-all] Workspace {workspace_id} (IG Account: {social_account_id or 'all'}): "
        f"{final_status.get('done', 0)}/{len(accounts)} synced, "
        f"{len(errors)} errors"
    )


@router.post("/sync-all")
def sync_all_competitors(
    background_tasks: BackgroundTasks,
    social_account_id: Optional[str] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    Non-blocking: Trigger parallel background refresh of competitors for selected IG account.
    Rate limited: 1x per 3 minutes per workspace / IG account.
    """
    _, workspace = ctx
    sync_key = f"{workspace.id}:{social_account_id or 'all'}"

    status = sync_status_get(sync_key)
    if status and status.get("running"):
        return {
            "status": "already_running",
            "message": f"Sync sedang berjalan: {status.get('done', 0)}/{status.get('total', 0)} brand selesai.",
        }

    # 3 min cooldown
    rate_key = f"sync:{sync_key}"
    is_limited, remaining = check_rate_limit(rate_key, _SYNC_COOLDOWN)
    if is_limited:
        minutes = round(remaining / 60, 1)
        return {
            "status": "cooldown",
            "message": f"Sync baru bisa dilakukan lagi dalam {minutes} menit.",
            "retry_after_seconds": remaining
        }

    query = db.query(CompetitorAccount.id, CompetitorAccount.username).filter(
        CompetitorAccount.workspace_id == workspace.id
    )
    if social_account_id:
        query = query.filter(CompetitorAccount.social_account_id == social_account_id)

    competitors = query.all()

    if not competitors:
        return {"status": "ok", "message": "Belum ada kompetitor yang dipantau untuk akun ini.", "synced_count": 0}

    accounts = [{"id": c[0], "username": c[1]} for c in competitors]

    set_rate_limit(rate_key, _SYNC_COOLDOWN)

    background_tasks.add_task(_run_sync_all_bg, workspace.id, social_account_id, accounts)

    return {
        "status": "started",
        "message": f"Sync dimulai untuk {len(accounts)} brand. Proses berjalan di background!",
        "total": len(accounts)
    }


@router.get("/sync-status")
def get_sync_status(
    social_account_id: Optional[str] = Query(None),
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
):
    """Poll background sync-all progress for selected IG account."""
    _, workspace = ctx
    sync_key = f"{workspace.id}:{social_account_id or 'all'}"
    status = sync_status_get(sync_key)
    if not status:
        return {"running": False, "done": 0, "total": 0, "errors": [], "message": "Tidak ada sync yang berjalan."}

    total = status.get("total", 0)
    done = status.get("done", 0)
    running = status.get("running", False)
    errors = status.get("errors", [])
    percent = round((done / total) * 100) if total > 0 else 0
    return {
        "running": running,
        "done": done,
        "total": total,
        "percent": percent,
        "errors": errors,
        "message": (
            f"Menyinkronisasi... {done}/{total} brand selesai ({percent}%)"
            if running else
            f"Sync selesai! {done}/{total} brand berhasil diperbarui."
        )
    }
