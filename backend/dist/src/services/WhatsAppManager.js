"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const models_1 = require("../models");
class WhatsAppManager {
    constructor() {
        this.clients = new Map();
        this.clientStatus = new Map();
        this.qrCodes = new Map();
    }
    async createClient(userId, instanceId, instanceName) {
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
        // Add Puppeteer config for production
        if (isProduction) {
            const possibleChromePaths = [
                process.env.CHROME_BIN,
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium'
            ];
            let chromePath = null;
            for (const pathOption of possibleChromePaths) {
                if (pathOption && fs_1.default.existsSync(pathOption)) {
                    chromePath = pathOption;
                    console.log(`Found Chrome at: ${chromePath}`);
                    break;
                }
            }
            if (!chromePath) {
                console.error('Chrome/Chromium not found! Please install Chrome or set CHROME_BIN environment variable.');
            }
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
                    '--remote-debugging-port=0'
                ],
                executablePath: chromePath,
                timeout: 120000,
                ignoreDefaultArgs: ['--disable-extensions'],
                ignoreHTTPSErrors: true
            };
        }
        const client = new whatsapp_web_js_1.Client(clientConfig);
        await this.setupClientEvents(client, clientId, instanceId, instanceName);
        this.clients.set(clientId, client);
        this.clientStatus.set(clientId, 'initializing');
        try {
            console.log(`[WhatsAppManager] Initializing client for clientId: ${clientId}`);
            const initPromise = client.initialize();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Client initialization timeout after 2 minutes')), 120000);
            });
            await Promise.race([initPromise, timeoutPromise]);
            console.log(`[WhatsAppManager] Client ${clientId} initialized successfully.`);
            return client;
        }
        catch (error) {
            console.error(`[WhatsAppManager] FAILED to initialize client ${clientId}:`, error);
            this.clients.delete(clientId);
            this.clientStatus.delete(clientId);
            try {
                await client.destroy();
            }
            catch (destroyError) {
                console.error(`[WhatsAppManager] Error destroying failed client:`, destroyError);
            }
            throw error;
        }
    }
    async setupClientEvents(client, clientId, instanceId, instanceName) {
        console.log(`[WhatsAppManager] Setting up event listeners for clientId: ${clientId}`);
        client.on('qr', async (qr) => {
            console.log(`[WhatsAppManager] QR Code event for ${clientId} (${instanceName})`);
            try {
                const qrCodeDataURL = await qrcode_1.default.toDataURL(qr);
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
        });
        client.on('ready', async () => {
            console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) is ready!`);
            this.clientStatus.set(clientId, 'ready');
            try {
                const info = client.info;
                if (info && info.wid) {
                    const phoneNumber = info.wid.user;
                    await models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
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
        });
        client.on('authenticated', () => {
            console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) authenticated`);
            this.clientStatus.set(clientId, 'authenticated');
            this.qrCodes.delete(instanceId);
        });
        client.on('disconnected', async (reason) => {
            console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) disconnected. Reason:`, reason);
            this.clientStatus.set(clientId, 'disconnected');
            try {
                await models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
                    isActive: false,
                    disconnectedAt: new Date(),
                    status: 'disconnected'
                });
            }
            catch (error) {
                console.error('Error updating disconnected status:', error);
            }
        });
        client.on('auth_failure', (msg) => {
            console.error(`[WhatsAppManager] Client ${clientId} (${instanceName}) auth failure:`, msg);
            this.clientStatus.set(clientId, 'auth_failed');
            this.qrCodes.delete(instanceId);
        });
        client.on('error', (error) => {
            console.error(`[WhatsAppManager] Client ${clientId} encountered an error:`, error);
        });
        // Handle incoming messages
        client.on('message', async (message) => {
            await this.handleIncomingMessage(message, instanceId, instanceName);
        });
    }
    async handleIncomingMessage(message, instanceId, instanceName) {
        console.log(`Message received on ${instanceName}:`, message.body);
        try {
            const instance = await models_1.WhatsAppInstance.findOne({ instanceId });
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
            if (message.hasMedia) {
                try {
                    const media = await message.downloadMedia();
                    content = {
                        caption: message.body || '',
                        mimeType: media.mimetype,
                        fileName: media.filename || 'media_file'
                    };
                }
                catch (mediaError) {
                    console.error('Error downloading media:', mediaError);
                }
            }
            const contact = await message.getContact();
            const chat = await message.getChat();
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
                status: 'delivered'
            });
            await messageRecord.save();
            console.log(`Incoming message stored for instance ${instanceName}`);
        }
        catch (error) {
            console.error('Error storing incoming message:', error);
        }
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
    async destroyClient(userId, instanceId) {
        const clientId = `${userId}_${instanceId}`;
        const client = this.clients.get(clientId);
        console.log(`[WhatsAppManager] Destroying client: ${clientId}`);
        if (client) {
            try {
                await client.destroy();
                console.log(`[WhatsAppManager] Client ${clientId} destroyed successfully`);
            }
            catch (error) {
                console.error(`Error destroying client ${clientId}:`, error);
            }
        }
        // Clean up user data directory
        const userDataPattern = `/tmp/chrome-${clientId}-*`;
        try {
            (0, child_process_1.execSync)(`rm -rf ${userDataPattern}`, { stdio: 'ignore' });
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
    }
    // Graceful shutdown
    async shutdown() {
        console.log('Shutting down WhatsApp Manager...');
        for (const [clientId, client] of this.clients) {
            try {
                await client.destroy();
                console.log(`Client ${clientId} destroyed`);
            }
            catch (error) {
                console.error(`Error destroying client ${clientId}:`, error);
            }
        }
    }
}
exports.default = WhatsAppManager;
