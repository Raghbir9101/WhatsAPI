import express from 'express';
const router = express.Router();
import { getConversations } from '../controllers/messagesController';
import { verifyApiKey } from '../middleware/auth';

// Get conversations (shorthand for /api/messages/conversations)
router.get('/', verifyApiKey, getConversations);

export default router; 