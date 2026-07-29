"""
Statistics Router — Shiera Analytics
Fetches social account feed + metrics from PostForMe API per workspace.
Supports per-account or aggregate views with date filtering.

PostForMe feed response format:
  { data: [...], meta: { cursor, limit, next, has_more } }

Platform-specific metric field names (normalized here):
  TikTok:          like_count, comment_count, share_count, view_count
  TikTok Business: like_count, comment_count, share_count, view_count
  Instagram:       likes, comments, shares, reach, video_views, new_followers
  Facebook:        likes, comments, shares, reach, video_views (capped 10/page with metrics)
  YouTube:         likes, comments, video_views
  X (Twitter):     likes, replies, retweets, impressions
  Threads:         likes, replies, reposts, views
  Bluesky:         likes, reposts, replies  (no views)
  Pinterest:       saves, pin_clicks, impressions, engagements
  LinkedIn:        likes, comments, shares, impressions, clicks
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import SocialAccount, AccountStatus, User
from backend.routers.firebase_auth import require_user, get_user_workspace
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("StatisticsRouter")

router = APIRouter(prefix="/statistics", tags=["Statistics"])


# ─── Metric Normalization ──────────────────────────────────────────────────────

def _safe_int(val: Any) -> int:
    try:
        return int(val or 0)
    except (TypeError, ValueError):
        return 0


def _normalize_metrics(raw_metrics: Optional[Dict[str, Any]], platform: str) -> Dict[str, int]:
    """
    Normalize platform-specific metric field names to a unified schema.
    PostForMe returns platform-native field names inside the metrics object.
    """
    if not raw_metrics:
        return {}

    m = raw_metrics

    # TikTok & TikTok Business: like_count, comment_count, share_count, view_count
    if platform in ("tiktok", "tiktok_business"):
        return {
            "likes":            _safe_int(m.get("like_count") or m.get("likes")),
            "comments":         _safe_int(m.get("comment_count") or m.get("comments")),
            "shares":           _safe_int(m.get("share_count") or m.get("shares")),
            "video_views":      _safe_int(m.get("view_count") or m.get("video_views")),
            "reach":            _safe_int(m.get("reach")),
            "favorites":        _safe_int(m.get("favorites")),
            "new_followers":    _safe_int(m.get("new_followers")),
            "profile_views":    _safe_int(m.get("profile_views")),
            "website_clicks":   _safe_int(m.get("website_clicks")),
            "engagement_likes": _safe_int(m.get("engagement_likes")),
        }

    # X (Twitter): likes, replies, retweets, impressions
    if platform == "x":
        return {
            "likes":            _safe_int(m.get("likes")),
            "comments":         _safe_int(m.get("replies") or m.get("comments")),
            "shares":           _safe_int(m.get("retweets") or m.get("shares")),
            "reach":            _safe_int(m.get("impressions") or m.get("reach")),
            "video_views":      _safe_int(m.get("video_views")),
            "favorites":        _safe_int(m.get("bookmarks") or m.get("favorites")),
            "new_followers":    _safe_int(m.get("new_followers")),
            "profile_views":    _safe_int(m.get("profile_views")),
            "website_clicks":   _safe_int(m.get("url_clicks") or m.get("website_clicks")),
            "engagement_likes": _safe_int(m.get("engagement_likes")),
        }

    # Pinterest: saves, pin_clicks, impressions, engagements
    if platform == "pinterest":
        return {
            "likes":            _safe_int(m.get("saves") or m.get("likes")),
            "comments":         _safe_int(m.get("comments")),
            "shares":           _safe_int(m.get("pin_clicks") or m.get("shares")),
            "reach":            _safe_int(m.get("impressions") or m.get("reach")),
            "video_views":      _safe_int(m.get("video_views")),
            "favorites":        _safe_int(m.get("saves") or m.get("favorites")),
            "new_followers":    _safe_int(m.get("new_followers")),
            "profile_views":    _safe_int(m.get("profile_views")),
            "website_clicks":   _safe_int(m.get("outbound_clicks") or m.get("website_clicks")),
            "engagement_likes": _safe_int(m.get("engagements") or m.get("engagement_likes")),
        }

    # Threads: likes, replies, reposts, views
    if platform == "threads":
        return {
            "likes":            _safe_int(m.get("likes")),
            "comments":         _safe_int(m.get("replies") or m.get("comments")),
            "shares":           _safe_int(m.get("reposts") or m.get("shares")),
            "reach":            _safe_int(m.get("reach") or m.get("views")),
            "video_views":      _safe_int(m.get("video_views")),
            "favorites":        _safe_int(m.get("quotes") or m.get("favorites")),
            "new_followers":    _safe_int(m.get("new_followers")),
            "profile_views":    _safe_int(m.get("profile_views")),
            "website_clicks":   _safe_int(m.get("website_clicks")),
            "engagement_likes": _safe_int(m.get("engagement_likes")),
        }

    # Default: Instagram / Facebook / YouTube / LinkedIn / Bluesky
    return {
        "likes":            _safe_int(m.get("likes")),
        "comments":         _safe_int(m.get("comments")),
        "shares":           _safe_int(m.get("shares")),
        "reach":            _safe_int(m.get("reach")),
        "video_views":      _safe_int(m.get("video_views")),
        "favorites":        _safe_int(m.get("favorites") or m.get("saves")),
        "new_followers":    _safe_int(m.get("new_followers")),
        "profile_views":    _safe_int(m.get("profile_views")),
        "website_clicks":   _safe_int(m.get("website_clicks")),
        "engagement_likes": _safe_int(m.get("engagement_likes")),
    }


def _sum_metrics(posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sum normalized metrics across all posts."""
    totals: Dict[str, int] = {
        "likes": 0, "comments": 0, "shares": 0, "favorites": 0,
        "reach": 0, "video_views": 0, "new_followers": 0,
        "profile_views": 0, "website_clicks": 0, "engagement_likes": 0,
    }
    for post in posts:
        nm = post.get("_normalized_metrics") or {}
        for key in totals:
            totals[key] += nm.get(key, 0)
    totals["total_posts"] = len(posts)
    eng = totals["likes"] + totals["comments"] + totals["shares"]
    totals["engagement_rate"] = round(eng / max(totals["reach"], 1) * 100, 2)
    return totals


