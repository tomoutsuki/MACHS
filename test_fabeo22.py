#!/usr/bin/env python3
"""
FABEO22 CP-ABE Dependency and Functionality Test Script
Tests if FABEO22 CP-ABE module is working correctly and dependencies are loaded.
"""

import sys
import os
import traceback
from pathlib import Path

# Add FABEO to Python path
FABEO_PATH = Path(__file__).parent / "submodules" / "FABEO"
if FABEO_PATH.exists():
    sys.path.insert(0, str(FABEO_PATH))

def test_basic_imports():
    """Test basic Python package imports."""
    print("🔍 Testing basic imports...")
    
    try:
        import json
        import base64
        print("✅ Standard library imports: OK")
    except ImportError as e:
        print(f"❌ Standard library imports failed: {e}")
        return False
    
    return True

def test_charm_import():
    """Test Charm cryptographic library import."""
    print("\n🔍 Testing Charm library import...")
    
    try:
        from charm.toolbox.pairinggroup import PairingGroup, ZR, G1, G2, GT, pair
        from charm.toolbox.ABEnc import ABEnc
        print("✅ Charm library import: OK")
        
        # Test pairing group initialization
        try:
            group = PairingGroup('SS512')
            print("✅ Pairing group initialization: OK")
            print(f"   Group order: {group.order()}")
            return True
        except Exception as e:
            print(f"❌ Pairing group initialization failed: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Charm library import failed: {e}")
        print("   Note: Charm-Crypto requires specific installation for cryptographic operations")
        return False

def test_fabeo_import():
    """Test FABEO module import."""
    print("\n🔍 Testing FABEO module import...")
    
    try:
        from FABEO.fabeo22cp import FABEO22CPABE
        print("✅ FABEO22CPABE import: OK")
        return True
    except ImportError as e:
        print(f"❌ FABEO22CPABE import failed: {e}")
        print(f"   FABEO path: {FABEO_PATH}")
        print(f"   FABEO exists: {FABEO_PATH.exists()}")
        return False

def test_msp_import():
    """Test MSP (Monotonic Span Program) module import."""
    print("\n🔍 Testing MSP module import...")
    
    try:
        from FABEO.msp import MSP
        print("✅ MSP import: OK")
        return True
    except ImportError as e:
        print(f"❌ MSP import failed: {e}")
        return False

def test_fabeo22_functionality():
    """Test FABEO22 CP-ABE basic functionality."""
    print("\n🔍 Testing FABEO22 CP-ABE functionality...")
    
    try:
        # Import required modules
        from charm.toolbox.pairinggroup import PairingGroup
        from FABEO.fabeo22cp import FABEO22CPABE
        
        # Initialize components
        group = PairingGroup('SS512')
        scheme = FABEO22CPABE(group)
        
        print("✅ FABEO22CPABE initialization: OK")
        
        # Test setup
        print("   Testing setup...")
        pk, msk = scheme.setup()
        print("✅ Setup: OK")
        print(f"   Public key components: {list(pk.keys())}")
        print(f"   Master secret key components: {list(msk.keys())}")
        
        # Test key generation
        print("   Testing key generation...")
        attributes = ['doctor', 'hospital_a', 'department_cardiology']
        sk = scheme.keygen(pk, msk, attributes)
        print("✅ Key generation: OK")
        print(f"   Secret key components: {list(sk.keys())}")
        print(f"   Attributes: {sk['attr_list']}")
        
        # Test encryption
        print("   Testing encryption...")
        message = "This is a test medical record"
        policy = "(doctor AND hospital_a) OR (nurse AND department_cardiology)"
        
        try:
            ciphertext = scheme.encrypt(pk, message, policy)
            print("✅ Encryption: OK")
            print(f"   Ciphertext components: {list(ciphertext.keys())}")
            print(f"   Policy: {policy}")
        except Exception as e:
            print(f"❌ Encryption failed: {e}")
            return False
        
        # Test decryption
        print("   Testing decryption...")
        try:
            decrypted = scheme.decrypt(pk, ciphertext, sk)
            if decrypted == message:
                print("✅ Decryption: OK")
                print(f"   Original: {message}")
                print(f"   Decrypted: {decrypted}")
                return True
            else:
                print(f"❌ Decryption failed: message mismatch")
                print(f"   Expected: {message}")
                print(f"   Got: {decrypted}")
                return False
        except Exception as e:
            print(f"❌ Decryption failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ FABEO22 functionality test failed: {e}")
        traceback.print_exc()
        return False

