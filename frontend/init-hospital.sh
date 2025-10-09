#!/bin/sh
# Hospital Frontend Initialization Script

echo "🏥 Starting MACHS Hospital Frontend..."

# Wait for EHR service to be ready
echo "⏳ Waiting for EHR service to be ready..."
until wget -q --spider http://ehr-system:3000/health 2>/dev/null; do
    echo "   EHR service not ready, waiting..."
    sleep 5
done
echo "✅ EHR service is ready"

# Wait for Crypto service to be ready  
echo "⏳ Waiting for Crypto service to be ready..."
until wget -q -O- http://cryptography:8000/health >/dev/null 2>&1; do
    echo "   Crypto service not ready, waiting..."
    sleep 5
done
echo "✅ Crypto service is ready"

# Start the hospital server in background
echo "🚀 Starting Hospital Frontend Server..."
node hospital-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if we should create demo data
if [ "$CREATE_DEMO_DATA" = "true" ]; then
    echo "📊 Creating demo data..."
    # Update the demo script to use Docker service names
    EHR_BASE_URL="http://ehr-system:3000" node create-demo-data.js || echo "⚠️  Demo data creation failed (may already exist)"
fi

echo "🎉 Hospital Frontend initialization complete!"
echo "🏥 Access the system at:"
echo "   - Hospital Interface: http://localhost:3002/hospital"
echo "   - Health Check: http://localhost:3002/health"

# Wait for the server process
wait $SERVER_PID