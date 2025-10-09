# MACHS API Reference

## Cryptography Service API

### Base URL
```
http://localhost:8000
```

### Authentication
No authentication required for cryptography service (internal service).

### Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "cryptography",
  "charm_available": true,
  "fabeo_available": true,
  "available_schemes": ["fabeo22cp", "fabeo22kp", ...]
}
```

#### GET /schemes
Get list of available cryptographic schemes.

**Response:**
```json
{
  "available_schemes": [
    "fabeo22cp", "fabeo22kp", "fabeo22dfa",
    "ac17cp", "ac17kp", "waters11cp", "waters12dfa"
  ]
}
```

#### POST /encrypt
Encrypt data using specified ABE scheme.

**Request Body:**
```json
{
  "data": "string",           // Data to encrypt
  "policy": "string",         // Access policy (for CP-ABE)
  "attributes": ["string"],   // Attributes array (for KP-ABE)  
  "scheme": "string"          // Cryptographic scheme
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "ciphertext": "encrypted_data",
    "policy": "access_policy",
    "scheme": "scheme_used"
  },
  "error": null
}
```

#### POST /decrypt
Decrypt data using user attributes or private key.

**Request Body:**
```json
{
  "ciphertext": "string",     // Encrypted data
  "private_key": "string",    // Private key or attributes
  "scheme": "string"          // Cryptographic scheme
}
```

**Response:**
```json
{
  "success": true,
  "result": "decrypted_data",
  "error": null
}
```

#### POST /generate-keys
Generate keys for specified attributes.

**Request Body:**
```json
{
  "attributes": ["string"],   // User attributes
  "scheme": "string"          // Cryptographic scheme
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "public_key": "public_key_data",
    "private_key": "private_key_data",
    "master_key": "master_key_data"
  },
  "error": null
}
```

---

## EHR System API

### Base URL
```
http://localhost:3000
```

### Authentication
Bearer token required for all endpoints except authentication.

```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "string",
    "username": "string",
    "profile": {
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "department": "string"
    },
    "accessControl": {
      "clearanceLevel": "string",
      "attributes": ["string"]
    }
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/register
Register new user.

**Request Body:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "role": "doctor|nurse|admin|researcher|technician",
    "department": "emergency|cardiology|neurology|pediatrics|general|surgery|administration"
  }
}
```

### Patient Management

#### GET /api/patients
Get all patients with pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `department` (string): Filter by department
- `confidentiality` (string): Filter by confidentiality level

**Response:**
```json
{
  "patients": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

#### GET /api/patients/:patientId
Get specific patient by ID.

**Response:**
```json
{
  "patientId": "string",
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "dateOfBirth": "date",
    "gender": "male|female|other",
    "ssn": "string"
  },
  "contactInfo": { ... },
  "medicalInfo": { ... },
  "accessControl": {
    "department": "string",
    "confidentialityLevel": "public|restricted|confidential|top-secret"
  }
}
```

#### POST /api/patients
Create new patient.

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string", 
    "dateOfBirth": "YYYY-MM-DD",
    "gender": "male|female|other",
    "ssn": "string"
  },
  "contactInfo": {
    "email": "string",
    "phone": "string",
    "address": { ... }
  },
  "accessControl": {
    "department": "string",
    "confidentialityLevel": "string"
  }
}
```

### Medical Records

#### GET /api/records/patient/:patientId
Get all records for a patient.

**Query Parameters:**
- `page`, `limit`, `recordType`

#### GET /api/records/:recordId
Get specific medical record (with automatic decryption if authorized).

#### POST /api/records
Create new medical record.

**Request Body:**
```json
{
  "patientId": "string",
  "recordType": "diagnosis|prescription|lab-result|imaging|visit-note|surgery|discharge",
  "content": {
    "plaintext": {
      "title": "string",
      "description": "string",
      "diagnosis": "string",
      "treatment": "string"
    }
  },
  "metadata": {
    "department": "string",
    "doctor": {
      "name": "string",
      "id": "string"
    }
  },
  "accessControl": {
    "confidentialityLevel": "string",
    "encryptionScheme": "string"
  },
  "encrypt": true,
  "accessPolicy": "string"
}
```

#### POST /api/records/:recordId/encrypt
Encrypt existing record.

**Request Body:**
```json
{
  "accessPolicy": "string",
  "encryptionScheme": "string"
}
```

### Cryptography Integration

#### GET /api/crypto/health
Check cryptography service health.

#### GET /api/crypto/schemes
Get available encryption schemes.

#### POST /api/crypto/encrypt
Encrypt data directly.

#### POST /api/crypto/decrypt
Decrypt data directly.

#### POST /api/crypto/test-workflow
Test complete encryption/decryption workflow.

### Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message",
  "details": "Additional details",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error