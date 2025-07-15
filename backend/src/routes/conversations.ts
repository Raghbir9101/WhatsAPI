import express from 'express';
const router = express.Router();
import { getConversations } from '../controllers/messagesController';
import { verifyApiKey } from '../middleware/auth';

/**
 * @openapi
 * /api/conversations:
 *   get:
 *     summary: Get conversations (grouped by contact)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of conversations to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chatId:
 *                     type: string
 *                   contactName:
 *                     type: string
 *                   lastMessage:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/', verifyApiKey, getConversations);

export default router; 