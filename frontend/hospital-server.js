// Hospital Frontend Server for MACHS
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS headers for API communication
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'MACHS Hospital Frontend',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// Serve the hospital interface
app.get('/hospital', (req, res) => {
    res.sendFile(path.join(__dirname, 'hospital.html'));
});

// Serve the original test interface  
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Redirect root to hospital interface
app.get('/', (req, res) => {
    res.redirect('/hospital');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 MACHS Hospital Frontend running on http://localhost:${PORT}`);
    console.log(`🏥 Hospital Interface: http://localhost:${PORT}/hospital`);
    console.log(`🧪 Original Test Interface: http://localhost:${PORT}/test`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
});