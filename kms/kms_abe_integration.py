"""Simulated FABEO22 integration helpers."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import List

from . import kms_abac_engine


@dataclass
class UserKeyRequest:
    """Represents a user's request for an attribute-bound key."""

    request_id: str
    attributes: List[str]
    requested_at: str


@dataclass
class AttributeKey:
    """Simulated attribute-bound user key issued by the ABE provider."""

    key_id: str
    user_id: str
    attributes: List[str]
    issued_at: str


def request_user_key(attributes: List[str]) -> UserKeyRequest:
    """Create a simulated user key request object."""
    return UserKeyRequest(
        request_id=str(uuid.uuid4()),
        attributes=list(attributes),
        requested_at=_timestamp(),
    )


def issue_attribute_key(user_id: str, attributes: List[str]) -> AttributeKey:
    """Simulate issuance of an attribute-bound key."""
    return AttributeKey(
        key_id=str(uuid.uuid4()),
        user_id=user_id,
        attributes=list(attributes),
        issued_at=_timestamp(),
    )


def validate_user_attributes(policy: str, user_attributes: List[str]) -> bool:
    """Validate a set of user attributes against a policy using the ABAC engine."""
    return kms_abac_engine.evaluate_policy(user_attributes, policy)


def _timestamp() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"
