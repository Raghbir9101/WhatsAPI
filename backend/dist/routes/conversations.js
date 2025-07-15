"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const messagesController_1 = require("../controllers/messagesController");
const auth_1 = require("../middleware/auth");
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
router.get('/', auth_1.verifyApiKey, messagesController_1.getConversations);
exports.default = router;
