"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const reportsController_1 = require("../controllers/reportsController");
const auth_1 = require("../middleware/auth");
// All report routes require authentication
router.use(auth_1.verifyApiKey);
// Get detailed analytics report
router.get('/analytics', reportsController_1.getAnalytics);
// Get message delivery report
router.get('/delivery', reportsController_1.getDeliveryReport);
// Get performance metrics
router.get('/performance', reportsController_1.getPerformanceMetrics);
exports.default = router;
