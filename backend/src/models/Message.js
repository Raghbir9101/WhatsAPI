const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  instanceId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact'],
    default: 'text'
  },
  content: {
    text: String,
    caption: String,
    mediaUrl: String,
    fileName: String,
    mimeType: String,
    fileSize: Number
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupId: String,
  contactName: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed', 'scheduled', 'cancelled'],
    default: 'sent'
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkCampaign',
    default: null
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ from: 1, to: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 