# MACHS System Port Reference

## 🚀 **Active Services (Default Setup)**

| Port | Service | Description | URL |
|------|---------|-------------|-----|
| **3002** | 🏥 **Hospital Frontend** | **Main hospital interface** | http://localhost:3002/hospital |
| **3001** | 🔗 **EHR System API** | Backend API for patient records | http://localhost:3001/patients |
| **8000** | 🔐 **Cryptography Service** | FABEO encryption service | http://localhost:8000/health |
| **5432** | 🗄️ **PostgreSQL Database** | Patient data storage | localhost:5432 |

## 🏥 **Primary Interface**
- **Hospital System**: http://localhost:3002/hospital
- **Health Check**: http://localhost:3002/health

## 📋 **API Endpoints**
- **Patients API**: http://localhost:3001/patients
- **Search API**: http://localhost:3001/search
- **FHIR API**: http://localhost:3001/fhir/metadata
- **Crypto API**: http://localhost:8000

## 🧪 **Optional Test Interface**
The original test frontend (port 8080) has been disabled by default to reduce confusion.

To re-enable it, uncomment the `frontend` service in `docker/docker-compose.yml` and restart:
```bash
# Uncomment lines 92-115 in docker-compose.yml
docker-compose up --build -d
```

## 🔄 **Service Management**

### Start the system:
```bash
cd docker
docker-compose up -d
```

### View logs:
```bash
docker-compose logs hospital-frontend
docker-compose logs ehr-system
```

### Stop the system:
```bash
docker-compose down
```

## 🚀 **Quick Access**
- **Main Interface**: http://localhost:3002/hospital
- **User Profiles**: Admin, Doctor, Nurse, Receptionist, Researcher
- **Demo Data**: Automatically created on first startup

---
*For development, all services run in containers with health checks and automatic restarts.*