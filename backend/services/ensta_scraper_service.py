"""
Ensta Scraper Service — Anonymous Instagram Scraper using ensta library (Guest mode) + OpenGraph fallback.
No login required for fetching public user profiles and recent posts.
Supports Residential Proxy (Eclipse Proxy) & direct HTTP requests.
100% Zero Selenium / ChromeDriver calls -> 0 Read-only File System Errors on Vercel.
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
from bs4 import BeautifulSoup
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

import urllib3
urllib3.disable_warnings()

from backend.models.models import Setting

logger = logging.getLogger("EnstaScraper")

GLOBAL_WS_ID = "global"

USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
]


class EnstaScraperService:
    def __init__(self):
        pass

    @staticmethod
    def parse_count_str(text: str) -> int:
        """Parses count strings like '686M', '248.9K', '1,234' to integer."""
        if not text:
            return 0
        s = text.strip().replace(",", "").replace(" ", "")
        m = re.match(r"^([0-9]*\.?[0-9]+)\s*([KkMmBb]?)$", s)
        if not m:
            return 0
        num = float(m.group(1))
        suf = m.group(2).lower()
        mult = {"k": 1_000, "m": 1_000_000, "b": 1_000_000_000}.get(suf, 1)
        return int(num * mult)

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
            resp = requests.get("http://api.ipify.org?format=json", proxies=proxies, timeout=20, verify=False)
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

    def _fetch_profile_opengraph(self, db: Session, username: str, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Unauthenticated OpenGraph fallback for profile metadata."""
        clean_user = username.strip().lstrip("@").lower()
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
        }
        url = f"https://www.instagram.com/{clean_user}/"

        try:
            resp = requests.get(url, headers=headers, proxies=proxies, timeout=20, verify=False)
            if resp.status_code == 404:
                raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")

            soup = BeautifulSoup(resp.text, "html.parser")
            og_desc = soup.find("meta", property="og:description")
            og_title = soup.find("meta", property="og:title")
            og_img = soup.find("meta", property="og:image")

            followers_count = 0
            following_count = 0
            media_count = 0
            full_name = clean_user
            profile_pic_url = og_img["content"] if og_img and og_img.get("content") else ""

            if og_title and og_title.get("content"):
                m_title = re.match(r"^(.+?)\s*\(@", og_title["content"])
                if m_title:
                    full_name = m_title.group(1).strip()

            if og_desc and og_desc.get("content"):
                desc_text = og_desc["content"]
                m_desc = re.search(r"([\d\.,\sKkMmBb]+)\s+Followers,\s+([\d\.,\sKkMmBb]+)\s+Following,\s+([\d\.,\sKkMmBb]+)\s+Posts", desc_text, re.I)
                if m_desc:
                    followers_count = self.parse_count_str(m_desc.group(1))
                    following_count = self.parse_count_str(m_desc.group(2))
                    media_count = self.parse_count_str(m_desc.group(3))

            return {
                "username": clean_user,
                "instagram_pk": "",
                "full_name": full_name,
                "profile_pic_url": profile_pic_url,
                "biography": "",
                "followers_count": followers_count,
                "following_count": following_count,
                "media_count": media_count,
                "is_verified": False,
                "category_name": "",
            }
        except Exception as e_og:
            logger.error(f"OpenGraph fallback failed for @{clean_user}: {e_og}")
            raise e_og

    def fetch_competitor_data(self, db: Session, username: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch profile & recent posts using Ensta Guest mode + OpenGraph fallback.
        100% No Login required. Supports Residential Proxy.
        """
        clean_user = username.strip().lstrip("@").lower()
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)

        profile_data = None
        posts_data_list = []

        # 1. Try ensta.Guest mode
        try:
            from ensta import Guest
            guest = Guest(proxy=proxies)
            if hasattr(guest, "request_session") and guest.request_session:
                guest.request_session.verify = False

            prof = guest.profile(clean_user)

            if prof and getattr(prof, "username", None):
                profile_data = {
                    "username": clean_user,
                    "instagram_pk": str(getattr(prof, "user_id", "") or ""),
                    "full_name": getattr(prof, "full_name", clean_user) or clean_user,
                    "profile_pic_url": getattr(prof, "profile_picture_url", "") or "",
                    "biography": getattr(prof, "biography", "") or "",
                    "followers_count": getattr(prof, "follower_count", 0) or 0,
                    "following_count": getattr(prof, "following_count", 0) or 0,
                    "media_count": getattr(prof, "total_post_count", 0) or 0,
                    "is_verified": getattr(prof, "is_verified", False),
                    "category_name": getattr(prof, "category_name", "") or "",
                }

                # Try fetching posts via guest.posts
                try:
                    raw_posts = list(guest.posts(clean_user, count=amount))
                    for p in raw_posts:
                        if p:
                            posts_data_list.append(p)
                except Exception as e_posts:
                    logger.debug(f"Ensta Guest.posts failed for @{clean_user}: {e_posts}")

        except Exception as e_ensta:
            logger.warning(f"Ensta Guest.profile failed for @{clean_user}: {e_ensta}. Falling back to OpenGraph...")

        # 2. Fallback to OpenGraph if profile_data is missing
        if not profile_data:
            profile_data = self._fetch_profile_opengraph(db, clean_user, override_proxy=override_proxy)

        followers_count = profile_data.get("followers_count", 0) or 0

        parsed_posts = []
        total_likes = 0
        total_comments = 0
        hashtags_list = []

        for p in posts_data_list[:amount]:
            code = getattr(p, "identifier", getattr(p, "code", "")) or ""
            caption = getattr(p, "caption", "") or ""
            found_hashtags = re.findall(r"#(\w+)", caption)
            hashtags_list.extend([h.lower() for h in found_hashtags])

            thumb = getattr(p, "display_url", getattr(p, "thumbnail_url", "")) or ""
            likes = getattr(p, "like_count", 0) or 0
            comments = getattr(p, "comment_count", 0) or 0
            total_likes += likes
            total_comments += comments

            post_er = round(((likes + comments) / max(followers_count, 1)) * 100, 2)
            ts = getattr(p, "timestamp", None)
            posted_at = None
            if ts:
                if isinstance(ts, (int, float)):
                    posted_at = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ")
                elif isinstance(ts, str):
                    posted_at = ts

            parsed_posts.append({
                "instagram_media_id": code,
                "code": code,
                "post_type": "video" if getattr(p, "is_video", False) else "image",
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

        return {
            "profile": profile_data,
            "posts": parsed_posts,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "engagement_rate": overall_er,
            "top_hashtags": [item[0] for item in Counter(hashtags_list).most_common(10)],
            "total_posts_scraped": count
        }

    def fetch_competitor_profile(self, db: Session, username: str, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Fetch competitor profile information."""
        data = self.fetch_competitor_data(db, username, amount=1, override_proxy=override_proxy)
        return data["profile"]

    def fetch_competitor_posts(self, db: Session, user_id_or_username: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Fetch competitor posts information."""
        data = self.fetch_competitor_data(db, user_id_or_username, amount=amount, override_proxy=override_proxy)
        return {
            "posts": data["posts"],
            "avg_likes": data["avg_likes"],
            "avg_comments": data["avg_comments"],
            "engagement_rate": data["engagement_rate"],
            "top_hashtags": data["top_hashtags"],
            "total_posts_scraped": data["total_posts_scraped"]
        }

    def test_ensta_scraper(self, db: Session, sample_username: str = "instagram", override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Run end-to-end test of Ensta Scraper Engine."""
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
                "message": f"Ensta Scraper (No Login) Berhasil! Profil @{prof['username']} ({prof['followers_count']:,} followers) & {posts_count} posts ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Ensta Scraper gagal: {str(e)}"
            }


ensta_scraper_service = EnstaScraperService()
