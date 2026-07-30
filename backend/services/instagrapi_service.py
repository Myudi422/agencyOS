"""
Instagrapi Service — Instagram Private API Integration for Competitor Spy
Uses instagrapi library to load saved session cookies, fetch competitor user profiles,
retrieve posts, calculate engagement metrics, and extract top performing content.
"""

import json
import re
from typing import Optional, Dict, Any, List
from collections import Counter
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from backend.models.models import Setting

logger = logging.getLogger("InstagrapiService")

GLOBAL_WS_ID = "global"

class InstagrapiService:
    def __init__(self):
        pass

    def _load_stored_session(self, db: Session) -> Optional[Any]:
        """Fetch saved Instagram session from global settings table."""
        row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_SESSION_COOKIE", "INSTAGRAM_SESSION_ID", "INSTAGRAM_COOKIE"])
        ).first()

        if not row or not row.value:
            return None
        return row.value

    def get_client(self, db: Session, override_session: Optional[Any] = None) -> Any:
        """
        Initializes an instagrapi Client with session settings.
        Supports sessionid string, cookie dict, or full exported JSON settings.
        """
        try:
            from instagrapi import Client
        except ImportError:
            raise RuntimeError("instagrapi library is not installed.")

        cl = Client()
        # Set realistic device settings & timeouts
        cl.delay_range = [1, 3]

        session_data = override_session or self._load_stored_session(db)
        if not session_data:
            raise ValueError("Belum ada Instagram Session Cookie yang dikonfigurasi di Admin Settings.")

        if isinstance(session_data, dict):
            # Full settings json or cookie dict
            if "sessionid" in session_data:
                cl.login_by_sessionid(session_data["sessionid"])
            else:
                cl.set_settings(session_data)
        elif isinstance(session_data, str):
            session_str = session_data.strip()
            # If JSON string
            if session_str.startswith("{") and session_str.endswith("}"):
                try:
                    parsed = json.loads(session_str)
                    if isinstance(parsed, dict) and "sessionid" in parsed:
                        cl.login_by_sessionid(parsed["sessionid"])
                    elif isinstance(parsed, dict):
                        cl.set_settings(parsed)
                except Exception:
                    cl.login_by_sessionid(session_str)
            else:
                # Plain sessionid string (e.g. 54321234%3AFakE...)
                cl.login_by_sessionid(session_str)

        return cl

    def test_connection(self, db: Session, test_session: Optional[str] = None) -> Dict[str, Any]:
        """Test Instagram login session with instagrapi."""
        try:
            cl = self.get_client(db, override_session=test_session)
            account_info = cl.account_info()
            return {
                "success": True,
                "username": getattr(account_info, "username", "Unknown"),
                "full_name": getattr(account_info, "full_name", ""),
                "pk": getattr(account_info, "pk", ""),
                "message": f"Koneksi Instagram Berhasil! Logged in as @{getattr(account_info, 'username', '')}"
            }
        except Exception as e:
            logger.error(f"Instagram test connection error: {e}")
            return {
                "success": False,
                "message": f"Gagal menghubungkan Instagram via Instagrapi: {str(e)}"
            }

    def fetch_competitor_profile(self, db: Session, username: str) -> Dict[str, Any]:
        """Fetch competitor profile information from Instagram."""
        clean_user = username.strip().lstrip("@").lower()
        cl = self.get_client(db)

        user_info = cl.user_info_by_username(clean_user)
        user_dict = user_info.dict() if hasattr(user_info, "dict") else user_info.__dict__

        return {
            "username": clean_user,
            "instagram_pk": str(getattr(user_info, "pk", "")),
            "full_name": getattr(user_info, "full_name", clean_user),
            "profile_pic_url": str(getattr(user_info, "profile_pic_url", "")),
            "biography": getattr(user_info, "biography", ""),
            "followers_count": getattr(user_info, "follower_count", 0),
            "following_count": getattr(user_info, "following_count", 0),
            "media_count": getattr(user_info, "media_count", 0),
            "is_verified": getattr(user_info, "is_verified", False),
            "category_name": getattr(user_info, "category_name", ""),
        }

    def fetch_competitor_posts(self, db: Session, user_id_or_username: str, amount: int = 20) -> Dict[str, Any]:
        """
        Fetch recent posts for a competitor, calculate engagement rate, top hashtags,
        and mark top-performing posts.
        """
        cl = self.get_client(db)
        
        # Resolve PK if username given
        if not user_id_or_username.isdigit():
            user_info = cl.user_info_by_username(user_id_or_username.strip().lstrip("@"))
            pk = user_info.pk
            followers_count = user_info.follower_count or 1
        else:
            pk = int(user_id_or_username)
            user_info = cl.user_info(pk)
            followers_count = getattr(user_info, "follower_count", 1) or 1

        medias = cl.user_medias(pk, amount=amount)
        
        parsed_posts = []
        total_likes = 0
        total_comments = 0
        hashtags_list = []

        for m in medias:
            m_dict = m.dict() if hasattr(m, "dict") else m.__dict__
            media_id = str(getattr(m, "id", getattr(m, "pk", "")))
            code = getattr(m, "code", "")
            
            # Post type mapping
            media_type = getattr(m, "media_type", 1)
            product_type = getattr(m, "product_type", "")
            if media_type == 2 or product_type in ["reels", "clips"]:
                post_type = "video"
            elif media_type == 8:
                post_type = "carousel"
            else:
                post_type = "image"

            caption_obj = getattr(m, "caption_text", "") or getattr(m, "caption", "")
            if isinstance(caption_obj, dict):
                caption_text = caption_obj.get("text", "")
            else:
                caption_text = str(caption_obj or "")

            # Extract hashtags
            found_hashtags = re.findall(r"#(\w+)", caption_text)
            hashtags_list.extend([h.lower() for h in found_hashtags])

            # Media URLs / Thumbnails
            thumbnail_url = ""
            resources = getattr(m, "resources", []) or []
            media_urls = []

            if hasattr(m, "thumbnail_url") and m.thumbnail_url:
                thumbnail_url = str(m.thumbnail_url)
            elif hasattr(m, "display_url") and m.display_url:
                thumbnail_url = str(m.display_url)

            if resources:
                for r in resources:
                    r_url = str(getattr(r, "display_url", getattr(r, "thumbnail_url", "")))
                    if r_url:
                        media_urls.append(r_url)
            if not media_urls and thumbnail_url:
                media_urls.append(thumbnail_url)

            like_count = getattr(m, "like_count", 0) or 0
            comment_count = getattr(m, "comment_count", 0) or 0
            total_likes += like_count
            total_comments += comment_count

            # Engagement Rate for this single post = ((likes + comments) / followers) * 100
            post_er = round(((like_count + comment_count) / max(followers_count, 1)) * 100, 2)

            posted_at = getattr(m, "taken_at", None)
            if isinstance(posted_at, str):
                try:
                    posted_at = datetime.fromisoformat(posted_at)
                except Exception:
                    posted_at = datetime.utcnow()

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
                "posted_at": posted_at.isoformat() if posted_at else None,
            })

        count = len(parsed_posts)
        avg_likes = round(total_likes / count, 1) if count > 0 else 0.0
        avg_comments = round(total_comments / count, 1) if count > 0 else 0.0
        overall_er = round(((avg_likes + avg_comments) / max(followers_count, 1)) * 100, 2)

        # Flag top performers (posts with ER > 1.3x average ER)
        threshold_er = overall_er * 1.3
        for p in parsed_posts:
            p["is_top_performer"] = (p["engagement_rate"] >= threshold_er) or (p["like_count"] >= avg_likes * 1.5 and count >= 3)

        # Top 10 Hashtags
        top_hashtags = [item[0] for item in Counter(hashtags_list).most_common(10)]

        return {
            "posts": parsed_posts,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "engagement_rate": overall_er,
            "top_hashtags": top_hashtags,
            "total_posts_scraped": count
        }


instagrapi_service = InstagrapiService()
