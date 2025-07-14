"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiKey = void 0;
const User_1 = __importDefault(require("../models/User"));
// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return;
    }
    try {
        const user = await User_1.default.findOne({ apiKey, isActive: true });
        if (!user) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('API key verification error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.verifyApiKey = verifyApiKey;
