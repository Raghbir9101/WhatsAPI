const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { userRegistrationRules, userLoginRules, handleValidation } = require('../middleware/validation');

// User registration
router.post('/register', userRegistrationRules, handleValidation, register);

// User login
router.post('/login', userLoginRules, handleValidation, login);

module.exports = router; 