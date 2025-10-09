#!/usr/bin/env node

/**
 * FHIR Test Data Loader CLI
 * Command-line interface for loading FHIR test data
 */

const path = require('path');
const { loadTestData, clearAllData, listTestDataFiles } = require('./utils/data-loader');

// Configuration
const BASE_DIR = path.join(__dirname, '..');
const EHR_BASE_URL = process.env.EHR_BASE_URL || 'http://localhost:3001';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'load':
        console.log('🚀 Loading FHIR test data...');
        console.log(`📁 Base directory: ${BASE_DIR}`);
        console.log(`🌐 EHR System URL: ${EHR_BASE_URL}`);
        console.log('');
        
        const results = await loadTestData(BASE_DIR, EHR_BASE_URL);
        
        console.log('');
        console.log('📊 Loading Results:');
        console.log(`✅ Patients loaded: ${results.patients.loaded}`);
        console.log(`✅ Conditions loaded: ${results.conditions.loaded}`);
        console.log(`✅ Encounters loaded: ${results.encounters.loaded}`);
        
        if (results.patients.errors.length > 0) {
          console.log(`❌ Patient errors: ${results.patients.errors.length}`);
          results.patients.errors.forEach(error => {
            console.log(`   - ${error.file}: ${error.error}`);
          });
        }
        
        if (results.conditions.errors.length > 0) {
          console.log(`❌ Condition errors: ${results.conditions.errors.length}`);
          results.conditions.errors.forEach(error => {
            console.log(`   - ${error.file}: ${error.error}`);
          });
        }
        
        if (results.encounters.errors.length > 0) {
          console.log(`❌ Encounter errors: ${results.encounters.errors.length}`);
          results.encounters.errors.forEach(error => {
            console.log(`   - ${error.file}: ${error.error}`);
          });
        }
        
        console.log('');
        console.log('✅ Test data loading completed!');
        break;

      case 'clear':
        console.log('🧹 Clearing all data from EHR system...');
        const clearResults = await clearAllData(EHR_BASE_URL);
        console.log(`✅ Cleared ${clearResults.patients.cleared} patients`);
        
        if (clearResults.patients.errors.length > 0) {
          console.log(`❌ Clear errors: ${clearResults.patients.errors.length}`);
          clearResults.patients.errors.forEach(error => {
            console.log(`   - ${error.id}: ${error.error}`);
          });
        }
        
        console.log('✅ Data clearing completed!');
        break;

      case 'list':
        console.log('📋 Available test data files:');
        const files = await listTestDataFiles(BASE_DIR);
        
        console.log('');
        console.log('👤 Patients:');
        files.patients.forEach(file => console.log(`   - ${file}`));
        
        console.log('');
        console.log('🏥 Conditions:');
        files.conditions.forEach(file => console.log(`   - ${file}`));
        
        console.log('');
        console.log('📅 Encounters:');
        files.encounters.forEach(file => console.log(`   - ${file}`));
        break;

      case 'reload':
        console.log('🔄 Reloading test data (clear + load)...');
        
        console.log('🧹 Step 1: Clearing existing data...');
        await clearAllData(EHR_BASE_URL);
        console.log('✅ Data cleared');
        
        console.log('');
        console.log('📥 Step 2: Loading test data...');
        const reloadResults = await loadTestData(BASE_DIR, EHR_BASE_URL);
        
        console.log('');
        console.log('📊 Reload Results:');
        console.log(`✅ Patients loaded: ${reloadResults.patients.loaded}`);
        console.log(`✅ Conditions loaded: ${reloadResults.conditions.loaded}`);
        console.log(`✅ Encounters loaded: ${reloadResults.encounters.loaded}`);
        console.log('✅ Test data reload completed!');
        break;

      default:
        console.log('FHIR Test Data Loader');
        console.log('');
        console.log('Usage:');
        console.log('  node load-test-data.js <command>');
        console.log('');
        console.log('Commands:');
        console.log('  load     Load test data from /test_data/ folder');
        console.log('  clear    Clear all data from EHR system');
        console.log('  list     List available test data files');
        console.log('  reload   Clear and reload test data');
        console.log('');
        console.log('Environment Variables:');
        console.log('  EHR_BASE_URL    Base URL of EHR system (default: http://localhost:3001)');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };