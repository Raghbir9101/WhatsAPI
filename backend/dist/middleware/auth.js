"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyApiKey = void 0;
const models_1 = require("../models");
// Middleware to verify API key
const verifyApiKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    try {
        const user = yield models_1.User.findOne({ apiKey, isActive: true }).lean();
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('API key verification error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
exports.verifyApiKey = verifyApiKey;
