const mongoose = require('mongoose');

const indiaMartLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
    data: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
indiaMartLogSchema.index({ userId: 1, createdAt: -1 });
indiaMartLogSchema.index({ action: 1, status: 1 });
indiaMartLogSchema.index({ startTime: -1 });

module.exports = mongoose.model('IndiaMartLog', indiaMartLogSchema); 