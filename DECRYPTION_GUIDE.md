# MACHS Patient Data Decryption Guide

This guide shows different methods to decrypt patient data stored in the MACHS system.

## Current Patient Data
- **Patient ID**: `PAT-MGAYEA3A-B8GCMZ`
- **Encrypted File**: `/storage/patients/PAT-MGAYEA3A-B8GCMZ/data.encrypted`
- **Encryption Scheme**: CP-ABE (simulation mode)

## Method 1: Via EHR System API (Recommended)

### Decrypt Patient Data
```bash
curl "http://localhost:3000/patients/PAT-MGAYEA3A-B8GCMZ"
```

### Decrypt Medical Records
```bash
# List all medical records for patient
curl "http://localhost:3000/medical-records/PAT-MGAYEA3A-B8GCMZ"

# Decrypt specific medical record
curl "http://localhost:3000/medical-records/PAT-MGAYEA3A-B8GCMZ/{record-id}"
```

## Method 2: Direct Cryptography Service API

### Step 1: Get the encrypted ciphertext
```bash
# Read the encrypted file
docker exec machs-ehr-system cat /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/data.encrypted
```

### Step 2: Use cryptography service to decrypt
```bash
# PowerShell example
$encryptedData = "ENC_CP-ABE_eyJzY2hlbWUiOiAiQ1AtQUJFIiwgInBvbGljeSI6ICJwYXRpZW50OlBBVC1NR0FZRUEzQS1COEdDTVoiLCAiZGF0YSI6ICJ7XCJmaXJzdE5hbWVcIjpcIkpvaG5cIixcImxhc3ROYW1lXCI6XCJEb2VcIixcImRhdGVPZkJpcnRoXCI6XCIxOTkwLTAxLTAxXCIsXCJnZW5kZXJcIjpcIm1hbGVcIixcImVtYWlsXCI6XCJqb2huLmRvZUBleGFtcGxlLmNvbVwiLFwicGhvbmVcIjpcIisxMjM0NTY3ODkwXCIsXCJhZGRyZXNzXCI6e1wic3RyZWV0XCI6XCIxMjMgTWFpbiBTdFwiLFwiY2l0eVwiOlwiVGVzdCBDaXR5XCIsXCJzdGF0ZVwiOlwiVENcIixcInppcENvZGVcIjpcIjEyMzQ1XCIsXCJjb3VudHJ5XCI6XCJVU0FcIn0sXCJwYXRpZW50SWRcIjpcIlBBVC1NR0FZRUEzQS1COEdDTVpcIn0iLCAiZW5jcnlwdGVkIjogdHJ1ZSwgInRpbWVzdGFtcCI6ICI8YnVpbHQtaW4gbWV0aG9kIHRpbWVzIG9mIDxjbGFzcyAnbnQub\3 Dta Dta\3"

$body = @{
    ciphertext = $encryptedData
    private_key = "dummy_key"
    scheme = "CP-ABE"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:8000/decrypt" -ContentType "application/json" -Body $body
```

## Method 3: Container Direct Access

### Step 1: Access the container
```bash
docker exec -it machs-ehr-system /bin/sh
```

### Step 2: View encrypted files
```bash
# List patient directories
ls -la /app/storage/patients/

# View specific patient files
ls -la /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/

# Read encrypted content
cat /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/data.encrypted
```

## Method 4: Using Database Metadata

### Step 1: Connect to PostgreSQL
```bash
docker exec -it machs-postgres psql -U postgres -d machs_ehr
```

### Step 2: Query patient metadata
```sql
-- Get patient metadata
SELECT * FROM patients_metadata WHERE patient_id = 'PAT-MGAYEA3A-B8GCMZ';

-- Get medical records metadata
SELECT * FROM medical_records_metadata WHERE patient_id = 'PAT-MGAYEA3A-B8GCMZ';

-- View access logs
SELECT * FROM access_logs WHERE patient_id = 'PAT-MGAYEA3A-B8GCMZ' ORDER BY timestamp DESC;
```

## Method 5: Complete Decryption Script

Create a script to automate the decryption process:

```bash
#!/bin/bash
# decrypt_patient.sh

PATIENT_ID="PAT-MGAYEA3A-B8GCMZ"
EHR_URL="http://localhost:3000"
CRYPTO_URL="http://localhost:8000"

echo "Decrypting patient data for: $PATIENT_ID"

# Method 1: Via EHR API
echo "1. Via EHR API:"
curl -s "$EHR_URL/patients/$PATIENT_ID" | jq .

# Method 2: Via Crypto API
echo "2. Via Crypto API:"
ENCRYPTED_DATA=$(docker exec machs-ehr-system cat /app/storage/patients/$PATIENT_ID/data.encrypted)
echo "Encrypted data: $ENCRYPTED_DATA"

# Decrypt via crypto service
curl -s -X POST "$CRYPTO_URL/decrypt" \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\": \"$ENCRYPTED_DATA\", \"private_key\": \"dummy_key\", \"scheme\": \"CP-ABE\"}" | jq .
```

## Current Encryption Format

The system uses this format for encrypted data:
```
ENC_{SCHEME}_{BASE64_ENCODED_JSON}
```

Where:
- `SCHEME`: The encryption scheme (CP-ABE, KP-ABE, etc.)
- `BASE64_ENCODED_JSON`: Base64 encoded JSON containing:
  - `scheme`: Encryption scheme used
  - `policy`: Access policy for ABE
  - `data`: The actual patient data (JSON string)
  - `encrypted`: Boolean flag
  - `timestamp`: Encryption timestamp

## Example Decrypted Output

When successfully decrypted, you'll see:
```json
{
  "metadata": {
    "id": "6f99abc4-0847-445c-9cf6-c1956abcd841",
    "patientId": "PAT-MGAYEA3A-B8GCMZ",
    "created_at": "2025-10-03T14:42:42.945Z",
    "updated_at": "2025-10-03T14:42:42.945Z"
  },
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "Test City",
      "state": "TC",
      "zipCode": "12345",
      "country": "USA"
    },
    "patientId": "PAT-MGAYEA3A-B8GCMZ"
  }
}
```

## Troubleshooting

1. **"Internal server error"**: Check logs with `docker logs machs-ehr-system`
2. **"Decryption failed"**: Verify the ciphertext format and scheme
3. **"Patient not found"**: Confirm patient exists with `curl http://localhost:3000/patients`
4. **Connection refused**: Ensure services are running with `docker-compose ps`