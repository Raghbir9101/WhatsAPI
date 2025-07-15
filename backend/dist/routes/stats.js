"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
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
router.get('/', auth_1.verifyApiKey, statsController_1.getUserStats);
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
router.get('/messages', auth_1.verifyApiKey, statsController_1.getMessageStats);
exports.default = router;
