"""
Pydantic models for cryptography service API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class CryptoScheme(str, Enum):
    """Available cryptographic schemes."""
    FABEO22_CP = "fabeo22cp"
    FABEO22_KP = "fabeo22kp"
    FABEO22_DFA = "fabeo22dfa"
    AC17_CP = "ac17cp"
    AC17_KP = "ac17kp"
    WATERS11_CP = "waters11cp"
    WATERS12_DFA = "waters12dfa"
    ABGW17_CP = "abgw17cp"
    ABGW17_KP = "abgw17kp"
    BSW07_CP = "bsw07cp"
    CGW15_CP = "cgw15cp"
    CGW15_KP = "cgw15kp"
    GPSW06_KP = "gpsw06kp"

class EncryptionRequest(BaseModel):
    """Request model for encryption operations."""
    data: str = Field(..., description="Data to encrypt")
    policy: Optional[str] = Field(None, description="Access policy for CP-ABE schemes")
    attributes: Optional[List[str]] = Field(None, description="Attributes for KP-ABE schemes")
    scheme: CryptoScheme = Field(CryptoScheme.FABEO22_CP, description="Cryptographic scheme to use")

class DecryptionRequest(BaseModel):
    """Request model for decryption operations."""
    ciphertext: str = Field(..., description="Encrypted data to decrypt")
    private_key: str = Field(..., description="Private key for decryption")
    scheme: CryptoScheme = Field(CryptoScheme.FABEO22_CP, description="Cryptographic scheme used")

class KeyGenerationRequest(BaseModel):
    """Request model for key generation."""
    attributes: List[str] = Field(..., description="Attributes for key generation")
    scheme: CryptoScheme = Field(CryptoScheme.FABEO22_CP, description="Cryptographic scheme to use")

class CryptoResponse(BaseModel):
    """Response model for cryptographic operations."""
    success: bool = Field(..., description="Whether the operation was successful")
    result: Optional[Dict[str, Any]] = Field(None, description="Operation result")
    error: Optional[str] = Field(None, description="Error message if operation failed")

class EncryptionResult(BaseModel):
    """Result model for encryption operations."""
    ciphertext: str = Field(..., description="Encrypted data")
    policy: Optional[str] = Field(None, description="Access policy used")
    attributes: Optional[List[str]] = Field(None, description="Attributes used")
    scheme: CryptoScheme = Field(..., description="Scheme used for encryption")

class KeyGenerationResult(BaseModel):
    """Result model for key generation."""
    public_key: str = Field(..., description="Generated public key")
    private_key: str = Field(..., description="Generated private key")
    master_key: Optional[str] = Field(None, description="Master key if applicable")
    scheme: CryptoScheme = Field(..., description="Scheme used for key generation")

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    charm_available: bool = Field(..., description="Whether Charm is available")
    fabeo_available: bool = Field(..., description="Whether FABEO is available")
    available_schemes: List[str] = Field(..., description="List of available schemes")