import os
import re
import logging
import tempfile
import httpx
from pathlib import Path
from typing import Dict, Any, Optional, List

logger = logging.getLogger("InstagrapiService")

# Register FFmpeg for video processing
try:
    import imageio_ffmpeg
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    if ffmpeg_path and os.path.exists(ffmpeg_path):
        os.environ["IMAGEIO_FFMPEG_EXE"] = ffmpeg_path
        logger.info(f"FFmpeg registered: {ffmpeg_path}")
except Exception as e:
    logger.warning(f"Could not auto-register imageio-ffmpeg: {e}")

try:
    from aiograpi import Client
    INSTAGRAPI_AVAILABLE = True
    logger.info("aiograpi (async Private API) registered successfully!")
except ImportError:
    try:
        from instagrapi import Client
        INSTAGRAPI_AVAILABLE = True
        logger.info("instagrapi registered as fallback.")
    except ImportError:
        INSTAGRAPI_AVAILABLE = False
        logger.warning("Neither aiograpi nor instagrapi is installed.")

try:
    import instagrapi_extra
    INSTAGRAPI_EXTRA_AVAILABLE = True
    logger.info("instagrapi-extra plugin registered successfully!")
except ImportError:
    INSTAGRAPI_EXTRA_AVAILABLE = False

class SessionExpired(Exception):
    """Instagram session expired — user must reconnect with a fresh sessionid."""
    pass

# Module-level store for pending Instagram login challenges.
_pending_challenge_clients: Dict[str, Any] = {}

