#!/usr/bin/env python3
"""
Direct FABEO API Test
Test the FABEO service directly with the exact patterns from the sample code.
"""

import requests
import json
import time
import sys

def test_fabeo_direct_api():
    """Test using the exact format from FABEO sample code."""
    print("🧪 Testing FABEO with sample-style attributes...")
    
    # Use the exact format from the FABEO sample
    test_data = {
        "data": "Test message",
        "policy": "role:doctor",  # Simple single attribute like in sample
        "scheme": "CP-ABE"
    }
    
    try:
        # Encrypt
        response = requests.post(
            "http://localhost:8001/encrypt",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Encryption successful with simple policy 'role:doctor'")
            
            # Try decryption with matching attribute
            decryption_data = {
                "ciphertext": result.get("ciphertext"),
                "scheme": "CP-ABE",
                "attributes": ["role:doctor"]  # Matching attribute
            }
            
            response = requests.post(
                "http://localhost:8001/decrypt",
                json=decryption_data,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Decryption successful with attribute 'role:doctor'!")
                return True
            else:
                print(f"❌ Decryption failed: {response.text}")
                
                # Try with compound policy like the sample
                return test_compound_sample_policy()
        else:
            print(f"❌ Encryption failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_compound_sample_policy():
    """Test with compound policy similar to FABEO sample."""
    print("\n🔄 Testing compound policy similar to FABEO sample...")
    
    # Similar to sample: '((1 and 3) and (2 OR 4))'
    test_data = {
        "data": "Test message",
        "policy": "(1 and 2)",  # Simple compound policy
        "scheme": "CP-ABE"
    }
    
    try:
        # Encrypt
        response = requests.post(
            "http://localhost:8001/encrypt",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Compound encryption successful")
            
            # Try decryption with matching attributes
            decryption_data = {
                "ciphertext": result.get("ciphertext"),
                "scheme": "CP-ABE", 
                "attributes": ["1", "2"]  # Both attributes to satisfy (1 and 2)
            }
            
            response = requests.post(
                "http://localhost:8001/decrypt",
                json=decryption_data,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Compound decryption successful!")
                return True
            else:
                print(f"❌ Compound decryption failed: {response.text}")
                return False
        else:
            print(f"❌ Compound encryption failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Compound test failed: {e}")
        return False

def main():
    """Main test function."""
    print("=" * 60)
    print("🧪 FABEO Direct API Test - Sample Format")
    print("=" * 60)
    
    print("\nTesting with exact FABEO sample patterns...")
    print("Based on: attr_list = ['1', '2', '3'], policy_str = '((1 and 3) and (2 OR 4))'")
    print()
    
    # Wait a moment for services to be ready
    time.sleep(2)
    
    success = test_fabeo_direct_api()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ FABEO is working with sample-style format!")
        print("   The issue was likely in policy/attribute format.")
    else:
        print("❌ Still having issues - need deeper investigation.")
    print("=" * 60)

if __name__ == "__main__":
    main()