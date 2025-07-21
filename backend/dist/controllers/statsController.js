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
exports.getMessageStats = exports.getUserStats = void 0;
const models_1 = require("../models");
// Get user statistics
const getUserStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { whatsappManager } = req.app.locals;
    try {
        const instances = yield models_1.WhatsAppInstance.find({ userId: user._id });
        const numbersStats = instances.map(instance => {
            const status = whatsappManager.getClientStatus(user._id, instance.instanceId);
            return {
                instanceId: instance.instanceId,
                instanceName: instance.instanceName,
                phoneNumber: instance.phoneNumber,
                status: status || instance.status,
                messagesSent: instance.messagesSent,
                isActive: instance.isActive
            };
        });
        res.json({
            user: {
                email: user.email,
                name: user.name,
                company: user.company,
                createdAt: user.createdAt
            },
            usage: {
                messagesSent: user.messagesSent,
                monthlyLimit: user.monthlyLimit,
                remainingMessages: user.monthlyLimit - user.messagesSent
            },
            numbers: numbersStats,
            totalNumbers: numbersStats.length,
            activeNumbers: numbersStats.filter(n => n.isActive).length
        });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
});
exports.getUserStats = getUserStats;
// Get message statistics
const getMessageStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { instanceId, source, days = 30 } = req.query;
        const userId = req.user.id;
        const query = { userId };
        if (instanceId)
            query.instanceId = instanceId;
        if (source)
            query.source = source;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Get total message counts
        const totalMessages = yield models_1.Message.countDocuments(query);
        const incomingMessages = yield models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { direction: 'incoming' }));
        const outgoingMessages = yield models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { direction: 'outgoing' }));
        // Get messages by source
        const apiMessages = yield models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { source: 'api' }));
        const frontendMessages = yield models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { source: 'frontend' }));
        // Get messages by type
        const messagesByType = yield models_1.Message.aggregate([
            { $match: query },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { type: '$_id', count: 1, _id: 0 } }
        ]);
        const messagesByTypeObj = {};
        messagesByType.forEach(item => {
            messagesByTypeObj[item.type] = item.count;
        });
        // Get daily stats
        const messagesByDay = yield models_1.Message.aggregate([
            {
                $match: Object.assign(Object.assign({}, query), { timestamp: { $gte: startDate } })
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    total: { $sum: 1 },
                    incoming: {
                        $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
                    },
                    outgoing: {
                        $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: '$_id',
                    total: 1,
                    incoming: 1,
                    outgoing: 1,
                    _id: 0
                }
            }
        ]);
        res.json({
            totalMessages,
            incomingMessages,
            outgoingMessages,
            apiMessages,
            frontendMessages,
            messagesByType: messagesByTypeObj,
            messagesByDay
        });
    }
    catch (error) {
        console.error('Error getting message stats:', error);
        res.status(500).json({ error: 'Failed to get message stats' });
    }
});
exports.getMessageStats = getMessageStats;
