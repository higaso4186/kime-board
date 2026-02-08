from datetime import datetime, timedelta, timezone
from threading import Lock


class InMemoryIdempotencyStore:
    def __init__(self, ttl_minutes: int = 120) -> None:
        self._ttl = timedelta(minutes=ttl_minutes)
        self._data: dict[str, datetime] = {}
        self._lock = Lock()

    def _cleanup(self, now: datetime) -> None:
        expired = [k for k, v in self._data.items() if now - v > self._ttl]
        for key in expired:
            self._data.pop(key, None)

    def seen(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        with self._lock:
            self._cleanup(now)
            return key in self._data

    def mark(self, key: str) -> None:
        now = datetime.now(timezone.utc)
        with self._lock:
            self._cleanup(now)
            self._data[key] = now
