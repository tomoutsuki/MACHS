# Patient EHR Encryption Test Scripts

## Overview

Two Python test scripts are provided to test encryption and decryption of Brazilian patient FHIR data with Portuguese characters.

## Test Files

### 1. `test_patient_encryption.py` - Basic Test

**Purpose**: Simple end-to-end test of patient data encryption/decryption

**Features**:
- ✅ Loads Brazilian patient FHIR data
- ✅ Sets up ABE system
- ✅ Encrypts patient data with access policy
- ✅ Decrypts with authorized attributes
- ✅ Verifies data integrity
- ✅ Tests access control (unauthorized access denial)
- ✅ Checks Portuguese character preservation

**Usage**:
```bash
python test_patient_encryption.py
```

**Expected Output**:
```
🎉 Brazilian Patient EHR Encryption Test PASSED
✅ All 6 tests completed successfully
✅ Portuguese characters preserved
```

---

### 2. `test_patient_encryption_advanced.py` - Advanced Test

**Purpose**: Complete encryption workflow with file storage

**Features**:
- ✅ All features from basic test
- ✅ Saves encrypted data to file system
- ✅ Loads encrypted data from file
- ✅ Creates encrypted patient envelope with metadata
- ✅ Performance metrics (encryption/decryption time)
- ✅ File size reporting
- ✅ Encrypted patient directory management

**Usage**:
```bash
python test_patient_encryption_advanced.py
```

**Output Directory**:
- Creates `encrypted_patients/` directory
- Saves encrypted data as `patient-a.encrypted.json`

**Encrypted File Format**:
```json
{
  "patient_id": "patient-a",
  "policy": "(1 and 2)",
  "encrypted_at": "2025-11-03T15:50:04.810662",
  "ciphertext": "eyJvcmlnaW5hbF9wb2xpY3...",
  "metadata": {
    "patient_name": "Ana Maria dos Santos",
    "resource_type": "Patient",
    "encrypted_by": "test_script",
    "encryption_algorithm": "FABEO22-CP-ABE"
  }
}
```

---

## Test Data

### `patient_a_brazil.json`

**Type**: FHIR Patient Resource (R4)

**Patient Information**:
- **Name**: Ana Maria dos Santos
- **ID**: patient-a
- **Birth Date**: 1990-03-15
- **Gender**: Female
- **Birth Place**: São Paulo, SP, Brasil
- **Identifiers**: CPF (91366589438), CNS (509737757368736)

**Portuguese Content**:
- São Paulo (city name with ã)
- dos Santos (Portuguese surname)
- Rua das Flores (street name)
- Brasil (country name)
- Various FHIR extensions for Brazilian healthcare

---

## Access Control Policy

Both tests use the same access policy:

**Policy**: `(1 and 2)`
- Requires **both** attributes `1` AND `2` for decryption
- Simulates: "Doctor AND Nurse" access requirement

**Authorized Access**:
```python
attributes = ['1', '2']  # Has both required attributes
```

**Unauthorized Access** (will fail):
```python
attributes = ['1']       # Missing attribute 2
attributes = ['999']     # Wrong attributes
```

---

## Performance Metrics

Based on test results with 4KB patient data:

| Operation | Time | Data Size |
|-----------|------|-----------|
| Encryption | ~0.1 seconds | Original: 3,935 bytes → Encrypted: 8,116 bytes |
| Decryption | ~0.09 seconds | Encrypted: 8,116 bytes → Decrypted: 3,935 bytes |
| File I/O | < 0.01 seconds | File: 8,428 bytes (with metadata envelope) |

**Compression Ratio**: 2.06x (encrypted data is larger due to ABE overhead)

---

## UTF-8 Support

### Portuguese Characters Tested

✅ **Successfully preserved**:
- `ã` - tilde a (São Paulo)
- `á` - acute a
- `ç` - cedilla c

### Test Verification

The scripts specifically check for:
```python
'São Paulo' in data  # Verifies ã character
```

Both encryption and decryption preserve these characters perfectly.

---

## Prerequisites

### Running Services

Make sure the FABEO services are running:

```bash
cd docker
docker-compose up -d
```

