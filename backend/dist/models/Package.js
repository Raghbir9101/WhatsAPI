"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const packageSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    credits: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    validityDays: {
        type: Number,
        required: true
    },
    features: [{
            type: String,
            required: true
        }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const Package = mongoose_1.default.model('Package', packageSchema);
exports.default = Package;
