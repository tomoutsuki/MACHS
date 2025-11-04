#!/usr/bin/env python3
"""
Debug test for semantic attributes.
Tests to understand why semantic attributes fail in FABEO.
"""

import requests
import json

API_BASE = "http://localhost:8001"

def test_semantic_attributes_detailed():
    """Detailed test of semantic attributes."""
    
    print("=" * 70)
    print("SEMANTIC ATTRIBUTES DEBUG TEST")
    print("=" * 70)
    
    # Test 1: Simple single semantic attribute
    print("\n" + "=" * 70)
    print("Test 1: Single Semantic Attribute")
    print("=" * 70)
    
    print("\n🔑 Generating key with attribute: ['doctor']")
    key_response = requests.post(
        f"{API_BASE}/keygen",
        json={"scheme": "CP-ABE", "attributes": ["doctor"]},
        timeout=30
    )
    
    if key_response.status_code != 200:
        print(f"❌ Key generation failed: {key_response.text}")
        return
    
    doctor_key = key_response.json().get("key")
    print(f"✅ Key generated successfully")
    print(f"   Key length: {len(doctor_key)} bytes")
    
    # Encrypt with matching policy
    print("\n🔐 Encrypting with policy: 'doctor'")
    encrypt_response = requests.post(
        f"{API_BASE}/encrypt",
        json={
            "data": "Test message",
            "policy": "doctor",
            "scheme": "CP-ABE"
        },
        timeout=30
    )
    
    if encrypt_response.status_code != 200:
        print(f"❌ Encryption failed: {encrypt_response.text}")
        return
    
    ciphertext = encrypt_response.json().get("ciphertext")
    print(f"✅ Encryption successful")
    print(f"   Ciphertext length: {len(ciphertext)} bytes")
    
    # Try to decrypt
    print("\n🔓 Attempting decryption with doctor key...")
    decrypt_response = requests.post(
        f"{API_BASE}/decrypt_with_key",
        json={
            "ciphertext": ciphertext,
            "scheme": "CP-ABE",
            "user_key": doctor_key
        },
        timeout=30
    )
    
    if decrypt_response.status_code == 200:
        plaintext = decrypt_response.json().get("plaintext")
        print(f"✅ Decryption SUCCESSFUL!")
        print(f"   Plaintext: {plaintext}")
    else:
        error = decrypt_response.json()
        print(f"❌ Decryption FAILED")
        print(f"   Status: {decrypt_response.status_code}")
        print(f"   Error: {error}")
    
    # Test 2: Compound semantic policy
    print("\n" + "=" * 70)
    print("Test 2: Compound Semantic Policy")
    print("=" * 70)
    
    print("\n🔑 Generating key with attributes: ['doctor', 'emergency']")
    key2_response = requests.post(
        f"{API_BASE}/keygen",
        json={"scheme": "CP-ABE", "attributes": ["doctor", "emergency"]},
        timeout=30
    )
    
    if key2_response.status_code != 200:
        print(f"❌ Key generation failed: {key2_response.text}")
        return
    
    compound_key = key2_response.json().get("key")
    print(f"✅ Key generated successfully")
    
    # Encrypt with AND policy
    print("\n🔐 Encrypting with policy: '(doctor and emergency)'")
    encrypt2_response = requests.post(
        f"{API_BASE}/encrypt",
        json={
            "data": "Emergency test message",
            "policy": "(doctor and emergency)",
            "scheme": "CP-ABE"
        },
        timeout=30
    )
    
    if encrypt2_response.status_code != 200:
        print(f"❌ Encryption failed: {encrypt2_response.text}")
        return
    
    ciphertext2 = encrypt2_response.json().get("ciphertext")
    print(f"✅ Encryption successful")
    
    # Try to decrypt
    print("\n🔓 Attempting decryption with compound key...")
    decrypt2_response = requests.post(
        f"{API_BASE}/decrypt_with_key",
        json={
            "ciphertext": ciphertext2,
            "scheme": "CP-ABE",
            "user_key": compound_key
        },
        timeout=30
    )
    
    if decrypt2_response.status_code == 200:
        plaintext = decrypt2_response.json().get("plaintext")
        print(f"✅ Decryption SUCCESSFUL!")
        print(f"   Plaintext: {plaintext}")
    else:
        error = decrypt2_response.json()
        print(f"❌ Decryption FAILED")
        print(f"   Status: {decrypt2_response.status_code}")
        print(f"   Error: {error}")
    
    # Test 3: Use legacy decrypt endpoint with attributes directly
    print("\n" + "=" * 70)
    print("Test 3: Legacy Decrypt with Attributes (for comparison)")
    print("=" * 70)
    
    print("\n🔓 Attempting decryption with raw attributes...")
    decrypt3_response = requests.post(
        f"{API_BASE}/decrypt",
        json={
            "ciphertext": ciphertext,
            "scheme": "CP-ABE",
            "attributes": ["doctor"]
        },
        timeout=30
    )
    
    if decrypt3_response.status_code == 200:
        plaintext = decrypt3_response.json().get("plaintext")
        print(f"✅ Legacy decryption SUCCESSFUL!")
        print(f"   Plaintext: {plaintext}")
    else:
        error = decrypt3_response.json()
        print(f"❌ Legacy decryption FAILED")
        print(f"   Status: {decrypt3_response.status_code}")
        print(f"   Error: {error}")
    
    # Test 4: Numeric attributes for comparison
    print("\n" + "=" * 70)
    print("Test 4: Numeric Attributes (baseline)")
    print("=" * 70)
    
    print("\n🔑 Generating key with numeric attribute: ['1']")
    key4_response = requests.post(
        f"{API_BASE}/keygen",
        json={"scheme": "CP-ABE", "attributes": ["1"]},
        timeout=30
    )
    
    numeric_key = key4_response.json().get("key")
    print(f"✅ Numeric key generated")
    
    print("\n🔐 Encrypting with numeric policy: '1'")
    encrypt4_response = requests.post(
        f"{API_BASE}/encrypt",
        json={"data": "Numeric test", "policy": "1", "scheme": "CP-ABE"},
        timeout=30
    )
    
    ciphertext4 = encrypt4_response.json().get("ciphertext")
    print(f"✅ Numeric encryption successful")
    
    print("\n🔓 Decrypting with numeric key...")
    decrypt4_response = requests.post(
        f"{API_BASE}/decrypt_with_key",
        json={
            "ciphertext": ciphertext4,
            "scheme": "CP-ABE",
            "user_key": numeric_key
        },
        timeout=30
    )
    
    if decrypt4_response.status_code == 200:
        plaintext = decrypt4_response.json().get("plaintext")
        print(f"✅ Numeric decryption SUCCESSFUL!")
        print(f"   Plaintext: {plaintext}")
    else:
        print(f"❌ Numeric decryption FAILED (unexpected!)")
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print("✅ Semantic keys can be generated")
    print("✅ Semantic policies can be used for encryption")
    print("❓ Semantic decryption status: Check results above")
    print("\nPossible issues:")
    print("  1. Attribute hashing mismatch between keygen and policy")
    print("  2. Policy tree attribute indexing (e.g., 'doctor_0' vs 'doctor')")
    print("  3. Character encoding differences (UTF-8 vs ASCII)")
    print("  4. Case sensitivity in attribute matching")

if __name__ == "__main__":
    test_semantic_attributes_detailed()
