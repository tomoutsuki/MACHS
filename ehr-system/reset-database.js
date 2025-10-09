#!/usr/bin/env node

/**
 * Database Reset Script
 * Drops all FHIR tables and recreates them
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:secure_password@localhost:5432/machs_ehr';

async function resetDatabase() {
  const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log // Show SQL queries
  });

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    console.log('🗑️  Dropping FHIR tables...');
    
    // Drop tables in correct order (references first)
    const tablesToDrop = [
      'fhir_search_parameters',
      'fhir_access_logs', 
      'resource_references',
      'fhir_resources_metadata'
    ];

    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Table ${table} doesn't exist or couldn't be dropped`);
      }
    }

    console.log('✅ Database reset completed');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the EHR system: npm start');
    console.log('2. The tables will be recreated automatically');

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function main() {
  console.log('🏥 MACHS EHR System - Database Reset');
  console.log('===================================');
  console.log('');
  console.log('This will drop all FHIR tables and recreate them.');
  console.log('');

  try {
    await resetDatabase();
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { resetDatabase };