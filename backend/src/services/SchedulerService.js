const { Message, User, WhatsAppInstance } = require('../models');
const { formatPhoneNumber } = require('../utils/helpers');

class SchedulerService {
  constructor(whatsappManager) {
    this.whatsappManager = whatsappManager;
  }

  // Process scheduled messages
  async processScheduledMessages() {
    try {
      console.log('Processing scheduled messages...');
      
      // Find all messages that are scheduled and past their scheduled time
      const overdueMessages = await Message.find({
        status: 'scheduled',
        timestamp: { $lte: new Date() }
      }).populate('userId');

      console.log(`Found ${overdueMessages.length} overdue scheduled messages`);

      for (const message of overdueMessages) {
        await this.processScheduledMessage(message);
      }

      // Schedule future messages
      await this.scheduleFutureMessages();
      
      console.log('Finished processing scheduled messages');
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  async processScheduledMessage(message) {
    try {
      const client = this.whatsappManager.getClient(message.userId._id, message.instanceId);
      if (client && this.whatsappManager.getClientStatus(message.userId._id, message.instanceId) === 'ready') {
        const chatId = formatPhoneNumber(message.to);
        const sentMessage = await client.sendMessage(chatId, message.content.text);
        
        // Update message status
        await Message.findByIdAndUpdate(message._id, {
          messageId: sentMessage.id._serialized,
          status: 'sent',
          timestamp: new Date()
        });

        // Update user and instance message counts
        await Promise.all([
          User.findByIdAndUpdate(message.userId._id, { $inc: { messagesSent: 1 } }),
          WhatsAppInstance.findOneAndUpdate({ instanceId: message.instanceId }, { $inc: { messagesSent: 1 } })
        ]);

        console.log(`Sent overdue scheduled message to ${message.to}`);
      } else {
        console.log(`WhatsApp client not ready for user ${message.userId._id}, instance ${message.instanceId}`);
        // Mark as failed if client is not available
        await Message.findByIdAndUpdate(message._id, {
          status: 'failed'
        });
      }
    } catch (error) {
      console.error(`Error sending overdue message to ${message.to}:`, error);
      await Message.findByIdAndUpdate(message._id, {
        status: 'failed'
      });
    }
  }

  async scheduleFutureMessages() {
    const futureMessages = await Message.find({
      status: 'scheduled',
      timestamp: { $gt: new Date() }
    }).populate('userId');

    console.log(`Found ${futureMessages.length} future scheduled messages`);

    for (const message of futureMessages) {
      const delay = new Date(message.timestamp).getTime() - Date.now();
      if (delay > 0 && delay < 2147483647) { // Max safe setTimeout delay
        setTimeout(async () => {
          await this.processScheduledMessage(message);
        }, delay);
      }
    }
  }

  // Start the scheduler (called on app startup)
  start() {
    // Process scheduled messages on startup
    setTimeout(() => this.processScheduledMessages(), 5000);
    
    // Run every minute to check for scheduled messages
    setInterval(() => this.processScheduledMessages(), 60000);
  }
}

module.exports = SchedulerService; 