const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const numbersRoutes = require('./numbers');
const messagesRoutes = require('./messages');
const conversationsRoutes = require('./conversations');
const statsRoutes = require('./stats');
const groupsRoutes = require('./groups');
const scheduleRoutes = require('./schedule');
const campaignsRoutes = require('./campaigns');
// const templatesRoutes = require('./templates');
// const reportsRoutes = require('./reports');

// Import controllers for backward compatibility routes
const { 
  sendMessage, 
  sendMedia, 
  sendMediaUrl, 
  getChatInfo 
} = require('../controllers/messagesController');
const { verifyApiKey } = require('../middleware/auth');
const { upload } = require('../config/multer');
const { 
  sendMessageRules, 
  sendMediaRules, 
  sendMediaUrlRules, 
  handleValidation 
} = require('../middleware/validation');

// Health check
router.get('/health', async (req, res) => {
  try {
    const { User, WhatsAppInstance } = require('../models');
    const [totalUsers, totalNumbers] = await Promise.all([
      User.countDocuments(),
      WhatsAppInstance.countDocuments()
    ]);
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      totalUsers,
      totalNumbers
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Backward compatibility routes - direct messaging endpoints
router.post('/send-message', verifyApiKey, sendMessageRules, handleValidation, sendMessage);
router.post('/send-media', verifyApiKey, upload.single('media'), sendMediaRules, handleValidation, sendMedia);
router.post('/send-media-url', verifyApiKey, sendMediaUrlRules, handleValidation, sendMediaUrl);
router.get('/chat-info', verifyApiKey, getChatInfo);

// Mount route modules
router.use('/', authRoutes);
router.use('/numbers', numbersRoutes);
router.use('/messages', messagesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/stats', statsRoutes);
router.use('/groups', groupsRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/campaigns', campaignsRoutes);
// router.use('/templates', templatesRoutes);
// router.use('/reports', reportsRoutes);

module.exports = router; 