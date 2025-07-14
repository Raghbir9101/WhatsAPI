"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const scheduleController_1 = require("../controllers/scheduleController");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// Validation rules
const scheduleMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty().withMessage('Instance ID is required'),
    (0, express_validator_1.body)('to').notEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 }).withMessage('Message is required and must be under 4096 characters'),
    (0, express_validator_1.body)('scheduledAt').isISO8601().withMessage('Valid scheduled date is required')
];
// Schedule a message
router.post('/message', auth_1.verifyApiKey, scheduleMessageRules, handleValidation, scheduleController_1.scheduleMessage);
// Get scheduled messages
router.get('/messages', auth_1.verifyApiKey, scheduleController_1.getScheduledMessages);
// Cancel scheduled message
router.delete('/messages/:messageId', auth_1.verifyApiKey, scheduleController_1.cancelScheduledMessage);
exports.default = router;
