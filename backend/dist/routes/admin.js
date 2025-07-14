"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const adminController_1 = require("../controllers/adminController");
const admin_1 = require("../middleware/admin");
const express_validator_1 = require("express-validator");
// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// Admin login (no auth required)
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty()
], handleValidation, admin_1.adminLogin);
// All routes below require admin authentication
router.use(admin_1.verifyAdmin);
// Dashboard statistics
router.get('/stats', adminController_1.getAdminStats);
// Client management
router.get('/clients', adminController_1.getClients);
router.get('/clients/:id', adminController_1.getClient);
router.put('/clients/:id/status', [
    (0, express_validator_1.body)('status').isIn(['ACTIVE', 'EXPIRED', 'SUSPENDED'])
], handleValidation, adminController_1.updateClientStatus);
router.put('/clients/:id/extend', [
    (0, express_validator_1.body)('days').isInt({ min: 1 })
], handleValidation, adminController_1.extendClientValidity);
router.put('/clients/:id/credits', [
    (0, express_validator_1.body)('credits').isInt({ min: 1 })
], handleValidation, adminController_1.addCredits);
// Package management
router.get('/packages', adminController_1.getPackages);
router.post('/packages', [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('credits').isInt({ min: 1 }),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }),
    (0, express_validator_1.body)('validityDays').isInt({ min: 1 }),
    (0, express_validator_1.body)('features').isArray({ min: 1 })
], handleValidation, adminController_1.createPackage);
router.put('/packages/:id', [
    (0, express_validator_1.body)('name').notEmpty().trim(),
    (0, express_validator_1.body)('credits').isInt({ min: 1 }),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }),
    (0, express_validator_1.body)('validityDays').isInt({ min: 1 }),
    (0, express_validator_1.body)('features').isArray({ min: 1 })
], handleValidation, adminController_1.updatePackage);
router.delete('/packages/:id', adminController_1.deletePackage);
// System settings
router.get('/settings', adminController_1.getSystemSettings);
router.put('/settings', adminController_1.updateSystemSettings);
exports.default = router;
