# FABEO Microservices Architecture

This directory contains the isolated FABEO microservices for ABE encryption/decryption testing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FABEO System Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                            │
│  │   Crypto API        │                                            │
│  │   Gateway           │                                            │
│  │   (FastAPI/Py3.8+)  │                                            │
│  │   Port: 8001        │                                            │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             │ HTTP calls                                            │
## Services

### 1. FABEO Service (`fabeo-service/`)
- **Environment**: Python 2.7, Ubuntu 16.04
- **Dependencies**: Charm-crypto 0.43, FABEO submodule
- **Purpose**: Core ABE encryption/decryption operations
- **Port**: 8002
- **Endpoints**:
  - `POST /encrypt` - CP-ABE encryption
  - `POST /decrypt` - CP-ABE decryption  
  - `POST /keygen` - Generate ABE keys
  - `POST /setup` - Setup master keys
  - `GET /health` - Health check
  - `GET /info` - Service information

### 2. Crypto API Gateway (`crypto-api/`)
- **Environment**: Python 3.8+
- **Dependencies**: FastAPI, uvicorn, requests
- **Purpose**: Modern REST API gateway for FABEO operations
- **Port**: 8001
- **Features**:
  - Routes ABE requests to FABEO service
  - Provides unified REST API interface
  - Modern API documentation via FastAPI/Swagger
  - Enhanced error handling and logging

## Benefits of This Architecture

1. **Version Isolation**: No Python 2/3 conflicts
2. **Clean Separation**: Each service runs in its optimal environment
3. **Maintainability**: Can update API components independently  
4. **Focused Testing**: Isolated FABEO functionality testing
5. **Reliability**: Service failures are isolated
6. **Future-proofing**: Easy to replace or upgrade individual components

## Running the Services

### Development
```bash
# Build and start all services
## Quick Start

### Development
```bash
# Start both services
cd docker
docker-compose up --build

# Or start individual services
docker-compose up fabeo-service
docker-compose up crypto-api
```

## Service URLs

- **Crypto API Gateway**: http://localhost:8001
- **FABEO Service**: http://localhost:8002 (internal)

## API Documentation

### Crypto API Gateway
- Swagger UI: http://localhost:8001/docs
- OpenAPI spec: http://localhost:8001/openapi.json

### Supported Encryption Schemes
- **CP-ABE**: Ciphertext-Policy Attribute-Based Encryption (via FABEO)
- **KP-ABE**: Key-Policy Attribute-Based Encryption (via FABEO)

## Testing

### Health Checks
```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### ABE Encryption Test
```bash
curl -X POST http://localhost:8001/abe/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "test data", "policy": "doctor AND hospital"}'
```

## Troubleshooting

### FABEO Service Issues
- Check if Charm-crypto dependencies are properly installed
- Verify Ubuntu 16.04 environment is correctly set up
- Check logs: `docker-compose logs fabeo-service`

### Crypto API Gateway Issues  
- Verify FABEO service is running and healthy
- Check service connectivity: `docker-compose ps`
- Check logs: `docker-compose logs crypto-api`

## Development Guidelines

### Testing FABEO Changes
1. Modify FABEO submodule or service code
2. Rebuild services: `docker-compose build --no-cache`
3. Test with: `python test_fabeo_isolated.py`

### Security Considerations
- FABEO service should not be exposed externally
- Services communicate over internal Docker network
- Storage directory is mounted for persistent testing