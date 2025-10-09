# MACHS EHR System

A Node.js backend for Electronic Health Records (EHR) management with encrypted patient data storage using PostgreSQL and FABEO cryptography. Now includes **HL7 FHIR R4 compliance** for healthcare interoperability.

## Features

- **FHIR R4 Compliance**: Full support for HL7 FHIR standard (Patient, Condition, Encounter resources)
- **Patient Management**: Full CRUD operations for patient metadata and FHIR resources
- **PostgreSQL Integration**: Metadata storage with Sequelize ORM
- **Encrypted Data Storage**: Patient data encrypted using FABEO ABE schemes stored in filesystem
- **FABEO Integration**: Attribute-Based Encryption for fine-grained access control
- **RESTful API**: Clean and intuitive API endpoints + FHIR-compliant endpoints
- **Test Data Integration**: Seamless loading of FHIR test data from `/test_data/` folder
- **Audit Logging**: Complete access audit trail for all operations
- **Health Monitoring**: Built-in health check endpoint

## Architecture

- **Metadata Only Database**: PostgreSQL stores only metadata, no sensitive patient data
- **Encrypted File Storage**: Patient data encrypted and stored in `/storage/patients/` directory
- **FHIR Compliance**: Standardized healthcare data format following HL7 FHIR R4
- **Separation of Concerns**: Database for fast queries, encrypted files for sensitive data
- **ABE Access Control**: Policy-based encryption using FABEO library

## FHIR Integration

The system now supports HL7 FHIR R4 standard with the following resources:
- **Patient** - Demographics and patient information
- **Condition** - Medical conditions and diagnoses
- **Encounter** - Healthcare encounters and visits

### FHIR API Endpoints
- `GET /fhir/metadata` - CapabilityStatement
- `GET /fhir/Patient` - Search patients
- `GET /fhir/Patient/{id}` - Read specific patient
- `POST /fhir/Patient` - Create patient
- `PUT /fhir/Patient/{id}` - Update patient
- `DELETE /fhir/Patient/{id}` - Delete patient
- Similar endpoints for Condition and Encounter resources

See [FHIR_INTEGRATION.md](./FHIR_INTEGRATION.md) for detailed documentation.

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 16 or higher
- MACHS Cryptography Service running on port 8000

## Installation

1. Navigate to the EHR system directory:
```bash
cd ehr-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy and edit the .env file if needed
cp .env.example .env
```

4. **Check FHIR integration setup**:
```bash
npm run setup-fhir
```

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. **Load FHIR Test Data** (recommended for testing):
```bash
# Load test data from /test_data/ folder
npm run load-test-data

# Or manually using the CLI
node load-test-data.js load
```

7. **Test FHIR integration**:
```bash
npm run test-fhir
```

## Test Data Management

The system includes utilities for managing FHIR test data:

```bash
# Load all test data (patients, conditions, encounters)
npm run load-test-data

# Clear all data from the system
npm run clear-data

# Reload test data (clear + load)
npm run reload-test-data

# List available test data files
npm run list-test-data
```

## API Endpoints

### FHIR Endpoints (Recommended)
- `GET /fhir/metadata` - FHIR CapabilityStatement
- `GET /fhir/Patient` - Search patients (FHIR format)
- `GET /fhir/Patient/{id}` - Read specific patient
- `POST /fhir/Patient` - Create patient (FHIR format)
- `PUT /fhir/Patient/{id}` - Update patient
- `DELETE /fhir/Patient/{id}` - Delete patient
- `GET /fhir/Condition` - Search conditions
- `GET /fhir/Condition?patient={id}` - Get conditions for a patient
- `GET /fhir/Encounter` - Search encounters
- `GET /fhir/Encounter?patient={id}` - Get encounters for a patient

### Legacy Patient Management
- `GET /patients` - Get all patients (with pagination and search)
- `GET /patients/:id` - Get a specific patient
- `POST /patients` - Create a new patient
- `PUT /patients/:id` - Update a patient
- `DELETE /patients/:id` - Delete a patient

### Health Check
- `GET /health` - Service health status

### Secure Operations
- `POST /secure` - Encrypt sensitive patient data
- `GET /secure/:patientId` - Retrieve encrypted data for a patient

## Sample Usage

### Using FHIR API (Recommended)

#### Load Test Data
```bash
npm run load-test-data
```

#### Get All Patients
```bash
curl http://localhost:3001/fhir/Patient
```

#### Get Specific Patient
```bash
curl http://localhost:3001/fhir/Patient/patient-a
```

#### Get Conditions for a Patient
```bash
curl http://localhost:3001/fhir/Condition?patient=patient-a
```

#### Create a FHIR Patient
```bash
curl -X POST http://localhost:3001/fhir/Patient \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Patient",
    "id": "new-patient",
    "name": [
      {
        "use": "official",
        "family": "Doe",
        "given": ["John"]
      }
    ],
    "gender": "male",
    "birthDate": "1985-06-15"
  }'
```

### Using Legacy API

#### Create a Patient
```bash
curl -X POST http://localhost:3001/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-06-15",
    "gender": "male",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123"
  }'
```

### Encrypt Sensitive Data
```bash
curl -X POST http://localhost:3001/secure \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT-123456",
    "sensitiveData": {
      "bloodType": "O+",
      "socialSecurityNumber": "XXX-XX-1234"
    }
  }'
```

### Get All Patients
```bash
curl http://localhost:3001/patients
```

### Search Patients
```bash
curl "http://localhost:3001/patients?search=John&page=1&limit=10"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/machs_ehr | MongoDB connection string |
| `CRYPTO_SERVICE_URL` | http://localhost:5000 | Cryptography service URL |

## Patient Data Model

```javascript
{
  patientId: String,      // Auto-generated unique ID
  firstName: String,      // Required
  lastName: String,       // Required
  dateOfBirth: Date,      // Required
  gender: String,         // male, female, other
  email: String,          // Required, unique
  phone: String,          // Required
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  medicalHistory: [{
    condition: String,
    diagnosisDate: Date,
    status: String        // active, resolved, chronic
  }],
  allergies: [String],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  encryptedData: String,  // Encrypted sensitive data
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (when crypto service is down)

## Integration with Cryptography Service

The `/secure` endpoint communicates with the MACHS cryptography service to:
1. Encrypt sensitive patient data using ABE (Attribute-Based Encryption)
2. Store encrypted data in the patient record
3. Apply access control policies

Make sure the cryptography service is running before using secure endpoints.

## Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on file changes.

## Docker Support

The EHR system can be containerized using the provided Dockerfile in the docker/ directory.

## Security Considerations

- All sensitive data should be encrypted before storage
- Patient identifiers are auto-generated to avoid conflicts
- Input validation is implemented for all endpoints
- CORS and Helmet middleware provide basic security headers

## License

MIT License - see the main project LICENSE file.