# MACHS - FABEO Isolated Testing Environment# MACHS - Medical Access Control with Homomorphic System



**Branch: `test-fabeo-isolated`** ✅ **CLEANED AND ISOLATED**A comprehensive system demonstrating Attribute-Based Encryption (ABE) in healthcare environments, featuring cryptographic modules with FABEO integration and an Electronic Health Records (EHR) system with encrypted patient data storage.



A minimal, isolated testing environment for FABEO (Fast Attribute-Based Encryption Operations) containing **ONLY** cryptographic components for ABE encryption/decryption testing.## 🏗️ System Architecture



---MACHS consists of two main components that work together to provide secure medical data management:



## ⚡ What's in This Branch?### 1. Cryptography Modules (`cryptography/`)

- **Technology**: Python with FastAPI

This branch is **strictly limited** to cryptographic modules:- **Purpose**: Exposes REST API endpoints for cryptographic operations using FABEO

- **Dependencies**: 

### ✅ Included Components  - [FABEO](https://github.com/abecryptools/FABEO) (included as Git submodule)

- **FABEO Microservice** - Python 2.7 + Charm-crypto + Flask (Port 8002)  - FastAPI for REST API

- **Crypto API Gateway** - Python 3.8+ + FastAPI (Port 8001)  - Multiple ABE schemes support

- **Docker Infrastructure** - Containerized services- **Features**:

- **FABEO Submodule** - Git submodule with FABEO22 implementation  - Multiple ABE schemes (CP-ABE, KP-ABE, DFA, Waters11, Waters12)

- **Storage Structure** - File-based encrypted data storage (empty by default)  - RESTful API for encryption/decryption operations

- **Test Scripts** - Validation and testing utilities  - Key generation and management

- **Documentation** - Comprehensive system docs  - Policy-based access control

  - Encrypted file storage management

### ❌ NOT Included (Available in Other Branches)

- Frontend/UI components → See `base-structure` branch### 2. EHR System (`ehr-system/`)

- EHR system backend → See `base-structure` branch- **Technology**: Node.js with Express and PostgreSQL

- Database (PostgreSQL) → See `base-structure` branch- **Purpose**: Provides hospital system backend with metadata-only database and encrypted patient storage

- Sample patient data → See `base-structure` branch- **Architecture**:

- Full hospital simulation → See `main` branch  - **PostgreSQL**: Stores only metadata (patient IDs, file paths, timestamps)

  - **Encrypted Storage**: Patient data encrypted using FABEO and stored in filesystem

---  - **Separation of Concerns**: Fast metadata queries + secure encrypted data

- **Features**:

## 🏗️ Isolated Architecture  - Patient metadata management

  - Encrypted patient data storage using ABE

```  - Medical records with fine-grained access control

┌─────────────────────────────────────────────────────────────┐  - Complete audit logging

│                  FABEO Isolated System                      │  - REST API for frontend integration

├─────────────────────────────────────────────────────────────┤  - Integrated cryptography service communication

│                                                             │

│  ┌──────────────────────────────────────────────────────┐  │## 🔒 Security Features

│  │     Crypto API Gateway (Port 8001)                   │  │

│  │     - FastAPI + Python 3.8+                          │  │- **Data Separation**: Sensitive patient data never stored in database

│  │     - REST API endpoints                             │  │- **Attribute-Based Encryption**: Fine-grained access control using ABE policies

│  │     - OpenAPI documentation                          │  │- **Encryption at Rest**: All patient data encrypted using FABEO schemes

│  └────────────────────┬─────────────────────────────────┘  │- **Audit Trail**: Complete logging of all data access attempts

│                       │ HTTP                                │- **Policy-Based Access**: Configurable access policies per data type

│                       ▼                                     │

│  ┌──────────────────────────────────────────────────────┐  │## 🚀 Quick Start

│  │     FABEO Service (Port 8002)                        │  │

│  │     - Python 2.7 + Charm-crypto 0.43                 │  │### Prerequisites

│  │     - FABEO22 CP-ABE & KP-ABE                        │  │- Docker and Docker Compose

│  │     - Flask HTTP server                              │  │- Git (for submodules)

│  └──────────────────────────────────────────────────────┘  │

│                                                             │### Setup

│  ┌──────────────────────────────────────────────────────┐  │1. **Clone the repository with submodules**:

│  │     Storage (File System)                            │  │   ```bash

│  │     - storage/patients/                              │  │   git clone --recursive https://github.com/tomoutsuki/MACHS.git

│  │     - storage/encounters/                            │  │   cd MACHS

│  │     - storage/conditions/                            │  │   ```

│  └──────────────────────────────────────────────────────┘  │

│                                                             │2. **Start the system with Docker Compose**:

└─────────────────────────────────────────────────────────────┘   ```bash

```   # Install dependencies and start all services

   npm run setup

---   

   # Or manually with Docker Compose

## 🚀 Quick Start   cd docker

   docker-compose up --build -d

### Prerequisites   ```

- Docker and Docker Compose

