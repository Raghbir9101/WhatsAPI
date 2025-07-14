import express from 'express';
const router = express.Router();

import {
  getAdminStats,
  getClients,
  getClient,
  updateClientStatus,
  extendClientValidity,
  addCredits,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminController';
import { verifyAdmin, adminLogin } from '../middleware/admin';
import { body, validationResult } from 'express-validator';

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Admin login (no auth required)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidation, adminLogin);

// All routes below require admin authentication
router.use(verifyAdmin);

// Dashboard statistics
router.get('/stats', getAdminStats);

// Client management
router.get('/clients', getClients);
router.get('/clients/:id', getClient);
router.put('/clients/:id/status', [
  body('status').isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED'])
], handleValidation, updateClientStatus);
router.put('/clients/:id/extend', [
  body('days').isInt({ min: 1 })
], handleValidation, extendClientValidity);
router.put('/clients/:id/credits', [
  body('credits').isInt({ min: 1 })
], handleValidation, addCredits);

// Package management
router.get('/packages', getPackages);
router.post('/packages', [
  body('name').notEmpty().trim(),
  body('credits').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('validityDays').isInt({ min: 1 }),
  body('features').isArray({ min: 1 })
], handleValidation, createPackage);
router.put('/packages/:id', [
  body('name').notEmpty().trim(),
  body('credits').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('validityDays').isInt({ min: 1 }),
  body('features').isArray({ min: 1 })
], handleValidation, updatePackage);
router.delete('/packages/:id', deletePackage);

// System settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router; 