const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import FHIR modules
const { initializeFHIRModels } = require('./models/fhir-models');
const { initializeFHIRRoutes } = require('./routes/fhir-routes');
const fhirUtils = require('./utils/fhir-utils');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:secure_password@localhost:5432/machs_ehr';
const CRYPTO_SERVICE_URL = process.env.CRYPTO_SERVICE_URL || 'http://localhost:8000';
const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection using Sequelize
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
  })
  .catch((error) => {
    console.error('❌ PostgreSQL connection error:', error);
    process.exit(1);
  });

// Initialize FHIR models
const fhirModels = initializeFHIRModels(sequelize);

// Original Sequelize Models - Metadata only, patient data is encrypted and stored in filesystem

// Patients metadata model
const PatientMetadata = sequelize.define('patients_metadata', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'patient_id'
  },
  dataFilePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'data_file_path'
  },
  encryptionScheme: {
    type: DataTypes.STRING(50),
    defaultValue: 'CP-ABE',
    field: 'encryption_scheme'
  },
  fileHash: {
    type: DataTypes.STRING(64),
    field: 'file_hash'
  },
  lastAccessed: {
    type: DataTypes.DATE,
    field: 'last_accessed'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'patients_metadata',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Medical records metadata model  
const MedicalRecordMetadata = sequelize.define('medical_records_metadata', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'patient_id',
    references: {
      model: PatientMetadata,
      key: 'patient_id'
    }
  },
  recordType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'record_type'
  },
  dataFilePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'data_file_path'
  },
  encryptionScheme: {
    type: DataTypes.STRING(50),
    defaultValue: 'CP-ABE',
    field: 'encryption_scheme'
  },
  accessPolicy: {
    type: DataTypes.TEXT,
    field: 'access_policy'
  },
  fileHash: {
    type: DataTypes.STRING(64),
    field: 'file_hash'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'medical_records_metadata',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Access logs model
const AccessLog = sequelize.define('access_logs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'patient_id'
  },
  recordId: {
    type: DataTypes.UUID,
    field: 'record_id'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    field: 'user_id'
  },
  userAttributes: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    field: 'user_attributes'
  },
  accessGranted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'access_granted'
  },
  ipAddress: {
    type: DataTypes.INET,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'access_logs',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

// Searchable metadata model for searchable encryption
const SearchableMetadata = sequelize.define('searchable_metadata', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'patient_id',
    unique: true
  },
  nameHash: {
    type: DataTypes.STRING,
    field: 'name_hash',
    comment: 'Searchable hash of patient name'
  },
  cpfHash: {
    type: DataTypes.STRING,
    field: 'cpf_hash',
    comment: 'Searchable hash of patient CPF'
  },
  dobHash: {
    type: DataTypes.STRING,
    field: 'dob_hash',
    comment: 'Searchable hash of date of birth'
  }
}, {
  tableName: 'searchable_metadata',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
PatientMetadata.hasMany(MedicalRecordMetadata, { 
  foreignKey: 'patientId',
  sourceKey: 'patientId'
});
MedicalRecordMetadata.belongsTo(PatientMetadata, {
  foreignKey: 'patientId',
  targetKey: 'patientId'
});

// Searchable metadata associations
PatientMetadata.hasOne(SearchableMetadata, {
  foreignKey: 'patientId',
  sourceKey: 'patientId'
});
SearchableMetadata.belongsTo(PatientMetadata, {
  foreignKey: 'patientId',
  targetKey: 'patientId'
});

// Helper functions
function generatePatientId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `PAT-${timestamp}-${randomStr}`.toUpperCase();
}

