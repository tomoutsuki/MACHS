# MACHS Migration Guide: MongoDB to PostgreSQL with Encrypted Storage

This document describes the migration from MongoDB-based patient storage to PostgreSQL metadata storage with encrypted patient data files.

## Architecture Changes

### Before (MongoDB)
- All patient data stored in MongoDB collections
- Patient records contain sensitive information
- Basic encryption handled at application level
- Single database for all data

### After (PostgreSQL + Encrypted Storage)
- PostgreSQL stores only metadata (patient IDs, file paths, timestamps)
- Sensitive patient data encrypted using FABEO ABE schemes
- Encrypted data stored in filesystem (`/storage/patients/`)
- Separation of metadata and sensitive data
- Fine-grained access control using ABE policies

## Database Schema Changes

### Removed (MongoDB)
- `patients` collection with full patient data
- Mongoose schemas and models

### Added (PostgreSQL)
- `patients_metadata` table - Patient metadata only
- `medical_records_metadata` table - Medical record metadata
- `access_logs` table - Audit trail
- `encryption_keys_metadata` table - Key management

## API Changes

### Endpoints Updated
- `GET /patients` - Now returns metadata only
- `GET /patients/:id` - Returns metadata + decrypted patient data
- `POST /patients` - Encrypts data before storage
- `PUT /patients/:id` - Re-encrypts updated data
- `DELETE /patients/:id` - Soft delete (marks as inactive)

### New Endpoints
- `POST /secure` - Encrypt and store medical records
- `GET /medical-records/:patientId` - List patient's medical records
- `GET /medical-records/:patientId/:recordId` - Get specific record

### Cryptography Service Updates
- Enhanced encryption/decryption with FABEO integration
- Support for multiple ABE schemes (CP-ABE, KP-ABE, DFA)
- Simulation mode for development
- Storage management endpoints

## File Structure Changes

```
/storage/
  /patients/
    /{patient_id}/
      - data.encrypted (main patient data)
      - medical_record_{uuid}.encrypted (individual records)
      - documents/ (future: encrypted documents)
```

## Environment Variables

### Removed
- `MONGODB_URI`

### Added
- `DATABASE_URL` - PostgreSQL connection string
- `STORAGE_PATH` - Path to encrypted storage directory

### Updated
- `CRYPTO_SERVICE_URL` - Now points to port 8000

## Docker Changes

### Services
- Replaced `mongodb` service with `postgres` service
- Updated environment variables
- Added storage volume mounts
- Updated health checks

### Volumes
- Removed `mongodb_data`
- Added `postgres_data`
- Added shared storage volume

## Security Improvements

1. **Data Separation**: Sensitive data never stored in database
2. **Encryption at Rest**: All patient data encrypted using ABE
3. **Access Control**: Policy-based encryption for fine-grained access
4. **Audit Trail**: Complete logging of all data access
5. **Key Management**: Separate metadata for encryption keys

## Migration Steps

1. **Backup existing MongoDB data** (if migrating real data)
2. **Stop existing services**
3. **Update configuration files**
4. **Install new dependencies**
5. **Initialize PostgreSQL database**
6. **Start new services**
7. **Verify functionality**
8. **Migrate existing data** (custom script needed)

## Testing the New System

### 1. Health Check
```bash
curl http://localhost:3000/health
curl http://localhost:8000/health
```

### 2. Create Patient
```bash
curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "dateOfBirth": "1990-01-01",
    "email": "john.doe@example.com"
  }'
```

### 3. Encrypt Medical Record
```bash
curl -X POST http://localhost:3000/secure \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PAT-XXXXX",
    "sensitiveData": "Patient has diabetes",
    "recordType": "diagnosis"
  }'
```

## Troubleshooting

### Common Issues
1. **Storage Permission**: Ensure storage directory is writable
2. **PostgreSQL Connection**: Check DATABASE_URL format
3. **Cryptography Service**: Verify service is running on port 8000
4. **Missing Dependencies**: Run `npm install` in ehr-system directory

### Logs to Check
- EHR System: Console output for database connections
- Cryptography Service: Encryption/decryption operations
- PostgreSQL: Database query logs
- Docker: Container health status

## Performance Considerations

- **Metadata Queries**: Fast PostgreSQL queries for patient lookup
- **Encryption Overhead**: Slight delay for encrypt/decrypt operations
- **File I/O**: Encrypted files stored on disk for persistence
- **Caching**: Consider caching decrypted data for frequent access

## Next Steps

1. Implement actual FABEO integration (currently in simulation mode)
2. Add proper key management system
3. Implement user authentication and attribute management
4. Add medical record versioning
5. Optimize encryption/decryption performance
6. Add data backup and recovery procedures