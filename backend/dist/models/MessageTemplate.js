"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageTemplateSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
// Indexes for better performance
messageTemplateSchema.index({ userId: 1, name: 1 });
const MessageTemplate = mongoose_1.default.model('MessageTemplate', messageTemplateSchema);
exports.default = MessageTemplate;
