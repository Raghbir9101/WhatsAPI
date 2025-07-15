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
    const user = req.user;
    const { instanceId, days = 30 } = req.query;
    try {
        const query = { userId: user._id };
        if (instanceId) {
            const instance = yield models_1.WhatsAppInstance.findOne({ instanceId, userId: user._id });
            if (!instance) {
                return res.status(404).json({ error: 'WhatsApp instance not found' });
            }
            query.instanceId = instanceId;
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        query.timestamp = { $gte: startDate };
        const [totalMessages, incomingMessages, outgoingMessages, messagesByType, messagesByDay] = yield Promise.all([
            models_1.Message.countDocuments(query),
            models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { direction: 'incoming' })),
            models_1.Message.countDocuments(Object.assign(Object.assign({}, query), { direction: 'outgoing' })),
            models_1.Message.aggregate([
                { $match: query },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            models_1.Message.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                        },
                        count: { $sum: 1 },
                        incoming: {
                            $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
                        },
                        outgoing: {
                            $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);
        res.json({
            totalMessages,
            incomingMessages,
            outgoingMessages,
            messagesByType: messagesByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            messagesByDay: messagesByDay.map(day => ({
                date: day._id,
                total: day.count,
                incoming: day.incoming,
                outgoing: day.outgoing
            }))
        });
    }
    catch (error) {
        console.error('Get message stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve message statistics' });
    }
});
exports.getMessageStats = getMessageStats;
