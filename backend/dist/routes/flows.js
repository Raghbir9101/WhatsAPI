"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const flowController_1 = require("../controllers/flowController");
const router = express_1.default.Router();
// Get all flows
router.get('/', auth_1.verifyApiKey, flowController_1.getFlows);
// Get flow statistics
router.get('/stats', auth_1.verifyApiKey, flowController_1.getFlowStats);
// Get specific flow
router.get('/:id', auth_1.verifyApiKey, flowController_1.getFlow);
// Create new flow
router.post('/', auth_1.verifyApiKey, flowController_1.createFlow);
// Update flow
router.put('/:id', auth_1.verifyApiKey, flowController_1.updateFlow);
// Delete flow
router.delete('/:id', auth_1.verifyApiKey, flowController_1.deleteFlow);
// Toggle flow status
router.patch('/:id/toggle', auth_1.verifyApiKey, flowController_1.toggleFlowStatus);
// Test flow
router.post('/:id/test', auth_1.verifyApiKey, flowController_1.testFlow);
exports.default = router;
