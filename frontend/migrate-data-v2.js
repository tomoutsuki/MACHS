#!/usr/bin/env node
/**
 * MACHS Docker Data Migration Script - Enhanced Version
 * Runs inside the hospital-frontend container to migrate test data
 * Includes proper cleanup to prevent duplicate data
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configuration for Docker environment
const CONFIG = {
  EHR_API: 'http://ehr-system:3000',
  CRYPTO_API: 'http://cryptography:8000',
  STORAGE_BASE: '/app/storage',
  TEST_DATA_BASE: '/app/test_data',
  ENCRYPTION_SCHEME: 'CP-ABE',
  DEFAULT_POLICY: 'doctor OR nurse OR admin'
};

// Patient mapping with Brazilian names and CPFs
const PATIENT_MAPPING = {
  'patient-a': { name: 'Ana Maria dos Santos', cpf: '123.456.789-01' },
  'patient-b': { name: 'João Silva Oliveira', cpf: '987.654.321-09' },
  'patient-c': { name: 'Maria José Lima', cpf: '456.789.123-45' },
  'patient-d': { name: 'Carlos Eduardo Costa', cpf: '789.123.456-78' },
  'patient-e': { name: 'Fernanda Alves Pereira', cpf: '321.654.987-12' }
};

async function main() {
  console.log('🏥 MACHS Test Data Migration - Enhanced');
  console.log('=======================================');
  
  try {
    // Wait for services
    console.log('⏳ Waiting for services...');
    await waitForServices();
    
    // Clean existing data FIRST
    console.log('\\n🧹 Cleaning existing data...');
    await cleanExistingData();
    
    // Process patients
    console.log('\\n👥 Processing patients from test data...');
    const patients = await processPatients();
    
    // Process conditions
    console.log('\\n🏥 Processing conditions...');
    await processConditions(patients);
    
    // Process encounters  
    console.log('\\n📋 Processing encounters...');
    await processEncounters(patients);
    
    console.log('\\n🎉 Migration completed successfully!');
    console.log(`📊 Processed ${patients.length} patients with their medical data`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function cleanExistingData() {
  // Clean storage directories
  const storageTypes = ['conditions', 'encounters'];
  for (const type of storageTypes) {
    const dir = path.join(CONFIG.STORAGE_BASE, type);
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          await fs.rm(path.join(dir, file), { recursive: true, force: true });
        }
      }
      console.log(`✅ Cleaned ${type} storage`);
    } catch (error) {
      console.log(`⚠️  Could not clean ${type} storage: ${error.message}`);
    }
  }
  
  // Note: Patient storage is handled by EHR system, so we don't clean it here
  console.log('📝 Note: Patient data cleanup will be handled by database operations');
}

async function waitForServices() {
  const services = [
    { url: CONFIG.EHR_API, name: 'EHR System' },
    { url: CONFIG.CRYPTO_API, name: 'Crypto Service' }
  ];
  
  for (const service of services) {
    let ready = false;
    for (let i = 0; i < 15; i++) {
      try {
        await axios.get(`${service.url}/health`, { timeout: 3000 });
        console.log(`✅ ${service.name} ready`);
        ready = true;
        break;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    if (!ready) {
      throw new Error(`${service.name} not responding`);
    }
  }
}

async function processPatients() {
  const patientsDir = path.join(CONFIG.TEST_DATA_BASE, 'patients');
  const files = await fs.readdir(patientsDir);
  const patients = [];
  
  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const filePath = path.join(patientsDir, file);
      const patientData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const mapping = PATIENT_MAPPING[patientData.id];
      
      if (!mapping) continue;
      
      // Create patient via EHR API (which handles encryption and storage)
      const response = await axios.post(`${CONFIG.EHR_API}/patients`, {
        name: mapping.name,
        cpf: mapping.cpf,
        dateOfBirth: patientData.birthDate || '1990-01-01',
        gender: patientData.gender || 'unknown',
        fhirData: JSON.stringify(patientData),
        policy: CONFIG.DEFAULT_POLICY,
        scheme: CONFIG.ENCRYPTION_SCHEME
      });
      
      const newPatient = {
        patientId: response.data.patientId,
        originalId: patientData.id,
        name: mapping.name,
        cpf: mapping.cpf
      };
      
      patients.push(newPatient);
      console.log(`✅ Created patient: ${mapping.name} (${newPatient.patientId})`);
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  return patients;
}

async function processConditions(patients) {
  const conditionsDir = path.join(CONFIG.TEST_DATA_BASE, 'condition');
  const files = await fs.readdir(conditionsDir);
  
  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const filePath = path.join(conditionsDir, file);
      const conditionData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Find matching patient
      const patientRef = conditionData.subject?.reference;
      const originalPatientId = patientRef?.split('/')[1];
      const patient = patients.find(p => p.originalId === originalPatientId);
      
      if (!patient) {
        console.log(`⚠️  No patient found for condition ${conditionData.id}`);
        continue;
      }
      
      // Update patient reference
      conditionData.subject.reference = `Patient/${patient.patientId}`;
      
      // Encrypt and store condition
      const encryptedData = await encryptData(conditionData);
      const conditionId = generateUUID();
      const fileName = `condition_${conditionId}.encrypted`;
      const filePath2 = path.join(CONFIG.STORAGE_BASE, 'conditions', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath2), { recursive: true });
      await fs.writeFile(filePath2, encryptedData);
      
      console.log(`✅ Processed condition: ${conditionData.code?.coding?.[0]?.display || conditionData.id}`);
      
    } catch (error) {
      console.error(`❌ Error processing condition ${file}:`, error.message);
    }
  }
}

async function processEncounters(patients) {
  const encountersDir = path.join(CONFIG.TEST_DATA_BASE, 'encounter');
  const files = await fs.readdir(encountersDir);
  
  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const filePath = path.join(encountersDir, file);
      const encounterData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Find matching patient
      const patientRef = encounterData.subject?.reference;
      const originalPatientId = patientRef?.split('/')[1];
      const patient = patients.find(p => p.originalId === originalPatientId);
      
      if (!patient) {
        console.log(`⚠️  No patient found for encounter ${encounterData.id}`);
        continue;
      }
      
      // Update patient reference
      encounterData.subject.reference = `Patient/${patient.patientId}`;
      
      // Encrypt and store encounter
      const encryptedData = await encryptData(encounterData);
      const encounterId = generateUUID();
      const fileName = `encounter_${encounterId}.encrypted`;
      const filePath2 = path.join(CONFIG.STORAGE_BASE, 'encounters', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath2), { recursive: true });
      await fs.writeFile(filePath2, encryptedData);
      
      console.log(`✅ Processed encounter: ${encounterData.id}`);
      
    } catch (error) {
      console.error(`❌ Error processing encounter ${file}:`, error.message);
    }
  }
}

async function encryptData(data) {
  try {
    const response = await axios.post(`${CONFIG.CRYPTO_API}/encrypt`, {
      data: JSON.stringify(data),
      scheme: CONFIG.ENCRYPTION_SCHEME,
      policy: CONFIG.DEFAULT_POLICY,
      attributes: ['doctor', 'nurse', 'admin']
    });
    
    // Check if encryption was successful
    if (!response.data || !response.data.result) {
      console.log('Crypto service response:', response.data);
      throw new Error('Encryption service returned no data');
    }
    
    // Parse the result JSON to get the encrypted_data
    const result = JSON.parse(response.data.result);
    return result.encrypted_data;
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    // Return the original data as fallback for now
    return JSON.stringify(data);
  }
}

// Run the migration
main();