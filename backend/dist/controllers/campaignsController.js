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
exports.deleteCampaign = exports.pauseCampaign = exports.startCampaign = exports.getCampaign = exports.createCampaignFromCSV = exports.getCampaigns = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
// Get all campaigns for user
const getCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;
    try {
        const query = { userId: user._id };
        if (status) {
            query.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalCampaigns = yield models_1.BulkCampaign.countDocuments(query);
        const campaigns = yield models_1.BulkCampaign.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('templateId', 'name');
        res.json({
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCampaigns,
                pages: Math.ceil(totalCampaigns / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Failed to retrieve campaigns' });
    }
});
exports.getCampaigns = getCampaigns;
// Create bulk campaign from CSV
const createCampaignFromCSV = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, name, message, templateId, description, delayBetweenMessages } = req.body;
    const user = req.user;
    if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
    }
    try {
        // Verify instance access
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        // Parse CSV file
        const recipients = [];
        const csvFilePath = req.file.path;
        yield new Promise((resolve, reject) => {
            fs_1.default.createReadStream(csvFilePath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                // Expected CSV columns: phoneNumber, name, and any variable columns
                const phoneNumber = row.phoneNumber || row.phone || row.number;
                if (phoneNumber) {
                    const recipient = {
                        phoneNumber: phoneNumber.toString(),
                        name: row.name || '',
                        variables: {}
                    };
                    // Extract variables (any column that's not phoneNumber or name)
                    Object.keys(row).forEach(key => {
                        if (!['phoneNumber', 'phone', 'number', 'name'].includes(key)) {
                            recipient.variables[key] = row[key];
                        }
                    });
                    recipients.push(recipient);
                }
            })
                .on('end', resolve)
                .on('error', reject);
        });
        if (recipients.length === 0) {
            // Clean up uploaded file
            fs_1.default.unlinkSync(csvFilePath);
            return res.status(400).json({ error: 'No valid recipients found in CSV file' });
        }
        // Verify template if provided
        let template = null;
        if (templateId) {
            template = yield models_1.MessageTemplate.findOne({
                _id: templateId,
                userId: user._id,
                isActive: true
            });
            if (!template) {
                fs_1.default.unlinkSync(csvFilePath);
                return res.status(404).json({ error: 'Template not found' });
            }
        }
        // Create campaign
        const campaign = new models_1.BulkCampaign({
            userId: user._id,
            instanceId,
            name,
            description: description || '',
            templateId: templateId || null,
            message: message || (template ? template.content : ''),
            recipients,
            totalRecipients: recipients.length,
            settings: {
                delayBetweenMessages: parseInt(delayBetweenMessages) || 1000,
                retryFailedMessages: true,
                maxRetries: 3
            }
        });
        yield campaign.save();
        // Clean up uploaded file
        fs_1.default.unlinkSync(csvFilePath);
        res.status(201).json({
            message: 'Bulk campaign created successfully',
            campaign: {
                _id: campaign._id,
                name: campaign.name,
                totalRecipients: campaign.totalRecipients,
                status: campaign.status
            }
        });
    }
    catch (error) {
        console.error('Create bulk campaign error:', error);
        // Clean up uploaded file on error
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to create bulk campaign' });
    }
});
exports.createCampaignFromCSV = createCampaignFromCSV;
// Get campaign details
const getCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    const user = req.user;
    try {
        const campaign = yield models_1.BulkCampaign.findOne({
            _id: campaignId,
            userId: user._id
        }).populate('templateId', 'name');
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({ campaign });
    }
    catch (error) {
        console.error('Get campaign details error:', error);
        res.status(500).json({ error: 'Failed to retrieve campaign details' });
    }
});
exports.getCampaign = getCampaign;
// Start bulk campaign
const startCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    const user = req.user;
    try {
        const campaign = yield models_1.BulkCampaign.findOne({
            _id: campaignId,
            userId: user._id,
            status: 'draft'
        }).populate('templateId');
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found or already started' });
        }
        // Get WhatsApp manager from app.locals
        const whatsappManager = req.app.locals.whatsappManager;
        if (!whatsappManager) {
            return res.status(500).json({ error: 'WhatsApp manager not available' });
        }
        // Verify client is ready
        const client = whatsappManager.getClient(user._id, campaign.instanceId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }
        const clientStatus = whatsappManager.getClientStatus(user._id, campaign.instanceId);
        if (clientStatus !== 'ready') {
            return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
        }
        // Update campaign status
        campaign.status = 'running';
        campaign.startedAt = new Date();
        yield campaign.save();
        // Start sending messages (async)
        processBulkCampaign(campaign, user, client, whatsappManager);
        res.json({
            message: 'Bulk campaign started successfully',
            campaignId: campaign._id,
            status: campaign.status
        });
    }
    catch (error) {
        console.error('Start campaign error:', error);
        res.status(500).json({ error: 'Failed to start campaign' });
    }
});
exports.startCampaign = startCampaign;
// Pause/Resume campaign
const pauseCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    const user = req.user;
    try {
        const campaign = yield models_1.BulkCampaign.findOne({
            _id: campaignId,
            userId: user._id
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        if (campaign.status === 'running') {
            campaign.status = 'paused';
        }
        else if (campaign.status === 'paused') {
            campaign.status = 'running';
        }
        else {
            return res.status(400).json({ error: 'Campaign cannot be paused/resumed in current status' });
        }
        yield campaign.save();
        res.json({
            message: `Campaign ${campaign.status === 'paused' ? 'paused' : 'resumed'} successfully`,
            status: campaign.status
        });
    }
    catch (error) {
        console.error('Pause/resume campaign error:', error);
        res.status(500).json({ error: 'Failed to pause/resume campaign' });
    }
});
exports.pauseCampaign = pauseCampaign;
// Delete campaign
const deleteCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    const user = req.user;
    try {
        const campaign = yield models_1.BulkCampaign.findOneAndDelete({
            _id: campaignId,
            userId: user._id
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({
            message: 'Campaign deleted successfully',
            campaignName: campaign.name
        });
    }
    catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});
