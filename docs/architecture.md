# MACHS System Architecture

## Overview

MACHS (Medical Access Control with Homomorphic System) is designed as a modular system that demonstrates practical implementation of Attribute-Based Encryption (ABE) in healthcare environments.

## System Components

### 1. Cryptography Service
- **Technology Stack**: Python 3.11 + FastAPI + Charm-crypto + FABEO
- **Deployment**: Docker container (Linux-based for Charm compatibility)
- **Responsibilities**:
  - ABE scheme implementations
  - Key generation and management
  - Encryption/decryption operations
  - Policy evaluation

### 2. EHR System  
- **Technology Stack**: Node.js + Express + MongoDB
- **Deployment**: Docker container
- **Responsibilities**:
  - Patient data management
  - Medical records storage
  - User authentication/authorization
  - Integration with cryptography service

### 3. Database Layer
- **Technology**: MongoDB
- **Deployment**: Docker container
- **Collections**:
  - `patients` - Patient demographic and access control info
  - `medicalrecords` - Medical records with encrypted content
  - `users` - System users with ABE attributes

## Data Flow

```
User Request → EHR System → Authentication → Authorization → 
Cryptography Service → ABE Operations → MongoDB → Response
```

### Encryption Flow
1. User creates/updates medical record
2. EHR system validates user permissions
3. Content sent to cryptography service with access policy
4. ABE encryption performed using FABEO/Charm
5. Encrypted content stored in MongoDB
6. Metadata and references returned to user

### Decryption Flow
1. User requests medical record
2. EHR system retrieves encrypted record from MongoDB
3. User's ABE attributes validated against record policy
4. If authorized, encrypted content sent to cryptography service
5. ABE decryption performed using user's attributes
6. Decrypted content returned to user

## Security Model

### Attribute-Based Access Control
- **User Attributes**: role, department, clearance level, specialization
- **Access Policies**: Boolean expressions defining access requirements
- **Examples**:
  - `(role:doctor AND department:cardiology)`
  - `role:admin OR (role:nurse AND clearance:high)`

### Confidentiality Levels
- **Public**: General medical information
- **Restricted**: Standard patient records
- **Confidential**: Sensitive medical data
- **Top Secret**: Highly sensitive records

## Scalability Considerations

### Horizontal Scaling
- EHR System: Multiple Node.js instances behind load balancer
- Cryptography Service: Multiple Python instances with shared key storage
- Database: MongoDB replica sets or sharding

### Performance Optimization
- Caching of frequently accessed keys
- Batch encryption/decryption operations
- Asynchronous processing for non-critical operations

## Development Workflow

### Local Development
1. Use Docker Compose for consistent environment
2. Mount source code volumes for hot reload
3. Shared MongoDB instance for data consistency

### Testing Strategy
- Unit tests for individual service components
- Integration tests for service communication
- End-to-end tests for complete workflows
- Performance tests for cryptographic operations

### Deployment Pipeline
1. Code commit triggers CI/CD pipeline
2. Automated testing (unit, integration, security)
3. Docker image building and pushing
4. Deployment to staging environment
5. Production deployment after validation

## Security Considerations

### Container Security
- Non-root users in containers
- Minimal base images
- Regular security updates
- Secret management for sensitive data

### Network Security
- Internal Docker network for service communication
- TLS encryption for external APIs
- Rate limiting and DDoS protection
- Input validation and sanitization

### Data Protection
- Encryption at rest and in transit
- Secure key storage and rotation
- Audit logging for all operations
- Regular security assessments