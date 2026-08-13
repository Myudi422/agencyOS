import os
import logging
from pathlib import Path

logger = logging.getLogger("AgencyOS-Config")

# Load env variables from .env.local if present (local development)
env_path = Path(__file__).resolve().parent / ".env.local"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                val = val.strip("'\"")
                os.environ[key.strip()] = val

from typing import Optional

_ENV = os.getenv("ENV", "development")
_IS_PRODUCTION = _ENV == "production"


def _require(key: str, dev_default: str = "") -> str:
    """
    Get env var. In production: raise RuntimeError if missing.
    In development: return dev_default (sourced from .env.local).
    NEVER put real credentials as dev_default — use .env.local for that.
    """
    val = os.getenv(key, "")
    if not val:
        if _IS_PRODUCTION:
            raise RuntimeError(
                f"[Security] Required env var '{key}' is not set in production. "
                f"Add it to your deployment environment variables."
            )
        logger.warning(f"[Config] '{key}' not set — using dev default. Set in .env.local for real values.")
        return dev_default
    return val


class Settings:
    APP_NAME: str = "Shiera API"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ENV: str = _ENV
    SECRET_KEY: str = _require("SECRET_KEY", "agencyos-dev-only-secret-key-change-in-production")

    # Database (Supabase PostgreSQL)
    POSTGRES_URL: str = _require("POSTGRES_URL")
    SUPABASE_URL: str = _require("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = _require("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_ANON_KEY: str = _require("SUPABASE_ANON_KEY")

    # Queue (Upstash Redis)
    UPSTASH_REDIS_URL: str = _require("UPSTASH_REDIS_URL")
    UPSTASH_REDIS_TOKEN: str = _require("UPSTASH_REDIS_TOKEN")

    # Storage (Backblaze B2 S3 Compatible + Cloudflare Custom Domain)
    B2_ENDPOINT: str = os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com")
    B2_BUCKET: str = _require("B2_BUCKET")
    B2_ACCESS_KEY: str = _require("B2_ACCESS_KEY")
    B2_SECRET_KEY: str = _require("B2_SECRET_KEY")
    B2_PUBLIC_CUSTOM_DOMAIN: str = os.getenv("B2_PUBLIC_CUSTOM_DOMAIN", "")

    # PostForMe API (https://api.postforme.dev)
    POSTFORME_API_KEY: str = _require("POSTFORME_API_KEY")
    POSTFORME_BASE_URL: str = os.getenv("POSTFORME_BASE_URL", "https://api.postforme.dev")
    POSTFORME_WEBHOOK_SECRET: str = _require("POSTFORME_WEBHOOK_SECRET")
    POSTFORME_WEBHOOK_URL: str = os.getenv("POSTFORME_WEBHOOK_URL", "https://shiera.web.id/api/backend/webhook/postforme")

    # Meta Platform (OAuth 2.0 & Graph API v25.0)
    META_CLIENT_ID: str = _require("META_CLIENT_ID")
    META_CLIENT_SECRET: str = _require("META_CLIENT_SECRET")
    META_CALLBACK_URL: str = os.getenv("META_CALLBACK_URL", "https://localhost:3000/auth/callback")
    META_API_VERSION: str = "v25.0"

    # Firebase (Google Auth)
    FIREBASE_PROJECT_ID: str = _require("FIREBASE_PROJECT_ID")
    FIREBASE_API_KEY: str = _require("FIREBASE_API_KEY")

    # Midtrans (Payment Gateway)
    MIDTRANS_MERCHANT_ID: str = _require("MIDTRANS_MERCHANT_ID")
    MIDTRANS_CLIENT_KEY: str = _require("MIDTRANS_CLIENT_KEY")
    MIDTRANS_SERVER_KEY: str = _require("MIDTRANS_SERVER_KEY")
    MIDTRANS_IS_PRODUCTION: bool = os.getenv("MIDTRANS_IS_PRODUCTION", "true").lower() == "true"

    # Fonnte WhatsApp OTP API
    FONNTE_TOKEN: str = _require("FONNTE_TOKEN")

    # Admin
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")

    # Set mock mode to False for real DB/B2/Redis production connections
    USE_MOCK_SERVICES: bool = os.getenv("USE_MOCK_SERVICES", "false").lower() == "true"


settings = Settings()
