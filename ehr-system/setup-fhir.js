#!/usr/bin/env node

/**
 * FHIR Setup Script
 * Helps set up the FHIR integration with test data
 */

const path = require('path');
const fs = require('fs').promises;

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if test_data directory exists
  const testDataDir = path.join(__dirname, '..', 'test_data');
  try {
    await fs.access(testDataDir);
    console.log('✅ Test data directory found');
  } catch (error) {
    console.log('❌ Test data directory not found at:', testDataDir);
    console.log('   Please ensure the /test_data/ folder exists in the project root');
    return false;
  }
  
  // Check for patient data
  const patientsDir = path.join(testDataDir, 'patients');
  try {
    const patientFiles = await fs.readdir(patientsDir);
    const jsonFiles = patientFiles.filter(f => f.endsWith('.json'));
    console.log(`✅ Found ${jsonFiles.length} patient files`);
  } catch (error) {
    console.log('❌ Patient data directory not found');
    return false;
  }
  
  // Check for condition data
  const conditionsDir = path.join(testDataDir, 'condition');
  try {
    const conditionFiles = await fs.readdir(conditionsDir);
    const jsonFiles = conditionFiles.filter(f => f.endsWith('.json'));
    console.log(`✅ Found ${jsonFiles.length} condition files`);
  } catch (error) {
    console.log('❌ Condition data directory not found');
    return false;
  }
  
  // Check for encounter data
  const encountersDir = path.join(testDataDir, 'encounter');
  try {
    const encounterFiles = await fs.readdir(encountersDir);
    const jsonFiles = encounterFiles.filter(f => f.endsWith('.json'));
    console.log(`✅ Found ${jsonFiles.length} encounter files`);
  } catch (error) {
    console.log('❌ Encounter data directory not found');
    return false;
  }
  
  return true;
}

async function validateTestData() {
  console.log('');
  console.log('🔬 Validating test data format...');
  
  const testDataDir = path.join(__dirname, '..', 'test_data');
  
  // Validate a sample patient file
  try {
    const patientFile = path.join(testDataDir, 'patients', 'patient_a.json');
    const patientData = JSON.parse(await fs.readFile(patientFile, 'utf8'));
    
    if (patientData.resourceType === 'Patient' && patientData.id) {
      console.log('✅ Patient data format is valid FHIR');
    } else {
      console.log('❌ Patient data format is not valid FHIR');
      return false;
    }
  } catch (error) {
    console.log('❌ Error validating patient data:', error.message);
    return false;
  }
  
  // Validate a sample condition file
  try {
    const conditionFile = path.join(testDataDir, 'condition', 'patient_a_hypertension.json');
    const conditionData = JSON.parse(await fs.readFile(conditionFile, 'utf8'));
    
    if (conditionData.resourceType === 'Condition' && conditionData.id && conditionData.subject) {
      console.log('✅ Condition data format is valid FHIR');
    } else {
      console.log('❌ Condition data format is not valid FHIR');
      return false;
    }
  } catch (error) {
    console.log('❌ Error validating condition data:', error.message);
    return false;
  }
  
  // Validate a sample encounter file
  try {
    const encounterFile = path.join(testDataDir, 'encounter', 'encounter-patient-a.json');
    const encounterData = JSON.parse(await fs.readFile(encounterFile, 'utf8'));
    
    if (encounterData.resourceType === 'Encounter' && encounterData.id && encounterData.subject) {
      console.log('✅ Encounter data format is valid FHIR');
    } else {
      console.log('❌ Encounter data format is not valid FHIR');
      return false;
    }
  } catch (error) {
    console.log('❌ Error validating encounter data:', error.message);
    return false;
  }
  
  return true;
}

async function showNextSteps() {
  console.log('');
  console.log('🚀 FHIR Integration Setup Complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the EHR system:');
  console.log('   npm start');
  console.log('');
  console.log('2. In another terminal, load test data:');
  console.log('   npm run load-test-data');
  console.log('');
  console.log('3. Test the FHIR API:');
  console.log('   npm run test-fhir');
  console.log('');
  console.log('4. Access FHIR endpoints:');
  console.log('   http://localhost:3001/fhir/metadata');
  console.log('   http://localhost:3001/fhir/Patient');
  console.log('   http://localhost:3001/fhir/Condition');
  console.log('   http://localhost:3001/fhir/Encounter');
  console.log('');
  console.log('📖 For detailed documentation, see FHIR_INTEGRATION.md');
}

async function main() {
  console.log('🏥 MACHS EHR System - FHIR Integration Setup');
  console.log('==============================================');
  console.log('');
  
  try {
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
      console.log('');
      console.log('❌ Prerequisites check failed. Please fix the issues above and try again.');
      process.exit(1);
    }
    
    const validationOk = await validateTestData();
    if (!validationOk) {
      console.log('');
      console.log('❌ Test data validation failed. Please check the test data format.');
      process.exit(1);
    }
    
    await showNextSteps();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkPrerequisites, validateTestData };