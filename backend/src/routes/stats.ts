import express from 'express';
const router = express.Router();
import { getUserStats, getMessageStats } from '../controllers/statsController';
import { verifyApiKey } from '../middleware/auth';

/**
 * @openapi
 * /api/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 newUsersThisMonth:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/', verifyApiKey, getUserStats);

/**
 * @openapi
 * /api/stats/messages:
 *   get:
 *     summary: Get message statistics
 *     tags: [Statistics]
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
 *         description: Start date for message statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for message statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved message statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMessagesSent:
 *                   type: integer
 *                 totalMessagesReceived:
 *                   type: integer
 *                 averageMessagesPerDay:
 *                   type: number
 *       401:
 *         description: Unauthorized access
 */
router.get('/messages', verifyApiKey, getMessageStats);

export default router;