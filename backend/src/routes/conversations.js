const express = require('express');
const router = express.Router();
const { getConversations } = require('../controllers/messagesController');
const { verifyApiKey } = require('../middleware/auth');

// Get conversations (shorthand for /api/messages/conversations)
router.get('/', verifyApiKey, getConversations);

module.exports = router; 