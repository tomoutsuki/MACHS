#!/bin/bash
# MACHS System Port Verification Script

echo "🏥 MACHS Hospital System - Port Status Check"
echo "============================================="
echo ""

echo "📊 Checking service availability..."
echo ""

# Function to check if a port is accessible
check_service() {
    local port=$1
    local service_name=$2
    local path=${3:-""}
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" | grep -q "200\|404"; then
        echo "✅ $service_name (port $port) - RUNNING"
    else
        echo "❌ $service_name (port $port) - NOT ACCESSIBLE"
    fi
}

# Check all active services
check_service "3002" "🏥 Hospital Frontend" "/hospital"
check_service "3001" "🔗 EHR System API" "/health"
check_service "8000" "🔐 Cryptography Service" "/health"

echo ""
echo "📋 **Cleaned Port Structure**:"
echo "  - Port 3002: Main Hospital Interface"
echo "  - Port 3001: EHR System API (Backend Only)"
echo "  - Port 8000: Cryptography Service"
echo "  - Port 5432: PostgreSQL Database"
echo ""

# Check that old frontend is no longer accessible
echo "🧹 Verifying cleanup..."
if curl -s --connect-timeout 3 "http://localhost:8080" > /dev/null 2>&1; then
    echo "⚠️  Old frontend still accessible on port 8080"
else
    echo "✅ Old frontend (port 8080) successfully removed"
fi

echo ""
echo "🚀 **Quick Access**:"
echo "  Hospital Interface: http://localhost:3002/hospital"
echo "  API Health Check: http://localhost:3001/health"
echo ""
echo "👥 **User Profiles Available**:"
echo "  - Admin (Dr. Patricia Santos)"
echo "  - Doctor (Dr. Carlos Silva)"
echo "  - Nurse (Maria Oliveira)"
echo "  - Receptionist (João Costa)"
echo "  - Researcher (Ana Research)"
echo ""