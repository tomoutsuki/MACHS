# MACHS Hospital System - Quick Start Guide

This guide will help you set up and run the enhanced MACHS Hospital System with user authentication, searchable encryption, and data visualization.

## 🚀 Quick Start (All Services)

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- Docker and Docker Compose
- Git

### 1. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# EHR System dependencies  
cd ../ehr-system
npm install

# Cryptography service dependencies
cd ../cryptography
pip install -r requirements.txt
```

### 2. Start All Services

#### Terminal 1 - Database
```bash
cd docker
docker-compose up postgresql
```
Wait for "database system is ready to accept connections"

#### Terminal 2 - EHR System
```bash
cd ehr-system
npm start
```
Wait for "🚀 MACHS EHR System running on port 3001"

#### Terminal 3 - Cryptography Service
```bash
cd cryptography
python main.py
```
Wait for "Uvicorn running on http://0.0.0.0:8000"

#### Terminal 4 - Hospital Frontend
```bash
cd frontend
npm run hospital
```
Visit: http://localhost:3002/hospital

### 3. Create Demo Data (Optional)
```bash
cd frontend
npm run demo-data
```

## 🏥 Using the Hospital System

### Login Options
Choose from these predefined user profiles:

1. **Dr. Administrator** - Full system access, can use FABEO testing
2. **Dr. Silva** - Doctor with medical access, can view diagnoses  
3. **Nurse Maria** - Nursing access, cannot view diagnoses
4. **Ana Reception** - Front desk, demographics only
5. **Dr. Research** - Research access, anonymized data only

### Features to Test

#### 1. Dashboard
- View system status and your permissions
- See accessible vs restricted record counts

#### 2. Patient Records
- Browse all patients with role-based filtering
- Add new patients (if you have permission)
- View detailed patient information

#### 3. Search Patients
- Search by patient name (e.g., "Ana Maria")
- Search by CPF (e.g., "123.456.789-01")
- Results filtered by your access level

#### 4. FABEO Testing (Admin only)
- Test encryption with custom policies
- Decrypt data using your user attributes
- Generate and view cryptographic keys

### Sample Searches (After Demo Data)
- **Name**: "Ana Maria", "João Silva", "Maria José"
- **CPF**: "123.456.789-01", "987.654.321-09", "456.789.123-45"

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running:
```bash
cd docker
docker-compose up postgresql
```

#### EHR Service Offline
**Symptoms**: Hospital interface shows "EHR Service: Offline"
**Solution**: Start the EHR system:
```bash
cd ehr-system
npm start
```

#### Crypto Service Offline  
**Symptoms**: Hospital interface shows "Crypto Service: Offline"
**Solution**: Start the cryptography service:
```bash
cd cryptography
python main.py
```

#### Permission Denied Errors
**Symptoms**: "You do not have permission to..." messages
**Solution**: Login with a different user profile that has the required permissions

#### Search Returns No Results
**Symptoms**: Search finds no patients even with demo data
**Solution**: 
1. Ensure demo data was created successfully
2. Try exact name matches: "Ana Maria Santos", "João Silva Oliveira"
3. Use exact CPF format: "123.456.789-01"

### Port Conflicts
If you have port conflicts, you can change the ports:

- **Frontend**: Edit `hospital-server.js`, change `PORT = 3002`
- **EHR System**: Edit `ehr-system/server.js`, change `PORT = 3001`  
- **Crypto Service**: Edit `cryptography/main.py`, change port in uvicorn run

### Reset Database
To start fresh:
```bash
cd docker
docker-compose down
docker-compose up postgresql
```

## 📊 Service Status Check

Visit these URLs to verify services are running:

- **Hospital Interface**: http://localhost:3002/hospital
- **EHR Health Check**: http://localhost:3001/health
- **Crypto Health Check**: http://localhost:8000/health
- **Database**: Connect to `postgresql://postgres:secure_password@localhost:5432/machs_ehr`

## 🔍 API Testing

You can also test the enhanced APIs directly:

### Get Patients (with user context)
```bash
curl -H "X-User-Id: doctor" http://localhost:3001/patients
```

### Search Patients
```bash
curl -X POST http://localhost:3001/patients/search \
  -H "Content-Type: application/json" \
  -H "X-User-Id: doctor" \
  -d '{"name": "Ana Maria"}'
```

### Create Patient
```bash
curl -X POST http://localhost:3001/patients \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin" \
  -d '{
    "name": "Test Patient",
    "cpf": "111.222.333-44",
    "birthDate": "1990-01-01",
    "gender": "male"
  }'
```

## 📚 Next Steps

1. **Explore Different User Roles**: Login with different profiles to see how the interface adapts
2. **Test Access Control**: Try to access restricted features with limited users
3. **Search Functionality**: Test the searchable encryption with various queries
4. **FABEO Integration**: Use the admin account to test ABE encryption/decryption
5. **Add Custom Data**: Create your own patient records and test the system

## 🔗 Related Documentation

- [Hospital System Features](HOSPITAL_SYSTEM_README.md) - Detailed feature documentation
- [Original System](../README.md) - Main project documentation
- [API Reference](../docs/api-reference.md) - Complete API documentation
- [Deployment Guide](../docs/deployment.md) - Production deployment guide

## 🆘 Getting Help

If you encounter issues:

1. Check the service status indicators in the hospital interface
2. Review the console logs in each terminal
3. Verify all services are running on the correct ports
4. Try the troubleshooting steps above
5. Create demo data if you haven't already

The enhanced hospital system demonstrates real-world integration of ABE encryption in healthcare settings while maintaining usability and security.