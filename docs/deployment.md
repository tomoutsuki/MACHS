# MACHS Deployment Guide

## Quick Setup (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Git

### 1. Clone and Setup
```bash
# Clone with submodules
git clone --recursive https://github.com/tomoutsuki/MACHS.git
cd MACHS

# Start the system with Docker Compose
npm run setup
```

### 2. Verify Deployment
```bash
# Check services
curl http://localhost:3000/health
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## Manual Setup

### 1. Environment Configuration
```bash
cd docker
cp .env.example .env
# Edit .env with your configurations
```

### 2. Build and Start Services
```bash
cd docker
docker-compose build
docker-compose up -d
```

### 3. Initialize MongoDB
MongoDB will be automatically initialized with:
- Database: `ehr_system`
- Admin user: `admin` / `admin123`
- Required indexes and collections

## Production Deployment

### Security Considerations

1. **Change Default Credentials**
   ```bash
   # Update docker/.env
   MONGO_ROOT_PASSWORD=your_secure_password
   JWT_SECRET=your_long_secure_jwt_secret
   ```

2. **Use HTTPS**
   - Add reverse proxy (nginx/traefik)
   - Configure SSL certificates
   - Update CORS settings

3. **Network Security**
   - Use Docker secrets for sensitive data
   - Implement network policies
   - Configure firewall rules

### Environment Variables

#### Docker Compose (.env)
```bash
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password
MONGO_DB_NAME=ehr_system

# Authentication  
JWT_SECRET=very_long_and_secure_jwt_secret_key

# Ports (change if needed)
MONGODB_PORT=27017
CRYPTOGRAPHY_PORT=8000
EHR_SYSTEM_PORT=3000

# Environment
NODE_ENV=production
DEBUG=false
LOG_LEVEL=INFO
```

#### Cryptography Service
```bash
PORT=8000
DEBUG=false
LOG_LEVEL=INFO
FABEO_PATH=/app/submodules/FABEO
```

#### EHR System
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://user:pass@mongodb:27017/ehr_system
JWT_SECRET=your_jwt_secret
CRYPTO_SERVICE_URL=http://cryptography:8000
```

### Scaling Considerations

#### Horizontal Scaling
```yaml
# docker-compose.yml additions
services:
  ehr-system:
    deploy:
      replicas: 3
    
  cryptography:
    deploy:
      replicas: 2
```

#### Load Balancing
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - ehr-system
```

### Monitoring and Logging

#### Health Checks
```yaml
services:
  ehr-system:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Log Management
```yaml
services:
  ehr-system:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker-compose logs cryptography
docker-compose logs ehr-system
docker-compose logs mongodb

# Check service health
docker-compose ps
```

#### MongoDB Connection Issues
```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh \
  --username admin \
  --password secure_password \
  --authenticationDatabase admin
```

#### Cryptography Service Issues
```bash
# Check Charm installation
docker-compose exec cryptography python -c "import charm; print('Charm OK')"

# Check FABEO availability
docker-compose exec cryptography python -c "import sys; print('/app/submodules/FABEO' in sys.path)"
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
netstat -tulpn | grep :27017

# Modify ports in docker/.env
EHR_SYSTEM_PORT=3001
CRYPTOGRAPHY_PORT=8001
MONGODB_PORT=27018
```

### Performance Tuning

#### MongoDB Optimization
```javascript
// Connect to MongoDB and run
db.patients.createIndex({"personalInfo.lastName": 1, "personalInfo.firstName": 1})
db.medicalrecords.createIndex({"patientId": 1, "createdAt": -1})
```

#### Memory Allocation
```yaml
services:
  cryptography:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec mongodb mongodump \
  --username admin \
  --password secure_password \
  --authenticationDatabase admin \
  --out /backup

# Copy backup from container
docker cp $(docker-compose ps -q mongodb):/backup ./backup
```

### Restore Database
```bash
# Copy backup to container
docker cp ./backup $(docker-compose ps -q mongodb):/backup

# Restore
docker-compose exec mongodb mongorestore \
  --username admin \
  --password secure_password \
  --authenticationDatabase admin \
  /backup
```

## Maintenance

### Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up --build -d

# Clean up old images
docker system prune -f
```

### Log Rotation
```bash
# Configure log rotation in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

### Health Monitoring
```bash
# Add to crontab for monitoring
*/5 * * * * curl -f http://localhost:3000/health || echo "EHR System Down" | mail admin@hospital.com
```