const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  sendMedia, 
  sendMediaUrl, 
  getChatInfo, 
  getMessages, 
  getConversations 
} = require('../controllers/messagesController');
const { getMessageStats } = require('../controllers/statsController');
const { verifyApiKey } = require('../middleware/auth');
const { upload } = require('../config/multer');
const { 
  sendMessageRules, 
  sendMediaRules, 
  sendMediaUrlRules, 
  handleValidation 
} = require('../middleware/validation');

// Get messages with filters
router.get('/', verifyApiKey, getMessages);

// Get conversations (grouped by contact)
router.get('/conversations', verifyApiKey, getConversations);

// Get message statistics (backward compatibility)
router.get('/stats', verifyApiKey, getMessageStats);

// Send text message
router.post('/send-message', verifyApiKey, sendMessageRules, handleValidation, sendMessage);

// Send media message
router.post('/send-media', verifyApiKey, upload.single('media'), sendMediaRules, handleValidation, sendMedia);

// Send media from URL
router.post('/send-media-url', verifyApiKey, sendMediaUrlRules, handleValidation, sendMediaUrl);

// Get chat info
router.get('/chat-info', verifyApiKey, getChatInfo);

module.exports = router; 