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
exports.cancelScheduledMessage = exports.getScheduledMessages = exports.scheduleMessage = void 0;
const models_1 = require("../models");
// Schedule a message
const scheduleMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, to, message, scheduledAt } = req.body;
    const user = req.user;
    try {
        const instance = yield models_1.WhatsAppInstance.findOne({
            instanceId,
            userId: user._id
        });
        if (!instance) {
            return res.status(404).json({ error: 'WhatsApp instance not found' });
        }
        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
            return res.status(400).json({ error: 'Scheduled time must be in the future' });
        }
        // Create scheduled message record
        const messageRecord = new models_1.Message({
            messageId: `scheduled_${Date.now()}`,
            instanceId,
            userId: user._id,
            direction: 'outgoing',
            from: instance.phoneNumber || instanceId,
            to,
            type: 'text',
            content: { text: message },
            status: 'scheduled',
            timestamp: scheduledDate
        });
        yield messageRecord.save();
        res.json({
            success: true,
            messageId: messageRecord.messageId,
            scheduledAt: scheduledDate,
            message: 'Message scheduled successfully'
        });
    }
    catch (error) {
        console.error('Schedule message error:', error);
        res.status(500).json({ error: 'Failed to schedule message' });
    }
});
exports.scheduleMessage = scheduleMessage;
// Get scheduled messages
const getScheduledMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, status = 'all', page = 1, limit = 20 } = req.query;
    const user = req.user;
    try {
        const query = {
            userId: user._id
        };
        if (instanceId) {
            const instance = yield models_1.WhatsAppInstance.findOne({ instanceId, userId: user._id });
            if (!instance) {
                return res.status(404).json({ error: 'WhatsApp instance not found' });
            }
            query.instanceId = instanceId;
        }
        // Build query based on status
        if (status === 'all') {
            query.$or = [
                { status: 'scheduled', timestamp: { $gt: new Date() } },
                { status: { $in: ['sent', 'failed', 'cancelled'] }, messageId: { $regex: '^scheduled_' } }
            ];
        }
        else if (status === 'scheduled') {
            query.status = 'scheduled';
            query.timestamp = { $gt: new Date() };
        }
        else {
            query.status = status;
            query.messageId = { $regex: '^scheduled_' };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalScheduled = yield models_1.Message.countDocuments(query);
        const scheduledMessages = yield models_1.Message.find(query)
            .sort({ timestamp: 1 })
            .skip(skip)
            .limit(parseInt(limit));
        res.json({
            scheduledMessages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalScheduled,
                pages: Math.ceil(totalScheduled / parseInt(limit))
            }
        });
    }
    catch (error) {
        console.error('Get scheduled messages error:', error);
        res.status(500).json({ error: 'Failed to retrieve scheduled messages' });
    }
});
exports.getScheduledMessages = getScheduledMessages;
// Cancel scheduled message
const cancelScheduledMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const user = req.user;
    try {
        const message = yield models_1.Message.findOneAndUpdate({ messageId, userId: user._id, status: 'scheduled' }, { status: 'cancelled' }, { new: true });
        if (!message) {
            return res.status(404).json({ error: 'Scheduled message not found' });
        }
        res.json({
            success: true,
            message: 'Scheduled message cancelled successfully',
            messageId
        });
    }
    catch (error) {
        console.error('Cancel scheduled message error:', error);
        res.status(500).json({ error: 'Failed to cancel scheduled message' });
    }
});
exports.cancelScheduledMessage = cancelScheduledMessage;
