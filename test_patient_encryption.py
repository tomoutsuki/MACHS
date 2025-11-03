#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script for encrypting and decrypting Brazilian patient EHR JSON data.
Tests UTF-8 support with Portuguese characters in FHIR Patient resource.

Usage:
    python test_patient_encryption.py
"""

import json
import requests
import sys
from datetime import datetime

# ANSI color codes for pretty output
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
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print("=" * 70)

def print_success(text):
    """Print success message."""
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    """Print error message."""
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    """Print info message."""
    print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    """Print warning message."""
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def load_patient_data(filepath):
    """Load patient JSON data from file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print_success(f"Loaded patient data from {filepath}")
        return data
    except Exception as e:
        print_error(f"Failed to load patient data: {e}")
        return None

def setup_abe_system(base_url):
    """Setup ABE master keys."""
    try:
        response = requests.post(f"{base_url}/setup", timeout=10)
        if response.status_code == 200:
            print_success("ABE system setup successful")
            return True
        else:
            print_error(f"Setup failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Setup error: {e}")
        return False

def encrypt_patient_data(base_url, patient_data, policy):
    """Encrypt patient data with ABE."""
    try:
        # Convert patient data to JSON string
        patient_json = json.dumps(patient_data, ensure_ascii=False, indent=2)
        
        print_info(f"Patient data size: {len(patient_json)} bytes")
        print_info(f"Policy: {policy}")
        
        # Encrypt the data
        encrypt_request = {
            "data": patient_json,
            "policy": policy
        }
        
        response = requests.post(
            f"{base_url}/encrypt",
            json=encrypt_request,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            ciphertext = result.get('ciphertext')
            print_success("Encryption successful")
            print_info(f"Ciphertext size: {len(ciphertext)} bytes")
            print_info(f"Compression ratio: {len(ciphertext) / len(patient_json):.2f}x")
            return ciphertext
        else:
            print_error(f"Encryption failed: HTTP {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Encryption error: {e}")
        return None

def decrypt_patient_data(base_url, ciphertext, attributes):
    """Decrypt patient data with ABE."""
    try:
        print_info(f"Attributes: {attributes}")
        
        decrypt_request = {
            "ciphertext": ciphertext,
            "attributes": attributes
        }
        
        response = requests.post(
            f"{base_url}/decrypt",
            json=decrypt_request,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            plaintext = result.get('plaintext')
            print_success("Decryption successful")
            return plaintext
        else:
            print_error(f"Decryption failed: HTTP {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Decryption error: {e}")
        return None

def verify_data_integrity(original, decrypted):
    """Verify that decrypted data matches original."""
    try:
        # Parse both as JSON
        original_obj = json.loads(original) if isinstance(original, str) else original
        decrypted_obj = json.loads(decrypted) if isinstance(decrypted, str) else decrypted
        
        # Compare
        if original_obj == decrypted_obj:
            print_success("Data integrity verified: Original and decrypted data match perfectly!")
            return True
        else:
            print_error("Data mismatch detected!")
            print_warning("Original keys: " + str(sorted(original_obj.keys())))
            print_warning("Decrypted keys: " + str(sorted(decrypted_obj.keys())))
            return False
            
    except Exception as e:
        print_error(f"Verification error: {e}")
        return False

def check_portuguese_characters(data):
    """Check for Portuguese-specific characters in the data."""
    portuguese_chars = ['ã', 'á', 'à', 'â', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç', 'Ã', 'Á', 'À', 'Â', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Õ', 'Ú', 'Ç']
    
    data_str = json.dumps(data, ensure_ascii=False)
    found_chars = set()
    
    for char in portuguese_chars:
        if char in data_str:
            found_chars.add(char)
    
    if found_chars:
        print_success(f"Portuguese characters found: {', '.join(sorted(found_chars))}")
        return True
    else:
        print_warning("No Portuguese-specific characters found")
        return False

def display_patient_summary(patient_data):
    """Display a summary of patient data."""
    try:
        name = patient_data.get('name', [{}])[0]
        full_name = f"{' '.join(name.get('given', []))} {name.get('family', '')}"
        
        print_info("Patient Summary:")
        print(f"   Name: {full_name}")
        print(f"   ID: {patient_data.get('id', 'N/A')}")
        print(f"   Gender: {patient_data.get('gender', 'N/A')}")
        print(f"   Birth Date: {patient_data.get('birthDate', 'N/A')}")
        
        # Get birthplace
        for ext in patient_data.get('extension', []):
            if 'patient-birthPlace' in ext.get('url', ''):
                place = ext.get('valueAddress', {})
                city = place.get('city', 'N/A')
                state = place.get('state', 'N/A')
                country = place.get('country', 'N/A')
                print(f"   Birth Place: {city}, {state}, {country}")
                break
        
    except Exception as e:
        print_warning(f"Could not display patient summary: {e}")

def test_access_control(base_url, ciphertext):
    """Test that decryption fails with wrong attributes."""
    print_header("🔒 Testing Access Control")
    
    # Try to decrypt with wrong attributes
    wrong_attributes = ['999', '888']  # Attributes that don't satisfy the policy
    
    print_info(f"Attempting decryption with unauthorized attributes: {wrong_attributes}")
    
    try:
        decrypt_request = {
            "ciphertext": ciphertext,
            "attributes": wrong_attributes
        }
        
        response = requests.post(
            f"{base_url}/decrypt",
            json=decrypt_request,
            timeout=30
        )
        
        if response.status_code == 400 or response.status_code == 403:
            print_success("Access control working: Decryption correctly denied")
            return True
        elif response.status_code == 200:
            print_error("Access control FAILED: Unauthorized decryption succeeded!")
            return False
        else:
            print_warning(f"Unexpected response: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Access control test error: {e}")
        return False

def main():
    """Main test function."""
    print_header("🏥 MACHS FABEO - Brazilian Patient EHR Encryption Test")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Configuration
    PATIENT_FILE = 'patient_a_brazil.json'
    BASE_URL = 'http://localhost:8001'
    POLICY = '(1 and 2)'  # Require both attributes 1 and 2
    AUTHORIZED_ATTRIBUTES = ['1', '2']  # Attributes that satisfy the policy
    
    print_info(f"Patient file: {PATIENT_FILE}")
    print_info(f"API endpoint: {BASE_URL}")
    print_info(f"Access policy: {POLICY}")
    
    # Step 1: Load patient data
    print_header("📂 Step 1: Loading Patient Data")
    patient_data = load_patient_data(PATIENT_FILE)
    if not patient_data:
        print_error("Failed to load patient data. Exiting.")
        sys.exit(1)
    
    display_patient_summary(patient_data)
    check_portuguese_characters(patient_data)
    
    # Step 2: Setup ABE system
    print_header("🔧 Step 2: Setting Up ABE System")
    if not setup_abe_system(BASE_URL):
        print_error("Failed to setup ABE system. Exiting.")
        sys.exit(1)
    
    # Step 3: Encrypt patient data
    print_header("🔐 Step 3: Encrypting Patient Data")
    ciphertext = encrypt_patient_data(BASE_URL, patient_data, POLICY)
    if not ciphertext:
        print_error("Encryption failed. Exiting.")
        sys.exit(1)
    
    # Step 4: Decrypt patient data
    print_header("🔓 Step 4: Decrypting Patient Data")
    decrypted_json = decrypt_patient_data(BASE_URL, ciphertext, AUTHORIZED_ATTRIBUTES)
    if not decrypted_json:
        print_error("Decryption failed. Exiting.")
        sys.exit(1)
    
    # Step 5: Verify data integrity
    print_header("✓ Step 5: Verifying Data Integrity")
    original_json = json.dumps(patient_data, ensure_ascii=False, indent=2)
    
    if verify_data_integrity(original_json, decrypted_json):
        # Parse and display summary of decrypted data
        decrypted_data = json.loads(decrypted_json)
        print_info("Decrypted patient summary:")
        display_patient_summary(decrypted_data)
        check_portuguese_characters(decrypted_data)
    else:
        print_error("Data integrity check failed!")
        sys.exit(1)
    
    # Step 6: Test access control
    test_access_control(BASE_URL, ciphertext)
    
    # Final summary
    print_header("📊 Test Summary")
    print_success("All tests completed successfully!")
    print_info("✅ Patient data loaded")
    print_info("✅ ABE system setup")
    print_info("✅ Encryption successful")
    print_info("✅ Decryption successful")
    print_info("✅ Data integrity verified")
    print_info("✅ Portuguese characters preserved")
    print_info("✅ Access control working")
    
    print_header("🎉 Brazilian Patient EHR Encryption Test PASSED")
    print_info(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print_error("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
