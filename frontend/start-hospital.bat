@echo off
echo ============================================
echo   MACHS Hospital System - Startup Script
echo ============================================
echo.

echo Starting MACHS Hospital System components...
echo.

echo 1. Starting Hospital Frontend Server...
cd /d "%~dp0"
start "Hospital Frontend" cmd /k "node hospital-server.js"

echo 2. Waiting for frontend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   MACHS Hospital System Started!
echo ============================================
echo.
echo Hospital Interface: http://localhost:3002/hospital
echo Original Test Interface: http://localhost:3002/index.html
echo.
echo Make sure the following services are also running:
echo - EHR System (port 3001): cd ../ehr-system && npm start
echo - Crypto Service (port 8000): cd ../cryptography && python main.py
echo - PostgreSQL Database: cd ../docker && docker-compose up postgresql
echo.
echo Press any key to open the hospital interface...
pause >nul

start http://localhost:3002/hospital