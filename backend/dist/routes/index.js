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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Import route modules
const auth_1 = __importDefault(require("./auth"));
const numbers_1 = __importDefault(require("./numbers"));
const messages_1 = __importDefault(require("./messages"));
const conversations_1 = __importDefault(require("./conversations"));
const stats_1 = __importDefault(require("./stats"));
const groups_1 = __importDefault(require("./groups"));
const schedule_1 = __importDefault(require("./schedule"));
const campaigns_1 = __importDefault(require("./campaigns"));
const templates_1 = __importDefault(require("./templates"));
const reports_1 = __importDefault(require("./reports"));
const indiamart_1 = __importDefault(require("./indiamart"));
const admin_1 = __importDefault(require("./admin"));
// Import controllers for backward compatibility routes
const messagesController_1 = require("../controllers/messagesController");
const models_1 = require("../models");
const templatesController_1 = require("../controllers/templatesController");
const auth_2 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const validation_1 = require("../middleware/validation");
// Health check
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalUsers, totalNumbers] = yield Promise.all([
            models_1.User.countDocuments(),
            models_1.WhatsAppInstance.countDocuments()
        ]);
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            totalUsers,
            totalNumbers
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed'
        });
    }
}));
// Backward compatibility routes - direct messaging endpoints
router.post('/send-message', auth_2.verifyApiKey, validation_1.sendMessageRules, validation_1.handleValidation, messagesController_1.sendMessage);
router.post('/send-media', auth_2.verifyApiKey, multer_1.upload.single('media'), validation_1.sendMediaRules, validation_1.handleValidation, messagesController_1.sendMedia);
router.post('/send-media-url', auth_2.verifyApiKey, validation_1.sendMediaUrlRules, validation_1.handleValidation, messagesController_1.sendMediaUrl);
router.post('/send-template', auth_2.verifyApiKey, validation_1.sendTemplateRules, validation_1.handleValidation, templatesController_1.sendTemplate);
router.get('/chat-info', auth_2.verifyApiKey, messagesController_1.getChatInfo);
// Mount route modules
router.use('/', auth_1.default);
router.use('/numbers', numbers_1.default);
router.use('/messages', messages_1.default);
router.use('/conversations', conversations_1.default);
router.use('/stats', stats_1.default);
router.use('/groups', groups_1.default);
router.use('/schedule', schedule_1.default);
router.use('/campaigns', campaigns_1.default);
router.use('/templates', templates_1.default);
router.use('/reports', reports_1.default);
router.use('/indiamart', indiamart_1.default);
router.use('/admin', admin_1.default);
exports.default = router;
