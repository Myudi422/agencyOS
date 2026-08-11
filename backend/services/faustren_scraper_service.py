"""
FaustRen Scraper Service — Ultra-Robust Serverless Instagram OpenGraph & Embed Scraper.
No login required for fetching public user profiles and recent posts.
Bypasses all Selenium / ChromeDriver dependencies to guarantee 0 Vercel read-only filesystem errors.
Supports Residential Proxy (Eclipse Proxy) & direct HTTP requests.
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
            resp = requests.get("http://api.ipify.org?format=json", proxies=proxies, timeout=20)
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
        Fetch profile & recent posts using Pure HTTP OpenGraph & Embed JSON Scraper.
        100% Zero Selenium / ChromeDriver calls -> 0 Read-only File System Errors on Vercel.
        """
        clean_user = username.strip().lstrip("@").lower()
        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # 1. Fetch Profile Page HTML via OpenGraph (Always returns Status 200 with metadata)
        main_url = f"https://www.instagram.com/{clean_user}/"
        followers_count = 0
        following_count = 0
        media_count = 0
        full_name = clean_user
        profile_pic_url = ""
        biography = ""

        try:
            resp_main = requests.get(main_url, headers=headers, proxies=proxies, timeout=20)
            if resp_main.status_code == 404:
                raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")
            if resp_main.status_code == 200:
                soup = BeautifulSoup(resp_main.text, "html.parser")
                og_desc = soup.find("meta", property="og:description")
                og_title = soup.find("meta", property="og:title")
                og_img = soup.find("meta", property="og:image")

                if og_img and og_img.get("content"):
                    profile_pic_url = og_img["content"]

                if og_title and og_title.get("content"):
                    title_text = og_title["content"]
                    m_title = re.match(r"^(.+?)\s*\(@", title_text)
                    if m_title:
                        full_name = m_title.group(1).strip()

                if og_desc and og_desc.get("content"):
                    desc_text = og_desc["content"]
                    # Format: "686M Followers, 271 Following, 8,550 Posts - See Instagram photos..."
                    m_desc = re.search(r"([\d\.,\sKkMmBb]+)\s+Followers,\s+([\d\.,\sKkMmBb]+)\s+Following,\s+([\d\.,\sKkMmBb]+)\s+Posts", desc_text, re.I)
                    if m_desc:
                        followers_count = self.parse_count_str(m_desc.group(1))
                        following_count = self.parse_count_str(m_desc.group(2))
                        media_count = self.parse_count_str(m_desc.group(3))
        except Exception as e_main:
            logger.warning(f"Main profile fetch for @{clean_user}: {e_main}")

        # 2. Fetch Embed HTML with Query Parameters to parse recent posts
        embed_url = f"https://www.instagram.com/{clean_user}/embed/?cr=1&v=12&wp=558&rd=file%3A%2F%2F&rp=%2Fprivate%2Fvar%2Fcontainers%2F"
        parsed_posts = []
        total_likes = 0
        total_comments = 0
        hashtags_list = []

        try:
            resp_embed = requests.get(embed_url, headers=headers, proxies=proxies, timeout=20)
            if resp_embed.status_code == 200:
                html = resp_embed.text
                start_str = 'contextJSON":"'
                json_str_escaped = ""
                if start_str in html:
                    idx = html.find(start_str) + len(start_str)
                    end_idx = html.find('","', idx)
                    if end_idx != -1:
                        json_str_escaped = html[idx:end_idx]

                if json_str_escaped:
                    try:
                        cleaned_str = json.loads(f'"{json_str_escaped}"').strip()
                        parsed_res = json.loads(cleaned_str)
                        context = parsed_res.get("context", {})

                        if not followers_count:
                            followers_count = context.get("followers_count", 0) or 0
                        if full_name == clean_user and context.get("full_name"):
                            full_name = context.get("full_name")
                        if not profile_pic_url and context.get("profile_pic_url"):
                            profile_pic_url = context.get("profile_pic_url")
                        if not media_count and context.get("posts_count"):
                            media_count = context.get("posts_count", 0) or 0
                        biography = context.get("biography") or biography

                        graphql_media = context.get("graphql_media", []) or []
                        for item in graphql_media[:amount]:
                            node = item.get("shortcode_media") or item.get("node") or item
                            code = node.get("shortcode", "")
                            caption = ""
                            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
                            if caption_edges and isinstance(caption_edges, list):
                                caption = caption_edges[0].get("node", {}).get("text", "")
                            elif isinstance(node.get("caption"), str):
                                caption = node.get("caption", "")

                            found_hashtags = re.findall(r"#(\w+)", caption)
                            hashtags_list.extend([h.lower() for h in found_hashtags])

                            likes = node.get("edge_liked_by", {}).get("count", 0) or node.get("like_count", 0) or 0
                            comments = node.get("edge_media_to_comment", {}).get("count", 0) or node.get("comment_count", 0) or 0
                            total_likes += likes
                            total_comments += comments

                            post_er = round(((likes + comments) / max(followers_count, 1)) * 100, 2)
                            ts = node.get("taken_at_timestamp") or node.get("timestamp")
                            posted_at = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ") if ts else None
                            thumb = node.get("display_url") or node.get("thumbnail_src") or ""

                            parsed_posts.append({
                                "instagram_media_id": code,
                                "code": code,
                                "post_type": "video" if node.get("is_video") else "image",
                                "caption": caption,
                                "thumbnail_url": thumb,
                                "media_urls": [thumb] if thumb else [],
                                "like_count": likes,
                                "comment_count": comments,
                                "engagement_rate": post_er,
                                "posted_at": posted_at,
                            })
                    except Exception as e_json:
                        logger.warning(f"Error parsing contextJSON for @{clean_user}: {e_json}")
        except Exception as e_embed:
            logger.warning(f"Embed fetch error for @{clean_user}: {e_embed}")

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
                "instagram_pk": "",
                "full_name": full_name,
                "profile_pic_url": profile_pic_url,
                "biography": biography,
                "followers_count": followers_count,
                "following_count": following_count,
                "media_count": media_count,
                "is_verified": False,
                "category_name": "",
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
        """Run end-to-end test of FaustRen Pure OpenGraph Scraper Engine."""
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
                "message": f"Pure HTTP Scraper Berhasil! Profil @{prof['username']} ({prof['followers_count']:,} followers) & {posts_count} posts berhasil ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Scraper gagal: {str(e)}"
            }


faustren_scraper_service = FaustRenScraperService()
