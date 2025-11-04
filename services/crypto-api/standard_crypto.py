"""
Standard cryptographic operations (AES, RSA, etc.) for the Crypto API Gateway.
"""

import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class StandardCrypto:
    """Standard cryptographic operations."""
    
    def __init__(self):
        self.default_key_size = 2048
    
    def generate_key(self, scheme: str, key_size: Optional[int] = None) -> Dict[str, Any]:
        """Generate cryptographic keys."""
        try:
            scheme = scheme.upper()
            
            if scheme == "AES":
                # Generate AES key (256-bit)
                key = Fernet.generate_key()
                return {
                    "success": True,
                    "key": key.decode('ascii'),
                    "scheme": scheme,
                    "key_size": 256
                }
            
            elif scheme == "RSA":
                # Generate RSA key pair
                key_size = key_size or self.default_key_size
                private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=key_size
                )
                
                # Serialize keys
                private_pem = private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                )
                
                public_key = private_key.public_key()
                public_pem = public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
                
                return {
                    "success": True,
                    "private_key": private_pem.decode('ascii'),
                    "public_key": public_pem.decode('ascii'),
                    "scheme": scheme,
                    "key_size": key_size
                }
            
            else:
                return {
                    "success": False,
                    "error": f"Unsupported key generation scheme: {scheme}"
                }
                
        except Exception as e:
            logger.error(f"Key generation error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def encrypt(self, data: str, scheme: str, key: Optional[str] = None) -> Dict[str, Any]:
        """Encrypt data using standard cryptography."""
        try:
            scheme = scheme.upper()
            
            if scheme == "AES":
                if not key:
                    # Generate a new key if none provided
                    key = Fernet.generate_key().decode('ascii')
                
                # Encrypt with AES (via Fernet)
                f = Fernet(key.encode('ascii'))
                ciphertext = f.encrypt(data.encode('utf-8'))
                
                return {
                    "success": True,
                    "ciphertext": base64.b64encode(ciphertext).decode('ascii'),
                    "key": key,
                    "scheme": scheme
                }
            
            elif scheme == "RSA":
                if not key:
                    return {
                        "success": False,
                        "error": "Public key required for RSA encryption"
                    }
                
                # Load public key
                public_key = serialization.load_pem_public_key(key.encode('ascii'))
                
                # Encrypt with RSA
                ciphertext = public_key.encrypt(
                    data.encode('utf-8'),
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
                
                return {
                    "success": True,
                    "ciphertext": base64.b64encode(ciphertext).decode('ascii'),
                    "scheme": scheme
                }
            
            else:
                return {
                    "success": False,
                    "error": f"Unsupported encryption scheme: {scheme}"
                }
                
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def decrypt(self, ciphertext: str, scheme: str, key: str) -> Dict[str, Any]:
        """Decrypt data using standard cryptography."""
        try:
            scheme = scheme.upper()
            
            if scheme == "AES":
                # Decrypt with AES (via Fernet)
                f = Fernet(key.encode('ascii'))
                ciphertext_bytes = base64.b64decode(ciphertext.encode('ascii'))
                plaintext = f.decrypt(ciphertext_bytes)
                
                return {
                    "success": True,
                    "plaintext": plaintext.decode('utf-8'),
                    "scheme": scheme
                }
            
            elif scheme == "RSA":
                # Load private key
                private_key = serialization.load_pem_private_key(
                    key.encode('ascii'),
                    password=None
                )
                
                # Decrypt with RSA
                ciphertext_bytes = base64.b64decode(ciphertext.encode('ascii'))
                plaintext = private_key.decrypt(
                    ciphertext_bytes,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
                
                return {
                    "success": True,
                    "plaintext": plaintext.decode('utf-8'),
                    "scheme": scheme
                }
            
            else:
                return {
                    "success": False,
                    "error": f"Unsupported decryption scheme: {scheme}"
                }
                
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            return {
                "success": False,
                "error": str(e)
            }