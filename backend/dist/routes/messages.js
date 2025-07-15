"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const messagesController_1 = require("../controllers/messagesController");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const validation_1 = require("../middleware/validation");
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
router.get('/', auth_1.verifyApiKey, messagesController_1.getMessages);
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
router.get('/conversations', auth_1.verifyApiKey, messagesController_1.getConversations);
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
router.get('/stats', auth_1.verifyApiKey, statsController_1.getMessageStats);
/**
 * @openapi
 * /api/messages/send-message-unified:
 *   post:
 *     summary: Send a unified message with advanced options
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
 *               templateName:
 *                 type: string
 *                 description: Optional template name for message
 *               templateVariables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional variables for template message
 *               mediaUrl:
 *                 type: string
 *                 description: Optional URL of media to send with message
 *               caption:
 *                 type: string
 *                 description: Optional caption for media message
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send-message-unified', auth_1.verifyApiKey, validation_1.sendMessageRules, validation_1.handleValidation, messagesController_1.sendMessageUnified);
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
router.post('/send-message', auth_1.verifyApiKey, validation_1.sendMessageRules, validation_1.handleValidation, messagesController_1.sendMessage);
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
router.post('/send-media', auth_1.verifyApiKey, multer_1.upload.single('media'), validation_1.sendMediaRules, validation_1.handleValidation, messagesController_1.sendMedia);
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
router.post('/send-media-url', auth_1.verifyApiKey, validation_1.sendMediaUrlRules, validation_1.handleValidation, messagesController_1.sendMediaUrl);
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
router.get('/chat-info', auth_1.verifyApiKey, messagesController_1.getChatInfo);
exports.default = router;
