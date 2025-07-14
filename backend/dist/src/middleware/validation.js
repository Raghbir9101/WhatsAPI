"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidation = exports.sendTemplateRules = exports.updateTemplateRules = exports.createTemplateRules = exports.createGroupRules = exports.sendGroupMessageRules = exports.sendMediaUrlRules = exports.sendMediaRules = exports.sendMessageRules = exports.addNumberRules = exports.userLoginRules = exports.userRegistrationRules = void 0;
const express_validator_1 = require("express-validator");
// Validation rules for user registration
exports.userRegistrationRules = [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('name').notEmpty(),
    (0, express_validator_1.body)('company').optional()
];
// Validation rules for user login
exports.userLoginRules = [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').notEmpty()
];
// Validation rules for adding a new number
exports.addNumberRules = [
    (0, express_validator_1.body)('instanceName').notEmpty().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 200 })
];
// Validation rules for sending a message
exports.sendMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 })
];
// Validation rules for sending media
exports.sendMediaRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty()
];
// Validation rules for sending media from URL
exports.sendMediaUrlRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('mediaUrl').isURL()
];
// Validation rules for sending group message
exports.sendGroupMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('groupId').notEmpty(),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 })
];
// Validation rules for creating a group
exports.createGroupRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('participants').isArray().isLength({ min: 1 })
];
// Validation rules for creating a template
exports.createTemplateRules = [
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('content').notEmpty().isLength({ max: 4096 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }),
    (0, express_validator_1.body)('category').optional().isIn(['general', 'welcome', 'follow-up', 'promotional', 'support'])
];
// Validation rules for updating a template
exports.updateTemplateRules = [
    (0, express_validator_1.body)('name').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('content').optional().isLength({ max: 4096 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }),
    (0, express_validator_1.body)('category').optional().isIn(['general', 'welcome', 'follow-up', 'promotional', 'support'])
];
// Validation rules for sending a template
exports.sendTemplateRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('templateId').notEmpty(),
    (0, express_validator_1.body)('variables').optional().isObject()
];
// Handle validation errors
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.handleValidation = handleValidation;
