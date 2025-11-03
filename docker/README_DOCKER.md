# FABEO Isolated Testing System - Docker Deployment# MACHS Hospital System - Docker Deployment



This directory contains the Docker Compose setup for isolated FABEO cryptographic testing without frontend, database, or EHR system dependencies.This directory contains the complete Docker Compose setup for the MACHS Hospital System, including the enhanced hospital frontend with user authentication, searchable encryption, and data visualization.



## 🚀 Quick Start## 🚀 Quick Start



### One-Click Startup### One-Click Startup

```bash```bash

# Windows# Windows

start-hospital-system.batstart-hospital-system.bat



# Linux/Mac# Linux/Mac

docker-compose up --build -ddocker-compose up --build -d

``````



This will start the FABEO services and automatically:This will start all services and automatically:

- ✅ Build FABEO service (Python 2.7 + Charm-crypto)- ✅ Initialize the PostgreSQL database

- ✅ Build Crypto API Gateway (Python 3.8 + FastAPI)- ✅ Start the cryptography service (FABEO + FastAPI)

- ✅ Configure health checks- ✅ Start the EHR system (Node.js + Express)

- ✅ Mount storage volume for encrypted data- ✅ Start both frontend interfaces

- ✅ Create demo patient data

## 🔐 Access Points- ✅ Open the hospital interface in your browser



| Service | URL | Description |## 🏥 Access Points

|---------|-----|-------------|

| **Crypto API** | http://localhost:8001 | FastAPI gateway for encryption operations || Service | URL | Description |

| **FABEO Service** | http://localhost:8002 | Core FABEO22 CP-ABE/KP-ABE service ||---------|-----|-------------|

| **Hospital Interface** | http://localhost:3002/hospital | Enhanced hospital system with user roles |

## 🏗️ Architecture| **Original Test Interface** | http://localhost:8080 | Original FABEO testing interface |

| **EHR API** | http://localhost:3001 | RESTful API for patient data |

```| **Crypto API** | http://localhost:8000 | FABEO encryption service |

┌─────────────────────────────────────┐

│       Crypto API Gateway            │## 🏗️ Architecture

│       (Python 3.8 + FastAPI)        │

│       Port: 8001                    │```

│  ┌───────────────────────────────┐  │┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐

│  │ - Request Validation          │  ││   Hospital      │    │   Original      │    │   EHR System    │

│  │ - Standard Crypto (AES/RSA)   │  ││   Frontend      │    │   Frontend      │    │   (Node.js)     │

│  │ - FABEO Client                │  ││   (Port 3002)   │    │   (Port 8080)   │    │   (Port 3001)   │

│  │ - Storage Management          │  │└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘

│  └───────────┬───────────────────┘  │          │                      │                      │

└──────────────┼──────────────────────┘          └──────────────────────┼──────────────────────┘

               │ HTTP                                 │

               ▼                    ┌─────────────────┐    ┌─────────────────┐

┌─────────────────────────────────────┐                    │  Cryptography   │    │   PostgreSQL    │

│       FABEO Service                 │                    │   Service       │    │   Database      │

│   (Python 2.7 + Charm-crypto 0.43)  │                    │  (Port 8000)    │    │   (Port 5432)   │

│       Port: 8002                    │                    └─────────────────┘    └─────────────────┘

│  ┌───────────────────────────────┐  │```

│  │ - FABEO22 CP-ABE              │  │

│  │ - FABEO22 KP-ABE              │  │## 🐳 Docker Services

│  │ - Pairing Operations          │  │

│  │ - Key Management              │  │### Core Services

│  └───────────────────────────────┘  │- **`postgres`**: PostgreSQL database for patient metadata and audit logs

└─────────────────────────────────────┘- **`cryptography`**: FABEO-based encryption service (Python + FastAPI)

               │- **`ehr-system`**: EHR backend with enhanced APIs (Node.js + Express)

               ▼

        File-based Storage### Frontend Services

  (patients/, encounters/, conditions/)- **`frontend`**: Original test interface for FABEO encryption testing

```- **`hospital-frontend`**: Enhanced hospital system with user authentication and access control



