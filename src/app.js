const express = require('express');
const cors = require('cors');
const walletRoutes = require('../src/routes/walletRoutes');
const errorHandler = require('../src/utils/errorHandle');  // Import error handler

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/wallet', walletRoutes);

// Global error handler (must be placed after all routes)
app.use(errorHandler);

module.exports = app;
