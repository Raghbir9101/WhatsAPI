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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNumber = exports.disconnectNumber = exports.getNumberDetails = exports.getAllNumbers = exports.getQRCode = exports.forceQRRegeneration = exports.initializeNumber = exports.addNumber = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// Add new WhatsApp number
const addNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceName, description } = req.body;
    const user = req.user;
    try {
        // Check if instance name already exists for this user
        const existingInstance = yield models_1.WhatsAppInstance.findOne({
            userId: user._id,
            instanceName
        });
        if (existingInstance) {
            return res.status(400).json({ error: 'Instance name already exists' });
        }
        const instanceId = (0, helpers_1.generateInstanceId)();
        const instance = new models_1.WhatsAppInstance({
            instanceId,
            userId: user._id,
            instanceName,
            description: description || ''
        });
        yield instance.save();
        res.status(201).json({
            message: 'WhatsApp number instance created successfully',
            instanceId: instance.instanceId,
            instanceName: instance.instanceName,
            description: instance.description,
            status: instance.status
        });
    }
    catch (error) {
        console.error('Add number error:', error);
        res.status(500).json({ error: 'Failed to create WhatsApp number instance' });
    }
});
exports.addNumber = addNumber;
// Initialize WhatsApp client for a specific number
const initializeNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const { forceNewQR = false } = req.body; // Add option to force new QR
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        // If forcing new QR, destroy existing client first
        if (forceNewQR) {
            console.log(`[initializeNumber] Forcing new QR for ${instanceId}`);
            yield whatsappManager.destroyClient(user._id, instanceId);
        }
        yield whatsappManager.createClient(user._id, instanceId, instance.instanceName);
        const status = whatsappManager.getClientStatus(user._id, instanceId);
        // Update status in database
        yield models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, { status: status });
        res.json({
            message: 'WhatsApp client initialized',
            instanceId,
            instanceName: instance.instanceName,
            status: status,
            instructions: status === 'qr_ready' ? 'Please scan the QR code to connect' : 'Client is initializing...',
            forceNewQR: forceNewQR
        });
    }
    catch (error) {
        console.error('Initialize error:', error);
        res.status(500).json({ error: 'Failed to initialize WhatsApp client', details: error.message });
    }
});
exports.initializeNumber = initializeNumber;
// Force QR code regeneration by clearing session
const forceQRRegeneration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        console.log(`[forceQRRegeneration] Forcing QR regeneration for ${instanceId}`);
        // Destroy existing client and clear session data
        yield whatsappManager.destroyClient(user._id, instanceId);
        // Wait a moment for cleanup
        yield new Promise(resolve => setTimeout(resolve, 1000));
        // Create new client which should generate QR
        yield whatsappManager.createClient(user._id, instanceId, instance.instanceName);
        const status = whatsappManager.getClientStatus(user._id, instanceId);
        // Update status in database
        yield models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
            status: status,
            isActive: false // Reset to inactive until QR is scanned
        });
        res.json({
            message: 'QR code regeneration initiated',
            instanceId,
            instanceName: instance.instanceName,
            status: status,
            instructions: 'New QR code is being generated. Please call /qr endpoint to get the new QR code.'
        });
    }
    catch (error) {
        console.error('Force QR regeneration error:', error);
        res.status(500).json({ error: 'Failed to regenerate QR code', details: error.message });
    }
});
exports.forceQRRegeneration = forceQRRegeneration;
// Get QR code for a specific number
const getQRCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    console.log(`[getQRCode] Request for instanceId: ${instanceId}, userId: ${user._id}`);
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            console.log(`[getQRCode] Instance not found: ${instanceId}`);
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        console.log(`[getQRCode] Instance found: ${instance.instanceName}, status: ${instance.status}`);
        // Check client status first
        const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
        console.log(`[getQRCode] Client status: ${clientStatus}`);
        if (clientStatus === 'not_initialized') {
            return res.status(400).json({
                error: 'WhatsApp client not initialized. Please initialize the client first.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName
            });
        }
        // If client is already ready/authenticated, no QR code is needed
        if (clientStatus === 'ready' || clientStatus === 'authenticated') {
            return res.status(200).json({
                error: 'WhatsApp client is already authenticated and ready to use.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName,
                phoneNumber: instance.phoneNumber,
                message: 'No QR code needed - client is already connected!',
                isAuthenticated: true
            });
        }
        const qrData = whatsappManager.getQRCode(instanceId);
        console.log(`[getQRCode] QR data available:`, !!qrData);
        if (!qrData) {
            let instructions = '';
            if (clientStatus === 'initializing') {
                instructions = 'Client is still initializing, please wait for QR code generation...';
            }
            else if (clientStatus === 'qr_ready') {
                instructions = 'QR code should be available, please try again in a moment.';
            }
            else {
                instructions = 'Please initialize the client first.';
            }
            return res.status(404).json({
                error: 'QR code not available.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName,
                instructions: instructions
            });
        }
        console.log(`[getQRCode] Returning QR code for: ${instance.instanceName}`);
        res.json({
            instanceId,
            instanceName: instance.instanceName,
            qrCode: qrData.qrCodeDataURL,
            timestamp: qrData.timestamp,
            status: clientStatus
        });
    }
    catch (error) {
        console.error('Get QR code error:', error);
        res.status(500).json({ error: 'Failed to retrieve QR code', details: error.message });
    }
});
exports.getQRCode = getQRCode;
// Get all WhatsApp numbers for a user
const getAllNumbers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instances = yield models_1.WhatsAppInstance.find({ userId: user._id });
        const userNumbers = instances.map(instance => {
            const status = whatsappManager.getClientStatus(user._id, instance.instanceId);
            return {
                instanceId: instance.instanceId,
                instanceName: instance.instanceName,
                description: instance.description,
                phoneNumber: instance.phoneNumber,
                isActive: instance.isActive,
                status: status || instance.status,
                messagesSent: instance.messagesSent,
                createdAt: instance.createdAt,
                connectedAt: instance.connectedAt,
                disconnectedAt: instance.disconnectedAt
            };
        });
        res.json({
            numbers: userNumbers,
            totalNumbers: userNumbers.length
        });
    }
    catch (error) {
        console.error('Get numbers error:', error);
        res.status(500).json({ error: 'Failed to retrieve WhatsApp numbers' });
    }
});
exports.getAllNumbers = getAllNumbers;
// Get specific number details
const getNumberDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        const status = whatsappManager.getClientStatus(user._id, instanceId);
        res.json({
            instanceId: instance.instanceId,
            instanceName: instance.instanceName,
            description: instance.description,
            phoneNumber: instance.phoneNumber,
            isActive: instance.isActive,
            status: status || instance.status,
            messagesSent: instance.messagesSent,
            createdAt: instance.createdAt,
            connectedAt: instance.connectedAt,
            disconnectedAt: instance.disconnectedAt
        });
    }
    catch (error) {
        console.error('Get number details error:', error);
        res.status(500).json({ error: 'Failed to retrieve WhatsApp number details' });
    }
});
exports.getNumberDetails = getNumberDetails;
// Disconnect WhatsApp number
const disconnectNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        yield whatsappManager.destroyClient(user._id, instanceId);
        // Update instance status in database
        yield models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
            isActive: false,
            disconnectedAt: new Date(),
            status: 'disconnected'
        });
        res.json({
            message: 'WhatsApp number disconnected successfully',
            instanceId,
            instanceName: instance.instanceName
        });
    }
    catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect WhatsApp number' });
    }
});
exports.disconnectNumber = disconnectNumber;
// Delete WhatsApp number
const deleteNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp number instance not found' });
        }
        // Disconnect client first
        yield whatsappManager.destroyClient(user._id, instanceId);
        // Remove from database
        yield models_1.WhatsAppInstance.findOneAndDelete({ instanceId });
        res.json({
            message: 'WhatsApp number instance deleted successfully',
            instanceId,
            instanceName: instance.instanceName
        });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete WhatsApp number instance' });
    }
});
exports.deleteNumber = deleteNumber;
