"""
Redis Cache & Sync State Service — Upstash Redis Integration
Shared cache layer yang bisa dipakai di semua worker process/instance.

Menggantikan in-memory dict `_cache` dan `_sync_status` di competitors.py
agar scalable saat deploy multi-worker atau multi-instance.

Fitur:
- TTL-based cache (JSON serialized) untuk API responses
- Sync-all job state per workspace (progress polling)
- Rate-limiting cooldown per workspace per feature key
- Graceful fallback ke in-memory jika Redis tidak available
"""

import json
import time
import logging
from typing import Any, Optional

logger = logging.getLogger("RedisService")


def _make_redis_client():
    """Create Upstash Redis client using UPSTASH_REDIS_URL from settings."""
    try:
        from backend.config import settings
    except ModuleNotFoundError:
        from config import settings

    try:
        import redis
        # Upstash Redis uses rediss:// (TLS) protocol, works with redis-py directly
        client = redis.from_url(
            settings.UPSTASH_REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
            retry_on_timeout=True
        )
        # Ping to verify connection
        client.ping()
        logger.info("✅ Redis (Upstash) connected successfully.")
        return client
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed, falling back to in-memory: {e}")
        return None


# Singleton Redis client — shared across all requests in this worker
_redis_client = None
_redis_available = False
_redis_init_done = False

# Fallback in-memory storage
_mem_cache: dict = {}
_mem_sync: dict = {}


def _get_redis():
    global _redis_client, _redis_available, _redis_init_done
    if not _redis_init_done:
        _redis_client = _make_redis_client()
        _redis_available = _redis_client is not None
        _redis_init_done = True
    return _redis_client if _redis_available else None


# ─── Cache API ───────────────────────────────────────────────────────────────

def cache_get(key: str) -> Optional[Any]:
    """Get a cached value. Returns None if not found or expired."""
    r = _get_redis()
    if r:
        try:
            raw = r.get(key)
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning(f"Redis cache_get error: {e}")

    # Fallback: in-memory
    entry = _mem_cache.get(key)
    if entry and (time.time() - entry["ts"]) < entry["ttl"]:
        return entry["data"]
    return None


def cache_set(key: str, data: Any, ttl_seconds: int = 300):
    """Store a value in cache with TTL (seconds)."""
    r = _get_redis()
    if r:
        try:
            r.set(key, json.dumps(data, default=str), ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning(f"Redis cache_set error: {e}")

    # Fallback: in-memory
    _mem_cache[key] = {"ts": time.time(), "data": data, "ttl": ttl_seconds}


def cache_delete_prefix(prefix: str):
    """Delete all keys matching a prefix pattern."""
    r = _get_redis()
    if r:
        try:
            # Use SCAN to avoid blocking with KEYS on large keyspaces
            cursor = 0
            while True:
                cursor, keys = r.scan(cursor, match=f"{prefix}*", count=100)
                if keys:
                    r.delete(*keys)
                if cursor == 0:
                    break
            return
        except Exception as e:
            logger.warning(f"Redis cache_delete_prefix error: {e}")

    # Fallback: in-memory
    to_del = [k for k in _mem_cache if k.startswith(prefix)]
    for k in to_del:
        del _mem_cache[k]


# ─── Sync Status API ─────────────────────────────────────────────────────────

SYNC_STATUS_TTL = 3600  # 1 hour — auto-expire stale sync states


def sync_status_get(workspace_id: str) -> Optional[dict]:
    """Get sync-all job status for a workspace."""
    key = f"sync_status:{workspace_id}"
    r = _get_redis()
    if r:
        try:
            raw = r.get(key)
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning(f"Redis sync_status_get error: {e}")

    return _mem_sync.get(workspace_id)


def sync_status_set(workspace_id: str, data: dict):
    """Update sync-all job status for a workspace."""
    key = f"sync_status:{workspace_id}"
    r = _get_redis()
    if r:
        try:
            r.set(key, json.dumps(data, default=str), ex=SYNC_STATUS_TTL)
            return
        except Exception as e:
            logger.warning(f"Redis sync_status_set error: {e}")

    _mem_sync[workspace_id] = data


def sync_status_update_field(workspace_id: str, field: str, value: Any):
    """Atomically update a single field in the sync status dict."""
    status = sync_status_get(workspace_id) or {}
    status[field] = value
    sync_status_set(workspace_id, status)


def sync_status_increment_done(workspace_id: str):
    """Thread-safe increment of 'done' counter using Redis HINCRBY pattern."""
    r = _get_redis()
    inc_key = f"sync_done_counter:{workspace_id}"
    if r:
        try:
            done = r.incr(inc_key)
            r.expire(inc_key, SYNC_STATUS_TTL)
            # Merge into main status dict
            status = sync_status_get(workspace_id) or {}
            status["done"] = done
            sync_status_set(workspace_id, status)
            return done
        except Exception as e:
            logger.warning(f"Redis sync_status_increment_done error: {e}")

    # Fallback: non-atomic in-memory increment
    status = _mem_sync.get(workspace_id, {})
    status["done"] = status.get("done", 0) + 1
    _mem_sync[workspace_id] = status
    return status["done"]


# ─── Rate Limiting / Cooldown API ────────────────────────────────────────────

def check_rate_limit(key: str, cooldown_seconds: int = 1800) -> tuple[bool, int]:
    """
    Check if a rate-limited action (identified by key) is still in cooldown.
    Returns (is_limited: bool, remaining_seconds: int).
    """
    rate_key = f"ratelimit:{key}"
    r = _get_redis()
    if r:
        try:
            ttl = r.ttl(rate_key)
            if ttl > 0:
                return True, ttl
            return False, 0
        except Exception as e:
            logger.warning(f"Redis check_rate_limit error: {e}")

    # Fallback: in-memory
    entry = _mem_cache.get(rate_key)
    if entry:
        remaining = int(entry["ts"] + entry["ttl"] - time.time())
        if remaining > 0:
            return True, remaining
    return False, 0


def set_rate_limit(key: str, cooldown_seconds: int = 1800):
    """Mark a rate-limited action as used. Expires after cooldown_seconds."""
    rate_key = f"ratelimit:{key}"
    r = _get_redis()
    if r:
        try:
            r.set(rate_key, "1", ex=cooldown_seconds)
            return
        except Exception as e:
            logger.warning(f"Redis set_rate_limit error: {e}")

    _mem_cache[rate_key] = {"ts": time.time(), "data": "1", "ttl": cooldown_seconds}


def is_redis_available() -> bool:
    """Check if Redis backend is connected and working."""
    return _redis_available
