"""
Firebase ID Token Verification Service
Uses Google's public keys to verify Firebase tokens without firebase-admin SDK.
"""
import logging
import requests
from typing import Optional, Dict, Any
from backend.config import settings

logger = logging.getLogger("FirebaseService")

GOOGLE_PUBLIC_KEYS_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys"
FIREBASE_VERIFY_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}"
)


def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token by calling Google Identity Toolkit API.
    Returns decoded user info dict or None if invalid.
    """
    try:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={settings.FIREBASE_API_KEY}"
        payload = {"idToken": id_token}
        resp = requests.post(url, json=payload, timeout=10)

        if resp.status_code != 200:
            logger.warning(f"Firebase token verify failed: {resp.text}")
            return None

        data = resp.json()
        users = data.get("users", [])
        if not users:
            return None

        user = users[0]
        return {
            "firebase_uid": user.get("localId"),
            "email": user.get("email"),
            "full_name": user.get("displayName") or user.get("email", "").split("@")[0],
            "avatar_url": user.get("photoUrl"),
            "email_verified": user.get("emailVerified", False),
        }
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}", exc_info=True)
        return None
