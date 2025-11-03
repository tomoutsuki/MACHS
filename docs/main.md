# MACHS - System Architecture and Technical Documentation

**Version:** 2.0.0  
**Branch:** test-fabeo-isolated  
**Last Updated:** October 30, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Cryptographic Implementation](#cryptographic-implementation)
4. [Data Flow and Operations](#data-flow-and-operations)
5. [Storage Structure](#storage-structure)
6. [API Specifications](#api-specifications)
7. [Docker Infrastructure](#docker-infrastructure)
8. [Security Model](#security-model)
9. [Testing and Validation](#testing-and-validation)
10. [Technical Specifications](#technical-specifications)

---

## 1. System Overview

### 1.1 What is MACHS?

**MACHS (Medical Access Control with Healthcare Security)** is a research prototype system that demonstrates the practical application of **Attribute-Based Encryption (ABE)** for securing electronic health records (EHR). The system simulates a healthcare environment where patient data is encrypted using fine-grained access control policies based on user attributes.

### 1.2 Purpose and Simulation Scope

The system **simulates**:
- **Healthcare data storage** with encrypted patient records
- **Policy-based access control** using cryptographic attributes
- **Fine-grained encryption** where data can only be decrypted by users with specific attributes
- **Modern microservices architecture** for ABE operations
- **Real cryptographic operations** using the FABEO library (not mock encryption)

The system **does NOT**:
- Store actual patient data (uses test/demo data only)
- Implement HIPAA-compliant production storage
- Provide clinical decision support
- Connect to real healthcare systems
- Implement complete authentication/authorization workflows

### 1.3 Key Features

- ✅ **Real ABE Implementation**: Uses FABEO (Fast Attribute-Based Encryption with Optimal Security) from CCS '22
- ✅ **Ciphertext-Policy ABE (CP-ABE)**: Data owner defines encryption policy
- ✅ **Key-Policy ABE (KP-ABE)**: Authority defines key policy
- ✅ **Microservices Architecture**: Isolated Python 2.7 and Python 3.8+ environments
- ✅ **RESTful API**: Modern FastAPI gateway for crypto operations
- ✅ **Docker-based Deployment**: Containerized services for reproducibility
- ✅ **Storage Layer**: File-based encrypted data persistence

---

## 2. Architecture Components

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MACHS System Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │                  User/Application Layer                   │     │
│  │  (HTTP Clients, Test Scripts, API Consumers)              │     │
│  └────────────────────────┬─────────────────────────────────┘     │
│                           │                                         │
│                           │ HTTP/REST                               │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │             Crypto API Gateway (Port 8001)               │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │         FastAPI Application (Python 3.8+)          │  │     │
│  │  ├────────────────────────────────────────────────────┤  │     │
│  │  │  - Request validation (Pydantic models)            │  │     │
│  │  │  - Routing logic                                   │  │     │
│  │  │  - Error handling                                  │  │     │
│  │  │  - API documentation (OpenAPI/Swagger)             │  │     │
│  │  │  - FABEO client integration                        │  │     │
│  │  │  - Standard crypto operations (AES, RSA)           │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  └────────────────────────┬─────────────────────────────────┘     │
│                           │                                         │
│                           │ HTTP (Internal Network)                 │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │             FABEO Service (Port 8002)                    │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │         Flask Application (Python 2.7)             │  │     │
│  │  ├────────────────────────────────────────────────────┤  │     │
│  │  │  - FABEO22 CP-ABE scheme initialization           │  │     │
│  │  │  - FABEO22 KP-ABE scheme initialization           │  │     │
│  │  │  - Charm-crypto pairing operations                │  │     │
│  │  │  - Master key management (pk, msk)                │  │     │
│  │  │  - Encryption/Decryption operations               │  │     │
│  │  │  - Key generation for attributes                  │  │     │
│  │  │  - Object serialization (Charm elements)          │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │         FABEO Library (Git Submodule)              │  │     │
│  │  ├────────────────────────────────────────────────────┤  │     │
│  │  │  - FABEO22CPABE: CP-ABE scheme implementation     │  │     │
│  │  │  - FABEO22KPABE: KP-ABE scheme implementation     │  │     │
│  │  │  - Pairing group: SS512                           │  │     │
│  │  │  - Policy parsing and evaluation                  │  │     │
│  │  │  - Cryptographic primitives                       │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │         Charm-Crypto Library (v0.43)               │  │     │
│  │  ├────────────────────────────────────────────────────┤  │     │
│  │  │  - Pairing-based cryptography                     │  │     │
│  │  │  - Group operations (G1, G2, GT, ZR)              │  │     │
│  │  │  - Element serialization/deserialization          │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │                Storage Layer (File System)               │     │
│  │  ┌────────────────────────────────────────────────────┐  │     │
│  │  │  storage/                                          │  │     │
│  │  │  ├── patients/      (Encrypted patient records)   │  │     │
│  │  │  ├── encounters/    (Encrypted encounter data)    │  │     │
│  │  │  └── conditions/    (Encrypted condition data)    │  │     │
│  │  └────────────────────────────────────────────────────┘  │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Descriptions

#### 2.2.1 Crypto API Gateway Service

**Location:** `services/crypto-api/`  
**Technology:** Python 3.8+, FastAPI, Uvicorn  
**Port:** 8001 (External)  
**Container:** `machs-crypto-api`

**Responsibilities:**
- Expose modern REST API endpoints for cryptographic operations
- Validate incoming requests using Pydantic models
- Route ABE operations to FABEO Service
- Handle standard encryption (AES, RSA) locally
- Provide API documentation via OpenAPI/Swagger
- Manage error handling and logging
- Abstract FABEO complexity from clients

**Key Files:**
- `main.py` - FastAPI application and endpoint definitions
- `fabeo_client.py` - Async HTTP client for FABEO service communication
- `models.py` - Pydantic models for request/response validation
- `standard_crypto.py` - AES and RSA implementations
- `requirements.txt` - Python 3.8+ dependencies
- `Dockerfile` - Container configuration

**Dependencies:**
- FastAPI (web framework)
- Uvicorn (ASGI server)
- httpx (async HTTP client)
- Pydantic (data validation)
- python-multipart (form data parsing)

#### 2.2.2 FABEO Service

**Location:** `services/fabeo-service/`  
**Technology:** Python 2.7, Flask, Charm-crypto 0.43, Ubuntu 16.04  
**Port:** 8002 (Internal)  
**Container:** `machs-fabeo-service`

**Responsibilities:**
- Initialize FABEO22 CP-ABE and KP-ABE schemes
- Manage cryptographic pairing group (SS512)
- Generate and maintain master keys (pk, msk)
- Perform ABE encryption using access policies
- Perform ABE decryption using user keys
- Generate user keys based on attributes
- Serialize/deserialize Charm cryptographic elements
- Implement hybrid encryption (ABE + symmetric)

**Key Files:**
- `main.py` - Flask application with ABE endpoints
- `Dockerfile` - Ubuntu 16.04 + Python 2.7 + Charm setup
- `requirements.txt` - Python 2.7 compatible packages

**Cryptographic Operations:**
1. **Setup:** `(pk, msk) ← setup()`
2. **Key Generation:** `sk ← keygen(pk, msk, attributes)`
3. **Encryption:** `ct ← encrypt(pk, message, policy)`
4. **Decryption:** `message ← decrypt(pk, ct, sk)`

**Critical Design Decisions:**
- Uses **hybrid encryption**: ABE encrypts a random GT element, which is hashed for symmetric encryption
- Policy objects are **serialized to strings** for JSON transport
- Charm elements use **custom serialization** (base64-encoded JSON)
- Supports both **attribute-based** and **key-based** decryption methods

#### 2.2.3 FABEO Library (Submodule)

**Location:** `submodules/FABEO/`  
**Source:** https://github.com/abecryptools/FABEO  
**Version:** CCS '22 implementation  
**Integration:** Git submodule

**Provides:**
- `FABEO22CPABE` - Ciphertext-Policy ABE scheme
- `FABEO22KPABE` - Key-Policy ABE scheme
- `FABEO22DFA` - ABE for Deterministic Finite Automata
- Additional schemes: BSW07, CGW15, Waters11, GPSW06, etc.

**Technical Details:**
- Built on **asymmetric pairing groups**
- Uses **SS512 curve** (512-bit symmetric security)
- Implements **optimal adaptive security**
- Supports **expressive policies** (AND, OR, threshold)
- No restrictions on policy type or attributes

**Academic Citation:**
```
Doreen Riepel and Hoeteck Wee. "FABEO: Fast Attribute-based Encryption 
with Optimal Security." In Proceedings of ACM CCS 2022.
```

#### 2.2.4 Storage Layer

**Location:** `storage/`  
**Type:** File-based persistent storage  
**Structure:**

```
storage/
├── patients/              # Encrypted patient records
│   ├── PAT-XXXXXXXX-YYYYYY/
│   │   └── data.encrypted
│   └── ...
├── encounters/            # Encrypted encounter records
│   ├── encounter_<uuid>.encrypted
│   └── ...
└── conditions/            # Encrypted condition records
    ├── condition_<uuid>.encrypted
    └── ...
```

**Data Format:**
- Files contain **base64-encoded encrypted data**
- Each file is encrypted with a **specific access policy**
- Metadata may include policy information (not in plaintext)
- Files are **immutable** once written (append-only model)

---

## 3. Cryptographic Implementation

### 3.1 Attribute-Based Encryption (ABE)

#### 3.1.1 CP-ABE (Ciphertext-Policy ABE)

**Concept:**
- **Data owner** defines encryption policy during encryption
- **Users** receive keys based on their attributes
- **Decryption** succeeds if user attributes satisfy policy

**Example Workflow:**
```
1. Doctor encrypts patient record:
   Policy: "(doctor AND cardiology) OR (nurse AND emergency)"
   
2. Users receive keys with attributes:
   - User A: ["doctor", "cardiology"]  → ✅ Can decrypt
   - User B: ["nurse", "emergency"]    → ✅ Can decrypt
   - User C: ["doctor", "neurology"]   → ❌ Cannot decrypt
```

**Implementation in MACHS:**
```python
# Encryption
POST /encrypt
{
  "data": "Patient has arrhythmia",
  "policy": "(doctor AND cardiology) OR (nurse AND emergency)",
  "scheme": "CP-ABE"
}

# Key Generation
POST /keygen
{
  "attributes": ["doctor", "cardiology"],
  "scheme": "CP-ABE"
}

# Decryption
POST /decrypt_with_key
{
  "ciphertext": "<encrypted_data>",
  "user_key": "<generated_key>",
  "scheme": "CP-ABE"
}
```

#### 3.1.2 Policy Language

**Supported Operators:**
- `AND` - Conjunction (all attributes required)
- `OR` - Disjunction (any attribute sufficient)
- Parentheses for grouping

**Policy Examples:**
```
Simple:       "doctor"
Conjunction:  "doctor AND hospital"
Disjunction:  "doctor OR nurse"
Complex:      "(doctor AND cardiology) OR (nurse AND emergency)"
Numeric:      "1"  or  "(1 and 2)"  (FABEO test format)
```

**Attribute Format:**
- Alphanumeric strings
- Case-sensitive
- No spaces within attribute names
- Numeric attributes supported (1, 2, 3, etc.)

### 3.2 Cryptographic Primitives

#### 3.2.1 Pairing-Based Cryptography

**Pairing Group:** SS512 (512-bit symmetric security)

**Groups:**
- **G1:** First source group (elliptic curve points)
- **G2:** Second source group (twisted curve points)
- **GT:** Target group (from pairing operation)
- **ZR:** Scalar field (integers mod r)

**Pairing Operation:**
```
e: G1 × G2 → GT
```

**Properties:**
- **Bilinearity:** e(g^a, h^b) = e(g, h)^(ab)
- **Non-degeneracy:** e(g, h) ≠ 1
- **Computability:** e can be efficiently computed

#### 3.2.2 Hybrid Encryption Scheme

MACHS uses a **KEM/DEM approach** (Key Encapsulation Mechanism / Data Encapsulation Mechanism):

**Encryption Process:**
```python
1. Generate random GT element: R ← GT.random()
2. Derive symmetric key: K ← SHA-256(R)
3. Encrypt message with symmetric cipher: C_sym ← AES(K, message)
4. Encrypt R with ABE: C_abe ← ABE.Encrypt(pk, R, policy)
5. Return: (C_abe, C_sym)
```

**Decryption Process:**
```python
1. Decrypt ABE ciphertext: R ← ABE.Decrypt(pk, C_abe, sk)
2. Derive symmetric key: K ← SHA-256(R)
3. Decrypt symmetric ciphertext: message ← AES.Decrypt(K, C_sym)
4. Return: message
```

**Rationale:**
- ABE operates on **group elements**, not arbitrary strings
- Symmetric encryption is **faster** for large data
- Hybrid approach provides **efficiency** and **flexibility**

### 3.3 Key Management

#### 3.3.1 Master Keys

**Public Key (pk):** Used for encryption and key generation validation  
**Master Secret Key (msk):** Used for user key generation (kept private)

**Generation:**
```python
pk, msk = FABEO22CPABE.setup()
```

**Storage:**
- Master keys are stored **in-memory** in FABEO service
- **Not persisted** to disk (regenerated on restart)
- In production, would use **HSM** or **secure key storage**

#### 3.3.2 User Keys

**Structure:**
- Tied to specific **attribute set**
- Cannot be used for other attribute combinations
- Generated by **authority** (FABEO service)

**Lifecycle:**
1. Authority generates key for user attributes
2. Key is **serialized** and sent to user/client
3. User stores key securely
4. User presents key for decryption operations

**Security:**
- Keys should be **encrypted in transit** (HTTPS)
- Keys should be **encrypted at rest** (client-side storage)
- Keys should have **expiration** (not currently implemented)

### 3.4 Serialization

**Challenge:** Charm cryptographic elements are Python objects, not JSON-serializable

**Solution:** Custom serialization using Charm's built-in methods

**Process:**
```python
# Serialization
element_bytes = group.serialize(element)
element_str = base64.b64encode(element_bytes).decode('ascii')
json_data = json.dumps({"type": "element", "data": element_str})

# Deserialization  
json_data = json.loads(json_str)
element_bytes = base64.b64decode(json_data["data"])
element = group.deserialize(element_bytes)
```

**Handles:**
- Single Charm elements
- Dictionaries of elements
- Nested structures (ciphertext, keys)
- Policy objects (converted to strings)

---

## 4. Data Flow and Operations

### 4.1 Encryption Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /encrypt
       │ {data, policy, scheme}
       ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  ┌───────────────────┐  │
│  │ Validate request  │  │
│  └─────────┬─────────┘  │
│            │             │
│  ┌─────────▼─────────┐  │
│  │ Route to FABEO    │  │
│  │ service           │  │
│  └─────────┬─────────┘  │
└────────────┼─────────────┘
             │ HTTP POST /encrypt
             │ {message, policy}
             ▼
┌───────────────────────────────┐
│  FABEO Service                │
│  ┌─────────────────────────┐  │
│  │ Generate random GT      │  │
│  │ element R               │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Derive symmetric key K  │  │
│  │ K ← SHA256(R)           │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Encrypt message with K  │  │
│  │ C_sym ← AES(K, msg)     │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ ABE encrypt R           │  │
│  │ C_abe ← Enc(pk,R,pol)   │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Serialize ciphertext    │  │
│  │ to base64/JSON          │  │
│  └─────────┬───────────────┘  │
└────────────┼───────────────────┘
             │ Return {ciphertext, policy}
             ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  Return to client       │
└─────────────────────────┘
```

### 4.2 Decryption Flow (with Pre-generated Key)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /decrypt_with_key
       │ {ciphertext, user_key}
       ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  ┌───────────────────┐  │
│  │ Validate request  │  │
│  └─────────┬─────────┘  │
│            │             │
│  ┌─────────▼─────────┐  │
│  │ Route to FABEO    │  │
│  └─────────┬─────────┘  │
└────────────┼─────────────┘
             │ HTTP POST /decrypt_with_key
             │ {ciphertext, user_key}
             ▼
┌───────────────────────────────┐
│  FABEO Service                │
│  ┌─────────────────────────┐  │
│  │ Deserialize ciphertext  │  │
│  │ and user key            │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Reconstruct policy      │  │
│  │ object from string      │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ ABE decrypt to get R    │  │
│  │ R ← Dec(pk, C_abe, sk)  │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Check if R ≠ None       │  │
│  │ (policy satisfied?)     │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Derive symmetric key K  │  │
│  │ K ← SHA256(R)           │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Decrypt message         │  │
│  │ msg ← AES.Dec(K,C_sym)  │  │
│  └─────────┬───────────────┘  │
└────────────┼───────────────────┘
             │ Return {plaintext}
             ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  Return to client       │
└─────────────────────────┘
```

### 4.3 Key Generation Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /keygen
       │ {attributes, scheme}
       ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  ┌───────────────────┐  │
│  │ Validate request  │  │
│  └─────────┬─────────┘  │
│            │             │
│  ┌─────────▼─────────┐  │
│  │ Route to FABEO    │  │
│  └─────────┬─────────┘  │
└────────────┼─────────────┘
             │ HTTP POST /keygen
             │ {attributes}
             ▼
┌───────────────────────────────┐
│  FABEO Service                │
│  ┌─────────────────────────┐  │
│  │ Generate user key       │  │
│  │ sk ← keygen(pk, msk,    │  │
│  │              attributes) │  │
│  └─────────┬───────────────┘  │
│            │                   │
│  ┌─────────▼───────────────┐  │
│  │ Serialize key to        │  │
│  │ base64/JSON             │  │
│  └─────────┬───────────────┘  │
└────────────┼───────────────────┘
             │ Return {key, attributes}
             ▼
┌─────────────────────────┐
│  Crypto API Gateway     │
│  Return to client       │
└─────────────────────────┘
```

### 4.4 Complete End-to-End Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                   Healthcare Data Encryption Workflow            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. System Initialization                                       │
│     ┌──────────────────────────────────────────────────┐        │
│     │ FABEO Service starts                             │        │
│     │ → Initialize FABEO22CPABE scheme                 │        │
│     │ → Generate master keys (pk, msk)                 │        │
│     │ → Ready for operations                           │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  2. User Key Generation (One-time per user/role)               │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Administrator requests keys for users:           │        │
│     │ → Doctor: ["doctor", "cardiology"]               │        │
│     │ → Nurse: ["nurse", "emergency"]                  │        │
│     │ → Technician: ["technician", "lab"]              │        │
│     │ Keys are distributed to users securely           │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  3. Data Encryption (When storing patient record)              │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Doctor encrypts patient diagnosis:               │        │
│     │ Data: "Patient has atrial fibrillation"          │        │
│     │ Policy: "(doctor AND cardiology) OR              │        │
│     │          (nurse AND emergency)"                  │        │
│     │ → Encrypted ciphertext stored in storage/        │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  4. Data Decryption (When accessing patient record)            │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Nurse attempts to decrypt:                       │        │
│     │ → Presents user key (nurse + emergency)          │        │
│     │ → Policy satisfied ✅                             │        │
│     │ → Decryption succeeds                            │        │
│     │ → Plaintext returned                             │        │
│     └──────────────────────────────────────────────────┘        │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Technician attempts to decrypt:                  │        │
│     │ → Presents user key (technician + lab)           │        │
│     │ → Policy NOT satisfied ❌                         │        │
│     │ → Decryption fails (returns None)                │        │
│     │ → Access denied                                  │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Storage Structure

### 5.1 Directory Organization

```
storage/
├── patients/              # Patient demographic and general records
│   ├── PAT-MGIJ2M49-GSD78W/
│   │   └── data.encrypted
│   ├── PAT-MGIJ2MDI-C1TQDM/
│   │   └── data.encrypted
│   └── ...
├── encounters/            # Patient visit/encounter records
│   ├── encounter_<uuid>.encrypted
│   └── ...
└── conditions/            # Medical condition records
    ├── condition_<uuid>.encrypted
    └── ...
```

### 5.2 File Naming Conventions

**Patient Files:**
- Format: `PAT-<random>-<random>/data.encrypted`
- Random identifiers prevent enumeration attacks
- Single file per patient directory

**Encounter Files:**
- Format: `encounter_<uuid>.encrypted`
- UUID v4 for global uniqueness
- Direct file without subdirectory

**Condition Files:**
- Format: `condition_<uuid>.encrypted`
- UUID v4 for global uniqueness
- Direct file without subdirectory

### 5.3 File Contents

**Encrypted Data Structure:**
```json
{
  "ciphertext": "<base64-encoded ABE ciphertext>",
  "policy": "encryption policy string",
  "scheme": "CP-ABE",
  "timestamp": "ISO 8601 timestamp",
  "metadata": {
    "encrypted_by": "service_id",
    "version": "1.0"
  }
}
```

**Actual Storage:** Base64-encoded serialized Charm objects

### 5.4 Storage Patterns

**Write Pattern:**
1. Encrypt data using ABE
2. Serialize ciphertext to JSON/base64
3. Write atomically to file
4. Files are **immutable** (no updates, only create/delete)

**Read Pattern:**
1. Read file contents
2. Deserialize base64/JSON to Charm objects
3. Attempt decryption with user key
4. Return plaintext or error

**Consistency:**
- **No database** - files are source of truth
- **No transactions** - each file operation is atomic
- **No locks** - read-heavy workload assumed
- In production, would use **object storage** (S3, Azure Blob)

---

## 6. API Specifications

### 6.1 Crypto API Gateway Endpoints

**Base URL:** `http://localhost:8001`

#### 6.1.1 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "crypto-api": "healthy",
    "fabeo-service": "healthy"
  }
}
```

#### 6.1.2 Encrypt Data

```http
POST /encrypt
Content-Type: application/json
```

**Request:**
```json
{
  "data": "string",           // Data to encrypt
  "policy": "string",         // Access policy (required for ABE)
  "scheme": "CP-ABE",         // Encryption scheme
  "key": "string"             // Optional: for standard crypto
}
```

**Response:**
```json
{
  "success": true,
  "ciphertext": "base64_string",
  "scheme": "CP-ABE",
  "policy": "access_policy"
}
```

**Supported Schemes:**
- `CP-ABE` - Ciphertext-Policy ABE (default)
- `AES` - AES-256-GCM symmetric encryption
- `RSA` - RSA-2048 asymmetric encryption

#### 6.1.3 Decrypt Data

```http
POST /decrypt
Content-Type: application/json
```

**Request:**
```json
{
  "ciphertext": "base64_string",
  "scheme": "CP-ABE",
  "attributes": ["attr1", "attr2"],  // For legacy attribute-based decryption
  "key": "string"                    // For key-based decryption or standard crypto
}
```

**Response:**
```json
{
  "success": true,
  "plaintext": "decrypted_data",
  "scheme": "CP-ABE",
  "attributes": ["attr1", "attr2"]
}
```

#### 6.1.4 Decrypt with Key (Recommended)

```http
POST /decrypt_with_key
Content-Type: application/json
```

**Request:**
```json
{
  "ciphertext": "base64_string",
  "scheme": "CP-ABE",
  "user_key": "serialized_user_key"
}
```

**Response:**
```json
{
  "success": true,
  "plaintext": "decrypted_data",
  "scheme": "CP-ABE"
}
```

#### 6.1.5 Generate Key

```http
POST /keygen
Content-Type: application/json
```

**Request:**
```json
{
  "scheme": "CP-ABE",
  "attributes": ["doctor", "cardiology"],
  "key_size": 256                      // Optional: for standard crypto
}
```

**Response:**
```json
{
  "success": true,
  "key": "serialized_key",
  "scheme": "CP-ABE",
  "attributes": ["doctor", "cardiology"]
}
```

#### 6.1.6 Setup Master Keys

```http
POST /setup
```

**Response:**
```json
{
  "success": true,
  "message": "ABE master keys setup successfully",
  "public_key": "serialized_public_key"
}
```

#### 6.1.7 Service Information

```http
GET /info
```

**Response:**
```json
{
  "service": "MACHS Crypto API Gateway",
  "version": "2.0.0",
  "supported_schemes": ["CP-ABE", "AES", "RSA"],
  "fabeo_service": {
    "service": "FABEO Microservice",
    "version": "1.0.0",
    "schemes": ["FABEO22-CP-ABE", "FABEO22-KP-ABE"],
    "available": true
  }
}
```

### 6.2 FABEO Service Endpoints (Internal)

**Base URL:** `http://fabeo-service:8002` (internal Docker network)

#### 6.2.1 Health Check

```http
GET /health
```

#### 6.2.2 Encrypt

```http
POST /encrypt
Content-Type: application/json
```

**Request:**
```json
{
  "message": "plaintext_data",
  "policy": "access_policy_string"
}
```

#### 6.2.3 Decrypt (Legacy)

```http
POST /decrypt
Content-Type: application/json
```

**Request:**
```json
{
  "ciphertext": "serialized_ciphertext",
  "attributes": ["attr1", "attr2"]
}
```

#### 6.2.4 Decrypt with Key

```http
POST /decrypt_with_key
Content-Type: application/json
```

**Request:**
```json
{
  "ciphertext": "serialized_ciphertext",
  "user_key": "serialized_user_key"
}
```

#### 6.2.5 Key Generation

```http
POST /keygen
Content-Type: application/json
```

**Request:**
```json
{
  "attributes": ["attr1", "attr2"]
}
```

#### 6.2.6 Setup

```http
POST /setup
```

#### 6.2.7 Service Info

```http
GET /info
```

### 6.3 API Documentation

**Interactive Documentation:**
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
- OpenAPI JSON: http://localhost:8001/openapi.json

---

## 7. Docker Infrastructure

### 7.1 Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  machs-crypto-api (Container)                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Image: python:3.8-slim                        │  │  │
│  │  │  Port: 8001:8001                               │  │  │
│  │  │  Volumes: ../storage:/app/storage              │  │  │
│  │  │  Network: machs_default (bridge)               │  │  │
│  │  │  Env: FABEO_SERVICE_URL=http://fabeo:8002     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            │ HTTP (internal network)        │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  machs-fabeo-service (Container)                     │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Image: ubuntu:16.04                           │  │  │
│  │  │  Port: 8002:8002                               │  │  │
│  │  │  Network: machs_default (bridge)               │  │  │
│  │  │  Build context: Custom Dockerfile              │  │  │
│  │  │    - Install Python 2.7                        │  │  │
│  │  │    - Install Charm-crypto 0.43                 │  │  │
│  │  │    - Copy FABEO submodule                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Shared Volume: storage/                             │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Mounted to: crypto-api:/app/storage           │  │  │
│  │  │  Contains: encrypted patient/encounter/        │  │  │
│  │  │            condition files                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Docker Compose Configuration

**File:** `docker/docker-compose.yml`

**Services:**

1. **fabeo-service**
   - Build context: `..` (project root)
   - Dockerfile: `services/fabeo-service/Dockerfile`
   - Container name: `machs-fabeo-service`
   - Ports: `8002:8002`
   - Restart policy: `unless-stopped`
   - Health check: Python request to `/health`

2. **crypto-api**
   - Build context: `../services/crypto-api`
   - Dockerfile: `Dockerfile`
   - Container name: `machs-crypto-api`
   - Ports: `8001:8001`
   - Volumes: `../storage:/app/storage`
   - Depends on: `fabeo-service`
   - Restart policy: `unless-stopped`
   - Health check: Python request to `/health`

### 7.3 Dockerfile Analysis

#### 7.3.1 FABEO Service Dockerfile

```dockerfile
FROM ubuntu:16.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python2.7 \
    python-pip \
    libssl-dev \
    libgmp-dev \
    build-essential \
    git

# Install Charm-crypto 0.43
RUN pip install Charm-Crypto==0.43

# Copy FABEO submodule
COPY submodules/FABEO /app/FABEO

# Copy service code
COPY services/fabeo-service /app

# Install Python dependencies
RUN pip install -r /app/requirements.txt

# Expose port
EXPOSE 8002

# Run service
CMD ["python2.7", "/app/main.py"]
```

**Key Points:**
- Uses **Ubuntu 16.04** for OpenSSL 1.0 compatibility
- Installs **Python 2.7** (required by Charm 0.43)
- Compiles **Charm-crypto** from source
- Copies **FABEO submodule** into container
- Single-stage build (could be optimized)

#### 7.3.2 Crypto API Dockerfile

```dockerfile
FROM python:3.8-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Key Points:**
- Uses **Python 3.8** slim image for minimal size
- Installs modern Python packages
- Runs **Uvicorn** ASGI server
- No compilation required (pure Python)

### 7.4 Networking

**Network Type:** Bridge (default)  
**Network Name:** `machs_default`

**Internal DNS:**
- `fabeo-service` → resolves to FABEO container IP
- `crypto-api` → resolves to Crypto API container IP

**Port Mapping:**
- Host:8001 → crypto-api:8001
- Host:8002 → fabeo-service:8002

**Security:**
- FABEO service accessible from host (for testing)
- In production, would be **internal only**
- Crypto API is the **public-facing gateway**

### 7.5 Volume Mounts

**Storage Volume:**
- Host path: `../storage`
- Container path: `/app/storage` (crypto-api only)
- Type: Bind mount
- Purpose: Persist encrypted data across container restarts

**Benefits:**
- Data survives container recreation
- Can inspect encrypted files from host
- Easy backup/restore

### 7.6 Health Checks

**FABEO Service:**
```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8002/health')"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

**Crypto API:**
```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8001/health')"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Purpose:**
- Monitor container health
- Auto-restart on failure (with restart policy)
- Dependencies wait for healthy status

### 7.7 Management Scripts

**Windows:**
- `start-hospital-system.bat` - Start all services
- `stop-hospital-system.bat` - Stop all services

**Linux/Mac:**
- `docker-compose up -d` - Start services
- `docker-compose down` - Stop services
- `docker-compose logs -f` - View logs
- `docker-compose ps` - Check status

---

## 8. Security Model

### 8.1 Threat Model

**Assumptions:**
- **Honest-but-Curious Server:** Server follows protocol but may try to learn plaintext
- **Malicious Users:** Users may try to decrypt data without proper attributes
- **Network Attacks:** Adversary may intercept network traffic

**Out of Scope:**
- Side-channel attacks (timing, power analysis)
- Physical security of server
- Denial of service attacks
- Social engineering

### 8.2 Security Properties

#### 8.2.1 Data Confidentiality

**Goal:** Encrypted data remains confidential without proper attributes

**Mechanism:**
- ABE encryption with access policy
- Decryption only possible with matching attributes
- Hybrid encryption for efficiency

**Guarantees:**
- **Semantic security** under chosen-plaintext attack (CPA)
- **Adaptive security** (FABEO22 property)
- **Collusion resistance** (users cannot pool attributes)

#### 8.2.2 Access Control

**Goal:** Only authorized users can access specific data

**Mechanism:**
- Policy embedded in ciphertext (CP-ABE)
- User keys tied to attributes
- Cryptographic enforcement (not just access control lists)

**Advantages over ACLs:**
- Works even if server is compromised
- No need to trust storage provider
- Fine-grained control per data item

#### 8.2.3 Forward Secrecy

**Current Status:** ❌ Not implemented

**Would Require:**
- Key rotation mechanisms
- Re-encryption of old data
- Key revocation support

### 8.3 Attack Scenarios

#### 8.3.1 Unauthorized Decryption Attempt

**Attack:** User with attributes `["nurse", "lab"]` tries to decrypt data encrypted with policy `"doctor AND cardiology"`

**Result:**
- ABE decrypt returns `None`
- Symmetric decryption cannot proceed
- Access denied

**Security:** ✅ Cryptographically enforced

#### 8.3.2 Server Compromise

**Attack:** Adversary gains access to server storage

**Impact:**
- Can read encrypted files
- Cannot decrypt without user keys
- Cannot modify master keys (in-memory)

**Mitigation:**
- ABE ensures data confidentiality
- Master keys regenerated on restart
- User keys distributed out-of-band

**Security:** ✅ Data remains confidential

#### 8.3.3 Network Interception

**Attack:** Adversary intercepts API traffic

**Impact:**
- Can see encrypted ciphertext in transit
- Can see user keys if sent over network
- Cannot decrypt without keys

**Mitigation:**
- Should use HTTPS/TLS in production
- Keys should be encrypted in transit
- Consider client-side encryption

**Security:** ⚠️ Needs TLS for production

#### 8.3.4 Collusion Attack

**Attack:** Multiple users pool their attributes to decrypt data

**Example:**
- User A: `["doctor"]`
- User B: `["cardiology"]`
- Together try to decrypt: `"doctor AND cardiology"`

**Result:**
- ABE prevents attribute pooling
- Each key is cryptographically tied to specific attribute set
- Cannot combine keys

**Security:** ✅ Collusion-resistant (FABEO property)

### 8.4 Cryptographic Security

**FABEO22 Security Guarantees:**
- **Adaptive security** under q-type assumptions
- **Optimal ciphertext size** (independent of policy complexity)
- **Fast operations** (faster than prior schemes)
- **No restrictions** on policy expressiveness

**Pairing-Based Security:**
- Relies on **hardness of discrete log** in pairing groups
- **SS512 curve:** 512-bit symmetric security level
- Resistant to known attacks on pairing groups

### 8.5 Implementation Security

**Potential Issues:**
1. ❌ **No TLS/HTTPS:** Network traffic unencrypted
2. ❌ **Master keys in memory:** Lost on restart, no persistence
3. ❌ **No key rotation:** Keys valid indefinitely
4. ❌ **No audit logging:** No record of who decrypted what
5. ⚠️ **Serialization complexity:** Custom code for Charm objects

**Recommended for Production:**
1. ✅ Use TLS/HTTPS for all API communication
2. ✅ Store master keys in HSM or secure key vault
3. ✅ Implement key expiration and rotation
4. ✅ Add comprehensive audit logging
5. ✅ Regular security audits of custom code
6. ✅ Rate limiting and abuse prevention

---

## 9. Testing and Validation

### 9.1 Test Scripts

#### 9.1.1 Isolated FABEO Test

**File:** `test_fabeo_isolated.py`

**Purpose:** Verify FABEO-only system functionality

**Tests:**
1. Service health checks
2. Simple attribute encryption/decryption
3. Compound policy encryption/decryption
4. Error handling

**Usage:**
```bash
python test_fabeo_isolated.py
```

**Expected Output:**
```
✅ FABEO system is FULLY WORKING!
   🔐 Encryption: WORKING
   🔓 Decryption: WORKING
```

#### 9.1.2 Additional Test Files

- `test_fabeo_direct.py` - Direct FABEO library testing
- `test_fabeo_proper_workflow.py` - Full workflow testing
- `verify_fabeo_setup.py` - Verify environment setup

### 9.2 Manual Testing

**Health Check:**
```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
```

**Encryption Test:**
```bash
curl -X POST http://localhost:8001/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Patient has diabetes",
    "policy": "(doctor AND endocrinology) OR emergency",
    "scheme": "CP-ABE"
  }'
```

**Key Generation:**
```bash
curl -X POST http://localhost:8001/keygen \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": ["doctor", "endocrinology"],
    "scheme": "CP-ABE"
  }'
```

**Decryption:**
```bash
curl -X POST http://localhost:8001/decrypt_with_key \
  -H "Content-Type: application/json" \
  -d '{
    "ciphertext": "<encrypted_data>",
    "user_key": "<generated_key>",
    "scheme": "CP-ABE"
  }'
```

### 9.3 Integration Testing

**Full Workflow:**
1. Start Docker services
2. Generate user keys for different roles
3. Encrypt sample patient data
4. Store in appropriate directory
5. Attempt decryption with authorized key (should succeed)
6. Attempt decryption with unauthorized key (should fail)
7. Verify stored files

### 9.4 Performance Testing

**Metrics to Measure:**
- Encryption time vs. data size
- Decryption time vs. data size
- Key generation time vs. attribute count
- Policy complexity impact on performance
- API response time
- Throughput (operations per second)

**Benchmarking:**
FABEO paper reports significantly better performance than prior schemes. See `samples/measurements_cp.py` in FABEO submodule.

### 9.5 Validation Checklist

**Functional Tests:**
- [✅] Services start successfully
- [✅] Health checks return positive
- [✅] Simple encryption/decryption works
- [✅] Compound policies work
- [✅] Key generation works
- [✅] Unauthorized decryption fails
- [✅] Storage persistence works

**Security Tests:**
- [✅] Decryption without proper attributes fails
- [✅] Invalid ciphertext rejected
- [✅] Malformed requests rejected
- [⚠️] Network encryption (needs HTTPS)

**Operational Tests:**
- [✅] Container restart preserves storage
- [✅] Service recovery after failure
- [✅] Logs available for debugging
- [⚠️] Master key persistence (not implemented)

---

## 10. Technical Specifications

### 10.1 Software Dependencies

#### Crypto API Gateway
- Python: 3.8+
- FastAPI: ^0.68.0
- Uvicorn: ^0.15.0
- httpx: ^0.23.0
- Pydantic: ^1.8.0
- python-multipart: ^0.0.5

#### FABEO Service
- Python: 2.7.12
- Flask: ^1.1.4
- Charm-Crypto: 0.43
- Ubuntu: 16.04 LTS
- OpenSSL: 1.0.x
- GMP: 6.x

#### FABEO Library
- Pairing curve: SS512
- Security level: 512-bit symmetric
- Schemes: FABEO22, BSW07, CGW15, Waters11, etc.

### 10.2 Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB
- Docker: 20.10+

**Recommended:**
- CPU: 4+ cores (pairing operations are CPU-intensive)
- RAM: 8 GB
- Disk: 20 GB SSD
- Docker: Latest stable

### 10.3 Performance Characteristics

**Expected Performance (from FABEO paper):**
- **Encryption:** ~10-50ms (depending on policy complexity)
- **Decryption:** ~10-50ms (depending on attribute count)
- **Key Generation:** ~10-30ms per attribute
- **Setup:** ~100-200ms (one-time)

**Actual performance depends on:**
- Policy complexity (number of gates)
- Attribute count
- Data size (symmetric encryption part)
- CPU speed
- Network latency (between services)

### 10.4 Scalability Considerations

**Current Limitations:**
- **Single FABEO instance:** No load balancing
- **In-memory master keys:** Lost on restart
- **File-based storage:** Limited to single node
- **No caching:** Every operation hits crypto library

**Scaling Strategies:**
1. **Horizontal scaling:** Multiple crypto-api instances, single FABEO
2. **Caching:** Cache public keys and policies
3. **Object storage:** Replace file system with S3/Azure Blob
4. **Key management:** External HSM or key vault
5. **Load balancing:** Distribute encryption/decryption operations
6. **Read replicas:** For encrypted storage (if using database)

### 10.5 Configuration Parameters

**Environment Variables:**

Crypto API:
- `FABEO_SERVICE_URL`: URL of FABEO service (default: http://fabeo-service:8002)
- `STORAGE_PATH`: Path to storage directory (default: /app/storage)
- `LOG_LEVEL`: Logging level (default: INFO)

FABEO Service:
- `LOG_LEVEL`: Logging level (default: INFO)

### 10.6 Monitoring and Logging

**Log Locations:**
- Crypto API: `docker-compose logs crypto-api`
- FABEO Service: `docker-compose logs fabeo-service`

**Log Format:**
```
[timestamp] [level] [component] message
```

**Metrics to Monitor:**
- Request rate (requests/second)
- Error rate (errors/second)
- Response time (p50, p95, p99)
- Service health (uptime)
- Storage usage
- CPU/Memory utilization

### 10.7 Backup and Recovery

**Backup Strategy:**
1. **Storage directory:** Regular backups of `storage/`
2. **Master keys:** Should be backed up securely (not implemented)
3. **Configuration:** Version control for docker-compose.yml

**Recovery:**
1. Restore storage directory
2. Restart services
3. Master keys are regenerated (limitation of current design)
4. User keys remain valid

**Data Loss Scenarios:**
- **Storage loss:** All encrypted data lost (catastrophic)
- **Master key loss:** Cannot generate new user keys, existing keys still work
- **User key loss:** User cannot decrypt, but admin can regenerate

---

## Appendix A: Glossary

**ABE (Attribute-Based Encryption):** Encryption scheme where decryption is based on attributes rather than specific keys.

**CP-ABE (Ciphertext-Policy ABE):** ABE variant where the policy is embedded in the ciphertext.

**KP-ABE (Key-Policy ABE):** ABE variant where the policy is embedded in the key.

**Charm-crypto:** Python library for rapid prototyping of cryptographic schemes using pairings.

**FABEO:** Fast Attribute-Based Encryption with Optimal Security (CCS '22).

**Pairing:** Bilinear map e: G1 × G2 → GT used in pairing-based cryptography.

**GT Element:** Element from the target group of a pairing operation.

**Master Public Key (pk):** Public key used for encryption and verification.

**Master Secret Key (msk):** Secret key used to generate user keys.

**Policy:** Boolean formula defining access control (e.g., "doctor AND hospital").

**Attribute:** Property of a user (e.g., "doctor", "nurse", "emergency").

---

## Appendix B: References

1. **FABEO Paper:**  
   Doreen Riepel and Hoeteck Wee. "FABEO: Fast Attribute-based Encryption with Optimal Security." ACM CCS 2022.

2. **FABEO GitHub:**  
   https://github.com/abecryptools/FABEO

3. **Charm-crypto:**  
   https://github.com/JHUISI/charm

4. **FastAPI:**  
   https://fastapi.tiangolo.com/

5. **Docker:**  
   https://www.docker.com/

6. **Pairing-Based Cryptography:**  
   Dan Boneh and Matthew Franklin. "Identity-Based Encryption from the Weil Pairing." CRYPTO 2001.

---

## Appendix C: Troubleshooting

### Issue: Services won't start

**Check:**
```bash
docker-compose ps
docker-compose logs
```

**Common causes:**
- Port 8001 or 8002 already in use
- Docker daemon not running
- Insufficient memory

### Issue: Encryption works but decryption fails

**Check:**
- Attributes match policy
- Policy syntax is correct
- User key was generated with correct attributes

### Issue: FABEO service unhealthy

**Check:**
```bash
docker-compose logs fabeo-service
```

**Common causes:**
- Charm-crypto failed to initialize
- Import errors (missing FABEO submodule)
- Python 2.7 compatibility issues

### Issue: Cannot access API documentation

**Check:**
- Crypto API service is running: `curl http://localhost:8001/health`
- Browser can reach localhost:8001
- No firewall blocking port

---

## Document History

- **Version 1.0.0** - Initial documentation (October 30, 2025)
- **Version 2.0.0** - Updated for isolated FABEO branch (October 30, 2025)

---

**End of Documentation**