// Searchable encryption utilities
function createSearchHash(value) {
  if (!value) return null;
  // Simple hash function for demonstration
  // In production, use proper cryptographic hash like SHA-256
  const cleanValue = value.toString().toLowerCase().replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < cleanValue.length; i++) {
    const char = cleanValue.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// User profile definitions for access control
const USER_PROFILES = {
  admin: {
    name: 'Dr. Administrator',
    role: 'Administrator',
    attributes: ['admin', 'doctor', 'nurse', 'full_access'],
    permissions: {
      viewPatients: true,
      editPatients: true,
      deletePatients: true,
      viewDiagnoses: true,
      viewEncounters: true,
      viewDemographics: true,
      searchPatients: true,
      manageFabeo: true
    }
  },
  doctor: {
    name: 'Dr. Silva',
    role: 'Doctor',
    attributes: ['doctor', 'cardiology'],
    permissions: {
      viewPatients: true,
      editPatients: true,
      deletePatients: false,
      viewDiagnoses: true,
      viewEncounters: true,
      viewDemographics: true,
      searchPatients: true,
      manageFabeo: false
    }
  },
  nurse: {
    name: 'Nurse Maria',
    role: 'Nurse',
    attributes: ['nurse', 'general_care'],
    permissions: {
      viewPatients: true,
      editPatients: true,
      deletePatients: false,
      viewDiagnoses: false,
      viewEncounters: true,
      viewDemographics: true,
      searchPatients: true,
      manageFabeo: false
    }
  },
  receptionist: {
    name: 'Ana Reception',
    role: 'Receptionist',
    attributes: ['receptionist', 'demographics_only'],
    permissions: {
      viewPatients: true,
      editPatients: false,
      deletePatients: false,
      viewDiagnoses: false,
      viewEncounters: false,
      viewDemographics: true,
      searchPatients: true,
      manageFabeo: false
    }
  },
  researcher: {
    name: 'Dr. Research',
    role: 'Researcher',
    attributes: ['researcher', 'anonymized_data'],
    permissions: {
      viewPatients: true,
      editPatients: false,
      deletePatients: false,
      viewDiagnoses: true,
      viewEncounters: true,
      viewDemographics: false,
      searchPatients: false,
      manageFabeo: false
    }
  }
};

// Access control middleware
function checkUserPermissions(requiredPermission) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || 'admin';
    const user = USER_PROFILES[userId];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid user profile' });
    }
    
    if (!user.permissions[requiredPermission]) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `User ${user.name} does not have permission: ${requiredPermission}`
      });
    }
    
    req.user = user;
    req.userId = userId;
    next();
  };
}

function calculateFileHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function ensurePatientDirectory(patientId) {
  const patientDir = path.join(STORAGE_PATH, 'patients', patientId);
  try {
    await fs.mkdir(patientDir, { recursive: true });
    return patientDir;
  } catch (error) {
    console.error(`Error creating patient directory: ${error}`);
    throw error;
  }
}

async function encryptAndStorePatientData(patientId, data, scheme = 'CP-ABE') {
  try {
    // Call cryptography service to encrypt data
    const encryptResponse = await axios.post(`${CRYPTO_SERVICE_URL}/encrypt`, {
      data: JSON.stringify(data),
      scheme: scheme,
      policy: 'patient:' + patientId // Basic policy, can be customized
    });

    if (!encryptResponse.data.success) {
      throw new Error('Encryption failed: ' + encryptResponse.data.error);
    }

    // Ensure patient directory exists
    const patientDir = await ensurePatientDirectory(patientId);
    const filePath = path.join(patientDir, 'data.encrypted');
    
    // Store encrypted data to file
    await fs.writeFile(filePath, encryptResponse.data.result);
    
    // Calculate file hash for integrity
    const fileHash = calculateFileHash(encryptResponse.data.result);
    
    return {
      filePath: `/storage/patients/${patientId}/data.encrypted`,
      fileHash: fileHash,
      encryptionScheme: scheme
    };
  } catch (error) {
    console.error('Error encrypting and storing patient data:', error);
    throw error;
  }
}

async function decryptPatientData(filePath, scheme = 'CP-ABE', userAttributes = ['doctor', 'nurse', 'admin']) {
  try {
    // Read encrypted file
    const fullPath = path.join(STORAGE_PATH, '..', filePath);
    const encryptedData = await fs.readFile(fullPath, 'utf8');
    
    // Call cryptography service to decrypt data with correct format
    const decryptResponse = await axios.post(`${CRYPTO_SERVICE_URL}/decrypt`, {
      ciphertext: encryptedData,
      private_key: 'dummy_key', // Required by the API but not used in simulation
      scheme: scheme,
      attributes: userAttributes
    });

    if (!decryptResponse.data.success) {
      throw new Error('Decryption failed: ' + decryptResponse.data.error);
    }

    return JSON.parse(decryptResponse.data.result);
  } catch (error) {
    console.error('Error decrypting patient data:', error);
    throw error;
  }
}

