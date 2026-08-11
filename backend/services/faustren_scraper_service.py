"""
FaustRen Scraper Service — Instagram Scraper using instagram-posts-scraper library (InstaPeriodScraper).
No login required for fetching public user profiles and recent posts.
Supports optional Residential Proxy routing and headless profile enrichment.
"""

import json
import re
import random
import logging
from typing import Optional, Dict, Any, List
from collections import Counter
from datetime import datetime
import requests
from sqlalchemy.orm import Session

from backend.models.models import Setting

logger = logging.getLogger("FaustRenScraper")

GLOBAL_WS_ID = "global"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

class FaustRenScraperService:
    def __init__(self):
        pass

    def get_proxy_config(self, db: Optional[Session] = None, override_proxy_url: Optional[str] = None) -> Optional[Dict[str, str]]:
        """Fetch configured Residential Proxy setting from DB or parameters."""
        if override_proxy_url:
            proxy_url = override_proxy_url.strip()
            if proxy_url:
                return {"http": proxy_url, "https": proxy_url}

        if db:
            enabled_row = db.query(Setting).filter(
                Setting.workspace_id == GLOBAL_WS_ID,
                Setting.key == "PROXY_ENABLED"
            ).first()

            url_row = db.query(Setting).filter(
                Setting.workspace_id == GLOBAL_WS_ID,
                Setting.key.in_(["PROXY_URL", "PROXY_CONNECTION_STRING"])
            ).first()

            if enabled_row and str(enabled_row.value).lower() in ["true", "1", "yes"]:
                if url_row and url_row.value:
                    p_url = str(url_row.value).strip()
                    if p_url:
                        return {"http": p_url, "https": p_url}

        return None

    def test_proxy_connection(self, proxy_url: str) -> Dict[str, Any]:
        """Test proxy connectivity by querying public IP checkers."""
        clean_proxy = proxy_url.strip()
        if not clean_proxy:
            return {"success": False, "message": "URL Proxy tidak boleh kosong."}

        proxies = {"http": clean_proxy, "https": clean_proxy}
        try:
            resp = requests.get("https://api.ipify.org?format=json", proxies=proxies, timeout=10)
            if resp.status_code == 200:
                ip_data = resp.json()
                return {
                    "success": True,
                    "ip": ip_data.get("ip", "Unknown"),
                    "message": f"Proxy Aktif! IP terdeteksi: {ip_data.get('ip')}"
                }
            else:
                return {
                    "success": False,
                    "message": f"Proxy merespon dengan status code HTTP {resp.status_code}"
                }
        except Exception as e:
            logger.error(f"Test proxy error: {e}")
            return {
                "success": False,
                "message": f"Gagal terhubung ke Proxy: {str(e)}"
            }

    def fetch_competitor_data(self, db: Session, username: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch profile & recent posts using FaustRen InstaPeriodScraper module
        with fallback to web profile API.
        """
        clean_user = username.strip().lstrip("@").lower()

        # 1. Try importing official InstaPeriodScraper class from instagram_posts_scraper
        try:
            from instagram_posts_scraper.instagram_posts_scraper import InstaPeriodScraper
            # use_profile_scraper=False runs light HTML request without Selenium binary overhead
            scraper = InstaPeriodScraper(use_profile_scraper=False)
            res = scraper.get_posts(target_info={"username": clean_user, "days_limit": 30})

            if res and isinstance(res, dict) and "profile" in res:
                prof = res.get("profile", {})
                raw_posts = res.get("posts", [])[:amount]

                followers_count = prof.get("followers", 0) or 0
                parsed_posts = []
                total_likes = 0
                total_comments = 0
                hashtags_list = []

                for p in raw_posts:
                    code = p.get("shortcode", "")
                    caption = p.get("caption", "") or ""
                    found_hashtags = re.findall(r"#(\w+)", caption)
                    hashtags_list.extend([h.lower() for h in found_hashtags])

                    thumb = p.get("thumbnail") or p.get("image_url") or ""
                    likes = p.get("like_count", 0) or 0
                    comments = p.get("comment_count", 0) or 0
                    total_likes += likes
                    total_comments += comments

                    post_er = round(((likes + comments) / max(followers_count, 1)) * 100, 2)
                    ts = p.get("timestamp")
                    posted_at = None
                    if ts:
                        posted_at = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ")

                    parsed_posts.append({
                        "instagram_media_id": code,
                        "code": code,
                        "post_type": "video" if p.get("is_video") else "image",
                        "caption": caption,
                        "thumbnail_url": thumb,
                        "media_urls": [thumb] if thumb else [],
                        "like_count": likes,
                        "comment_count": comments,
                        "engagement_rate": post_er,
                        "posted_at": posted_at,
                    })

                count = len(parsed_posts)
                avg_likes = round(total_likes / count, 1) if count > 0 else 0.0
                avg_comments = round(total_comments / count, 1) if count > 0 else 0.0
                overall_er = round(((avg_likes + avg_comments) / max(followers_count, 1)) * 100, 2)

                threshold_er = overall_er * 1.3
                for p in parsed_posts:
                    p["is_top_performer"] = (p["engagement_rate"] >= threshold_er) or (p["like_count"] >= avg_likes * 1.5 and count >= 3)

                top_hashtags = [item[0] for item in Counter(hashtags_list).most_common(10)]

                return {
                    "profile": {
                        "username": clean_user,
                        "instagram_pk": str(prof.get("userid") or ""),
                        "full_name": prof.get("full_name") or clean_user,
                        "profile_pic_url": prof.get("profile_picture") or "",
                        "biography": prof.get("biography", ""),
                        "followers_count": followers_count,
                        "following_count": prof.get("following", 0) or 0,
                        "media_count": prof.get("posts_count", 0) or 0,
                        "is_verified": False,
                        "category_name": "",
                    },
                    "posts": parsed_posts,
                    "avg_likes": avg_likes,
                    "avg_comments": avg_comments,
                    "engagement_rate": overall_er,
                    "top_hashtags": top_hashtags,
                    "total_posts_scraped": count
                }
        except Exception as e_mod:
            logger.warning(f"InstaPeriodScraper module fetch failed for @{clean_user}: {e_mod}. Trying direct HTTP endpoint...")

        # 2. Fallback to direct web API endpoint with proxy
        return self._fetch_via_web_api(db, clean_user, amount=amount, override_proxy=override_proxy)

    def _fetch_via_web_api(self, db: Session, clean_user: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Direct web API scraper fallback with proxy support."""
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "X-IG-App-ID": "936619743392459",
            "Referer": "https://www.instagram.com/",
        }
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={clean_user}"

        resp = requests.get(url, headers=headers, proxies=proxies, timeout=12)
        if resp.status_code == 404:
            raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")
        if resp.status_code != 200:
            raise RuntimeError(f"Instagram HTTP {resp.status_code}")

        data = resp.json()
        user_data = data.get("data", {}).get("user") or {}
        followers_count = user_data.get("edge_followed_by", {}).get("count", 1) or 1
        edges = user_data.get("edge_owner_to_timeline_media", {}).get("edges", [])[:amount]

        parsed_posts = []
        total_likes = 0
        total_comments = 0
        hashtags_list = []

        for edge in edges:
            node = edge.get("node", {})
            media_id = str(node.get("id", ""))
            code = str(node.get("shortcode", ""))
            is_video = node.get("is_video", False)

            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption_text = caption_edges[0].get("node", {}).get("text", "") if caption_edges else ""

            found_hashtags = re.findall(r"#(\w+)", caption_text)
            hashtags_list.extend([h.lower() for h in found_hashtags])

            thumbnail_url = node.get("display_url") or node.get("thumbnail_src") or ""
            like_count = node.get("edge_liked_by", {}).get("count", 0) or 0
            comment_count = node.get("edge_media_to_comment", {}).get("count", 0) or 0

            total_likes += like_count
            total_comments += comment_count
            post_er = round(((like_count + comment_count) / max(followers_count, 1)) * 100, 2)

            ts = node.get("taken_at_timestamp")
            posted_at = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ") if ts else None

            parsed_posts.append({
                "instagram_media_id": media_id,
                "code": code,
                "post_type": "video" if is_video else "image",
                "caption": caption_text,
                "thumbnail_url": thumbnail_url,
                "media_urls": [thumbnail_url] if thumbnail_url else [],
                "like_count": like_count,
                "comment_count": comment_count,
                "engagement_rate": post_er,
                "posted_at": posted_at,
            })

        count = len(parsed_posts)
        avg_likes = round(total_likes / count, 1) if count > 0 else 0.0
        avg_comments = round(total_comments / count, 1) if count > 0 else 0.0
        overall_er = round(((avg_likes + avg_comments) / max(followers_count, 1)) * 100, 2)

        return {
            "profile": {
                "username": clean_user,
                "instagram_pk": str(user_data.get("id", "")),
                "full_name": user_data.get("full_name") or clean_user,
                "profile_pic_url": str(user_data.get("profile_pic_url") or ""),
                "biography": user_data.get("biography", ""),
                "followers_count": user_data.get("edge_followed_by", {}).get("count", 0) or 0,
                "following_count": user_data.get("edge_follow", {}).get("count", 0) or 0,
                "media_count": user_data.get("edge_owner_to_timeline_media", {}).get("count", 0) or 0,
                "is_verified": user_data.get("is_verified", False),
                "category_name": user_data.get("category_name", ""),
            },
            "posts": parsed_posts,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "engagement_rate": overall_er,
            "top_hashtags": [item[0] for item in Counter(hashtags_list).most_common(10)],
            "total_posts_scraped": count
        }

    def fetch_competitor_profile(self, db: Session, username: str, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Fetch competitor profile."""
        data = self.fetch_competitor_data(db, username, amount=1, override_proxy=override_proxy)
        return data["profile"]

    def fetch_competitor_posts(self, db: Session, user_id_or_username: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Fetch competitor posts."""
        data = self.fetch_competitor_data(db, user_id_or_username, amount=amount, override_proxy=override_proxy)
        return {
            "posts": data["posts"],
            "avg_likes": data["avg_likes"],
            "avg_comments": data["avg_comments"],
            "engagement_rate": data["engagement_rate"],
            "top_hashtags": data["top_hashtags"],
            "total_posts_scraped": data["total_posts_scraped"]
        }

    def test_faustren_scraper(self, db: Session, sample_username: str = "instagram", override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Run end-to-end test of FaustRen InstaPeriodScraper."""
        try:
            data = self.fetch_competitor_data(db, sample_username, amount=6, override_proxy=override_proxy)
            prof = data["profile"]
            posts_count = data.get("total_posts_scraped", 0)
            return {
                "success": True,
                "username": prof["username"],
                "full_name": prof["full_name"],
                "followers_count": prof["followers_count"],
                "posts_count": posts_count,
                "message": f"InstaPeriodScraper Berhasil! Profil @{prof['username']} ({prof['followers_count']:,} followers) & {posts_count} posts berhasil ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"InstaPeriodScraper gagal: {str(e)}"
            }


faustren_scraper_service = FaustRenScraperService()
