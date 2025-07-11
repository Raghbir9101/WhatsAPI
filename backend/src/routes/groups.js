const express = require('express');
const router = express.Router();
const { 
  getGroups, 
  getGroupDetails, 
  sendGroupMessage, 
  createGroup 
} = require('../controllers/groupsController');
const { verifyApiKey } = require('../middleware/auth');
const { 
  sendGroupMessageRules, 
  createGroupRules, 
  handleValidation 
} = require('../middleware/validation');

// Get all groups for a WhatsApp instance
router.get('/', verifyApiKey, getGroups);

// Get group details
router.get('/:groupId', verifyApiKey, getGroupDetails);

// Send message to group
router.post('/send-message', verifyApiKey, sendGroupMessageRules, handleValidation, sendGroupMessage);

// Create new group
router.post('/create', verifyApiKey, createGroupRules, handleValidation, createGroup);

module.exports = router; 