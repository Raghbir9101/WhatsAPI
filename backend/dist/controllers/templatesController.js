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
exports.sendTemplate = exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.getTemplates = void 0;
const models_1 = require("../models");
const models_2 = require("../models");
// Get all templates for the authenticated user
const getTemplates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { search, category, limit = 50, page = 1 } = req.query;
    try {
        const query = {
            userId: user._id,
            isActive: true
        };
        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        // Add category filter
        if (category) {
            query.category = category;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [templates, total] = yield Promise.all([
            models_1.MessageTemplate.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            models_1.MessageTemplate.countDocuments(query)
        ]);
        // Extract variables from content for each template
        const templatesWithVariables = templates.map(template => {
            const templateObj = template.toObject();
            // Extract variables from content if not already set
            if (!templateObj.variables || templateObj.variables.length === 0) {
                const variableMatches = templateObj.content.match(/\{\{(\w+)\}\}/g);
                if (variableMatches) {
                    templateObj.variables = variableMatches.map(match => {
                        const name = match.replace(/\{\{|\}\}/g, '');
                        return {
                            name,
                            defaultValue: '',
                            required: true
                        };
                    });
                }
            }
            return templateObj;
        });
        res.json({
            templates: templatesWithVariables,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to retrieve templates' });
    }
});
exports.getTemplates = getTemplates;
// Get template by ID
const getTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { templateId } = req.params;
    const user = req.user;
    try {
        const template = yield models_1.MessageTemplate.findOne({
            _id: templateId,
            userId: user._id,
            isActive: true
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const templateObj = template.toObject();
        // Extract variables from content if not already set
        if (!templateObj.variables || templateObj.variables.length === 0) {
            const variableMatches = templateObj.content.match(/\{\{(\w+)\}\}/g);
            if (variableMatches) {
                templateObj.variables = variableMatches.map(match => {
                    const name = match.replace(/\{\{|\}\}/g, '');
                    return {
                        name,
                        defaultValue: '',
                        required: true
                    };
                });
            }
        }
        res.json({ template: templateObj });
    }
    catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Failed to retrieve template' });
    }
});
exports.getTemplate = getTemplate;
// Create new template
const createTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { name, content, description = '', category = 'general' } = req.body;
    try {
        // Check if template name already exists for this user
        const existingTemplate = yield models_1.MessageTemplate.findOne({
            userId: user._id,
            name,
            isActive: true
        });
        if (existingTemplate) {
            return res.status(400).json({ error: 'Template with this name already exists' });
        }
        // Extract variables from content
        const variableMatches = content.match(/\{\{(\w+)\}\}/g);
        const variables = variableMatches ? variableMatches.map(match => {
            const name = match.replace(/\{\{|\}\}/g, '');
            return {
                name,
                defaultValue: '',
                required: true
            };
        }) : [];
        const template = new models_1.MessageTemplate({
            userId: user._id,
            name,
            content,
            description,
            category,
            variables
        });
        yield template.save();
        res.status(201).json({
            message: 'Template created successfully',
            template: template.toObject()
        });
    }
    catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});
exports.createTemplate = createTemplate;
// Update template
const updateTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { templateId } = req.params;
    const user = req.user;
    const { name, content, description, category } = req.body;
    try {
        const template = yield models_1.MessageTemplate.findOne({
            _id: templateId,
            userId: user._id,
            isActive: true
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        // Check if new name conflicts with existing template
        if (name && name !== template.name) {
            const existingTemplate = yield models_1.MessageTemplate.findOne({
                userId: user._id,
                name,
                isActive: true,
                _id: { $ne: templateId }
            });
            if (existingTemplate) {
                return res.status(400).json({ error: 'Template with this name already exists' });
            }
        }
        // Update fields
        if (name)
            template.name = name;
        if (content) {
            template.content = content;
            // Re-extract variables from updated content
            const variableMatches = content.match(/\{\{(\w+)\}\}/g);
            template.variables = variableMatches ? variableMatches.map(match => {
                const name = match.replace(/\{\{|\}\}/g, '');
                return {
                    name,
                    defaultValue: '',
                    required: true
                };
            }) : [];
        }
        if (description !== undefined)
            template.description = description;
        if (category)
            template.category = category;
        template.updatedAt = new Date();
        yield template.save();
        res.json({
            message: 'Template updated successfully',
            template: template.toObject()
        });
    }
    catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});
exports.updateTemplate = updateTemplate;
// Delete template
const deleteTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { templateId } = req.params;
    const user = req.user;
    try {
        const template = yield models_1.MessageTemplate.findOne({
            _id: templateId,
            userId: user._id,
            isActive: true
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        // Soft delete by setting isActive to false
        template.isActive = false;
        template.updatedAt = new Date();
        yield template.save();
        res.json({
            message: 'Template deleted successfully',
            templateName: template.name
        });
    }
    catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});
exports.deleteTemplate = deleteTemplate;
// Send template message
const sendTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { instanceId, to, templateId, variables = {} } = req.body;
    try {
        // Get template
        const template = yield models_1.MessageTemplate.findOne({
            _id: templateId,
            userId: user._id,
            isActive: true
        });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        // Replace variables in content
        let message = template.content;
        Object.entries(variables).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
        });
        // Get WhatsApp manager from app.locals
        const whatsappManager = req.app.locals.whatsappManager;
        if (!whatsappManager) {
            return res.status(500).json({ error: 'WhatsApp manager not available' });
        }
        // Get client
        const client = whatsappManager.getClient(user._id, instanceId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }
        const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
        if (clientStatus !== 'ready') {
            return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
        }
        // Send message
        const result = yield client.sendMessage(`${to}@c.us`, message);
        // Update template usage count
        template.usageCount = (template.usageCount || 0) + 1;
        yield template.save();
        // Save message to database
        const messageDoc = new models_2.Message({
            userId: user._id,
            instanceId,
            from: client.info.wid.user,
            to,
            type: 'text',
            content: { text: message },
            templateId: template._id.toString(),
            messageId: result.id.id,
            status: 'sent',
            source: 'frontend', // Mark template messages as frontend messages
            timestamp: new Date()
        });
        yield messageDoc.save();
        res.json({
            success: true,
            messageId: result.id.id,
            instanceId,
            templateId: template._id,
            templateName: template.name,
            processedMessage: message,
            to,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Send template error:', error);
        res.status(500).json({ error: 'Failed to send template message' });
    }
});
exports.sendTemplate = sendTemplate;
