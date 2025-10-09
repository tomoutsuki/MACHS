/**
 * FHIR Database Models
 * Extended models to support FHIR resources
 */

const { DataTypes } = require('sequelize');

/**
 * Initialize FHIR models
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Object} - Object containing all models
 */
function initializeFHIRModels(sequelize) {
  
  // FHIR Resource metadata model - stores metadata for any FHIR resource
  const FHIRResourceMetadata = sequelize.define('fhir_resources_metadata', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'resource_id'
    },
    patientId: {
      type: DataTypes.STRING(100),
      allowNull: true, // Some resources might not be patient-specific
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
    accessPolicy: {
      type: DataTypes.TEXT,
      field: 'access_policy'
    },
    fileHash: {
      type: DataTypes.STRING(64),
      field: 'file_hash'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'version'
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
    tableName: 'fhir_resources_metadata',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['resource_type', 'resource_id']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['resource_type']
      }
    ]
  });

  // Patient references model - tracks relationships between resources
  const ResourceReference = sequelize.define('resource_references', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceResourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'source_resource_type'
    },
    sourceResourceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'source_resource_id'
    },
    targetResourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'target_resource_type'
    },
    targetResourceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'target_resource_id'
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'reference_type' // e.g., 'subject', 'patient', 'encounter'
    }
  }, {
    tableName: 'resource_references',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['source_resource_type', 'source_resource_id']
      },
      {
        fields: ['target_resource_type', 'target_resource_id']
      },
      {
        fields: ['reference_type']
      }
    ]
  });

  // Access logs model - enhanced for FHIR resources
  const FHIRAccessLog = sequelize.define('fhir_access_logs', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'resource_id'
    },
    patientId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'patient_id'
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['create', 'read', 'update', 'delete', 'search']]
      }
    },
    accessGranted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'access_granted'
    },
    userId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'user_id'
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    accessPolicy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'access_policy'
    },
    requestDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'request_details'
    }
  }, {
    tableName: 'fhir_access_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['resource_type', 'resource_id']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // FHIR Search parameters model - for advanced search capabilities
  const FHIRSearchParameter = sequelize.define('fhir_search_parameters', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'resource_id'
    },
    parameterName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'parameter_name'
    },
    parameterValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'parameter_value'
    },
    valueType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'value_type', // string, number, date, reference, etc.
      validate: {
        isIn: [['string', 'number', 'date', 'reference', 'token', 'quantity']]
      }
    }
  }, {
    tableName: 'fhir_search_parameters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['resource_type', 'resource_id']
      },
      {
        fields: ['parameter_name', 'parameter_value']
      },
      {
        fields: ['resource_type', 'parameter_name']
      }
    ]
  });

  // Define associations - using loose associations without foreign key constraints
  // to avoid unique constraint issues with composite keys
  
  return {
    FHIRResourceMetadata,
    ResourceReference,
    FHIRAccessLog,
    FHIRSearchParameter
  };
}

module.exports = {
  initializeFHIRModels
};