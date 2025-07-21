import express from 'express';
import { verifyApiKey } from '../middleware/auth';
import {
  getFlows,
  getFlow,
  createFlow,
  updateFlow,
  deleteFlow,
  toggleFlowStatus,
  getFlowStats,
  testFlow
} from '../controllers/flowController';

const router = express.Router();

// Get all flows
router.get('/', verifyApiKey, getFlows);

// Get flow statistics
router.get('/stats', verifyApiKey, getFlowStats);

// Get specific flow
router.get('/:id', verifyApiKey, getFlow);

// Create new flow
router.post('/', verifyApiKey, createFlow);

// Update flow
router.put('/:id', verifyApiKey, updateFlow);

// Delete flow
router.delete('/:id', verifyApiKey, deleteFlow);

// Toggle flow status
router.patch('/:id/toggle', verifyApiKey, toggleFlowStatus);

// Test flow
router.post('/:id/test', verifyApiKey, testFlow);

export default router; 