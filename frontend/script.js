// MACHS Frontend JavaScript
class MachsAPI {
    constructor() {
        this.ehrBaseUrl = 'http://localhost:3001';
        this.cryptoBaseUrl = 'http://localhost:8000';
        this.init();
    }

    async init() {
        await this.checkServiceStatus();
        await this.loadPatients();
    }

    // Service Status Checking
    async checkServiceStatus() {
        await this.checkEHRStatus();
        await this.checkCryptoStatus();
    }

    async checkEHRStatus() {
        const statusElement = document.getElementById('ehr-status');
        try {
            const response = await fetch(`${this.ehrBaseUrl}/health`);
            if (response.ok) {
                statusElement.textContent = 'Online';
                statusElement.className = 'status-indicator online';
            } else {
                throw new Error('Service unavailable');
            }
        } catch (error) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-indicator offline';
        }
    }

    async checkCryptoStatus() {
        const statusElement = document.getElementById('crypto-status');
        try {
            const response = await fetch(`${this.cryptoBaseUrl}/health`);
            if (response.ok) {
                statusElement.textContent = 'Online';
                statusElement.className = 'status-indicator online';
            } else {
                throw new Error('Service unavailable');
            }
        } catch (error) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-indicator offline';
        }
    }

    // Patient Management
    async loadPatients() {
        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients`);
            if (!response.ok) throw new Error('Failed to load patients');
            
            const data = await response.json();
            this.displayPatients(data.patients || []);
        } catch (error) {
            console.error('Error loading patients:', error);
            this.showAlert('Failed to load patients', 'error');
        }
    }

    displayPatients(patients) {
        const patientsList = document.getElementById('patients-list');
        
        if (!patients || patients.length === 0) {
            patientsList.innerHTML = '<p class="no-data">No patients found. Create your first patient above.</p>';
            return;
        }

        patientsList.innerHTML = patients.map(patient => `
            <div class="patient-item" data-id="${patient.patientId}">
                <h4>${patient.name || 'Unknown Name'}</h4>
                <p><strong>ID:</strong> ${patient.patientId}</p>
                <p><strong>Age:</strong> ${patient.age || 'N/A'}</p>
                <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
                <p><strong>Diagnosis:</strong> ${patient.diagnosis || 'N/A'}</p>
                <p><strong>Created:</strong> ${new Date(patient.createdAt).toLocaleDateString()}</p>
                <div class="patient-actions">
                    <button class="view-btn" onclick="api.viewPatient('${patient.patientId}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="edit-btn" onclick="api.editPatient('${patient.patientId}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="api.deletePatient('${patient.patientId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async createPatient(patientData) {
        try {
            // First, encrypt the sensitive data
            const encryptedData = await this.encryptData(
                JSON.stringify({
                    name: patientData.name,
                    age: patientData.age,
                    gender: patientData.gender,
                    diagnosis: patientData.diagnosis
                }),
                patientData.policy,
                'CP-ABE'
            );

            if (!encryptedData.success) {
                throw new Error('Failed to encrypt patient data');
            }

            // Then create the patient record
            const response = await fetch(`${this.ehrBaseUrl}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientData: {
                        name: patientData.name,
                        age: patientData.age,
                        gender: patientData.gender,
                        diagnosis: patientData.diagnosis
                    },
                    encryptionPolicy: patientData.policy,
                    encryptionScheme: 'CP-ABE'
                })
            });

            if (!response.ok) throw new Error('Failed to create patient');
            
            const result = await response.json();
            this.showAlert('Patient created successfully with encrypted data', 'success');
            await this.loadPatients();
            return result;
        } catch (error) {
            console.error('Error creating patient:', error);
            this.showAlert(`Failed to create patient: ${error.message}`, 'error');
            throw error;
        }
    }

    async viewPatient(patientId) {
        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientId}`);
            if (!response.ok) throw new Error('Failed to load patient');
            
            const data = await response.json();
            
            // Show patient data in a modal or new section
            this.showPatientDetails(data);
        } catch (error) {
            console.error('Error viewing patient:', error);
            this.showAlert(`Failed to load patient: ${error.message}`, 'error');
        }
    }

    showPatientDetails(patientData) {
        // Create a simple modal to show patient details
        const modalHtml = `
            <div class="modal" id="patient-details-modal" style="display: block;">
                <div class="modal-content">
                    <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                    <h3>Patient Details</h3>
                    <div class="patient-details">
                        <p><strong>ID:</strong> ${patientData.patientId}</p>
                        <p><strong>Name:</strong> ${patientData.name || 'N/A'}</p>
                        <p><strong>Age:</strong> ${patientData.age || 'N/A'}</p>
                        <p><strong>Gender:</strong> ${patientData.gender || 'N/A'}</p>
                        <p><strong>Diagnosis:</strong> ${patientData.diagnosis || 'N/A'}</p>
                        <p><strong>Created:</strong> ${new Date(patientData.createdAt).toLocaleString()}</p>
                        <p><strong>Encryption:</strong> ${patientData.encryptionScheme || 'N/A'}</p>
                        <p><strong>File Path:</strong> ${patientData.dataFilePath || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('patient-details-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async editPatient(patientId) {
        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientId}`);
            if (!response.ok) throw new Error('Failed to load patient');
            
            const patient = await response.json();
            
            // Populate edit form
            document.getElementById('edit-patient-id').value = patient.patientId;
            document.getElementById('edit-patient-name').value = patient.name || '';
            document.getElementById('edit-patient-age').value = patient.age || '';
            document.getElementById('edit-patient-gender').value = patient.gender || '';
            document.getElementById('edit-patient-diagnosis').value = patient.diagnosis || '';
            
            // Show modal
            document.getElementById('edit-patient-modal').style.display = 'block';
        } catch (error) {
            console.error('Error loading patient for edit:', error);
            this.showAlert(`Failed to load patient: ${error.message}`, 'error');
        }
    }

    async updatePatient(patientData) {
        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientData: {
                        name: patientData.name,
                        age: patientData.age,
                        gender: patientData.gender,
                        diagnosis: patientData.diagnosis
                    }
                })
            });

            if (!response.ok) throw new Error('Failed to update patient');
            
            this.showAlert('Patient updated successfully', 'success');
            document.getElementById('edit-patient-modal').style.display = 'none';
            await this.loadPatients();
        } catch (error) {
            console.error('Error updating patient:', error);
            this.showAlert(`Failed to update patient: ${error.message}`, 'error');
        }
    }

    async deletePatient(patientId) {
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete patient');
            
            this.showAlert('Patient deleted successfully', 'success');
            await this.loadPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showAlert(`Failed to delete patient: ${error.message}`, 'error');
        }
    }

    // Encryption Operations
    async encryptData(data, policy, scheme) {
        try {
            const response = await fetch(`${this.cryptoBaseUrl}/encrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: data,
                    policy: policy,
                    scheme: scheme
                })
            });

            if (!response.ok) throw new Error('Encryption request failed');
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error encrypting data:', error);
            return { success: false, error: error.message };
        }
    }

    async decryptData(ciphertext, privateKey, scheme) {
        try {
            const response = await fetch(`${this.cryptoBaseUrl}/decrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ciphertext: ciphertext,
                    private_key: privateKey,
                    scheme: scheme
                })
            });

            if (!response.ok) throw new Error('Decryption request failed');
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error decrypting data:', error);
            return { success: false, error: error.message };
        }
    }

    async generateKeys(attributes, scheme) {
        try {
            const response = await fetch(`${this.cryptoBaseUrl}/generate-keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attributes: attributes,
                    scheme: scheme
                })
            });

            if (!response.ok) throw new Error('Key generation request failed');
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error generating keys:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility Methods
    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert ${type}" style="position: fixed; top: 20px; right: 20px; z-index: 1001; min-width: 300px;">
                ${message}
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: inherit; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) alert.remove();
        }, 5000);
    }

    displayResult(containerId, result, isSuccess = true) {
        const container = document.getElementById(containerId);
        const resultClass = isSuccess ? (result.success ? 'success' : 'error') : 'error';
        
        container.className = `results-box ${resultClass}`;
        
        // Handle JSON formatting for decrypted results
        if (containerId === 'decryption-results' && result.success && result.result) {
            try {
                const parsed = JSON.parse(result.result);
                container.className += ' json decrypted';
                container.textContent = JSON.stringify(parsed, null, 2);
            } catch (e) {
                container.textContent = result.result;
            }
        } else if (containerId === 'encryption-results' && result.success) {
            container.className += ' encrypted';
            container.textContent = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        } else {
            container.textContent = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        }
        
        // Show action buttons if encryption/decryption was successful
        if (result.success) {
            const actionButtons = document.getElementById(containerId.replace('-results', '-actions'));
            if (actionButtons) {
                actionButtons.style.display = 'block';
            }
        }
    }

    displayAccessStatus(hasAccess, message, policy = null) {
        const statusElement = document.getElementById('access-status');
        
        if (hasAccess) {
            statusElement.className = 'access-status access-granted';
            statusElement.innerHTML = `<i class="fas fa-check-circle"></i> Access Granted: ${message}`;
        } else {
            statusElement.className = 'access-status access-denied';
            statusElement.innerHTML = `<i class="fas fa-times-circle"></i> Access Denied: ${message}`;
        }
        
        if (policy) {
            statusElement.innerHTML += `<br><small>Policy: ${policy}</small>`;
        }
    }

    async validateAccessPolicy(userAttributes, policy) {
        // Simple policy validation simulation
        // In a real implementation, this would use proper policy evaluation
        const attributes = userAttributes.split(',').map(attr => attr.trim());
        
        // For simulation, check if any required attributes are present
        if (policy.includes('role:doctor') && attributes.some(attr => attr.includes('role:doctor'))) {
            return { hasAccess: true, reason: 'Doctor role found' };
        }
        
        if (policy.includes('role:admin') && attributes.some(attr => attr.includes('role:admin'))) {
            return { hasAccess: true, reason: 'Admin role found' };
        }
        
        if (policy.includes('role:nurse') && attributes.some(attr => attr.includes('role:nurse'))) {
            return { hasAccess: true, reason: 'Nurse role found' };
        }
        
        return { hasAccess: false, reason: 'Required attributes not found' };
    }
}

// Initialize API
const api = new MachsAPI();

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to selected button
    event.target.classList.add('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Create Patient Form
    document.getElementById('create-patient-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const patientData = {
            name: document.getElementById('patient-name').value,
            age: parseInt(document.getElementById('patient-age').value),
            gender: document.getElementById('patient-gender').value,
            diagnosis: document.getElementById('patient-diagnosis').value,
            policy: document.getElementById('encryption-policy').value || '(role:doctor)'
        };
        
        await api.createPatient(patientData);
        this.reset();
    });

    // Edit Patient Form
    document.getElementById('edit-patient-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const patientData = {
            id: document.getElementById('edit-patient-id').value,
            name: document.getElementById('edit-patient-name').value,
            age: parseInt(document.getElementById('edit-patient-age').value),
            gender: document.getElementById('edit-patient-gender').value,
            diagnosis: document.getElementById('edit-patient-diagnosis').value
        };
        
        await api.updatePatient(patientData);
    });

    // Encryption Form
    document.getElementById('encryption-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = document.getElementById('encrypt-data').value;
        const scheme = document.getElementById('encrypt-scheme').value;
        const policy = document.getElementById('encrypt-policy').value;
        
        if (!data || !policy) {
            api.showAlert('Please provide both data and policy', 'warning');
            return;
        }
        
        // Validate JSON if it looks like JSON
        let jsonData = data;
        try {
            if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
                const parsed = JSON.parse(data);
                jsonData = JSON.stringify(parsed); // Ensure valid JSON format
                api.showAlert('JSON data validated successfully', 'info');
            }
        } catch (error) {
            api.showAlert(`Invalid JSON format: ${error.message}`, 'error');
            return;
        }
        
        // Clear previous results
        document.getElementById('encryption-results').textContent = '';
        document.getElementById('encryption-actions').style.display = 'none';
        
        const result = await api.encryptData(jsonData, policy, scheme);
        api.displayResult('encryption-results', result);
        
        if (result.success) {
            api.showAlert('JSON data encrypted successfully with access policy', 'success');
        }
    });

    // Decryption Form
    document.getElementById('decryption-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const ciphertext = document.getElementById('decrypt-ciphertext').value;
        const scheme = document.getElementById('decrypt-scheme').value;
        const attributes = document.getElementById('user-attributes').value;
        
        if (!ciphertext || !attributes) {
            api.showAlert('Please provide both ciphertext and user attributes', 'warning');
            return;
        }
        
        // Clear previous results
        document.getElementById('access-status').innerHTML = '';
        document.getElementById('decryption-results').textContent = '';
        document.getElementById('decryption-actions').style.display = 'none';
        
        try {
            // First check if this looks like encrypted data with a policy
            let extractedPolicy = null;
            try {
                const parsed = JSON.parse(ciphertext);
                if (parsed.policy) {
                    extractedPolicy = parsed.policy;
                }
            } catch (e) {
                // Not JSON, might be raw encrypted data
            }
            
            // Validate access policy if we have one
            if (extractedPolicy) {
                const accessCheck = await api.validateAccessPolicy(attributes, extractedPolicy);
                api.displayAccessStatus(accessCheck.hasAccess, accessCheck.reason, extractedPolicy);
                
                if (!accessCheck.hasAccess) {
                    api.showAlert('Access denied - your attributes do not satisfy the policy', 'error');
                    return;
                }
            } else {
                api.displayAccessStatus(true, 'No specific policy found, attempting decryption');
            }
            
            // Attempt decryption
            const result = await api.decryptData(ciphertext, attributes, scheme);
            api.displayResult('decryption-results', result);
            
            if (result.success) {
                api.showAlert('Data decrypted successfully! Access granted.', 'success');
            } else {
                api.showAlert('Decryption failed - check if your attributes match the policy', 'error');
            }
        } catch (error) {
            api.showAlert(`Error during decryption: ${error.message}`, 'error');
        }
    });

    // Key Generation Form
    document.getElementById('key-generation-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const attributesStr = document.getElementById('key-attributes').value;
        const scheme = document.getElementById('key-scheme').value;
        
        if (!attributesStr) {
            api.showAlert('Please provide attributes for key generation', 'warning');
            return;
        }
        
        const attributes = attributesStr.split(',').map(attr => attr.trim());
        const result = await api.generateKeys(attributes, scheme);
        api.displayResult('key-results', result);
        
        if (result.success) {
            api.showAlert('Keys generated successfully', 'success');
        }
    });

    // Modal close functionality
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('edit-patient-modal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('edit-patient-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Utility function to refresh patients list
function loadPatients() {
    api.loadPatients();
}

// JSON Validation and Formatting
function validateAndFormatJSON(textareaId) {
    const textarea = document.getElementById(textareaId);
    const data = textarea.value.trim();
    
    if (!data) {
        api.showAlert('Please enter some data first', 'warning');
        return;
    }
    
    try {
        const parsed = JSON.parse(data);
        textarea.value = JSON.stringify(parsed, null, 2);
        api.showAlert('JSON is valid and formatted!', 'success');
    } catch (error) {
        api.showAlert(`Invalid JSON: ${error.message}`, 'error');
    }
}

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        api.showAlert('Copied to clipboard!', 'success');
    }).catch(err => {
        api.showAlert('Failed to copy to clipboard', 'error');
    });
}

// Transfer encrypted data to decryption tab
function transferToDecryption() {
    const encryptedData = document.getElementById('encryption-results').textContent;
    const scheme = document.getElementById('encrypt-scheme').value;
    
    // Switch to decryption tab
    showTabByName('decryption');
    
    // Fill in the data
    document.getElementById('decrypt-ciphertext').value = encryptedData;
    document.getElementById('decrypt-scheme').value = scheme;
    
    api.showAlert('Encrypted data transferred to decryption tab', 'info');
}

// Set user attributes presets
function setAttributes(attributes) {
    document.getElementById('user-attributes').value = attributes;
    api.showAlert(`Attributes set: ${attributes}`, 'info');
}

// Load sample encrypted data
function loadSampleEncryptedData() {
    const sampleData = `{
  "scheme": "CP-ABE",
  "policy": "(role:doctor AND department:cardiology)",
  "encrypted_data": "ENC_CP-ABE_eyJzY2hlbWUiOiJDUC1BQkUiLCJwb2xpY3kiOiIocm9sZTpkb2N0b3IgQU5EIGRlcGFydG1lbnQ6Y2FyZGlvbG9neSkiLCJkYXRhIjoie1xcXCJwYXRpZW50SWRcXFwiOlxcXCJQQVQtU0FNUExFLTAwMVxcXCIsXFxcIm5hbWVcXFwiOlxcXCJKb2huIERvZVxcXCIsXFxcImFnZVxcXCI6NDUsXFxcImdlbmRlclxcXCI6XFxcIm1hbGVcXFwiLFxcXCJkaWFnbm9zaXNcXFwiOlxcXCJIeXBlcnRlbnNpb25cXFwifSIsXCJlbmNyeXB0ZWRcIjp0cnVlLFwidGltZXN0YW1wXCI6XCIyMDI1LTAxLTA4VDEwOjMwOjAwWlwifQ==",
  "timestamp": "2025-01-08T10:30:00Z"
}`;
    
    document.getElementById('decrypt-ciphertext').value = sampleData;
    api.showAlert('Sample encrypted data loaded', 'info');
}

// Load sample JSON data for encryption
function loadSampleJSONData() {
    const sampleData = `{
  "patientId": "PAT-SAMPLE-001",
  "name": "John Doe",
  "age": 45,
  "gender": "male",
  "diagnosis": "Hypertension",
  "bloodPressure": {
    "systolic": 140,
    "diastolic": 90
  },
  "medications": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "once daily"
    }
  ],
  "lastVisit": "2025-01-07",
  "nextAppointment": "2025-02-07",
  "notes": "Patient responding well to medication. Continue current treatment."
}`;
    
    document.getElementById('encrypt-data').value = sampleData;
    api.showAlert('Sample JSON data loaded', 'info');
}

// Format decrypted JSON
function formatDecryptedJSON() {
    const resultsElement = document.getElementById('decryption-results');
    const data = resultsElement.textContent;
    
    try {
        const parsed = JSON.parse(data);
        resultsElement.textContent = JSON.stringify(parsed, null, 2);
        resultsElement.className += ' json-formatted';
        api.showAlert('JSON formatted successfully', 'success');
    } catch (error) {
        api.showAlert('Data is not valid JSON', 'warning');
    }
}

// Enhanced tab switching function
function showTabByName(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to corresponding button
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}