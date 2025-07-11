const express = require('express');
const router = express.Router();
const { 
  getCampaigns,
  createCampaignFromCSV,
  getCampaign,
  startCampaign,
  pauseCampaign,
  deleteCampaign
} = require('../controllers/campaignsController');
const { verifyApiKey } = require('../middleware/auth');
const { csvUpload } = require('../config/multer');
const { body, validationResult } = require('express-validator');

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

// Get all campaigns
router.get('/', verifyApiKey, getCampaigns);

// Create campaign from CSV
router.post('/csv', verifyApiKey, csvUpload.single('csvFile'), createCampaignRules, handleValidation, createCampaignFromCSV);

// Get campaign details
router.get('/:campaignId', verifyApiKey, getCampaign);

// Start campaign
router.post('/:campaignId/start', verifyApiKey, startCampaign);

// Pause/Resume campaign
router.post('/:campaignId/pause', verifyApiKey, pauseCampaign);

// Delete campaign
router.delete('/:campaignId', verifyApiKey, deleteCampaign);

module.exports = router; 