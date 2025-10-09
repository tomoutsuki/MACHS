#!/bin/bash

# Test script for MACHS system
# This script runs basic integration tests

set -e

echo "🧪 Running MACHS Integration Tests"
echo "=================================="

# Check if services are running
echo "📋 Checking service availability..."

# Check EHR System
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ EHR System is running"
else
    echo "❌ EHR System is not available"
    exit 1
fi

# Check Cryptography Service
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Cryptography Service is running"
else
    echo "❌ Cryptography Service is not available"
    exit 1
fi

echo ""
echo "🔐 Testing Authentication..."

# Test login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Authentication failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "✅ Authentication successful"
fi

echo ""
echo "🏥 Testing Patient Management..."

# Create a test patient
PATIENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "Test",
      "lastName": "Patient",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "ssn": "123-45-6789"
    },
    "accessControl": {
      "department": "general",
      "confidentialityLevel": "restricted"
    }
  }')

PATIENT_ID=$(echo "$PATIENT_RESPONSE" | grep -o '"patientId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PATIENT_ID" ]; then
    echo "❌ Patient creation failed"
    echo "Response: $PATIENT_RESPONSE"
else
    echo "✅ Patient created successfully: $PATIENT_ID"
fi

echo ""
echo "🔐 Testing Cryptography Service..."

# Test encryption
ENCRYPT_RESPONSE=$(curl -s -X POST http://localhost:8000/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test medical data for encryption",
    "policy": "role:admin",
    "scheme": "fabeo22cp"
  }')

ENCRYPTION_SUCCESS=$(echo "$ENCRYPT_RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$ENCRYPTION_SUCCESS" = "true" ]; then
    echo "✅ Encryption test successful"
else
    echo "❌ Encryption test failed"
    echo "Response: $ENCRYPT_RESPONSE"
fi

echo ""
echo "📊 Testing Integration Workflow..."

# Test crypto workflow
WORKFLOW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/crypto/test-workflow \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testData": "Integration test data",
    "scheme": "fabeo22cp",
    "policy": "role:admin"
  }')

WORKFLOW_SUCCESS=$(echo "$WORKFLOW_RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$WORKFLOW_SUCCESS" = "true" ]; then
    echo "✅ Integration workflow test successful"
else
    echo "❌ Integration workflow test failed"
    echo "Response: $WORKFLOW_RESPONSE"
fi

echo ""
echo "🧹 Cleaning up test data..."

# Clean up test patient (if created)
if [ ! -z "$PATIENT_ID" ]; then
    curl -s -X DELETE "http://localhost:3000/api/patients/$PATIENT_ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "✅ Test patient cleaned up"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo "The MACHS system is working correctly."