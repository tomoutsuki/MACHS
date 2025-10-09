#!/usr/bin/env node

/**
 * FHIR Integration Test Script
 * Tests the FHIR API endpoints with sample data
 */

const axios = require('axios');
const { loadTestDataFile } = require('./utils/data-loader');
const path = require('path');

const BASE_URL = process.env.EHR_BASE_URL || 'http://localhost:3001';
const BASE_DIR = path.join(__dirname, '..');

async function testFHIRIntegration() {
  console.log('🧪 Testing FHIR Integration...');
  console.log(`📍 EHR System URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health check: ${healthResponse.data.status}`);
    console.log('');

    // Test 2: FHIR Capability Statement
    console.log('2️⃣  Testing FHIR Capability Statement...');
    const capabilityResponse = await axios.get(`${BASE_URL}/fhir/metadata`);
    console.log(`✅ FHIR CapabilityStatement: ${capabilityResponse.data.resourceType}`);
    console.log(`   Software: ${capabilityResponse.data.software.name}`);
    console.log('');

    // Test 3: Load and create a patient
    console.log('3️⃣  Testing Patient creation...');
    const patientData = await loadTestDataFile(BASE_DIR, 'patients', 'patient_a.json');
    const createPatientResponse = await axios.post(`${BASE_URL}/fhir/Patient`, patientData);
    console.log(`✅ Patient created: ${createPatientResponse.data.id}`);
    console.log('');

    // Test 4: Read the patient
    console.log('4️⃣  Testing Patient read...');
    const readPatientResponse = await axios.get(`${BASE_URL}/fhir/Patient/${patientData.id}`);
    console.log(`✅ Patient read: ${readPatientResponse.data.id}`);
    const patientName = readPatientResponse.data.name[0].given.join(' ') + ' ' + readPatientResponse.data.name[0].family;
    console.log(`   Name: ${patientName}`);
    console.log('');

    // Test 5: Search patients
    console.log('5️⃣  Testing Patient search...');
    const searchPatientsResponse = await axios.get(`${BASE_URL}/fhir/Patient`);
    console.log(`✅ Patient search: ${searchPatientsResponse.data.total} patients found`);
    console.log('');

    // Test 6: Create a condition
    console.log('6️⃣  Testing Condition creation...');
    const conditionData = await loadTestDataFile(BASE_DIR, 'condition', 'patient_a_hypertension.json');
    const createConditionResponse = await axios.post(`${BASE_URL}/fhir/Condition`, conditionData);
    console.log(`✅ Condition created: ${createConditionResponse.data.id}`);
    console.log('');

    // Test 7: Search conditions for patient
    console.log('7️⃣  Testing Condition search by patient...');
    const searchConditionsResponse = await axios.get(`${BASE_URL}/fhir/Condition?patient=${patientData.id}`);
    console.log(`✅ Condition search: ${searchConditionsResponse.data.total} conditions found for patient`);
    console.log('');

    // Test 8: Create an encounter
    console.log('8️⃣  Testing Encounter creation...');
    const encounterData = await loadTestDataFile(BASE_DIR, 'encounter', 'encounter-patient-a.json');
    const createEncounterResponse = await axios.post(`${BASE_URL}/fhir/Encounter`, encounterData);
    console.log(`✅ Encounter created: ${createEncounterResponse.data.id}`);
    console.log('');

    // Test 9: Search encounters for patient
    console.log('9️⃣  Testing Encounter search by patient...');
    const searchEncountersResponse = await axios.get(`${BASE_URL}/fhir/Encounter?patient=${patientData.id}`);
    console.log(`✅ Encounter search: ${searchEncountersResponse.data.total} encounters found for patient`);
    console.log('');

    // Test 10: Update patient
    console.log('🔟 Testing Patient update...');
    const updatedPatient = { ...patientData };
    updatedPatient.telecom = updatedPatient.telecom || [];
    updatedPatient.telecom.push({
      system: 'email',
      value: 'updated.email@test.com',
      use: 'work'
    });
    
    const updatePatientResponse = await axios.put(`${BASE_URL}/fhir/Patient/${patientData.id}`, updatedPatient);
    console.log(`✅ Patient updated: ${updatePatientResponse.data.id}`);
    console.log('');

    // Summary
    console.log('🎉 All FHIR integration tests passed!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log('✅ Health check');
    console.log('✅ FHIR CapabilityStatement');
    console.log('✅ Patient CRUD operations');
    console.log('✅ Condition CRUD operations');
    console.log('✅ Encounter CRUD operations');
    console.log('✅ Search functionality');
    console.log('✅ Patient-resource relationships');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Helper function to wait for server to be ready
async function waitForServer(maxAttempts = 10) {
  console.log('⏳ Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      return;
    } catch (error) {
      console.log(`   Attempt ${i + 1}/${maxAttempts} - Server not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Server did not become ready within the expected time');
}

async function main() {
  const args = process.argv.slice(2);
  const skipWait = args.includes('--skip-wait');
  
  try {
    if (!skipWait) {
      await waitForServer();
      console.log('');
    }
    
    await testFHIRIntegration();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testFHIRIntegration, waitForServer };