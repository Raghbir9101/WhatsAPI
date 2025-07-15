import express, { Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import { userRegistrationRules, userLoginRules, handleValidation } from '../middleware/validation';
import { verifyApiKey } from '../middleware/auth';
import User from '../models/User'; // Import the User model
import { Document } from 'mongoose';

// Define the UserDocument type
interface UserDocument extends Document {
    email: string;
    name: string;
    company: string;
    apiKey: string;
}

// Extend the Request interface to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: UserDocument;
        }
    }
}

const router = express.Router();

/**
 * @openapi
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', userLoginRules, handleValidation, login);

/**
 * @openapi
 * /api/register:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               company:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Registration failed
 */
router.post('/register', register);

/**
 * @openapi
 * /api/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyApiKey, (req: Request, res: Response) => {
    // Return the authenticated user's details
    const { email, name, company, apiKey } = req.user!;
    res.json({ email, name, company, apiKey });
});

/**
 * @openapi
 * /api/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', verifyApiKey, (req: Request, res: Response) => {
    // In a stateless JWT system, logout is typically handled client-side
    // Here we could invalidate the API key or add additional logout logic if needed
    res.json({ message: 'Logged out successfully' });
});

export default router; 