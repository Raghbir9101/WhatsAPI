"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bulkCampaignSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instanceId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    templateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MessageTemplate',
        default: null
    },
    message: {
        type: String,
        required: true
    },
    recipients: [{
            phoneNumber: String,
            name: String,
            variables: mongoose_1.Schema.Types.Mixed,
            status: {
                type: String,
                enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
                default: 'pending'
            },
            messageId: String,
            sentAt: Date,
            error: String
        }],
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled'],
        default: 'draft'
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    totalRecipients: {
        type: Number,
        default: 0
    },
    sentCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    deliveredCount: {
        type: Number,
        default: 0
    },
    settings: {
        delayBetweenMessages: {
            type: Number,
            default: 1000 // milliseconds
        },
        retryFailedMessages: {
            type: Boolean,
            default: true
        },
        maxRetries: {
            type: Number,
            default: 3
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
});
// Indexes for better performance
bulkCampaignSchema.index({ userId: 1, status: 1 });
const BulkCampaign = mongoose_1.default.model('BulkCampaign', bulkCampaignSchema);
exports.default = BulkCampaign;
