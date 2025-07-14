"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const statsController_1 = require("../controllers/statsController");
const auth_1 = require("../middleware/auth");
// Get user statistics
router.get('/', auth_1.verifyApiKey, statsController_1.getUserStats);
// Get message statistics
router.get('/messages', auth_1.verifyApiKey, statsController_1.getMessageStats);
exports.default = router;