- Git (for submodules)3. **Access the services**:

   - **🏥 Hospital Interface**: http://localhost:3002/hospital

### 1. Clone with Submodules   - **🔗 EHR System API**: http://localhost:3001

```bash   - **🔐 Cryptography API**: http://localhost:8000

git clone --recursive https://github.com/tomoutsuki/MACHS.git   - **🗄️ PostgreSQL Database**: localhost:5432

cd MACHS

git checkout test-fabeo-isolated### Default Credentials

```- **Username**: `admin`

- **Password**: `admin123`

If you already cloned without `--recursive`:

```bash## 📁 Project Structure

git submodule update --init --recursive

``````

MACHS/

### 2. Start FABEO Services├── cryptography/              # Python FastAPI cryptography service

```bash│   ├── main.py               # FastAPI application

cd docker│   ├── requirements.txt      # Python dependencies

docker-compose up --build -d│   ├── services/            # Cryptography service logic

```│   ├── models/              # Pydantic models

│   └── utils/               # Utility functions

Or use the Windows batch script:├── ehr-system/               # Node.js EHR system

```bash│   ├── server.js            # Express server

start-hospital-system.bat│   ├── package.json         # Node.js dependencies

```│   ├── models/              # MongoDB models

│   ├── routes/              # API routes

### 3. Verify Services│   ├── middleware/          # Authentication middleware

```bash│   ├── services/            # Business logic

# Check health│   └── utils/               # Helper functions

curl http://localhost:8001/health├── submodules/

curl http://localhost:8002/health│   └── FABEO/               # Git submodule for FABEO library

├── docker/                   # Docker configuration

# View API documentation│   ├── docker-compose.yml   # Multi-service setup

# Open in browser: http://localhost:8001/docs│   ├── Dockerfile.cryptography

```│   ├── Dockerfile.ehr

│   └── mongodb/             # MongoDB initialization

### 4. Run Tests├── scripts/                  # Setup and utility scripts

```bash└── docs/                     # Documentation

python test_fabeo_isolated.py```

```

## 🔐 Cryptography Service API

---

### Available Schemes

## 📁 Project Structure- **CP-ABE**: `fabeo22cp`, `ac17cp`, `waters11cp`

- **KP-ABE**: `fabeo22kp`, `ac17kp`

```- **DFA**: `fabeo22dfa`, `waters12dfa`

MACHS/ (test-fabeo-isolated branch)

├── services/                    # FABEO Microservices### Key Endpoints

│   ├── fabeo-service/          # Python 2.7 FABEO microservice```bash

│   │   ├── main.py             # Flask HTTP server# Health check

│   │   ├── Dockerfile          # Ubuntu 16.04 + Python 2.7 + CharmGET /health

│   │   └── requirements.txt    # Python 2.7 dependencies

│   └── crypto-api/             # Python 3.8+ API Gateway# Encrypt data

│       ├── main.py             # FastAPI applicationPOST /encrypt

│       ├── fabeo_client.py     # FABEO service client{

│       ├── models.py           # Pydantic models  "data": "sensitive data",

│       ├── standard_crypto.py  # AES/RSA implementations  "policy": "(role:doctor AND department:cardiology)",

│       ├── Dockerfile          # Modern Python environment  "scheme": "fabeo22cp"

│       └── requirements.txt    # Python 3.8+ dependencies}

├── submodules/

│   └── FABEO/                  # Git submodule (FABEO library)# Decrypt data  

├── docker/                     # Docker configurationPOST /decrypt

│   ├── docker-compose.yml      # Service definitions{

│   ├── start-hospital-system.bat  "ciphertext": "encrypted_data",

│   ├── stop-hospital-system.bat  "private_key": "user_attributes",

│   └── README_DOCKER.md  "scheme": "fabeo22cp"

├── storage/                    # Encrypted data storage (empty)}

│   ├── patients/.gitkeep```

│   ├── encounters/.gitkeep

│   └── conditions/.gitkeep## 🏥 EHR System API

├── docs/                       # Documentation

│   ├── SYSTEM_ARCHITECTURE_DOCUMENTATION.md### Authentication

│   ├── api-reference.md```bash

│   └── ...POST /api/auth/login

├── test_fabeo_isolated.py      # Isolated FABEO test script{

├── test_fabeo_direct.py        # Direct FABEO library test  "username": "admin", 

├── test_fabeo_proper_workflow.py  "password": "admin123"

├── verify_fabeo_setup.py}

├── .gitignore```

├── .gitmodules

├── LICENSE### Patient Management

└── README.md                   # This file```bash

```POST /api/patients

Authorization: Bearer <token>

---{

  "personalInfo": {

## 🔐 FABEO Operations    "firstName": "John",

    "lastName": "Doe",

### Encryption    "dateOfBirth": "1990-01-01",

```bash    "gender": "male",

