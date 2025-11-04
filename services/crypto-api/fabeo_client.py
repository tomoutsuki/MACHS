"""
FABEO Client for communicating with the FABEO microservice.
"""

import httpx
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class FABEOClient:
    """Client for FABEO microservice communication."""
    
    def __init__(self, base_url: str = "http://fabeo-service:8002"):
        self.base_url = base_url
        self.timeout = 30.0
        
    async def health_check(self) -> bool:
        """Check if FABEO service is healthy."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"FABEO health check failed: {e}")
            return False
    
    async def encrypt(self, message: str, policy: str) -> Dict[str, Any]:
        """Encrypt message using CP-ABE."""
        try:
            payload = {
                "message": message,
                "policy": policy
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/encrypt",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error_detail = response.json().get("error", "Unknown error")
                    return {
                        "success": False,
                        "error": f"FABEO encryption failed: {error_detail}"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO encrypt request failed: {e}")
            return {
                "success": False,
                "error": f"Communication with FABEO service failed: {str(e)}"
            }
    
    async def decrypt(self, ciphertext: str, attributes: List[str]) -> Dict[str, Any]:
        """Decrypt ciphertext using CP-ABE with attributes (legacy method)."""
        try:
            payload = {
                "ciphertext": ciphertext,
                "attributes": attributes
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/decrypt",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error_detail = response.json().get("error", "Unknown error")
                    return {
                        "success": False,
                        "error": f"FABEO decryption failed: {error_detail}"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO decrypt request failed: {e}")
            return {
                "success": False,
                "error": f"Communication with FABEO service failed: {str(e)}"
            }
    
    async def decrypt_with_key(self, ciphertext: str, user_key: str) -> Dict[str, Any]:
        """Decrypt ciphertext using CP-ABE with pre-generated user key."""
        try:
            payload = {
                "ciphertext": ciphertext,
                "user_key": user_key
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/decrypt_with_key",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error_detail = response.json().get("error", "Unknown error")
                    return {
                        "success": False,
                        "error": f"FABEO decryption failed: {error_detail}"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO decrypt_with_key request failed: {e}")
            return {
                "success": False,
                "error": f"Communication with FABEO service failed: {str(e)}"
            }
    
    async def generate_key(self, attributes: List[str]) -> Dict[str, Any]:
        """Generate key for given attributes."""
        try:
            payload = {
                "attributes": attributes
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/keygen",
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error_detail = response.json().get("error", "Unknown error")
                    return {
                        "success": False,
                        "error": f"FABEO key generation failed: {error_detail}"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO keygen request failed: {e}")
            return {
                "success": False,
                "error": f"Communication with FABEO service failed: {str(e)}"
            }
    
    async def setup_keys(self) -> Dict[str, Any]:
        """Setup new master keys."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/setup")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    error_detail = response.json().get("error", "Unknown error")
                    return {
                        "success": False,
                        "error": f"FABEO setup failed: {error_detail}"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO setup request failed: {e}")
            return {
                "success": False,
                "error": f"Communication with FABEO service failed: {str(e)}"
            }
    
    async def get_info(self) -> Dict[str, Any]:
        """Get FABEO service information."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/info")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "service": "FABEO",
                        "available": False,
                        "error": "Service not responding"
                    }
                    
        except Exception as e:
            logger.error(f"FABEO info request failed: {e}")
            return {
                "service": "FABEO",
                "available": False,
                "error": str(e)
            }