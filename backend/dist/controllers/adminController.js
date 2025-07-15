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
exports.updateSystemSettings = exports.getSystemSettings = exports.deletePackage = exports.updatePackage = exports.createPackage = exports.getPackages = exports.addCredits = exports.extendClientValidity = exports.updateClientStatus = exports.getClient = exports.getClients = exports.getAdminStats = void 0;
const models_1 = require("../models");
// Get admin statistics
const getAdminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const [totalClients, activeClients, expiredClients, suspendedClients, totalCreditsIssued, totalCreditsUsed, totalMessagesSent, totalWhatsAppInstances, connectedWhatsAppInstances, totalCampaigns] = yield Promise.all([
            models_1.User.countDocuments({ role: 'USER' }),
            models_1.User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
            models_1.User.countDocuments({ role: 'USER', status: 'EXPIRED' }),
            models_1.User.countDocuments({ role: 'USER', status: 'SUSPENDED' }),
            models_1.User.aggregate([
                { $match: { role: 'USER' } },
                { $group: { _id: null, total: { $sum: '$creditsTotal' } } }
            ]),
            models_1.User.aggregate([
                { $match: { role: 'USER' } },
                { $group: { _id: null, total: { $sum: '$creditsUsed' } } }
            ]),
            models_1.User.aggregate([
                { $match: { role: 'USER' } },
                { $group: { _id: null, total: { $sum: '$messagesSent' } } }
            ]),
            models_1.WhatsAppInstance.countDocuments(),
            models_1.WhatsAppInstance.countDocuments({ isActive: true, status: 'ready' }),
            models_1.BulkCampaign.countDocuments()
        ]);
        // Get real-time connected instances from WhatsAppManager
        const { whatsappManager } = req.app.locals;
        let activeConnectedInstances = 0;
        if (whatsappManager) {
            // Get all instances and check their real-time status
            const allInstances = yield models_1.WhatsAppInstance.find({ isActive: true });
            for (const instance of allInstances) {
                const status = whatsappManager.getClientStatus(instance.userId, instance.instanceId);
                if (status === 'ready' || status === 'authenticated') {
                    activeConnectedInstances++;
                }
            }
        }
        else {
            // Fallback to database status if manager not available
            activeConnectedInstances = connectedWhatsAppInstances;
        }
        // Calculate monthly revenue (simplified calculation)
        const packages = yield models_1.Package.find({ isActive: true });
        const monthlyRevenue = activeClients * 199; // Simplified calculation
        // New clients this month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const newClientsThisMonth = yield models_1.User.countDocuments({
            role: 'USER',
            createdAt: { $gte: lastMonth }
        });
        res.json({
            totalClients,
            activeClients,
            expiredClients,
            suspendedClients,
            totalCreditsIssued: ((_a = totalCreditsIssued[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            totalCreditsUsed: ((_b = totalCreditsUsed[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
            totalMessagesSent: ((_c = totalMessagesSent[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            totalWhatsAppInstances,
            connectedWhatsAppInstances: activeConnectedInstances,
            totalCampaigns,
            monthlyRevenue,
            newClientsThisMonth
        });
    }
    catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve admin statistics' });
    }
});
exports.getAdminStats = getAdminStats;
// Get all clients
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        const query = { role: 'USER' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const totalClients = yield models_1.User.countDocuments(query);
        const clients = yield models_1.User.find(query)
            .select('-password -apiKey')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        // Get WhatsApp instances count for each client
        const clientsWithInstances = yield Promise.all(clients.map((client) => __awaiter(void 0, void 0, void 0, function* () {
            const whatsappInstances = yield models_1.WhatsAppInstance.countDocuments({ userId: client._id });
            return {
                id: client._id,
                email: client.email,
                name: client.name,
                company: client.company,
                package: client.packageType,
                validityDate: client.validityDate.toISOString().split('T')[0],
                creditsTotal: client.creditsTotal,
                creditsUsed: client.creditsUsed,
                creditsRemaining: client.creditsTotal - client.creditsUsed,
                messagesSent: client.messagesSent,
                status: client.status,
                createdAt: client.createdAt.toISOString().split('T')[0],
                lastLogin: client.lastLogin.toISOString().split('T')[0],
                whatsappInstances
            };
        })));
        res.json({
            clients: clientsWithInstances,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalClients,
                pages: Math.ceil(totalClients / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Failed to retrieve clients' });
    }
});
exports.getClients = getClients;
// Get client by ID
const getClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const client = yield models_1.User.findById(id).select('-password -apiKey');
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const whatsappInstances = yield models_1.WhatsAppInstance.countDocuments({ userId: client._id });
        res.json({
            id: client._id,
            email: client.email,
            name: client.name,
            company: client.company,
            package: client.packageType,
            validityDate: client.validityDate.toISOString().split('T')[0],
            creditsTotal: client.creditsTotal,
            creditsUsed: client.creditsUsed,
            creditsRemaining: client.creditsTotal - client.creditsUsed,
            messagesSent: client.messagesSent,
            status: client.status,
            createdAt: client.createdAt.toISOString().split('T')[0],
            lastLogin: client.lastLogin.toISOString().split('T')[0],
            whatsappInstances
        });
    }
    catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Failed to retrieve client' });
    }
});
exports.getClient = getClient;
// Update client status
const updateClientStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const client = yield models_1.User.findByIdAndUpdate(id, { status }, { new: true }).select('-password -apiKey');
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ message: 'Client status updated successfully', client });
    }
    catch (error) {
        console.error('Update client status error:', error);
        res.status(500).json({ error: 'Failed to update client status' });
    }
});
exports.updateClientStatus = updateClientStatus;
// Extend client validity
const extendClientValidity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { days } = req.body;
        if (!days || days <= 0) {
            return res.status(400).json({ error: 'Valid number of days required' });
        }
        const client = yield models_1.User.findById(id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const newValidityDate = new Date(client.validityDate);
        newValidityDate.setDate(newValidityDate.getDate() + Number(days));
        yield models_1.User.findByIdAndUpdate(id, { validityDate: newValidityDate });
        res.json({ message: 'Client validity extended successfully' });
    }
    catch (error) {
        console.error('Extend client validity error:', error);
        res.status(500).json({ error: 'Failed to extend client validity' });
    }
});
exports.extendClientValidity = extendClientValidity;
// Add credits to client
const addCredits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { credits } = req.body;
        if (!credits || credits <= 0) {
            return res.status(400).json({ error: 'Valid number of credits required' });
        }
        const client = yield models_1.User.findById(id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        yield models_1.User.findByIdAndUpdate(id, {
            $inc: { creditsTotal: Number(credits) }
        });
        res.json({ message: 'Credits added successfully' });
    }
    catch (error) {
        console.error('Add credits error:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});
exports.addCredits = addCredits;
// Get all packages
const getPackages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const packages = yield models_1.Package.find({ isActive: true }).sort({ price: 1 });
        res.json(packages);
    }
    catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ error: 'Failed to retrieve packages' });
    }
});
exports.getPackages = getPackages;
// Create package
const createPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, credits, price, validityDays, features } = req.body;
        const packageData = new models_1.Package({
            name,
            credits,
            price,
            validityDays,
            features
        });
        yield packageData.save();
        res.status(201).json({ message: 'Package created successfully', package: packageData });
    }
    catch (error) {
        console.error('Create package error:', error);
        res.status(500).json({ error: 'Failed to create package' });
    }
});
exports.createPackage = createPackage;
// Update package
const updatePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, credits, price, validityDays, features } = req.body;
        const packageData = yield models_1.Package.findByIdAndUpdate(id, { name, credits, price, validityDays, features }, { new: true });
        if (!packageData) {
            return res.status(404).json({ error: 'Package not found' });
        }
        res.json({ message: 'Package updated successfully', package: packageData });
    }
    catch (error) {
        console.error('Update package error:', error);
        res.status(500).json({ error: 'Failed to update package' });
    }
});
exports.updatePackage = updatePackage;
// Delete package
const deletePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const packageData = yield models_1.Package.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!packageData) {
            return res.status(404).json({ error: 'Package not found' });
        }
        res.json({ message: 'Package deleted successfully' });
    }
    catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ error: 'Failed to delete package' });
    }
});
exports.deletePackage = deletePackage;
// Get system settings
const getSystemSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // This is a simplified version - in a real app, you'd store these in a settings model
        const settings = {
            platformName: 'CEOITBOX WhatsApp Connector',
            supportEmail: 'support@ceoitbox.com',
            maxInstancesPerUser: 10,
            maintenanceMode: false,
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
            ipRestriction: false,
            sessionTimeout: 60,
            allowedIps: [],
            smtpHost: '',
            smtpPort: 587,
            smtpEncryption: 'TLS',
            smtpUsername: '',
            smtpPassword: '',
            rateLimitPerHour: 1000,
            apiRateLimitPerMinute: 60
        };
        res.json(settings);
    }
    catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ error: 'Failed to retrieve system settings' });
    }
});
exports.getSystemSettings = getSystemSettings;
// Update system settings
const updateSystemSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = req.body;
        // In a real app, you'd save these to a settings model
        // For now, we'll just return success
        res.json({ message: 'System settings updated successfully' });
    }
    catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ error: 'Failed to update system settings' });
    }
});
exports.updateSystemSettings = updateSystemSettings;
