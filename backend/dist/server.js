"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Import configurations and services
const database_1 = require("./config/database");
const WhatsAppManager_1 = __importDefault(require("./services/WhatsAppManager"));
const SchedulerService_1 = __importDefault(require("./services/SchedulerService"));
const IndiaMartScheduler_1 = __importDefault(require("./services/IndiaMartScheduler"));
const helpers_1 = require("./utils/helpers");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Create required directories
const fs_1 = __importDefault(require("fs"));
(0, helpers_1.createRequiredDirectories)(fs_1.default);
// Initialize services
const whatsappManager = new WhatsAppManager_1.default();
const schedulerService = new SchedulerService_1.default(whatsappManager);
// Store services in app.locals for access in controllers
app.locals.whatsappManager = whatsappManager;
app.locals.schedulerService = schedulerService;
app.locals.indiaMartScheduler = IndiaMartScheduler_1.default;
// Connect to database
(0, database_1.connectDB)().then(() => {
    // Start schedulers after database connection
    schedulerService.start();
    IndiaMartScheduler_1.default.start();
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
// Basic middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend", "dist")));
app.use(express_1.default.static('public'));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// API routes
app.use('/api', routes_1.default);
// Catch-all route for SPA - must be BEFORE error handling middleware
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.originalUrl.startsWith('/api/')) {
        return (0, errorHandler_1.notFoundHandler)(req, res);
    }
    res.sendFile(path_1.default.join(__dirname, "../../frontend", "dist", "index.html"));
});
// Error handling middleware - must be LAST
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down gracefully...');
    try {
        yield whatsappManager.shutdown();
        IndiaMartScheduler_1.default.stop();
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}));
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Multi-Number WhatsApp API Platform running on port ${PORT}`);
    console.log('📁 MVC Architecture Features:');
    console.log('   ✅ User registration and authentication');
    console.log('   ✅ Multiple WhatsApp numbers per user');
    console.log('   ✅ QR code scanning for each number');
    console.log('   ✅ Complete WhatsApp messaging API');
    console.log('   ✅ IndiaMART leads integration');
    console.log('   ✅ Organized MVC structure');
    console.log('   ✅ Modular architecture');
});
exports.default = app;
