#!/usr/bin/env node

/**
 * Database Model Test
 * Tests if the FHIR models can be created without errors
 */

const { Sequelize } = require('sequelize');
const { initializeFHIRModels } = require('./models/fhir-models');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:secure_password@localhost:5432/machs_ehr';

async function testModels() {
  const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log // Show SQL queries
  });

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    console.log('🔬 Initializing FHIR models...');
    const fhirModels = initializeFHIRModels(sequelize);
    console.log('✅ FHIR models initialized');

    console.log('🔧 Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS "fhir_search_parameters" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "fhir_access_logs" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "resource_references" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "fhir_resources_metadata" CASCADE;');
    console.log('✅ Existing tables dropped');

    console.log('🛠️  Creating tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables created successfully');

    console.log('');
    console.log('🎉 Database model test completed successfully!');

  } catch (error) {
    console.error('❌ Model test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function main() {
  console.log('🏥 MACHS EHR System - Database Model Test');
  console.log('=========================================');
  console.log('');

  try {
    await testModels();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testModels };