# MACHS Hospital System - Enhanced Frontend

This enhanced version of MACHS transforms the test-purpose frontend into a realistic hospital system interface with user authentication, searchable encryption, and data visualization.

## Features

### 🔐 User Authentication & Access Control
- **Role-based Access Control**: 5 predefined user profiles with different permissions
- **Attribute-based Encryption**: Users have specific attributes for ABE operations
- **Permission-based UI**: Interface adapts based on user permissions

### 👥 User Profiles

1. **Dr. Administrator (admin)**
   - Full system access
   - Can view/edit/delete all patient data
   - Access to FABEO testing
   - Attributes: `admin`, `doctor`, `nurse`, `full_access`

2. **Dr. Silva (doctor)**
   - Medical professional access
   - Can view/edit patient data and diagnoses
   - Cannot delete patients
   - Attributes: `doctor`, `cardiology`

3. **Nurse Maria (nurse)**
   - Nursing care access
   - Can view/edit basic patient data
   - Cannot view diagnoses or delete patients
   - Attributes: `nurse`, `general_care`

4. **Ana Reception (receptionist)**
   - Front desk access
   - Can only view demographics
   - Cannot edit or delete patients
   - Attributes: `receptionist`, `demographics_only`

5. **Dr. Research (researcher)**
   - Research access
   - Can view anonymized diagnoses and encounters
   - Cannot view demographics or edit data
   - Attributes: `researcher`, `anonymized_data`

### 🔍 Searchable Encryption
- **Privacy-preserving Search**: Search patient records by name and CPF using encrypted metadata
- **Hash-based Indexing**: Uses deterministic hashing for equality searches
- **Access Control**: Search results filtered based on user permissions
- **Metadata Storage**: Searchable hashes stored separately from encrypted data

### 📊 Data Visualization
- **Patient Records Table**: Comprehensive view of all patient data
- **Permission-based Display**: Restricted data shows `<restricted>` for unauthorized users
- **Dashboard Statistics**: Real-time counts of accessible vs restricted records
- **User Permissions Panel**: Shows current user's capabilities

### 🧪 FABEO Testing Interface
- **Integrated Testing**: FABEO encryption/decryption testing within hospital interface
- **User Context**: Automatically uses current user's attributes
- **Policy Testing**: Test custom access policies with real user attributes
- **Key Management**: Generate and view cryptographic keys

## Technical Implementation

### Backend Enhancements

#### New Database Models
```javascript
// Searchable metadata for privacy-preserving search
SearchableMetadata {
  patientId: string,
  nameHash: string,      // SHA-256 hash of patient name
  cpfHash: string,       // SHA-256 hash of patient CPF
  dobHash: string        // SHA-256 hash of date of birth
}
```

#### Access Control Middleware
- User profile validation
- Permission checking per endpoint
- Audit logging with user context

#### New API Endpoints
- `POST /patients/search` - Searchable encryption queries
- Enhanced patient endpoints with user context
- Permission-based data filtering

### Frontend Architecture

#### User Management
```javascript
// User profile with permissions and attributes
userProfile = {
  name: "Dr. Silva",
  role: "Doctor", 
  attributes: ["doctor", "cardiology"],
  permissions: {
    viewPatients: true,
    editPatients: true,
    viewDiagnoses: true,
    // ... other permissions
  }
}
```

#### Searchable Encryption Client
```javascript
// Search using encrypted metadata
searchPatients(name, cpf) {
  // Sends search parameters to backend
  // Backend performs hash-based lookup
  // Returns filtered results based on user permissions
}
```

## Setup and Usage

### 1. Start the Enhanced Frontend
```bash
cd frontend
node hospital-server.js
```
Access at: http://localhost:3002/hospital

### 2. Start Backend Services
```bash
# Terminal 1 - Database
cd docker
docker-compose up postgresql

# Terminal 2 - EHR System  
cd ehr-system
npm start

# Terminal 3 - Crypto Service
cd cryptography
python main.py
```

