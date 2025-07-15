import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Import configurations and services
import { connectDB } from './config/database';
import WhatsAppManager from './services/WhatsAppManager';
import SchedulerService from './services/SchedulerService';
import indiaMartScheduler from './services/IndiaMartScheduler';
import { createRequiredDirectories } from './utils/helpers';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { runSeed } from './utils/seed';
// Import routes
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Create required directories
import fs from 'fs';
createRequiredDirectories(fs);

// Initialize services
const whatsappManager = new WhatsAppManager();
const schedulerService = new SchedulerService(whatsappManager);

// Store services in app.locals for access in controllers
app.locals.whatsappManager = whatsappManager;
app.locals.schedulerService = schedulerService;
app.locals.indiaMartScheduler = indiaMartScheduler;

// Connect to database
connectDB().then(async () => {
  // Run seed data
  await runSeed();
  
  // Start schedulers after database connection
  schedulerService.start();
  indiaMartScheduler.start();
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Basic middleware
// app.use(helmet());
app.use(cors({
  origin: '*',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "../../frontend", "dist")));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsAPI Backend API',
      version: '1.0.0',
      description: 'API documentation for WhatsAPI backend',
    },
    servers: [
      {
        url: 'http://localhost:80', // Update with your actual server URL
      },
    ],
    basePath: '/api', // Add base path for API routes
  },
  apis: [
    './src/routes/*.ts', 
    './src/controllers/*.ts',
    './src/routes/**/*.ts', // Add this to catch nested routes
    './src/controllers/**/*.ts' // Add this to catch nested controllers
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Explicitly mount Swagger UI at /apis/docs
app.use('/apis/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true, // Add this to make the UI more interactive
}));

// Ensure API routes are mounted at /apis instead of /api
app.use('/api', apiRoutes);

// Modify the catch-all route to handle /apis routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.originalUrl.startsWith('/api/')) {
    return notFoundHandler(req, res);
  }
  
  res.sendFile(path.join(__dirname, "../../frontend", "dist", "index.html"));
});

// Error handling middleware - must be LAST
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await whatsappManager.shutdown();
    indiaMartScheduler.stop();
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
  console.log('   ✅ IndiaMART leads integration');
  console.log('   ✅ Organized MVC structure');
  console.log('   ✅ Modular architecture');
});

export default app; 