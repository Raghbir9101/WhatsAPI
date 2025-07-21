import express from 'express';
const router = express.Router();

// Import route modules
import authRoutes from './auth';
import numbersRoutes from './numbers';
import messagesRoutes from './messages';
import conversationsRoutes from './conversations';
import statsRoutes from './stats';
import groupsRoutes from './groups';
import scheduleRoutes from './schedule';
import campaignsRoutes from './campaigns';
import templatesRoutes from './templates';
import reportsRoutes from './reports';
import indiamartRoutes from './indiamart';
import adminRoutes from './admin';
import uploadRoutes from './upload';
import flowRoutes from './flows';

// Import controllers for backward compatibility routes
import { 
  sendMessage, 
  sendMedia, 
  sendMediaUrl, 
  getChatInfo 
} from '../controllers/messagesController';
import { User, WhatsAppInstance } from '../models';
import { sendTemplate } from '../controllers/templatesController';
import { verifyApiKey } from '../middleware/auth';
import { upload } from '../config/multer';
import { 
  sendMessageRules, 
  sendMediaRules, 
  sendMediaUrlRules,
  sendTemplateRules,
  handleValidation 
} from '../middleware/validation';

// Health check
router.get('/health', async (req, res) => {
  try {
    
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
router.post('/send-template', verifyApiKey, sendTemplateRules, handleValidation, sendTemplate);
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
router.use('/templates', templatesRoutes);
router.use('/reports', reportsRoutes);
router.use('/indiamart', indiamartRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/flows', flowRoutes);

export default router; 