"""
Competitor Spy Router — /competitors
Endpoints for tracking competitor Instagram accounts, syncing profile stats,
fetching top performing posts, and retrieving benchmark comparison matrices.

Performance optimizations:
- sync-all runs in a background thread pool (non-blocking, concurrent per brand)
- daily-feed and benchmark/matrix responses are cached in Upstash Redis (5 min TTL)
- sync status stored in Redis — shared across all worker processes/instances
- rate limiting: 30 menit cooldown per workspace for sync-all
- graceful fallback ke in-memory jika Redis tidak available
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import time

from backend.database import get_db, SessionLocal
from backend.models.models import (
    User, Workspace, WorkspaceMember, CompetitorAccount, CompetitorPost, ActivityLog
)
from backend.services.firebase_service import verify_firebase_token
from backend.services.instagrapi_service import instagrapi_service
from backend.services.redis_service import (
    cache_get, cache_set, cache_delete_prefix,
    sync_status_get, sync_status_set, sync_status_increment_done,
    check_rate_limit, set_rate_limit
)

logger = logging.getLogger("CompetitorsRouter")
router = APIRouter(prefix="/competitors", tags=["Competitor Spy"])

# TTL values
_CACHE_TTL = 300       # 5 minutes for list/benchmark/daily-feed
_SYNC_COOLDOWN = 1800  # 30 minutes cooldown between sync-all runs per workspace




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
    """List all tracked competitors for active workspace. Cached 5 min in Redis."""
    _, workspace = ctx
    cache_key = f"competitors:list:{workspace.id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    from sqlalchemy import func
    # Single query with aggregated post count to avoid N+1 queries
    competitors = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id
    ).order_by(CompetitorAccount.followers_count.desc()).all()

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
            "posts_count": post_counts.get(c.id, 0)
        })

    payload = {"competitors": result, "total": len(result)}
    cache_set(cache_key, payload, ttl_seconds=_CACHE_TTL)
    return payload


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
    """Comparative analytics matrix across all tracked competitors. Cached 5 min in Redis."""
    from sqlalchemy import func
    _, workspace = ctx
    cache_key = f"competitors:benchmark:{workspace.id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    competitors = db.query(CompetitorAccount).filter(
        CompetitorAccount.workspace_id == workspace.id
    ).all()

    if not competitors:
        return {"matrix": [], "avg_industry_er": 0.0, "total_competitors": 0}

    # Batch top-performer counts in a single query instead of per-competitor query
    competitor_ids = [c.id for c in competitors]
    top_posts_rows = db.query(
        CompetitorPost.competitor_id, func.count(CompetitorPost.id)
    ).filter(
        CompetitorPost.competitor_id.in_(competitor_ids),
        CompetitorPost.is_top_performer == True
    ).group_by(CompetitorPost.competitor_id).all()
    top_posts_map = {r[0]: r[1] for r in top_posts_rows}

    matrix = []
    total_er = 0.0

    for c in competitors:
        total_er += c.engagement_rate
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
            "top_posts_count": top_posts_map.get(c.id, 0),
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
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    Get daily update feed across ALL tracked competitor brands in the workspace.
    Filters posts created within the last N days (default: 1 day / last 24h).
    Cached per (workspace_id, days) in Redis for 5 minutes.
    """
    _, workspace = ctx
    cache_key = f"competitors:daily:{workspace.id}:{days}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Single optimized JOIN query with ordering — no N+1
    posts_query = db.query(CompetitorPost, CompetitorAccount).join(
        CompetitorAccount, CompetitorPost.competitor_id == CompetitorAccount.id
    ).filter(
        CompetitorAccount.workspace_id == workspace.id
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

    for post, account in recent_posts:
        active_brands.add(account.username)
        post_data = {
            "id": post.id,
            "competitor_id": account.id,
            "username": account.username,
            "full_name": account.full_name,
            "profile_pic_url": account.profile_pic_url,
            "is_verified": account.is_verified,
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
            "posted_at": post.posted_at.isoformat() if post.posted_at else None,
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
    """
    Worker function: syncs one brand in its own DB session.
    Called concurrently via ThreadPoolExecutor.
    """
    db = SessionLocal()
    try:
        account = db.query(CompetitorAccount).filter(CompetitorAccount.id == account_id).first()
        if not account:
            return {"username": account_username, "ok": False, "error": "Account not found"}

        profile_data = instagrapi_service.fetch_competitor_profile(db, account_username)
        account.followers_count = profile_data["followers_count"]
        account.following_count = profile_data["following_count"]
        account.media_count = profile_data["media_count"]
        account.is_verified = profile_data["is_verified"]
        account.full_name = profile_data["full_name"]
        account.profile_pic_url = profile_data["profile_pic_url"]

        posts_data = instagrapi_service.fetch_competitor_posts(db, account_username, amount=20)
        account.avg_likes = posts_data["avg_likes"]
        account.avg_comments = posts_data["avg_comments"]
        account.engagement_rate = posts_data["engagement_rate"]
        account.top_hashtags = posts_data["top_hashtags"]
        account.last_synced_at = datetime.utcnow()

        db.query(CompetitorPost).filter(CompetitorPost.competitor_id == account.id).delete()
        for p in posts_data["posts"]:
            db.add(CompetitorPost(
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
            ))
        db.commit()
        return {"username": account_username, "ok": True}
    except Exception as e:
        db.rollback()
        logger.warning(f"[sync-all worker] @{account_username}: {e}")
        return {"username": account_username, "ok": False, "error": str(e)}
    finally:
        db.close()


def _run_sync_all_bg(workspace_id: str, accounts: list):
    """Background task: runs all brand syncs concurrently using thread pool."""
    sync_status_set(workspace_id, {
        "running": True, "done": 0, "total": len(accounts), "errors": []
    })

    errors = []
    # Max 3 concurrent Instagram requests to avoid rate-limiting / IP ban
    max_workers = min(3, len(accounts))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(_sync_one_brand, acc["id"], acc["username"], workspace_id): acc
            for acc in accounts
        }
        for future in as_completed(futures):
            result = future.result()
            done = sync_status_increment_done(workspace_id)
            if not result["ok"]:
                errors.append(f"@{result['username']}: {result.get('error', 'Unknown error')}")
                # Update errors list in Redis
                status = sync_status_get(workspace_id) or {}
                status["errors"] = errors
                sync_status_set(workspace_id, status)

    # Invalidate all caches for this workspace → fresh data served after sync
    cache_delete_prefix(f"competitors:list:{workspace_id}")
    cache_delete_prefix(f"competitors:benchmark:{workspace_id}")
    cache_delete_prefix(f"competitors:daily:{workspace_id}")

    # Mark sync complete
    final_status = sync_status_get(workspace_id) or {}
    final_status["running"] = False
    final_status["errors"] = errors
    sync_status_set(workspace_id, final_status)

    logger.info(
        f"[sync-all] Workspace {workspace_id}: "
        f"{final_status.get('done', 0)}/{len(accounts)} synced, "
        f"{len(errors)} errors"
    )


@router.post("/sync-all")
def sync_all_competitors(
    background_tasks: BackgroundTasks,
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: Session = Depends(get_db)
):
    """
    Non-blocking: Trigger parallel background refresh of ALL competitors in workspace.
    Returns immediately. Poll GET /sync-status to check progress.
    Rate limited: 1x per 30 minutes per workspace.
    """
    _, workspace = ctx

    # 1. Check if sync is already running
    status = sync_status_get(workspace.id)
    if status and status.get("running"):
        return {
            "status": "already_running",
            "message": f"Sync sedang berjalan: {status.get('done', 0)}/{status.get('total', 0)} brand selesai.",
        }

    # 2. Check rate limit cooldown (30 menit)
    rate_key = f"sync:{workspace.id}"
    is_limited, remaining = check_rate_limit(rate_key, _SYNC_COOLDOWN)
    if is_limited:
        minutes = remaining // 60
        return {
            "status": "cooldown",
            "message": f"Sync baru bisa dilakukan lagi dalam {minutes} menit.",
            "retry_after_seconds": remaining
        }

    competitors = db.query(
        CompetitorAccount.id, CompetitorAccount.username
    ).filter(
        CompetitorAccount.workspace_id == workspace.id
    ).all()

    if not competitors:
        return {"status": "ok", "message": "Belum ada kompetitor yang dipantau.", "synced_count": 0}

    accounts = [{"id": c[0], "username": c[1]} for c in competitors]

    # 3. Set rate limit before starting
    set_rate_limit(rate_key, _SYNC_COOLDOWN)

    background_tasks.add_task(_run_sync_all_bg, workspace.id, accounts)

    return {
        "status": "started",
        "message": f"Sync dimulai untuk {len(accounts)} brand. Proses berjalan di background!",
        "total": len(accounts)
    }


@router.get("/sync-status")
def get_sync_status(
    ctx: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
):
    """Poll this endpoint to check background sync-all progress. Status stored in Redis."""
    _, workspace = ctx
    status = sync_status_get(workspace.id)
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