## 🐳 Docker Services## 🔧 Service Configuration



### Services### Environment Variables

- **`fabeo-service`**: Core FABEO22 ABE implementation (Ubuntu 16.04 + Python 2.7 + Charm-crypto 0.43)

- **`crypto-api`**: Modern REST API gateway (Python 3.8 + FastAPI + Uvicorn)| Variable | Default | Description |

|----------|---------|-------------|

### Network| `POSTGRES_DB` | `machs_ehr` | Database name |

- **`machs-network`**: Bridge network for inter-service communication| `POSTGRES_USER` | `postgres` | Database user |

| `POSTGRES_PASSWORD` | `secure_password` | Database password |

## 🔧 Service Configuration| `CREATE_DEMO_DATA` | `true` | Auto-create demo patients |

| `NODE_ENV` | `production` | Environment mode |

### Environment Variables

### Port Mappings

| Variable | Default | Description |

|----------|---------|-------------|| Internal Port | External Port | Service |

| `LOG_LEVEL` | `INFO` | Logging verbosity ||---------------|---------------|---------|

| `FABEO_SERVICE_URL` | `http://fabeo-service:8002` | FABEO service endpoint || 5432 | 5432 | PostgreSQL |

| `STORAGE_PATH` | `/app/storage` | Encrypted data storage path || 8000 | 8000 | Cryptography API |

| 3000 | 3001 | EHR System API |

### Port Mappings| 8080 | 8080 | Original Frontend |

| 3002 | 3002 | Hospital Frontend |

| Internal Port | External Port | Service |

|---------------|---------------|---------|## 🛠️ Management Commands

| 8002 | 8002 | FABEO Service |

| 8001 | 8001 | Crypto API |### Start System

```bash

### Volumes# Full startup with build

- `../storage:/app/storage` - Persistent encrypted data storagedocker-compose up --build -d



## 🛠️ Management Commands# Start existing containers

docker-compose up -d

### Start System

```bash# Start with logs

# Full startup with builddocker-compose up --build

docker-compose up --build -d```



# Start existing containers### Monitor System

docker-compose up -d```bash

# View all logs

# Start with logs (foreground)docker-compose logs -f

docker-compose up --build

```# View specific service logs

docker-compose logs -f hospital-frontend

### Monitor Systemdocker-compose logs -f ehr-system

```bash

# View all logs# Check service status

docker-compose logs -fdocker-compose ps

```

# View specific service logs

docker-compose logs -f fabeo-service### Stop System

docker-compose logs -f crypto-api```bash

# Stop services (preserves data)

# Check service statusdocker-compose down

docker-compose ps

```# Stop and remove data volumes

docker-compose down -v

### Stop System```

```bash

# Stop services (preserves encrypted data)### Rebuild Services

docker-compose down```bash

# Rebuild all services

# Stop and remove volumes (deletes encrypted data)docker-compose build --no-cache

docker-compose down -v

```# Rebuild specific service

docker-compose build --no-cache hospital-frontend

### Rebuild Services```

```bash

# Rebuild all services## 🎯 Testing the System

docker-compose build --no-cache

### 1. **Hospital Interface** (http://localhost:3002/hospital)

# Rebuild specific service- Login with different user profiles

docker-compose build --no-cache fabeo-service- Test role-based access control

docker-compose build --no-cache crypto-api- Search for patients using encrypted metadata

```- View permission-filtered data



## 🎯 Testing the System### 2. **User Profiles**

| User | Role | Capabilities |

### 1. Health Checks|------|------|-------------|

```bash| **Dr. Administrator** | Admin | Full access + FABEO testing |

# Crypto API health| **Dr. Silva** | Doctor | Medical data + diagnoses |

curl http://localhost:8001/health| **Nurse Maria** | Nurse | Basic patient data (no diagnoses) |

| **Ana Reception** | Receptionist | Demographics only |

# FABEO service health| **Dr. Research** | Researcher | Anonymized medical data |

curl http://localhost:8002/health

```### 3. **Demo Data**

