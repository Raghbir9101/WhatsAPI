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
exports.createGroup = exports.sendGroupMessage = exports.getGroupDetails = exports.getGroups = void 0;
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
// Get all groups for a WhatsApp instance
const getGroups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId } = req.query;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    if (!instanceId) {
        return res.status(400).json({ error: 'instanceId is required' });
    }
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        const client = whatsappManager.getClient(user._id, instanceId);
        if (!client) {
            return res.json({
                instanceId,
                groups: [],
                totalGroups: 0,
                message: 'WhatsApp client not initialized. Please connect your WhatsApp first.'
            });
        }
        const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
        if (clientStatus !== 'ready') {
            return res.json({
                instanceId,
                groups: [],
                totalGroups: 0,
                message: `WhatsApp client not ready. Status: ${clientStatus}. Please ensure your WhatsApp is connected.`
            });
        }
        const chats = yield client.getChats();
        const groups = chats.filter(chat => chat.isGroup);
        const groupsData = yield Promise.all(groups.map((group) => __awaiter(void 0, void 0, void 0, function* () {
            const participants = yield group.participants;
            return {
                id: group.id._serialized,
                name: group.name,
                description: group.description,
                participantCount: participants.length,
                isOwner: group.owner === client.info.wid._serialized,
                createdAt: group.createdAt,
                lastMessage: group.lastMessage ? {
                    body: group.lastMessage.body,
                    timestamp: group.lastMessage.timestamp,
                    from: group.lastMessage.from
                } : null
            };
        })));
        res.json({
            instanceId,
            groups: groupsData,
            totalGroups: groupsData.length
        });
    }
    catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ error: 'Failed to retrieve groups' });
    }
});
exports.getGroups = getGroups;
// Get group details
const getGroupDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId } = req.params;
    const { instanceId } = req.query;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    if (!instanceId) {
        return res.status(400).json({ error: 'instanceId is required' });
    }
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        const client = whatsappManager.getClient(user._id, instanceId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }
        const chat = yield client.getChatById(groupId);
        if (!chat.isGroup) {
            return res.status(400).json({ error: 'Not a group chat' });
        }
        const participants = yield chat.participants;
        const participantsData = participants.map(participant => ({
            id: participant.id._serialized,
            isAdmin: participant.isAdmin,
            isSuperAdmin: participant.isSuperAdmin
        }));
        res.json({
            id: chat.id._serialized,
            name: chat.name,
            description: chat.description,
            participants: participantsData,
            participantCount: participants.length,
            isOwner: chat.owner === client.info.wid._serialized,
            createdAt: chat.createdAt,
            inviteCode: chat.inviteCode
        });
    }
    catch (error) {
        console.error('Get group details error:', error);
        res.status(500).json({ error: 'Failed to retrieve group details' });
    }
});
exports.getGroupDetails = getGroupDetails;
// Send message to group
const sendGroupMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, groupId, message } = req.body;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    if (user.messagesSent >= user.monthlyLimit) {
        return res.status(429).json({ error: 'Monthly message limit exceeded' });
    }
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        const client = whatsappManager.getClient(user._id, instanceId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }
        const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
        if (clientStatus !== 'ready') {
            return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
        }
        const sentMessage = yield client.sendMessage(groupId, message);
        // Store outgoing group message
        const messageRecord = new models_1.Message({
            messageId: sentMessage.id._serialized,
            instanceId: instanceId,
            userId: user._id,
            direction: 'outgoing',
            from: instance.phoneNumber || instanceId,
            to: groupId,
            type: 'text',
            content: { text: message },
            isGroup: true,
            groupId: groupId,
            status: 'sent',
            source: 'frontend', // Mark as frontend message
            timestamp: new Date()
        });
        yield Promise.all([
            models_1.User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
            models_1.WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
            messageRecord.save()
        ]);
        res.json({
            success: true,
            messageId: sentMessage.id._serialized,
            instanceId,
            groupId,
            message,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Send group message error:', error);
        res.status(500).json({ error: 'Failed to send group message' });
    }
});
exports.sendGroupMessage = sendGroupMessage;
// Create new group
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, name, participants } = req.body;
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        const client = whatsappManager.getClient(user._id, instanceId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }
        const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
        if (clientStatus !== 'ready') {
            return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
        }
        // Format participant phone numbers
        const formattedParticipants = participants.map(phone => (0, helpers_1.formatPhoneNumber)(phone));
        const group = yield client.createGroup(name, formattedParticipants);
        res.json({
            success: true,
            groupId: group.gid._serialized,
            groupName: name,
            participants: formattedParticipants,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});
exports.createGroup = createGroup;
