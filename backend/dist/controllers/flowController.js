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
exports.testFlow = exports.getFlowStats = exports.toggleFlowStatus = exports.deleteFlow = exports.updateFlow = exports.createFlow = exports.getFlow = exports.getFlows = void 0;
const models_1 = require("../models");
// Get all flows for a user
const getFlows = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { instanceId } = req.query;
        const query = { userId: user._id };
        if (instanceId) {
            query.instanceId = instanceId;
        }
        const flows = yield models_1.Flow.find(query)
            .sort({ createdAt: -1 })
            .lean();
        res.json({
            flows,
            total: flows.length
        });
    }
    catch (error) {
        console.error('Get flows error:', error);
        res.status(500).json({ error: 'Failed to get flows' });
    }
});
exports.getFlows = getFlows;
// Get a specific flow
const getFlow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const flow = yield models_1.Flow.findOne({
            _id: id,
            userId: user._id
        }).lean();
        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }
        res.json(flow);
    }
    catch (error) {
        console.error('Get flow error:', error);
        res.status(500).json({ error: 'Failed to get flow' });
    }
});
exports.getFlow = getFlow;
// Create a new flow
const createFlow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { instanceId, name, description, nodes = [], edges = [], isActive = true } = req.body;
        if (!name || !instanceId) {
            return res.status(400).json({ error: 'Name and instanceId are required' });
        }
        const flow = new models_1.Flow({
            userId: user._id,
            instanceId,
            name,
            description,
            nodes,
            edges,
            isActive,
            triggerCount: 0
        });
        yield flow.save();
        res.status(201).json(flow);
    }
    catch (error) {
        console.error('Create flow error:', error);
        res.status(500).json({ error: 'Failed to create flow' });
    }
});
exports.createFlow = createFlow;
// Update a flow
const updateFlow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name, description, nodes, edges, isActive } = req.body;
        const flow = yield models_1.Flow.findOneAndUpdate({ _id: id, userId: user._id }, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (description !== undefined && { description })), (nodes && { nodes })), (edges && { edges })), (isActive !== undefined && { isActive })), { updatedAt: new Date() }), { new: true });
        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }
        res.json(flow);
    }
    catch (error) {
        console.error('Update flow error:', error);
        res.status(500).json({ error: 'Failed to update flow' });
    }
});
exports.updateFlow = updateFlow;
// Delete a flow
const deleteFlow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const flow = yield models_1.Flow.findOneAndDelete({
            _id: id,
            userId: user._id
        });
        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }
        res.json({ message: 'Flow deleted successfully' });
    }
    catch (error) {
        console.error('Delete flow error:', error);
        res.status(500).json({ error: 'Failed to delete flow' });
    }
});
exports.deleteFlow = deleteFlow;
// Toggle flow active status
const toggleFlowStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const flow = yield models_1.Flow.findOne({
            _id: id,
            userId: user._id
        });
        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }
        flow.isActive = !flow.isActive;
        flow.updatedAt = new Date();
        yield flow.save();
        res.json({
            message: `Flow ${flow.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: flow.isActive
        });
    }
    catch (error) {
        console.error('Toggle flow status error:', error);
        res.status(500).json({ error: 'Failed to toggle flow status' });
    }
});
exports.toggleFlowStatus = toggleFlowStatus;
// Get flow statistics
const getFlowStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { instanceId } = req.query;
        const query = { userId: user._id };
        if (instanceId) {
            query.instanceId = instanceId;
        }
        const stats = yield models_1.Flow.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalFlows: { $sum: 1 },
                    activeFlows: { $sum: { $cond: ['$isActive', 1, 0] } },
                    totalTriggers: { $sum: '$triggerCount' },
                    averageNodesPerFlow: { $avg: { $size: '$nodes' } }
                }
            }
        ]);
        const result = stats[0] || {
            totalFlows: 0,
            activeFlows: 0,
            totalTriggers: 0,
            averageNodesPerFlow: 0
        };
        // Get recent activity
        const recentFlows = yield models_1.Flow.find(query)
            .sort({ lastTriggered: -1 })
            .limit(5)
            .select('name lastTriggered triggerCount')
            .lean();
        res.json(Object.assign(Object.assign({}, result), { recentActivity: recentFlows.filter(flow => flow.lastTriggered) }));
    }
    catch (error) {
        console.error('Get flow stats error:', error);
        res.status(500).json({ error: 'Failed to get flow statistics' });
    }
});
exports.getFlowStats = getFlowStats;
// Test a flow manually
const testFlow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const { testMessage = 'test', fromNumber = '1234567890' } = req.body;
        const flow = yield models_1.Flow.findOne({
            _id: id,
            userId: user._id
        });
        if (!flow) {
            return res.status(404).json({ error: 'Flow not found' });
        }
        // Create a mock message for testing
        const mockMessage = {
            body: testMessage,
            from: fromNumber,
            hasMedia: false,
            type: 'text',
            getContact: () => __awaiter(void 0, void 0, void 0, function* () { return ({ name: 'Test User', pushname: 'Test User' }); })
        };
        // Get the flow engine from the app locals
        const { whatsappManager } = req.app.locals;
        if (whatsappManager && whatsappManager.flowEngine) {
            yield whatsappManager.flowEngine.checkTriggers(mockMessage, flow.instanceId, user._id.toString());
            res.json({
                message: 'Flow test executed successfully',
                testMessage,
                flowName: flow.name
            });
        }
        else {
            res.status(500).json({ error: 'Flow engine not available' });
        }
    }
    catch (error) {
        console.error('Test flow error:', error);
        res.status(500).json({ error: 'Failed to test flow' });
    }
});
exports.testFlow = testFlow;
