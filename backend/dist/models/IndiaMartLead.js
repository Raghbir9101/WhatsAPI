"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const indiaMartLeadSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uniqueQueryId: {
        type: String,
        required: true,
        unique: true
    },
    queryTime: {
        type: Date,
        required: true
    },
    queryType: {
        type: String,
        required: true
    },
    queryMessage: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderMobile: {
        type: String,
        required: true
    },
    senderEmail: {
        type: String,
        default: ''
    },
    senderCompany: {
        type: String,
        default: ''
    },
    senderAddress: {
        type: String,
        default: ''
    },
    senderCity: {
        type: String,
        default: ''
    },
    senderState: {
        type: String,
        default: ''
    },
    senderPincode: {
        type: String,
        default: ''
    },
    senderCountryIso: {
        type: String,
        default: ''
    },
    senderMobileAlt: {
        type: String,
        default: ''
    },
    senderEmailAlt: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        default: ''
    },
    productName: {
        type: String,
        default: ''
    },
    callDuration: {
        type: String,
        default: ''
    },
    receiverMobile: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'converted', 'closed'],
        default: 'new'
    },
    notes: {
        type: String,
        default: ''
    },
    followUpDate: {
        type: Date,
        default: null
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
indiaMartLeadSchema.index({ userId: 1, queryTime: -1 });
indiaMartLeadSchema.index({ uniqueQueryId: 1 });
indiaMartLeadSchema.index({ senderMobile: 1 });
indiaMartLeadSchema.index({ status: 1 });
indiaMartLeadSchema.index({ createdAt: -1 });
const IndiaMartLead = mongoose_1.default.model('IndiaMartLead', indiaMartLeadSchema);
exports.default = IndiaMartLead;
