"""
Pydantic models for the Crypto API Gateway.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Union

class EncryptionRequest(BaseModel):
    data: str = Field(..., description="Data to encrypt")
    policy: Optional[str] = Field(None, description="Access policy for ABE encryption")
    scheme: str = Field("CP-ABE", description="Encryption scheme (CP-ABE, AES, RSA)")
    key: Optional[str] = Field(None, description="Encryption key for standard crypto")

class DecryptionRequest(BaseModel):
    ciphertext: str = Field(..., description="Ciphertext to decrypt")
    scheme: str = Field("CP-ABE", description="Decryption scheme (CP-ABE, AES, RSA)")
    attributes: Optional[List[str]] = Field(None, description="User attributes for ABE decryption (legacy)")
    key: Optional[str] = Field(None, description="Decryption key (for standard crypto or ABE user key)")
    
class DecryptionWithKeyRequest(BaseModel):
    ciphertext: str = Field(..., description="Ciphertext to decrypt")
    scheme: str = Field("CP-ABE", description="Decryption scheme")
    user_key: str = Field(..., description="Pre-generated user decryption key")

class KeyGenRequest(BaseModel):
    scheme: str = Field("CP-ABE", description="Key generation scheme (CP-ABE, AES, RSA)")
    attributes: Optional[List[str]] = Field(None, description="Attributes for ABE key generation")
    key_size: Optional[int] = Field(256, description="Key size for standard crypto")

class EncryptionResponse(BaseModel):
    success: bool
    ciphertext: Optional[str] = None
    scheme: str
    policy: Optional[str] = None
    error: Optional[str] = None

class DecryptionResponse(BaseModel):
    success: bool
    plaintext: Optional[str] = None
    scheme: str
    attributes: Optional[List[str]] = None
    error: Optional[str] = None

class KeyGenResponse(BaseModel):
    success: bool
    key: Optional[str] = None
    scheme: str
    attributes: Optional[List[str]] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    services: Dict[str, str]