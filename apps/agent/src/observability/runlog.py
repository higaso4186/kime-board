from dataclasses import dataclass
from datetime import datetime, timezone
import uuid


def new_run_id(prefix: str = "run") -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class RunContext:
    run_id: str
    workflow: str
    project_id: str
    idempotency_key: str | None = None
    meeting_id: str | None = None
    decision_id: str | None = None