The system automatically creates 5 test patients:

### 2. Run Python Tests- Ana Maria Santos (CPF: 123.456.789-01)

```bash- João Silva Oliveira (CPF: 987.654.321-09)

# Isolated system test (recommended)- Maria José Lima (CPF: 456.789.123-45)

python test_fabeo_isolated.py- Carlos Eduardo Costa (CPF: 321.654.987-12)

- Fernanda Alves Pereira (CPF: 789.123.456-78)

# Direct FABEO library test

python test_fabeo_direct.py### 4. **API Testing**

```bash

# Full workflow test# Health checks

python test_fabeo_proper_workflow.pycurl http://localhost:3001/health

curl http://localhost:8000/health

# Verify setupcurl http://localhost:3002/health

python verify_fabeo_setup.py

```# Patient list (with user context)

curl -H "X-User-Id: doctor" http://localhost:3001/patients

### 3. API Testing Examples

# Search patients

**Setup System**curl -X POST http://localhost:3001/patients/search \

```bash  -H "Content-Type: application/json" \

curl -X POST http://localhost:8001/setup \  -H "X-User-Id: doctor" \

  -H "Content-Type: application/json" \  -d '{"name": "Ana Maria"}'

  -d '{}'```

```

## 🔍 Troubleshooting

**Encrypt Data**

```bash### Common Issues

curl -X POST http://localhost:8001/encrypt \

  -H "Content-Type: application/json" \#### Services Not Starting

  -d '{```bash

    "data": "Patient diagnosis: Hypertension",# Check logs for errors

    "policy": "doctor or (nurse and cardiology)"docker-compose logs

  }'

```# Rebuild containers

docker-compose build --no-cache

**Generate User Key**docker-compose up -d

```bash```

curl -X POST http://localhost:8001/keygen \

  -H "Content-Type: application/json" \#### Database Connection Issues

  -d '{```bash

    "attributes": ["doctor", "cardiology", "hospital_a"]# Check if PostgreSQL is running

  }'docker-compose ps postgres

```

# View database logs

**Decrypt Data**docker-compose logs postgres

```bash

curl -X POST http://localhost:8001/decrypt \# Reset database

  -H "Content-Type: application/json" \docker-compose down -v

  -d '{docker-compose up -d

    "ciphertext": "<base64_encoded_ciphertext>",```

    "user_key": "<base64_encoded_user_key>"

  }'#### Frontend Not Loading

``````bash

# Check hospital frontend logs

## 🔍 Troubleshootingdocker-compose logs hospital-frontend



### Common Issues# Verify all dependencies are running

docker-compose ps

#### Services Not Starting

```bash# Restart frontend service

# Check logs for errorsdocker-compose restart hospital-frontend

docker-compose logs```



# Rebuild containers#### Permission Errors

docker-compose build --no-cache```bash

docker-compose up -d# Check if demo data was created

```docker-compose logs hospital-frontend | grep "demo"



#### FABEO Service Connection Issues# Manually create demo data

```bashdocker-compose exec hospital-frontend node create-demo-data.js

# Check if FABEO service is running```

docker-compose ps fabeo-service

### Health Checks

# View FABEO service logsEach service includes health checks that Docker monitors:

docker-compose logs fabeo-service

```bash

# Restart FABEO service# View health status

docker-compose restart fabeo-servicedocker-compose ps --format "table {{.Name}}\t{{.Status}}"

```

# Individual health checks

#### Crypto API Not Respondingcurl http://localhost:3002/health  # Hospital Frontend

```bashcurl http://localhost:3001/health  # EHR System

# Check crypto-api logscurl http://localhost:8000/health  # Crypto Service

docker-compose logs crypto-api```



# Verify FABEO service is accessible## 🔐 Security Notes

docker-compose exec crypto-api curl http://fabeo-service:8002/health

### Development vs Production

# Restart crypto-api service- Current setup uses default passwords and is configured for development

docker-compose restart crypto-api- For production deployment:

