"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true
    },
    company: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true,
        unique: true
    },
    messagesSent: {
        type: Number,
        default: 0
    },
    monthlyLimit: {
        type: Number,
        default: 5000
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Admin fields
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    packageType: {
        type: String,
        enum: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
        default: 'BASIC'
    },
    assignedPackages: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: 'assignedPackage',
    },
    creditsTotal: {
        type: Number,
        default: 5000
    },
    creditsUsed: {
        type: Number,
        default: 0
    },
    validityDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Virtual field for remaining credits
userSchema.virtual('creditsRemaining').get(function () {
    return this.creditsTotal - this.creditsUsed;
});
// Method to check if user is admin
userSchema.methods.isAdmin = function () {
    return this.role === 'ADMIN';
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
