# Database Troubleshooting Guide

## Issue: Foreign Key Constraint Error

The error you're encountering is related to foreign key constraints in the PostgreSQL database:

```
error: there is no unique constraint matching given keys for referenced table "fhir_resources_metadata"
```

## Root Cause

The issue occurs because Sequelize is trying to create foreign key constraints that reference fields without proper unique constraints. The `resource_references` table was attempting to reference `resource_id` in `fhir_resources_metadata`, but this field alone is not unique (only the combination of `resource_type` + `resource_id` is unique).

## Solutions

### Solution 1: Quick Fix - Reset Database
```bash
# Run the database reset script
npm run reset-database

# Then start the server
npm start
```

### Solution 2: Manual Database Reset
If you have direct database access:
```sql
-- Connect to your PostgreSQL database and run:
DROP TABLE IF EXISTS "fhir_search_parameters" CASCADE;
DROP TABLE IF EXISTS "fhir_access_logs" CASCADE;
DROP TABLE IF EXISTS "resource_references" CASCADE;
DROP TABLE IF EXISTS "fhir_resources_metadata" CASCADE;
```

### Solution 3: Test Models First
```bash
# Test if the models can be created properly
npm run test-models
```

### Solution 4: Force Recreate Tables
Set environment variable to force table recreation:
```bash
# On Windows
set NODE_ENV=development
npm start

# On Linux/Mac
NODE_ENV=development npm start
```

## What Was Fixed

1. **Removed Foreign Key Constraints**: The `ResourceReference` model no longer has database-level foreign key constraints
2. **Removed Problematic Associations**: Sequelize associations that were causing foreign key issues have been removed
3. **Added Force Sync**: In development mode, tables are now recreated from scratch

## Current Database Schema

The FHIR integration now uses these tables:

1. **`fhir_resources_metadata`**: Stores metadata for all FHIR resources
   - Primary key: `id` (UUID)
   - Unique constraint: `(resource_type, resource_id)`

2. **`resource_references`**: Tracks relationships between resources
   - No foreign key constraints (relationships handled at application level)

3. **`fhir_access_logs`**: Audit logs for FHIR operations

4. **`fhir_search_parameters`**: Extracted search parameters for querying

## Prevention

To avoid this issue in the future:

1. Always test database models with `npm run test-models` before starting the full server
2. Use `npm run reset-database` when making structural changes to models
3. In production, ensure proper database migration scripts instead of using `sync()`

## Verification

After applying the fix, verify everything works:

```bash
# 1. Test models
npm run test-models

# 2. Start server
npm start

# 3. Load test data
npm run load-test-data

# 4. Test FHIR API
npm run test-fhir
```

## Alternative Approaches

If you need foreign key constraints for data integrity:

1. **Add unique constraint on `resource_id`**: Modify the model to make `resource_id` unique
2. **Use composite foreign keys**: Reference both `resource_type` and `resource_id`
3. **Handle referential integrity in application code**: Current approach (recommended for flexibility)

The current solution prioritizes flexibility and avoids database-level constraints that can be problematic with FHIR's dynamic nature.