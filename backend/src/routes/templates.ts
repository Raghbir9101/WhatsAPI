import express from 'express';
const router = express.Router();

import { 
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplate
} from '../controllers/templatesController';
import { verifyApiKey } from '../middleware/auth';
import { 
  createTemplateRules,
  updateTemplateRules,
  sendTemplateRules,
  handleValidation 
} from '../middleware/validation';

// All template routes require authentication
router.use(verifyApiKey);

// Get all templates
router.get('/', getTemplates);

// Get template by ID
router.get('/:templateId', getTemplate);

// Create new template
router.post('/', createTemplateRules, handleValidation, createTemplate);

// Update template
router.put('/:templateId', updateTemplateRules, handleValidation, updateTemplate);

// Delete template
router.delete('/:templateId', deleteTemplate);

// Send template message
router.post('/send', sendTemplateRules, handleValidation, sendTemplate);

export default router; 