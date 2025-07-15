"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const templatesController_1 = require("../controllers/templatesController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
// All template routes require authentication
router.use(auth_1.verifyApiKey);
/**
 * @openapi
 * /api/templates:
 *   get:
 *     summary: Get all message templates
 *     tags: [Message Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['general', 'welcome', 'follow-up', 'promotional', 'support']
 *         description: Filter templates by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of templates to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   category:
 *                     type: string
 *                   content:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/', templatesController_1.getTemplates);
/**
 * @openapi
 * /api/templates/{templateId}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Message Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template
 *     responses:
 *       200:
 *         description: Successfully retrieved template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 content:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized access
 */
router.get('/:templateId', templatesController_1.getTemplate);
/**
 * @openapi
 * /api/templates:
 *   post:
 *     summary: Create new message template
 *     tags: [Message Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name (1-100 characters)
 *               content:
 *                 type: string
 *                 description: Template message content (max 4096 characters)
 *               category:
 *                 type: string
 *                 enum: ['general', 'welcome', 'follow-up', 'promotional', 'support']
 *               description:
 *                 type: string
 *                 description: Optional template description
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/', validation_1.createTemplateRules, validation_1.handleValidation, templatesController_1.createTemplate);
/**
 * @openapi
 * /api/templates/{templateId}:
 *   put:
 *     summary: Update existing message template
 *     tags: [Message Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated template name
 *               content:
 *                 type: string
 *                 description: Updated template message content
 *               category:
 *                 type: string
 *                 enum: ['general', 'welcome', 'follow-up', 'promotional', 'support']
 *               description:
 *                 type: string
 *                 description: Updated template description
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Template not found
 */
router.put('/:templateId', validation_1.updateTemplateRules, validation_1.handleValidation, templatesController_1.updateTemplate);
/**
 * @openapi
 * /api/templates/{templateId}:
 *   delete:
 *     summary: Delete message template
 *     tags: [Message Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the template
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Template not found
 */
router.delete('/:templateId', templatesController_1.deleteTemplate);
/**
 * @openapi
 * /api/templates/send:
 *   post:
 *     summary: Send template message
 *     tags: [Message Templates]
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
 *                 description: Recipient phone number
 *               templateId:
 *                 type: string
 *                 description: ID of the template to send
 *               variables:
 *                 type: object
 *                 description: Optional variables to replace in template
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: Template message sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send', validation_1.sendTemplateRules, validation_1.handleValidation, templatesController_1.sendTemplate);
exports.default = router;
