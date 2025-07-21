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
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const models_1 = require("../models");
const uploadController_1 = __importDefault(require("../controllers/uploadController"));
const FlowEngine_1 = __importDefault(require("./FlowEngine"));
class WhatsAppManager {
    constructor() {
        this.clients = new Map();
        this.clientStatus = new Map();
        this.qrCodes = new Map();
        this.flowEngine = new FlowEngine_1.default(this);
    }
    createClient(userId, instanceId, instanceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = `${userId}_${instanceId}`;
            if (this.clients.has(clientId)) {
                const existingClient = this.clients.get(clientId);
                if (existingClient.pupPage && !existingClient.pupPage.isClosed()) {
                    return existingClient;
                }
            }
            // Production-ready client configuration
            const isProduction = process.env.NODE_ENV === 'production';
            const clientConfig = {
                authStrategy: new whatsapp_web_js_1.LocalAuth({
                    clientId: clientId,
                    dataPath: path_1.default.join(os_1.default.tmpdir(), 'whatsapp-api-sessions')
                })
            };
            // Add Puppeteer config only in production
            // if (isProduction) {
            // Try to find Chrome executable
            const possibleChromePaths = [
                process.env.CHROME_BIN,
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium'
            ];
            let chromePath = null;
            for (const path of possibleChromePaths) {
                if (path && require('fs').existsSync(path)) {
                    chromePath = path;
                    console.log(`Found Chrome at: ${chromePath}`);
                    break;
                }
            }
            if (!chromePath) {
                console.error('Chrome/Chromium not found! Please install Chrome or set CHROME_BIN environment variable.');
            }
            // Create unique user data directory for this client
            const userDataDir = `/tmp/chrome-${clientId}-${Date.now()}`;
            clientConfig.puppeteer = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-crash-reporter',
                    '--disable-in-process-stack-traces',
                    '--disable-logging',
                    '--disable-default-apps',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--no-pings',
                    '--window-size=1366,768',
                    `--user-data-dir=${userDataDir}`,
                    `--data-path=${userDataDir}`,
                    `--disk-cache-dir=${userDataDir}/cache`,
                    '--remote-debugging-port=0' // Use random available port
                ],
                executablePath: chromePath,
                timeout: 120000, // Increased timeout
                ignoreDefaultArgs: ['--disable-extensions'],
                ignoreHTTPSErrors: true
            };
            // }
            const client = new whatsapp_web_js_1.Client(clientConfig);
            yield this.setupClientEvents(client, clientId, instanceId, instanceName);
            this.clients.set(clientId, client);
            this.clientStatus.set(clientId, 'initializing');
            try {
                console.log(`[WhatsAppManager] Initializing client for clientId: ${clientId}`);
                console.log(`[WhatsAppManager] Chrome path: ${chromePath}`);
                console.log(`[WhatsAppManager] Is Production: ${isProduction}`);
                console.log(`[WhatsAppManager] Starting client.initialize() call...`);
                // Add timeout for initialization
                const initPromise = client.initialize();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Client initialization timeout after 2 minutes')), 120000);
                });
                yield Promise.race([initPromise, timeoutPromise]);
                console.log(`[WhatsAppManager] Client ${clientId} initialized successfully.`);
                return client;
            }
            catch (error) {
                console.error(`[WhatsAppManager] FAILED to initialize client ${clientId}:`, error);
                console.error(`[WhatsAppManager] Error stack:`, error.stack);
                this.clients.delete(clientId);
                this.clientStatus.delete(clientId);
                // Try to destroy the client if it exists
                try {
                    yield client.destroy();
                }
                catch (destroyError) {
                    console.error(`[WhatsAppManager] Error destroying failed client:`, destroyError);
                }
                throw error;
            }
        });
    }
    setupClientEvents(client, clientId, instanceId, instanceName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[WhatsAppManager] Setting up event listeners for clientId: ${clientId}`);
            client.on('qr', (qr) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[WhatsAppManager] QR Code event for ${clientId} (${instanceName})`);
                try {
                    const qrCodeDataURL = yield qrcode_1.default.toDataURL(qr);
                    this.qrCodes.set(instanceId, {
                        qr: qr,
                        qrCodeDataURL: qrCodeDataURL,
                        timestamp: new Date()
                    });
                    console.log(`QR code generated for ${instanceName}`);
                }
                catch (err) {
                    console.error('Error generating QR code:', err);
                }
                this.clientStatus.set(clientId, 'qr_ready');
            }));
            client.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) is ready!`);
                this.clientStatus.set(clientId, 'ready');
                try {
                    const info = client.info;
                    if (info && info.wid) {
                        const phoneNumber = info.wid.user;
                        yield models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
                            phoneNumber: phoneNumber,
                            connectedAt: new Date(),
                            isActive: true,
                            status: 'ready'
                        });
                    }
                }
                catch (error) {
                    console.error('Error getting phone number info:', error);
                }
            }));
            client.on('authenticated', () => {
                console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) authenticated`);
                this.clientStatus.set(clientId, 'authenticated');
                this.qrCodes.delete(instanceId);
            });
            client.on('disconnected', (reason) => __awaiter(this, void 0, void 0, function* () {
                console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) disconnected. Reason:`, reason);
                this.clientStatus.set(clientId, 'disconnected');
                try {
                    yield models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
                        isActive: false,
                        disconnectedAt: new Date(),
                        status: 'disconnected'
                    });
                }
                catch (error) {
                    console.error('Error updating disconnected status:', error);
                }
            }));
            client.on('auth_failure', (msg) => {
                console.error(`[WhatsAppManager] Client ${clientId} (${instanceName}) auth failure:`, msg);
                this.clientStatus.set(clientId, 'auth_failed');
                this.qrCodes.delete(instanceId);
            });
            client.on('error', (error) => {
                console.error(`[WhatsAppManager] Client ${clientId} encountered an error:`, error);
            });
            // Handle incoming messages
            client.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleIncomingMessage(message, instanceId, instanceName);
            }));
        });
    }
    handleIncomingMessage(message, instanceId, instanceName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Message received on ${instanceName}:`, message.body);
            try {
                const instance = yield models_1.WhatsAppInstance.findOne({ instanceId });
                if (!instance) {
                    console.error('Instance not found for message storage');
                    return;
                }
                const messageType = message.hasMedia ?
                    (message.type === 'image' ? 'image' :
                        message.type === 'video' ? 'video' :
                            message.type === 'audio' ? 'audio' :
                                message.type === 'document' ? 'document' : 'text') : 'text';
                let content = { text: message.body || '' };
                let fileUrl = null;
                let fileName = null;
                if (message.hasMedia) {
                    try {
                        const media = yield message.downloadMedia();
                        content.caption = message.body || '';
                        content.mimeType = media.mimetype;
                        fileName = media.filename || `incoming_${Date.now()}_${messageType}`;
                        content.fileName = fileName;
                        // Upload to Cloudinary for storage
                        const base64File = `data:${media.mimetype};base64,${media.data}`;
                        fileUrl = yield uploadController_1.default.uploadFile(base64File, fileName);
                        content.mediaUrl = fileUrl;
                    }
                    catch (mediaError) {
                        console.error('Error downloading media:', mediaError);
                    }
                }
                const contact = yield message.getContact();
                const chat = yield message.getChat();
                // // Check if message already exists to prevent duplicates
                // const existingMessage = await Message.findOne({ messageId: message.id._serialized });
                // if (existingMessage) {
                //   console.log(`Message already exists, skipping: ${message.id._serialized}`);
                //   return;
                // }
                const messageRecord = new models_1.Message({
                    messageId: message.id._serialized,
                    instanceId: instanceId,
                    userId: instance.userId,
                    direction: 'incoming',
                    from: message.from,
                    to: message.to,
                    type: messageType,
                    content: content,
                    isGroup: chat.isGroup,
                    groupId: chat.isGroup ? chat.id._serialized : null,
                    contactName: contact.name || contact.pushname || contact.number,
                    timestamp: new Date(message.timestamp * 1000),
                    status: 'delivered',
                    source: 'frontend', // Incoming messages are typically from frontend interactions
                    fileUrl: fileUrl, // Store the file URL for frontend display
                    fileName: fileName // Store the file name
                });
                try {
                    yield messageRecord.save();
                    console.log(`Incoming message stored for instance ${instanceName}`);
                    // Check for flow triggers after message is saved
                    yield this.flowEngine.checkTriggers(message, instanceId, instance.userId.toString());
                }
                catch (error) {
                    if (error.code === 11000) {
                        // Duplicate key error - message already exists
                        console.log(`Duplicate message detected and skipped: ${message.id._serialized}`);
                        return;
                    }
                    throw error; // Re-throw if it's not a duplicate key error
                }
            }
            catch (error) {
                console.error('Error storing incoming message:', error);
            }
        });
    }
    getClient(userId, instanceId) {
        const clientId = `${userId}_${instanceId}`;
        return this.clients.get(clientId);
    }
    getClientStatus(userId, instanceId) {
        const clientId = `${userId}_${instanceId}`;
        return this.clientStatus.get(clientId) || 'not_initialized';
    }
    getQRCode(instanceId) {
        return this.qrCodes.get(instanceId);
    }
    destroyClient(userId, instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = `${userId}_${instanceId}`;
            const client = this.clients.get(clientId);
            console.log(`[WhatsAppManager] Destroying client: ${clientId}`);
            if (client) {
                try {
                    yield client.destroy();
                    console.log(`[WhatsAppManager] Client ${clientId} destroyed successfully`);
                }
                catch (error) {
                    console.error(`Error destroying client ${clientId}:`, error);
                }
            }
            // Clean up user data directory
            const userDataPattern = `/tmp/chrome-${clientId}-*`;
            try {
                const { execSync } = require('child_process');
                execSync(`rm -rf ${userDataPattern}`, { stdio: 'ignore' });
                console.log(`Cleaned up user data directories for ${clientId}`);
            }
            catch (cleanupError) {
                console.error(`Error cleaning up user data for ${clientId}:`, cleanupError);
            }
            // Clean up WhatsApp session files
            try {
                const sessionPath = path_1.default.join(os_1.default.tmpdir(), 'whatsapp-api-sessions', `session-${clientId}`);
                if (fs_1.default.existsSync(sessionPath)) {
                    fs_1.default.rmSync(sessionPath, { recursive: true, force: true });
                    console.log(`Cleaned up session files for ${clientId}`);
                }
            }
            catch (sessionError) {
                console.error(`Error cleaning up session files for ${clientId}:`, sessionError);
            }
            // Clear from maps
            this.clients.delete(clientId);
            this.clientStatus.delete(clientId);
            this.qrCodes.delete(instanceId);
            console.log(`[WhatsAppManager] Client ${clientId} cleanup completed`);
        });
    }
    // Graceful shutdown
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Shutting down WhatsApp Manager...');
            for (const [clientId, client] of this.clients) {
                try {
                    yield client.destroy();
                    console.log(`Client ${clientId} destroyed`);
                }
                catch (error) {
                    console.error(`Error destroying client ${clientId}:`, error);
                }
            }
        });
    }
}
exports.default = WhatsAppManager;
