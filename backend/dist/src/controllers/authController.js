"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// User registration
const register = async (req, res) => {
    const { email, password, name, company } = req.body;
    try {
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const apiKey = (0, helpers_1.generateApiKey)();
        const user = new models_1.User({
            email,
            name,
            company: company || '',
            password: hashedPassword,
            apiKey
        });
        await user.save();
        res.status(201).json({
            message: 'User registered successfully',
            userId: user._id,
            apiKey: user.apiKey,
            email: user.email,
            name: user.name,
            company: user.company
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.register = register;
// User login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await models_1.User.findOne({ email, isActive: true });
        if (!user || !await bcrypt_1.default.compare(password, user.password)) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ email: user.email, userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            token,
            apiKey: user.apiKey,
            userId: user._id,
            email: user.email,
            name: user.name,
            company: user.company
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
