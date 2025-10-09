"""
FastAPI application for cryptographic operations using Charm and FABEO.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import logging
import sys
import json
from pathlib import Path

# Add FABEO to Python path
FABEO_PATH = os.getenv("FABEO_PATH", "/app/submodules/FABEO")
if os.path.exists(FABEO_PATH):
    sys.path.insert(0, FABEO_PATH)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cryptography Service",
    description="REST API for cryptographic operations using Charm and FABEO",
    version="1.0.0"
)

# CORS middleware for EHR system integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for FABEO schemes
cp_abe_scheme = None
kp_abe_scheme = None
dfa_scheme = None

def initialize_fabeo():
    """Initialize FABEO schemes."""
    global cp_abe_scheme, kp_abe_scheme, dfa_scheme
    
    try:
        logger.info("Initializing FABEO schemes...")
        
        # For now, run in simulation mode
        # TODO: Implement actual FABEO integration when dependencies are resolved
        logger.info("Running in simulation mode - FABEO integration pending")
        
        # Placeholder for future FABEO initialization
        # if os.path.exists(FABEO_PATH):
        #     sys.path.insert(0, FABEO_PATH)
        #     from FABEO.fabeo22cp import FABEO22CP
        #     from FABEO.fabeo22kp import FABEO22KP
        #     from FABEO.fabeo22dfa import FABEO22DFA
        #     
        #     cp_abe_scheme = FABEO22CP()
        #     kp_abe_scheme = FABEO22KP()
        #     dfa_scheme = FABEO22DFA()
        
        logger.info("Simulation mode initialized successfully")
        return False  # Return False to indicate simulation mode
    except Exception as e:
        logger.error(f"Failed to initialize schemes: {e}")
        return False

# Initialize FABEO on startup
fabeo_available = initialize_fabeo()

# Request/Response models
class EncryptionRequest(BaseModel):
    data: str
    policy: Optional[str] = None
    scheme: Optional[str] = "CP-ABE"
    attributes: Optional[list[str]] = None

class DecryptionRequest(BaseModel):
    ciphertext: str
    private_key: str
    scheme: Optional[str] = "CP-ABE"
    attributes: Optional[list[str]] = None

class KeyGenerationRequest(BaseModel):
    attributes: list[str]
    scheme: Optional[str] = "CP-ABE"
    policy: Optional[str] = None

class CryptoResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

def simulate_encryption(data: str, scheme: str, policy: str = None) -> str:
    """Simulate encryption until FABEO is fully integrated."""
    try:
        import base64
        import json
        import time
        
        # Validate JSON if it looks like JSON
        try:
            if data.strip().startswith('{') or data.strip().startswith('['):
                json.loads(data)  # Validate JSON format
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON format: {e}")
        
        encrypted_payload = {
            "scheme": scheme,
            "policy": policy,
            "data": data,
            "encrypted": True,
            "timestamp": time.time()
        }
        
        # Encode as base64 to simulate encryption
        encoded_data = base64.b64encode(
            json.dumps(encrypted_payload).encode()
        ).decode()
        
        # Return a structured response that includes the policy
        return json.dumps({
            "scheme": scheme,
            "policy": policy,
            "encrypted_data": f"ENC_{scheme}_{encoded_data}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "encrypted": True
        })
    except Exception as e:
        raise Exception(f"Simulation encryption failed: {e}")

def simulate_decryption(ciphertext: str, scheme: str) -> str:
    """Simulate decryption until FABEO is fully integrated."""
    try:
        import base64
        import json
        
        # Try to parse as JSON first (structured ciphertext)
        try:
            cipher_obj = json.loads(ciphertext)
            if "encrypted_data" in cipher_obj:
                # Extract the actual encrypted data
                encrypted_data = cipher_obj["encrypted_data"]
            else:
                encrypted_data = ciphertext
        except json.JSONDecodeError:
            encrypted_data = ciphertext
        
        # Remove the scheme prefix
        if encrypted_data.startswith(f"ENC_{scheme}_"):
            encoded_data = encrypted_data[len(f"ENC_{scheme}_"):]
        else:
            raise Exception("Invalid ciphertext format or scheme mismatch")
        
        # Decode from base64
        decoded_data = base64.b64decode(encoded_data.encode()).decode()
        decrypted_payload = json.loads(decoded_data)
        
        if not decrypted_payload.get("encrypted"):
            raise Exception("Data was not encrypted")
        
        return decrypted_payload["data"]
    except Exception as e:
        raise Exception(f"Simulation decryption failed: {e}")

def simulate_key_generation(attributes: list[str], scheme: str) -> Dict[str, str]:
    """Simulate key generation until FABEO is fully integrated."""
    try:
        import hashlib
        import json
        
        # Create a deterministic key based on attributes
        key_data = {
            "scheme": scheme,
            "attributes": sorted(attributes),
            "timestamp": str(os.times())
        }
        
        public_key = hashlib.sha256(
            json.dumps(key_data).encode()
        ).hexdigest()[:32]
        
        private_key = hashlib.sha256(
            (json.dumps(key_data) + "private").encode()
        ).hexdigest()[:32]
        
        return {
            "public_key": f"PUB_{scheme}_{public_key}",
            "private_key": f"PRIV_{scheme}_{private_key}",
            "attributes": attributes
        }
    except Exception as e:
        raise Exception(f"Simulation key generation failed: {e}")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Cryptography Service is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Check FABEO availability
        fabeo_status = fabeo_available
        
        # Check storage path
        storage_path = os.getenv("STORAGE_PATH", "/app/storage")
        storage_exists = os.path.exists(storage_path)
        
        return {
            "status": "healthy" if fabeo_status else "degraded",
            "service": "cryptography",
            "fabeo_available": fabeo_status,
            "charm_available": False,  # Will be True when Charm is properly installed
            "storage_available": storage_exists,
            "storage_path": storage_path,
            "schemes_available": [
                "CP-ABE",
                "KP-ABE", 
                "DFA",
                "Waters11",
                "Waters12"
            ]
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Service unhealthy")

@app.post("/encrypt", response_model=CryptoResponse)
async def encrypt_data(request: EncryptionRequest):
    """Encrypt data using specified ABE scheme."""
    try:
        logger.info(f"Encrypting data with scheme: {request.scheme}")
        
        if fabeo_available:
            # TODO: Implement actual FABEO encryption
            # For now, use simulation
            encrypted_data = simulate_encryption(
                request.data, 
                request.scheme, 
                request.policy
            )
        else:
            # Fallback to simulation
            encrypted_data = simulate_encryption(
                request.data, 
                request.scheme, 
                request.policy
            )
        
        return CryptoResponse(
            success=True,
            result=encrypted_data,
            metadata={
                "scheme": request.scheme,
                "policy": request.policy,
                "data_length": len(request.data),
                "encrypted_length": len(encrypted_data)
            }
        )
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        return CryptoResponse(
            success=False,
            result=None,
            error=str(e)
        )

@app.post("/decrypt", response_model=CryptoResponse)
async def decrypt_data(request: DecryptionRequest):
    """Decrypt data using specified ABE scheme."""
    try:
        logger.info(f"Decrypting data with scheme: {request.scheme}")
        
        if fabeo_available:
            # TODO: Implement actual FABEO decryption
            # For now, use simulation
            decrypted_data = simulate_decryption(
                request.ciphertext,
                request.scheme
            )
        else:
            # Fallback to simulation
            decrypted_data = simulate_decryption(
                request.ciphertext,
                request.scheme
            )
        
        return CryptoResponse(
            success=True,
            result=decrypted_data,
            metadata={
                "scheme": request.scheme,
                "ciphertext_length": len(request.ciphertext),
                "decrypted_length": len(decrypted_data)
            }
        )
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return CryptoResponse(
            success=False,
            result=None,
            error=str(e)
        )

@app.post("/generate-keys", response_model=CryptoResponse)
async def generate_keys(request: KeyGenerationRequest):
    """Generate public/private keys for ABE scheme."""
    try:
        logger.info(f"Generating keys for attributes: {request.attributes}")
        
        if fabeo_available:
            # TODO: Implement actual FABEO key generation
            # For now, use simulation
            keys = simulate_key_generation(
                request.attributes,
                request.scheme
            )
        else:
            # Fallback to simulation
            keys = simulate_key_generation(
                request.attributes,
                request.scheme
            )
        
        return CryptoResponse(
            success=True,
            result=json.dumps(keys),
            metadata={
                "scheme": request.scheme,
                "attributes": request.attributes,
                "key_count": len(keys)
            }
        )
    except Exception as e:
        logger.error(f"Key generation failed: {e}")
        return CryptoResponse(
            success=False,
            result=None,
            error=str(e)
        )

@app.get("/schemes")
async def list_schemes():
    """List available cryptographic schemes."""
    return {
        "available_schemes": [
            {
                "name": "CP-ABE",
                "description": "Ciphertext-Policy Attribute-Based Encryption",
                "available": fabeo_available
            },
            {
                "name": "KP-ABE",
                "description": "Key-Policy Attribute-Based Encryption", 
                "available": fabeo_available
            },
            {
                "name": "DFA",
                "description": "Deterministic Finite Automaton-based ABE",
                "available": fabeo_available
            },
            {
                "name": "Waters11",
                "description": "Waters 2011 CP-ABE Scheme",
                "available": False
            },
            {
                "name": "Waters12",
                "description": "Waters 2012 DFA-based Scheme",
                "available": False
            }
        ],
        "fabeo_status": "available" if fabeo_available else "simulation_mode",
        "total_schemes": 5
    }

# Storage management endpoints for encrypted files
@app.get("/storage/info")
async def storage_info():
    """Get storage information."""
    try:
        storage_path = os.getenv("STORAGE_PATH", "/app/storage")
        
        if not os.path.exists(storage_path):
            return {
                "storage_available": False,
                "storage_path": storage_path,
                "error": "Storage path does not exist"
            }
        
        # Count patient directories
        patients_path = os.path.join(storage_path, "patients")
        patient_count = 0
        total_files = 0
        
        if os.path.exists(patients_path):
            patient_dirs = [d for d in os.listdir(patients_path) 
                          if os.path.isdir(os.path.join(patients_path, d))]
            patient_count = len(patient_dirs)
            
            # Count files in patient directories
            for patient_dir in patient_dirs:
                patient_path = os.path.join(patients_path, patient_dir)
                total_files += len([f for f in os.listdir(patient_path) 
                                  if os.path.isfile(os.path.join(patient_path, f))])
        
        return {
            "storage_available": True,
            "storage_path": storage_path,
            "patient_count": patient_count,
            "total_encrypted_files": total_files
        }
    except Exception as e:
        logger.error(f"Storage info failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)