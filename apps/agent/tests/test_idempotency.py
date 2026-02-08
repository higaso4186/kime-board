import time

from src.utils.idempotency import InMemoryIdempotencyStore


def test_idempotency_mark_and_seen() -> None:
    store = InMemoryIdempotencyStore(ttl_minutes=5)
    key = "workflow:test"
    assert store.seen(key) is False
    store.mark(key)
    assert store.seen(key) is True


def test_idempotency_expires() -> None:
    store = InMemoryIdempotencyStore(ttl_minutes=0)
    key = "workflow:test-expire"
    store.mark(key)
    time.sleep(0.01)
    assert store.seen(key) is False
