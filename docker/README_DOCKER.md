# FABEO Isolated Testing System - Docker Deployment
# MACHS Hospital System - Docker Deployment

This directory contains the Docker Compose setup for isolated FABEO cryptographic testing without frontend, database, or EHR system dependencies.  
This directory contains the complete Docker Compose setup for the MACHS Hospital System, including the enhanced hospital frontend with user authentication, searchable encryption, and data visualization.

## Quick Start

### One-Click Startup

```bash
# Windows
start-hospital-system.bat

# Linux/Mac
docker-compose up --build -d
```

This will start all services and automatically:

- Build FABEO service (Python 2.7 + Charm-crypto)
- Initialize the PostgreSQL database
- Build Crypto API Gateway (Python 3.8 + FastAPI)
- Start the cryptography service (FABEO + FastAPI)
- Configure health checks
- Start the EHR system (Node.js + Express)
- Mount storage volume for encrypted data
- Start both frontend interfaces
- Create demo patient data
- Open the hospital interface in your browser

## Access Points

| Service | URL | Description |
|----------|-----|-------------|
| **Crypto API** | http://localhost:8001 | FastAPI gateway for encryption operations |
| **FABEO Service** | http://localhost:8002 | Core FABEO22 CP-ABE/KP-ABE service |
| **Hospital Interface** | http://localhost:3002/hospital | Enhanced hospital system with user roles |
| **Original Test Interface** | http://localhost:8080 | Original FABEO testing interface |
| **EHR API** | http://localhost:3001 | RESTful API for patient data |

## Architecture

```text
┌─────────────────────────────────────┐
│       Crypto API Gateway            │
│       (Python 3.8 + FastAPI)        │
│       Port: 8001                    │
│  ┌───────────────────────────────┐  │
│  │ - Request Validation          │  │
│  │ - Standard Crypto (AES/RSA)   │  │
│  │ - FABEO Client                │  │
│  │ - Storage Management          │  │
│  └───────────┬───────────────────┘  │
└──────────────┼──────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────┐
│       FABEO Service                 │
│   (Python 2.7 + Charm-crypto 0.43)  │
│       Port: 8002                    │
│  ┌───────────────────────────────┐  │
│  │ - FABEO22 CP-ABE              │  │
│  │ - FABEO22 KP-ABE              │  │
│  │ - Pairing Operations          │  │
│  │ - Key Management              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Docker Services

### Core Services
- **`postgres`**: PostgreSQL database for patient metadata and audit logs  
- **`cryptography`**: FABEO-based encryption service (Python + FastAPI)  
- **`ehr-system`**: EHR backend with enhanced APIs (Node.js + Express)

### Frontend Services
- **`frontend`**: Original test interface for FABEO encryption testing  
- **`hospital-frontend`**: Enhanced hospital system with user authentication and access control  

## Service Configuration

### Environment Variables

| Variable | Default | Description |
|----------|----------|-------------|
| `POSTGRES_DB` | `machs_ehr` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `secure_password` | Database password |
| `CREATE_DEMO_DATA` | `true` | Auto-create demo patients |
| `NODE_ENV` | `production` | Environment mode |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `FABEO_SERVICE_URL` | `http://fabeo-service:8002` | FABEO service endpoint |
| `STORAGE_PATH` | `/app/storage` | Encrypted data storage path |

### Port Mappings

| Internal Port | External Port | Service |
|---------------|---------------|----------|
| 5432 | 5432 | PostgreSQL |
| 8000 | 8000 | Cryptography API |
| 3000 | 3001 | EHR System API |
| 8080 | 8080 | Original Frontend |
| 3002 | 3002 | Hospital Frontend |
| 8002 | 8002 | FABEO Service |
| 8001 | 8001 | Crypto API |

### Volumes
- `../storage:/app/storage` - Persistent encrypted data storage

## Management Commands

```bash
# Full startup with build
docker-compose up --build -d

# Start existing containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop services (preserves data)
docker-compose down

# Stop and remove data volumes
docker-compose down -v

# Rebuild all services
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache hospital-frontend
```

