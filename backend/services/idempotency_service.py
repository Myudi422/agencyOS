import time
import logging
from typing import Dict, Tuple

logger = logging.getLogger("IdempotencyService")

# In-memory store for active locks and processed request keys
# Schema: { lock_key: expire_timestamp }
_LOCK_STORE: Dict[str, float] = {}
_REQUEST_STORE: Dict[str, float] = {}

def cleanup_expired_keys():
    """Periodically cleans up expired keys from memory."""
    now = time.time()
    expired_locks = [k for k, exp in _LOCK_STORE.items() if exp < now]
    for k in expired_locks:
        _LOCK_STORE.pop(k, None)

    expired_requests = [k for k, exp in _REQUEST_STORE.items() if exp < now]
    for k in expired_requests:
        _REQUEST_STORE.pop(k, None)

def acquire_lock(key: str, ttl_seconds: int = 30) -> bool:
    """
    Attempts to acquire an in-memory lock for key.
    Returns True if lock acquired, False if lock is already held.
    """
    cleanup_expired_keys()
    now = time.time()
    if key in _LOCK_STORE:
        if _LOCK_STORE[key] > now:
            logger.warning(f"Lock already held for key: {key}")
            return False
    _LOCK_STORE[key] = now + ttl_seconds
    return True

def release_lock(key: str):
    """Releases an in-memory lock for key."""
    _LOCK_STORE.pop(key, None)

def is_request_processed(key: str) -> bool:
    """Checks if a request key was already processed."""
    cleanup_expired_keys()
    now = time.time()
    if key in _REQUEST_STORE:
        return _REQUEST_STORE[key] > now
    return False

def mark_request_processed(key: str, ttl_seconds: int = 300):
    """Marks a request key as processed for ttl_seconds."""
    cleanup_expired_keys()
    _REQUEST_STORE[key] = time.time() + ttl_seconds
