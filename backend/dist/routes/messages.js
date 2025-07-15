"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const messagesController_1 = require("../controllers/messagesController");
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const validation_1 = require("../middleware/validation");
// Get messages with filters
router.get('/', auth_1.verifyApiKey, messagesController_1.getMessages);
// Get conversations (grouped by contact)
router.get('/conversations', auth_1.verifyApiKey, messagesController_1.getConversations);
// Get message statistics (backward compatibility)
router.get('/stats', auth_1.verifyApiKey, statsController_1.getMessageStats);
// Send text message
router.post('/send-message-unified', auth_1.verifyApiKey, validation_1.sendMessageRules, validation_1.handleValidation, messagesController_1.sendMessageUnified);
// Send text message
router.post('/send-message', auth_1.verifyApiKey, validation_1.sendMessageRules, validation_1.handleValidation, messagesController_1.sendMessage);
// Send media message
router.post('/send-media', auth_1.verifyApiKey, multer_1.upload.single('media'), validation_1.sendMediaRules, validation_1.handleValidation, messagesController_1.sendMedia);
// Send media from URL
router.post('/send-media-url', auth_1.verifyApiKey, validation_1.sendMediaUrlRules, validation_1.handleValidation, messagesController_1.sendMediaUrl);
// Get chat info
router.get('/chat-info', auth_1.verifyApiKey, messagesController_1.getChatInfo);
exports.default = router;
