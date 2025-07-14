import express from 'express';
const router = express.Router();
import { 
  sendMessage, 
  sendMedia, 
  sendMediaUrl, 
  getChatInfo, 
  getMessages, 
  getConversations, 
  sendMessageUnified
} from '../controllers/messagesController';
import { getMessageStats } from '../controllers/statsController';
import { verifyApiKey } from '../middleware/auth';
import { upload } from '../config/multer';
import { 
  sendMessageRules, 
  sendMediaRules, 
  sendMediaUrlRules, 
  handleValidation 
} from '../middleware/validation';

// Get messages with filters
router.get('/', verifyApiKey, getMessages);

// Get conversations (grouped by contact)
router.get('/conversations', verifyApiKey, getConversations);

// Get message statistics (backward compatibility)
router.get('/stats', verifyApiKey, getMessageStats);

// Send text message
router.post('/send-message-unified', verifyApiKey, sendMessageRules, handleValidation, sendMessageUnified);

// Send text message
router.post('/send-message', verifyApiKey, sendMessageRules, handleValidation, sendMessage);

// Send media message
router.post('/send-media', verifyApiKey, upload.single('media'), sendMediaRules, handleValidation, sendMedia);

// Send media from URL
router.post('/send-media-url', verifyApiKey, sendMediaUrlRules, handleValidation, sendMediaUrl);

// Get chat info
router.get('/chat-info', verifyApiKey, getChatInfo);

export default router; 