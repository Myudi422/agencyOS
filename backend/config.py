import os
from pathlib import Path

# Load env variables from .env.local if present
env_path = Path(__file__).resolve().parent / ".env.local"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                # Strip quotes if present
                val = val.strip("'\"")
                os.environ[key.strip()] = val

from typing import Optional

class Settings:
    APP_NAME: str = "Shiera API"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ENV: str = os.getenv("ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agencyos-super-secret-jwt-key-2026-enterprise")
    
    # Database (Supabase PostgreSQL)
    POSTGRES_URL: str = os.getenv(
        "POSTGRES_URL", 
        "postgres://postgres.aocqssdfhozjjrslexub:A75x41THRr0fB4uu@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
    )
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://aocqssdfhozjjrslexub.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY", 
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY3Fzc2RmaG96ampyc2xleHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg0NTc1MSwiZXhwIjoyMTAwNDIxNzUxfQ.nF8ixu0T8n5WRNCdxZwlRZVJYixrh7iqCId_kKx3Ktk"
    )
    SUPABASE_ANON_KEY: str = os.getenv(
        "SUPABASE_ANON_KEY",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY3Fzc2RmaG96ampyc2xleHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDU3NTEsImV4cCI6MjEwMDQyMTc1MX0.Uwa-vyeW1e88MJEOn5h8umuCbTPsBOVaZTMJ7_HWnSA"
    )
    
    # Queue (Upstash Redis)
    UPSTASH_REDIS_URL: str = os.getenv(
        "UPSTASH_REDIS_URL", 
        "rediss://default:gQAAAAAAAdrcAAIgcDJmMDRmMzQ5YjM3YWQ0ZGI3OWY5ODk1YjI0N2QxNGI5NA@internal-reptile-121564.upstash.io:6379"
    )
    UPSTASH_REDIS_TOKEN: str = os.getenv(
        "UPSTASH_REDIS_TOKEN", 
        "gQAAAAAAAdrcAAIgcDJmMDRmMzQ5YjM3YWQ0ZGI3OWY5ODk1YjI0N2QxNGI5NA"
    )
    
    # Storage (Backblaze B2 S3 Compatible + Cloudflare Unlimited Bandwidth Custom Domain)
    B2_ENDPOINT: str = os.getenv("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com")
    B2_BUCKET: str = os.getenv("B2_BUCKET", "ccgnimex")
    B2_ACCESS_KEY: str = os.getenv("B2_ACCESS_KEY", "0057ba6d7a5725c0000000002")
    B2_SECRET_KEY: str = os.getenv("B2_SECRET_KEY", "K005XvUqydtIZQvuNBYCM/UDhXfrWLQ")
    B2_PUBLIC_CUSTOM_DOMAIN: str = os.getenv("B2_PUBLIC_CUSTOM_DOMAIN", "https://file.legalpilar.id/file")

    # PostForMe API (https://api.postforme.dev)
    POSTFORME_API_KEY: str = os.getenv("POSTFORME_API_KEY", "pfm_live_7EsSZuXmrZaCqdyvkJbuDw")
    POSTFORME_BASE_URL: str = os.getenv("POSTFORME_BASE_URL", "https://api.postforme.dev")
    # Secret yang diterima saat mendaftarkan webhook ke PostForMe (isi setelah setup pertama)
    POSTFORME_WEBHOOK_SECRET: str = os.getenv("POSTFORME_WEBHOOK_SECRET", "whsec_b0fe7a5d0cd24c3582caa4844e55c0c1lrt7uvstp8")
    # URL publik untuk menerima webhook dari PostForMe
    POSTFORME_WEBHOOK_URL: str = os.getenv("POSTFORME_WEBHOOK_URL", "https://shiera.web.id/api/backend/webhook/postforme")


    # Meta Platform (OAuth 2.0 & Graph API v25.0 with HTTPS Callback)
    META_CLIENT_ID: str = os.getenv("META_CLIENT_ID", "1662829861460983")
    META_CLIENT_SECRET: str = os.getenv("META_CLIENT_SECRET", "64a65b12da82c841961be33c03826456")
    META_CALLBACK_URL: str = os.getenv("META_CALLBACK_URL", "https://localhost:3000/auth/callback")
    META_API_VERSION: str = "v25.0"

    # Firebase (Google Auth)
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "shiera-fb0f2")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "AIzaSyDiCCYSZVMSKMjkpx7QYZvUSxGYr-bQSdc")

    # Midtrans (Payment Gateway - Sandbox / Production)
    MIDTRANS_MERCHANT_ID: str = os.getenv("MIDTRANS_MERCHANT_ID", "G631089821")
    MIDTRANS_CLIENT_KEY: str = os.getenv("MIDTRANS_CLIENT_KEY", "SB-Mid-client-Hq-oZXhBhWzOSZzD")
    MIDTRANS_SERVER_KEY: str = os.getenv("MIDTRANS_SERVER_KEY", "SB-Mid-server-GmF6kILCY0UcSnUAXnHP3Y6-")
    MIDTRANS_IS_PRODUCTION: bool = os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"

    # Fonnte WhatsApp OTP API
    FONNTE_TOKEN: str = os.getenv("FONNTE_TOKEN", "9Ptcpu9PDJ9RpWgYKxSY")

    # Admin
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "myudi422@gmail.com")

    # Set mock mode to False for real DB/B2/Redis production connections
    USE_MOCK_SERVICES: bool = os.getenv("USE_MOCK_SERVICES", "false").lower() == "true"

settings = Settings()
