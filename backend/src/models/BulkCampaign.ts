import mongoose from 'mongoose';

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
bulkCampaignSchema.index({ userId: 1, status: 1 });

const BulkCampaign = mongoose.model('BulkCampaign', bulkCampaignSchema);

export default BulkCampaign; 