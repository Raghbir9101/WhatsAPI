const express = require('express');
const router = express.Router();

const { 
  getAnalytics,
  getDeliveryReport,
  getPerformanceMetrics
} = require('../controllers/reportsController');
const { verifyApiKey } = require('../middleware/auth');

// All report routes require authentication
router.use(verifyApiKey);

// Get detailed analytics report
router.get('/analytics', getAnalytics);

// Get message delivery report
router.get('/delivery', getDeliveryReport);

// Get performance metrics
router.get('/performance', getPerformanceMetrics);

module.exports = router; 