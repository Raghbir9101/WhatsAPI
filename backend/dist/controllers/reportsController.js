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
exports.getPerformanceMetrics = exports.getDeliveryReport = exports.getAnalytics = void 0;
const models_1 = require("../models");
// Get detailed analytics report
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, startDate, endDate, granularity = 'daily' } = req.query;
    const user = req.user;
    try {
        const query = { userId: user._id };
        if (instanceId) {
            const instance = yield models_1.WhatsAppInstance.findOne({ instanceId, userId: user._id });
            if (!instance) {
                return res.status(404).json({ error: 'WhatsApp instance not found' });
            }
            query.instanceId = instanceId;
        }
        // Date range filtering
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        // Granularity format mapping
        const dateFormats = {
            daily: '%Y-%m-%d',
            weekly: '%Y-%U',
            monthly: '%Y-%m',
            yearly: '%Y'
        };
        const [totalMessages, messagesByDirection, messagesByType, messagesByStatus, messagesOverTime, topContacts, campaignStats] = yield Promise.all([
            // Total messages
            models_1.Message.countDocuments(query),
            // Messages by direction
            models_1.Message.aggregate([
                { $match: query },
                { $group: { _id: '$direction', count: { $sum: 1 } } }
            ]),
            // Messages by type
            models_1.Message.aggregate([
                { $match: query },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            // Messages by status
            models_1.Message.aggregate([
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Messages over time
            models_1.Message.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: dateFormats[granularity], date: '$timestamp' }
                        },
                        total: { $sum: 1 },
                        incoming: { $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] } },
                        outgoing: { $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Top contacts
            models_1.Message.aggregate([
                { $match: Object.assign(Object.assign({}, query), { direction: 'outgoing' }) },
                {
                    $group: {
                        _id: '$to',
                        messageCount: { $sum: 1 },
                        lastMessage: { $max: '$timestamp' }
                    }
                },
                { $sort: { messageCount: -1 } },
                { $limit: 10 }
            ]),
            // Campaign statistics
            models_1.BulkCampaign.aggregate([
                { $match: { userId: user._id } },
                {
                    $group: {
                        _id: null,
                        totalCampaigns: { $sum: 1 },
                        completedCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        totalRecipients: { $sum: '$totalRecipients' },
                        totalSent: { $sum: '$sentCount' },
                        totalFailed: { $sum: '$failedCount' }
                    }
                }
            ])
        ]);
        res.json({
            summary: {
                totalMessages,
                messagesByDirection: messagesByDirection.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                messagesByType: messagesByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                messagesByStatus: messagesByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            },
            timeline: messagesOverTime.map(item => ({
                period: item._id,
                total: item.total,
                incoming: item.incoming,
                outgoing: item.outgoing
            })),
            topContacts: topContacts.map(contact => ({
                phoneNumber: contact._id,
                messageCount: contact.messageCount,
                lastMessage: contact.lastMessage
            })),
            campaigns: campaignStats[0] || {
                totalCampaigns: 0,
                completedCampaigns: 0,
                totalRecipients: 0,
                totalSent: 0,
                totalFailed: 0
            }
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
});
exports.getAnalytics = getAnalytics;
// Get message delivery report
const getDeliveryReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, campaignId, startDate, endDate } = req.query;
    const user = req.user;
    try {
        const query = { userId: user._id };
        if (instanceId) {
            const instance = yield models_1.WhatsAppInstance.findOne({ instanceId, userId: user._id });
            if (!instance) {
                return res.status(404).json({ error: 'WhatsApp instance not found' });
            }
            query.instanceId = instanceId;
        }
        if (campaignId) {
            query.campaignId = campaignId;
        }
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const deliveryReport = yield models_1.Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        status: '$status',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    statuses: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    },
                    total: { $sum: '$count' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        const summary = yield models_1.Message.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json({
            summary: summary.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            dailyReport: deliveryReport.map(day => ({
                date: day._id,
                total: day.total,
                breakdown: day.statuses.reduce((acc, status) => {
                    acc[status.status] = status.count;
                    return acc;
                }, {})
            }))
        });
    }
    catch (error) {
        console.error('Get delivery report error:', error);
        res.status(500).json({ error: 'Failed to retrieve delivery report' });
    }
});
exports.getDeliveryReport = getDeliveryReport;
// Get performance metrics
const getPerformanceMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { instanceId, days = 30 } = req.query;
    const user = req.user;
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
        const [messageVolume, responseRate, activeHours, instancePerformance] = yield Promise.all([
            // Message volume trends
            models_1.Message.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            hour: { $hour: '$timestamp' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.date',
                        hourlyVolume: {
                            $push: {
                                hour: '$_id.hour',
                                count: '$count'
                            }
                        },
                        dailyTotal: { $sum: '$count' }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Response rate calculation
            models_1.Message.aggregate([
                { $match: Object.assign(Object.assign({}, query), { direction: 'outgoing' }) },
                {
                    $lookup: {
                        from: 'messages',
                        let: { to: '$to', timestamp: '$timestamp' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$from', '$$to'] },
                                            { $eq: ['$direction', 'incoming'] },
                                            { $gte: ['$timestamp', '$$timestamp'] },
                                            { $lte: ['$timestamp', { $add: ['$$timestamp', 3600000] }] } // 1 hour window
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'responses'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSent: { $sum: 1 },
                        totalResponded: { $sum: { $cond: [{ $gt: [{ $size: '$responses' }, 0] }, 1, 0] } }
                    }
                }
            ]),
            // Most active hours
            models_1.Message.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { $hour: '$timestamp' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // Instance performance comparison
            models_1.WhatsAppInstance.aggregate([
                { $match: { userId: user._id } },
                {
                    $lookup: {
                        from: 'messages',
                        let: { instanceId: '$instanceId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$instanceId', '$$instanceId'] },
                                            { $gte: ['$timestamp', startDate] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'messages'
                    }
                },
                {
                    $project: {
                        instanceName: 1,
                        phoneNumber: 1,
                        messageCount: { $size: '$messages' },
                        isActive: 1,
                        status: 1
                    }
                },
                { $sort: { messageCount: -1 } }
            ])
        ]);
        const responseRateData = responseRate[0] || { totalSent: 0, totalResponded: 0 };
        const responseRatePercent = responseRateData.totalSent > 0 ?
            (responseRateData.totalResponded / responseRateData.totalSent * 100).toFixed(2) : 0;
        res.json({
            messageVolume: messageVolume,
            responseRate: {
                percentage: parseFloat(responseRatePercent),
                totalSent: responseRateData.totalSent,
                totalResponded: responseRateData.totalResponded
            },
            activeHours: activeHours.map(hour => ({
                hour: hour._id,
                messageCount: hour.count
            })),
            instancePerformance: instancePerformance
        });
    }
    catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ error: 'Failed to retrieve performance metrics' });
    }
});
exports.getPerformanceMetrics = getPerformanceMetrics;
