const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://localhost:8000", "http://ehr-system:3000", "http://cryptography:8000"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:8000',
        'http://localhost:8080',
        'http://machs-ehr-system:3000',
        'http://cryptography:8000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('combined'));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes for frontend configuration
app.get('/api/config', (req, res) => {
    res.json({
        services: {
            // Always return localhost URLs for browser access
            // Docker port mapping handles the routing to containers
            ehr: 'http://localhost:3001',
            crypto: 'http://localhost:8000'
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'machs-frontend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API proxy endpoints to avoid CORS issues
app.use('/api/ehr', (req, res) => {
    const ehrServiceUrl = process.env.EHR_SERVICE_URL || 'http://localhost:3001';
    const url = req.originalUrl.replace('/api/ehr', '');
    
    // Simple proxy implementation
    res.json({
        error: 'Proxy not implemented - use direct API calls',
        target: `${ehrServiceUrl}${url}`,
        suggestion: 'Configure CORS on backend services or implement proper proxy'
    });
});

app.use('/api/crypto', (req, res) => {
    const cryptoServiceUrl = process.env.CRYPTO_SERVICE_URL || 'http://localhost:8000';
    const url = req.originalUrl.replace('/api/crypto', '');
    
    // Simple proxy implementation  
    res.json({
        error: 'Proxy not implemented - use direct API calls',
        target: `${cryptoServiceUrl}${url}`,
        suggestion: 'Configure CORS on backend services or implement proper proxy'
    });
});

// Serve main application for all other routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🌐 MACHS Frontend Server');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`🔗 EHR Service: ${process.env.EHR_SERVICE_URL || 'http://localhost:3001'}`);
    console.log(`🔐 Crypto Service: ${process.env.CRYPTO_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('📋 Press Ctrl+C to stop the server');
});