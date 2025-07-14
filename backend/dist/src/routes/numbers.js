"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const numbersController_1 = require("../controllers/numbersController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Get all WhatsApp numbers for a user
router.get('/', auth_1.verifyApiKey, numbersController_1.getAllNumbers);
// Add new WhatsApp number
router.post('/add', auth_1.verifyApiKey, validation_1.addNumberRules, validation_1.handleValidation, numbersController_1.addNumber);
// Initialize WhatsApp client for a specific number
router.post('/:instanceId/initialize', auth_1.verifyApiKey, numbersController_1.initializeNumber);
// Force QR code regeneration
router.post('/:instanceId/force-qr', auth_1.verifyApiKey, numbersController_1.forceQRRegeneration);
// Get QR code for a specific number
router.get('/:instanceId/qr', auth_1.verifyApiKey, numbersController_1.getQRCode);
// Get specific number details
router.get('/:instanceId', auth_1.verifyApiKey, numbersController_1.getNumberDetails);
// Disconnect WhatsApp number
router.post('/:instanceId/disconnect', auth_1.verifyApiKey, numbersController_1.disconnectNumber);
// Delete WhatsApp number
router.delete('/:instanceId', auth_1.verifyApiKey, numbersController_1.deleteNumber);
exports.default = router;
