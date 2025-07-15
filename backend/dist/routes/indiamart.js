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
/**
 * @openapi
 * /api/indiamart/test:
 *   get:
 *     summary: Test IndiaMART routes
 *     tags: [IndiaMART]
 *     responses:
 *       200:
 *         description: IndiaMART routes are working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'IndiaMART routes are working!'
 */
router.get('/test', (req, res) => {
    res.json({ message: 'IndiaMART routes are working!' });
});
// All routes require authentication
router.use(auth_1.verifyApiKey);
/**
 * @openapi
 * /api/indiamart/config:
 *   get:
 *     summary: Get IndiaMART configuration
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 crmKey:
 *                   type: string
 *                 fetchInterval:
 *                   type: number
 *                 overlapDuration:
 *                   type: number
 *                 settings:
 *                   type: object
 *       401:
 *         description: Unauthorized access
 */
router.get('/config', indiaMartController_1.getConfig);
/**
 * @openapi
 * /api/indiamart/config:
 *   post:
 *     summary: Save IndiaMART configuration
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               crmKey:
 *                 type: string
 *                 description: CRM key for IndiaMART integration
 *               fetchInterval:
 *                 type: number
 *                 description: Interval for fetching leads (5-60 minutes)
 *               overlapDuration:
 *                 type: number
 *                 description: Overlap duration for lead processing (1-30 minutes)
 *               settings:
 *                 type: object
 *                 description: Additional configuration settings
 *     responses:
 *       200:
 *         description: Configuration saved successfully
 *       400:
 *         description: Invalid configuration
 *       401:
 *         description: Unauthorized access
 */
router.post('/config', saveConfigRules, handleValidation, indiaMartController_1.saveConfig);
/**
 * @openapi
 * /api/indiamart/dashboard:
 *   get:
 *     summary: Get IndiaMART dashboard
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: number
 *                 newLeads:
 *                   type: number
 *                 convertedLeads:
 *                   type: number
 *       401:
 *         description: Unauthorized access
 */
router.get('/dashboard', indiaMartController_1.getDashboard);
/**
 * @openapi
 * /api/indiamart/leads:
 *   get:
 *     summary: Get IndiaMART leads
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['new', 'contacted', 'qualified', 'converted', 'closed']
 *         description: Filter leads by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of leads to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   companyName:
 *                     type: string
 *                   contactPerson:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/leads', indiaMartController_1.getLeads);
/**
 * @openapi
 * /api/indiamart/leads/fetch:
 *   post:
 *     summary: Fetch new leads from IndiaMART
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newLeads:
 *                   type: number
 *       401:
 *         description: Unauthorized access
 */
router.post('/leads/fetch', indiaMartController_1.fetchLeads);
/**
 * @openapi
 * /api/indiamart/leads/{leadId}/status:
 *   put:
 *     summary: Update lead status
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['new', 'contacted', 'qualified', 'converted', 'closed']
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional follow-up date
 *     responses:
 *       200:
 *         description: Lead status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Lead not found
 */
router.put('/leads/:leadId/status', updateLeadStatusRules, handleValidation, indiaMartController_1.updateLeadStatus);
/**
 * @openapi
 * /api/indiamart/logs:
 *   get:
 *     summary: Get IndiaMART activity logs
 *     tags: [IndiaMART]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of logs to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                   action:
 *                     type: string
 *                   details:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/logs', indiaMartController_1.getLogs);
exports.default = router;
