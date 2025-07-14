import express from 'express';
const router = express.Router();
import { 
  getGroups, 
  getGroupDetails, 
  sendGroupMessage, 
  createGroup 
} from '../controllers/groupsController';
import { verifyApiKey } from '../middleware/auth';
import { 
  sendGroupMessageRules, 
  createGroupRules, 
  handleValidation 
} from '../middleware/validation';

// Get all groups for a WhatsApp instance
router.get('/', verifyApiKey, getGroups);

// Get group details
router.get('/:groupId', verifyApiKey, getGroupDetails);

// Send message to group
router.post('/send-message', verifyApiKey, sendGroupMessageRules, handleValidation, sendGroupMessage);

// Create new group
router.post('/create', verifyApiKey, createGroupRules, handleValidation, createGroup);

export default router; 