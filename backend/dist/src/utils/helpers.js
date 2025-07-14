"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequiredDirectories = exports.formatPhoneNumber = exports.generateInstanceId = exports.generateApiKey = void 0;
const uuid_1 = require("uuid");
// Generate unique identifiers
const generateApiKey = () => {
    return 'wa_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};
exports.generateApiKey = generateApiKey;
const generateInstanceId = () => {
    return 'inst_' + (0, uuid_1.v4)().replace(/-/g, '');
};
exports.generateInstanceId = generateInstanceId;
// Phone number formatter
const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        return '91' + cleaned + '@c.us';
    }
    return cleaned + '@c.us';
};
exports.formatPhoneNumber = formatPhoneNumber;
// Create required directories
const createRequiredDirectories = (fsModule) => {
    const dirs = ['sessions', 'uploads', 'public', 'logs'];
    dirs.forEach(dir => {
        if (!fsModule.existsSync(dir)) {
            fsModule.mkdirSync(dir, { recursive: true });
        }
    });
};
exports.createRequiredDirectories = createRequiredDirectories;
