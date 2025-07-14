import express from 'express';
const router = express.Router();
import { getUserStats, getMessageStats } from '../controllers/statsController';
import { verifyApiKey } from '../middleware/auth';

// Get user statistics
router.get('/', verifyApiKey, getUserStats);

// Get message statistics
router.get('/messages', verifyApiKey, getMessageStats);

export default router; 