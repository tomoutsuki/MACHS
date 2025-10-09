// MACHS Hospital System JavaScript
class HospitalSystem {
    constructor() {
        // Use environment-appropriate URLs
        this.ehrBaseUrl = this.getApiUrl('EHR_SERVICE_URL', 'http://localhost:3001');
        this.cryptoBaseUrl = this.getApiUrl('CRYPTO_SERVICE_URL', 'http://localhost:8000');
        this.currentUser = null;
        this.userProfiles = {
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
        this.patients = [];
        this.searchIndex = new Map(); // For searchable encryption
        this.init();
    }

    // Helper method to get API URLs (works in both browser and Node.js environments)
    getApiUrl(envVar, fallback) {
        // Try to get from meta tags first
        if (typeof document !== 'undefined') {
            const metaTag = document.querySelector(`meta[name="${envVar.toLowerCase().replace('_', '-')}"]`);
            if (metaTag) {
                return metaTag.getAttribute('content');
            }
        }
        
        // In Docker environment, try to use service discovery
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            // Running in Docker - use internal service names
            if (envVar === 'EHR_SERVICE_URL') {
                return `http://${window.location.hostname}:3001`;
            } else if (envVar === 'CRYPTO_SERVICE_URL') {
                return `http://${window.location.hostname}:8000`;
            }
        }
        
        // Default to localhost for development
        return fallback;
    }

    async init() {
        this.setupEventListeners();
        await this.checkServiceStatus();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('user-select').addEventListener('change', (e) => {
            const loginBtn = document.getElementById('login-btn');
            loginBtn.disabled = !e.target.value;
        });

        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Patient management
        document.getElementById('add-patient-btn').addEventListener('click', () => {
            this.openModal('add-patient-modal');
        });

        document.getElementById('add-patient-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPatient();
        });

