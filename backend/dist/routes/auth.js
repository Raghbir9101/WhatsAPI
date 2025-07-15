"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
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
router.post('/login', validation_1.userLoginRules, validation_1.handleValidation, authController_1.login);
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
router.post('/register', validation_1.userRegistrationRules, validation_1.handleValidation, authController_1.register);
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
router.get('/me', auth_1.verifyApiKey, (req, res) => {
    // Return the authenticated user's details
    const { email, name, company, apiKey } = req.user;
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
router.post('/logout', auth_1.verifyApiKey, (req, res) => {
    // In a stateless JWT system, logout is typically handled client-side
    // Here we could invalidate the API key or add additional logout logic if needed
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
