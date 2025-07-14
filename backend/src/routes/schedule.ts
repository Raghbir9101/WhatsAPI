import express from 'express';
const router = express.Router();
import { 
  scheduleMessage, 
  getScheduledMessages, 
  cancelScheduledMessage 
} from '../controllers/scheduleController';
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

// Validation rules
const scheduleMessageRules = [
  body('instanceId').notEmpty().withMessage('Instance ID is required'),
  body('to').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().isLength({ max: 4096 }).withMessage('Message is required and must be under 4096 characters'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required')
];

// Schedule a message
router.post('/message', verifyApiKey, scheduleMessageRules, handleValidation, scheduleMessage);

// Get scheduled messages
router.get('/messages', verifyApiKey, getScheduledMessages);

// Cancel scheduled message
router.delete('/messages/:messageId', verifyApiKey, cancelScheduledMessage);

export default router; 