const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const userRegistrationRules = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('company').optional()
];

// Validation rules for user login
const userLoginRules = [
  body('email').isEmail(),
  body('password').notEmpty()
];

// Validation rules for adding a new number
const addNumberRules = [
  body('instanceName').notEmpty().isLength({ min: 1, max: 50 }),
  body('description').optional().isLength({ max: 200 })
];

// Validation rules for sending a message
const sendMessageRules = [
  body('instanceId').notEmpty(),
  body('to').notEmpty(),
  body('message').notEmpty().isLength({ max: 4096 })
];

// Validation rules for sending media
const sendMediaRules = [
  body('instanceId').notEmpty(),
  body('to').notEmpty()
];

// Validation rules for sending media from URL
const sendMediaUrlRules = [
  body('instanceId').notEmpty(),
  body('to').notEmpty(),
  body('mediaUrl').isURL()
];

// Validation rules for sending group message
const sendGroupMessageRules = [
  body('instanceId').notEmpty(),
  body('groupId').notEmpty(),
  body('message').notEmpty().isLength({ max: 4096 })
];

// Validation rules for creating a group
const createGroupRules = [
  body('instanceId').notEmpty(),
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('participants').isArray().isLength({ min: 1 })
];

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  userRegistrationRules,
  userLoginRules,
  addNumberRules,
  sendMessageRules,
  sendMediaRules,
  sendMediaUrlRules,
  sendGroupMessageRules,
  createGroupRules,
  handleValidation
}; 