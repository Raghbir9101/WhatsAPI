import express from 'express';
const router = express.Router();
import { 
  addNumber, 
  initializeNumber,
  forceQRRegeneration,
  getQRCode, 
  getAllNumbers, 
  getNumberDetails, 
  disconnectNumber, 
  deleteNumber 
} from '../controllers/numbersController';
import { verifyApiKey } from '../middleware/auth';
import { addNumberRules, handleValidation } from '../middleware/validation';

// Get all WhatsApp numbers for a user
router.get('/', verifyApiKey, getAllNumbers);

// Add new WhatsApp number
router.post('/add', verifyApiKey, addNumberRules, handleValidation, addNumber);

// Initialize WhatsApp client for a specific number
router.post('/:instanceId/initialize', verifyApiKey, initializeNumber);

// Force QR code regeneration
router.post('/:instanceId/force-qr', verifyApiKey, forceQRRegeneration);

// Get QR code for a specific number
router.get('/:instanceId/qr', verifyApiKey, getQRCode);

// Get specific number details
router.get('/:instanceId', verifyApiKey, getNumberDetails);

// Disconnect WhatsApp number
router.post('/:instanceId/disconnect', verifyApiKey, disconnectNumber);

// Delete WhatsApp number
router.delete('/:instanceId', verifyApiKey, deleteNumber);

export default router; 