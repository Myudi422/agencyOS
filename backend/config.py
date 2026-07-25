import os
from typing import Optional

class Settings:
    APP_NAME: str = "AgencyOS API"
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
    POSTFORME_API_KEY: str = os.getenv("POSTFORME_API_KEY", "")
    POSTFORME_BASE_URL: str = os.getenv("POSTFORME_BASE_URL", "https://api.postforme.dev")

    # Meta Platform (OAuth 2.0 & Graph API v25.0 with HTTPS Callback)
    META_CLIENT_ID: str = os.getenv("META_CLIENT_ID", "1662829861460983")
    META_CLIENT_SECRET: str = os.getenv("META_CLIENT_SECRET", "64a65b12da82c841961be33c03826456")
    META_CALLBACK_URL: str = os.getenv("META_CALLBACK_URL", "https://localhost:3000/auth/callback")
    META_API_VERSION: str = "v25.0"

    # Set mock mode to False for real DB/B2/Redis production connections
    USE_MOCK_SERVICES: bool = os.getenv("USE_MOCK_SERVICES", "false").lower() == "true"

settings = Settings()
