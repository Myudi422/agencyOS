import logging
import httpx
from typing import Dict, Any, List, Optional
from backend.config import settings

logger = logging.getLogger("PostForMeService")

class PostForMeService:
    """
    Service client for PostForMe API (https://api.postforme.dev)
    Provides full multi-platform publishing, account connection, auth URL generation,
    media upload signing, previews, post results, and feed management for:
    - Instagram, Facebook, X (Twitter), TikTok, TikTok Business, YouTube, Pinterest, LinkedIn, Bluesky, Threads
    """

    def __init__(self):
        self.base_url = settings.POSTFORME_BASE_URL.rstrip('/')
        self.api_key = settings.POSTFORME_API_KEY

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def create_upload_url(self, content_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Request a signed upload URL from PostForMe.
        Endpoint: POST /v1/media/create-upload-url
        Returns: { "media_url": "...", "upload_url": "..." }
        """
        url = f"{self.base_url}/v1/media/create-upload-url"
        if not self.api_key:
            logger.warning("POSTFORME_API_KEY not configured. Returning simulated upload URL.")
            simulated_id = f"pf_media_{httpx.__version__}"
            return {
                "media_url": f"https://file.legalpilar.id/file/sample-postforme-{simulated_id}.jpg",
                "upload_url": f"https://api.postforme.dev/upload-simulated-{simulated_id}"
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def generate_auth_url(
        self,
        platform: str,
        platform_data: Optional[Dict[str, Any]] = None,
        external_id: Optional[str] = None,
        permissions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate OAuth auth URL for connecting a social account.
        Endpoint: POST /v1/social-accounts/auth-url

        NOTE: redirect_url_override is NOT supported for Quickstart projects.
        The callback URL must be configured in the PostForMe dashboard instead.
        For Instagram/Facebook/Threads, platform_data with connection_type is auto-injected.
        """
        url = f"{self.base_url}/v1/social-accounts/auth-url"

        # Auto-format platform_data for Instagram (PostForMe API requires nesting under 'instagram' key)
        if platform == "instagram":
            conn_type = "instagram"
            if platform_data:
                if "instagram" in platform_data and "connection_type" in platform_data["instagram"]:
                    conn_type = platform_data["instagram"]["connection_type"]
                elif "connection_type" in platform_data:
                    conn_type = platform_data["connection_type"]
            platform_data = {"instagram": {"connection_type": conn_type}}
            logger.info(f"Formatted platform_data for Instagram: {platform_data}")

        payload: Dict[str, Any] = {"platform": platform}
        if platform_data:
            payload["platform_data"] = platform_data
        if external_id:
            payload["external_id"] = external_id
        if permissions:
            payload["permissions"] = permissions
        else:
            payload["permissions"] = ["posts", "feeds"]

        if not self.api_key:
            logger.warning("POSTFORME_API_KEY not set. Returning demo OAuth auth URL.")
            return {
                "url": f"https://api.postforme.dev/oauth/connect?platform={platform}&demo=true",
                "platform": platform
            }

        logger.info(f"Calling PostForMe auth-url for platform={platform}, payload={payload}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload, headers=self._get_headers())
            if res.status_code not in (200, 201):
                logger.error(f"PostForMe auth-url error {res.status_code}: {res.text}")
            res.raise_for_status()
            return res.json()

    async def get_social_accounts(
        self,
        platform: Optional[List[str]] = None,
        username: Optional[List[str]] = None,
        external_id: Optional[List[str]] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get connected social accounts from PostForMe.
        Endpoint: GET /v1/social-accounts
        """
        url = f"{self.base_url}/v1/social-accounts"
        params: Dict[str, Any] = {"offset": offset, "limit": limit}
        if platform:
            params["platform"] = platform
        if username:
            params["username"] = username
        if external_id:
            params["external_id"] = external_id
        if status:
            params["status"] = status

        if not self.api_key:
            return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit, "next": None}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url, params=params, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def create_social_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Manually register or update a social account in PostForMe.
        Endpoint: POST /v1/social-accounts
        """
        url = f"{self.base_url}/v1/social-accounts"
        if not self.api_key:
            logger.warning("POSTFORME_API_KEY not configured. Returning simulated account object.")
            return {
                "id": f"spc_{account_data.get('platform', 'account')}_demo",
                "platform": account_data.get("platform"),
                "username": account_data.get("username", "demo_user"),
                "status": "connected"
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=account_data, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def disconnect_social_account(self, account_id: str) -> Dict[str, Any]:
        """
        Disconnect a social account in PostForMe.
        Endpoint: POST /v1/social-accounts/{id}/disconnect
        """
        url = f"{self.base_url}/v1/social-accounts/{account_id}/disconnect"
        if not self.api_key:
            return {"status": "success", "message": f"Account {account_id} disconnected (mock)"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def delete_social_account(self, account_id: str) -> Dict[str, Any]:
        """
        Delete a social account in PostForMe.
        Endpoint: DELETE /v1/social-accounts/{id}
        """
        url = f"{self.base_url}/v1/social-accounts/{account_id}"
        if not self.api_key:
            return {"status": "success", "message": f"Account {account_id} deleted (mock)"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.delete(url, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def create_post(
        self,
        caption: str,
        social_accounts: List[str],
        media: Optional[List[Dict[str, Any]]] = None,
        platform_configurations: Optional[Dict[str, Any]] = None,
        account_configurations: Optional[List[Dict[str, Any]]] = None,
        scheduled_at: Optional[str] = None,
        is_draft: bool = False,
        external_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a post across multi-platform social accounts in PostForMe.
        Endpoint: POST /v1/social-posts
        """
        url = f"{self.base_url}/v1/social-posts"
        payload: Dict[str, Any] = {
            "caption": caption,
            "social_accounts": social_accounts,
            "isDraft": is_draft
        }
        if media:
            payload["media"] = media
        if platform_configurations:
            payload["platform_configurations"] = platform_configurations
        if account_configurations:
            payload["account_configurations"] = account_configurations
        if scheduled_at:
            payload["scheduled_at"] = scheduled_at
        if external_id:
            payload["external_id"] = external_id

        if not self.api_key:
            logger.warning("POSTFORME_API_KEY not configured. Simulating PostForMe post creation.")
            import uuid
            mock_id = f"pst_pf_{uuid.uuid4().hex[:12]}"
            return {
                "id": mock_id,
                "caption": caption,
                "social_accounts": social_accounts,
                "status": "scheduled" if scheduled_at else "processing",
                "created_at": "2026-07-25T20:00:00.000Z"
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def get_posts(
        self,
        offset: int = 0,
        limit: int = 50,
        platform: Optional[List[str]] = None,
        status: Optional[List[str]] = None,
        external_id: Optional[List[str]] = None,
        social_account_id: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get paginated posts from PostForMe.
        Endpoint: GET /v1/social-posts
        """
        url = f"{self.base_url}/v1/social-posts"
        params: Dict[str, Any] = {"offset": offset, "limit": limit}
        if platform:
            params["platform"] = platform
        if status:
            params["status"] = status
        if external_id:
            params["external_id"] = external_id
        if social_account_id:
            params["social_account_id"] = social_account_id

        if not self.api_key:
            return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit, "next": None}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url, params=params, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def get_post_results(
        self,
        post_id: Optional[List[str]] = None,
        platform: Optional[List[str]] = None,
        social_account_id: Optional[List[str]] = None,
        offset: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get published post results & metrics across platforms.
        Endpoint: GET /v1/social-post-results
        """
        url = f"{self.base_url}/v1/social-post-results"
        params: Dict[str, Any] = {"offset": offset, "limit": limit}
        if post_id:
            params["post_id"] = post_id
        if platform:
            params["platform"] = platform
        if social_account_id:
            params["social_account_id"] = social_account_id

        if not self.api_key:
            return {"data": [], "meta": {"total": 0, "offset": offset, "limit": limit, "next": None}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url, params=params, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def create_post_preview(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate social post preview across platforms.
        Endpoint: POST /v1/social-post-previews
        """
        url = f"{self.base_url}/v1/social-post-previews"
        if not self.api_key:
            return {"previews": []}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

    async def get_account_feed(self, social_account_id: str, limit: int = 20) -> Dict[str, Any]:
        """
        Get account post feed and analytics.
        Endpoint: GET /v1/social-account-feeds/{social_account_id}
        """
        url = f"{self.base_url}/v1/social-account-feeds/{social_account_id}"
        if not self.api_key:
            return {"items": []}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url, params={"limit": limit}, headers=self._get_headers())
            res.raise_for_status()
            return res.json()

postforme_service = PostForMeService()
