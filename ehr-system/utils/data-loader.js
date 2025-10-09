/**
 * FHIR Test Data Loader
 * Loads test data from the /test_data/ folder into the EHR system
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Load FHIR test data from the test_data directory
 * @param {string} baseDir - Base directory path (should be the project root)
 * @param {string} ehrBaseUrl - Base URL of the EHR system API
 * @returns {Promise<Object>} - Loading results
 */
async function loadTestData(baseDir, ehrBaseUrl = 'http://localhost:3001') {
  const testDataDir = path.join(baseDir, 'test_data');
  const results = {
    patients: { loaded: 0, errors: [] },
    conditions: { loaded: 0, errors: [] },
    encounters: { loaded: 0, errors: [] }
  };

  try {
    // Load patients first (as other resources reference them)
    console.log('Loading patients...');
    const patientsDir = path.join(testDataDir, 'patients');
    const patientFiles = await fs.readdir(patientsDir);
    
    for (const file of patientFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(patientsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const patient = JSON.parse(data);
          
          const response = await axios.post(`${ehrBaseUrl}/fhir/Patient`, patient);
          if (response.status === 201) {
            results.patients.loaded++;
            console.log(`✅ Loaded patient: ${patient.id}`);
          }
        } catch (error) {
          console.error(`❌ Error loading patient from ${file}:`, error.message);
          results.patients.errors.push({ file, error: error.message });
        }
      }
    }

    // Load conditions
    console.log('Loading conditions...');
    const conditionsDir = path.join(testDataDir, 'condition');
    const conditionFiles = await fs.readdir(conditionsDir);
    
    for (const file of conditionFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(conditionsDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const condition = JSON.parse(data);
          
          const response = await axios.post(`${ehrBaseUrl}/fhir/Condition`, condition);
          if (response.status === 201) {
            results.conditions.loaded++;
            console.log(`✅ Loaded condition: ${condition.id}`);
          }
        } catch (error) {
          console.error(`❌ Error loading condition from ${file}:`, error.message);
          results.conditions.errors.push({ file, error: error.message });
        }
      }
    }

    // Load encounters
    console.log('Loading encounters...');
    const encountersDir = path.join(testDataDir, 'encounter');
    const encounterFiles = await fs.readdir(encountersDir);
    
    for (const file of encounterFiles) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(encountersDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const encounter = JSON.parse(data);
          
          const response = await axios.post(`${ehrBaseUrl}/fhir/Encounter`, encounter);
          if (response.status === 201) {
            results.encounters.loaded++;
            console.log(`✅ Loaded encounter: ${encounter.id}`);
          }
        } catch (error) {
          console.error(`❌ Error loading encounter from ${file}:`, error.message);
          results.encounters.errors.push({ file, error: error.message });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error loading test data:', error.message);
    throw error;
  }

  return results;
}

/**
 * List available test data files
 * @param {string} baseDir - Base directory path
 * @returns {Promise<Object>} - Available files by resource type
 */
async function listTestDataFiles(baseDir) {
  const testDataDir = path.join(baseDir, 'test_data');
  const files = {
    patients: [],
    conditions: [],
    encounters: []
  };

  try {
    // List patient files
    const patientsDir = path.join(testDataDir, 'patients');
    const patientFiles = await fs.readdir(patientsDir);
    files.patients = patientFiles.filter(f => f.endsWith('.json'));

    // List condition files
    const conditionsDir = path.join(testDataDir, 'condition');
    const conditionFiles = await fs.readdir(conditionsDir);
    files.conditions = conditionFiles.filter(f => f.endsWith('.json'));

    // List encounter files
    const encountersDir = path.join(testDataDir, 'encounter');
    const encounterFiles = await fs.readdir(encountersDir);
    files.encounters = encounterFiles.filter(f => f.endsWith('.json'));

  } catch (error) {
    console.error('Error listing test data files:', error.message);
    throw error;
  }

  return files;
}

/**
 * Load a specific test data file
 * @param {string} baseDir - Base directory path
 * @param {string} resourceType - Resource type (patients, condition, encounter)
 * @param {string} fileName - File name
 * @returns {Promise<Object>} - Parsed FHIR resource
 */
async function loadTestDataFile(baseDir, resourceType, fileName) {
  const testDataDir = path.join(baseDir, 'test_data');
  const filePath = path.join(testDataDir, resourceType, fileName);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading test data file ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Clear all data from the EHR system
 * @param {string} ehrBaseUrl - Base URL of the EHR system API
 * @returns {Promise<Object>} - Clearing results
 */
async function clearAllData(ehrBaseUrl = 'http://localhost:3001') {
  const results = {
    patients: { cleared: 0, errors: [] },
    conditions: { cleared: 0, errors: [] },
    encounters: { cleared: 0, errors: [] }
  };

  try {
    console.log('Clearing all data...');
    
    // Get all patients and clear their data
    const patientsResponse = await axios.get(`${ehrBaseUrl}/fhir/Patient`);
    if (patientsResponse.data.entry) {
      for (const entry of patientsResponse.data.entry) {
        try {
          await axios.delete(`${ehrBaseUrl}/fhir/Patient/${entry.resource.id}`);
          results.patients.cleared++;
        } catch (error) {
          results.patients.errors.push({ id: entry.resource.id, error: error.message });
        }
      }
    }

    console.log(`✅ Cleared ${results.patients.cleared} patients`);
    
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }

  return results;
}

module.exports = {
  loadTestData,
  listTestDataFiles,
  loadTestDataFile,
  clearAllData
};