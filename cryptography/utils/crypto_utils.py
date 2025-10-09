"""
Utility functions for cryptography service.
"""

import logging
import hashlib
import base64
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def hash_data(data: str, algorithm: str = "sha256") -> str:
    """Hash data using specified algorithm."""
    if algorithm == "sha256":
        return hashlib.sha256(data.encode()).hexdigest()
    elif algorithm == "md5":
        return hashlib.md5(data.encode()).hexdigest()
    else:
        raise ValueError(f"Unsupported hash algorithm: {algorithm}")

def encode_base64(data: str) -> str:
    """Encode string to base64."""
    return base64.b64encode(data.encode()).decode()

def decode_base64(data: str) -> str:
    """Decode base64 string."""
    return base64.b64decode(data.encode()).decode()

def validate_policy(policy: str) -> bool:
    """Validate access policy format."""
    # TODO: Implement proper policy validation
    # For now, just check if it's not empty
    return bool(policy and policy.strip())

def validate_attributes(attributes: list) -> bool:
    """Validate attributes format."""
    if not attributes:
        return False
    
    # Check if all attributes are non-empty strings
    return all(isinstance(attr, str) and attr.strip() for attr in attributes)

def format_error_response(error: Exception) -> Dict[str, Any]:
    """Format error for API response."""
    return {
        "success": False,
        "result": None,
        "error": str(error)
    }

def format_success_response(result: Any) -> Dict[str, Any]:
    """Format success result for API response."""
    return {
        "success": True,
        "result": result,
        "error": None
    }

def log_operation(operation: str, scheme: str, success: bool, **kwargs):
    """Log cryptographic operations."""
    status = "SUCCESS" if success else "FAILED"
    logger.info(f"CRYPTO_OP: {operation} | SCHEME: {scheme} | STATUS: {status}")
    
    for key, value in kwargs.items():
        logger.debug(f"  {key}: {value}")