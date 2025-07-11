const express = require('express');
const router = express.Router();

const { 
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplate
} = require('../controllers/templatesController');
const { verifyApiKey } = require('../middleware/auth');
const { 
  createTemplateRules,
  updateTemplateRules,
  sendTemplateRules,
  handleValidation 
} = require('../middleware/validation');

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

module.exports = router; 