```  - Change all default passwords

  - Use proper SSL/TLS certificates

#### Python 2.7 Compatibility Issues  - Configure firewalls and network security

The FABEO service runs Python 2.7 for Charm-crypto compatibility:  - Enable proper authentication mechanisms

```bash

# Check Python version in container### Data Privacy

docker-compose exec fabeo-service python --version- Patient data is encrypted using ABE (Attribute-Based Encryption)

- Searchable metadata uses hash-based indexing

# Rebuild with fresh image- Access control enforced at multiple layers

docker-compose build --no-cache fabeo-service- Complete audit trail for compliance

```

## 📊 Monitoring

### Health Checks

Each service includes automatic health monitoring:### Service Dependencies

The system has careful dependency management:

```bash1. **PostgreSQL** starts first

# View health status2. **Cryptography Service** starts after database

docker-compose ps --format "table {{.Name}}\t{{.Status}}"3. **EHR System** waits for database and crypto

4. **Frontend Services** wait for all backend services

# Individual health checks

curl http://localhost:8001/health  # Crypto API### Auto-Recovery

curl http://localhost:8002/health  # FABEO ServiceAll services are configured with `restart: unless-stopped` for automatic recovery from failures.

```

## 🚀 Production Deployment

## 🔐 FABEO Features

For production deployment, consider:

### Supported Schemes

- **FABEO22 CP-ABE**: Ciphertext-Policy Attribute-Based Encryption1. **Environment Variables**: Use proper secrets management

- **FABEO22 KP-ABE**: Key-Policy Attribute-Based Encryption2. **SSL/TLS**: Configure HTTPS for all services

- **Hybrid Encryption**: FABEO + AES-256-GCM for large data3. **Database**: Use managed PostgreSQL service

- **Standard Crypto**: AES-256-GCM, RSA-20484. **Scaling**: Configure load balancers and multiple instances

5. **Monitoring**: Add logging, metrics, and alerting

### Access Policies6. **Backup**: Implement automated backup strategies

Define flexible access control using boolean expressions:

- Simple: `"doctor"`## 📚 Related Documentation

- Conjunctive: `"doctor and cardiology"`

- Disjunctive: `"doctor or nurse"`- [Hospital System Features](../frontend/HOSPITAL_SYSTEM_README.md)

- Complex: `"(doctor and cardiology) or (nurse and emergency)"`- [Quick Start Guide](../frontend/QUICK_START_HOSPITAL.md)

- [Main Project Documentation](../README.md)

### Attributes- [API Reference](../docs/api-reference.md)

User capabilities defined through attribute sets:

- Role: `doctor`, `nurse`, `receptionist`, `researcher`---

- Department: `cardiology`, `emergency`, `pediatrics`

- Institution: `hospital_a`, `hospital_b`🏥 **MACHS Hospital System** - Demonstrating real-world ABE integration in healthcare environments.
- Clearance: `level_1`, `level_2`, `level_3`

## 📊 Storage Structure

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

## 🚀 Development Notes

### FABEO Service (Python 2.7)
- **Base Image**: Ubuntu 16.04
- **Dependencies**: Charm-crypto 0.43, Flask, PyCrypto
- **Purpose**: Core ABE cryptographic operations
- **Limitation**: Python 2.7 required for Charm-crypto compatibility

### Crypto API (Python 3.8+)
- **Base Image**: Python 3.8-slim
- **Dependencies**: FastAPI, Uvicorn, Pydantic, httpx, cryptography
- **Purpose**: Modern API gateway with validation and routing
- **Features**: Async operations, type checking, automatic docs

### Inter-Service Communication
- Crypto API communicates with FABEO service via HTTP
- Internal Docker network: `machs-network`
- Health checks ensure service availability

## 📚 Related Documentation

- [Architecture Documentation](../main.md)
- [Cleanup Summary](../docs/BRANCH_CLEANUP_SUMMARY.md)
- [Test Results](../docs/FABEO_TEST_RESULTS.md)
- [API Reference](../docs/api-reference.md)

---

🔐 **FABEO Isolated Testing** - Pure cryptographic ABE implementation without dependencies.
