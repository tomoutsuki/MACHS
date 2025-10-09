@echo off
echo ============================================
echo   MACHS Hospital System - Shutdown
echo ============================================
echo.

cd /d "%~dp0"

echo Stopping all MACHS services...
docker-compose down

echo.
echo Services stopped. Data is preserved.
echo.
echo To restart: run start-hospital-system.bat
echo To remove all data: docker-compose down -v
echo.
pause