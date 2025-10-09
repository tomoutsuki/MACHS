# FHIR Integration for MACHS EHR System

This document describes the FHIR (Fast Healthcare Interoperability Resources) integration added to the MACHS EHR System.

## Overview

The EHR system has been enhanced to support HL7 FHIR R4 standard, providing standardized APIs for healthcare data interoperability. The system now supports:

- **Patient resources** - Demographics and patient information
- **Condition resources** - Medical conditions and diagnoses  
- **Encounter resources** - Healthcare encounters and visits

## FHIR API Endpoints

### Base URL
```
http://localhost:3001/fhir
```

### CapabilityStatement
```
GET /fhir/metadata
```
Returns the FHIR CapabilityStatement describing supported resources and operations.

### Patient Resources

#### Search Patients
```
GET /fhir/Patient
GET /fhir/Patient?family=Smith
GET /fhir/Patient?given=John
GET /fhir/Patient?gender=male
GET /fhir/Patient?birthdate=1990-01-01
```

#### Read Patient
```
GET /fhir/Patient/{id}
```

#### Create Patient
```
POST /fhir/Patient
Content-Type: application/json

{
  "resourceType": "Patient",
  "id": "patient-example",
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "gender": "male",
  "birthDate": "1985-06-15"
}
```

#### Update Patient
```
PUT /fhir/Patient/{id}
Content-Type: application/json
```

#### Delete Patient
```
DELETE /fhir/Patient/{id}
```

### Condition Resources

#### Search Conditions
```
GET /fhir/Condition
GET /fhir/Condition?patient=patient-a
GET /fhir/Condition?code=38341003
```

#### Read Condition
```
GET /fhir/Condition/{id}
```

#### Create Condition
```
POST /fhir/Condition
Content-Type: application/json

{
  "resourceType": "Condition",
  "id": "condition-example",
  "clinicalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "code": "active"
    }]
  },
  "code": {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "38341003",
      "display": "Hypertensive disorder"
    }]
  },
  "subject": {
    "reference": "Patient/patient-a"
  }
}
```

### Encounter Resources

#### Search Encounters
```
GET /fhir/Encounter
GET /fhir/Encounter?patient=patient-a
GET /fhir/Encounter?status=completed
```

#### Read Encounter
```
GET /fhir/Encounter/{id}
```

#### Create Encounter
```
POST /fhir/Encounter
Content-Type: application/json

{
  "resourceType": "Encounter",
  "id": "encounter-example",
  "status": "completed",
  "class": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      "code": "AMB",
      "display": "ambulatory"
    }]
  }],
  "subject": {
    "reference": "Patient/patient-a"
  }
}
```

## Test Data Management

The system includes utilities for loading and managing FHIR test data from the `/test_data/` directory.

### Available Commands

#### Load Test Data
```bash
npm run load-test-data
```
Loads all test data from `/test_data/` folder (patients, conditions, encounters).

#### Clear All Data
```bash
npm run clear-data
```
Removes all data from the EHR system.

#### Reload Test Data
```bash
npm run reload-test-data
```
Clears existing data and loads fresh test data.

#### List Available Test Data
```bash
npm run list-test-data
```
Shows available test data files.

### Manual Command Line Usage
```bash
# Load test data
node load-test-data.js load

# Clear all data
node load-test-data.js clear

# List available files
node load-test-data.js list

# Reload (clear + load)
node load-test-data.js reload
```

## Data Storage and Encryption

All FHIR resources are:
1. **Validated** according to FHIR specification
2. **Encrypted** using Attribute-Based Encryption (ABE)
3. **Stored** as encrypted files in the filesystem
4. **Indexed** in PostgreSQL for metadata and search

### Database Tables

#### fhir_resources_metadata
Stores metadata for all FHIR resources including file paths, encryption details, and access tracking.

#### resource_references
Tracks relationships between FHIR resources (e.g., Condition → Patient references).

#### fhir_access_logs
Comprehensive audit logs for all FHIR resource access.

#### fhir_search_parameters
Extracted search parameters for efficient querying.

## FHIR Compliance

The implementation follows FHIR R4 specification:
- RESTful API design
- FHIR resource validation
- Standard HTTP status codes
- FHIR OperationOutcome for errors
- Bundle responses for search operations

### Supported FHIR Features
- ✅ Create, Read, Update, Delete (CRUD) operations
- ✅ Search with basic parameters
- ✅ Resource references and relationships
- ✅ FHIR Bundle responses
- ✅ OperationOutcome error handling
- ✅ CapabilityStatement

### Future Enhancements
- 🔄 Advanced search parameters
- 🔄 FHIR versioning
- 🔄 Subscription notifications
- 🔄 Bulk data operations
- 🔄 GraphQL API

## Example Usage

### 1. Start the Server
```bash
npm start
```

### 2. Load Test Data
```bash
npm run load-test-data
```

### 3. Query FHIR Resources
```bash
# Get all patients
curl http://localhost:3001/fhir/Patient

# Get specific patient
curl http://localhost:3001/fhir/Patient/patient-a

# Get conditions for a patient
curl http://localhost:3001/fhir/Condition?patient=patient-a

# Get encounters for a patient
curl http://localhost:3001/fhir/Encounter?patient=patient-a
```

### 4. Create New Resource
```bash
curl -X POST http://localhost:3001/fhir/Patient \
  -H "Content-Type: application/json" \
  -d '{
    "resourceType": "Patient",
    "id": "new-patient",
    "name": [{"family": "Test", "given": ["User"]}],
    "gender": "unknown"
  }'
```

## Security and Access Control

- All resources are encrypted using ABE
- Access logs track all operations
- Patient data is compartmentalized
- File integrity is verified using SHA-256 hashes

## Integration with Test Data

The system is designed to work seamlessly with the FHIR test data located in:
- `/test_data/patients/` - Patient resources
- `/test_data/condition/` - Condition resources  
- `/test_data/encounter/` - Encounter resources

All test data follows HL7 FHIR R4 specification and includes realistic healthcare scenarios for testing and development.