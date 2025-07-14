"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNumber = exports.disconnectNumber = exports.getNumberDetails = exports.getAllNumbers = exports.getQRCode = exports.forceQRRegeneration = exports.initializeNumber = exports.addNumber = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// Add new WhatsApp number
const addNumber = async (req, res) => {
    const { instanceName, description } = req.body;
    const user = req.user;
    try {
        // Check if instance name already exists for this user
        const existingInstance = await models_1.WhatsAppInstance.findOne({
            userId: user._id,
            instanceName
        });
        if (existingInstance) {
            res.status(400).json({ error: 'Instance name already exists' });
            return;
        }
        const instanceId = (0, helpers_1.generateInstanceId)();
        const instance = new models_1.WhatsAppInstance({
            instanceId,
            userId: user._id,
            instanceName,
            description: description || ''
        });
        await instance.save();
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
};
exports.addNumber = addNumber;
// Initialize WhatsApp client for a specific number
const initializeNumber = async (req, res) => {
    const { instanceId } = req.params;
    const { forceNewQR = false } = req.body; // Add option to force new QR
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        // If forcing new QR, destroy existing client first
        if (forceNewQR) {
            console.log(`[initializeNumber] Forcing new QR for ${instanceId}`);
            await whatsappManager.destroyClient(user._id.toString(), instanceId);
        }
        await whatsappManager.createClient(user._id.toString(), instanceId, instance.instanceName);
        const status = whatsappManager.getClientStatus(user._id.toString(), instanceId);
        // Update status in database
        await models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, { status: status });
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
};
exports.initializeNumber = initializeNumber;
// Force QR code regeneration by clearing session
const forceQRRegeneration = async (req, res) => {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        console.log(`[forceQRRegeneration] Forcing QR regeneration for ${instanceId}`);
        // Destroy existing client and clear session data
        await whatsappManager.destroyClient(user._id.toString(), instanceId);
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Create new client which should generate QR
        await whatsappManager.createClient(user._id.toString(), instanceId, instance.instanceName);
        const status = whatsappManager.getClientStatus(user._id.toString(), instanceId);
        // Update status in database
        await models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
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
};
exports.forceQRRegeneration = forceQRRegeneration;
// Get QR code for a specific number
const getQRCode = async (req, res) => {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    console.log(`[getQRCode] Request for instanceId: ${instanceId}, userId: ${user._id}`);
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            console.log(`[getQRCode] Instance not found: ${instanceId}`);
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        console.log(`[getQRCode] Instance found: ${instance.instanceName}, status: ${instance.status}`);
        // Check client status first
        const clientStatus = whatsappManager.getClientStatus(user._id.toString(), instanceId);
        console.log(`[getQRCode] Client status: ${clientStatus}`);
        if (clientStatus === 'not_initialized') {
            res.status(400).json({
                error: 'WhatsApp client not initialized. Please initialize the client first.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName
            });
            return;
        }
        // If client is already ready/authenticated, no QR code is needed
        if (clientStatus === 'ready' || clientStatus === 'authenticated') {
            res.status(200).json({
                error: 'WhatsApp client is already authenticated and ready to use.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName,
                phoneNumber: instance.phoneNumber,
                message: 'No QR code needed - client is already connected!',
                isAuthenticated: true
            });
            return;
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
            res.status(404).json({
                error: 'QR code not available.',
                status: clientStatus,
                instanceId: instanceId,
                instanceName: instance.instanceName,
                instructions: instructions
            });
            return;
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
};
exports.getQRCode = getQRCode;
// Get all WhatsApp numbers for a user
const getAllNumbers = async (req, res) => {
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instances = await models_1.WhatsAppInstance.find({ userId: user._id });
        const userNumbers = instances.map(instance => {
            const status = whatsappManager.getClientStatus(user._id.toString(), instance.instanceId);
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
};
exports.getAllNumbers = getAllNumbers;
// Get specific number details
const getNumberDetails = async (req, res) => {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        const status = whatsappManager.getClientStatus(user._id.toString(), instanceId);
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
};
exports.getNumberDetails = getNumberDetails;
// Disconnect WhatsApp number
const disconnectNumber = async (req, res) => {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        await whatsappManager.destroyClient(user._id.toString(), instanceId);
        // Update instance status in database
        await models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, {
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
};
exports.disconnectNumber = disconnectNumber;
// Delete WhatsApp number
const deleteNumber = async (req, res) => {
    const { instanceId } = req.params;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = await models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            res.status(404).json({ error: 'WhatsApp number instance not found' });
            return;
        }
        // Disconnect client first
        await whatsappManager.destroyClient(user._id.toString(), instanceId);
        // Remove from database
        await models_1.WhatsAppInstance.findOneAndDelete({ instanceId });
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
};
exports.deleteNumber = deleteNumber;