def _parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None


# ─── Pagination ────────────────────────────────────────────────────────────────

async def _fetch_all_posts_for_account(
    social_account_id: str,
    platform: str,
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    limit_per_page: int = 50,
) -> List[Dict[str, Any]]:
    """
    Fetch ALL feed posts for one account via cursor-based pagination.
    Does NOT stop early on date — fetches all pages then filters.
    This is required because the API does NOT guarantee descending order.

    Notes:
    - Facebook with expand=metrics is server-capped at ~10 per page by PostForMe.
    - Safety limit: max 40 pages × 50 = 2000 posts per account.
    """
    all_posts: List[Dict[str, Any]] = []
    cursor: Optional[str] = None
    page = 0
    max_pages = 40

    while True:
        page += 1
        try:
            resp = await postforme_service.get_account_feed_paginated(
                social_account_id=social_account_id,
                limit=limit_per_page,
                cursor=cursor,
                expand_metrics=True,
            )
        except Exception as exc:
            logger.warning(f"Feed fetch error [{platform} / {social_account_id}] page {page}: {exc}")
            break

        # API response: { data: [...], meta: { cursor, limit, next, has_more } }
        items: List[Dict] = resp.get("data") or resp.get("items") or []
        meta: Dict = resp.get("meta") or {}

        logger.info(
            f"[{platform}] acc={social_account_id} page={page} "
            f"items={len(items)} has_more={meta.get('has_more')} cursor={meta.get('cursor', '')[:20]}"
        )

        for post in items:
            posted_at = _parse_iso(post.get("posted_at"))

            # Date filter
            if date_from and posted_at and posted_at < date_from:
                continue
            if date_to and posted_at and posted_at > date_to:
                continue

            # Normalize & cache metrics
            raw_m = post.get("metrics") or {}
            post["_normalized_metrics"] = _normalize_metrics(raw_m, platform)
            all_posts.append(post)

        has_more = meta.get("has_more", False)
        cursor = meta.get("cursor")

        if not has_more or not cursor or page >= max_pages:
            break

    logger.info(f"[{platform}] acc={social_account_id} => {len(all_posts)} posts in date range")
    return all_posts


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/accounts")
def get_statistics_accounts(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """List connected social accounts for the filter dropdown."""
    get_user_workspace(current_user, workspace_id, db)
    accounts = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.workspace_id == workspace_id,
            SocialAccount.status == AccountStatus.CONNECTED,
            SocialAccount.platform_account_id.isnot(None),
        )
        .order_by(SocialAccount.platform)
        .all()
    )
    return [
        {
            "id": a.id,
            "platform_account_id": a.platform_account_id,
            "platform": a.platform.value,
            "name": a.name,
            "username": a.username,
            "avatar_url": a.avatar_url,
            "followers_count": a.followers_count,
        }
        for a in accounts
    ]


