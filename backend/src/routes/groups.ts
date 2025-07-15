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

/**
 * @openapi
 * /api/groups:
 *   get:
 *     summary: Get all groups for a WhatsApp instance
 *     tags: [WhatsApp Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: instanceId
 *         schema:
 *           type: string
 *         description: WhatsApp instance ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of groups to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   participants:
 *                     type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/', verifyApiKey, getGroups);

/**
 * @openapi
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get group details
 *     tags: [WhatsApp Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID to retrieve details for
 *     responses:
 *       200:
 *         description: Successfully retrieved group details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized access
 */
router.get('/:groupId', verifyApiKey, getGroupDetails);

/**
 * @openapi
 * /api/groups/send-message:
 *   post:
 *     summary: Send message to group
 *     tags: [WhatsApp Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: WhatsApp instance ID
 *               groupId:
 *                 type: string
 *                 description: Group ID to send message to
 *               message:
 *                 type: string
 *                 description: Message text (max 4096 characters)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/send-message', verifyApiKey, sendGroupMessageRules, handleValidation, sendGroupMessage);

/**
 * @openapi
 * /api/groups/create:
 *   post:
 *     summary: Create new group
 *     tags: [WhatsApp Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instanceId:
 *                 type: string
 *                 description: WhatsApp instance ID
 *               name:
 *                 type: string
 *                 description: Group name (1-100 characters)
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of participant phone numbers
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: string
 *                 name:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized access
 */
router.post('/create', verifyApiKey, createGroupRules, handleValidation, createGroup);

export default router; 