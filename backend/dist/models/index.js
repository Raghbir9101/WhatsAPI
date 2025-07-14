"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkCampaign = exports.MessageTemplate = exports.Message = exports.WhatsAppInstance = exports.User = void 0;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const WhatsAppInstance_1 = __importDefault(require("./WhatsAppInstance"));
exports.WhatsAppInstance = WhatsAppInstance_1.default;
const Message_1 = __importDefault(require("./Message"));
exports.Message = Message_1.default;
const MessageTemplate_1 = __importDefault(require("./MessageTemplate"));
exports.MessageTemplate = MessageTemplate_1.default;
const BulkCampaign_1 = __importDefault(require("./BulkCampaign"));
exports.BulkCampaign = BulkCampaign_1.default;
