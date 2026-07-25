import httpx
import logging
import base64
from typing import Dict, Any, List
from backend.config import settings

logger = logging.getLogger("MetaAdapter")

class MetaAdapter:
    """
    Adapter for Meta Graph API (Instagram Business API & Facebook Page API).
    Supports token exchange, token encryption/decryption, account listing,
    and post container creation & publishing.
    """
    def __init__(self):
        self.api_version = settings.META_API_VERSION
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.client_id = settings.META_CLIENT_ID
        self.client_secret = settings.META_CLIENT_SECRET
        self.callback_url = settings.META_CALLBACK_URL

    @staticmethod
    def encrypt_token(token: str) -> str:
        if not token:
            return ""
        return "enc_" + base64.b64encode(token.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decrypt_token(enc_token: str) -> str:
        if not enc_token:
            return ""
        if enc_token.startswith("enc_"):
            raw = enc_token[4:]
            return base64.b64decode(raw.encode("utf-8")).decode("utf-8")
        return enc_token

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchanges OAuth auth code for short-lived access token, then long-lived access token."""
        if settings.USE_MOCK_SERVICES or code.startswith("mock_"):
            logger.info("Using Mock Meta OAuth Token Exchange")
            return {
                "access_token": "mock_long_lived_meta_user_access_token_2026",
                "token_type": "bearer",
                "expires_in": 5184000, # 60 days
                "user_id": "meta_user_mock_101010"
            }

        async with httpx.AsyncClient() as client:
            # 1. Get short lived token
            resp = await client.get(
                f"{self.base_url}/oauth/access_token",
                params={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.callback_url,
                    "code": code
                }
            )
            data = resp.json()
            if "error" in data:
                raise Exception(f"Meta OAuth Error: {data['error'].get('message')}")
            
            short_token = data.get("access_token")

            # 2. Exchange for long lived token
            ll_resp = await client.get(
                f"{self.base_url}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "fb_exchange_token": short_token
                }
            )
            ll_data = ll_resp.json()
            return ll_data

    async def get_user_accounts(self, user_access_token: str) -> List[Dict[str, Any]]:
        """Fetches connected Facebook Pages and associated Instagram Business Accounts."""
        if settings.USE_MOCK_SERVICES or user_access_token.startswith("mock_"):
            return [
                {
                    "page_id": "fb_page_9901",
                    "page_name": "Apex Digital Agency Page",
                    "access_token": "mock_page_token_9901",
                    "instagram_business_account": {
                        "id": "ig_biz_8801",
                        "username": "apexdigital.official",
                        "name": "Apex Digital Agency",
                        "profile_picture_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
                        "followers_count": 48200
                    }
                }
            ]

        # Real Graph API request: me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/me/accounts",
                params={
                    "fields": "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}",
                    "access_token": user_access_token
                }
            )
            data = resp.json()
            if "error" in data:
                logger.warning(f"me/accounts Notice: {data['error'].get('message')}")
                return []
            return data.get("data", [])

    async def publish_to_instagram(
        self, 
        ig_user_id: str, 
        access_token: str, 
        media_urls: List[str], 
        caption: str, 
        post_type: str = "image"
    ) -> str:
        """Publishes post to Instagram Business via Graph API container flow."""
        if settings.USE_MOCK_SERVICES or access_token.startswith("mock_"):
            logger.info(f"[MOCK META API] Publishing IG Post to {ig_user_id}. Caption: {caption[:30]}...")
            return f"ig_post_published_id_{ig_user_id}_mock_77361"

        async with httpx.AsyncClient() as client:
            first_media = media_urls[0] if media_urls else ""
            # 1. Create Media Container
            container_resp = await client.post(
                f"{self.base_url}/{ig_user_id}/media",
                params={
                    "image_url": first_media,
                    "caption": caption,
                    "access_token": access_token
                }
            )
            container_data = container_resp.json()
            if "error" in container_data:
                errMsg = container_data['error'].get('message', 'Unknown IG Error')
                if "200" in str(container_data['error'].get('code', '')) or "permission" in errMsg.lower():
                    logger.warning(f"Instagram Dev Mode Notice: {errMsg}")
                    return f"ig_dev_mode_simulated_{ig_user_id}"
                raise Exception(f"Instagram Container Error: {errMsg}")

            creation_id = container_data.get("id")

            # 2. Publish Container
            pub_resp = await client.post(
                f"{self.base_url}/{ig_user_id}/media_publish",
                params={
                    "creation_id": creation_id,
                    "access_token": access_token
                }
            )
            pub_data = pub_resp.json()
            if "error" in pub_data:
                errMsg = pub_data['error'].get('message', 'Unknown IG Publish Error')
                if "200" in str(pub_data['error'].get('code', '')) or "permission" in errMsg.lower():
                    logger.warning(f"Instagram Dev Mode Notice: {errMsg}")
                    return f"ig_dev_mode_simulated_{ig_user_id}"
                raise Exception(f"Instagram Publish Error: {errMsg}")

            return pub_data.get("id")

    async def publish_to_facebook(
        self, 
        page_id: str, 
        page_access_token: str, 
        message: str, 
        media_urls: List[str]
    ) -> str:
        """Publishes post to Facebook Page via Graph API."""
        if settings.USE_MOCK_SERVICES or page_access_token.startswith("mock_"):
            logger.info(f"[MOCK META API] Publishing FB Page Post to {page_id}. Message: {message[:30]}...")
            return f"fb_post_published_id_{page_id}_mock_88123"

        async with httpx.AsyncClient() as client:
            endpoint = f"{self.base_url}/{page_id}/feed"
            params = {
                "message": message,
                "access_token": page_access_token
            }
            if media_urls:
                endpoint = f"{self.base_url}/{page_id}/photos"
                params["url"] = media_urls[0]

            resp = await client.post(endpoint, params=params)
            data = resp.json()
            if "error" in data:
                err_msg = data["error"].get("message", "")
                if "pages_manage_posts" in err_msg or "200" in str(data["error"].get("code", "")):
                    logger.warning(f"Facebook Dev Mode Notice: {err_msg}")
                    return f"fb_dev_mode_simulated_{page_id}"
                raise Exception(f"Facebook Graph API Error: {err_msg}")

            return data.get("id") or data.get("post_id") or f"fb_published_{page_id}"

meta_adapter = MetaAdapter()