@router.get("/feed")
async def get_statistics_feed(
    workspace_id: str = Query(..., description="Workspace ID"),
    account_ids: Optional[List[str]] = Query(None, description="Internal account IDs to filter"),
    date_from: Optional[str] = Query(None, description="ISO 8601 start date"),
    date_to: Optional[str] = Query(None, description="ISO 8601 end date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    Aggregate feed + metrics for workspace accounts.
    - Paginates all PostForMe pages per account
    - Normalizes platform-specific metric field names
    - Filters by posted_at date range
    - Returns accounts, aggregated metrics, posts, top posts, daily breakdown
    """
    get_user_workspace(current_user, workspace_id, db)

    dt_from = _parse_iso(date_from)
    dt_to = _parse_iso(date_to)

    if not dt_from and not dt_to:
        now = datetime.now(tz=timezone.utc)
        dt_from = now.replace(hour=0, minute=0, second=0, microsecond=0)
        dt_to = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Load accounts
    q = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == workspace_id,
        SocialAccount.status == AccountStatus.CONNECTED,
        SocialAccount.platform_account_id.isnot(None),
    )
    if account_ids:
        q = q.filter(SocialAccount.id.in_(account_ids))
    accounts = q.all()

    if not accounts:
        return {
            "accounts": [], "aggregated": _sum_metrics([]),
            "posts": [], "top_posts": [], "daily_breakdown": [],
            "date_from": date_from or "", "date_to": date_to or "",
            "period_label": _period_label(dt_from, dt_to),
            "total_accounts_fetched": 0,
        }

    # Concurrent fetch with rate limiting
    semaphore = asyncio.Semaphore(5)

    async def _fetch(account: SocialAccount):
        async with semaphore:
            posts = await _fetch_all_posts_for_account(
                social_account_id=account.platform_account_id,
                platform=account.platform.value,
                date_from=dt_from,
                date_to=dt_to,
            )
            return account, posts

    results = await asyncio.gather(*[_fetch(a) for a in accounts], return_exceptions=True)

    all_posts: List[Dict[str, Any]] = []
    account_summaries: List[Dict[str, Any]] = []

    for result in results:
        if isinstance(result, Exception):
            logger.warning(f"Account gather error: {result}")
            continue

        account, posts = result
        platform = account.platform.value

        for post in posts:
            post["_account_id"] = account.id
            post["_account_name"] = account.name
            post["_account_username"] = account.username
            post["_platform"] = platform
            post["_avatar_url"] = account.avatar_url
            # Expose normalized metrics as the main metrics field for frontend
            post["metrics"] = post.get("_normalized_metrics") or {}
            all_posts.append(post)

        account_summaries.append({
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "platform": platform,
            "name": account.name,
            "username": account.username,
            "avatar_url": account.avatar_url,
            "followers_count": account.followers_count,
            "metrics": _sum_metrics(posts),
            "post_count": len(posts),
        })

    # Sort newest-first
    all_posts.sort(
        key=lambda p: _parse_iso(p.get("posted_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )

    # Top 10 by engagement
    def _eng(p: Dict) -> int:
        m = p.get("metrics") or {}
        return m.get("likes", 0) + m.get("comments", 0) + m.get("shares", 0)

    top_posts = sorted(all_posts, key=_eng, reverse=True)[:10]

    return {
        "accounts": account_summaries,
        "aggregated": _sum_metrics(all_posts),
        "posts": all_posts[:200],
        "top_posts": top_posts,
        "daily_breakdown": _compute_daily_breakdown(all_posts),
        "date_from": date_from or dt_from.isoformat(),
        "date_to": date_to or dt_to.isoformat(),
        "period_label": _period_label(dt_from, dt_to),
        "total_accounts_fetched": len(account_summaries),
    }


def _period_label(dt_from: Optional[datetime], dt_to: Optional[datetime]) -> str:
    if not dt_from or not dt_to:
        return "Semua Waktu"
    f = dt_from.strftime("%d %b %Y")
    t = dt_to.strftime("%d %b %Y")
    return f"Hari ini ({f})" if f == t else f"{f} – {t}"


def _compute_daily_breakdown(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    daily: Dict[str, Dict[str, Any]] = {}
    for post in posts:
        posted_at = _parse_iso(post.get("posted_at"))
        if not posted_at:
            continue
        day_key = posted_at.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = {"date": day_key, "posts": 0, "likes": 0,
                              "comments": 0, "shares": 0, "reach": 0, "video_views": 0}
        m = post.get("metrics") or {}
        daily[day_key]["posts"] += 1
        daily[day_key]["likes"] += m.get("likes", 0)
        daily[day_key]["comments"] += m.get("comments", 0)
        daily[day_key]["shares"] += m.get("shares", 0)
        daily[day_key]["reach"] += m.get("reach", 0)
        daily[day_key]["video_views"] += m.get("video_views", 0)
    return sorted(daily.values(), key=lambda d: d["date"])
