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

/**
 * @openapi
 * /api/numbers:
 *   get:
 *     summary: Get all WhatsApp numbers for a user
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all WhatsApp numbers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   instanceId:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized access
 */
router.get('/', verifyApiKey, getAllNumbers);

/**
 * @openapi
 * /api/numbers/add:
 *   post:
 *     summary: Add a new WhatsApp number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceName:
 *                 type: string
 *                 description: Unique name for the WhatsApp instance
 *               description:
 *                 type: string
 *                 description: Optional description for the number
 *     responses:
 *       201:
 *         description: WhatsApp number added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/add', verifyApiKey, addNumberRules, handleValidation, addNumber);

/**
 * @openapi
 * /api/numbers/{instanceId}/initialize:
 *   post:
 *     summary: Initialize WhatsApp client for a specific number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: WhatsApp client initialized successfully
 *       400:
 *         description: Initialization failed
 *       401:
 *         description: Unauthorized access
 */
router.post('/:instanceId/initialize', verifyApiKey, initializeNumber);

/**
 * @openapi
 * /api/numbers/{instanceId}/force-qr:
 *   post:
 *     summary: Force QR code regeneration for a specific number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code regenerated successfully
 *       400:
 *         description: QR regeneration failed
 *       401:
 *         description: Unauthorized access
 */
router.post('/:instanceId/force-qr', verifyApiKey, forceQRRegeneration);

/**
 * @openapi
 * /api/numbers/{instanceId}/qr:
 *   get:
 *     summary: Get QR code for a specific number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: QR code retrieval failed
 *       401:
 *         description: Unauthorized access
 */
router.get('/:instanceId/qr', verifyApiKey, getQRCode);

/**
 * @openapi
 * /api/numbers/{instanceId}:
 *   get:
 *     summary: Get specific number details
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 instanceId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 qrCodeStatus:
 *                   type: string
 *       404:
 *         description: Number not found
 *       401:
 *         description: Unauthorized access
 */
router.get('/:instanceId', verifyApiKey, getNumberDetails);

/**
 * @openapi
 * /api/numbers/{instanceId}/disconnect:
 *   post:
 *     summary: Disconnect WhatsApp number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number disconnected successfully
 *       400:
 *         description: Disconnection failed
 *       401:
 *         description: Unauthorized access
 */
router.post('/:instanceId/disconnect', verifyApiKey, disconnectNumber);

/**
 * @openapi
 * /api/numbers/{instanceId}:
 *   delete:
 *     summary: Delete WhatsApp number
 *     tags: [WhatsApp Numbers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number deleted successfully
 *       400:
 *         description: Deletion failed
 *       401:
 *         description: Unauthorized access
 */
router.delete('/:instanceId', verifyApiKey, deleteNumber);

export default router; 