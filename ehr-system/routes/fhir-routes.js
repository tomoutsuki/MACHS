/**
 * FHIR API Routes
 * RESTful API endpoints following FHIR specification
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const fhirUtils = require('../utils/fhir-utils');

/**
 * Initialize FHIR routes
 * @param {Object} models - Database models
 * @param {Object} config - Configuration object
 * @returns {express.Router} - Express router with FHIR routes
 */
function initializeFHIRRoutes(models, config) {
  const router = express.Router();
  const { FHIRResourceMetadata, ResourceReference, FHIRAccessLog, FHIRSearchParameter } = models;
  const { CRYPTO_SERVICE_URL, STORAGE_PATH } = config;

  // Helper function to calculate file hash
  function calculateFileHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Helper function to ensure patient directory exists
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

  // Helper function to encrypt and store FHIR resource
  async function encryptAndStoreFHIRResource(resourceType, patientId, resource, scheme = 'CP-ABE') {
    try {
      // Call cryptography service to encrypt data
      const encryptResponse = await axios.post(`${CRYPTO_SERVICE_URL}/encrypt`, {
        data: JSON.stringify(resource),
        scheme: scheme,
        policy: `${resourceType.toLowerCase()}:${patientId}` // Basic policy
      });

      if (!encryptResponse.data.success) {
        throw new Error('Encryption failed: ' + encryptResponse.data.error);
      }

      // Ensure patient directory exists
      await ensurePatientDirectory(patientId);
      const filePath = fhirUtils.generateResourceFilePath(resourceType, patientId, resource.id);
      const fullPath = path.join(STORAGE_PATH, '..', filePath);
      
      // Store encrypted data to file
      await fs.writeFile(fullPath, encryptResponse.data.result);
      
      // Calculate file hash for integrity
      const fileHash = calculateFileHash(encryptResponse.data.result);
      
      return {
        filePath: filePath,
        fileHash: fileHash,
        encryptionScheme: scheme
      };
    } catch (error) {
      console.error('Error encrypting and storing FHIR resource:', error);
      throw error;
    }
  }

  // Helper function to decrypt FHIR resource
  async function decryptFHIRResource(filePath, scheme = 'CP-ABE') {
    try {
      // Read encrypted file
      const fullPath = path.join(STORAGE_PATH, '..', filePath);
      const encryptedData = await fs.readFile(fullPath, 'utf8');
      
      // Call cryptography service to decrypt data
      const decryptResponse = await axios.post(`${CRYPTO_SERVICE_URL}/decrypt`, {
        ciphertext: encryptedData,
        private_key: 'dummy_key', // TODO: Implement proper key management
        scheme: scheme
      });

      if (!decryptResponse.data.success) {
        throw new Error('Decryption failed: ' + decryptResponse.data.error);
      }

      return JSON.parse(decryptResponse.data.result);
    } catch (error) {
      console.error('Error decrypting FHIR resource:', error);
      throw error;
    }
  }

  // Helper function to extract and store resource references
  async function extractAndStoreReferences(resource) {
    const references = [];
    
    // Extract patient references from subject field
    if (resource.subject) {
      const patientId = fhirUtils.extractPatientId(resource.subject);
      if (patientId) {
        references.push({
          sourceResourceType: resource.resourceType,
          sourceResourceId: resource.id,
          targetResourceType: 'Patient',
          targetResourceId: patientId,
          referenceType: 'subject'
        });
      }
    }

    // Extract encounter references
    if (resource.encounter) {
      const encounterId = resource.encounter.reference ? 
        resource.encounter.reference.replace('Encounter/', '') : 
        resource.encounter;
      
      if (encounterId) {
        references.push({
          sourceResourceType: resource.resourceType,
          sourceResourceId: resource.id,
          targetResourceType: 'Encounter',
          targetResourceId: encounterId,
          referenceType: 'encounter'
        });
      }
    }

    // Store references in database
    for (const ref of references) {
      await ResourceReference.create(ref);
    }

    return references;
  }

  // Helper function to extract and store search parameters
  async function extractAndStoreSearchParameters(resource) {
    const parameters = [];

    // Common parameters for all resources
    parameters.push({
      resourceType: resource.resourceType,
      resourceId: resource.id,
      parameterName: '_id',
      parameterValue: resource.id,
      valueType: 'string'
    });

    // Resource-specific parameters
    switch (resource.resourceType) {
      case 'Patient':
        if (resource.name) {
          resource.name.forEach(name => {
            if (name.family) {
              parameters.push({
                resourceType: resource.resourceType,
                resourceId: resource.id,
                parameterName: 'family',
                parameterValue: name.family,
                valueType: 'string'
              });
            }
            if (name.given) {
              name.given.forEach(given => {
                parameters.push({
                  resourceType: resource.resourceType,
                  resourceId: resource.id,
                  parameterName: 'given',
                  parameterValue: given,
                  valueType: 'string'
                });
              });
            }
          });
        }
        
        if (resource.gender) {
          parameters.push({
            resourceType: resource.resourceType,
            resourceId: resource.id,
            parameterName: 'gender',
            parameterValue: resource.gender,
            valueType: 'string'
          });
        }

        if (resource.birthDate) {
          parameters.push({
            resourceType: resource.resourceType,
            resourceId: resource.id,
            parameterName: 'birthdate',
            parameterValue: resource.birthDate,
            valueType: 'date'
          });
        }
        break;

      case 'Condition':
        if (resource.subject) {
          const patientId = fhirUtils.extractPatientId(resource.subject);
          if (patientId) {
            parameters.push({
              resourceType: resource.resourceType,
              resourceId: resource.id,
              parameterName: 'patient',
              parameterValue: patientId,
              valueType: 'reference'
            });
          }
        }

        if (resource.code && resource.code.coding) {
          resource.code.coding.forEach(coding => {
            if (coding.code) {
              parameters.push({
                resourceType: resource.resourceType,
                resourceId: resource.id,
                parameterName: 'code',
                parameterValue: coding.code,
                valueType: 'token'
              });
            }
          });
        }
        break;

      case 'Encounter':
        if (resource.subject) {
          const patientId = fhirUtils.extractPatientId(resource.subject);
          if (patientId) {
            parameters.push({
              resourceType: resource.resourceType,
              resourceId: resource.id,
              parameterName: 'patient',
              parameterValue: patientId,
              valueType: 'reference'
            });
          }
        }

        if (resource.status) {
          parameters.push({
            resourceType: resource.resourceType,
            resourceId: resource.id,
            parameterName: 'status',
            parameterValue: resource.status,
            valueType: 'string'
          });
        }
        break;
    }

    // Store search parameters in database
    for (const param of parameters) {
      await FHIRSearchParameter.create(param);
    }

    return parameters;
  }

  // FHIR CapabilityStatement endpoint
  router.get('/metadata', (req, res) => {
    const capabilityStatement = {
      resourceType: 'CapabilityStatement',
      id: 'machs-ehr-capability',
      status: 'active',
      date: new Date().toISOString(),
      publisher: 'MACHS EHR System',
      kind: 'instance',
      software: {
        name: 'MACHS EHR System',
        version: '1.0.0'
      },
      implementation: {
        description: 'MACHS EHR System with Attribute-Based Encryption'
      },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [
        {
          mode: 'server',
          resource: [
            {
              type: 'Patient',
              interaction: [
                { code: 'create' },
                { code: 'read' },
                { code: 'update' },
                { code: 'delete' },
                { code: 'search-type' }
              ],
              searchParam: [
                { name: '_id', type: 'token' },
                { name: 'family', type: 'string' },
                { name: 'given', type: 'string' },
                { name: 'gender', type: 'token' },
                { name: 'birthdate', type: 'date' }
              ]
            },
            {
              type: 'Condition',
              interaction: [
                { code: 'create' },
                { code: 'read' },
                { code: 'update' },
                { code: 'delete' },
                { code: 'search-type' }
              ],
              searchParam: [
                { name: '_id', type: 'token' },
                { name: 'patient', type: 'reference' },
                { name: 'code', type: 'token' }
              ]
            },
            {
              type: 'Encounter',
              interaction: [
                { code: 'create' },
                { code: 'read' },
                { code: 'update' },
                { code: 'delete' },
                { code: 'search-type' }
              ],
              searchParam: [
                { name: '_id', type: 'token' },
                { name: 'patient', type: 'reference' },
                { name: 'status', type: 'token' }
              ]
            }
          ]
        }
      ]
    };

    res.json(capabilityStatement);
  });

  // Generic FHIR resource endpoints

  // GET /fhir/{resourceType} - Search resources
  router.get('/:resourceType', async (req, res) => {
    try {
      const { resourceType } = req.params;
      const queryParams = req.query;

      // Build search query based on parameters
      const searchConditions = {
        resourceType: resourceType,
        isActive: true
      };

      // Add patient filter if provided
      if (queryParams.patient) {
        searchConditions.patientId = queryParams.patient;
      }

      // Get metadata records
      const metadataRecords = await FHIRResourceMetadata.findAll({
        where: searchConditions,
        order: [['created_at', 'DESC']]
      });

      // Decrypt and return resources
      const resources = [];
      for (const metadata of metadataRecords) {
        try {
          const resource = await decryptFHIRResource(metadata.dataFilePath, metadata.encryptionScheme);
          resources.push(resource);

          // Log access
          await FHIRAccessLog.create({
            resourceType: metadata.resourceType,
            resourceId: metadata.resourceId,
            patientId: metadata.patientId,
            action: 'search',
            accessGranted: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (error) {
          console.error(`Error decrypting resource ${metadata.resourceId}:`, error);
          // Log failed access
          await FHIRAccessLog.create({
            resourceType: metadata.resourceType,
            resourceId: metadata.resourceId,
            patientId: metadata.patientId,
            action: 'search',
            accessGranted: false,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
      }

      // Return as FHIR Bundle
      const bundle = fhirUtils.createBundle(resources, 'searchset');
      res.json(bundle);

    } catch (error) {
      console.error('Error searching FHIR resources:', error);
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Internal server error'
        }]
      });
    }
  });

  // GET /fhir/{resourceType}/{id} - Read specific resource
  router.get('/:resourceType/:id', async (req, res) => {
    try {
      const { resourceType, id } = req.params;

      // Find metadata record
      const metadata = await FHIRResourceMetadata.findOne({
        where: {
          resourceType: resourceType,
          resourceId: id,
          isActive: true
        }
      });

      if (!metadata) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Resource ${resourceType}/${id} not found`
          }]
        });
      }

      // Decrypt resource
      const resource = await decryptFHIRResource(metadata.dataFilePath, metadata.encryptionScheme);

      // Update last accessed
      await metadata.update({ lastAccessed: new Date() });

      // Log access
      await FHIRAccessLog.create({
        resourceType: metadata.resourceType,
        resourceId: metadata.resourceId,
        patientId: metadata.patientId,
        action: 'read',
        accessGranted: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(resource);

    } catch (error) {
      console.error('Error reading FHIR resource:', error);
      
      // Log failed access
      await FHIRAccessLog.create({
        resourceType: req.params.resourceType,
        resourceId: req.params.id,
        patientId: null,
        action: 'read',
        accessGranted: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Internal server error'
        }]
      });
    }
  });

  // POST /fhir/{resourceType} - Create new resource
  router.post('/:resourceType', async (req, res) => {
    try {
      const { resourceType } = req.params;
      const resource = req.body;

      // Validate resource
      if (!fhirUtils.validateFHIRResource(resource)) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid FHIR resource'
          }]
        });
      }

      // Ensure resource has an ID
      if (!resource.id) {
        resource.id = uuidv4();
      }

      // Validate resource type matches URL
      if (resource.resourceType !== resourceType) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type mismatch'
          }]
        });
      }

      // Extract patient ID for patientId field
      let patientId = null;
      if (resource.resourceType === 'Patient') {
        patientId = resource.id;
      } else if (resource.subject) {
        patientId = fhirUtils.extractPatientId(resource.subject);
      }

      // Check if resource already exists
      const existingMetadata = await FHIRResourceMetadata.findOne({
        where: {
          resourceType: resourceType,
          resourceId: resource.id
        }
      });

      if (existingMetadata) {
        return res.status(409).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'duplicate',
            diagnostics: `Resource ${resourceType}/${resource.id} already exists`
          }]
        });
      }

      // Encrypt and store resource
      const storageInfo = await encryptAndStoreFHIRResource(resourceType, patientId || 'unknown', resource);

      // Create metadata record
      const metadata = await FHIRResourceMetadata.create({
        resourceType: resourceType,
        resourceId: resource.id,
        patientId: patientId,
        dataFilePath: storageInfo.filePath,
        encryptionScheme: storageInfo.encryptionScheme,
        fileHash: storageInfo.fileHash
      });

      // Extract and store references
      await extractAndStoreReferences(resource);

      // Extract and store search parameters
      await extractAndStoreSearchParameters(resource);

      // Log creation
      await FHIRAccessLog.create({
        resourceType: resourceType,
        resourceId: resource.id,
        patientId: patientId,
        action: 'create',
        accessGranted: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(resource);

    } catch (error) {
      console.error('Error creating FHIR resource:', error);
      
      // Log failed creation
      await FHIRAccessLog.create({
        resourceType: req.params.resourceType,
        resourceId: req.body.id || 'unknown',
        patientId: null,
        action: 'create',
        accessGranted: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Internal server error'
        }]
      });
    }
  });

  // PUT /fhir/{resourceType}/{id} - Update resource
  router.put('/:resourceType/:id', async (req, res) => {
    try {
      const { resourceType, id } = req.params;
      const resource = req.body;

      // Validate resource
      if (!fhirUtils.validateFHIRResource(resource)) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid FHIR resource'
          }]
        });
      }

      // Ensure resource ID matches URL
      if (resource.id !== id) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource ID mismatch'
          }]
        });
      }

      // Find existing metadata
      const metadata = await FHIRResourceMetadata.findOne({
        where: {
          resourceType: resourceType,
          resourceId: id,
          isActive: true
        }
      });

      if (!metadata) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Resource ${resourceType}/${id} not found`
          }]
        });
      }

      // Extract patient ID
      let patientId = metadata.patientId;
      if (resource.subject) {
        patientId = fhirUtils.extractPatientId(resource.subject);
      }

      // Re-encrypt and store updated resource
      const storageInfo = await encryptAndStoreFHIRResource(resourceType, patientId || 'unknown', resource, metadata.encryptionScheme);

      // Update metadata
      await metadata.update({
        fileHash: storageInfo.fileHash,
        version: metadata.version + 1,
        lastAccessed: new Date()
      });

      // Update references
      await ResourceReference.destroy({
        where: {
          sourceResourceType: resourceType,
          sourceResourceId: id
        }
      });
      await extractAndStoreReferences(resource);

      // Update search parameters
      await FHIRSearchParameter.destroy({
        where: {
          resourceType: resourceType,
          resourceId: id
        }
      });
      await extractAndStoreSearchParameters(resource);

      // Log update
      await FHIRAccessLog.create({
        resourceType: resourceType,
        resourceId: id,
        patientId: patientId,
        action: 'update',
        accessGranted: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(resource);

    } catch (error) {
      console.error('Error updating FHIR resource:', error);

      // Log failed update
      await FHIRAccessLog.create({
        resourceType: req.params.resourceType,
        resourceId: req.params.id,
        patientId: null,
        action: 'update',
        accessGranted: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Internal server error'
        }]
      });
    }
  });

  // DELETE /fhir/{resourceType}/{id} - Delete resource
  router.delete('/:resourceType/:id', async (req, res) => {
    try {
      const { resourceType, id } = req.params;

      // Find metadata record
      const metadata = await FHIRResourceMetadata.findOne({
        where: {
          resourceType: resourceType,
          resourceId: id,
          isActive: true
        }
      });

      if (!metadata) {
        return res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Resource ${resourceType}/${id} not found`
          }]
        });
      }

      // Soft delete - mark as inactive
      await metadata.update({ isActive: false });

      // Delete references
      await ResourceReference.destroy({
        where: {
          sourceResourceType: resourceType,
          sourceResourceId: id
        }
      });

      // Delete search parameters
      await FHIRSearchParameter.destroy({
        where: {
          resourceType: resourceType,
          resourceId: id
        }
      });

      // Log deletion
      await FHIRAccessLog.create({
        resourceType: resourceType,
        resourceId: id,
        patientId: metadata.patientId,
        action: 'delete',
        accessGranted: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(204).send();

    } catch (error) {
      console.error('Error deleting FHIR resource:', error);

      // Log failed deletion
      await FHIRAccessLog.create({
        resourceType: req.params.resourceType,
        resourceId: req.params.id,
        patientId: null,
        action: 'delete',
        accessGranted: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Internal server error'
        }]
      });
    }
  });

  return router;
}

module.exports = {
  initializeFHIRRoutes
};