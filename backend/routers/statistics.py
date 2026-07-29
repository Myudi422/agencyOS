"""
Statistics Router — Shiera Analytics
Fetches social account feed + metrics from PostForMe API per workspace.
Supports per-account or aggregate views with date filtering.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import SocialAccount, AccountStatus, User
from backend.routers.firebase_auth import require_user, get_user_workspace
from backend.services.postforme_service import postforme_service

logger = logging.getLogger("StatisticsRouter")

router = APIRouter(prefix="/statistics", tags=["Statistics"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO 8601 string to timezone-aware datetime."""
    if not dt_str:
        return None
    try:
        # Handle Z suffix
        dt_str = dt_str.replace("Z", "+00:00")
        return datetime.fromisoformat(dt_str)
    except Exception:
        return None


def _safe_int(val: Any) -> int:
    """Safely cast a value to int."""
    try:
        return int(val or 0)
    except (TypeError, ValueError):
        return 0


def _aggregate_metrics(posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sum all numeric metrics across a list of posts."""
    totals: Dict[str, int] = {
        "likes": 0,
        "comments": 0,
        "shares": 0,
        "favorites": 0,
        "reach": 0,
        "video_views": 0,
        "new_followers": 0,
        "profile_views": 0,
        "website_clicks": 0,
        "impressions": 0,
        "engagement_likes": 0,
    }
    for post in posts:
        m = post.get("metrics") or {}
        totals["likes"] += _safe_int(m.get("likes"))
        totals["comments"] += _safe_int(m.get("comments"))
        totals["shares"] += _safe_int(m.get("shares"))
        totals["favorites"] += _safe_int(m.get("favorites"))
        totals["reach"] += _safe_int(m.get("reach"))
        totals["video_views"] += _safe_int(m.get("video_views"))
        totals["new_followers"] += _safe_int(m.get("new_followers"))
        totals["profile_views"] += _safe_int(m.get("profile_views"))
        totals["website_clicks"] += _safe_int(m.get("website_clicks"))
        totals["engagement_likes"] += _safe_int(m.get("engagement_likes"))
        # impression_sources / audience_* are nested objects, skip for aggregate
    totals["total_posts"] = len(posts)
    # Engagement rate = (likes + comments + shares) / max(reach, 1) * 100
    eng = totals["likes"] + totals["comments"] + totals["shares"]
    totals["engagement_rate"] = round(eng / max(totals["reach"], 1) * 100, 2)
    return totals


async def _fetch_all_posts_for_account(
    social_account_id: str,
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    limit_per_page: int = 50,
) -> List[Dict[str, Any]]:
    """
    Fetch all feed posts for one account using cursor-based pagination.
    Filters by posted_at if date range is provided.
    Stops fetching when posted_at < date_from (posts are newest-first).
    """
    all_posts: List[Dict[str, Any]] = []
    cursor: Optional[str] = None
    page = 0

    while True:
        page += 1
        try:
            data = await postforme_service.get_account_feed_paginated(
                social_account_id=social_account_id,
                limit=limit_per_page,
                cursor=cursor,
                expand_metrics=True,
            )
        except Exception as exc:
            logger.warning(
                f"Failed to fetch feed for account {social_account_id} page {page}: {exc}"
            )
            break

        items = data.get("items") or data.get("data") or []
        meta = data.get("meta") or {}

        for post in items:
            posted_at = _parse_iso(post.get("posted_at"))

            # If date_to filter and post is newer than date_to, skip
            if date_to and posted_at and posted_at > date_to:
                continue

            # If date_from filter and post is older than date_from, stop (desc order)
            if date_from and posted_at and posted_at < date_from:
                return all_posts  # Stop early — posts are newest-first

            all_posts.append(post)

        has_more = meta.get("has_more", False)
        cursor = meta.get("cursor")

        if not has_more or not cursor or page >= 20:  # Safety cap at 20 pages
            break

    return all_posts


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/accounts")
def get_statistics_accounts(
    workspace_id: str = Query(..., description="Workspace ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    Return list of connected social accounts in the workspace that have
    a platform_account_id (i.e. linked to PostForMe).
    Used to populate the account filter dropdown on the frontend.
    """
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
    account_ids: Optional[List[str]] = Query(
        None,
        description="List of internal social account IDs. If empty, fetch all workspace accounts.",
    ),
    date_from: Optional[str] = Query(None, description="ISO 8601 start date (e.g. 2025-07-01T00:00:00Z)"),
    date_to: Optional[str] = Query(None, description="ISO 8601 end date (e.g. 2025-07-31T23:59:59Z)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    """
    Aggregate social feed + metrics from PostForMe for one or all accounts.

    Strategy:
    1. Resolve accounts from workspace (or use provided account_ids subset)
    2. For each account, paginate PostForMe feed endpoint with expand=metrics
    3. Filter by posted_at within date range
    4. Aggregate metrics across all posts
    5. Return structured response: accounts summary, aggregated totals, per-post list
    """
    get_user_workspace(current_user, workspace_id, db)

    # Parse date range
    dt_from = _parse_iso(date_from)
    dt_to = _parse_iso(date_to)

    # Default: today if no date provided
    if not dt_from and not dt_to:
        now = datetime.now(tz=timezone.utc)
        dt_from = now.replace(hour=0, minute=0, second=0, microsecond=0)
        dt_to = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Fetch accounts from DB
    query = db.query(SocialAccount).filter(
        SocialAccount.workspace_id == workspace_id,
        SocialAccount.status == AccountStatus.CONNECTED,
        SocialAccount.platform_account_id.isnot(None),
    )
    if account_ids:
        query = query.filter(SocialAccount.id.in_(account_ids))

    accounts = query.all()

    if not accounts:
        return {
            "accounts": [],
            "aggregated": _aggregate_metrics([]),
            "posts": [],
            "date_from": date_from,
            "date_to": date_to,
            "period_label": _period_label(dt_from, dt_to),
        }

    # Fetch all posts concurrently per account (bounded concurrency)
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent API calls

    async def fetch_with_semaphore(account: SocialAccount):
        async with semaphore:
            posts = await _fetch_all_posts_for_account(
                social_account_id=account.platform_account_id,
                date_from=dt_from,
                date_to=dt_to,
            )
            return account, posts

    results = await asyncio.gather(
        *[fetch_with_semaphore(acc) for acc in accounts],
        return_exceptions=True,
    )

    # Build response
    all_posts: List[Dict[str, Any]] = []
    account_summaries: List[Dict[str, Any]] = []

    for result in results:
        if isinstance(result, Exception):
            logger.warning(f"Account fetch error: {result}")
            continue

        account, posts = result
        account_metrics = _aggregate_metrics(posts)

        account_summaries.append({
            "id": account.id,
            "platform_account_id": account.platform_account_id,
            "platform": account.platform.value,
            "name": account.name,
            "username": account.username,
            "avatar_url": account.avatar_url,
            "followers_count": account.followers_count,
            "metrics": account_metrics,
            "post_count": len(posts),
        })

        # Enrich each post with account info
        for post in posts:
            post["_account_id"] = account.id
            post["_account_name"] = account.name
            post["_account_username"] = account.username
            post["_platform"] = account.platform.value
            post["_avatar_url"] = account.avatar_url
            all_posts.append(post)

    # Sort posts by posted_at desc
    all_posts.sort(
        key=lambda p: _parse_iso(p.get("posted_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )

    # Compute daily breakdown for charts (group by date)
    daily_data = _compute_daily_breakdown(all_posts)

    # Top posts by engagement
    def engagement_score(p: Dict[str, Any]) -> int:
        m = p.get("metrics") or {}
        return _safe_int(m.get("likes")) + _safe_int(m.get("comments")) + _safe_int(m.get("shares"))

    top_posts = sorted(all_posts, key=engagement_score, reverse=True)[:10]

    return {
        "accounts": account_summaries,
        "aggregated": _aggregate_metrics(all_posts),
        "posts": all_posts[:100],  # Cap at 100 posts for response size
        "top_posts": top_posts,
        "daily_breakdown": daily_data,
        "date_from": date_from or dt_from.isoformat(),
        "date_to": date_to or dt_to.isoformat(),
        "period_label": _period_label(dt_from, dt_to),
        "total_accounts_fetched": len(account_summaries),
    }


def _period_label(dt_from: Optional[datetime], dt_to: Optional[datetime]) -> str:
    """Generate human-readable period label."""
    if not dt_from or not dt_to:
        return "Semua Waktu"
    from_str = dt_from.strftime("%d %b %Y")
    to_str = dt_to.strftime("%d %b %Y")
    if from_str == to_str:
        return f"Hari ini ({from_str})"
    return f"{from_str} – {to_str}"


def _compute_daily_breakdown(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group posts by date and aggregate metrics per day."""
    daily: Dict[str, Dict[str, Any]] = {}

    for post in posts:
        posted_at = _parse_iso(post.get("posted_at"))
        if not posted_at:
            continue
        day_key = posted_at.strftime("%Y-%m-%d")
        if day_key not in daily:
            daily[day_key] = {
                "date": day_key,
                "posts": 0,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "reach": 0,
                "video_views": 0,
            }
        m = post.get("metrics") or {}
        daily[day_key]["posts"] += 1
        daily[day_key]["likes"] += _safe_int(m.get("likes"))
        daily[day_key]["comments"] += _safe_int(m.get("comments"))
        daily[day_key]["shares"] += _safe_int(m.get("shares"))
        daily[day_key]["reach"] += _safe_int(m.get("reach"))
        daily[day_key]["video_views"] += _safe_int(m.get("video_views"))

    return sorted(daily.values(), key=lambda d: d["date"])
