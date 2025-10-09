# MACHS Hospital System - Docker Deployment

This directory contains the complete Docker Compose setup for the MACHS Hospital System, including the enhanced hospital frontend with user authentication, searchable encryption, and data visualization.

## 🚀 Quick Start

### One-Click Startup
```bash
# Windows
start-hospital-system.bat

# Linux/Mac
docker-compose up --build -d
```

This will start all services and automatically:
- ✅ Initialize the PostgreSQL database
- ✅ Start the cryptography service (FABEO + FastAPI)
- ✅ Start the EHR system (Node.js + Express)
- ✅ Start both frontend interfaces
- ✅ Create demo patient data
- ✅ Open the hospital interface in your browser

## 🏥 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Hospital Interface** | http://localhost:3002/hospital | Enhanced hospital system with user roles |
| **Original Test Interface** | http://localhost:8080 | Original FABEO testing interface |
| **EHR API** | http://localhost:3001 | RESTful API for patient data |
| **Crypto API** | http://localhost:8000 | FABEO encryption service |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hospital      │    │   Original      │    │   EHR System    │
│   Frontend      │    │   Frontend      │    │   (Node.js)     │
│   (Port 3002)   │    │   (Port 8080)   │    │   (Port 3001)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Cryptography   │    │   PostgreSQL    │
                    │   Service       │    │   Database      │
                    │  (Port 8000)    │    │   (Port 5432)   │
                    └─────────────────┘    └─────────────────┘
```

## 🐳 Docker Services

### Core Services
- **`postgres`**: PostgreSQL database for patient metadata and audit logs
- **`cryptography`**: FABEO-based encryption service (Python + FastAPI)
- **`ehr-system`**: EHR backend with enhanced APIs (Node.js + Express)

### Frontend Services
- **`frontend`**: Original test interface for FABEO encryption testing
- **`hospital-frontend`**: Enhanced hospital system with user authentication and access control

## 🔧 Service Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `machs_ehr` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `secure_password` | Database password |
| `CREATE_DEMO_DATA` | `true` | Auto-create demo patients |
| `NODE_ENV` | `production` | Environment mode |

### Port Mappings

| Internal Port | External Port | Service |
|---------------|---------------|---------|
| 5432 | 5432 | PostgreSQL |
| 8000 | 8000 | Cryptography API |
| 3000 | 3001 | EHR System API |
| 8080 | 8080 | Original Frontend |
| 3002 | 3002 | Hospital Frontend |

## 🛠️ Management Commands

### Start System
```bash
# Full startup with build
docker-compose up --build -d

# Start existing containers
docker-compose up -d

# Start with logs
docker-compose up --build
```

### Monitor System
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f hospital-frontend
docker-compose logs -f ehr-system

# Check service status
docker-compose ps
```

### Stop System
```bash
# Stop services (preserves data)
docker-compose down

# Stop and remove data volumes
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache hospital-frontend
```

## 🎯 Testing the System

### 1. **Hospital Interface** (http://localhost:3002/hospital)
- Login with different user profiles
- Test role-based access control
- Search for patients using encrypted metadata
- View permission-filtered data

### 2. **User Profiles**
| User | Role | Capabilities |
|------|------|-------------|
| **Dr. Administrator** | Admin | Full access + FABEO testing |
| **Dr. Silva** | Doctor | Medical data + diagnoses |
| **Nurse Maria** | Nurse | Basic patient data (no diagnoses) |
| **Ana Reception** | Receptionist | Demographics only |
| **Dr. Research** | Researcher | Anonymized medical data |

### 3. **Demo Data**
The system automatically creates 5 test patients:
- Ana Maria Santos (CPF: 123.456.789-01)
- João Silva Oliveira (CPF: 987.654.321-09)
- Maria José Lima (CPF: 456.789.123-45)
- Carlos Eduardo Costa (CPF: 321.654.987-12)
- Fernanda Alves Pereira (CPF: 789.123.456-78)

### 4. **API Testing**
```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:8000/health
curl http://localhost:3002/health

# Patient list (with user context)
curl -H "X-User-Id: doctor" http://localhost:3001/patients

# Search patients
curl -X POST http://localhost:3001/patients/search \
  -H "Content-Type: application/json" \
  -H "X-User-Id: doctor" \
  -d '{"name": "Ana Maria"}'
```

## 🔍 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Frontend Not Loading
```bash
# Check hospital frontend logs
docker-compose logs hospital-frontend

# Verify all dependencies are running
docker-compose ps

# Restart frontend service
docker-compose restart hospital-frontend
```

#### Permission Errors
```bash
# Check if demo data was created
docker-compose logs hospital-frontend | grep "demo"

# Manually create demo data
docker-compose exec hospital-frontend node create-demo-data.js
```

### Health Checks
Each service includes health checks that Docker monitors:

```bash
# View health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}"

# Individual health checks
curl http://localhost:3002/health  # Hospital Frontend
curl http://localhost:3001/health  # EHR System
curl http://localhost:8000/health  # Crypto Service
```

## 🔐 Security Notes

### Development vs Production
- Current setup uses default passwords and is configured for development
- For production deployment:
  - Change all default passwords
  - Use proper SSL/TLS certificates
  - Configure firewalls and network security
  - Enable proper authentication mechanisms

### Data Privacy
- Patient data is encrypted using ABE (Attribute-Based Encryption)
- Searchable metadata uses hash-based indexing
- Access control enforced at multiple layers
- Complete audit trail for compliance

## 📊 Monitoring

### Service Dependencies
The system has careful dependency management:
1. **PostgreSQL** starts first
2. **Cryptography Service** starts after database
3. **EHR System** waits for database and crypto
4. **Frontend Services** wait for all backend services

### Auto-Recovery
All services are configured with `restart: unless-stopped` for automatic recovery from failures.

## 🚀 Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use proper secrets management
2. **SSL/TLS**: Configure HTTPS for all services
3. **Database**: Use managed PostgreSQL service
4. **Scaling**: Configure load balancers and multiple instances
5. **Monitoring**: Add logging, metrics, and alerting
6. **Backup**: Implement automated backup strategies

## 📚 Related Documentation

- [Hospital System Features](../frontend/HOSPITAL_SYSTEM_README.md)
- [Quick Start Guide](../frontend/QUICK_START_HOSPITAL.md)
- [Main Project Documentation](../README.md)
- [API Reference](../docs/api-reference.md)

---

🏥 **MACHS Hospital System** - Demonstrating real-world ABE integration in healthcare environments.