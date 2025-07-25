"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//model to track each api request, it'll be used to track the credit usage of the user
const mongoose_1 = __importDefault(require("mongoose"));
const usageSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creditsUsed: {
        type: Number,
        default: 0
    },
    assignedPackage: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'assignedPackages',
        required: true
    }
}, { timestamps: true });
const Usage = mongoose_1.default.model('usage', usageSchema);
exports.default = Usage;
