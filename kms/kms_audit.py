"""Audit logging utilities for key management operations."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

_AUDIT_PATH = Path(__file__).resolve().parent / "kms_audit.log"


def log_event(user_id: str, action: str, key_id: str, result: str, reason: Optional[str] = None, path: Path = _AUDIT_PATH) -> None:
    """Append an audit event to the log file."""
    timestamp = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    path.parent.mkdir(parents=True, exist_ok=True)
    message = f"[{timestamp}] user={user_id} action={action} key={key_id} result={result}"
    if reason:
        message += f" reason={reason}"
    with path.open("a", encoding="utf-8") as handle:
        handle.write(message + "\n")
