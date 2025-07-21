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
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
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
const seed_1 = require("./utils/seed");
const migrateMessages_1 = require("./utils/migrateMessages");
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
(0, database_1.connectDB)().then(() => __awaiter(void 0, void 0, void 0, function* () {
    // Run migration for message source field
    try {
        yield (0, migrateMessages_1.migrateMessagesSource)();
    }
    catch (error) {
        console.error('Migration failed, but continuing startup:', error);
    }
    // Run seed data
    yield (0, seed_1.runSeed)();
    // Start schedulers after database connection
    schedulerService.start();
    IndiaMartScheduler_1.default.start();
})).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
// Basic middleware
// app.use(helmet());
app.use((0, cors_1.default)({
    origin: '*',
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend", "dist")));
app.use(express_1.default.static('public'));
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WhatsAPI Backend API',
            version: '1.0.0',
            description: 'API documentation for WhatsAPI backend',
        },
        servers: [
            {
                url: 'http://localhost:80', // Update with your actual server URL
            },
        ],
        basePath: '/api', // Add base path for API routes
    },
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/routes/**/*.ts', // Add this to catch nested routes
        './src/controllers/**/*.ts' // Add this to catch nested controllers
    ],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Explicitly mount Swagger UI at /apis/docs
app.use('/apis/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
    explorer: true, // Add this to make the UI more interactive
}));
// Ensure API routes are mounted at /apis instead of /api
app.use('/api', routes_1.default);
// Modify the catch-all route to handle /apis routes
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
