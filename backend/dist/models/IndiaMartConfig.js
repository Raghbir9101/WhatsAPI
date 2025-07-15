"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const indiaMartConfigSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    crmKey: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    fetchInterval: {
        type: Number,
        default: 15 // minutes
    },
    overlapDuration: {
        type: Number,
        default: 5 // minutes
    },
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
    },
    settings: {
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
        notifications: {
            type: Boolean,
            default: true
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
// Indexes for better performance
indiaMartConfigSchema.index({ userId: 1 });
indiaMartConfigSchema.index({ isActive: 1 });
indiaMartConfigSchema.index({ nextFetchTime: 1 });
const IndiaMartConfig = mongoose_1.default.model('IndiaMartConfig', indiaMartConfigSchema);
exports.default = IndiaMartConfig;
