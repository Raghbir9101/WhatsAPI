"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const messagesController_1 = require("../controllers/messagesController");
const auth_1 = require("../middleware/auth");
// Get conversations (shorthand for /api/messages/conversations)
router.get('/', auth_1.verifyApiKey, messagesController_1.getConversations);
exports.default = router;
