# MACHS - Medical Access Control with Homomorphic System

A comprehensive system demonstrating Attribute-Based Encryption (ABE) in healthcare environments, featuring cryptographic modules with FABEO integration and an Electronic Health Records (EHR) system with encrypted patient data storage.

## 🏗️ System Architecture

MACHS consists of two main components that work together to provide secure medical data management:

### 1. Cryptography Modules (`cryptography/`)
- **Technology**: Python with FastAPI
- **Purpose**: Exposes REST API endpoints for cryptographic operations using FABEO
- **Dependencies**: 
  - [FABEO](https://github.com/abecryptools/FABEO) (included as Git submodule)
  - FastAPI for REST API
  - Multiple ABE schemes support
- **Features**:
  - Multiple ABE schemes (CP-ABE, KP-ABE, DFA, Waters11, Waters12)
  - RESTful API for encryption/decryption operations
  - Key generation and management
  - Policy-based access control
  - Encrypted file storage management

### 2. EHR System (`ehr-system/`)
- **Technology**: Node.js with Express and PostgreSQL
- **Purpose**: Provides hospital system backend with metadata-only database and encrypted patient storage
- **Architecture**:
  - **PostgreSQL**: Stores only metadata (patient IDs, file paths, timestamps)
  - **Encrypted Storage**: Patient data encrypted using FABEO and stored in filesystem
  - **Separation of Concerns**: Fast metadata queries + secure encrypted data
- **Features**:
  - Patient metadata management
  - Encrypted patient data storage using ABE
  - Medical records with fine-grained access control
  - Complete audit logging
  - REST API for frontend integration
  - Integrated cryptography service communication

## 🔒 Security Features

- **Data Separation**: Sensitive patient data never stored in database
- **Attribute-Based Encryption**: Fine-grained access control using ABE policies
- **Encryption at Rest**: All patient data encrypted using FABEO schemes
- **Audit Trail**: Complete logging of all data access attempts
- **Policy-Based Access**: Configurable access policies per data type

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git (for submodules)

### Setup
1. **Clone the repository with submodules**:
   ```bash
   git clone --recursive https://github.com/tomoutsuki/MACHS.git
   cd MACHS
   ```

2. **Start the system with Docker Compose**:
   ```bash
   # Install dependencies and start all services
   npm run setup
   
   # Or manually with Docker Compose
   cd docker
   docker-compose up --build -d
   ```

3. **Access the services**:
   - **🏥 Hospital Interface**: http://localhost:3002/hospital
   - **🔗 EHR System API**: http://localhost:3001
   - **🔐 Cryptography API**: http://localhost:8000
   - **🗄️ PostgreSQL Database**: localhost:5432

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure

```
MACHS/
├── cryptography/              # Python FastAPI cryptography service
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── services/            # Cryptography service logic
│   ├── models/              # Pydantic models
│   └── utils/               # Utility functions
├── ehr-system/               # Node.js EHR system
│   ├── server.js            # Express server
│   ├── package.json         # Node.js dependencies
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication middleware
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
├── submodules/
│   └── FABEO/               # Git submodule for FABEO library
├── docker/                   # Docker configuration
│   ├── docker-compose.yml   # Multi-service setup
│   ├── Dockerfile.cryptography
│   ├── Dockerfile.ehr
│   └── mongodb/             # MongoDB initialization
├── scripts/                  # Setup and utility scripts
└── docs/                     # Documentation
```

## 🔐 Cryptography Service API

### Available Schemes
- **CP-ABE**: `fabeo22cp`, `ac17cp`, `waters11cp`
- **KP-ABE**: `fabeo22kp`, `ac17kp`
- **DFA**: `fabeo22dfa`, `waters12dfa`

### Key Endpoints
```bash
# Health check
GET /health

# Encrypt data
POST /encrypt
{
  "data": "sensitive data",
  "policy": "(role:doctor AND department:cardiology)",
  "scheme": "fabeo22cp"
}

# Decrypt data  
POST /decrypt
{
  "ciphertext": "encrypted_data",
  "private_key": "user_attributes",
  "scheme": "fabeo22cp"
}
```

## 🏥 EHR System API

### Authentication
```bash
POST /api/auth/login
{
  "username": "admin", 
  "password": "admin123"
}
```

### Patient Management
```bash
POST /api/patients
Authorization: Bearer <token>
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "ssn": "123-45-6789"
  },
  "accessControl": {
    "department": "cardiology",
    "confidentialityLevel": "restricted"
  }
}
```

### Medical Records
```bash
POST /api/records
Authorization: Bearer <token>
{
  "patientId": "PAT-12345",
  "recordType": "diagnosis",
  "content": {
    "plaintext": {
      "title": "Cardiac Assessment",
      "diagnosis": "Hypertension"
    }
  },
  "encrypt": true,
  "accessPolicy": "(role:doctor AND department:cardiology)"
}
```

## 🧪 Quick Testing

1. **Start the system**:
   ```bash
   npm run setup
   ```

2. **Test services**:
   ```bash
   # Health checks
   curl http://localhost:3001/health
   curl http://localhost:8000/health
   
   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   ```

## 🔧 Development

### Individual Services
```bash
# Cryptography Service
cd cryptography && python main.py

# EHR System
cd ehr-system && npm start

# MongoDB
docker run -d -p 27017:27017 mongo:7.0
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
