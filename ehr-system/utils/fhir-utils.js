/**
 * FHIR (Fast Healthcare Interoperability Resources) Utilities
 * Provides validation and utility functions for FHIR resources
 */

/**
 * Validate FHIR Patient resource
 * @param {Object} patient - FHIR Patient resource
 * @returns {boolean} - True if valid
 */
function validatePatient(patient) {
  if (!patient || patient.resourceType !== 'Patient') {
    return false;
  }
  
  // Required fields according to FHIR specification
  if (!patient.id) {
    return false;
  }
  
  return true;
}

/**
 * Validate FHIR Condition resource
 * @param {Object} condition - FHIR Condition resource
 * @returns {boolean} - True if valid
 */
function validateCondition(condition) {
  if (!condition || condition.resourceType !== 'Condition') {
    return false;
  }
  
  // Required fields
  if (!condition.id || !condition.subject) {
    return false;
  }
  
  return true;
}

/**
 * Validate FHIR Encounter resource
 * @param {Object} encounter - FHIR Encounter resource
 * @returns {boolean} - True if valid
 */
function validateEncounter(encounter) {
  if (!encounter || encounter.resourceType !== 'Encounter') {
    return false;
  }
  
  // Required fields
  if (!encounter.id || !encounter.status || !encounter.subject) {
    return false;
  }
  
  return true;
}

/**
 * Extract patient ID from FHIR reference
 * @param {string} reference - FHIR reference (e.g., "Patient/patient-a")
 * @returns {string} - Patient ID
 */
function extractPatientId(reference) {
  if (!reference) return null;
  
  if (typeof reference === 'string') {
    return reference.replace('Patient/', '');
  }
  
  if (reference.reference) {
    return reference.reference.replace('Patient/', '');
  }
  
  return null;
}

/**
 * Get human readable name from FHIR Patient resource
 * @param {Object} patient - FHIR Patient resource
 * @returns {string} - Formatted name
 */
function getPatientDisplayName(patient) {
  if (!patient.name || !patient.name.length) {
    return 'Unknown Patient';
  }
  
  const officialName = patient.name.find(name => name.use === 'official') || patient.name[0];
  
  let displayName = '';
  if (officialName.given && officialName.given.length) {
    displayName = officialName.given.join(' ');
  }
  
  if (officialName.family) {
    displayName += (displayName ? ' ' : '') + officialName.family;
  }
  
  return displayName || 'Unknown Patient';
}

/**
 * Get primary identifier from FHIR Patient resource
 * @param {Object} patient - FHIR Patient resource
 * @returns {string} - Primary identifier value
 */
function getPatientIdentifier(patient) {
  if (!patient.identifier || !patient.identifier.length) {
    return null;
  }
  
  const primaryId = patient.identifier.find(id => id.use === 'usual') || patient.identifier[0];
  return primaryId.value || null;
}

/**
 * Get condition display name from FHIR Condition resource
 * @param {Object} condition - FHIR Condition resource
 * @returns {string} - Condition display name
 */
function getConditionDisplayName(condition) {
  if (!condition.code || !condition.code.coding || !condition.code.coding.length) {
    return 'Unknown Condition';
  }
  
  const coding = condition.code.coding[0];
  return coding.display || coding.code || 'Unknown Condition';
}

/**
 * Get encounter type display name from FHIR Encounter resource
 * @param {Object} encounter - FHIR Encounter resource
 * @returns {string} - Encounter type display name
 */
function getEncounterDisplayName(encounter) {
  if (!encounter.type || !encounter.type.length || !encounter.type[0].coding) {
    return 'Unknown Encounter';
  }
  
  const coding = encounter.type[0].coding[0];
  return coding.display || coding.code || 'Unknown Encounter';
}

/**
 * Generate a file path for storing FHIR resource
 * @param {string} resourceType - FHIR resource type
 * @param {string} patientId - Patient ID
 * @param {string} resourceId - Resource ID
 * @returns {string} - File path
 */
function generateResourceFilePath(resourceType, patientId, resourceId) {
  const filename = `${resourceType.toLowerCase()}_${resourceId}.encrypted`;
  return `/storage/patients/${patientId}/${filename}`;
}

/**
 * Create a FHIR Bundle for multiple resources
 * @param {Array} resources - Array of FHIR resources
 * @param {string} type - Bundle type (collection, searchset, etc.)
 * @returns {Object} - FHIR Bundle
 */
function createBundle(resources, type = 'collection') {
  return {
    resourceType: 'Bundle',
    id: require('uuid').v4(),
    type: type,
    total: resources.length,
    entry: resources.map(resource => ({
      resource: resource
    }))
  };
}

/**
 * Validate any FHIR resource type
 * @param {Object} resource - FHIR resource
 * @returns {boolean} - True if valid
 */
function validateFHIRResource(resource) {
  if (!resource || !resource.resourceType) {
    return false;
  }
  
  switch (resource.resourceType) {
    case 'Patient':
      return validatePatient(resource);
    case 'Condition':
      return validateCondition(resource);
    case 'Encounter':
      return validateEncounter(resource);
    default:
      // Basic validation for unknown resource types
      return !!resource.id;
  }
}

module.exports = {
  validatePatient,
  validateCondition,
  validateEncounter,
  validateFHIRResource,
  extractPatientId,
  getPatientDisplayName,
  getPatientIdentifier,
  getConditionDisplayName,
  getEncounterDisplayName,
  generateResourceFilePath,
  createBundle
};