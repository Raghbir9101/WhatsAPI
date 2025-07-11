const express = require('express');
const router = express.Router();
const { getUserStats, getMessageStats } = require('../controllers/statsController');
const { verifyApiKey } = require('../middleware/auth');

// Get user statistics
router.get('/', verifyApiKey, getUserStats);

// Get message statistics
router.get('/messages', verifyApiKey, getMessageStats);

module.exports = router; 