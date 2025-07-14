"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const templatesController_1 = require("../controllers/templatesController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
// All template routes require authentication
router.use(auth_1.verifyApiKey);
// Get all templates
router.get('/', templatesController_1.getTemplates);
// Get template by ID
router.get('/:templateId', templatesController_1.getTemplate);
// Create new template
router.post('/', validation_1.createTemplateRules, validation_1.handleValidation, templatesController_1.createTemplate);
// Update template
router.put('/:templateId', validation_1.updateTemplateRules, validation_1.handleValidation, templatesController_1.updateTemplate);
// Delete template
router.delete('/:templateId', templatesController_1.deleteTemplate);
// Send template message
router.post('/send', validation_1.sendTemplateRules, validation_1.handleValidation, templatesController_1.sendTemplate);
exports.default = router;