def test_policy_satisfaction():
    """Test different policy scenarios."""
    print("\n🔍 Testing policy satisfaction scenarios...")
    
    try:
        from charm.toolbox.pairinggroup import PairingGroup
        from FABEO.fabeo22cp import FABEO22CPABE
        
        group = PairingGroup('SS512')
        scheme = FABEO22CPABE(group)
        pk, msk = scheme.setup()
        
        message = "Confidential patient data"
        
        # Test case 1: Policy satisfied
        print("   Test case 1: Policy should be satisfied")
        policy1 = "doctor AND hospital_a"
        attributes1 = ['doctor', 'hospital_a', 'department_cardiology']
        
        sk1 = scheme.keygen(pk, msk, attributes1)
        ct1 = scheme.encrypt(pk, message, policy1)
        decrypted1 = scheme.decrypt(pk, ct1, sk1)
        
        if decrypted1 == message:
            print("✅ Policy satisfied case: OK")
        else:
            print("❌ Policy satisfied case: FAILED")
            return False
        
        # Test case 2: Policy not satisfied
        print("   Test case 2: Policy should NOT be satisfied")
        policy2 = "admin AND researcher"
        attributes2 = ['doctor', 'hospital_a']
        
        sk2 = scheme.keygen(pk, msk, attributes2)
        ct2 = scheme.encrypt(pk, message, policy2)
        decrypted2 = scheme.decrypt(pk, ct2, sk2)
        
        if decrypted2 is None:
            print("✅ Policy not satisfied case: OK")
        else:
            print("❌ Policy not satisfied case: FAILED (should have returned None)")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Policy satisfaction test failed: {e}")
        return False

def test_serialization():
    """Test object serialization for storage/transmission."""
    print("\n🔍 Testing serialization functionality...")
    
    try:
        from charm.toolbox.pairinggroup import PairingGroup
        from FABEO.fabeo22cp import FABEO22CPABE
        import base64
        
        group = PairingGroup('SS512')
        scheme = FABEO22CPABE(group)
        pk, msk = scheme.setup()
        
        # Test serialization of public key
        try:
            pk_bytes = group.serialize(pk['g1'])
            pk_b64 = base64.b64encode(pk_bytes).decode('utf-8')
            
            # Test deserialization
            pk_bytes_restored = base64.b64decode(pk_b64.encode('utf-8'))
            pk_restored = group.deserialize(pk_bytes_restored)
            
            print("✅ Serialization/Deserialization: OK")
            return True
            
        except Exception as e:
            print(f"❌ Serialization failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Serialization test failed: {e}")
        return False

def main():
    """Main test function."""
    print("🧪 FABEO22 CP-ABE Dependency and Functionality Test")
    print("=" * 60)
    
    # Test results
    results = {
        'basic_imports': test_basic_imports(),
        'charm_import': test_charm_import(),
        'fabeo_import': test_fabeo_import(),
        'msp_import': test_msp_import(),
    }
    
    # Only run functionality tests if basic imports work
    if results['charm_import'] and results['fabeo_import'] and results['msp_import']:
        results.update({
            'fabeo22_functionality': test_fabeo22_functionality(),
            'policy_satisfaction': test_policy_satisfaction(),
            'serialization': test_serialization(),
        })
    else:
        print("\n⚠️ Skipping functionality tests due to import failures")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:25} : {status}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! FABEO22 CP-ABE is working correctly.")
    elif results['basic_imports'] and results['fabeo_import']:
        print("⚠️ Basic functionality available but some features may not work.")
    else:
        print("❌ Critical dependencies missing. FABEO22 CP-ABE not functional.")
        print("\n💡 Possible solutions:")
        print("   1. Install Charm-Crypto: pip install charm-crypto")
        print("   2. Use Docker environment with pre-installed dependencies")
        print("   3. Check FABEO submodule initialization")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)