"""
Instagrapi Service — Instagram Private API Integration for Competitor Spy
Uses instagrapi library to load saved session cookies, fetch competitor user profiles,
retrieve posts, calculate engagement metrics, and extract top performing content.
"""

import json
import re
import imaplib
import email
import random
import string
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

    def _save_stored_session(self, db: Session, session_dict: dict) -> None:
        """Save or update dumped instagrapi session settings dict to DB."""
        try:
            row = db.query(Setting).filter(
                Setting.workspace_id == GLOBAL_WS_ID,
                Setting.key == "INSTAGRAM_SESSION_COOKIE"
            ).first()

            if row:
                row.value = session_dict
            else:
                row = Setting(
                    workspace_id=GLOBAL_WS_ID,
                    key="INSTAGRAM_SESSION_COOKIE",
                    value=session_dict
                )
                db.add(row)
            db.commit()
            logger.info("Instagram session settings successfully saved & refreshed in DB.")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save refreshed session settings to DB: {e}")

    def _load_stored_credentials(self, db: Session) -> Optional[Dict[str, str]]:
        """Fetch saved Instagram scraper account credentials from settings table."""
        user_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_SCRAPER_USERNAME", "INSTAGRAM_USERNAME"])
        ).first()

        pass_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_SCRAPER_PASSWORD", "INSTAGRAM_PASSWORD"])
        ).first()

        if user_row and user_row.value and pass_row and pass_row.value:
            return {
                "username": str(user_row.value).strip(),
                "password": str(pass_row.value).strip()
            }
        return None

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

    def get_proxy_url(self, db: Optional[Session] = None, override_proxy_url: Optional[str] = None) -> Optional[str]:
        """Fetch configured Residential Proxy setting from DB or parameters."""
        if override_proxy_url:
            p_url = self.normalize_proxy_url(override_proxy_url)
            if p_url:
                return p_url

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
                        return p_url

        return None

    def test_proxy_connection(self, proxy_url: str) -> Dict[str, Any]:
        """Test proxy connectivity by querying public IP checkers."""
        import requests
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

    def _create_client(self, db: Optional[Session] = None, override_proxy_url: Optional[str] = None) -> Any:
        """Create an instagrapi Client preconfigured with Proxy, Bandwidth Optimizations & Challenge Resolvers."""
        try:
            from instagrapi import Client
        except ImportError:
            raise RuntimeError("instagrapi library is not installed.")

        cl = Client()
        cl.delay_range = [1, 3]

        # Attach Residential Proxy if configured
        proxy_url = self.get_proxy_url(db, override_proxy_url=override_proxy_url)
        if proxy_url:
            try:
                cl.set_proxy(proxy_url)
                logger.info(f"Instagrapi proxy set successfully: {proxy_url.split('@')[-1]}")
            except Exception as e_p:
                logger.warning(f"Failed setting instagrapi proxy ({e_p})")

        if db:
            cl.change_password_handler = lambda uname: self.custom_change_password_handler(db, uname)
            cl.challenge_code_handler = lambda uname, choice: self.custom_challenge_code_handler(db, uname, choice)

        return cl


    def get_code_from_email(self, db: Session, username: str) -> Optional[str]:
        """
        Connects to IMAP mail server (e.g. Gmail) to automatically search and extract
        the 6-digit verification code sent by Instagram.
        """
        email_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_CHALLENGE_EMAIL", "INSTAGRAM_EMAIL"])
        ).first()

        pass_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_CHALLENGE_EMAIL_PASSWORD", "INSTAGRAM_EMAIL_PASSWORD"])
        ).first()

        imap_host_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key == "INSTAGRAM_IMAP_SERVER"
        ).first()

        if not email_row or not email_row.value or not pass_row or not pass_row.value:
            logger.info("IMAP challenge email / password tidak dikonfigurasi di Admin Settings DB.")
            return None

        email_user = str(email_row.value).strip()
        email_pass = str(pass_row.value).strip()
        imap_server = str(imap_host_row.value).strip() if imap_host_row and imap_host_row.value else "imap.gmail.com"

        try:
            logger.info(f"Koneksi ke IMAP server {imap_server} ({email_user}) untuk mencari kode verifikasi Instagram...")
            mail = imaplib.IMAP4_SSL(imap_server)
            mail.login(email_user, email_pass)
            mail.select("inbox")

            result, data = mail.search(None, "(UNSEEN)")
            if result != "OK" or not data or not data[0]:
                result, data = mail.search(None, "ALL")

            if result == "OK" and data and data[0]:
                ids = data[0].split()
                for num in reversed(ids[-7:]):
                    try:
                        mail.store(num, "+FLAGS", "\\Seen")
                        res, msg_data = mail.fetch(num, "(RFC822)")
                        if res != "OK":
                            continue
                        msg = email.message_from_bytes(msg_data[0][1])

                        payloads = msg.get_payload()
                        if not isinstance(payloads, list):
                            payloads = [msg]

                        for payload in payloads:
                            try:
                                body = payload.get_payload(decode=True)
                                if not body:
                                    continue
                                body_text = body.decode("utf-8", errors="ignore")

                                if "instagram" in body_text.lower() or username.lower() in body_text.lower():
                                    match = re.search(r">\s*(\d{6})\s*<", body_text)
                                    if not match:
                                        match = re.search(r"\b(\d{6})\b", body_text)
                                    if match:
                                        code = match.group(1)
                                        logger.info(f"Berhasil menemukan 6-digit challenge code Instagram via Email: {code}")
                                        return code
                            except Exception as p_err:
                                logger.debug(f"Error parsing email payload: {p_err}")
                    except Exception as e_fetch:
                        logger.debug(f"Error fetching email {num}: {e_fetch}")
            mail.logout()
        except Exception as e_imap:
            logger.error(f"Pencarian kode verifikasi IMAP email gagal: {e_imap}")
        return None

    def custom_change_password_handler(self, db: Session, username: str) -> str:
        """
        Handler called by instagrapi when Instagram forces a password change during challenge.
        Generates a new strong random password and automatically persists it to DB settings.
        """
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        new_password = "".join(random.sample(chars, 12))
        logger.info(f"Instagram meminta ganti password untuk @{username}. Password baru dibuat otomatis.")

        p_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key == "INSTAGRAM_SCRAPER_PASSWORD"
        ).first()
        if p_row:
            p_row.value = new_password
            db.commit()
            logger.info("Password scraper baru berhasil disimpan ke DB settings.")

        return new_password

    def custom_challenge_code_handler(self, db: Session, username: str, choice: Any) -> Any:
        """
        Handler called by instagrapi when Instagram requires verification code (EMAIL/SMS).
        1. Tries automatic IMAP email extraction.
        2. Checks manual code submitted in Admin Settings ("INSTAGRAM_CHALLENGE_CODE").
        """
        logger.info(f"Instagram Challenge Code Handler dipanggil untuk @{username} (Choice: {choice})")

        # 1. Automatic email IMAP extraction
        code = self.get_code_from_email(db, username)
        if code:
            return code

        # 2. Check manual code in DB
        code_row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key == "INSTAGRAM_CHALLENGE_CODE"
        ).first()

        if code_row and code_row.value:
            code_val = str(code_row.value).strip()
            if len(code_val) == 6 and code_val.isdigit():
                logger.info(f"Menggunakan 6-digit Challenge Code dari DB Admin Settings: {code_val}")
                code_row.value = ""
                db.commit()
                return code_val

        logger.warning("Challenge code tidak ditemukan via IMAP maupun DB Admin Settings.")
        return False

    def _load_stored_2fa_seed(self, db: Session) -> Optional[str]:
        """Fetch saved Instagram 2FA Secret Key (TOTP Seed) from settings table."""
        row = db.query(Setting).filter(
            Setting.workspace_id == GLOBAL_WS_ID,
            Setting.key.in_(["INSTAGRAM_2FA_SEED", "INSTAGRAM_TOTP_SECRET", "INSTAGRAM_2FA_SECRET"])
        ).first()
        if row and row.value:
            return str(row.value).strip()
        return None

    def _generate_totp_code(self, seed: str) -> Optional[str]:
        """Generates a 6-digit TOTP verification code from 2FA Secret Key."""
        if not seed:
            return None
        clean_seed = seed.replace(" ", "").upper()
        try:
            import pyotp
            totp = pyotp.TOTP(clean_seed)
            code = totp.now()
            logger.info("Berhasil membuat 6-digit 2FA TOTP code dari Secret Key untuk login Instagram.")
            return code
        except Exception as e:
            logger.warning(f"Gagal generate TOTP code dari 2FA seed: {e}")
            return None

    def login_with_credentials(
        self, db: Session, username: Optional[str] = None, password: Optional[str] = None
    ) -> Any:
        """
        Perform login via username & password using instagrapi Client with Challenge Resolvers & 2FA TOTP attached,
        and automatically persist generated session settings dump to DB.
        """
        creds = None
        if username and password:
            creds = {"username": username, "password": password}
        else:
            creds = self._load_stored_credentials(db)

        if not creds:
            raise ValueError("Credential Instagram Scraper (Username & Password) belum dikonfigurasi di Admin Settings.")

        cl = self._create_client(db)

        # Attempt 2FA TOTP code generation if 2FA seed is configured
        verification_code = None
        seed = self._load_stored_2fa_seed(db)
        if seed:
            verification_code = self._generate_totp_code(seed)

        logger.info(f"Mencoba login Instagram untuk @{creds['username']}...")
        try:
            if verification_code:
                cl.login(creds["username"], creds["password"], verification_code=verification_code)
            else:
                cl.login(creds["username"], creds["password"])
        except Exception as e_login:
            err_str = str(e_login)
            if "native challenge" in err_str.lower() or "checkpoint" in err_str.lower() or "official instagram app" in err_str.lower() or "challenge_code_handler" in err_str.lower():
                raise ValueError(
                    f"Instagram memicu Verifikasi Keamanan Perangkat (Native Checkpoint) untuk @{creds['username']}.\n"
                    "💡 Solusi:\n"
                    "1. Buka aplikasi/web Instagram di HP/Browser tempat Anda biasa login ➡️ tekan 'Ini Saya' / 'This Was Me'.\n"
                    "2. ATAU aktifkan 2FA (Two-Factor Authentication) di akun Instagram tersebut, lalu masukkan 2FA Secret Key (TOTP) di Admin Settings -> INSTAGRAM_2FA_SEED untuk auto-login bebas challenge!"
                ) from e_login
            raise e_login

        # Auto-dump settings and save to DB
        settings_dump = cl.get_settings()
        self._save_stored_session(db, settings_dump)

        # Save credentials if provided explicitly
        if username and password:
            u_row = db.query(Setting).filter(Setting.workspace_id == GLOBAL_WS_ID, Setting.key == "INSTAGRAM_SCRAPER_USERNAME").first()
            if u_row:
                u_row.value = username
            else:
                db.add(Setting(workspace_id=GLOBAL_WS_ID, key="INSTAGRAM_SCRAPER_USERNAME", value=username))

            p_row = db.query(Setting).filter(Setting.workspace_id == GLOBAL_WS_ID, Setting.key == "INSTAGRAM_SCRAPER_PASSWORD").first()
            if p_row:
                p_row.value = password
            else:
                db.add(Setting(workspace_id=GLOBAL_WS_ID, key="INSTAGRAM_SCRAPER_PASSWORD", value=password))
            db.commit()

        return cl

    def get_client(self, db: Optional[Session] = None, override_session: Optional[Any] = None, allow_anonymous: bool = True) -> Any:
        """
        Initializes an instagrapi Client with Automatic Session Refresh, Auto-Login Fallback,
        and Challenge Resolvers attached.
        """
        cl = self._create_client(db)

        session_data = override_session or (self._load_stored_session(db) if db else None)

        if session_data:
            try:
                if isinstance(session_data, dict):
                    if "sessionid" in session_data:
                        cl.login_by_sessionid(session_data["sessionid"])
                    else:
                        cl.set_settings(session_data)
                elif isinstance(session_data, str):
                    session_str = session_data.strip()
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
                        cl.login_by_sessionid(session_str)
                return cl
            except Exception as e_sess:
                logger.warning(f"Stored Instagram session expired/invalid ({e_sess}). Attempting auto-login refresh...")

        # If session is absent or expired, attempt Auto-Login using stored credentials
        if db:
            try:
                return self.login_with_credentials(db)
            except Exception as e_login:
                logger.warning(f"Auto-login Instagram credentials failed: {e_login}")

        if allow_anonymous:
            return cl

        raise ValueError("Belum ada Instagram Session Cookie atau Credential Scraper yang dikonfigurasi di Admin Settings.")

    def test_connection(
        self, db: Session, test_session: Optional[str] = None, username: Optional[str] = None, password: Optional[str] = None
    ) -> Dict[str, Any]:
        """Test Instagram login session or credentials with instagrapi."""
        try:
            if username and password:
                cl = self.login_with_credentials(db, username=username, password=password)
            else:
                cl = self.get_client(db, override_session=test_session, allow_anonymous=False)
            account_info = cl.account_info()
            logged_username = getattr(account_info, "username", "Unknown")
            return {
                "success": True,
                "username": logged_username,
                "full_name": getattr(account_info, "full_name", ""),
                "pk": getattr(account_info, "pk", ""),
                "message": f"Koneksi Instagram Berhasil! Logged in as @{logged_username}"
            }
        except Exception as e:
            logger.error(f"Instagram test connection error: {e}")
            return {
                "success": False,
                "message": f"Gagal menghubungkan Instagram via Instagrapi: {str(e)}"
            }

    def validate_username(self, db: Session, username: str) -> Dict[str, Any]:
        """Validate if an Instagram account exists and fetch basic profile preview."""
        try:
            profile = self.fetch_competitor_profile(db, username)
            return {
                "valid": True,
                "profile": profile,
                "message": f"Akun @{profile['username']} ditemukan."
            }
        except Exception as e:
            logger.warning(f"Validation failed for @{username}: {e}")
            return {
                "valid": False,
                "profile": None,
                "message": f"Akun Instagram @{username} tidak ditemukan atau gagal diakses."
            }

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

    def _fetch_profile_opengraph(self, db: Session, username: str) -> Dict[str, Any]:
        """Unauthenticated OpenGraph fallback for profile metadata."""
        import requests
        from bs4 import BeautifulSoup

        clean_user = username.strip().lstrip("@").lower()
        proxy_url = self.get_proxy_url(db)
        proxies = {"http": proxy_url, "https": proxy_url} if proxy_url else None
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        url = f"https://www.instagram.com/{clean_user}/"

        try:
            resp = requests.get(url, headers=headers, proxies=proxies, timeout=15)
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

    def fetch_competitor_profile(self, db: Session, username: str) -> Dict[str, Any]:
        """Fetch competitor profile information from Instagram."""
        clean_user = username.strip().lstrip("@").lower()

        try:
            cl = self.get_client(db, allow_anonymous=True)
            user_info = None
            try:
                user_info = cl.user_info_by_username_v1(clean_user)
            except Exception as e_v1:
                logger.debug(f"v1 profile fetch failed for @{clean_user}: {e_v1}, trying standard endpoint...")
                user_info = cl.user_info_by_username(clean_user)

            return {
                "username": clean_user,
                "instagram_pk": str(getattr(user_info, "pk", "")),
                "full_name": getattr(user_info, "full_name", clean_user) or clean_user,
                "profile_pic_url": str(getattr(user_info, "profile_pic_url", "")),
                "biography": getattr(user_info, "biography", ""),
                "followers_count": getattr(user_info, "follower_count", 0) or 0,
                "following_count": getattr(user_info, "following_count", 0) or 0,
                "media_count": getattr(user_info, "media_count", 0) or 0,
                "is_verified": getattr(user_info, "is_verified", False),
                "category_name": getattr(user_info, "category_name", ""),
            }
        except Exception as e_instagrapi:
            logger.warning(f"Instagrapi user_info failed for @{clean_user} ({e_instagrapi}). Falling back to OpenGraph scraper...")
            return self._fetch_profile_opengraph(db, clean_user)


    def fetch_competitor_posts(self, db: Session, user_id_or_username: str, amount: int = 20) -> Dict[str, Any]:
        """
        Fetch recent posts for a competitor, calculate engagement rate, top hashtags,
        and mark top-performing posts.
        """
        cl = self.get_client(db, allow_anonymous=True)
        
        # Resolve PK if username given
        followers_count = 1
        if not str(user_id_or_username).isdigit():
            clean_name = str(user_id_or_username).strip().lstrip("@")
            try:
                user_info = cl.user_info_by_username_v1(clean_name)
            except Exception:
                user_info = cl.user_info_by_username(clean_name)
            pk = getattr(user_info, "pk", None)
            followers_count = getattr(user_info, "follower_count", 1) or 1
        else:
            pk = int(user_id_or_username)
            try:
                user_info = cl.user_info(pk)
                followers_count = getattr(user_info, "follower_count", 1) or 1
            except Exception:
                followers_count = 1

        if not pk:
            raise ValueError(f"Tidak dapat menemukan ID Instagram untuk @{user_id_or_username}")

        try:
            medias = cl.user_medias(pk, amount=amount)
        except Exception as e_m:
            logger.warning(f"user_medias failed for {user_id_or_username}: {e_m}, trying v1 media fetch...")
            try:
                medias = cl.user_medias_v1(pk, amount=amount)
            except Exception:
                medias = []
        
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
                "posted_at": posted_at.strftime("%Y-%m-%dT%H:%M:%SZ") if posted_at else None,
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

    async def connect_with_sessionid(self, session_id: str, username: Optional[str] = None, existing_settings: Optional[dict] = None) -> dict:
        """Connect Instagram using raw sessionid cookie."""
        cl = self._create_client()
        if existing_settings and isinstance(existing_settings, dict):
            cl.set_settings(existing_settings)
        cl.login_by_sessionid(session_id)
        acc_info = cl.account_info()
        return {
            "pk": str(getattr(acc_info, "pk", "")),
            "username": getattr(acc_info, "username", username or "user"),
            "full_name": getattr(acc_info, "full_name", ""),
            "profile_pic_url": str(getattr(acc_info, "profile_pic_url", "")),
            "follower_count": getattr(acc_info, "follower_count", 0),
            "session_settings": cl.get_settings()
        }

    async def connect_with_credentials(self, username: str, password: str) -> dict:
        """Connect Instagram using username & password with Challenge Resolvers."""
        cl = self._create_client()
        try:
            cl.login(username, password)
        except Exception as e:
            err_msg = str(e)
            if "challenge_required" in err_msg.lower() or "challenge" in err_msg.lower():
                raise Exception(f"challenge_required:{username}\n{err_msg}")
            raise
        acc_info = cl.account_info()
        return {
            "pk": str(getattr(acc_info, "pk", "")),
            "username": getattr(acc_info, "username", username),
            "full_name": getattr(acc_info, "full_name", ""),
            "profile_pic_url": str(getattr(acc_info, "profile_pic_url", "")),
            "follower_count": getattr(acc_info, "follower_count", 0),
            "session_settings": cl.get_settings()
        }

    async def resolve_challenge(self, username: str, code: str) -> dict:
        """Submit challenge verification code to solve pending challenge."""
        cl = self._create_client()
        cl.challenge_code_handler = lambda uname, choice: code
        cl.login(username, "")
        acc_info = cl.account_info()
        return {
            "pk": str(getattr(acc_info, "pk", "")),
            "username": getattr(acc_info, "username", username),
            "full_name": getattr(acc_info, "full_name", ""),
            "profile_pic_url": str(getattr(acc_info, "profile_pic_url", "")),
            "follower_count": getattr(acc_info, "follower_count", 0),
            "session_settings": cl.get_settings()
        }


instagrapi_service = InstagrapiService()
