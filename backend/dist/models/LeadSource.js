"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const leadSourceSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        enum: ['indiamart', 'zoho', 'facebook', 'google', 'justdial', 'tradeindia', 'other']
    },
    displayName: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    apiSecret: {
        type: String,
        default: ''
    },
    webhookUrl: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        fetchInterval: {
            type: Number,
            default: 15 // minutes
        },
        autoFetch: {
            type: Boolean,
            default: true
        },
        retryFailedCalls: {
            type: Boolean,
            default: true
        },
        maxRetries: {
            type: Number,
            default: 3
        },
        overlapDuration: {
            type: Number,
            default: 5 // minutes
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    metadata: {
        lastFetchTime: {
            type: Date,
            default: null
        },
        nextFetchTime: {
            type: Date,
            default: null
        },
        totalLeadsFetched: {
            type: Number,
            default: 0
        },
        totalApiCalls: {
            type: Number,
            default: 0
        },
        lastApiCallStatus: {
            type: String,
            enum: ['success', 'error', 'pending'],
            default: 'pending'
        },
        lastApiCallError: {
            type: String,
            default: null
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Indexes
leadSourceSchema.index({ userId: 1, name: 1 }, { unique: true });
leadSourceSchema.index({ isActive: 1 });
leadSourceSchema.index({ 'metadata.nextFetchTime': 1 });
const LeadSource = mongoose_1.default.model('LeadSource', leadSourceSchema);
exports.default = LeadSource;
