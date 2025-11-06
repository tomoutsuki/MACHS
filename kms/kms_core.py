"""Core service logic for the simulated KMS."""

from __future__ import annotations

import base64
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

from . import kms_audit, kms_abe_integration, kms_store
from .kms_crypto import decrypt_aes_gcm, encrypt_aes_gcm, generate_aes256_key


@dataclass
class GeneratedDataKey:
    """Represents the output of a data key generation request."""

    key_id: str
    plaintext: bytes
    encrypted: bytes
    policy: str


class KMSCore:
    """Simulated Key Management Service implementation."""

    def __init__(self, *, default_ttl_days: int = 90, store_path=None, audit_path=None, system_user: str = "system") -> None:
        self._default_ttl = timedelta(days=default_ttl_days)
        self._store_path = store_path
        self._audit_path = audit_path
        self._system_user = system_user
        self._master_keys: Dict[str, bytes] = {}
        self._active_master_key_id: Optional[str] = None
        self._key_to_blob: Dict[str, bytes] = {}
        self._blob_to_key: Dict[bytes, str] = {}

    # ------------------------------------------------------------------
    # Master key management
    # ------------------------------------------------------------------
    def generate_master_key(self) -> str:
        """Generate and activate a new master key."""
        key_material = os.urandom(64)
        master_id = str(uuid.uuid4())
        self._master_keys[master_id] = key_material
        previous_master = self._active_master_key_id
        self._active_master_key_id = master_id

        record = kms_store.KeyRecord(
            id=master_id,
            type="master",
            version=1,
            creation_date=_timestamp(),
            expiration=None,
            attributes=[],
            policy="",
            status="active",
            encrypted_key=None,
        )
        kms_store.save_key(record, **self._store_kwargs())
        kms_audit.log_event(self._system_user, "generate_master_key", master_id, "success", **self._audit_kwargs())
        if previous_master:
            kms_store.update_key_status(previous_master, "retired", **self._store_kwargs())
            kms_audit.log_event(self._system_user, "retire_master_key", previous_master, "success", reason="rotated", **self._audit_kwargs())
        return master_id

    # ------------------------------------------------------------------
    # Data key lifecycle
    # ------------------------------------------------------------------
    def generate_data_key(self, policy: str) -> GeneratedDataKey:
        """Generate, encrypt, and persist metadata for a new DEK."""
        plaintext = generate_aes256_key()
        key_id, encrypted_blob = self.encrypt_data_key(plaintext)
        self._register_encrypted_blob(key_id, encrypted_blob)

        expiration = (_timestamp_dt() + self._default_ttl).isoformat(timespec="seconds") + "Z"
        record = kms_store.KeyRecord(
            id=key_id,
            type="data",
            version=1,
            creation_date=_timestamp(),
            expiration=expiration,
            attributes=[],
            policy=policy,
            status="active",
            encrypted_key=base64.b64encode(encrypted_blob).decode("ascii"),
        )
        kms_store.save_key(record, **self._store_kwargs())
        kms_audit.log_event(self._system_user, "generate_data_key", key_id, "success", **self._audit_kwargs())
        return GeneratedDataKey(key_id=key_id, plaintext=plaintext, encrypted=encrypted_blob, policy=policy)

    def encrypt_data_key(self, plaintext_key: bytes, key_id: Optional[str] = None) -> Tuple[str, bytes]:
        """Encrypt a data key using the active master key."""
        master_key = self._get_active_master_key()
        key_identifier = key_id or str(uuid.uuid4())
        ciphertext, nonce, tag = encrypt_aes_gcm(plaintext_key, master_key[:32])
        blob = nonce + ciphertext + tag
        return key_identifier, blob

    def decrypt_data_key(self, encrypted_key: bytes, user_attributes: list[str]) -> bytes:
        """Attempt to decrypt an encrypted DEK honoring ABAC rules."""
        key_id = self._blob_to_key.get(encrypted_key)
        if not key_id:
            key_id = self._resolve_key_id(encrypted_key)
        if not key_id:
            kms_audit.log_event(self._system_user, "decrypt_data_key", "unknown", "failure", reason="unknown key", **self._audit_kwargs())
            raise KeyError("Encrypted key not recognized by the KMS")

        record = kms_store.load_key(key_id, **self._store_kwargs())
        if not record:
            kms_audit.log_event(self._system_user, "decrypt_data_key", key_id, "failure", reason="metadata missing", **self._audit_kwargs())
            raise KeyError(f"Key {key_id} metadata not found")

        user_id = _extract_user_id(user_attributes)

        if record.status != "active":
            kms_audit.log_event(user_id, "decrypt_data_key", key_id, "failure", reason=f"status {record.status}", **self._audit_kwargs())
            raise PermissionError("Key is not active")

        if record.expiration:
            try:
                expires = datetime.fromisoformat(record.expiration.rstrip("Z"))
                if datetime.utcnow() > expires:
                    kms_store.update_key_status(key_id, "expired", **self._store_kwargs())
                    kms_audit.log_event(user_id, "decrypt_data_key", key_id, "failure", reason="expired", **self._audit_kwargs())
                    raise PermissionError("Key has expired")
            except ValueError:
                pass

        if record.policy and not kms_abe_integration.validate_user_attributes(record.policy, user_attributes):
            kms_audit.log_event(user_id, "decrypt_data_key", key_id, "failure", reason="policy_denied", **self._audit_kwargs())
            raise PermissionError("User attributes do not satisfy key policy")

        master_key = self._get_active_master_key()
        nonce, ciphertext, tag = encrypted_key[:12], encrypted_key[12:-16], encrypted_key[-16:]
        plaintext = decrypt_aes_gcm(ciphertext, master_key[:32], nonce, tag)
        kms_audit.log_event(user_id, "decrypt_data_key", key_id, "success", **self._audit_kwargs())
        return plaintext

    def revoke_key(self, key_id: str) -> None:
        """Revoke a managed key and prevent future use."""
        kms_store.update_key_status(key_id, "revoked", **self._store_kwargs())
        kms_audit.log_event(self._system_user, "revoke_key", key_id, "success", **self._audit_kwargs())
        if key_id in self._key_to_blob:
            blob = self._key_to_blob.pop(key_id)
            self._blob_to_key.pop(blob, None)

    def rotate_key(self, key_id: str) -> GeneratedDataKey:
        """Create a new version of an existing data key."""
        record = kms_store.load_key(key_id, **self._store_kwargs())
        if not record:
            raise KeyError(f"Unknown key id: {key_id}")
        if record.type != "data":
            raise ValueError("Rotation is only supported for data keys")
        if record.status != "active":
            raise PermissionError("Only active keys can be rotated")

        new_plaintext = generate_aes256_key()
        updated_key_id, encrypted_blob = self.encrypt_data_key(new_plaintext, key_id=key_id)
        if updated_key_id != key_id:
            raise AssertionError("Key identifier mismatch during rotation")
        self._register_encrypted_blob(key_id, encrypted_blob)

        version = record.version + 1
        updates = {
            "version": version,
            "creation_date": _timestamp(),
            "expiration": (_timestamp_dt() + self._default_ttl).isoformat(timespec="seconds") + "Z",
            "encrypted_key": base64.b64encode(encrypted_blob).decode("ascii"),
            "status": "active",
        }
        kms_store.update_key_record(key_id, updates, **self._store_kwargs())
        kms_audit.log_event(self._system_user, "rotate_key", key_id, "success", **self._audit_kwargs())
        return GeneratedDataKey(key_id=key_id, plaintext=new_plaintext, encrypted=encrypted_blob, policy=record.policy)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------
    def _store_kwargs(self) -> Dict[str, object]:
        return {"path": self._store_path} if self._store_path else {}

    def _audit_kwargs(self) -> Dict[str, object]:
        return {"path": self._audit_path} if self._audit_path else {}

    def _register_encrypted_blob(self, key_id: str, blob: bytes) -> None:
        existing = self._key_to_blob.get(key_id)
        if existing:
            self._blob_to_key.pop(existing, None)
        self._key_to_blob[key_id] = blob
        self._blob_to_key[blob] = key_id

    def _resolve_key_id(self, blob: bytes) -> Optional[str]:
        encoded = base64.b64encode(blob).decode("ascii")
        for record in kms_store.list_keys(**self._store_kwargs()):
            if record.encrypted_key == encoded:
                self._register_encrypted_blob(record.id, blob)
                return record.id
        return None

    def _get_active_master_key(self) -> bytes:
        if not self._active_master_key_id:
            if self._master_keys:
                # pick any existing master key if available
                self._active_master_key_id = next(iter(self._master_keys))
            else:
                raise RuntimeError("No master key available")
        return self._master_keys[self._active_master_key_id]


def _timestamp() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def _timestamp_dt() -> datetime:
    return datetime.utcnow()


def _extract_user_id(attributes: list[str]) -> str:
    for prefix in ("user:", "user_id:"):
        for attr in attributes:
            if attr.lower().startswith(prefix):
                return attr.split(":", 1)[1]
    return "anonymous"
