"""
Modern Crypto API Gateway
Provides REST API for cryptographic operations, routing ABE requests to FABEO service.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
import logging
import os
from fabeo_client import FABEOClient
from standard_crypto import StandardCrypto
from models import *
from database import init_db, close_db
from database_routes import router as db_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MACHS Cryptography API",
    description="Unified cryptographic operations API with ABE and standard crypto support",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
fabeo_service_url = os.getenv("FABEO_SERVICE_URL", "http://fabeo-service:8002")
fabeo_client = FABEOClient(fabeo_service_url)
standard_crypto = StandardCrypto()

# Include database router
app.include_router(db_router)

@app.on_event("startup")
async def startup_event():
    """Initialize connections to services."""
    logger.info("Starting Crypto API Gateway...")
    logger.info(f"FABEO service URL: {fabeo_service_url}")
    
    # Initialize database connection
    db_status = await init_db()
    if db_status:
        logger.info("Database connection established")
    else:
        logger.warning("Database connection failed - database operations will not work")
    
    # Test FABEO service connection
    if await fabeo_client.health_check():
        logger.info("FABEO service connection established")
    else:
        logger.warning("FABEO service not available - ABE operations will fail")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    await close_db()
    logger.info("Crypto API Gateway shutting down...")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    fabeo_status = await fabeo_client.health_check()
    
    return HealthResponse(
        status="healthy",
        services={
            "crypto-api": "healthy",
            "fabeo-service": "healthy" if fabeo_status else "unavailable"
        }
    )

@app.post("/encrypt", response_model=EncryptionResponse)
async def encrypt(request: EncryptionRequest):
    """Encrypt data using specified scheme."""
    try:
        scheme = request.scheme.upper()
        
        if scheme == "CP-ABE":
            # Route to FABEO service
            if not request.policy:
                raise HTTPException(
                    status_code=400, 
                    detail="Policy required for CP-ABE encryption"
                )
            
            result = await fabeo_client.encrypt(request.data, request.policy)
            
            if result.get("success"):
                return EncryptionResponse(
                    success=True,
                    ciphertext=result.get("ciphertext"),
                    scheme=result.get("scheme", "CP-ABE"),
                    policy=result.get("policy")
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "FABEO encryption failed")
                )
            
        elif scheme in ["AES", "RSA"]:
            # Handle with standard crypto
            result = standard_crypto.encrypt(request.data, scheme, request.key)
            
            if result.get("success"):
                return EncryptionResponse(
                    success=True,
                    ciphertext=result.get("ciphertext"),
                    scheme=scheme
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Standard encryption failed")
                )
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported encryption scheme: {request.scheme}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decrypt", response_model=DecryptionResponse)
async def decrypt(request: DecryptionRequest):
    """Decrypt data using specified scheme."""
    try:
        scheme = request.scheme.upper()
        
        if scheme == "CP-ABE":
            # Support both attributes (legacy) and key-based decryption
            if request.key:
                # Key-based decryption (recommended approach)
                result = await fabeo_client.decrypt_with_key(request.ciphertext, request.key)
            elif request.attributes:
                # Attribute-based decryption (legacy/testing only)
                result = await fabeo_client.decrypt(request.ciphertext, request.attributes)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Either 'key' or 'attributes' required for CP-ABE decryption"
                )
            
            if result.get("success"):
                return DecryptionResponse(
                    success=True,
                    plaintext=result.get("plaintext"),
                    scheme=scheme,
                    attributes=result.get("attributes")
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "FABEO decryption failed")
                )
            
        elif scheme in ["AES", "RSA"]:
            # Handle with standard crypto
            if not request.key:
                raise HTTPException(
                    status_code=400,
                    detail=f"Key required for {scheme} decryption"
                )
            
            result = standard_crypto.decrypt(request.ciphertext, scheme, request.key)
            
            if result.get("success"):
                return DecryptionResponse(
                    success=True,
                    plaintext=result.get("plaintext"),
                    scheme=scheme
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Standard decryption failed")
                )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported decryption scheme: {request.scheme}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decrypt_with_key", response_model=DecryptionResponse)
async def decrypt_with_key(request: DecryptionWithKeyRequest):
    """Decrypt data using pre-generated user key (recommended approach)."""
    try:
        scheme = request.scheme.upper()
        
        if scheme == "CP-ABE":
            result = await fabeo_client.decrypt_with_key(request.ciphertext, request.user_key)
            
            if result.get("success"):
                return DecryptionResponse(
                    success=True,
                    plaintext=result.get("plaintext"),
                    scheme=scheme
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "FABEO decryption failed")
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Key-based decryption only supported for CP-ABE, got: {scheme}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Key-based decryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keygen", response_model=KeyGenResponse)
async def generate_key(request: KeyGenRequest):
    """Generate cryptographic keys."""
    try:
        scheme = request.scheme.upper()
        
        if scheme == "CP-ABE":
            # Route to FABEO service
            if not request.attributes:
                raise HTTPException(
                    status_code=400,
                    detail="Attributes required for CP-ABE key generation"
                )
            
            result = await fabeo_client.generate_key(request.attributes)
            
            if result.get("success"):
                return KeyGenResponse(
                    success=True,
                    key=result.get("key"),
                    scheme=result.get("scheme", "CP-ABE"),
                    attributes=result.get("attributes")
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "FABEO key generation failed")
                )
            
        elif scheme in ["AES", "RSA"]:
            # Handle with standard crypto
            result = standard_crypto.generate_key(scheme, request.key_size)
            
            if result.get("success"):
                return KeyGenResponse(
                    success=True,
                    key=result.get("key") or result.get("private_key"),  # RSA returns private_key
                    scheme=scheme
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Standard key generation failed")
                )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported key generation scheme: {request.scheme}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Key generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/setup")
async def setup_abe_keys():
    """Setup new ABE master keys."""
    try:
        result = await fabeo_client.setup_keys()
        
        if result.get("success"):
            return {
                "success": True,
                "message": "ABE master keys setup successfully",
                "public_key": result.get("public_key")
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "ABE setup failed")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Setup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/info")
async def get_service_info():
    """Get service information."""
    fabeo_info = await fabeo_client.get_info()
    
    return {
        "service": "MACHS Crypto API Gateway",
        "version": "2.0.0",
        "supported_schemes": ["CP-ABE", "AES", "RSA"],
        "fabeo_service": fabeo_info
    }

# Legacy compatibility endpoints (for existing EHR integration)
@app.post("/api/encrypt")
async def legacy_encrypt(request: EncryptionRequest):
    """Legacy encrypt endpoint for backward compatibility."""
    return await encrypt(request)

@app.post("/api/decrypt") 
async def legacy_decrypt(request: DecryptionRequest):
    """Legacy decrypt endpoint for backward compatibility."""
    return await decrypt(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)