**Required Services**:
- FABEO Service: http://localhost:8002
- Crypto API: http://localhost:8001

**Health Check**:
```bash
curl http://localhost:8001/health
```

### Python Dependencies

```bash
pip install requests
```

---

## Test Output Examples

### Basic Test Output

```
======================================================================
🏥 MACHS FABEO - Brazilian Patient EHR Encryption Test
======================================================================
ℹ️  Test started at: 2025-11-03 15:48:57

📂 Step 1: Loading Patient Data
✅ Loaded patient data from patient_a_brazil.json
   Name: Ana Maria dos Santos
   Birth Place: São Paulo, SP, Brasil
✅ Portuguese characters found: ã

🔐 Step 3: Encrypting Patient Data
✅ Encryption successful
   Ciphertext size: 8116 bytes

🔓 Step 4: Decrypting Patient Data
✅ Decryption successful

✓ Step 5: Verifying Data Integrity
✅ Data integrity verified: Original and decrypted data match perfectly!
✅ Portuguese characters found: ã

🎉 Brazilian Patient EHR Encryption Test PASSED
```

### Advanced Test Output

```
🔐 Step 3: Encrypt Patient Data
✅ Encrypted patient patient-a
   Original size: 3935 bytes
   Encrypted size: 8116 bytes
   Encryption time: 0.097 seconds

💾 Step 4: Save Encrypted Data
✅ Saved encrypted patient to: encrypted_patients\patient-a.encrypted.json
   File size: 8428 bytes

📥 Step 5: Load Encrypted Data
✅ Loaded encrypted patient from: encrypted_patients\patient-a.encrypted.json
   Encrypted at: 2025-11-03T15:50:04.810662
   Policy: (1 and 2)

📁 Encrypted Patient Storage
ℹ️  Found 1 encrypted patient file(s):
   - patient-a.encrypted.json (8428 bytes)
```

---

## Troubleshooting

### Services Not Running

**Error**: `Connection refused` or `Failed to connect`

**Solution**:
```bash
cd docker
docker-compose up -d
docker-compose ps  # Check services are running
```

### Decryption Fails

**Error**: `Decryption failed: HTTP 400`

**Cause**: Attributes don't satisfy the policy

**Solution**: Check that attributes match the policy:
- Policy `(1 and 2)` requires attributes `['1', '2']`

### Portuguese Characters Corrupted

**Error**: Characters like `ã` appear as `?` or `�`

**Solution**: This should not happen after the UTF-8 fix. If it does:
1. Check that services are rebuilt with latest code
2. Verify `docker-compose build fabeo-service` was run
3. Check FABEO service logs: `docker logs machs-fabeo-service`

---

## Integration with MACHS

These test scripts can be adapted for:

1. **Patient Registration**: Encrypt patient data on registration
2. **Access Control**: Use real role-based attributes (doctor, nurse, admin)
3. **Data Retrieval**: Decrypt patient data based on user permissions
4. **Audit Trail**: Log encryption/decryption events with timestamps
5. **Batch Processing**: Encrypt multiple patients in bulk

---

## Future Enhancements

Potential improvements:

1. **Multiple Patients**: Test with batch of patients
2. **Different Policies**: Test various access control scenarios
3. **Performance Benchmarks**: Test with larger datasets
4. **Error Scenarios**: Test network failures, corrupted data
5. **Key Management**: Test key generation and distribution
6. **Attribute Mapping**: Map Portuguese role names to numeric attributes

---

## References

- Main documentation: `docs/UTF8_SUPPORT.md`
- FHIR Patient Resource: https://www.hl7.org/fhir/patient.html
- Brazilian FHIR IPS: https://ips.saude.gov.br/
- FABEO documentation: `submodules/FABEO/README.md`
- API documentation: http://localhost:8001/docs

---

## Quick Start

Run all tests in sequence:

```bash
# 1. Start services
cd docker
docker-compose up -d

# 2. Run basic test
cd ..
python test_patient_encryption.py

# 3. Run advanced test (creates encrypted_patients/ directory)
python test_patient_encryption_advanced.py

# 4. Check encrypted files
ls encrypted_patients/
```

Expected result: All tests pass with 100% success rate! ✅
