"""
Simple in-memory TTL cache for hot data.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import RLock
from typing import Any, Dict, Optional


@dataclass
class CacheEntry:
    value: Any
    expires_at: datetime


class TTLCache:
    """Thread-safe TTL cache with a max size."""

    def __init__(self, max_size: int = 256) -> None:
        self._max_size = max_size
        self._items: Dict[str, CacheEntry] = {}
        self._lock = RLock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._items.get(key)
            if entry is None:
                return None
            if entry.expires_at <= datetime.now(timezone.utc):
                self._items.pop(key, None)
                return None
            return entry.value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
        with self._lock:
            if len(self._items) >= self._max_size:
                # Drop the oldest entry by expiry time.
                oldest_key = min(self._items, key=lambda k: self._items[k].expires_at)
                self._items.pop(oldest_key, None)
            self._items[key] = CacheEntry(value=value, expires_at=expires_at)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()
