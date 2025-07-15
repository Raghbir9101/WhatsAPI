"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const campaignsController_1 = require("../controllers/campaignsController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const express_validator_1 = require("express-validator");
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// Validation rules for creating campaign from CSV
const createCampaignRules = [
    (0, express_validator_1.body)('instanceId').notEmpty().withMessage('Instance ID is required'),
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Campaign name is required and must be under 100 characters'),
    (0, express_validator_1.body)('message').optional().isLength({ min: 1, max: 4096 }).withMessage('Message must be under 4096 characters'),
    (0, express_validator_1.body)('templateId').optional(),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
    (0, express_validator_1.body)('delayBetweenMessages').optional().isNumeric().withMessage('Delay must be a number')
];
/**
 * @openapi
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['draft', 'active', 'paused', 'completed']
 *         description: Filter campaigns by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of campaigns to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns
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
 *                   status:
 *                     type: string
 *                   totalRecipients:
 *                     type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/', auth_1.verifyApiKey, campaignsController_1.getCampaigns);
/**
 * @openapi
 * /api/campaigns/csv:
 *   post:
 *     summary: Create campaign from CSV
 *     tags: [Campaigns]
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
 *               name:
 *                 type: string
 *                 description: Campaign name
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with recipient details
 *               message:
 *                 type: string
 *                 description: Campaign message (optional)
 *               templateId:
 *                 type: string
 *                 description: Template ID to use (optional)
 *               description:
 *                 type: string
 *                 description: Campaign description (optional)
 *               delayBetweenMessages:
 *                 type: number
 *                 description: Delay between messages in seconds (optional)
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaignId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 totalRecipients:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/csv', auth_1.verifyApiKey, multer_1.csvUpload.single('csvFile'), createCampaignRules, handleValidation, campaignsController_1.createCampaignFromCSV);
/**
 * @openapi
 * /api/campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign details
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the campaign
 *     responses:
 *       200:
 *         description: Successfully retrieved campaign details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 status:
 *                   type: string
 *                 totalRecipients:
 *                   type: integer
 *                 sentMessages:
 *                   type: integer
 *                 failedMessages:
 *                   type: integer
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized access
 */
router.get('/:campaignId', auth_1.verifyApiKey, campaignsController_1.getCampaign);
/**
 * @openapi
 * /api/campaigns/{campaignId}/start:
 *   post:
 *     summary: Start campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the campaign
 *     responses:
 *       200:
 *         description: Campaign started successfully
 *       400:
 *         description: Campaign cannot be started
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Campaign not found
 */
router.post('/:campaignId/start', auth_1.verifyApiKey, campaignsController_1.startCampaign);
/**
 * @openapi
 * /api/campaigns/{campaignId}/pause:
 *   post:
 *     summary: Pause/Resume campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the campaign
 *     responses:
 *       200:
 *         description: Campaign paused/resumed successfully
 *       400:
 *         description: Campaign cannot be paused/resumed
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Campaign not found
 */
router.post('/:campaignId/pause', auth_1.verifyApiKey, campaignsController_1.pauseCampaign);
/**
 * @openapi
 * /api/campaigns/{campaignId}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the campaign
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *       400:
 *         description: Campaign cannot be deleted
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Campaign not found
 */
router.delete('/:campaignId', auth_1.verifyApiKey, campaignsController_1.deleteCampaign);
exports.default = router;
