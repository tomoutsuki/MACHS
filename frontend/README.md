# MACHS Frontend - JSON Data Encryption/Decryption Interface

## Overview

The MACHS frontend has been enhanced to provide a comprehensive interface for JSON data encryption and decryption using attribute-based encryption (ABE) with access policy controls.

## Key Features

### 1. JSON Data Encryption
- **JSON Validation**: Automatically validates JSON format before encryption
- **Policy-Based Encryption**: Encrypt data with specific access policies
- **Multiple ABE Schemes**: Support for CP-ABE, KP-ABE, and DFA schemes
- **Sample Data Loading**: Quick access to sample JSON data for testing

### 2. Access-Controlled Decryption
- **Policy Validation**: Checks if user attributes satisfy access policies
- **Visual Access Status**: Clear indication of access granted/denied
- **Attribute Presets**: Quick selection of common user attribute combinations
- **Structured Output**: Properly formatted JSON results

### 3. User Interface Enhancements
- **Tab-Based Navigation**: Organized interface with separate tabs for different functions
- **Real-time Validation**: Immediate feedback on JSON format and policy matching
- **Copy/Transfer Functions**: Easy data transfer between encryption and decryption tabs
- **Service Status Monitoring**: Live status of EHR and Cryptography services

## Architecture

The frontend is now a **Node.js Express application** that:
- Serves static files from the `public/` directory
- Provides API configuration endpoints
- Automatically starts with Docker Compose
- Runs on port **8080**

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Or Node.js 18+ for local development

### Quick Start with Docker (Recommended)

1. **Start all services** (from project root):
   ```bash
   cd docker
   docker-compose up --build -d
   ```

2. **Access the frontend**: `http://localhost:8080`

3. **Check service status**:
   - Frontend: `http://localhost:8080/health`
   - EHR System: `http://localhost:3001/health`
   - Crypto Service: `http://localhost:8000/health`

### Local Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend server**:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

3. **Access the frontend**: `http://localhost:8080`

## Docker Integration

The frontend is fully integrated with the Docker Compose setup:

### Service Configuration
```yaml
frontend:
  build: ../frontend
  container_name: machs-frontend
  ports:
    - "8080:8080"
  environment:
    - EHR_SERVICE_URL=http://ehr-system:3000
    - CRYPTO_SERVICE_URL=http://cryptography:8000
  depends_on:
    - ehr-system
    - cryptography
```

### Automatic Service Discovery
The frontend automatically detects and connects to:
- **EHR System**: `http://ehr-system:3000` (Docker) or `http://localhost:3001` (local)
- **Crypto Service**: `http://cryptography:8000` (Docker) or `http://localhost:8000` (local)

## Usage Guide

### Basic Workflow

1. **Check Service Status**: The status panel shows if EHR and Crypto services are online
2. **Create a Patient**: Use the Patient Management tab to create encrypted patient records
3. **Test Encryption**: Use the Encryption Testing tab to encrypt custom data
4. **Test Decryption**: Use the Decryption Testing tab to test access control

### FABEO Encryption Concepts

#### Ciphertext-Policy ABE (CP-ABE)
- Data is encrypted with an access policy
- Users need attributes that satisfy the policy to decrypt
- Example policy: `(role:doctor AND department:cardiology) OR role:admin`

#### Key-Policy ABE (KP-ABE) 
- User keys contain an access policy
- Data is encrypted with attributes
- Keys can only decrypt data whose attributes satisfy the key's policy

#### Example Scenarios

1. **Doctor Access**:
   - Policy: `(role:doctor AND department:cardiology)`
   - Required attributes: `role:doctor,department:cardiology`

2. **Emergency Access**:
   - Policy: `(role:emergency_staff OR role:admin)`
   - Required attributes: `role:emergency_staff` OR `role:admin`

3. **Hierarchical Access**:
   - Policy: `role:doctor AND (clearance:high OR department:icu)`
   - Required attributes: Must have `role:doctor` AND either `clearance:high` OR `department:icu`

### Testing Encryption/Decryption

1. **Encrypt Data**:
   ```
   Data: "Patient has hypertension and diabetes"
   Policy: "(role:doctor AND department:cardiology)"
   Scheme: CP-ABE
   ```

2. **Test Decryption** (Success):
   ```
   User Attributes: "role:doctor,department:cardiology"
   Result: Decryption successful ✅
   ```

3. **Test Decryption** (Failure):
   ```
   User Attributes: "role:nurse,department:emergency"
   Result: Decryption failed ❌ (attributes don't satisfy policy)
   ```

## API Integration

The frontend communicates with backend services through Docker internal networking:

### EHR System API (`http://ehr-system:3000` in Docker)
- `GET /patients` - List patients
- `POST /patients` - Create patient
- `GET /patients/:id` - Get patient details
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Cryptography Service API (`http://cryptography:8000` in Docker)
- `POST /encrypt` - Encrypt data
- `POST /decrypt` - Decrypt data
- `POST /generate-keys` - Generate keys
- `GET /health` - Service health check

### Frontend API Endpoints
- `GET /health` - Frontend health check
- `GET /api/config` - Service configuration
- `GET /*` - Serve static files

## File Structure
```
frontend/
├── package.json          # Node.js dependencies and scripts
├── server.js             # Express server
├── Dockerfile            # Docker build configuration
├── .dockerignore         # Docker ignore rules
├── public/               # Static files served by Express
│   ├── index.html        # Main application interface
│   ├── styles.css        # CSS styling
│   ├── script.js         # JavaScript functionality
│   └── demo.html         # Demo and testing guide
└── README.md             # This file
```

## Environment Variables

### Docker Environment
- `NODE_ENV=production`
- `PORT=8080`
- `EHR_SERVICE_URL=http://ehr-system:3000`
- `CRYPTO_SERVICE_URL=http://cryptography:8000`

### Local Development
- `PORT=8080` (default)
- `EHR_SERVICE_URL=http://localhost:3001` (fallback)
- `CRYPTO_SERVICE_URL=http://localhost:8000` (fallback)

## Security Features

- **Helmet.js**: Security headers and CSP protection
- **CORS**: Proper cross-origin request handling
- **Attribute-Based Access Control**: Only users with matching attributes can decrypt data
- **Policy Enforcement**: Encryption policies are enforced at the cryptographic level
- **No Data Persistence**: Frontend doesn't store sensitive data locally

## Troubleshooting

### Docker Issues
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs frontend
docker-compose logs ehr-system
docker-compose logs cryptography

# Restart services
docker-compose restart frontend
```

### Service Connection Issues
- Verify all services are running: `docker-compose ps`
- Check service health: `http://localhost:8080/health`
- Verify internal DNS resolution in Docker network

### Frontend Issues
- Check browser console for JavaScript errors
- Verify `/api/config` endpoint returns correct service URLs
- Test direct API endpoints: `http://localhost:3001/health`, `http://localhost:8000/health`

## Development

### Adding New Features
1. Edit files in `public/` directory for frontend changes
2. Modify `server.js` for backend API changes
3. Update Docker configuration if needed
4. Test both locally and in Docker environment

### Hot Reload Development
```bash
# Install nodemon for development
npm install -g nodemon

# Start with auto-reload
npm run dev
```

## License

This frontend is part of the MACHS project and follows the same license terms.