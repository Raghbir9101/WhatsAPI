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
exports.BulkCampaign = exports.MessageTemplate = exports.Message = exports.WhatsAppInstance = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// User Schema
const userSchema = new mongoose_1.Schema({
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
    deviceLimit: {
        type: Number,
        default: 1
    },
    role: {
        type: String,
        default: 'user'
    },
    accountType: {
        type: String,
        default: 'demo',
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// WhatsApp Instance Schema
const whatsappInstanceSchema = new mongoose_1.Schema({
    instanceId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instanceName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'created',
        enum: ['created', 'initializing', 'qr_ready', 'authenticated', 'ready', 'disconnected', 'auth_failed']
    },
    messagesSent: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    connectedAt: {
        type: Date,
        default: null
    },
    disconnectedAt: {
        type: Date,
        default: null
    }
});
// Message Schema
const messageSchema = new mongoose_1.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    instanceId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact'],
        default: 'text'
    },
    content: {
        text: String,
        caption: String,
        mediaUrl: String,
        fileName: String,
        mimeType: String,
        fileSize: Number
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    groupId: String,
    contactName: String,
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed', 'scheduled', 'cancelled'],
        default: 'sent'
    },
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BulkCampaign',
        default: null
    },
    templateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MessageTemplate',
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Message Template Schema
const messageTemplateSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
    content: {
        type: String,
        required: true
    },
    variables: [{
            name: String,
            defaultValue: String,
            required: {
                type: Boolean,
                default: false
            }
        }],
    category: {
        type: String,
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
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
// Bulk Campaign Schema
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
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageTemplateSchema.index({ userId: 1, name: 1 });
bulkCampaignSchema.index({ userId: 1, status: 1 });
// Create models
exports.User = mongoose_1.default.model('User', userSchema);
exports.WhatsAppInstance = mongoose_1.default.model('WhatsAppInstance', whatsappInstanceSchema);
exports.Message = mongoose_1.default.model('Message', messageSchema);
exports.MessageTemplate = mongoose_1.default.model('MessageTemplate', messageTemplateSchema);
exports.BulkCampaign = mongoose_1.default.model('BulkCampaign', bulkCampaignSchema);
