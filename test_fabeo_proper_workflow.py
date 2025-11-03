#!/usr/bin/env python3
"""
FABEO Proper Workflow Test
Demonstrates the correct way to use ABE encryption/decryption:
1. Generate keys for users based on their attributes
2. Encrypt data with access policies
3. Decrypt using pre-generated user keys (NOT raw attributes)
"""

import requests
import json
import time
import sys

API_BASE = "http://localhost:8001"

def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def generate_user_key(user_id, attributes):
    """
    Generate a decryption key for a user based on their attributes.
    This would be done during user registration/onboarding.
    """
    print(f"\n🔑 Generating key for {user_id} with attributes: {attributes}")
    
    response = requests.post(
        f"{API_BASE}/keygen",
        json={
            "scheme": "CP-ABE",
            "attributes": attributes
        },
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Key generated successfully for {user_id}")
        return result.get("key")
    else:
        print(f"❌ Key generation failed: {response.text}")
        return None

def encrypt_data(data, policy):
    """
    Encrypt data with an access policy.
    Only users whose attributes satisfy the policy can decrypt.
    """
    print(f"\n🔐 Encrypting data with policy: '{policy}'")
    print(f"   Data: {data[:50]}..." if len(data) > 50 else f"   Data: {data}")
    
    response = requests.post(
        f"{API_BASE}/encrypt",
        json={
            "data": data,
            "policy": policy,
            "scheme": "CP-ABE"
        },
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Encryption successful")
        return result.get("ciphertext")
    else:
        print(f"❌ Encryption failed: {response.text}")
        return None

def decrypt_with_key(ciphertext, user_id, user_key):
    """
    Decrypt ciphertext using a pre-generated user key.
    This is the CORRECT approach for production systems.
    """
    print(f"\n🔓 Attempting decryption for {user_id}...")
    
    response = requests.post(
        f"{API_BASE}/decrypt_with_key",
        json={
            "ciphertext": ciphertext,
            "scheme": "CP-ABE",
            "user_key": user_key
        },
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        plaintext = result.get("plaintext")
        print(f"✅ Decryption successful for {user_id}")
        print(f"   Decrypted: {plaintext}")
        return plaintext
    else:
        error = response.json().get("detail", "Unknown error")
        print(f"❌ Decryption failed for {user_id}: {error}")
        return None

def test_simple_policy():
    """Test with a simple single-attribute policy."""
    print_section("Test 1: Simple Policy")
    
    print("\n📋 Scenario: Medical record accessible by doctors only")
    print("   Policy: '1' (representing doctor role)")
    
    # Generate keys for different users
    doctor_key = generate_user_key("Dr. Smith", ["1"])  # Has doctor attribute
    nurse_key = generate_user_key("Nurse Jane", ["2"])  # Has nurse attribute
    
    if not doctor_key or not nurse_key:
        print("❌ Key generation failed")
        return False
    
    # Encrypt medical record
    medical_record = "Patient John Doe has Type 2 Diabetes. Prescribed Metformin."
    ciphertext = encrypt_data(medical_record, "1")
    
    if not ciphertext:
        print("❌ Encryption failed")
        return False
    
    # Try to decrypt with doctor key (should succeed)
    print("\n👨‍⚕️ Doctor attempting to access record...")
    doctor_plaintext = decrypt_with_key(ciphertext, "Dr. Smith", doctor_key)
    
    # Try to decrypt with nurse key (should fail)
    print("\n👩‍⚕️ Nurse attempting to access record...")
    nurse_plaintext = decrypt_with_key(ciphertext, "Nurse Jane", nurse_key)
    
    # Verify results
    success = (doctor_plaintext == medical_record) and (nurse_plaintext is None)
    
    print("\n" + "-" * 70)
    if success:
        print("✅ Test passed: Doctor can access, Nurse cannot")
    else:
        print("❌ Test failed: Unexpected access pattern")
    
    return success

def test_compound_policy():
    """Test with a compound policy (AND/OR logic)."""
    print_section("Test 2: Compound Policy")
    
    print("\n📋 Scenario: Sensitive record requires doctor AND cardiology department")
    print("   Policy: '(1 and 3)' (doctor AND cardiology)")
    
    # Generate keys for different users
    doctor_key = generate_user_key("Dr. Smith (General)", ["1"])  # Doctor only
    cardiologist_key = generate_user_key("Dr. Jones (Cardiology)", ["1", "3"])  # Doctor + Cardiology
    admin_key = generate_user_key("Admin", ["4"])  # Admin only
    
    if not doctor_key or not cardiologist_key or not admin_key:
        print("❌ Key generation failed")
        return False
    
    # Encrypt sensitive cardiac record
    cardiac_record = "Patient requires urgent bypass surgery. Schedule OR for tomorrow."
    ciphertext = encrypt_data(cardiac_record, "(1 and 3)")
    
    if not ciphertext:
        print("❌ Encryption failed")
        return False
    
    # Try decryption with different keys
    print("\n👨‍⚕️ General Doctor attempting access...")
    doctor_plaintext = decrypt_with_key(ciphertext, "Dr. Smith", doctor_key)
    
    print("\n👨‍⚕️ Cardiologist attempting access...")
    cardiologist_plaintext = decrypt_with_key(ciphertext, "Dr. Jones", cardiologist_key)
    
    print("\n👔 Admin attempting access...")
    admin_plaintext = decrypt_with_key(ciphertext, "Admin", admin_key)
    
    # Verify results
    success = (
        cardiologist_plaintext == cardiac_record and
        doctor_plaintext is None and
        admin_plaintext is None
    )
    
    print("\n" + "-" * 70)
    if success:
        print("✅ Test passed: Only cardiologist can access")
    else:
        print("❌ Test failed: Unexpected access pattern")
    
    return success

def test_or_policy():
    """Test with OR policy."""
    print_section("Test 3: OR Policy")
    
    print("\n📋 Scenario: Emergency contact accessible by doctor OR nurse")
    print("   Policy: '(1 or 2)' (doctor OR nurse)")
    
    # Generate keys
    doctor_key = generate_user_key("Dr. Smith", ["1"])
    nurse_key = generate_user_key("Nurse Jane", ["2"])
    admin_key = generate_user_key("Admin", ["4"])
    
    if not doctor_key or not nurse_key or not admin_key:
        print("❌ Key generation failed")
        return False
    
    # Encrypt emergency contact
    emergency_contact = "Emergency contact: Jane Doe, +1-555-0123"
    ciphertext = encrypt_data(emergency_contact, "(1 or 2)")
    
    if not ciphertext:
        print("❌ Encryption failed")
        return False
    
    # Try decryption with different keys
    print("\n👨‍⚕️ Doctor attempting access...")
    doctor_plaintext = decrypt_with_key(ciphertext, "Dr. Smith", doctor_key)
    
    print("\n👩‍⚕️ Nurse attempting access...")
    nurse_plaintext = decrypt_with_key(ciphertext, "Nurse Jane", nurse_key)
    
    print("\n👔 Admin attempting access...")
    admin_plaintext = decrypt_with_key(ciphertext, "Admin", admin_key)
    
    # Verify results
    success = (
        doctor_plaintext == emergency_contact and
        nurse_plaintext == emergency_contact and
        admin_plaintext is None
    )
    
    print("\n" + "-" * 70)
    if success:
        print("✅ Test passed: Both doctor and nurse can access, admin cannot")
    else:
        print("❌ Test failed: Unexpected access pattern")
    
    return success

def test_semantic_attributes():
    """Test with semantic attribute names (if they work)."""
    print_section("Test 4: Semantic Attributes (Experimental)")
    
    print("\n📋 Scenario: Testing if semantic names work instead of numbers")
    print("   Attempting: 'doctor', 'nurse', etc.")
    
    # Try with semantic names
    try:
        doctor_key = generate_user_key("Dr. Semantic", ["doctor", "emergency"])
        
        if not doctor_key:
            print("⚠️  Semantic attributes not supported - use numeric attributes (1, 2, 3...)")
            return None
        
        # Try encryption
        data = "Test with semantic attributes"
        ciphertext = encrypt_data(data, "(doctor and emergency)")
        
        if not ciphertext:
            print("⚠️  Semantic policies not supported - use numeric format")
            return None
        
        # Try decryption
        plaintext = decrypt_with_key(ciphertext, "Dr. Semantic", doctor_key)
        
        if plaintext == data:
            print("✅ Semantic attributes WORK! This is great news!")
            return True
        else:
            print("⚠️  Semantic attributes partially supported but decryption failed")
            return False
            
    except Exception as e:
        print(f"⚠️  Semantic attributes not supported: {e}")
        return None

def main():
    """Main test orchestration."""
    print("=" * 70)
    print("  FABEO Proper Workflow Test Suite")
    print("  Demonstrating production-ready ABE usage")
    print("=" * 70)
    
    print("\n🏥 Healthcare Access Control Scenarios")
    print("=" * 70)
    
    print("\n⏳ Waiting for services to be ready...")
    time.sleep(2)
    
    # Run tests
    results = {}
    
    results["simple_policy"] = test_simple_policy()
    results["compound_policy"] = test_compound_policy()
    results["or_policy"] = test_or_policy()
    results["semantic_attributes"] = test_semantic_attributes()
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)
    
    print(f"\n📊 Results: {passed} passed, {failed} failed, {skipped} skipped")
    print("\nDetailed results:")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result is True else ("❌ FAIL" if result is False else "⏭️  SKIP")
        print(f"  {status}  {test_name}")
    
    print("\n" + "=" * 70)
    print("💡 Key Takeaways:")
    print("=" * 70)
    print("1. Users get keys during registration based on their attributes")
    print("2. Data is encrypted with policies describing who can access it")
    print("3. Decryption uses pre-generated keys, NOT raw attributes")
    print("4. This approach is secure and scalable for production systems")
    print("\n📝 Attribute Format:")
    print("   - Use numeric attributes: '1', '2', '3', etc.")
    print("   - Map these to roles: 1=doctor, 2=nurse, 3=cardiology, etc.")
    print("   - Store mapping in your application layer")
    
    if semantic_result := results.get("semantic_attributes"):
        if semantic_result:
            print("\n✨ Bonus: Semantic attributes work! You can use descriptive names!")
    
    print("\n" + "=" * 70)
    
    if failed == 0 and passed > 0:
        print("🎉 All tests passed! FABEO is production-ready!")
        return 0
    elif passed > 0:
        print("⚠️  Some tests passed, but there are issues to address")
        return 1
    else:
        print("❌ Tests failed - please check the system")
        return 1

if __name__ == "__main__":
    sys.exit(main())
