"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const scheduleController_1 = require("../controllers/scheduleController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// Validation rules
const scheduleMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty().withMessage('Instance ID is required'),
    (0, express_validator_1.body)('to').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 }).withMessage('Message is required and must be under 4096 characters'),
    (0, express_validator_1.body)('scheduledAt').isISO8601().withMessage('Valid scheduled date is required')
];
/**
 * @openapi
 * /api/schedule/message:
 *   post:
 *     summary: Schedule a message
 *     tags: [Scheduled Messages]
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
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time to send the message
 *     responses:
 *       201:
 *         description: Message scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messageId:
 *                   type: string
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/message', auth_1.verifyApiKey, scheduleMessageRules, handleValidation, scheduleController_1.scheduleMessage);
/**
 * @openapi
 * /api/schedule/messages:
 *   get:
 *     summary: Get scheduled messages
 *     tags: [Scheduled Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['pending', 'sent', 'failed']
 *         description: Filter scheduled messages by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of scheduled messages to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved scheduled messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   to:
 *                     type: string
 *                   message:
 *                     type: string
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/messages', auth_1.verifyApiKey, scheduleController_1.getScheduledMessages);
/**
 * @openapi
 * /api/schedule/messages/{messageId}:
 *   delete:
 *     summary: Cancel scheduled message
 *     tags: [Scheduled Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the scheduled message
 *     responses:
 *       200:
 *         description: Scheduled message cancelled successfully
 *       400:
 *         description: Cannot cancel message
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Scheduled message not found
 */
router.delete('/messages/:messageId', auth_1.verifyApiKey, scheduleController_1.cancelScheduledMessage);
exports.default = router;