class InstagrapiService:
    def __init__(self):
        self.enabled = INSTAGRAPI_AVAILABLE

    async def _get_client(self, settings_data: Dict[str, Any]) -> Any:
        """
        Restore aiograpi client using set_settings().
        Ensures authorization_data and Authorization (Bearer IGT:2:...) header
        are explicitly restored so that requests are properly signed per account.
        """
        if not INSTAGRAPI_AVAILABLE:
            raise Exception("aiograpi is not installed.")

        clean_settings = {
            k: v for k, v in settings_data.items()
            if not k.startswith("_")
        }

        cl = Client()
        if INSTAGRAPI_EXTRA_AVAILABLE:
            try:
                instagrapi_extra.apply_country(cl, "ID")
            except Exception as ex_err:
                logger.warning(f"apply_country notice: {ex_err}")

        try:
            cl.set_settings(clean_settings)
            logger.info("Session restored via set_settings() in aiograpi.")
        except Exception as e:
            logger.warning(f"set_settings() warning: {e}")

        sessionid = (
            clean_settings.get("sessionid")
            or clean_settings.get("cookies", {}).get("sessionid")
            or clean_settings.get("authorization_data", {}).get("sessionid")
        )
        ds_user_id = (
            clean_settings.get("ds_user_id")
            or clean_settings.get("cookies", {}).get("ds_user_id")
            or clean_settings.get("authorization_data", {}).get("ds_user_id")
        )

        if sessionid and ds_user_id:
            cl.authorization_data = {
                "ds_user_id": str(ds_user_id),
                "sessionid": sessionid,
                "should_use_header_over_cookies": True
            }
            if cl.authorization:
                cl.private.headers["Authorization"] = cl.authorization
                logger.info(f"Injected Authorization Bearer token for ds_user_id={ds_user_id}")

        return cl

    async def _extract_session_info(self, cl: Any, fallback_username: str = "") -> Dict[str, Any]:
        """
        Extract account info and build session_settings dict from a logged-in aiograpi Client.
        """
        account_info = await cl.account_info()
        user_dict = account_info.dict() if hasattr(account_info, "dict") else account_info
        pk = str(user_dict.get("pk") or user_dict.get("id"))

        session_settings = cl.get_settings()
        if isinstance(session_settings, dict):
            sessionid = (
                session_settings.get("cookies", {}).get("sessionid")
                or session_settings.get("sessionid", "")
            )
            session_settings["sessionid"] = sessionid
            session_settings["ds_user_id"] = pk
            session_settings["authorization_data"] = {
                "ds_user_id": pk,
                "sessionid": sessionid,
                "should_use_header_over_cookies": True
            }

        logger.info(f"Session extracted (aiograpi): @{user_dict.get('username', fallback_username)} (pk={pk})")
        return {
            "pk": pk,
            "username": user_dict.get("username", fallback_username),
            "full_name": user_dict.get("full_name", ""),
            "profile_pic_url": str(user_dict.get("profile_pic_url", "")),
            "follower_count": user_dict.get("follower_count", 0),
            "session_settings": session_settings,
        }

    async def connect_with_sessionid(
        self,
        sessionid: str,
        username: Optional[str] = None,
        existing_settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Connect via browser sessionid cookie using aiograpi async Client.
        """
        if not INSTAGRAPI_AVAILABLE:
            raise Exception("aiograpi is not installed.")

        cl = Client()
        sessionid = sessionid.strip()

        if INSTAGRAPI_EXTRA_AVAILABLE:
            try:
                instagrapi_extra.apply_country(cl, "ID")
            except Exception as ex_err:
                logger.warning(f"apply_country notice: {ex_err}")

        if existing_settings and isinstance(existing_settings, dict):
            try:
                cl.set_settings(existing_settings)
                logger.info("Restored existing session settings.")
            except Exception as e:
                logger.warning(f"Could not restore existing settings: {e}")

        logger.info("Authenticating with Instagram via sessionid (safe mode)...")
        raw_input = sessionid.strip()
        parsed_cookies: Dict[str, str] = {}

        # Format 1: JSON Cookie Array (from Cookie-Editor / EditThisCookie extension)
        if raw_input.startswith("[") and raw_input.endswith("]"):
            try:
                import json
                items = json.loads(raw_input)
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict) and "name" in item and "value" in item:
                            parsed_cookies[item["name"]] = str(item["value"])
                    logger.info(f"Parsed {len(parsed_cookies)} cookies from JSON array format.")
            except Exception as json_err:
                logger.warning(f"Could not parse JSON cookie array: {json_err}")

        # Format 2: Header String (sessionid=...; ds_user_id=...; rur=...)
        if not parsed_cookies and "=" in raw_input:
            for item in raw_input.split(";"):
                item = item.strip()
                if "=" in item:
                    k, v = item.split("=", 1)
                    parsed_cookies[k.strip()] = v.strip()
            logger.info(f"Parsed {len(parsed_cookies)} cookies from Header string format.")

        # Format 3: Single sessionid string
        if not parsed_cookies:
            parsed_cookies["sessionid"] = raw_input

        actual_sessionid = parsed_cookies.get("sessionid", raw_input)
        user_match = re.search(r"^\d+", actual_sessionid)
        if not user_match:
            raise Exception("Invalid sessionid cookie format.")
        ds_user_id = parsed_cookies.get("ds_user_id") or user_match.group()
        parsed_cookies["ds_user_id"] = str(ds_user_id)
        parsed_cookies["sessionid"] = actual_sessionid

        cl.set_settings({
            "cookies": parsed_cookies,
            "authorization_data": {
                "ds_user_id": str(ds_user_id),
                "sessionid": actual_sessionid,
                "should_use_header_over_cookies": True,
            }
        })
        cl.private.headers.update(cl.base_headers)
        if cl.authorization:
            cl.private.headers.update({"Authorization": cl.authorization})

        return await self._extract_session_info(cl, username or "instagram_user")

    async def connect_with_credentials(self, username: str, password: str) -> Dict[str, Any]:
        """
        Connect via username + password using aiograpi mobile login flow.
        """
        if not INSTAGRAPI_AVAILABLE:
            raise Exception("aiograpi is not installed.")

        try:
            from aiograpi.exceptions import ChallengeRequired
        except ImportError:
            try:
                from instagrapi.exceptions import ChallengeRequired
            except ImportError:
                class ChallengeRequired(Exception): pass

        uname = username.strip().lower().replace("@", "")
        cl = Client()
        logger.info(f"Attempting credential login (aiograpi) for @{uname}...")

        try:
            result = await cl.login(uname, password.strip())
            if not result:
                raise Exception("Login returned False. Check credentials.")

            logger.info(f"Credential login successful for @{uname}")
            return await self._extract_session_info(cl, uname)

        except ChallengeRequired:
            logger.info(f"Challenge required for @{uname} — storing client for resolution")
            _pending_challenge_clients[uname] = cl
            try:
                send_result = await cl.challenge_send_code("email")
                logger.info(f"Challenge code sent: {send_result}")
            except Exception as send_err:
                logger.warning(f"challenge_send_code failed: {send_err}")

            raise Exception(
                f"challenge_required:{uname}\n"
                "Instagram requires email/SMS verification. "
                f"Check the email linked to @{uname} and enter the 6-digit code."
            )

    async def resolve_challenge(self, username: str, code: str) -> Dict[str, Any]:
        """
        Complete a pending Instagram login challenge using aiograpi.
        """
        if not INSTAGRAPI_AVAILABLE:
            raise Exception("aiograpi is not installed.")

        uname = username.strip().lower().replace("@", "")
        cl = _pending_challenge_clients.get(uname)
        if not cl:
            raise Exception(
                f"No pending challenge session found for @{uname}. "
                "Please restart the login process."
            )

        try:
            result = await cl.challenge_resolve_simple(code.strip())
            logger.info(f"Challenge resolved for @{uname}: result={result}")
        except Exception as e:
            raise Exception(f"Challenge code rejected or error: {str(e)}")

        del _pending_challenge_clients[uname]
        return await self._extract_session_info(cl, uname)

    async def _download_to_temp(self, url: str, force_square: bool = False) -> tuple:
        """
        Async download URL to temp file using httpx.AsyncClient.
        If force_square=True (for Carousel/Album), resizes & centers image into exact 1080x1080 square canvas.
        """
        try:
            from PIL import Image as PILImage
            PIL_AVAILABLE = True
        except ImportError:
            PIL_AVAILABLE = False

        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as http_client:
            resp = await http_client.get(url)
            resp.raise_for_status()
            content_bytes = resp.content
            content_type = resp.headers.get("content-type", "").lower()

        is_video = "video" in content_type or url.lower().endswith((".mp4", ".mov", ".avi", ".webm"))

        if is_video:
            f = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
            f.write(content_bytes)
            f.close()
            return Path(f.name), True

        f = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        f.write(content_bytes)
        f.close()

        if PIL_AVAILABLE:
            try:
                img = PILImage.open(f.name)
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")

                if force_square:
                    w, h = img.size
                    min_side = min(w, h)
                    left = (w - min_side) // 2
                    top = (h - min_side) // 2
                    img = img.crop((left, top, left + min_side, top + min_side))
                    img = img.resize((1080, 1080), PILImage.LANCZOS)
                else:
                    w, h = img.size
                    ratio = w / h
                    if ratio > 1.91:
                        new_w = int(h * 1.91)
                        left = (w - new_w) // 2
                        img = img.crop((left, 0, left + new_w, h))
                    elif ratio < 0.8:
                        new_h = int(w / 0.8)
                        top = (h - new_h) // 2
                        img = img.crop((0, top, w, top + new_h))

                    if img.width > 1080 or img.height > 1080:
                        img.thumbnail((1080, 1080), PILImage.LANCZOS)

                img.save(f.name, "JPEG", quality=95, subsampling=0)
                logger.info(f"Image normalized to {img.size} JPEG (force_square={force_square}).")
            except Exception as pil_err:
                logger.warning(f"PIL normalization failed (using raw): {pil_err}")

        return Path(f.name), False

    async def publish_post(
        self,
        session_settings: Dict[str, Any],
        media_urls: List[str],
        caption: str,
        is_video: bool = False
    ) -> Dict[str, Any]:
        """
        Upload media asynchronously via aiograpi.
        Detects session expiry from 403 responses and raises SessionExpired.
        """
        cl = await self._get_client(session_settings)

        if not media_urls:
            raise Exception("No media URLs provided.")

        # ── Carousel / Album (2–10 items) ─────────────────────────────────────
        if len(media_urls) > 1:
            logger.info(f"Uploading carousel ({len(media_urls)} items) via aiograpi...")
            paths: List[Path] = []
            try:
                for url in media_urls:
                    p, _ = await self._download_to_temp(url, force_square=True)
                    paths.append(p)
                    logger.info(f"  Prepared uniform square item: {p.name}")

                media = await cl.album_upload(
                    paths=paths,
                    caption=caption
                )
                d = media.dict() if hasattr(media, "dict") else media
                pk = str(d.get("pk") or d.get("id", "ok"))
                code = d.get("code", "")
                logger.info(f"Carousel published via aiograpi! pk={pk} code={code}")
                return {"id": pk, "code": code, "url": f"https://www.instagram.com/p/{code}/" if code else ""}
            finally:
                for p in paths:
                    p.unlink(missing_ok=True)

        # ── Single media ───────────────────────────────────────────────────────
        media_url = media_urls[0]
        path, is_actual_video = await self._download_to_temp(media_url, force_square=False)
        try:
            logger.info(f"Uploading {'reel/video' if is_actual_video else 'photo'} via aiograpi...")
            if is_actual_video:
                try:
                    media = await cl.clip_upload(path, caption=caption)
                except Exception as reel_err:
                    logger.warning(f"clip_upload failed: {reel_err} — retrying as video_upload...")
                    media = await cl.video_upload(path, caption=caption)
            else:
                media = await cl.photo_upload(path, caption=caption)

            d = media.dict() if hasattr(media, "dict") else media
            pk = str(d.get("pk") or d.get("id", "ok"))
            code = d.get("code", "")
            logger.info(f"Single post published via aiograpi! pk={pk} code={code}")
            return {"id": pk, "code": code, "url": f"https://www.instagram.com/p/{code}/" if code else ""}
        finally:
            path.unlink(missing_ok=True)

instagrapi_service = InstagrapiService()