// Routes

// Initialize FHIR routes
const fhirRouter = initializeFHIRRoutes(fhirModels, {
  CRYPTO_SERVICE_URL,
  STORAGE_PATH
});
app.use('/fhir', fhirRouter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      service: 'MACHS EHR System',
      timestamp: new Date().toISOString(),
      postgresql: 'connected',
      storage: STORAGE_PATH
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'MACHS EHR System',
      timestamp: new Date().toISOString(),
      postgresql: 'disconnected',
      error: error.message
    });
  }
});

// GET /patients - Get all patients metadata with access control
app.get('/patients', checkUserPermissions('viewPatients'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { isActive: true };

    const { count, rows: patients } = await PatientMetadata.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'patientId', 'created_at', 'updated_at', 'last_accessed']
    });

    // Decrypt and format patient data based on user permissions
    const formattedPatients = await Promise.all(patients.map(async (patient) => {
      try {
        // Try to load patient data file
        const patientDir = path.join(STORAGE_PATH, 'patients', patient.patientId);
        const dataFile = path.join(patientDir, 'data.encrypted');
        
        let patientData = {
          patientId: patient.patientId,
          name: null,
          cpf: null,
          age: null,
          gender: null,
          diagnosis: null,
          lastVisit: patient.last_accessed ? new Date(patient.last_accessed).toLocaleDateString() : 'Never'
        };

        // Check if data file exists and try to decrypt
        try {
          const encryptedData = await fs.readFile(dataFile, 'utf8');
          
          // Call crypto service to decrypt data using user attributes
          try {
            const decryptResponse = await axios.post('http://cryptography:8000/decrypt', {
              ciphertext: encryptedData,
              private_key: 'dummy_key', // Required by the API but not used in simulation
              scheme: 'CP-ABE',
              attributes: req.user.attributes || ['doctor', 'nurse', 'admin'] // Default attributes for compatibility
            });

            if (decryptResponse.data.success) {
              const decryptedData = JSON.parse(decryptResponse.data.result);
              
              // Populate patient data based on user permissions
              if (decryptedData.name) patientData.name = decryptedData.name;
              if (decryptedData.cpf) patientData.cpf = decryptedData.cpf;
              
              // Calculate age from dateOfBirth if available
              if (decryptedData.dateOfBirth) {
                const birthDate = new Date(decryptedData.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }
                patientData.age = age;
              }
              
              if (decryptedData.gender) patientData.gender = decryptedData.gender;
              
              // For now, set a placeholder diagnosis since diagnosis data is stored separately as conditions
              if (req.user.permissions.viewDiagnoses) {
                patientData.diagnosis = 'Medical conditions available';
              }
              
            } else {
              console.error('Decryption failed for patient:', patient.patientId);
              console.error('Crypto service error:', decryptResponse.data.error);
            }
          } catch (cryptoError) {
            console.error('Error calling crypto service for patient:', patient.patientId);
            console.error('Crypto error details:', cryptoError.message);
            console.error('Request URL:', 'http://cryptography:8000/decrypt');
            console.error('Request data:', JSON.stringify({
              ciphertext: encryptedData.substring(0, 100) + '...',
              private_key: 'dummy_key',
              scheme: 'CP-ABE',
              attributes: req.user.attributes || ['doctor', 'nurse', 'admin']
            }));
          }
        } catch (fileError) {
          // File doesn't exist or can't be read, use mock data
          patientData = {
            patientId: patient.patientId,
            name: `Patient ${patient.patientId.split('-')[1]}`,
            cpf: '000.000.000-00',
            age: 25 + Math.floor(Math.random() * 50),
            gender: Math.random() > 0.5 ? 'Female' : 'Male',
            diagnosis: 'General consultation',
            lastVisit: patient.last_accessed ? new Date(patient.last_accessed).toLocaleDateString() : 'Never'
          };
        }

        return patientData;
      } catch (error) {
        console.error(`Error processing patient ${patient.patientId}:`, error);
        return {
          patientId: patient.patientId,
          name: null,
          cpf: null,
          age: null,
          gender: null,
          diagnosis: null,
          lastVisit: 'Error'
        };
      }
    }));

    // Log access
    await AccessLog.create({
      patientId: 'ALL',
      action: 'list',
      userId: req.userId,
      userAttributes: req.user.attributes,
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      patients: formattedPatients,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
      userPermissions: req.user.permissions
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /patients/:id - Get a specific patient with decrypted data
app.get('/patients/:id', async (req, res) => {
  try {
    // Check if the parameter looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    
    const whereClause = {
      isActive: true
    };
    
    if (isUUID) {
      whereClause[Op.or] = [
        { id: req.params.id },
        { patientId: req.params.id }
      ];
    } else {
      whereClause.patientId = req.params.id;
    }

    const patientMetadata = await PatientMetadata.findOne({
      where: whereClause
    });

    if (!patientMetadata) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update last accessed time
    await patientMetadata.update({ lastAccessed: new Date() });

    // Decrypt patient data
    const decryptedData = await decryptPatientData(
      patientMetadata.dataFilePath, 
      patientMetadata.encryptionScheme,
      req.user ? req.user.attributes : ['doctor', 'nurse', 'admin']
    );

    // Log access
    await AccessLog.create({
      patientId: patientMetadata.patientId,
      action: 'read',
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      metadata: {
        id: patientMetadata.id,
        patientId: patientMetadata.patientId,
        created_at: patientMetadata.created_at,
        updated_at: patientMetadata.updated_at,
        last_accessed: patientMetadata.lastAccessed
      },
      data: decryptedData
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    
    // Log failed access
    await AccessLog.create({
      patientId: req.params.id,
      action: 'read',
      accessGranted: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /patients - Create a new patient with encrypted storage
app.post('/patients', checkUserPermissions('editPatients'), async (req, res) => {
  try {
    const patientId = generatePatientId();
    const patientData = {
      ...req.body,
      patientId: patientId
    };

    // Encrypt and store patient data
    const storageInfo = await encryptAndStorePatientData(patientId, patientData);

    // Create metadata record
    const patientMetadata = await PatientMetadata.create({
      patientId: patientId,
      dataFilePath: storageInfo.filePath,
      encryptionScheme: storageInfo.encryptionScheme,
      fileHash: storageInfo.fileHash
    });

    // Create searchable metadata for searchable encryption
    const searchableMetadata = {
      patientId: patientId
    };

    if (patientData.name) {
      searchableMetadata.nameHash = createSearchHash(patientData.name.toLowerCase());
    }
    
    if (patientData.cpf) {
      const cleanCpf = patientData.cpf.replace(/\D/g, '');
      searchableMetadata.cpfHash = createSearchHash(cleanCpf);
    }
    
    if (patientData.birthDate) {
      searchableMetadata.dobHash = createSearchHash(patientData.birthDate);
    }

    await SearchableMetadata.create(searchableMetadata);

    // Log creation
    await AccessLog.create({
      patientId: patientId,
      action: 'create',
      userId: req.userId,
      userAttributes: req.user.attributes,
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Patient created successfully',
      patientId: patientId,
      metadata: {
        id: patientMetadata.id,
        patientId: patientMetadata.patientId,
        created_at: patientMetadata.created_at
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Log failed creation
    await AccessLog.create({
      patientId: 'UNKNOWN',
      action: 'create',
      userId: req.userId || 'unknown',
      userAttributes: req.user?.attributes || [],
      accessGranted: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /patients/:id - Update a patient with re-encryption
app.put('/patients/:id', async (req, res) => {
  try {
    // Check if the parameter looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    
    const whereClause = {
      isActive: true
    };
    
    if (isUUID) {
      whereClause[Op.or] = [
        { id: req.params.id },
        { patientId: req.params.id }
      ];
    } else {
      whereClause.patientId = req.params.id;
    }

    const patientMetadata = await PatientMetadata.findOne({
      where: whereClause
    });

    if (!patientMetadata) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Decrypt existing data
    const existingData = await decryptPatientData(
      patientMetadata.dataFilePath,
      patientMetadata.encryptionScheme
    );

    // Merge with new data
    const updatedData = { ...existingData, ...req.body };

    // Re-encrypt and store updated data
    const storageInfo = await encryptAndStorePatientData(
      patientMetadata.patientId, 
      updatedData,
      patientMetadata.encryptionScheme
    );

    // Update metadata
    await patientMetadata.update({
      fileHash: storageInfo.fileHash,
      updated_at: new Date()
    });

    // Log update
    await AccessLog.create({
      patientId: patientMetadata.patientId,
      action: 'update',
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Patient updated successfully',
      patientId: patientMetadata.patientId
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Log failed update
    await AccessLog.create({
      patientId: req.params.id,
      action: 'update',
      accessGranted: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /patients/:id - Soft delete a patient (mark as inactive)
app.delete('/patients/:id', async (req, res) => {
  try {
    // Check if the parameter looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id);
    
    const whereClause = {
      isActive: true
    };
    
    if (isUUID) {
      whereClause[Op.or] = [
        { id: req.params.id },
        { patientId: req.params.id }
      ];
    } else {
      whereClause.patientId = req.params.id;
    }

    const patientMetadata = await PatientMetadata.findOne({
      where: whereClause
    });

    if (!patientMetadata) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft delete - mark as inactive
    await patientMetadata.update({ isActive: false });

    // Log deletion
    await AccessLog.create({
      patientId: patientMetadata.patientId,
      action: 'delete',
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Patient deleted successfully',
      patientId: patientMetadata.patientId
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    
    // Log failed deletion
    await AccessLog.create({
      patientId: req.params.id,
      action: 'delete',
      accessGranted: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /patients/search - Search patients using searchable encryption
app.post('/patients/search', checkUserPermissions('searchPatients'), async (req, res) => {
  try {
    const { name, cpf } = req.body;
    
    if (!name && !cpf) {
      return res.status(400).json({ 
        error: 'At least one search parameter (name or cpf) is required' 
      });
    }

    const searchHashes = [];
    const searchParams = {};

    // Create searchable hashes
    if (name) {
      const nameHash = createSearchHash(name.toLowerCase());
      searchParams.nameHash = nameHash;
      searchHashes.push(nameHash);
    }

    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, ''); // Remove non-digits
      const cpfHash = createSearchHash(cleanCpf);
      searchParams.cpfHash = cpfHash;
      searchHashes.push(cpfHash);
    }

    // Search in searchable metadata
    const whereClause = {
      [Op.or]: []
    };

    if (searchParams.nameHash) {
      whereClause[Op.or].push({ nameHash: searchParams.nameHash });
    }
    if (searchParams.cpfHash) {
      whereClause[Op.or].push({ cpfHash: searchParams.cpfHash });
    }

    // First try to find via searchable metadata
    let searchResults = [];
    try {
      searchResults = await SearchableMetadata.findAll({
        where: whereClause,
        include: [{
          model: PatientMetadata,
          where: { isActive: true },
          attributes: ['id', 'patientId', 'created_at', 'updated_at', 'last_accessed']
        }]
      });
    } catch (associationError) {
      console.log('Association search failed, trying direct approach:', associationError.message);
      
      // Fallback: Find searchable metadata first, then join manually
      const metadataResults = await SearchableMetadata.findAll({
        where: whereClause
      });
      
      if (metadataResults.length > 0) {
        const patientIds = metadataResults.map(m => m.patientId);
        const patients = await PatientMetadata.findAll({
          where: {
            patientId: { [Op.in]: patientIds },
            isActive: true
          },
          attributes: ['id', 'patientId', 'created_at', 'updated_at', 'last_accessed']
        });
        
        // Manually create the result structure
        searchResults = metadataResults.map(meta => {
          const patient = patients.find(p => p.patientId === meta.patientId);
          return patient ? { PatientMetadatum: patient } : null;
        }).filter(Boolean);
      }
    }

    // Format results with decrypted data (based on user permissions)
    const formattedResults = await Promise.all(searchResults.map(async (result) => {
      const patient = result.PatientMetadatum;
      
      try {
        // Try to load and decrypt patient data
        const patientDir = path.join(STORAGE_PATH, 'patients', patient.patientId);
        const dataFile = path.join(patientDir, 'data.encrypted');
        
        let patientData = {
          patientId: patient.patientId,
          name: null,
          cpf: null,
          age: null,
          gender: null,
          lastVisit: patient.last_accessed ? new Date(patient.last_accessed).toLocaleDateString() : 'Never'
        };

        // Check if user has permission to view demographics
        if (req.user.permissions.viewDemographics) {
          try {
            const encryptedData = await fs.readFile(dataFile, 'utf8');
            
            // Simulate decryption based on user attributes
            if (req.user.attributes.includes('admin') || 
                req.user.attributes.includes('doctor') || 
                req.user.attributes.includes('nurse') ||
                req.user.attributes.includes('receptionist')) {
              
              // Mock decrypted data
              const mockData = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
              if (mockData.name) patientData.name = mockData.name;
              if (mockData.cpf) patientData.cpf = mockData.cpf;
              if (mockData.age) patientData.age = mockData.age;
              if (mockData.gender) patientData.gender = mockData.gender;
            }
          } catch (fileError) {
            // Use mock data if file doesn't exist
            patientData = {
              patientId: patient.patientId,
              name: `Patient ${patient.patientId.split('-')[1]}`,
              cpf: '000.000.000-00',
              age: 25 + Math.floor(Math.random() * 50),
              gender: Math.random() > 0.5 ? 'Female' : 'Male',
              lastVisit: patient.last_accessed ? new Date(patient.last_accessed).toLocaleDateString() : 'Never'
            };
          }
        }

        return patientData;
      } catch (error) {
        console.error(`Error processing search result for patient ${patient.patientId}:`, error);
        return {
          patientId: patient.patientId,
          name: null,
          cpf: null,
          age: null,
          gender: null,
          lastVisit: 'Error'
        };
      }
    }));

    // Log search
    await AccessLog.create({
      patientId: 'SEARCH',
      action: 'search',
      userId: req.userId,
      userAttributes: req.user.attributes,
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      results: formattedResults,
      searchParams: { name, cpf },
      total: formattedResults.length,
      userPermissions: req.user.permissions
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    
    // Log failed search
    await AccessLog.create({
      patientId: 'SEARCH',
      action: 'search',
      userId: req.userId || 'unknown',
      userAttributes: req.user?.attributes || [],
      accessGranted: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /secure - Secure endpoint for encrypting sensitive medical data
app.post('/secure', async (req, res) => {
  try {
    const { patientId, sensitiveData, recordType = 'medical_record', accessPolicy } = req.body;

    if (!patientId || !sensitiveData) {
      return res.status(400).json({ 
        error: 'patientId and sensitiveData are required' 
      });
    }

    // Find the patient metadata
    const patientMetadata = await PatientMetadata.findOne({
      where: { patientId: patientId, isActive: true }
    });
    
    if (!patientMetadata) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Prepare data for encryption
    const dataToEncrypt = {
      patientId: patientId,
      recordType: recordType,
      sensitiveData: sensitiveData,
      timestamp: new Date().toISOString()
    };

    // Send encryption request to cryptography service
    console.log(`🔐 Sending encryption request to: ${CRYPTO_SERVICE_URL}/encrypt`);

    const encryptionResponse = await axios.post(`${CRYPTO_SERVICE_URL}/encrypt`, {
      data: JSON.stringify(dataToEncrypt),
      scheme: 'CP-ABE',
      policy: accessPolicy || `patient:${patientId} AND (doctor OR nurse)`
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!encryptionResponse.data.success) {
      throw new Error('Encryption failed: ' + encryptionResponse.data.error);
    }

    // Generate unique filename for this record
    const recordId = uuidv4();
    const fileName = `${recordType}_${recordId}.encrypted`;
    const patientDir = await ensurePatientDirectory(patientId);
    const recordFilePath = path.join(patientDir, fileName);
    
    // Store encrypted data to file
    await fs.writeFile(recordFilePath, encryptionResponse.data.result);
    const fileHash = calculateFileHash(encryptionResponse.data.result);

    // Store medical record metadata
    const medicalRecord = await MedicalRecordMetadata.create({
      patientId: patientId,
      recordType: recordType,
      dataFilePath: `/storage/patients/${patientId}/${fileName}`,
      encryptionScheme: 'CP-ABE',
      accessPolicy: accessPolicy || `patient:${patientId} AND (doctor OR nurse)`,
      fileHash: fileHash
    });

    // Log access
    await AccessLog.create({
      patientId: patientId,
      recordId: medicalRecord.id,
      action: 'create_record',
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Medical record encrypted and stored successfully',
      patientId: patientId,
      recordId: medicalRecord.id,
      recordType: recordType,
      encryptionTimestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in secure endpoint:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cryptography service unavailable',
        details: 'Could not connect to encryption service'
      });
    }

    res.status(500).json({ 
      error: 'Failed to encrypt and store data',
      details: error.message 
    });
  }
});

// GET /medical-records/:patientId - Get all medical records for a patient
app.get('/medical-records/:patientId', async (req, res) => {
  try {
    const records = await MedicalRecordMetadata.findAll({
      where: { 
        patientId: req.params.patientId,
        isActive: true 
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      patientId: req.params.patientId,
      totalRecords: records.length,
      records: records.map(record => ({
        id: record.id,
        recordType: record.recordType,
        created_at: record.created_at,
        updated_at: record.updated_at,
        encryptionScheme: record.encryptionScheme
      }))
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /medical-records/:patientId/:recordId - Get specific medical record with decryption
app.get('/medical-records/:patientId/:recordId', async (req, res) => {
  try {
    const record = await MedicalRecordMetadata.findOne({
      where: { 
        id: req.params.recordId,
        patientId: req.params.patientId,
        isActive: true 
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Decrypt record data
    const decryptedData = await decryptPatientData(
      record.dataFilePath,
      record.encryptionScheme
    );

    // Log access
    await AccessLog.create({
      patientId: req.params.patientId,
      recordId: record.id,
      action: 'read_record',
      accessGranted: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      metadata: {
        id: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        created_at: record.created_at,
        updated_at: record.updated_at
      },
      data: decryptedData
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Sync database models (create tables if they don't exist)
    // Use force: true in development to recreate tables, alter: true in production
    const syncOptions = process.env.NODE_ENV === 'production' ? { alter: true } : { alter: true };
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized');

    // Create indexes for performance
    try {
      // Wait a moment for tables to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_searchable_metadata_name_hash 
        ON searchable_metadata(name_hash);
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_searchable_metadata_cpf_hash 
        ON searchable_metadata(cpf_hash);
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_patient_metadata_patient_id 
        ON patient_metadata(patient_id);
      `);
      
      console.log('✅ Database indexes created successfully');
    } catch (indexError) {
      console.log('⚠️  Index creation failed (may already exist):', indexError.message);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 MACHS EHR System running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`👥 Patients API: http://localhost:${PORT}/patients`);
      console.log(`🔐 Secure API: http://localhost:${PORT}/secure`);
      console.log(`🏥 FHIR API: http://localhost:${PORT}/fhir/metadata`);
      console.log(`👤 FHIR Patients: http://localhost:${PORT}/fhir/Patient`);
      console.log(`🏥 Medical Records API: http://localhost:${PORT}/medical-records`);
      console.log(`🔗 Crypto Service URL: ${CRYPTO_SERVICE_URL}`);
      console.log(`💾 Storage Path: ${STORAGE_PATH}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  sequelize.close().then(() => {
    console.log('PostgreSQL connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  sequelize.close().then(() => {
    console.log('PostgreSQL connection closed.');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;