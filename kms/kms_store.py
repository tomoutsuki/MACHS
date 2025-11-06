"""Simulated persistent storage for KMS metadata."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

_STORE_PATH = Path(__file__).resolve().parent / "kms_store.json"


@dataclass
class KeyRecord:
    """Metadata for a managed key."""

    id: str
    type: str
    version: int
    creation_date: str
    expiration: Optional[str]
    attributes: List[str]
    policy: str
    status: str
    encrypted_key: Optional[str] = None

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "KeyRecord":
        return cls(
            id=str(payload["id"]),
            type=str(payload["type"]),
            version=int(payload.get("version", 1)),
            creation_date=str(payload.get("creation_date", _timestamp())),
            expiration=payload.get("expiration"),
            attributes=list(payload.get("attributes", [])),
            policy=str(payload.get("policy", "")),
            status=str(payload.get("status", "inactive")),
            encrypted_key=payload.get("encrypted_key"),
        )


def _timestamp() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def _load_store(path: Path = _STORE_PATH) -> Dict[str, Dict[str, object]]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        try:
            data = json.load(handle)
        except json.JSONDecodeError:
            return {}
    return {str(k): dict(v) for k, v in data.items()}


def _write_store(data: Dict[str, Dict[str, object]], path: Path = _STORE_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)


def save_key(key_obj: KeyRecord, path: Path = _STORE_PATH) -> None:
    """Persist key metadata to the store."""
    data = _load_store(path)
    data[key_obj.id] = asdict(key_obj)
    _write_store(data, path)


def load_key(key_id: str, path: Path = _STORE_PATH) -> Optional[KeyRecord]:
    """Retrieve a key record by id."""
    data = _load_store(path)
    record = data.get(key_id)
    return KeyRecord.from_dict(record) if record else None


def list_keys(path: Path = _STORE_PATH) -> List[KeyRecord]:
    """List all key records stored so far."""
    return [KeyRecord.from_dict(item) for item in _load_store(path).values()]


def update_key_status(key_id: str, status: str, path: Path = _STORE_PATH) -> None:
    """Update the status of a stored key."""
    data = _load_store(path)
    if key_id not in data:
        raise KeyError(f"Unknown key id: {key_id}")
    data[key_id]["status"] = status
    data[key_id]["updated_at"] = _timestamp()
    _write_store(data, path)


def update_key_record(key_id: str, updates: Dict[str, object], path: Path = _STORE_PATH) -> None:
    """Apply arbitrary updates to a stored key record."""
    data = _load_store(path)
    if key_id not in data:
        raise KeyError(f"Unknown key id: {key_id}")
    data[key_id].update(updates)
    data[key_id]["updated_at"] = _timestamp()
    _write_store(data, path)


def delete_all(path: Path = _STORE_PATH) -> None:
    """Utility for testing: clear the store contents."""
    if path.exists():
        path.unlink()
