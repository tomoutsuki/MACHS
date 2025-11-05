@echo off
echo ============================================
echo   FABEO Isolated Testing System - Startup
echo ============================================
echo.

echo Starting FABEO cryptographic services...
echo.

echo Building and starting services:
echo    - FABEO Service (Python 2.7 + Charm-crypto)
echo    - Crypto API Gateway (Python 3.8 + FastAPI)
echo.

cd /d "%~dp0"

echo Cleaning up old containers...
docker-compose down

echo.
echo Building and starting services...
docker-compose up --build -d

echo.
echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ============================================
echo   FABEO System Started!
echo ============================================
echo.
echo Crypto API Health: http://localhost:8001/health
echo FABEO Service Health: http://localhost:8002/health
echo.
echo Services Status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Run tests with:
echo    python test_fabeo_isolated.py
echo    python test_fabeo_proper_workflow.py
echo.
echo [WARN]  To stop all services: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause