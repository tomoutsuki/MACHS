# MACHS Decryption Commands - Quick Reference

## For the Current Example Patient

### Patient Information
- **Patient ID**: `PAT-MGAYEA3A-B8GCMZ` (Complete patient data)
- **Patient ID**: `PAT-MGAEFYAR-U82PVT` (Has medical records)

## 🔓 **WORKING DECRYPTION COMMANDS**

### 1. **Decrypt Complete Patient Data** (PAT-MGAYEA3A-B8GCMZ)

```powershell
# Get encrypted data
$encryptedData = docker exec machs-ehr-system cat /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/data.encrypted

# Decrypt using crypto service
$decryptBody = @{
    ciphertext = $encryptedData
    private_key = "dummy_key"
    scheme = "CP-ABE"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:8000/decrypt" -ContentType "application/json" -Body $decryptBody
```

**Result**: Complete patient information (name, address, phone, etc.)

### 2. **Decrypt Medical Record** (PAT-MGAEFYAR-U82PVT)

```powershell
# Get encrypted medical record
$medicalRecord = docker exec machs-ehr-system cat /app/storage/patients/PAT-MGAEFYAR-U82PVT/diagnosis_6fc7735a-5b6a-4e8c-a06d-268e52189597.encrypted

# Decrypt medical record
$decryptMedical = @{ 
    ciphertext = $medicalRecord
    private_key = "dummy_key"
    scheme = "CP-ABE" 
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:8000/decrypt" -ContentType "application/json" -Body $decryptMedical
```

**Result**: Medical diagnosis information

### 3. **List All Encrypted Files**

```powershell
# List all patients with encrypted data
docker exec machs-ehr-system ls -la /app/storage/patients/

# List files for specific patient
docker exec machs-ehr-system ls -la /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/
docker exec machs-ehr-system ls -la /app/storage/patients/PAT-MGAEFYAR-U82PVT/
```

### 4. **One-Line Decryption Commands**

```powershell
# Decrypt patient data in one command
$enc = docker exec machs-ehr-system cat /app/storage/patients/PAT-MGAYEA3A-B8GCMZ/data.encrypted; curl -Method POST -Uri "http://localhost:8000/decrypt" -ContentType "application/json" -Body (@{ciphertext=$enc;private_key="dummy_key";scheme="CP-ABE"}|ConvertTo-Json)

# Decrypt medical record in one command  
$med = docker exec machs-ehr-system cat /app/storage/patients/PAT-MGAEFYAR-U82PVT/diagnosis_6fc7735a-5b6a-4e8c-a06d-268e52189597.encrypted; curl -Method POST -Uri "http://localhost:8000/decrypt" -ContentType "application/json" -Body (@{ciphertext=$med;private_key="dummy_key";scheme="CP-ABE"}|ConvertTo-Json)
```

## 📋 **Alternative Methods**

### Via EHR API (Currently has issues - being fixed)
```powershell
# Should work once API issue is resolved
curl "http://localhost:3000/patients/PAT-MGAYEA3A-B8GCMZ"
curl "http://localhost:3000/medical-records/PAT-MGAEFYAR-U82PVT"
```

### Via Database Query
```bash
# Connect to database
docker exec -it machs-postgres psql -U postgres -d machs_ehr

# Query patient metadata
SELECT * FROM patients_metadata;
SELECT * FROM medical_records_metadata;
```

## 🔍 **Verify Decryption Worked**

The decryption is successful when you see:
```json
{
  "success": true,
  "result": "{\"firstName\":\"John\",\"lastName\":\"Doe\",...}",
  "metadata": {
    "scheme": "CP-ABE",
    "ciphertext_length": 719,
    "decrypted_length": 247
  }
}
```

## 🚀 **Bash Script Version** (for Linux/macOS)

```bash
#!/bin/bash

PATIENT_ID="PAT-MGAYEA3A-B8GCMZ"
CRYPTO_URL="http://localhost:8000"

# Get encrypted data
ENCRYPTED_DATA=$(docker exec machs-ehr-system cat /app/storage/patients/$PATIENT_ID/data.encrypted)

# Decrypt data
curl -X POST "$CRYPTO_URL/decrypt" \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\": \"$ENCRYPTED_DATA\", \"private_key\": \"dummy_key\", \"scheme\": \"CP-ABE\"}" | jq .
```

## ✅ **Tested and Working Examples**

1. ✅ Patient data decryption: `PAT-MGAYEA3A-B8GCMZ`
2. ✅ Medical record decryption: `PAT-MGAEFYAR-U82PVT`
3. ✅ File listing and verification
4. ✅ Cryptography service API
5. ✅ Encrypted storage verification