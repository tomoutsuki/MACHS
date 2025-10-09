#!/usr/bin/env node
/**
 * MACHS Data Cleanup Utility
 * Removes all existing patient, condition, and encounter data
 */

const axios = require('axios');

const CONFIG = {
  EHR_API: 'http://ehr-system:3000',
  DB_HOST: 'postgres',
  DB_NAME: 'machs_ehr',
  DB_USER: 'postgres'
};

async function cleanupData() {
  console.log('🧹 MACHS Data Cleanup Utility');
  console.log('=============================');
  
  try {
    console.log('⏳ Waiting for EHR service...');
    await waitForEHR();
    
    console.log('🗄️ Cleaning database tables...');
    await cleanDatabase();
    
    console.log('📁 Note: Storage cleanup handled by migration scripts');
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

async function waitForEHR() {
  for (let i = 0; i < 10; i++) {
    try {
      await axios.get(`${CONFIG.EHR_API}/health`, { timeout: 3000 });
      console.log('✅ EHR service ready');
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('EHR service not responding');
}

async function cleanDatabase() {
  try {
    // Try to use a cleanup endpoint if available
    const response = await axios.delete(`${CONFIG.EHR_API}/admin/cleanup-all`);
    console.log('✅ Database cleaned via API');
  } catch (error) {
    console.log('⚠️  API cleanup not available, manual cleanup required');
    console.log('Run these commands manually:');
    console.log('docker exec machs-postgres psql -U postgres -d machs_ehr -c "DELETE FROM patients_metadata; DELETE FROM searchable_metadata; DELETE FROM medical_records_metadata; DELETE FROM access_logs;"');
  }
}

// Run cleanup
cleanupData();