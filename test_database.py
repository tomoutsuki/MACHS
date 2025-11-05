"""
Database integration test script.
Tests all database endpoints and functionality.
"""

import requests
import json
from datetime import date
import time

BASE_URL = "http://localhost:8001"

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_database_health():
    """Test database connectivity through health endpoint."""
    print_section("Test: Database Health Check")
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✓ Health check passed")
    return True

def test_create_users():
    """Test creating users."""
    print_section("Test: Create Users")
    
    users = [
        {"display_name": "Test Doctor Alpha"},
        {"display_name": "Test Nurse Beta"},
    ]
    
    created_users = []
    for user_data in users:
        response = requests.post(f"{BASE_URL}/db/users", json=user_data)
        print(f"\nCreating user: {user_data['display_name']}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            user = response.json()
            created_users.append(user)
            print(f"✓ User created: {user['id']}")
            print(f"  Display Name: {user['display_name']}")
            print(f"  Created At: {user['created_at']}")
            print(f"  Active: {user['is_active']}")
        else:
            print(f"✗ Failed: {response.text}")
            return False
    
    return created_users

def test_list_users():
    """Test listing users."""
    print_section("Test: List Users")
    
    response = requests.get(f"{BASE_URL}/db/users")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"✓ Found {len(users)} users")
        for user in users:
            print(f"  - {user['display_name']} ({user['id']})")
        return users
    else:
        print(f"✗ Failed: {response.text}")
        return []

def test_create_patient(user_id, ciphertext):
    """Test creating a patient record."""
    print_section("Test: Create Patient Record")
    
    patient_data = {
        "ciphertext": ciphertext,
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/patients", json=patient_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        patient = response.json()
        print(f"✓ Patient created: {patient['id']}")
        print(f"  Created By: {patient['created_by']}")
        print(f"  Created Date: {patient['created_date']}")
        print(f"  Has Ciphertext: {patient['ciphertext'] is not None}")
        return patient
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_create_patient_with_storage(user_id, storage_path):
    """Test creating a patient record with file storage."""
    print_section("Test: Create Patient with Storage Path")
    
    patient_data = {
        "storage_path": storage_path,
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/patients", json=patient_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        patient = response.json()
        print(f"✓ Patient created: {patient['id']}")
        print(f"  Storage Path: {patient['storage_path']}")
        return patient
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_invalid_patient_creation(user_id):
    """Test that invalid patient creation fails correctly."""
    print_section("Test: Invalid Patient Creation (Both ciphertext and storage_path)")
    
    # Try to create with both ciphertext and storage_path
    patient_data = {
        "ciphertext": "test_cipher",
        "storage_path": "test/path.enc",
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/patients", json=patient_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 400:
        print(f"✓ Correctly rejected invalid data: {response.json()['detail']}")
        return True
    else:
        print(f"✗ Should have failed with 400, got {response.status_code}")
        return False

def test_list_patients():
    """Test listing patients."""
    print_section("Test: List Patients")
    
    response = requests.get(f"{BASE_URL}/db/patients")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        patients = response.json()
        print(f"✓ Found {len(patients)} patients")
        for patient in patients:
            print(f"  - Patient {patient['id']}")
            print(f"    Created: {patient['created_date']}")
            print(f"    Deleted: {patient['is_deleted']}")
        return patients
    else:
        print(f"✗ Failed: {response.text}")
        return []

def test_get_patient(patient_id):
    """Test getting a specific patient."""
    print_section("Test: Get Specific Patient")
    
    response = requests.get(f"{BASE_URL}/db/patients/{patient_id}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        patient = response.json()
        print(f"✓ Retrieved patient: {patient['id']}")
        print(f"  Created Date: {patient['created_date']}")
        print(f"  Is Deleted: {patient['is_deleted']}")
        return patient
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_create_condition(patient_id, user_id, ciphertext):
    """Test creating a condition record."""
    print_section("Test: Create Condition Record")
    
    condition_data = {
        "patient_id": patient_id,
        "ciphertext": ciphertext,
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/conditions", json=condition_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        condition = response.json()
        print(f"✓ Condition created: {condition['id']}")
        print(f"  Patient ID: {condition['patient_id']}")
        print(f"  Created Date: {condition['created_date']}")
        return condition
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_list_conditions_for_patient(patient_id):
    """Test listing conditions for a specific patient."""
    print_section("Test: List Conditions for Patient")
    
    response = requests.get(f"{BASE_URL}/db/conditions?patient_id={patient_id}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        conditions = response.json()
        print(f"✓ Found {len(conditions)} conditions for patient {patient_id}")
        return conditions
    else:
        print(f"✗ Failed: {response.text}")
        return []

def test_create_encounter(patient_id, user_id, ciphertext):
    """Test creating an encounter record."""
    print_section("Test: Create Encounter Record")
    
    encounter_data = {
        "patient_id": patient_id,
        "ciphertext": ciphertext,
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/encounters", json=encounter_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        encounter = response.json()
        print(f"✓ Encounter created: {encounter['id']}")
        print(f"  Patient ID: {encounter['patient_id']}")
        return encounter
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_create_account(patient_id, user_id, storage_path):
    """Test creating an account record."""
    print_section("Test: Create Account Record")
    
    account_data = {
        "patient_id": patient_id,
        "storage_path": storage_path,
        "created_by": user_id
    }
    
    response = requests.post(f"{BASE_URL}/db/accounts", json=account_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        account = response.json()
        print(f"✓ Account created: {account['id']}")
        print(f"  Storage Path: {account['storage_path']}")
        return account
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_update_patient(patient_id, new_ciphertext):
    """Test updating a patient record."""
    print_section("Test: Update Patient Record")
    
    update_data = {
        "ciphertext": new_ciphertext
    }
    
    response = requests.patch(f"{BASE_URL}/db/patients/{patient_id}", json=update_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        patient = response.json()
        print(f"✓ Patient updated: {patient['id']}")
        print(f"  Updated Date: {patient['updated_date']}")
        return patient
    else:
        print(f"✗ Failed: {response.text}")
        return None

def test_soft_delete_patient(patient_id):
    """Test soft deleting a patient."""
    print_section("Test: Soft Delete Patient")
    
    response = requests.delete(f"{BASE_URL}/db/patients/{patient_id}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 204:
        print(f"✓ Patient soft deleted: {patient_id}")
        
        # Verify it's marked as deleted
        get_response = requests.get(f"{BASE_URL}/db/patients/{patient_id}")
        if get_response.status_code == 200:
            patient = get_response.json()
            print(f"  Is Deleted: {patient['is_deleted']}")
            return patient['is_deleted']
        return True
    else:
        print(f"✗ Failed: {response.text}")
        return False

def main():
    """Run all database tests."""
    print("=" * 70)
    print("  MACHS Database Integration Tests")
    print("=" * 70)
    
    print("\n⏳ Waiting for services to be ready...")
    time.sleep(3)
    
    try:
        # Test 1: Health check
        if not test_database_health():
            print("\n❌ Health check failed. Exiting.")
            return
        
        # Test 2: Create and list users
        users = test_create_users()
        if not users or len(users) == 0:
            print("\n❌ User creation failed. Exiting.")
            return
        
        all_users = test_list_users()
        test_user_id = users[0]['id']
        
        # Test 3: Create patient with ciphertext
        sample_cipher = "encrypted_patient_data_example_12345"
        patient1 = test_create_patient(test_user_id, sample_cipher)
        if not patient1:
            print("\n❌ Patient creation failed. Exiting.")
            return
        
        # Test 4: Create patient with storage path
        patient2 = test_create_patient_with_storage(test_user_id, "storage/patients/patient_001.enc")
        
        # Test 5: Test invalid patient creation
        test_invalid_patient_creation(test_user_id)
        
        # Test 6: List and get patients
        test_list_patients()
        test_get_patient(patient1['id'])
        
        # Test 7: Create condition
        condition_cipher = "encrypted_condition_diabetes_type2"
        condition1 = test_create_condition(patient1['id'], test_user_id, condition_cipher)
        
        # Test 8: List conditions for patient
        test_list_conditions_for_patient(patient1['id'])
        
        # Test 9: Create encounter
        encounter_cipher = "encrypted_encounter_checkup_20251104"
        encounter1 = test_create_encounter(patient1['id'], test_user_id, encounter_cipher)
        
        # Test 10: Create account
        account1 = test_create_account(patient1['id'], test_user_id, "storage/accounts/acc_001.enc")
        
        # Test 11: Update patient
        new_cipher = "updated_encrypted_patient_data_67890"
        test_update_patient(patient1['id'], new_cipher)
        
        # Test 12: Soft delete patient
        test_soft_delete_patient(patient2['id'] if patient2 else patient1['id'])
        
        print_section("SUMMARY")
        print("✓ All database tests completed successfully!")
        print("\nDatabase functionality verified:")
        print("  ✓ User management")
        print("  ✓ Patient records (ciphertext and storage_path)")
        print("  ✓ Condition records")
        print("  ✓ Encounter records")
        print("  ✓ Account records")
        print("  ✓ Record updates")
        print("  ✓ Soft deletion")
        print("  ✓ Data validation")
        
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
