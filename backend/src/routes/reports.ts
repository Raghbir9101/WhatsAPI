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

/**
 * @openapi
 * /api/reports/analytics:
 *   get:
 *     summary: Get detailed analytics report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMessages:
 *                   type: integer
 *                 sentMessages:
 *                   type: integer
 *                 receivedMessages:
 *                   type: integer
 *                 uniqueContacts:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/analytics', getAnalytics);

/**
 * @openapi
 * /api/reports/delivery:
 *   get:
 *     summary: Get message delivery report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for delivery report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for delivery report
 *     responses:
 *       200:
 *         description: Successfully retrieved delivery report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMessages:
 *                   type: integer
 *                 deliveredMessages:
 *                   type: integer
 *                 pendingMessages:
 *                   type: integer
 *                 failedMessages:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/delivery', getDeliveryReport);

/**
 * @openapi
 * /api/reports/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for performance metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for performance metrics
 *     responses:
 *       200:
 *         description: Successfully retrieved performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageResponseTime:
 *                   type: number
 *                 messageResponseRate:
 *                   type: number
 *                 peakHours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: number
 *                       messageCount:
 *                         type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/performance', getPerformanceMetrics);

export default router; 