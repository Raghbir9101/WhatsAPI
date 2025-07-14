"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const whatsappInstanceSchema = new mongoose_1.default.Schema({
    instanceId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const WhatsAppInstance = mongoose_1.default.model('WhatsAppInstance', whatsappInstanceSchema);
exports.default = WhatsAppInstance;
