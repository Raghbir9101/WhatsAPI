const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import configurations and services
const { connectDB } = require('./src/config/database');
const WhatsAppManager = require('./src/services/WhatsAppManager');
const SchedulerService = require('./src/services/SchedulerService');
const { createRequiredDirectories } = require('./src/utils/helpers');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Import routes
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Create required directories
const fs = require('fs');
createRequiredDirectories(fs);

// Initialize services
const whatsappManager = new WhatsAppManager();
const schedulerService = new SchedulerService(whatsappManager);

// Store services in app.locals for access in controllers
app.locals.whatsappManager = whatsappManager;
app.locals.schedulerService = schedulerService;

// Connect to database
connectDB().then(() => {
  // Start scheduler after database connection
  schedulerService.start();
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "../frontend", "dist")));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API routes
app.use('/api', apiRoutes);

// Catch-all route for SPA - must be BEFORE error handling middleware
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.originalUrl.startsWith('/api/')) {
    return notFoundHandler(req, res);
  }
  
  res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
});

// Error handling middleware - must be LAST
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await whatsappManager.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Multi-Number WhatsApp API Platform running on port ${PORT}`);
  console.log('📁 MVC Architecture Features:');
  console.log('   ✅ User registration and authentication');
  console.log('   ✅ Multiple WhatsApp numbers per user');
  console.log('   ✅ QR code scanning for each number');
  console.log('   ✅ Complete WhatsApp messaging API');
  console.log('   ✅ Organized MVC structure');
  console.log('   ✅ Modular architecture');
});

module.exports = app; 