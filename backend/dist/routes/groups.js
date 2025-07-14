"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const groupsController_1 = require("../controllers/groupsController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
// Get all groups for a WhatsApp instance
router.get('/', auth_1.verifyApiKey, groupsController_1.getGroups);
// Get group details
router.get('/:groupId', auth_1.verifyApiKey, groupsController_1.getGroupDetails);
// Send message to group
router.post('/send-message', auth_1.verifyApiKey, validation_1.sendGroupMessageRules, validation_1.handleValidation, groupsController_1.sendGroupMessage);
// Create new group
router.post('/create', auth_1.verifyApiKey, validation_1.createGroupRules, validation_1.handleValidation, groupsController_1.createGroup);
exports.default = router;
