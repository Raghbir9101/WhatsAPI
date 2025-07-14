import express from 'express';
const router = express.Router();
import { register, login } from '../controllers/authController';
import { userRegistrationRules, userLoginRules, handleValidation } from '../middleware/validation';

// User registration
router.post('/register', userRegistrationRules, handleValidation, register);

// User login
router.post('/login', userLoginRules, handleValidation, login);

export default router; 