exports.deleteCampaign = deleteCampaign;
// Function to process bulk campaign
function processBulkCampaign(campaign, user, client, whatsappManager) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Starting bulk campaign: ${campaign.name}`);
            for (let i = 0; i < campaign.recipients.length; i++) {
                const recipient = campaign.recipients[i];
                if (recipient.status !== 'pending') {
                    continue; // Skip already processed recipients
                }
                // Check if campaign is paused
                const currentCampaign = yield models_1.BulkCampaign.findById(campaign._id);
                if (currentCampaign.status === 'paused') {
                    console.log(`Campaign ${campaign.name} is paused, stopping processing`);
                    return;
                }
                try {
                    // Process message with variables
                    let processedMessage = campaign.message;
                    if (campaign.templateId && campaign.templateId.variables) {
                        campaign.templateId.variables.forEach(variable => {
                            const value = recipient.variables[variable.name] || variable.defaultValue || '';
                            const placeholder = `{{${variable.name}}}`;
                            processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
                        });
                    }
                    // Send message
                    const chatId = (0, helpers_1.formatPhoneNumber)(recipient.phoneNumber);
                    const sentMessage = yield client.sendMessage(chatId, processedMessage);
                    // Update recipient status
                    recipient.status = 'sent';
                    recipient.messageId = sentMessage.id._serialized;
                    recipient.sentAt = new Date();
                    // Create message record
                    const messageRecord = new models_1.Message({
                        messageId: sentMessage.id._serialized,
                        instanceId: campaign.instanceId,
                        userId: user._id,
                        direction: 'outgoing',
                        from: campaign.instanceId,
                        to: recipient.phoneNumber,
                        type: 'text',
                        content: { text: processedMessage },
                        status: 'sent',
                        source: 'api', // Mark bulk campaign messages as API messages
                        campaignId: campaign._id.toString(),
                        timestamp: new Date()
                    });
                    yield messageRecord.save();
                    // Update campaign counts
                    yield models_1.BulkCampaign.findByIdAndUpdate(campaign._id, {
                        $inc: { sentCount: 1 },
                        recipients: campaign.recipients
                    });
                    // Update user and instance message counts
                    yield Promise.all([
                        models_1.User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
                        models_1.WhatsAppInstance.findOneAndUpdate({ instanceId: campaign.instanceId }, { $inc: { messagesSent: 1 } })
                    ]);
                    console.log(`Sent message to ${recipient.phoneNumber} for campaign ${campaign.name}`);
                }
                catch (error) {
                    console.error(`Error sending to ${recipient.phoneNumber}:`, error);
                    // Update recipient status
                    recipient.status = 'failed';
                    recipient.error = error.message;
                    // Update campaign counts
                    yield models_1.BulkCampaign.findByIdAndUpdate(campaign._id, {
                        $inc: { failedCount: 1 },
                        recipients: campaign.recipients
                    });
                }
                // Wait before sending next message
                if (i < campaign.recipients.length - 1) {
                    yield new Promise(resolve => setTimeout(resolve, campaign.settings.delayBetweenMessages));
                }
            }
            // Mark campaign as completed
            yield models_1.BulkCampaign.findByIdAndUpdate(campaign._id, {
                status: 'completed',
                completedAt: new Date()
            });
            console.log(`Completed bulk campaign: ${campaign.name}`);
        }
        catch (error) {
            console.error('Bulk campaign processing error:', error);
            // Mark campaign as failed
            yield models_1.BulkCampaign.findByIdAndUpdate(campaign._id, {
                status: 'cancelled',
                completedAt: new Date()
            });
        }
    });
}
