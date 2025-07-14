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
// Get all campaigns
router.get('/', auth_1.verifyApiKey, campaignsController_1.getCampaigns);
// Create campaign from CSV
router.post('/csv', auth_1.verifyApiKey, multer_1.csvUpload.single('csvFile'), createCampaignRules, handleValidation, campaignsController_1.createCampaignFromCSV);
// Get campaign details
router.get('/:campaignId', auth_1.verifyApiKey, campaignsController_1.getCampaign);
// Start campaign
router.post('/:campaignId/start', auth_1.verifyApiKey, campaignsController_1.startCampaign);
// Pause/Resume campaign
router.post('/:campaignId/pause', auth_1.verifyApiKey, campaignsController_1.pauseCampaign);
// Delete campaign
router.delete('/:campaignId', auth_1.verifyApiKey, campaignsController_1.deleteCampaign);
exports.default = router;
