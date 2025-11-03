@echo off
echo ============================================
echo   FABEO Isolated System - Shutdown
echo ============================================
echo.

cd /d "%~dp0"

echo Stopping FABEO services...
docker-compose down

echo.
echo Services stopped. Encrypted data is preserved.
echo.
echo To restart: run start-hospital-system.bat
echo To remove all data: docker-compose down -v
echo.
pause