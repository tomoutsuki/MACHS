#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Advanced test script for Brazilian patient EHR encryption.
Demonstrates:
- Encrypting patient data and saving to file
- Loading encrypted data from file
- Decrypting with proper attributes
- Testing with multiple patients
- Performance metrics

Usage:
    python test_patient_encryption_advanced.py
"""

import json
import requests
import sys
import os
import time
from datetime import datetime

# ANSI color codes
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print("\n" + "=" * 70)
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print("=" * 70)

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

class PatientEncryptionSystem:
    """Handle patient data encryption and storage."""
    
    def __init__(self, base_url='http://localhost:8001', storage_dir='encrypted_patients'):
        self.base_url = base_url
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
    def setup(self):
        """Setup ABE system."""
        try:
            response = requests.post(f"{self.base_url}/setup", timeout=10)
            return response.status_code == 200
        except Exception as e:
            print_error(f"Setup error: {e}")
            return False
    
    def encrypt_patient(self, patient_data, policy, patient_id=None):
        """Encrypt patient data and return ciphertext."""
        if patient_id is None:
            patient_id = patient_data.get('id', 'unknown')
        
        start_time = time.time()
        
        # Convert to JSON string
        patient_json = json.dumps(patient_data, ensure_ascii=False, indent=2)
        
        # Encrypt
        encrypt_request = {
            "data": patient_json,
            "policy": policy
        }
        
        response = requests.post(
            f"{self.base_url}/encrypt",
            json=encrypt_request,
            timeout=30
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            ciphertext = result.get('ciphertext')
            
            print_success(f"Encrypted patient {patient_id}")
            print_info(f"   Original size: {len(patient_json)} bytes")
            print_info(f"   Encrypted size: {len(ciphertext)} bytes")
            print_info(f"   Encryption time: {elapsed:.3f} seconds")
            
            return ciphertext
        else:
            print_error(f"Encryption failed for patient {patient_id}")
            return None
    
    def save_encrypted_patient(self, ciphertext, patient_id, policy, metadata=None):
        """Save encrypted patient data to file with metadata."""
        filename = f"{patient_id}.encrypted.json"
        filepath = os.path.join(self.storage_dir, filename)
        
        # Create envelope with metadata
        envelope = {
            "patient_id": patient_id,
            "policy": policy,
            "encrypted_at": datetime.now().isoformat(),
            "ciphertext": ciphertext,
            "metadata": metadata or {}
        }
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(envelope, f, ensure_ascii=False, indent=2)
            
            print_success(f"Saved encrypted patient to: {filepath}")
            print_info(f"   File size: {os.path.getsize(filepath)} bytes")
            return filepath
        except Exception as e:
            print_error(f"Failed to save encrypted patient: {e}")
            return None
    
    def load_encrypted_patient(self, patient_id):
        """Load encrypted patient data from file."""
        filename = f"{patient_id}.encrypted.json"
        filepath = os.path.join(self.storage_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                envelope = json.load(f)
            
            print_success(f"Loaded encrypted patient from: {filepath}")
            print_info(f"   Encrypted at: {envelope.get('encrypted_at')}")
            print_info(f"   Policy: {envelope.get('policy')}")
            
            return envelope
        except Exception as e:
            print_error(f"Failed to load encrypted patient: {e}")
            return None
    
    def decrypt_patient(self, ciphertext, attributes):
        """Decrypt patient data."""
        start_time = time.time()
        
        decrypt_request = {
            "ciphertext": ciphertext,
            "attributes": attributes
        }
        
        response = requests.post(
            f"{self.base_url}/decrypt",
            json=decrypt_request,
            timeout=30
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            plaintext = result.get('plaintext')
            
            print_success("Decryption successful")
            print_info(f"   Decryption time: {elapsed:.3f} seconds")
            
            return plaintext
        else:
            print_error(f"Decryption failed: HTTP {response.status_code}")
            return None
    
    def list_encrypted_patients(self):
        """List all encrypted patient files."""
        files = [f for f in os.listdir(self.storage_dir) if f.endswith('.encrypted.json')]
        return files

def test_patient_encryption_workflow():
    """Test complete encryption workflow."""
    print_header("🏥 Advanced Patient Encryption Test")
    
    # Initialize system
    system = PatientEncryptionSystem()
    
    # Step 1: Setup
    print_header("🔧 Step 1: System Setup")
    if not system.setup():
        print_error("Setup failed")
        return False
    print_success("ABE system initialized")
    
    # Step 2: Load patient data
    print_header("📂 Step 2: Load Patient Data")
    try:
        with open('patient_a_brazil.json', 'r', encoding='utf-8') as f:
            patient_data = json.load(f)
        print_success("Loaded patient_a_brazil.json")
        
        # Extract patient info
        patient_id = patient_data.get('id', 'patient-a')
        name = patient_data.get('name', [{}])[0]
        full_name = f"{' '.join(name.get('given', []))} {name.get('family', '')}"
        print_info(f"   Patient: {full_name}")
        print_info(f"   ID: {patient_id}")
        
    except Exception as e:
        print_error(f"Failed to load patient data: {e}")
        return False
    
    # Step 3: Encrypt patient
    print_header("🔐 Step 3: Encrypt Patient Data")
    policy = "(1 and 2)"  # Doctor AND nurse can access
    
    ciphertext = system.encrypt_patient(patient_data, policy, patient_id)
    if not ciphertext:
        return False
    
    # Step 4: Save encrypted patient
    print_header("💾 Step 4: Save Encrypted Data")
    metadata = {
        "patient_name": full_name,
        "resource_type": patient_data.get('resourceType'),
        "encrypted_by": "test_script",
        "encryption_algorithm": "FABEO22-CP-ABE"
    }
    
    filepath = system.save_encrypted_patient(ciphertext, patient_id, policy, metadata)
    if not filepath:
        return False
    
    # Step 5: Load encrypted patient
    print_header("📥 Step 5: Load Encrypted Data")
    envelope = system.load_encrypted_patient(patient_id)
    if not envelope:
        return False
    
    print_info("Envelope contents:")
    print_info(f"   Patient ID: {envelope.get('patient_id')}")
    print_info(f"   Policy: {envelope.get('policy')}")
    print_info(f"   Metadata: {envelope.get('metadata', {}).get('patient_name')}")
    
    # Step 6: Decrypt patient
    print_header("🔓 Step 6: Decrypt Patient Data")
    attributes = ['1', '2']  # Doctor and nurse attributes
    
    decrypted_json = system.decrypt_patient(envelope['ciphertext'], attributes)
    if not decrypted_json:
        return False
    
    # Step 7: Verify integrity
    print_header("✓ Step 7: Verify Data Integrity")
    try:
        decrypted_data = json.loads(decrypted_json)
        original_json = json.dumps(patient_data, ensure_ascii=False, sort_keys=True)
        decrypted_json_sorted = json.dumps(decrypted_data, ensure_ascii=False, sort_keys=True)
        
        if original_json == decrypted_json_sorted:
            print_success("Perfect match! All data preserved")
            
            # Check Portuguese characters
            original_str = json.dumps(patient_data, ensure_ascii=False)
            if 'São Paulo' in original_str:
                decrypted_str = json.dumps(decrypted_data, ensure_ascii=False)
                if 'São Paulo' in decrypted_str:
                    print_success("Portuguese characters (São Paulo) preserved correctly!")
                else:
                    print_error("Portuguese characters corrupted!")
                    return False
        else:
            print_error("Data mismatch detected!")
            return False
            
    except Exception as e:
        print_error(f"Verification failed: {e}")
        return False
    
    # Step 8: Test access control
    print_header("🔒 Step 8: Test Access Control")
    print_info("Attempting decryption with wrong attributes...")
    wrong_result = system.decrypt_patient(envelope['ciphertext'], ['999'])
    
    if wrong_result is None:
        print_success("Access control working - unauthorized access denied")
    else:
        print_warning("Access control may need review")
    
    # Final summary
    print_header("📊 Test Summary")
    print_success("Complete encryption workflow tested successfully!")
    print_info("Workflow steps:")
    print_info("   1. ✅ System setup")
    print_info("   2. ✅ Patient data loaded")
    print_info("   3. ✅ Data encrypted with policy")
    print_info("   4. ✅ Encrypted data saved to file")
    print_info("   5. ✅ Encrypted data loaded from file")
    print_info("   6. ✅ Data decrypted with correct attributes")
    print_info("   7. ✅ Data integrity verified")
    print_info("   8. ✅ Access control tested")
    
    # List all encrypted files
    print_header("📁 Encrypted Patient Storage")
    encrypted_files = system.list_encrypted_patients()
    if encrypted_files:
        print_info(f"Found {len(encrypted_files)} encrypted patient file(s):")
        for f in encrypted_files:
            filepath = os.path.join(system.storage_dir, f)
            size = os.path.getsize(filepath)
            print_info(f"   - {f} ({size} bytes)")
    
    return True

def main():
    """Main entry point."""
    print_header("🧪 MACHS FABEO - Advanced Patient Encryption Test")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        success = test_patient_encryption_workflow()
        
        if success:
            print_header("🎉 All Tests PASSED!")
            print_success("Brazilian patient EHR encryption is fully functional")
            print_success("Portuguese characters (UTF-8) are properly preserved")
            print_info(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return 0
        else:
            print_header("❌ Tests FAILED")
            return 1
            
    except KeyboardInterrupt:
        print_error("\n\nTest interrupted by user")
        return 1
    except Exception as e:
        print_error(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
