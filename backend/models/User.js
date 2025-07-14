const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  messagesSent: {
    type: Number,
    default: 0
  },
  monthlyLimit: {
    type: Number,
    default: 5000
  },
  deviceLimit: {
    type: Number,
    default: 1
  },
  role: {
    type: String,
    default: 'user'
  },
  accountType: {
    type: String,
    default: 'demo',
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const whatsappInstanceSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instanceName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'created',
    enum: ['created', 'initializing', 'qr_ready', 'authenticated', 'ready', 'disconnected', 'auth_failed']
  },
  messagesSent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  connectedAt: {
    type: Date,
    default: null
  },
  disconnectedAt: {
    type: Date,
    default: null
  }
});

// Message storage schema for both incoming and outgoing messages
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

// Message template schema
const messageTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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

// Bulk messaging campaign schema
const bulkCampaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instanceId: {
    type: String,
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
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageTemplate',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  recipients: [{
    phoneNumber: String,
    name: String,
    variables: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
      default: 'pending'
    },
    messageId: String,
    sentAt: Date,
    error: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  settings: {
    delayBetweenMessages: {
      type: Number,
      default: 1000 // milliseconds
    },
    retryFailedMessages: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    }
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
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ from: 1, to: 1, timestamp: -1 });

messageTemplateSchema.index({ userId: 1, name: 1 });
bulkCampaignSchema.index({ userId: 1, status: 1 });

const User = mongoose.model('User', userSchema);
const WhatsAppInstance = mongoose.model('WhatsAppInstance', whatsappInstanceSchema);
const Message = mongoose.model('Message', messageSchema);
const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);
const BulkCampaign = mongoose.model('BulkCampaign', bulkCampaignSchema);

module.exports = { User, WhatsAppInstance, Message, MessageTemplate, BulkCampaign }; 