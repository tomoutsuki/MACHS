-- Initialize the MACHS database with metadata-only tables
-- Patient data is stored encrypted in filesystem

-- Create database (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE machs_ehr;

-- Connect to the database
\c machs_ehr;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients metadata table (no sensitive data)
CREATE TABLE patients_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE,
    data_file_path VARCHAR(500) NOT NULL, -- Path to encrypted data file
    encryption_scheme VARCHAR(50) DEFAULT 'CP-ABE',
    file_hash VARCHAR(64), -- SHA256 hash for integrity verification
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for patients_metadata
CREATE INDEX idx_patients_metadata_patient_id ON patients_metadata(patient_id);
CREATE INDEX idx_patients_metadata_created_at ON patients_metadata(created_at);
CREATE INDEX idx_patients_metadata_is_active ON patients_metadata(is_active);

-- Medical records metadata table
CREATE TABLE medical_records_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(255) NOT NULL,
    record_type VARCHAR(100) NOT NULL, -- 'diagnosis', 'prescription', 'lab_result', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_file_path VARCHAR(500) NOT NULL, -- Path to encrypted record file
    encryption_scheme VARCHAR(50) DEFAULT 'CP-ABE',
    access_policy TEXT, -- ABE access policy for this record
    file_hash VARCHAR(64), -- SHA256 hash for integrity verification
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (patient_id) REFERENCES patients_metadata(patient_id) ON DELETE CASCADE
);

-- Create indexes for medical_records_metadata
CREATE INDEX idx_medical_records_metadata_patient_id ON medical_records_metadata(patient_id);
CREATE INDEX idx_medical_records_metadata_record_type ON medical_records_metadata(record_type);
CREATE INDEX idx_medical_records_metadata_created_at ON medical_records_metadata(created_at);
CREATE INDEX idx_medical_records_metadata_is_active ON medical_records_metadata(is_active);

-- Access logs table for auditing
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(255) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete'
    user_id VARCHAR(255), -- Future: user who performed the action
    user_attributes TEXT[], -- ABE attributes used for access
    access_granted BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for access_logs
CREATE INDEX idx_access_logs_patient_id ON access_logs(patient_id);
CREATE INDEX idx_access_logs_action ON access_logs(action);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_access_granted ON access_logs(access_granted);

-- Encryption keys metadata (for key management)
CREATE TABLE encryption_keys_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id VARCHAR(255) UNIQUE NOT NULL,
    scheme VARCHAR(50) NOT NULL,
    attributes TEXT[], -- For ABE schemes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    public_key_path VARCHAR(500) -- Path to public key file
);

-- Create indexes for encryption_keys_metadata
CREATE INDEX idx_encryption_keys_metadata_key_id ON encryption_keys_metadata(key_id);
CREATE INDEX idx_encryption_keys_metadata_scheme ON encryption_keys_metadata(scheme);
CREATE INDEX idx_encryption_keys_metadata_created_at ON encryption_keys_metadata(created_at);
CREATE INDEX idx_encryption_keys_metadata_is_active ON encryption_keys_metadata(is_active);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_patients_metadata_updated_at 
    BEFORE UPDATE ON patients_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_metadata_updated_at 
    BEFORE UPDATE ON medical_records_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO patients_metadata (patient_id, data_file_path, encryption_scheme) 
-- VALUES ('PAT001', '/storage/patients/PAT001/data.encrypted', 'CP-ABE');

COMMENT ON TABLE patients_metadata IS 'Stores only metadata about patients, actual data is encrypted and stored in filesystem';
COMMENT ON TABLE medical_records_metadata IS 'Stores only metadata about medical records, actual data is encrypted and stored in filesystem';
COMMENT ON TABLE access_logs IS 'Audit trail for all access to patient data';
COMMENT ON TABLE encryption_keys_metadata IS 'Metadata for managing encryption keys used in the system';