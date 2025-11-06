"""Simulated Key Management Service package."""

from .kms_core import KMSCore, GeneratedDataKey
from .kms_abac_engine import evaluate_policy

__all__ = [
    "KMSCore",
    "GeneratedDataKey",
    "evaluate_policy",
]
