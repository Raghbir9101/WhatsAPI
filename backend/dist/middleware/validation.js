"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidation = exports.sendTemplateRules = exports.updateTemplateRules = exports.createTemplateRules = exports.createGroupRules = exports.sendGroupMessageRules = exports.sendMediaUrlRules = exports.sendMediaRules = exports.sendMessageRules = exports.addNumberRules = exports.userLoginRules = exports.userRegistrationRules = void 0;
const express_validator_1 = require("express-validator");
// Validation rules for user registration
const userRegistrationRules = [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('name').notEmpty(),
    (0, express_validator_1.body)('company').optional()
];
exports.userRegistrationRules = userRegistrationRules;
// Validation rules for user login
const userLoginRules = [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').notEmpty()
];
exports.userLoginRules = userLoginRules;
// Validation rules for adding a new number
const addNumberRules = [
    (0, express_validator_1.body)('instanceName').notEmpty().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 200 })
];
exports.addNumberRules = addNumberRules;
// Validation rules for sending a message
const sendMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 })
];
exports.sendMessageRules = sendMessageRules;
// Validation rules for sending media
const sendMediaRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty()
];
exports.sendMediaRules = sendMediaRules;
// Validation rules for sending media from URL
const sendMediaUrlRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('mediaUrl').isURL()
];
exports.sendMediaUrlRules = sendMediaUrlRules;
// Validation rules for sending group message
const sendGroupMessageRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('groupId').notEmpty(),
    (0, express_validator_1.body)('message').notEmpty().isLength({ max: 4096 })
];
exports.sendGroupMessageRules = sendGroupMessageRules;
// Validation rules for creating a group
const createGroupRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('participants').isArray().isLength({ min: 1 })
];
exports.createGroupRules = createGroupRules;
// Validation rules for creating a template
const createTemplateRules = [
    (0, express_validator_1.body)('name').notEmpty().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('content').notEmpty().isLength({ max: 4096 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }),
    (0, express_validator_1.body)('category').optional().isIn(['general', 'welcome', 'follow-up', 'promotional', 'support'])
];
exports.createTemplateRules = createTemplateRules;
// Validation rules for updating a template
const updateTemplateRules = [
    (0, express_validator_1.body)('name').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('content').optional().isLength({ max: 4096 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 }),
    (0, express_validator_1.body)('category').optional().isIn(['general', 'welcome', 'follow-up', 'promotional', 'support'])
];
exports.updateTemplateRules = updateTemplateRules;
// Validation rules for sending a template
const sendTemplateRules = [
    (0, express_validator_1.body)('instanceId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty(),
    (0, express_validator_1.body)('templateId').notEmpty(),
    (0, express_validator_1.body)('variables').optional().isObject()
];
exports.sendTemplateRules = sendTemplateRules;
// Handle validation errors
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.handleValidation = handleValidation;
