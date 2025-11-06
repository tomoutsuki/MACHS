"""Demonstration script for the simulated KMS workflow."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kms.kms_core import KMSCore
from kms.kms_abe_integration import issue_attribute_key


def main() -> None:
    kms = KMSCore()
    master_id = kms.generate_master_key()
    print(f"Generated master key: {master_id}")

    policy = "(role:doctor AND dept:cardiology)"
    data_key = kms.generate_data_key(policy)
    print(f"Created data key {data_key.key_id} with policy {policy}")

    cardiology_user_attrs = [
        "user:alice",
        "role:doctor",
        "dept:cardiology",
        "level:3",
    ]
    research_key = issue_attribute_key("alice", cardiology_user_attrs)
    print(f"Issued attribute key {research_key.key_id} for user {research_key.user_id}")

    oncology_user_attrs = [
        "user:bob",
        "role:nurse",
        "dept:oncology",
        "level:1",
    ]
    issue_attribute_key("bob", oncology_user_attrs)

    plaintext = kms.decrypt_data_key(data_key.encrypted, cardiology_user_attrs)
    print(f"Alice decrypted DEK successfully (length {len(plaintext)} bytes)")

    try:
        kms.decrypt_data_key(data_key.encrypted, oncology_user_attrs)
    except Exception as exc:  # noqa: BLE001 - demo logging
        print(f"Bob denied access: {exc}")

    audit_log = Path(__file__).parent / "kms_audit.log"
    if audit_log.exists():
        print(f"Audit log written to {audit_log}")


if __name__ == "__main__":
    main()