curl -X POST http://localhost:8001/encrypt \    "ssn": "123-45-6789"

  -H "Content-Type: application/json" \  },

  -d '{  "accessControl": {

    "data": "Patient has diabetes",    "department": "cardiology",

    "policy": "(doctor AND endocrinology) OR emergency",    "confidentialityLevel": "restricted"

    "scheme": "CP-ABE"  }

  }'}

``````



### Key Generation### Medical Records

```bash```bash

curl -X POST http://localhost:8001/keygen \POST /api/records

  -H "Content-Type: application/json" \Authorization: Bearer <token>

  -d '{{

    "attributes": ["doctor", "endocrinology"],  "patientId": "PAT-12345",

    "scheme": "CP-ABE"  "recordType": "diagnosis",

  }'  "content": {

```    "plaintext": {

      "title": "Cardiac Assessment",

### Decryption      "diagnosis": "Hypertension"

```bash    }

curl -X POST http://localhost:8001/decrypt_with_key \  },

  -H "Content-Type: application/json" \  "encrypt": true,

  -d '{  "accessPolicy": "(role:doctor AND department:cardiology)"

    "ciphertext": "<encrypted_data>",}

    "user_key": "<generated_key>",```

    "scheme": "CP-ABE"

  }'## 🧪 Quick Testing

```

1. **Start the system**:

---   ```bash

   npm run setup

## 📚 API Documentation   ```



- **Swagger UI**: http://localhost:8001/docs2. **Test services**:

- **ReDoc**: http://localhost:8001/redoc   ```bash

- **OpenAPI JSON**: http://localhost:8001/openapi.json   # Health checks

   curl http://localhost:3001/health

---   curl http://localhost:8000/health

   

## 🧪 Testing   # Login

   curl -X POST http://localhost:3001/api/auth/login \

### Run Automated Tests     -H "Content-Type: application/json" \

```bash     -d '{"username": "admin", "password": "admin123"}'

# Comprehensive isolated FABEO test   ```

python test_fabeo_isolated.py

## 🔧 Development

# Direct FABEO library test

python test_fabeo_direct.py### Individual Services

```bash

# Verify setup# Cryptography Service

python verify_fabeo_setup.pycd cryptography && python main.py

```

# EHR System

### Manual Testingcd ehr-system && npm start

```bash

# Health checks# MongoDB

curl http://localhost:8001/healthdocker run -d -p 27017:27017 mongo:7.0

curl http://localhost:8002/health```



# Service info## 📄 License

curl http://localhost:8001/info

curl http://localhost:8002/infoMIT License - see [LICENSE](LICENSE) file for details.

```

---

## 🔧 Docker Management

### Start Services
```bash
cd docker
docker-compose up --build -d
```

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f fabeo-service
docker-compose logs -f crypto-api
```

### Stop Services
```bash
docker-compose down
```

### Rebuild Services
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 📖 Documentation

Comprehensive documentation available in `docs/`:

- **[System Architecture Documentation](docs/SYSTEM_ARCHITECTURE_DOCUMENTATION.md)** - Complete technical documentation
- **[API Reference](docs/api-reference.md)** - API endpoint specifications
- **[Docker README](docker/README_DOCKER.md)** - Docker deployment guide

---

## 🔍 Available Schemes

This FABEO implementation supports:

- **FABEO22-CP-ABE** - Ciphertext-Policy ABE (primary)
- **FABEO22-KP-ABE** - Key-Policy ABE
- **AES** - Symmetric encryption (standard crypto)
- **RSA** - Asymmetric encryption (standard crypto)

---

## 🌿 Branch Information

### Current Branch: `test-fabeo-isolated`
- **Purpose**: Isolated FABEO cryptographic testing
- **Components**: FABEO service + Crypto API only
- **Use Case**: Testing ABE operations without full system

### Other Branches
- **`main`**: Complete hospital system with frontend
- **`base-structure`**: Full system with EHR backend + database

### Switch to Other Branches
```bash
# Full hospital system
git checkout main

# System with backend but testing focus
git checkout base-structure
```

---

## 🛠️ Troubleshooting

### Services Won't Start
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up --build -d
```

### FABEO Service Issues
```bash
# Check FABEO service logs
docker-compose logs fabeo-service

# Common issues:
# - Charm-crypto initialization failure
# - Missing FABEO submodule
# - Python 2.7 compatibility issues
```

### Submodule Not Found
```bash
# Initialize submodules
git submodule update --init --recursive

# Or clone with submodules
git clone --recursive https://github.com/tomoutsuki/MACHS.git
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 References

- **FABEO Paper**: Riepel & Wee, "FABEO: Fast Attribute-based Encryption with Optimal Security", ACM CCS 2022
- **FABEO Repository**: https://github.com/abecryptools/FABEO
- **Charm-crypto**: https://github.com/JHUISI/charm

---

## 📞 Support

For issues or questions:
1. Check the [documentation](docs/)
2. Review [troubleshooting](#-troubleshooting) section
3. Check Docker logs: `docker-compose logs`

---

**Note**: This is the isolated FABEO testing branch. For the complete hospital system with frontend and database, switch to the `main` or `base-structure` branch.
