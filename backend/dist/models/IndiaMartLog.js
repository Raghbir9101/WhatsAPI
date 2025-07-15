"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const indiaMartLogSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['scheduled_sync', 'manual_sync', 'config_update', 'error_retry']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'error']
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number // in milliseconds
    },
    recordsPulled: {
        type: Number,
        default: 0
    },
    recordsProcessed: {
        type: Number,
        default: 0
    },
    recordsSkipped: {
        type: Number,
        default: 0
    },
    recordsErrors: {
        type: Number,
        default: 0
    },
    error: {
        type: String
    },
    errorCode: {
        type: String
    },
    retryCount: {
        type: Number,
        default: 0
    },
    metadata: {
        crmKey: String,
        userAgent: String,
        requestUrl: String,
        startTimestamp: String,
        endTimestamp: String
    },
    apiResponse: {
        statusCode: Number,
        message: String,
        data: mongoose_1.default.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
// Index for efficient querying
indiaMartLogSchema.index({ userId: 1, createdAt: -1 });
indiaMartLogSchema.index({ action: 1, status: 1 });
indiaMartLogSchema.index({ startTime: -1 });
exports.default = mongoose_1.default.model('IndiaMartLog', indiaMartLogSchema);
