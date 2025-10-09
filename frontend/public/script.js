// MACHS Frontend JavaScript
class MachsAPI {
    constructor() {
        // Try to get configuration from the frontend server
        this.initConfig();
    }

    async initConfig() {
        try {
            // Try to get config from the frontend API
            const configResponse = await fetch('/api/config');
            if (configResponse.ok) {
                const config = await configResponse.json();
                // When running in browser, always use localhost URLs
                // even when services are running in Docker
                this.ehrBaseUrl = 'http://localhost:3001';
                this.cryptoBaseUrl = 'http://localhost:8000';
            } else {
                throw new Error('Config not available');
            }
        } catch (error) {
            // Fallback to defaults for local development
            this.ehrBaseUrl = 'http://localhost:3001';
            this.cryptoBaseUrl = 'http://localhost:8000';
        }
        
        await this.init();
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
                    <button class="view-btn" data-action="view" data-patient-id="${patient.patientId}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="edit-btn" data-action="edit" data-patient-id="${patient.patientId}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-action="delete" data-patient-id="${patient.patientId}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for patient actions
        patientsList.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('button').dataset.action;
                const patientId = e.target.closest('button').dataset.patientId;
                
                switch(action) {
                    case 'view':
                        this.viewPatient(patientId);
                        break;
                    case 'edit':
                        this.editPatient(patientId);
                        break;
                    case 'delete':
                        this.deletePatient(patientId);
                        break;
                }
            });
        });
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
                    <span class="close" id="close-details-modal">&times;</span>
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
        
        // Add close event listener
        document.getElementById('close-details-modal').addEventListener('click', function() {
            document.getElementById('patient-details-modal').style.display = 'none';
        });
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
        container.textContent = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
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
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Tab button event listeners
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
    
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
        
        const result = await api.encryptData(data, policy, scheme);
        api.displayResult('encryption-results', result);
        
        if (result.success) {
            api.showAlert('Data encrypted successfully', 'success');
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
        
        const result = await api.decryptData(ciphertext, attributes, scheme);
        api.displayResult('decryption-results', result);
        
        if (result.success) {
            api.showAlert('Data decrypted successfully', 'success');
        } else {
            api.showAlert('Decryption failed - check if your attributes match the policy', 'error');
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
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('edit-patient-modal').style.display = 'none';
        });
    }

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