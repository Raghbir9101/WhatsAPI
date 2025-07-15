import express from 'express';
const router = express.Router();
import { 
  sendMessage, 
  sendMedia, 
  sendMediaUrl, 
  getChatInfo, 
  getMessages, 
  getConversations 
} from '../controllers/messagesController';
import { getMessageStats } from '../controllers/statsController';
import { verifyApiKey } from '../middleware/auth';
import { upload } from '../config/multer';
import { 
  sendMessageRules, 
  sendMediaRules, 
  sendMediaUrlRules, 
  handleValidation 
} from '../middleware/validation';

/**
 * @openapi
 * /api/messages:
 *   get:
 *     summary: Get messages with filters
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: Chat ID to filter messages
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of messages to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   body:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/', verifyApiKey, getMessages);

/**
 * @openapi
 * /api/messages/conversations:
 *   get:
 *     summary: Get conversations (grouped by contact)
 *     tags: [Messages]
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
 *                   lastMessage:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/conversations', verifyApiKey, getConversations);

/**
 * @openapi
 * /api/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
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
 *       401:
 *         description: Unauthorized access
 */
router.get('/stats', verifyApiKey, getMessageStats);

/**
 * @openapi
 * /api/messages/send-message:
 *   post:
 *     summary: Send text message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: WhatsApp instance ID
 *               to:
 *                 type: string
 *                 description: Recipient phone number or chat ID
 *               message:
 *                 type: string
 *                 description: Message text (max 4096 characters)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send-message', verifyApiKey, sendMessageRules, handleValidation, sendMessage);

/**
 * @openapi
 * /api/messages/send-media:
 *   post:
 *     summary: Send media message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: WhatsApp instance ID
 *               to:
 *                 type: string
 *                 description: Recipient phone number or chat ID
 *               media:
 *                 type: string
 *                 format: binary
 *                 description: Media file to send
 *               caption:
 *                 type: string
 *                 description: Optional caption for the media
 *     responses:
 *       200:
 *         description: Media sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send-media', verifyApiKey, upload.single('media'), sendMediaRules, handleValidation, sendMedia);

/**
 * @openapi
 * /api/messages/send-media-url:
 *   post:
 *     summary: Send media from URL
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: WhatsApp instance ID
 *               to:
 *                 type: string
 *                 description: Recipient phone number or chat ID
 *               mediaUrl:
 *                 type: string
 *                 description: URL of the media to send
 *               caption:
 *                 type: string
 *                 description: Optional caption for the media
 *     responses:
 *       200:
 *         description: Media sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send-media-url', verifyApiKey, sendMediaUrlRules, handleValidation, sendMediaUrl);

/**
 * @openapi
 * /api/messages/chat-info:
 *   get:
 *     summary: Get chat information
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: Chat ID to retrieve information for
 *     responses:
 *       200:
 *         description: Successfully retrieved chat information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 isGroup:
 *                   type: boolean
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Chat not found
 */
router.get('/chat-info', verifyApiKey, getChatInfo);

export default router; 