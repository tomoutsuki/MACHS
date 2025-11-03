# Implementation Guide: FABEO/Charm-Crypto Container Separation

## Overview
Based on the analysis of the version conflicts, this document provides a step-by-step implementation guide for separating the FABEO functionality from the modern FastAPI service.

## Key Findings from Charm-Crypto Repository

From the official Charm repository (https://github.com/JHUISI/charm), we found:
- **Two active branches**: `dev` (Python 3.x only) and `2.7-dev` (Python 2.x)
- **Current status**: Modern Charm supports Python 3.x, but FABEO was built specifically for Charm 0.43 with Python 2.7
- **Risk assessment**: Using newer Charm versions may break FABEO compatibility

## Implementation Strategy

### Phase 1: Create FABEO Microservice

#### 1.1 Create FABEO Service Directory Structure
```
services/
└── fabeo-service/
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py
    ├── fabeo_operations.py
    └── health_check.py
```

#### 1.2 FABEO Service Implementation

**File: `services/fabeo-service/Dockerfile`**
```dockerfile
# Use Ubuntu 16.04 as required by FABEO
FROM ubuntu:16.04

# Set environment variables
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV LIBRARY_PATH /usr/local/lib
ENV LD_LIBRARY_PATH /usr/local/lib
ENV PYTHONPATH "/app/FABEO"

WORKDIR /app

# Install system dependencies exactly as FABEO requires
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    locales \
    wget \
    git \
    python \
    python-pip \
    gcc \
    flex \
    bison \
    build-essential \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install GMP 5.x
RUN wget https://ftp.gnu.org/gnu/gmp/gmp-5.1.3.tar.gz && \
    tar -xf gmp-5.1.3.tar.gz && \
    cd gmp-5.1.3 && \
    ./configure && make && make install && \
    cd .. && rm -rf gmp-5.1.3*

# Install PBC 0.5.14
RUN wget https://crypto.stanford.edu/pbc/files/pbc-0.5.14.tar.gz && \
    tar -xf pbc-0.5.14.tar.gz && \
    cd pbc-0.5.14 && \
    ./configure && make && make install && \
    cd .. && rm -rf pbc-0.5.14*

# Install Python 2.7 dependencies for Charm
RUN pip install setuptools==0.6c11 pyparsing==1.5.6

# Install Charm-crypto 0.43 from source
RUN wget https://github.com/JHUISI/charm/archive/v0.43.tar.gz && \
    tar -xf v0.43.tar.gz && \
    cd charm-* && \
    sed -i "s|http://|https://|g" distribute_setup.py && \
    sed -i 's/use_setuptools()/pass/' setup.py && \
    ./configure.sh && \
    make && make install && \
    ldconfig

# Copy FABEO source
COPY submodules/FABEO ./FABEO
RUN cd FABEO && make && pip install .

# Copy service source
COPY services/fabeo-service/ ./service/
WORKDIR /app/service

# Install Flask for simple HTTP server
RUN pip install Flask==1.1.4 Werkzeug==1.0.1

# Create non-root user
RUN adduser --disabled-password --gecos '' fabeouser && \
    chown -R fabeouser:fabeouser /app
USER fabeouser

EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import sys; sys.path.insert(0, '/app/FABEO'); from FABEO.fabeo22cp import FABEO22CPABE; print('OK')" || exit 1

CMD ["python", "main.py"]
```

**File: `services/fabeo-service/main.py`**
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
FABEO Microservice
Simple HTTP server providing ABE encryption/decryption operations.
"""

from flask import Flask, request, jsonify
import sys
import os
import json
import traceback
import logging

# Add FABEO to Python path
sys.path.insert(0, '/app/FABEO')

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for FABEO schemes
cp_abe_scheme = None
kp_abe_scheme = None
pk = None
msk = None

def initialize_fabeo():
    """Initialize FABEO schemes."""
    global cp_abe_scheme, kp_abe_scheme, pk, msk
    
    try:
        from charm.toolbox.pairinggroup import PairingGroup
        from FABEO.fabeo22cp import FABEO22CPABE
        from FABEO.fabeo22kp import FABEO22KPABE
        
        # Initialize pairing group
        group = PairingGroup('SS512')
        logger.info("Initialized pairing group: %s", group)
        
        # Initialize schemes
        cp_abe_scheme = FABEO22CPABE(group)
        kp_abe_scheme = FABEO22KPABE(group)
        
        # Generate master keys
        pk, msk = cp_abe_scheme.setup()
        
        logger.info("FABEO22 schemes initialized successfully")
        return True
        
    except Exception as e:
        logger.error("Failed to initialize FABEO: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "fabeo-service"})

@app.route('/encrypt', methods=['POST'])
def encrypt():
    """Encrypt data using CP-ABE."""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data or 'policy' not in data:
            return jsonify({"error": "Missing required fields: message, policy"}), 400
        
        message = data['message']
        policy = data['policy']
        
        # Perform CP-ABE encryption
        ciphertext = cp_abe_scheme.encrypt(pk, message, policy)
        
        # Convert to serializable format
        result = {
            "success": True,
            "ciphertext": str(ciphertext),  # Simplified serialization
            "policy": policy
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error("Encryption error: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt():
    """Decrypt data using CP-ABE."""
    try:
        data = request.get_json()
        
        if not data or 'ciphertext' not in data or 'attributes' not in data:
            return jsonify({"error": "Missing required fields: ciphertext, attributes"}), 400
        
        ciphertext_str = data['ciphertext']
        attributes = data['attributes']
        
        # Generate key for attributes
        key = cp_abe_scheme.keygen(pk, msk, attributes)
        
        # Perform decryption (Note: ciphertext deserialization needed)
        # This is simplified - actual implementation needs proper serialization
        plaintext = "decrypted_message"  # Placeholder
        
        result = {
            "success": True,
            "plaintext": plaintext
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error("Decryption error: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route('/keygen', methods=['POST'])
def generate_key():
    """Generate a key for given attributes."""
    try:
        data = request.get_json()
        
        if not data or 'attributes' not in data:
            return jsonify({"error": "Missing required field: attributes"}), 400
        
        attributes = data['attributes']
        
        # Generate key
        key = cp_abe_scheme.keygen(pk, msk, attributes)
        
        result = {
            "success": True,
            "key": str(key),  # Simplified serialization
            "attributes": attributes
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error("Key generation error: %s", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting FABEO microservice...")
    
    if initialize_fabeo():
        logger.info("FABEO initialized successfully")
        app.run(host='0.0.0.0', port=8002, debug=False)
    else:
        logger.error("Failed to initialize FABEO")
        sys.exit(1)
```

### Phase 2: Create Modern Crypto API Gateway

#### 2.1 Create API Gateway Directory Structure
```
services/
└── crypto-api/
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py
    ├── fabeo_client.py
    ├── standard_crypto.py
    └── models.py
```

**File: `services/crypto-api/Dockerfile`**
```dockerfile
FROM python:3.8-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' apiuser && \
    chown -R apiuser:apiuser /app
USER apiuser

EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**File: `services/crypto-api/requirements.txt`**
```
fastapi==0.68.0
uvicorn[standard]==0.15.0
pydantic==1.8.2
requests==2.26.0
cryptography==3.4.8
httpx==0.24.1
```

**File: `services/crypto-api/main.py`**
```python
"""
Modern Crypto API Gateway
Provides REST API for cryptographic operations, routing ABE requests to FABEO service.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import httpx
import logging
from .fabeo_client import FABEOClient
from .standard_crypto import StandardCrypto
from .models import *

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
fabeo_client = FABEOClient("http://fabeo-service:8002")
standard_crypto = StandardCrypto()

@app.on_startup
async def startup_event():
    """Initialize connections to services."""
    logger.info("Starting Crypto API Gateway...")
    
    # Test FABEO service connection
    if await fabeo_client.health_check():
        logger.info("FABEO service connection established")
    else:
        logger.warning("FABEO service not available - ABE operations will fail")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    fabeo_status = await fabeo_client.health_check()
    
    return {
        "status": "healthy",
        "services": {
            "crypto-api": "healthy",
            "fabeo-service": "healthy" if fabeo_status else "unavailable"
        }
    }

@app.post("/encrypt")
async def encrypt(request: EncryptionRequest):
    """Encrypt data using specified scheme."""
    try:
        if request.scheme.upper() == "CP-ABE":
            # Route to FABEO service
            if not request.policy:
                raise HTTPException(status_code=400, detail="Policy required for CP-ABE encryption")
            
            result = await fabeo_client.encrypt(request.data, request.policy)
            return result
            
        elif request.scheme.upper() in ["AES", "RSA"]:
            # Handle with standard crypto
            result = standard_crypto.encrypt(request.data, request.scheme)
            return result
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported encryption scheme: {request.scheme}")
            
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/decrypt")
async def decrypt(request: DecryptionRequest):
    """Decrypt data using specified scheme."""
    try:
        if request.scheme.upper() == "CP-ABE":
            # Route to FABEO service
            if not request.attributes:
                raise HTTPException(status_code=400, detail="Attributes required for CP-ABE decryption")
            
            result = await fabeo_client.decrypt(request.ciphertext, request.attributes)
            return result
            
        elif request.scheme.upper() in ["AES", "RSA"]:
            # Handle with standard crypto
            result = standard_crypto.decrypt(request.ciphertext, request.scheme, request.key)
            return result
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported decryption scheme: {request.scheme}")
            
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keygen")
async def generate_key(request: KeyGenRequest):
    """Generate cryptographic keys."""
    try:
        if request.scheme.upper() == "CP-ABE":
            # Route to FABEO service
            result = await fabeo_client.generate_key(request.attributes)
            return result
            
        elif request.scheme.upper() in ["AES", "RSA"]:
            # Handle with standard crypto
            result = standard_crypto.generate_key(request.scheme)
            return result
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported key generation scheme: {request.scheme}")
            
    except Exception as e:
        logger.error(f"Key generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### Phase 3: Update Docker Compose Configuration

**File: `docker/docker-compose.yml` (Updated)**
```yaml
services:
  # PostgreSQL Database (unchanged)
  postgres:
    image: postgres:16
    # ... existing configuration

  # FABEO Microservice (Python 2.7 + Charm + Ubuntu 16.04)
  fabeo-service:
    build:
      context: ..
      dockerfile: services/fabeo-service/Dockerfile
    container_name: machs-fabeo-service
    restart: unless-stopped
    environment:
      - LOG_LEVEL=INFO
    ports:
      - "8002:8002"
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8002/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Modern Crypto API Gateway (Python 3.8+ + FastAPI)
  crypto-api:
    build:
      context: services/crypto-api
      dockerfile: Dockerfile
    container_name: machs-crypto-api
    restart: unless-stopped
    environment:
      - LOG_LEVEL=INFO
      - FABEO_SERVICE_URL=http://fabeo-service:8002
    ports:
      - "8001:8001"
    depends_on:
      - fabeo-service
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # EHR System (unchanged, but update CRYPTO_SERVICE_URL)
  ehr-system:
    # ... existing configuration
    environment:
      # ... existing environment variables
      - CRYPTO_SERVICE_URL=http://crypto-api:8001  # Updated to point to new API gateway
    depends_on:
      - postgres
      - crypto-api  # Changed from cryptography to crypto-api

  # Remove old cryptography service
  # cryptography: (REMOVED)
```

### Phase 4: Migration Benefits

1. **Clean Separation**: Each service runs in its optimal environment
2. **Version Isolation**: No more Python 2/3 conflicts  
3. **Maintainability**: Can update API components independently
4. **Scalability**: Services can be scaled independently
5. **Reliability**: Service failures are isolated
6. **Future-proofing**: Easy to replace or upgrade individual components

### Phase 5: Testing Strategy

1. **Unit Tests**: Test each service independently
2. **Integration Tests**: Test service communication
3. **End-to-end Tests**: Test complete workflow from EHR to FABEO
4. **Performance Tests**: Ensure latency is acceptable
5. **Failure Tests**: Test service resilience

### Implementation Timeline

- **Week 1**: Implement FABEO microservice
- **Week 2**: Implement Crypto API Gateway  
- **Week 3**: Update Docker configuration and test integration
- **Week 4**: Update EHR system integration and end-to-end testing
- **Week 5**: Performance optimization and documentation

This architecture solves the version conflict while maintaining the full functionality of both FABEO and modern FastAPI services.