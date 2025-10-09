@echo off
echo ============================================
echo   MACHS Hospital System - Docker Startup
echo ============================================
echo.

echo Starting complete MACHS Hospital System...
echo.

echo 1. Building and starting all services...
echo    - PostgreSQL Database
echo    - Cryptography Service (FABEO + FastAPI)
echo    - EHR System (Node.js + Express)
echo    - Original Frontend (Test Interface)
echo    - Hospital Frontend (Enhanced Interface)
echo.

cd /d "%~dp0"

echo Building and starting services...
docker-compose up --build -d

echo.
echo 2. Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 3. Checking service status...
docker-compose ps

echo.
echo ============================================
echo   MACHS Hospital System Started!
echo ============================================
echo.
echo 🏥 Hospital Interface (Enhanced): http://localhost:3002/hospital
echo 🧪 Test Interface (Original): http://localhost:8080
echo 📊 EHR API Health: http://localhost:3001/health
echo 🔐 Crypto API Health: http://localhost:8000/health
echo.
echo 📋 Services Status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo.
echo 👥 Hospital User Profiles to Test:
echo    - Dr. Administrator (Full Access + FABEO Testing)
echo    - Dr. Silva (Doctor - Medical Access)
echo    - Nurse Maria (Nurse - Basic Patient Care)
echo    - Ana Reception (Receptionist - Demographics Only)
echo    - Dr. Research (Researcher - Anonymized Data)
echo.
echo 📊 Demo data will be automatically created!
echo.
echo ⚠️  To stop all services: docker-compose down
echo 🔧 To view logs: docker-compose logs -f
echo.
echo Press any key to open the hospital interface...
pause >nul

start http://localhost:3002/hospital