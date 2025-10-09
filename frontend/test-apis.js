#!/usr/bin/env node

// Test script to verify MACHS Hospital System APIs
const axios = require('axios');

const EHR_BASE_URL = 'http://localhost:3001';
const CRYPTO_BASE_URL = 'http://localhost:8000';

async function testAPIs() {
    console.log('🧪 Testing MACHS Hospital System APIs...\n');

    // Test EHR Health Check
    try {
        console.log('1️⃣ Testing EHR System Health...');
        const ehrHealth = await axios.get(`${EHR_BASE_URL}/health`);
        console.log('✅ EHR System: Online');
        console.log(`   Status: ${ehrHealth.data.status}`);
        console.log(`   Database: ${ehrHealth.data.database}`);
    } catch (error) {
        console.log('❌ EHR System: Offline');
        console.log(`   Error: ${error.message}`);
    }

    // Test Crypto Health Check
    try {
        console.log('\n2️⃣ Testing Crypto Service Health...');
        const cryptoHealth = await axios.get(`${CRYPTO_BASE_URL}/health`);
        console.log('✅ Crypto Service: Online');
        console.log(`   Status: ${cryptoHealth.data.status}`);
    } catch (error) {
        console.log('❌ Crypto Service: Offline');
        console.log(`   Error: ${error.message}`);
    }

    // Test Patient List API
    try {
        console.log('\n3️⃣ Testing Patient List API...');
        const patients = await axios.get(`${EHR_BASE_URL}/patients`, {
            headers: {
                'X-User-Id': 'admin'
            }
        });
        console.log('✅ Patient List: Success');
        console.log(`   Total Patients: ${patients.data.patients?.length || 0}`);
        console.log(`   User Permissions: ${Object.keys(patients.data.userPermissions || {}).length} permissions`);
    } catch (error) {
        console.log('❌ Patient List: Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test Patient Creation
    try {
        console.log('\n4️⃣ Testing Patient Creation...');
        const newPatient = {
            name: 'Test Patient API',
            cpf: '999.888.777-66',
            birthDate: '1985-06-15',
            gender: 'male',
            diagnosis: 'API Test Case'
        };

        const createResult = await axios.post(`${EHR_BASE_URL}/patients`, newPatient, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'admin'
            }
        });
        
        console.log('✅ Patient Creation: Success');
        console.log(`   Patient ID: ${createResult.data.patientId}`);
        console.log(`   Message: ${createResult.data.message}`);
    } catch (error) {
        console.log('❌ Patient Creation: Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test Search API
    try {
        console.log('\n5️⃣ Testing Patient Search...');
        const searchResult = await axios.post(`${EHR_BASE_URL}/patients/search`, {
            name: 'Test Patient'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'admin'
            }
        });
        
        console.log('✅ Patient Search: Success');
        console.log(`   Results Found: ${searchResult.data.results?.length || 0}`);
    } catch (error) {
        console.log('❌ Patient Search: Failed');
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test Different User Roles
    console.log('\n6️⃣ Testing User Role Access Control...');
    const userRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'researcher'];
    
    for (const role of userRoles) {
        try {
            const roleTest = await axios.get(`${EHR_BASE_URL}/patients`, {
                headers: {
                    'X-User-Id': role
                }
            });
            console.log(`✅ ${role}: Access granted (${roleTest.data.patients?.length || 0} patients visible)`);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log(`❌ ${role}: Access denied (${error.response.data.message})`);
            } else {
                console.log(`❌ ${role}: Error (${error.message})`);
            }
        }
    }

    console.log('\n🏁 API Testing Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Visit http://localhost:3002/hospital for the Hospital Interface');
    console.log('2. Run "npm run demo-data" in the frontend folder to create test patients');
    console.log('3. Try different user roles to see access control in action');
}

// Run the tests
if (require.main === module) {
    testAPIs().catch(console.error);
}

module.exports = { testAPIs };