import re
import time
from collections import defaultdict
from threading import Lock
from typing import Any, DefaultDict, Dict, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: DefaultDict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            bucket = self._buckets[key]
            bucket[:] = [ts for ts in bucket if now - ts <= self.window_seconds]
            if len(bucket) >= self.max_requests:
                return False
            bucket.append(now)
            return True


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_origins: Optional[List[str]] = None, general_limit: int = 120, auth_limit: int = 20):
        super().__init__(app)
        self.allowed_origins = [origin.strip() for origin in (allowed_origins or []) if origin and origin.strip()]
        self.general_limiter = InMemoryRateLimiter(max_requests=general_limit, window_seconds=60)
        self.auth_limiter = InMemoryRateLimiter(max_requests=auth_limit, window_seconds=60)

    # Trusted reverse proxy IPs — only these may set X-Forwarded-For.
    # Vercel edge IPs are internal; add Cloudflare ranges if behind CF.
    _TRUSTED_PROXIES: frozenset = frozenset({"127.0.0.1", "::1", "10.0.0.1"})

    def _get_client_key(self, request: Request) -> str:
        client_ip = request.client.host if request.client else "unknown"
        # Only trust X-Forwarded-For if the direct connection comes from a known proxy
        if client_ip in self._TRUSTED_PROXIES:
            forwarded_for = request.headers.get("x-forwarded-for", "")
            if forwarded_for:
                return forwarded_for.split(",")[0].strip()
        return client_ip

    def _is_auth_path(self, path: str) -> bool:
        normalized = path.lower()
        return normalized.startswith("/auth") or normalized.startswith("/login")

    def _get_allowed_origin(self, request: Request) -> Optional[str]:
        origin = request.headers.get("origin")
        if not origin:
            return None
        if origin in self.allowed_origins:
            return origin
        return None

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith("/docs") or path.startswith("/openapi") or path.startswith("/redoc"):
            response = await call_next(request)
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
            response.headers["X-Frame-Options"] = "DENY"
            return response

        if request.method != "OPTIONS":
            client_key = self._get_client_key(request)
            limiter = self.auth_limiter if self._is_auth_path(path) else self.general_limiter
            if not limiter.allow(client_key):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please slow down and try again shortly."},
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": str(limiter.max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-Content-Type-Options": "nosniff",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
                        "X-Frame-Options": "DENY",
                        "Cache-Control": "no-store",
                    },
                )

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Cache-Control"] = "no-store"

        origin = self._get_allowed_origin(request)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"

        return response


def sanitize_text(value: Any, *, max_length: int = 2000, allow_newlines: bool = False) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    if not isinstance(value, str):
        return str(value)

    text = value.strip()
    text = re.sub(r"<[^>]*>", "", text)
    if allow_newlines:
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    else:
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
        text = re.sub(r"\s+", " ", text)

    if len(text) > max_length:
        text = text[:max_length]
    return text


def sanitize_payload(value: Any, *, max_length: int = 2000, allow_newlines: bool = False) -> Any:
    if isinstance(value, dict):
        return {str(k): sanitize_payload(v, max_length=max_length, allow_newlines=allow_newlines) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize_payload(item, max_length=max_length, allow_newlines=allow_newlines) for item in value]
    if isinstance(value, str):
        return sanitize_text(value, max_length=max_length, allow_newlines=allow_newlines)
    return value


def normalize_identifier(value: Optional[str], *, max_length: int = 120) -> Optional[str]:
    if not value:
        return None
    text = sanitize_text(value, max_length=max_length, allow_newlines=False)
    return text.lower().replace("@", "") if text else None
