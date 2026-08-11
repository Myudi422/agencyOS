"""
FaustRen Scraper Service — Serverless-Optimized Instagram Web API Scraper with Proxy Support.
No login required for fetching public user profiles and recent posts.
Bypasses Selenium browser dependencies for 100% Vercel compatibility and zero read-only filesystem errors.
"""

import os
import json
import re
import random
import logging
from typing import Optional, Dict, Any, List
from collections import Counter
from datetime import datetime
import requests
from sqlalchemy.orm import Session

# Vercel / Serverless Sandbox Protection: Ensure HOME points to writable /tmp
try:
    home_dir = os.path.expanduser("~")
    test_path = os.path.join(home_dir, ".write_test")
    with open(test_path, "w") as f:
        f.write("1")
    os.remove(test_path)
except (OSError, IOError, PermissionError):
    os.environ["HOME"] = "/tmp"
    os.environ["TMPDIR"] = "/tmp"

from backend.models.models import Setting

logger = logging.getLogger("FaustRenScraper")

GLOBAL_WS_ID = "global"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]

class FaustRenScraperService:
    def __init__(self):
        pass

    @staticmethod
    def normalize_proxy_url(raw_proxy: str) -> str:
        """
        Normalizes various proxy input formats to a valid URL string.
        Supports:
        - HOST:PORT:USERNAME:PASSWORD  -> http://USERNAME:PASSWORD@HOST:PORT
        - HOST:PORT                    -> http://HOST:PORT
        - http://USERNAME:PASSWORD@HOST:PORT
        """
        if not raw_proxy:
            return ""
        clean = raw_proxy.strip()
        if not clean.startswith("http://") and not clean.startswith("https://") and not clean.startswith("socks5://"):
            parts = clean.split(":")
            if len(parts) == 4:
                host, port, user, password = parts
                return f"http://{user}:{password}@{host}:{port}"
            elif len(parts) == 2:
                host, port = parts
                return f"http://{host}:{port}"
            else:
                return f"http://{clean}"
        return clean

    def get_proxy_config(self, db: Optional[Session] = None, override_proxy_url: Optional[str] = None) -> Optional[Dict[str, str]]:
        """Fetch configured Residential Proxy setting from DB or parameters."""
        if override_proxy_url:
            proxy_url = self.normalize_proxy_url(override_proxy_url)
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
                    p_url = self.normalize_proxy_url(str(url_row.value))
                    if p_url:
                        return {"http": p_url, "https": p_url}

        return None

    def test_proxy_connection(self, proxy_url: str) -> Dict[str, Any]:
        """Test proxy connectivity by querying public IP checkers."""
        clean_proxy = self.normalize_proxy_url(proxy_url)
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
        Fetch profile & recent posts metadata using pure HTTP requests & Residential Proxy.
        Completely avoids Selenium browser binary calls to ensure zero Vercel read-only filesystem errors.
        """
        clean_user = username.strip().lstrip("@").lower()
        return self._fetch_via_web_api(db, clean_user, amount=amount, override_proxy=override_proxy)

    def _fetch_via_web_api(self, db: Session, clean_user: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Direct web API scraper engine with Residential Proxy support."""
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "X-IG-App-ID": "936619743392459",
            "Referer": "https://www.instagram.com/",
        }

        # 1. Primary endpoint: Instagram Web Profile Info API
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={clean_user}"
        try:
            resp = requests.get(url, headers=headers, proxies=proxies, timeout=12)
            if resp.status_code == 404:
                raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")
            if resp.status_code == 429:
                raise RuntimeError("Instagram Rate Limit (HTTP 429). Silakan aktifkan 'PROXY_ENABLED' & isi 'PROXY_URL' di Admin Settings (/admin).")
            if resp.status_code != 200:
                raise RuntimeError(f"Instagram merespon dengan status HTTP {resp.status_code}")

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

            threshold_er = overall_er * 1.3
            for p in parsed_posts:
                p["is_top_performer"] = (p["engagement_rate"] >= threshold_er) or (p["like_count"] >= avg_likes * 1.5 and count >= 3)

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
        except Exception as e:
            logger.error(f"FaustRen fetch via web API @{clean_user} error: {e}")
            raise e

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
        """Run end-to-end test of FaustRen Scraper Engine."""
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
                "message": f"FaustRen Scraper Berhasil! Profil @{prof['username']} ({prof['followers_count']:,} followers) & {posts_count} posts berhasil ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"FaustRen Scraper gagal: {str(e)}"
            }


faustren_scraper_service = FaustRenScraperService()
