"""
FaustRen Scraper Service — Instagram Web API Scraper with Residential Proxy Support.
No login required for fetching public user profiles and recent posts.
Optimized for low payload size (<25 KB per scrape) to conserve proxy bandwidth.
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

# Default User Agents pool for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
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

    def _get_headers(self) -> Dict[str, str]:
        """Construct standard browser headers required by IG web endpoints."""
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "X-IG-App-ID": "936619743392459",  # Standard Instagram Web App ID
            "Origin": "https://www.instagram.com",
            "Referer": "https://www.instagram.com/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }

    def test_proxy_connection(self, proxy_url: str) -> Dict[str, Any]:
        """Test proxy connectivity by querying public IP checkers."""
        clean_proxy = proxy_url.strip()
        if not clean_proxy:
            return {"success": False, "message": "URL Proxy tidak boleh kosong."}

        proxies = {"http": clean_proxy, "https": clean_proxy}
        try:
            # Query ipify or httpbin for IP verification
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

    def fetch_competitor_profile(self, db: Session, username: str, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Fetch competitor profile information via web profile API without login."""
        clean_user = username.strip().lstrip("@").lower()
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = self._get_headers()

        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={clean_user}"

        try:
            resp = requests.get(url, headers=headers, proxies=proxies, timeout=12)
            if resp.status_code == 404:
                raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")
            if resp.status_code == 429:
                raise RuntimeError("Instagram rate limit (HTTP 429). Aktifkan/perbarui Residential Proxy di Admin Settings.")
            if resp.status_code != 200:
                raise RuntimeError(f"Instagram merespon dengan status HTTP {resp.status_code}")

            data = resp.json()
            user_data = data.get("data", {}).get("user")
            if not user_data:
                raise ValueError(f"Data profil untuk @{clean_user} kosong.")

            return {
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
            }
        except Exception as e:
            logger.error(f"FaustRen fetch profile @{clean_user} error: {e}")
            raise e

    def fetch_competitor_posts(self, db: Session, user_id_or_username: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch recent posts for competitor via web profile API, calculate engagement metrics,
        and return posts metadata.
        """
        clean_user = str(user_id_or_username).strip().lstrip("@").lower()
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = self._get_headers()

        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={clean_user}"

        try:
            resp = requests.get(url, headers=headers, proxies=proxies, timeout=12)
            if resp.status_code != 200:
                raise RuntimeError(f"Gagal mengambil postingan @{clean_user} (HTTP {resp.status_code})")

            data = resp.json()
            user_data = data.get("data", {}).get("user")
            if not user_data:
                raise ValueError(f"Data user @{clean_user} tidak ditemukan.")

            followers_count = user_data.get("edge_followed_by", {}).get("count", 1) or 1
            timeline_media = user_data.get("edge_owner_to_timeline_media", {})
            edges = timeline_media.get("edges", [])[:amount]

            parsed_posts = []
            total_likes = 0
            total_comments = 0
            hashtags_list = []

            for edge in edges:
                node = edge.get("node", {})
                media_id = str(node.get("id", ""))
                code = str(node.get("shortcode", ""))
                is_video = node.get("is_video", False)
                typename = node.get("typename", "")

                if is_video or "video" in typename.lower():
                    post_type = "video"
                elif "sidecar" in typename.lower() or "carousel" in typename.lower():
                    post_type = "carousel"
                else:
                    post_type = "image"

                # Caption
                caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
                caption_text = ""
                if caption_edges and isinstance(caption_edges, list):
                    caption_text = caption_edges[0].get("node", {}).get("text", "")

                # Extract hashtags
                found_hashtags = re.findall(r"#(\w+)", caption_text)
                hashtags_list.extend([h.lower() for h in found_hashtags])

                # Thumbnail URL (CDN string)
                thumbnail_url = node.get("display_url") or node.get("thumbnail_src") or ""
                media_urls = [thumbnail_url] if thumbnail_url else []

                like_count = node.get("edge_liked_by", {}).get("count", 0) or node.get("edge_media_preview_like", {}).get("count", 0) or 0
                comment_count = node.get("edge_media_to_comment", {}).get("count", 0) or 0

                total_likes += like_count
                total_comments += comment_count

                # Post engagement rate
                post_er = round(((like_count + comment_count) / max(followers_count, 1)) * 100, 2)

                taken_at_timestamp = node.get("taken_at_timestamp")
                posted_at = None
                if taken_at_timestamp:
                    posted_at = datetime.utcfromtimestamp(taken_at_timestamp).strftime("%Y-%m-%dT%H:%M:%SZ")

                parsed_posts.append({
                    "instagram_media_id": media_id,
                    "code": code,
                    "post_type": post_type,
                    "caption": caption_text,
                    "thumbnail_url": thumbnail_url,
                    "media_urls": media_urls,
                    "like_count": like_count,
                    "comment_count": comment_count,
                    "engagement_rate": post_er,
                    "posted_at": posted_at,
                })

            count = len(parsed_posts)
            avg_likes = round(total_likes / count, 1) if count > 0 else 0.0
            avg_comments = round(total_comments / count, 1) if count > 0 else 0.0
            overall_er = round(((avg_likes + avg_comments) / max(followers_count, 1)) * 100, 2)

            # Flag top performers
            threshold_er = overall_er * 1.3
            for p in parsed_posts:
                p["is_top_performer"] = (p["engagement_rate"] >= threshold_er) or (p["like_count"] >= avg_likes * 1.5 and count >= 3)

            top_hashtags = [item[0] for item in Counter(hashtags_list).most_common(10)]

            return {
                "posts": parsed_posts,
                "avg_likes": avg_likes,
                "avg_comments": avg_comments,
                "engagement_rate": overall_er,
                "top_hashtags": top_hashtags,
                "total_posts_scraped": count
            }
        except Exception as e:
            logger.error(f"FaustRen fetch posts @{clean_user} error: {e}")
            raise e

    def test_faustren_scraper(self, db: Session, sample_username: str = "instagram", override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Run end-to-end test of FaustRen scraper with optional proxy override."""
        try:
            profile = self.fetch_competitor_profile(db, sample_username, override_proxy=override_proxy)
            posts_data = self.fetch_competitor_posts(db, sample_username, amount=6, override_proxy=override_proxy)
            return {
                "success": True,
                "username": profile["username"],
                "full_name": profile["full_name"],
                "followers_count": profile["followers_count"],
                "posts_count": posts_data.get("total_posts_scraped", 0),
                "message": f"FaustRen Scraper Berhasil! Profil @{profile['username']} ({profile['followers_count']:,} followers) & {posts_data.get('total_posts_scraped')} posts berhasil ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"FaustRen Scraper gagal: {str(e)}"
            }


faustren_scraper_service = FaustRenScraperService()