### 3. Login and Explore
1. Select a user profile from the dropdown
2. Click "Login" to enter the hospital system
3. Explore different tabs based on your user's permissions
4. Try searching for patients using the search tab
5. Test FABEO encryption with your user's attributes

## User Experience Flow

### Login Process
1. **User Selection**: Choose from predefined hospital roles
2. **Permission Loading**: System loads user-specific permissions and attributes  
3. **Interface Adaptation**: UI elements show/hide based on permissions
4. **Context Setting**: All API calls include user context

### Data Access
1. **Permission Check**: Every data access validates user permissions
2. **Encryption Context**: ABE decryption uses user's attributes
3. **Display Filtering**: Unauthorized data shows as `<restricted>`
4. **Audit Logging**: All access attempts logged with user context

### Search Workflow
1. **Input Processing**: Name/CPF converted to searchable hashes
2. **Encrypted Query**: Search performed on hash indexes
3. **Result Filtering**: Results filtered by user permissions
4. **Secure Display**: Only authorized fields shown to user

## Security Features

### Access Control
- **Role-based Permissions**: Granular permission system
- **Attribute-based Encryption**: Fine-grained data access control
- **Audit Logging**: Complete access trail with user context
- **Permission Enforcement**: Both frontend and backend validation

### Searchable Encryption
- **Hash-based Search**: Deterministic hashing for equality queries
- **Metadata Separation**: Search indexes separate from encrypted data
- **Privacy Preservation**: No plaintext exposure during search
- **Access Control Integration**: Search results filtered by permissions

### Data Protection
- **Encrypted Storage**: Sensitive data encrypted with ABE
- **Secure Transmission**: HTTPS for all communications
- **Session Management**: Secure user session handling
- **Permission Validation**: Multi-layer permission checking

## Demonstration Scenarios

### 1. Doctor Accessing Patient Data
- Login as "Dr. Silva"
- View patient list with full medical access
- Search for specific patients
- View detailed patient records including diagnoses

### 2. Nurse Limited Access  
- Login as "Nurse Maria"
- See patient demographics and basic info
- Notice diagnosis fields show `<restricted>`
- Limited editing capabilities

### 3. Receptionist Front Desk
- Login as "Ana Reception"
- Access only demographic information
- Search capabilities for patient lookup
- No access to medical information

### 4. Researcher Data Analysis
- Login as "Dr. Research"
- View anonymized medical data
- No access to patient identities
- Focus on research-relevant information

### 5. FABEO Encryption Testing
- Login as "Dr. Administrator"
- Access FABEO testing interface
- Test encryption with hospital-specific policies
- Verify attribute-based access control

## Comparison with Original System

| Feature | Original System | Enhanced Hospital System |
|---------|----------------|--------------------------|
| Authentication | None | Role-based user profiles |
| Access Control | Manual key entry | Automatic attribute-based |
| Data Display | Raw encrypted data | Permission-filtered views |
| Search | Manual decryption | Searchable encryption |
| Interface | Technical testing | Hospital workflow |
| User Experience | Developer-focused | Clinician-focused |
| Security | Manual management | Automated enforcement |

## Future Enhancements

### Planned Features
- **Multi-factor Authentication**: Enhanced security for production use
- **Real-time Notifications**: Patient data updates and alerts
- **Advanced Search**: Range queries and fuzzy matching
- **Audit Dashboard**: Comprehensive access monitoring
- **Mobile Interface**: Responsive design for tablets/phones
- **Integration APIs**: FHIR compliance and external system integration

### Technical Improvements
- **Performance Optimization**: Database indexing and caching
- **Scalability**: Horizontal scaling for large hospitals
- **Backup/Recovery**: Automated data protection
- **Monitoring**: Real-time system health monitoring
- **Encryption Upgrades**: Latest ABE schemes and optimizations

This enhanced system demonstrates how ABE can be integrated into real-world healthcare applications while maintaining usability and security.