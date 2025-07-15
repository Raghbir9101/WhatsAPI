import express from 'express';
const router = express.Router();
import { register, login } from '../controllers/authController';

// User registration
router.post('/register', register);

// User login
router.post('/login', login);

export default router; 