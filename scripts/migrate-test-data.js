#!/usr/bin/env node
/**
 * MACHS Data Migration Script
 * Cleans existing data and recreates from test_data with proper encryption
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  EHR_API: 'http://localhost:3001',
  CRYPTO_API: 'http://localhost:8000',
  STORAGE_BASE: '../storage',
  TEST_DATA_BASE: '../test_data',
  ENCRYPTION_SCHEME: 'CP-ABE',
  DEFAULT_POLICY: 'doctor OR nurse OR admin'
};

// Patient ID mapping for consistency
const PATIENT_MAPPING = {
  'patient-a': { name: 'Ana Maria dos Santos', cpf: '123.456.789-01' },
  'patient-b': { name: 'João Silva Oliveira', cpf: '987.654.321-09' },
  'patient-c': { name: 'Maria José Lima', cpf: '456.789.123-45' },
  'patient-d': { name: 'Carlos Eduardo Costa', cpf: '789.123.456-78' },
  'patient-e': { name: 'Fernanda Alves Pereira', cpf: '321.654.987-12' }
};

class DataMigrator {
  constructor() {
    this.processedData = {
      patients: [],
      conditions: [],
      encounters: []
    };
  }

  async init() {
    console.log('🏥 MACHS Data Migration Starting...');
    console.log('=====================================');
    
    // Wait for services to be ready
    await this.waitForServices();
    
    // Clean existing data
    await this.cleanExistingData();
    
    // Process test data
    await this.processTestData();
    
    console.log('\\n🎉 Data migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Patients: ${this.processedData.patients.length}`);
    console.log(`   - Conditions: ${this.processedData.conditions.length}`);
    console.log(`   - Encounters: ${this.processedData.encounters.length}`);
  }

  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');
    
    const checkService = async (url, name) => {
      for (let i = 0; i < 30; i++) {
        try {
          await axios.get(`${url}/health`);
          console.log(`✅ ${name} is ready`);
          return;
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      throw new Error(`${name} is not responding`);
    };
    
    await checkService(CONFIG.EHR_API, 'EHR System');
    await checkService(CONFIG.CRYPTO_API, 'Crypto Service');
  }

  async cleanExistingData() {
    console.log('\\n🧹 Cleaning existing data...');
    
    // Clean storage directories
    const storageTypes = ['patients', 'conditions', 'encounters'];
    for (const type of storageTypes) {
      const dir = path.join(__dirname, CONFIG.STORAGE_BASE, type);
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
  }

  async processTestData() {
    console.log('\\n📝 Processing test data...');
    
    // Process patients first
    await this.processPatients();
    
    // Process conditions
    await this.processConditions();
    
    // Process encounters
    await this.processEncounters();
  }

  async processPatients() {
    console.log('\\n👥 Processing patients...');
    const patientsDir = path.join(__dirname, CONFIG.TEST_DATA_BASE, 'patients');
    const files = await fs.readdir(patientsDir);
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(patientsDir, file);
        const patientData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Generate patient ID and metadata
        const patientId = this.generatePatientId();
        const mapping = PATIENT_MAPPING[patientData.id];
        
        if (!mapping) {
          console.log(`⚠️  No mapping found for patient ${patientData.id}`);
          continue;
        }
        
        // Encrypt patient data
        const encryptedData = await this.encryptData(patientData, 'patient');
        
        // Create storage directory
        const storageDir = path.join(__dirname, CONFIG.STORAGE_BASE, 'patients', patientId);
        await fs.mkdir(storageDir, { recursive: true });
        
        // Save encrypted data
        const dataFilePath = path.join(storageDir, 'data.encrypted');
        await fs.writeFile(dataFilePath, encryptedData);
        
        // Create patient metadata for EHR system
        const patientMetadata = {
          id: uuidv4(),
          patientId,
          name: mapping.name,
          cpf: mapping.cpf,
          dataFilePath: `/app/storage/patients/${patientId}/data.encrypted`,
          encryptionScheme: CONFIG.ENCRYPTION_SCHEME,
          policy: CONFIG.DEFAULT_POLICY,
          originalId: patientData.id
        };
        
        // Store in EHR system
        await this.createPatientInEHR(patientMetadata);
        
        this.processedData.patients.push({
          patientId,
          originalId: patientData.id,
          name: mapping.name,
          cpf: mapping.cpf
        });
        
        console.log(`✅ Processed patient: ${mapping.name} (${patientId})`);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }

  async processConditions() {
    console.log('\\n🏥 Processing conditions...');
    const conditionsDir = path.join(__dirname, CONFIG.TEST_DATA_BASE, 'condition');
    const files = await fs.readdir(conditionsDir);
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(conditionsDir, file);
        const conditionData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Find corresponding patient
        const patientRef = conditionData.subject?.reference;
        const originalPatientId = patientRef?.split('/')[1];
        const patient = this.processedData.patients.find(p => p.originalId === originalPatientId);
        
        if (!patient) {
          console.log(`⚠️  No patient found for condition ${conditionData.id}`);
          continue;
        }
        
        // Generate condition ID
        const conditionId = uuidv4();
        
        // Update condition to reference new patient ID
        conditionData.subject.reference = `Patient/${patient.patientId}`;
        
        // Encrypt condition data
        const encryptedData = await this.encryptData(conditionData, 'condition');
        
        // Create storage directory
        const storageDir = path.join(__dirname, CONFIG.STORAGE_BASE, 'conditions');
        await fs.mkdir(storageDir, { recursive: true });
        
        // Save encrypted data
        const fileName = `condition_${conditionId}.encrypted`;
        const dataFilePath = path.join(storageDir, fileName);
        await fs.writeFile(dataFilePath, encryptedData);
        
        this.processedData.conditions.push({
          conditionId,
          originalId: conditionData.id,
          patientId: patient.patientId,
          type: conditionData.code?.coding?.[0]?.display || 'Unknown'
        });
        
        console.log(`✅ Processed condition: ${conditionData.code?.coding?.[0]?.display || conditionData.id} for ${patient.name}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }

  async processEncounters() {
    console.log('\\n📋 Processing encounters...');
    const encountersDir = path.join(__dirname, CONFIG.TEST_DATA_BASE, 'encounter');
    const files = await fs.readdir(encountersDir);
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(encountersDir, file);
        const encounterData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Find corresponding patient
        const patientRef = encounterData.subject?.reference;
        const originalPatientId = patientRef?.split('/')[1];
        const patient = this.processedData.patients.find(p => p.originalId === originalPatientId);
        
        if (!patient) {
          console.log(`⚠️  No patient found for encounter ${encounterData.id}`);
          continue;
        }
        
        // Generate encounter ID
        const encounterId = uuidv4();
        
        // Update encounter to reference new patient ID
        encounterData.subject.reference = `Patient/${patient.patientId}`;
        
        // Encrypt encounter data
        const encryptedData = await this.encryptData(encounterData, 'encounter');
        
        // Create storage directory
        const storageDir = path.join(__dirname, CONFIG.STORAGE_BASE, 'encounters');
        await fs.mkdir(storageDir, { recursive: true });
        
        // Save encrypted data
        const fileName = `encounter_${encounterId}.encrypted`;
        const dataFilePath = path.join(storageDir, fileName);
        await fs.writeFile(dataFilePath, encryptedData);
        
        this.processedData.encounters.push({
          encounterId,
          originalId: encounterData.id,
          patientId: patient.patientId,
          type: encounterData.class?.[0]?.coding?.[0]?.display || 'Unknown'
        });
        
        console.log(`✅ Processed encounter: ${encounterData.id} for ${patient.name}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  }

  async encryptData(data, type) {
    try {
      const response = await axios.post(`${CONFIG.CRYPTO_API}/encrypt`, {
        data: JSON.stringify(data),
        scheme: CONFIG.ENCRYPTION_SCHEME,
        policy: CONFIG.DEFAULT_POLICY,
        attributes: ['doctor', 'nurse', 'admin']
      });
      
      return response.data.encrypted_data;
    } catch (error) {
      console.error(`❌ Encryption failed for ${type}:`, error.message);
      throw error;
    }
  }

  async createPatientInEHR(metadata) {
    try {
      const response = await axios.post(`${CONFIG.EHR_API}/patients`, {
        name: metadata.name,
        cpf: metadata.cpf,
        encryptedData: 'stored_separately', // Data is stored in filesystem
        policy: metadata.policy,
        scheme: metadata.encryptionScheme
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create patient in EHR:`, error.message);
      throw error;
    }
  }

  generatePatientId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `PAT-${timestamp}-${random}`;
  }
}

// Run migration
if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.init().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = DataMigrator;