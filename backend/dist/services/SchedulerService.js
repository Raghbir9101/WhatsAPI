"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const helpers_1 = require("../utils/helpers");
class SchedulerService {
    constructor(whatsappManager) {
        this.whatsappManager = whatsappManager;
    }
    // Process scheduled messages
    processScheduledMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Processing scheduled messages...');
                // Find all messages that are scheduled and past their scheduled time
                const overdueMessages = yield models_1.Message.find({
                    status: 'scheduled',
                    timestamp: { $lte: new Date() }
                }).populate('userId');
                console.log(`Found ${overdueMessages.length} overdue scheduled messages`);
                for (const message of overdueMessages) {
                    yield this.processScheduledMessage(message);
                }
                // Schedule future messages
                yield this.scheduleFutureMessages();
                console.log('Finished processing scheduled messages');
            }
            catch (error) {
                console.error('Error processing scheduled messages:', error);
            }
        });
    }
    processScheduledMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = this.whatsappManager.getClient(message.userId._id, message.instanceId);
                if (client && this.whatsappManager.getClientStatus(message.userId._id, message.instanceId) === 'ready') {
                    const chatId = (0, helpers_1.formatPhoneNumber)(message.to);
                    const sentMessage = yield client.sendMessage(chatId, message.content.text);
                    // Update message status
                    yield models_1.Message.findByIdAndUpdate(message._id, {
                        messageId: sentMessage.id._serialized,
                        status: 'sent',
                        timestamp: new Date()
                    });
                    // Update user and instance message counts
                    yield Promise.all([
                        models_1.User.findByIdAndUpdate(message.userId._id, { $inc: { messagesSent: 1 } }),
                        models_1.WhatsAppInstance.findOneAndUpdate({ instanceId: message.instanceId }, { $inc: { messagesSent: 1 } })
                    ]);
                    console.log(`Sent overdue scheduled message to ${message.to}`);
                }
                else {
                    console.log(`WhatsApp client not ready for user ${message.userId._id}, instance ${message.instanceId}`);
                    // Mark as failed if client is not available
                    yield models_1.Message.findByIdAndUpdate(message._id, {
                        status: 'failed'
                    });
                }
            }
            catch (error) {
                console.error(`Error sending overdue message to ${message.to}:`, error);
                yield models_1.Message.findByIdAndUpdate(message._id, {
                    status: 'failed'
                });
            }
        });
    }
    scheduleFutureMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            const futureMessages = yield models_1.Message.find({
                status: 'scheduled',
                timestamp: { $gt: new Date() }
            }).populate('userId');
            console.log(`Found ${futureMessages.length} future scheduled messages`);
            for (const message of futureMessages) {
                const delay = new Date(message.timestamp).getTime() - Date.now();
                if (delay > 0 && delay < 2147483647) { // Max safe setTimeout delay
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.processScheduledMessage(message);
                    }), delay);
                }
            }
        });
    }
    // Start the scheduler (called on app startup)
    start() {
        // Process scheduled messages on startup
        setTimeout(() => this.processScheduledMessages(), 5000);
        // Run every minute to check for scheduled messages
        setInterval(() => this.processScheduledMessages(), 60000);
    }
}
exports.default = SchedulerService;
