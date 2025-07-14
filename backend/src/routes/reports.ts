import express from 'express';
const router = express.Router();

import { 
  getAnalytics,
  getDeliveryReport,
  getPerformanceMetrics
} from '../controllers/reportsController';
import { verifyApiKey } from '../middleware/auth';

// All report routes require authentication
router.use(verifyApiKey);

// Get detailed analytics report
router.get('/analytics', getAnalytics);

// Get message delivery report
router.get('/delivery', getDeliveryReport);

// Get performance metrics
router.get('/performance', getPerformanceMetrics);

export default router; 