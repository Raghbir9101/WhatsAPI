"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'BulkCampaign',
        default: null
    },
    templateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
// Indexes for better performance
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
const Message = mongoose_1.default.model('Message', messageSchema);
exports.default = Message;
