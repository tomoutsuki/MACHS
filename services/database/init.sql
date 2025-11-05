-- MACHS Database Schema
-- Initialization script for PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for simulation purposes)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    sector VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT users_display_name_check CHECK (char_length(display_name) >= 1)
);

-- Patients table (encrypted EHR data)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciphertext TEXT,
    storage_path VARCHAR(500),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT patients_storage_check CHECK (
        (ciphertext IS NOT NULL AND storage_path IS NULL) OR 
        (ciphertext IS NULL AND storage_path IS NOT NULL)
    )
);

-- Conditions table (encrypted medical conditions)
CREATE TABLE conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    ciphertext TEXT,
    storage_path VARCHAR(500),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT conditions_storage_check CHECK (
        (ciphertext IS NOT NULL AND storage_path IS NULL) OR 
        (ciphertext IS NULL AND storage_path IS NOT NULL)
    )
);

-- Encounters table (encrypted medical encounters)
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    ciphertext TEXT,
    storage_path VARCHAR(500),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT encounters_storage_check CHECK (
        (ciphertext IS NOT NULL AND storage_path IS NULL) OR 
        (ciphertext IS NULL AND storage_path IS NOT NULL)
    )
);

-- Accounts table (encrypted account data)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    ciphertext TEXT,
    storage_path VARCHAR(500),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT accounts_storage_check CHECK (
        (ciphertext IS NOT NULL AND storage_path IS NULL) OR 
        (ciphertext IS NULL AND storage_path IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_created_date ON patients(created_date);
CREATE INDEX idx_patients_is_deleted ON patients(is_deleted);

CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_conditions_created_by ON conditions(created_by);
CREATE INDEX idx_conditions_created_date ON conditions(created_date);
CREATE INDEX idx_conditions_is_deleted ON conditions(is_deleted);

CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_created_by ON encounters(created_by);
CREATE INDEX idx_encounters_created_date ON encounters(created_date);
CREATE INDEX idx_encounters_is_deleted ON encounters(is_deleted);

CREATE INDEX idx_accounts_patient_id ON accounts(patient_id);
CREATE INDEX idx_accounts_created_by ON accounts(created_by);
CREATE INDEX idx_accounts_created_date ON accounts(created_date);
CREATE INDEX idx_accounts_is_deleted ON accounts(is_deleted);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