        // Search
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchPatients();
        });

        document.getElementById('clear-search-btn').addEventListener('click', () => {
            this.clearSearch();
        });

        // FABEO Testing
        document.getElementById('encrypt-btn').addEventListener('click', () => {
            this.encryptData();
        });

        document.getElementById('decrypt-btn').addEventListener('click', () => {
            this.decryptData();
        });

        document.getElementById('generate-keys-btn').addEventListener('click', () => {
            this.generateKeys();
        });

        document.getElementById('view-keys-btn').addEventListener('click', () => {
            this.viewKeys();
        });

        // Modal handling
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Authentication Methods
    login() {
        const userSelect = document.getElementById('user-select');
        const userId = userSelect.value;
        
        if (!userId || !this.userProfiles[userId]) {
            this.showAlert('Please select a valid user profile', 'error');
            return;
        }

        this.currentUser = { id: userId, ...this.userProfiles[userId] };
        
        // Update UI
        document.getElementById('current-user-name').textContent = this.currentUser.name;
        document.getElementById('current-user-role').textContent = this.currentUser.role;
        
        // Update FABEO attributes
        document.getElementById('user-attributes').value = this.currentUser.attributes.join(', ');
        
        // Show main interface
        document.getElementById('auth-panel').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        
        // Load dashboard data
        this.loadDashboard();
        this.loadPatients();
        
        this.showAlert(`Welcome, ${this.currentUser.name}!`, 'success');
    }

    logout() {
        this.currentUser = null;
        document.getElementById('auth-panel').classList.remove('hidden');
        document.getElementById('main-interface').classList.add('hidden');
        document.getElementById('user-select').value = '';
        document.getElementById('login-btn').disabled = true;
        this.clearAlerts();
    }

    // Service Status Checking
    async checkServiceStatus() {
        await Promise.all([
            this.checkEHRStatus(),
            this.checkCryptoStatus(),
            this.checkABEStatus()
        ]);
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

    async checkABEStatus() {
        const statusElement = document.getElementById('abe-status');
        try {
            const response = await fetch(`${this.cryptoBaseUrl}/schemes`);
            if (response.ok) {
                const data = await response.json();
                if (data.cp_abe && data.kp_abe) {
                    statusElement.textContent = 'Ready';
                    statusElement.className = 'status-indicator online';
                } else {
                    statusElement.textContent = 'Initializing';
                    statusElement.className = 'status-indicator offline';
                }
            } else {
                throw new Error('Service unavailable');
            }
        } catch (error) {
            statusElement.textContent = 'Error';
            statusElement.className = 'status-indicator offline';
        }
    }

    // Dashboard Methods
    async loadDashboard() {
        if (!this.currentUser) return;

        // Update permissions display
        const permissionsElement = document.getElementById('user-permissions');
        const permissions = Object.entries(this.currentUser.permissions)
            .filter(([key, value]) => value)
            .map(([key, value]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());
        
        permissionsElement.innerHTML = permissions.map(perm => 
            `<div>${perm}</div>`
        ).join('');

        // Update stats (will be filled when patients are loaded)
        this.updateDashboardStats();
    }

    updateDashboardStats() {
        if (!this.currentUser) return;

        const totalPatients = this.patients.length;
        const accessibleRecords = this.patients.filter(patient => 
            this.canAccessPatient(patient)).length;
        const restrictedRecords = totalPatients - accessibleRecords;

        document.getElementById('total-patients').textContent = totalPatients;
        document.getElementById('accessible-records').textContent = accessibleRecords;
        document.getElementById('restricted-records').textContent = restrictedRecords;
    }

    // Patient Management
    async loadPatients() {
        if (!this.currentUser) return;

        document.getElementById('patients-loading').classList.remove('hidden');
        
        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients`, {
                headers: {
                    'X-User-Id': this.currentUser.id
                }
            });
            if (!response.ok) throw new Error('Failed to load patients');
            
            const data = await response.json();
            this.patients = data.patients || [];
            
            // Build search index for searchable encryption
            this.buildSearchIndex();
            
            this.displayPatients();
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading patients:', error);
            this.showAlert('Failed to load patients', 'error');
        } finally {
            document.getElementById('patients-loading').classList.add('hidden');
        }
    }

    buildSearchIndex() {
        this.searchIndex.clear();
        
        this.patients.forEach(patient => {
            // Create searchable hashes for name and CPF
            if (patient.name) {
                const nameHash = this.createSearchHash(patient.name.toLowerCase());
                if (!this.searchIndex.has(nameHash)) {
                    this.searchIndex.set(nameHash, []);
                }
                this.searchIndex.get(nameHash).push(patient);
            }
            
            if (patient.cpf) {
                const cpfHash = this.createSearchHash(patient.cpf.replace(/\D/g, ''));
                if (!this.searchIndex.has(cpfHash)) {
                    this.searchIndex.set(cpfHash, []);
                }
                this.searchIndex.get(cpfHash).push(patient);
            }
        });
    }

    createSearchHash(value) {
        // Simple hash function for demonstration
        // In production, use proper cryptographic hash like SHA-256
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    canAccessPatient(patient) {
        if (!this.currentUser) return false;
        
        // Admin can access everything
        if (this.currentUser.permissions.viewPatients && 
            this.currentUser.attributes.includes('admin')) {
            return true;
        }
        
        // Other users have limited access based on their role
        return this.currentUser.permissions.viewPatients;
    }

    displayPatients() {
        const tbody = document.getElementById('patients-table-body');
        
        if (!this.patients || this.patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No patients found</td></tr>';
            return;
        }

        tbody.innerHTML = this.patients.map(patient => {
            const canAccess = this.canAccessPatient(patient);
            const canViewDiagnoses = this.currentUser.permissions.viewDiagnoses;
            const canViewDemographics = this.currentUser.permissions.viewDemographics;
            
            return `
                <tr>
                    <td>${patient.patientId || 'N/A'}</td>
                    <td>${canViewDemographics ? (patient.name || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                    <td>${canViewDemographics ? (patient.cpf || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                    <td>${canViewDemographics ? (patient.age || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                    <td>${canViewDemographics ? (patient.gender || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                    <td>${canViewDiagnoses ? (patient.diagnosis || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                    <td>${patient.lastVisit || 'Never'}</td>
                    <td>
                        <button class="action-btn" onclick="hospitalSystem.viewPatient('${patient.patientId}')" 
                                ${!canAccess ? 'disabled' : ''}>
                            <i class="fas fa-eye"></i>
                        </button>
                        ${this.currentUser.permissions.editPatients ? `
                        <button class="action-btn" onclick="hospitalSystem.editPatient('${patient.patientId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${this.currentUser.permissions.deletePatients ? `
                        <button class="action-btn" onclick="hospitalSystem.deletePatient('${patient.patientId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    async addPatient() {
        if (!this.currentUser || !this.currentUser.permissions.editPatients) {
            this.showAlert('You do not have permission to add patients', 'error');
            return;
        }

        const form = document.getElementById('add-patient-form');
        const formData = new FormData(form);
        
        const patientData = {
            name: document.getElementById('patient-name').value,
            cpf: document.getElementById('patient-cpf').value,
            birthDate: document.getElementById('patient-birth').value,
            gender: document.getElementById('patient-gender').value,
            phone: document.getElementById('patient-phone').value,
            email: document.getElementById('patient-email').value,
            address: document.getElementById('patient-address').value,
            diagnosis: document.getElementById('patient-diagnosis').value
        };

        try {
            // Calculate age
            if (patientData.birthDate) {
                const birthYear = new Date(patientData.birthDate).getFullYear();
                const currentYear = new Date().getFullYear();
                patientData.age = currentYear - birthYear;
            }

            // In a real system, we would encrypt sensitive data here
            const response = await fetch(`${this.ehrBaseUrl}/patients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': this.currentUser.id
                },
                body: JSON.stringify(patientData)
            });

            if (!response.ok) throw new Error('Failed to create patient');

            this.showAlert('Patient added successfully', 'success');
            this.closeModal('add-patient-modal');
            form.reset();
            await this.loadPatients();
        } catch (error) {
            console.error('Error adding patient:', error);
            this.showAlert('Failed to add patient', 'error');
        }
    }

    async viewPatient(patientId) {
        if (!this.canAccessPatient({ patientId })) {
            this.showAlert('Access denied to this patient record', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientId}`, {
                headers: {
                    'X-User-Id': this.currentUser.id
                }
            });
            if (!response.ok) throw new Error('Failed to load patient details');

            const patient = await response.json();
            this.displayPatientDetails(patient);
            this.openModal('patient-detail-modal');
        } catch (error) {
            console.error('Error loading patient details:', error);
            this.showAlert('Failed to load patient details', 'error');
        }
    }

    displayPatientDetails(patient) {
        const canViewDiagnoses = this.currentUser.permissions.viewDiagnoses;
        const canViewDemographics = this.currentUser.permissions.viewDemographics;
        const canViewEncounters = this.currentUser.permissions.viewEncounters;

        document.getElementById('patient-detail-title').textContent = 
            canViewDemographics ? `Patient: ${patient.name || 'Unknown'}` : 'Patient Details';

        const content = document.getElementById('patient-detail-content');
        content.innerHTML = `
            <div class="patient-detail-grid">
                <div class="detail-section">
                    <h4>Demographics</h4>
                    <p><strong>Name:</strong> ${canViewDemographics ? (patient.name || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>CPF:</strong> ${canViewDemographics ? (patient.cpf || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Age:</strong> ${canViewDemographics ? (patient.age || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Gender:</strong> ${canViewDemographics ? (patient.gender || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Phone:</strong> ${canViewDemographics ? (patient.phone || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Email:</strong> ${canViewDemographics ? (patient.email || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Medical Information</h4>
                    <p><strong>Primary Diagnosis:</strong> ${canViewDiagnoses ? (patient.diagnosis || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Last Visit:</strong> ${canViewEncounters ? (patient.lastVisit || 'Never') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</p>
                    <p><strong>Patient ID:</strong> ${patient.patientId || 'N/A'}</p>
                </div>
            </div>
            
            <style>
            .patient-detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
            .detail-section {
                background: #f8fafc;
                padding: 1.5rem;
                border-radius: 10px;
            }
            .detail-section h4 {
                color: #2c3e50;
                margin-bottom: 1rem;
                border-bottom: 2px solid #667eea;
                padding-bottom: 0.5rem;
            }
            .detail-section p {
                margin-bottom: 0.5rem;
            }
            @media (max-width: 768px) {
                .patient-detail-grid {
                    grid-template-columns: 1fr;
                }
            }
            </style>
        `;
    }

    async editPatient(patientId) {
        if (!this.currentUser.permissions.editPatients) {
            this.showAlert('You do not have permission to edit patients', 'error');
            return;
        }
        // Implementation for edit functionality
        this.showAlert('Edit functionality would be implemented here', 'info');
    }

    async deletePatient(patientId) {
        if (!this.currentUser.permissions.deletePatients) {
            this.showAlert('You do not have permission to delete patients', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.ehrBaseUrl}/patients/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': this.currentUser.id
                }
            });

            if (!response.ok) throw new Error('Failed to delete patient');

            this.showAlert('Patient deleted successfully', 'success');
            await this.loadPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showAlert('Failed to delete patient', 'error');
        }
    }

    // Search Methods
    async searchPatients() {
        if (!this.currentUser.permissions.searchPatients) {
            this.showAlert('You do not have permission to search patients', 'error');
            return;
        }

        const searchName = document.getElementById('search-name').value.trim();
        const searchCpf = document.getElementById('search-cpf').value.trim();
        
        if (!searchName && !searchCpf) {
            this.showAlert('Please enter a name or CPF to search', 'warning');
            return;
        }

        try {
            const searchParams = {};
            if (searchName) searchParams.name = searchName;
            if (searchCpf) searchParams.cpf = searchCpf;

            const response = await fetch(`${this.ehrBaseUrl}/patients/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': this.currentUser.id
                },
                body: JSON.stringify(searchParams)
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            this.displaySearchResults(data.results);
        } catch (error) {
            console.error('Error searching patients:', error);
            this.showAlert('Search failed', 'error');
        }
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert info">
                    <i class="fas fa-info-circle"></i> No patients found matching your search criteria.
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <h3>Search Results (${results.length} patient${results.length > 1 ? 's' : ''} found)</h3>
            <div class="search-results-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Name</th>
                            <th>CPF</th>
                            <th>Age</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(patient => {
                            const canViewDemographics = this.currentUser.permissions.viewDemographics;
                            return `
                                <tr>
                                    <td>${patient.patientId || 'N/A'}</td>
                                    <td>${canViewDemographics ? (patient.name || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                                    <td>${canViewDemographics ? (patient.cpf || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                                    <td>${canViewDemographics ? (patient.age || 'N/A') : '<span class="restricted-data">&lt;restricted&gt;</span>'}</td>
                                    <td>
                                        <button class="action-btn" onclick="hospitalSystem.viewPatient('${patient.patientId}')">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    clearSearch() {
        document.getElementById('search-name').value = '';
        document.getElementById('search-cpf').value = '';
        document.getElementById('search-results').innerHTML = '';
    }

    // FABEO Testing Methods
    async encryptData() {
        if (!this.currentUser.permissions.manageFabeo) {
            this.showAlert('You do not have permission to use FABEO testing', 'error');
            return;
        }

        const data = document.getElementById('encrypt-data').value.trim();
        const policy = document.getElementById('encrypt-policy').value.trim();
        
        if (!data) {
            this.showAlert('Please enter data to encrypt', 'warning');
            return;
        }
        
        if (!policy) {
            this.showAlert('Please enter an access policy', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.cryptoBaseUrl}/encrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: data,
                    policy: policy
                })
            });

            if (!response.ok) throw new Error('Encryption failed');

            const result = await response.json();
            document.getElementById('encrypt-result').textContent = 
                `Encrypted Data:\n${JSON.stringify(result, null, 2)}`;
        } catch (error) {
            console.error('Error encrypting data:', error);
            this.showAlert('Failed to encrypt data', 'error');
        }
    }

    async decryptData() {
        if (!this.currentUser.permissions.manageFabeo) {
            this.showAlert('You do not have permission to use FABEO testing', 'error');
            return;
        }

        const encryptedData = document.getElementById('decrypt-data').value.trim();
        
        if (!encryptedData) {
            this.showAlert('Please enter encrypted data', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.cryptoBaseUrl}/decrypt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    encrypted_data: JSON.parse(encryptedData),
                    attributes: this.currentUser.attributes
                })
            });

            if (!response.ok) throw new Error('Decryption failed');

            const result = await response.json();
            document.getElementById('decrypt-result').textContent = 
                result.success ? `Decrypted Data:\n${result.data}` : `Decryption Failed: ${result.error}`;
        } catch (error) {
            console.error('Error decrypting data:', error);
            this.showAlert('Failed to decrypt data', 'error');
        }
    }

    async generateKeys() {
        if (!this.currentUser.permissions.manageFabeo) {
            this.showAlert('You do not have permission to manage keys', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.cryptoBaseUrl}/generate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attributes: this.currentUser.attributes
                })
            });

            if (!response.ok) throw new Error('Key generation failed');

            const result = await response.json();
            document.getElementById('key-management-result').textContent = 
                `New key generated for attributes: ${this.currentUser.attributes.join(', ')}\n\nKey Details:\n${JSON.stringify(result, null, 2)}`;
        } catch (error) {
            console.error('Error generating keys:', error);
            this.showAlert('Failed to generate keys', 'error');
        }
    }

    async viewKeys() {
        if (!this.currentUser.permissions.manageFabeo) {
            this.showAlert('You do not have permission to view keys', 'error');
            return;
        }

        document.getElementById('key-management-result').textContent = 
            `Current user attributes: ${this.currentUser.attributes.join(', ')}\n\nNote: In a production system, actual keys would be securely stored and managed.`;
    }

    // UI Helper Methods
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific data
        if (tabName === 'patients') {
            this.loadPatients();
        } else if (tabName === 'dashboard') {
            this.loadDashboard();
        }
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        this.clearAlerts();

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; cursor: pointer;">&times;</button>
        `;

        // Insert after header or at top of main content
        const insertPoint = document.querySelector('.main-content') || document.body;
        insertPoint.insertAdjacentElement('afterbegin', alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    clearAlerts() {
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global functions for onclick handlers
function closeModal(modalId) {
    hospitalSystem.closeModal(modalId);
}

// Initialize the system
const hospitalSystem = new HospitalSystem();