"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const indiaMartController_1 = require("../controllers/indiaMartController");
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
// Validation rules for configuration
const saveConfigRules = [
    (0, express_validator_1.body)('crmKey').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Valid CRM key is required'),
    (0, express_validator_1.body)('fetchInterval').optional().isInt({ min: 5, max: 60 }).withMessage('Fetch interval must be between 5 and 60 minutes'),
    (0, express_validator_1.body)('overlapDuration').optional().isInt({ min: 1, max: 30 }).withMessage('Overlap duration must be between 1 and 30 minutes'),
    (0, express_validator_1.body)('settings').optional().isObject().withMessage('Settings must be an object')
];
// Validation rules for lead status update
const updateLeadStatusRules = [
    (0, express_validator_1.body)('status').isIn(['new', 'contacted', 'qualified', 'converted', 'closed']).withMessage('Invalid status'),
    (0, express_validator_1.body)('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    (0, express_validator_1.body)('followUpDate').optional().isISO8601().withMessage('Follow up date must be a valid date')
];
// Test route (no auth required)
router.get('/test', (req, res) => {
    res.json({ message: 'IndiaMART routes are working!' });
});
// All routes require authentication
router.use(auth_1.verifyApiKey);
// Configuration routes
router.get('/config', indiaMartController_1.getConfig);
router.post('/config', saveConfigRules, handleValidation, indiaMartController_1.saveConfig);
// Dashboard route
router.get('/dashboard', indiaMartController_1.getDashboard);
// Lead management routes
router.get('/leads', indiaMartController_1.getLeads);
router.post('/leads/fetch', indiaMartController_1.fetchLeads);
router.put('/leads/:leadId/status', updateLeadStatusRules, handleValidation, indiaMartController_1.updateLeadStatus);
// Activity logs route
router.get('/logs', indiaMartController_1.getLogs);
exports.default = router;