## Testing the System

### 1. Health Checks

```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### 2. Run Python Tests

```bash
python test_fabeo_isolated.py
python test_fabeo_direct.py
python test_fabeo_proper_workflow.py
python verify_fabeo_setup.py
```

### 3. API Testing

```bash
curl -H "X-User-Id: doctor" http://localhost:3001/patients
curl -X POST http://localhost:3001/patients/search \
  -H "Content-Type: application/json" \
  -H "X-User-Id: doctor" \
  -d '{"name": "Ana Maria"}'
```

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
docker-compose logs
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues
```bash
docker-compose ps postgres
docker-compose logs postgres
docker-compose down -v
docker-compose up -d
```

#### Frontend Not Loading
```bash
docker-compose logs hospital-frontend
docker-compose restart hospital-frontend
```

#### FABEO Service Connection Issues
```bash
docker-compose ps fabeo-service
docker-compose logs fabeo-service
docker-compose restart fabeo-service
```

#### Crypto API Not Responding
```bash
docker-compose logs crypto-api
docker-compose exec crypto-api curl http://fabeo-service:8002/health
```

## Security Notes

### Development vs Production
- Current setup uses default passwords and is configured for development
- For production:
  - Change all default passwords
  - Use proper SSL/TLS certificates
  - Configure firewalls and authentication mechanisms

### Data Privacy
- Patient data encrypted using Attribute-Based Encryption (ABE)
- Searchable metadata uses hash-based indexing
- Access control enforced at multiple layers
- Complete audit trail for compliance

## Monitoring

Each service includes automatic health monitoring:

```bash
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
curl http://localhost:8001/health
curl http://localhost:8002/health
```

## Production Deployment

### FABEO Features
- **FABEO22 CP-ABE**: Ciphertext-Policy Attribute-Based Encryption  
- **FABEO22 KP-ABE**: Key-Policy Attribute-Based Encryption  
- **Hybrid Encryption**: FABEO + AES-256-GCM  
- **Standard Crypto**: AES-256-GCM, RSA-2048  

### Access Policies
- Simple: `"doctor"`
- Conjunctive: `"doctor and cardiology"`
- Disjunctive: `"doctor or nurse"`
- Complex: `"(doctor and cardiology) or (nurse and emergency)"`

### Attributes
- Role: `doctor`, `nurse`, `receptionist`, `researcher`
- Department: `cardiology`, `emergency`, `pediatrics`
- Institution: `hospital_a`, `hospital_b`
- Clearance: `level_1`, `level_2`, `level_3`

## Storage Structure

```
storage/
├── patients/
│   └── PAT-XXXXX-YYYYY/
│       └── data.encrypted
├── encounters/
│   └── encounter_<uuid>.encrypted
└── conditions/
    └── condition_<uuid>.encrypted
```

All encrypted files contain base64-encoded Charm crypto objects.

## Development Notes

### FABEO Service (Python 2.7)
- **Base Image**: Ubuntu 16.04
- **Dependencies**: Charm-crypto 0.43, Flask, PyCrypto
- **Purpose**: Core ABE cryptographic operations
- **Limitation**: Python 2.7 required for Charm-crypto

### Crypto API (Python 3.8+)
- **Base Image**: Python 3.8-slim
- **Dependencies**: FastAPI, Uvicorn, Pydantic, httpx, cryptography
- **Purpose**: Modern API gateway
- **Features**: Async operations, type checking, automatic docs

### Inter-Service Communication
- Crypto API communicates with FABEO service via HTTP
- Internal Docker network: `machs-network`
- Health checks ensure service availability

## Related Documentation
- [Architecture Documentation](../main.md)
- [Cleanup Summary](../docs/BRANCH_CLEANUP_SUMMARY.md)
- [Test Results](../docs/FABEO_TEST_RESULTS.md)
- [API Reference](../docs/api-reference.md)

---

**FABEO Isolated Testing** - Pure cryptographic ABE implementation without dependencies.