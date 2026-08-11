"""
FaustRen Scraper Service — Serverless-Optimized Instagram Embed Scraper with Proxy Support.
Uses Instagram Embed endpoints (Status 200 Anti-Block) + Residential Proxy + FaustRen contextJSON parser.
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
        """Test proxy connectivity by querying public IP checkers (HTTP endpoint for fast response)."""
        clean_proxy = self.normalize_proxy_url(proxy_url)
        if not clean_proxy:
            return {"success": False, "message": "URL Proxy tidak boleh kosong."}

        proxies = {"http": clean_proxy, "https": clean_proxy}
        try:
            # Query http://api.ipify.org (HTTP port avoids HTTPS CONNECT timeout issues on proxy ports)
            resp = requests.get("http://api.ipify.org?format=json", proxies=proxies, timeout=12)
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
        Fetch profile & recent posts metadata using Instagram Embed Anti-Block API & Residential Proxy.
        Completely avoids Selenium browser binary calls to ensure zero Vercel read-only filesystem errors.
        """
        clean_user = username.strip().lstrip("@").lower()
        return self._fetch_via_embed_api(db, clean_user, amount=amount, override_proxy=override_proxy)

    def _fetch_via_embed_api(self, db: Session, clean_user: str, amount: int = 20, override_proxy: Optional[str] = None) -> Dict[str, Any]:
        """Scrape profile & posts using Instagram Embed endpoint (Status 200 anti-block) + Residential Proxy."""
        from instagram_posts_scraper.profile_scraper import InstagramProfileScraper

        proxies = self.get_proxy_config(db, override_proxy_url=override_proxy)
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        embed_url = f"https://www.instagram.com/{clean_user}/embed/?cr=1&v=12&wp=558&rd=file%3A%2F%2F&rp=%2Fprivate%2Fvar%2Fcontainers%2F"
        try:
            resp = requests.get(embed_url, headers=headers, proxies=proxies, timeout=15)
            if resp.status_code == 404:
                raise ValueError(f"Akun @{clean_user} tidak ditemukan di Instagram.")
            if resp.status_code == 429:
                raise RuntimeError("Instagram Rate Limit (HTTP 429). Pastikan Proxy Aktif & IP Residential Valid di Admin Settings.")
            if resp.status_code != 200:
                raise RuntimeError(f"Instagram Embed merespon status HTTP {resp.status_code}")

            json_str_escaped = InstagramProfileScraper.extract_contextJSON(resp.text)
            if not json_str_escaped:
                start_str = 'contextJSON":"'
                if start_str in resp.text:
                    idx = resp.text.find(start_str) + len(start_str)
                    end_idx = resp.text.find('","', idx)
                    if end_idx != -1:
                        json_str_escaped = resp.text[idx:end_idx]

            if not json_str_escaped:
                raise ValueError(f"Gagal mengambil metadata profil untuk @{clean_user}")


            parsed_res = InstagramProfileScraper.extract_parsed_res(json_str_escaped)
            context = InstagramProfileScraper.get_context(parsed_res)

            followers_count = context.get("followers_count", 0) or 0
            full_name = context.get("full_name") or clean_user
            biography = context.get("biography") or ""
            profile_pic_url = context.get("profile_pic_url") or ""
            media_count = context.get("posts_count", 0) or 0

            graphql_media = context.get("graphql_media", []) or []
            parsed_posts = []
            total_likes = 0
            total_comments = 0
            hashtags_list = []

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
                    "instagram_pk": str(context.get("id") or ""),
                    "full_name": full_name,
                    "profile_pic_url": profile_pic_url,
                    "biography": biography,
                    "followers_count": followers_count,
                    "following_count": context.get("following_count", 0) or 0,
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
        except Exception as e:
            logger.warning(f"Embed scraper error for @{clean_user}: {e}. Trying Pixwox/Picnob fallback...")
            try:
                from instagram_posts_scraper.instagram_posts_scraper import InstaPeriodScraper
                scraper = InstaPeriodScraper(use_profile_scraper=False)
                res = scraper.get_posts(target_info={"username": clean_user, "days_limit": 30})
                if res and isinstance(res, dict) and "profile" in res and res.get("profile"):
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
                        posted_at = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ") if ts else None

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
                        "top_hashtags": [item[0] for item in Counter(hashtags_list).most_common(10)],
                        "total_posts_scraped": count
                    }
            except Exception as e_fb:
                logger.error(f"Pixwox fallback failed for @{clean_user}: {e_fb}")
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
        """Run end-to-end test of FaustRen Embed Scraper Engine."""
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
                "message": f"FaustRen Embed Scraper Berhasil! Profil @{prof['username']} ({prof['followers_count']:,} followers) & {posts_count} posts berhasil ditarik."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"FaustRen Scraper gagal: {str(e)}"
            }


faustren_scraper_service = FaustRenScraperService()
