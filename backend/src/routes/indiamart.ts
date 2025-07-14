import express from 'express';
const router = express.Router();
import { 
  getConfig,
  saveConfig,
  fetchLeads,
  getLeads,
  getDashboard,
  updateLeadStatus,
  getLogs
} from '../controllers/indiaMartController';
import { verifyApiKey } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for configuration
const saveConfigRules = [
  body('crmKey').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Valid CRM key is required'),
  body('fetchInterval').optional().isInt({ min: 5, max: 60 }).withMessage('Fetch interval must be between 5 and 60 minutes'),
  body('overlapDuration').optional().isInt({ min: 1, max: 30 }).withMessage('Overlap duration must be between 1 and 30 minutes'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
];

// Validation rules for lead status update
const updateLeadStatusRules = [
  body('status').isIn(['new', 'contacted', 'qualified', 'converted', 'closed']).withMessage('Invalid status'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('followUpDate').optional().isISO8601().withMessage('Follow up date must be a valid date')
];

// Test route (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'IndiaMART routes are working!' });
});

// All routes require authentication
router.use(verifyApiKey);

// Configuration routes
router.get('/config', getConfig);
router.post('/config', saveConfigRules, handleValidation, saveConfig);

// Dashboard route
router.get('/dashboard', getDashboard);

// Lead management routes
router.get('/leads', getLeads);
router.post('/leads/fetch', fetchLeads);
router.put('/leads/:leadId/status', updateLeadStatusRules, handleValidation, updateLeadStatus);

// Activity logs route
router.get('/logs', getLogs);

export default router; 