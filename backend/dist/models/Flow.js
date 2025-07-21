"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const flowSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    instanceId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    nodes: [{
            id: { type: String, required: true },
            type: {
                type: String,
                enum: ['trigger', 'action', 'condition', 'delay', 'response'],
                required: true
            },
            position: {
                x: { type: Number, required: true },
                y: { type: Number, required: true }
            },
            data: {
                label: String,
                config: mongoose_1.default.Schema.Types.Mixed // Flexible config for different node types
            }
        }],
    edges: [{
            id: { type: String, required: true },
            source: { type: String, required: true },
            target: { type: String, required: true },
            sourceHandle: String,
            targetHandle: String
        }],
    triggerCount: {
        type: Number,
        default: 0
    },
    lastTriggered: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
// Indexes for performance
flowSchema.index({ userId: 1, instanceId: 1 });
flowSchema.index({ isActive: 1 });
flowSchema.index({ 'nodes.type': 1 });
exports.default = mongoose_1.default.model('Flow', flowSchema);
