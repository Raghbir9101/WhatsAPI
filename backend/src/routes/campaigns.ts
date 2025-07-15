import express from 'express';
const router = express.Router();
import { 
  getCampaigns,
  createCampaignFromCSV,
  getCampaign,
  startCampaign,
  pauseCampaign,
  deleteCampaign
} from '../controllers/campaignsController';
import { verifyApiKey } from '../middleware/auth';
import { csvUpload } from '../config/multer';
import { body, validationResult } from 'express-validator';

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for creating campaign from CSV
const createCampaignRules = [
  body('instanceId').notEmpty().withMessage('Instance ID is required'),
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Campaign name is required and must be under 100 characters'),
  body('message').optional().isLength({ min: 1, max: 4096 }).withMessage('Message must be under 4096 characters'),
  body('templateId').optional(),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  body('delayBetweenMessages').optional().isNumeric().withMessage('Delay must be a number')
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
router.get('/', verifyApiKey, getCampaigns);

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
router.post('/csv', verifyApiKey, csvUpload.single('csvFile'), createCampaignRules, handleValidation, createCampaignFromCSV);

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
router.get('/:campaignId', verifyApiKey, getCampaign);

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
router.post('/:campaignId/start', verifyApiKey, startCampaign);

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
router.post('/:campaignId/pause', verifyApiKey, pauseCampaign);

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
router.delete('/:campaignId', verifyApiKey, deleteCampaign);

export default router; 