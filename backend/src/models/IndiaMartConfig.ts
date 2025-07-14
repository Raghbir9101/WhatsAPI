import mongoose from 'mongoose';

const indiaMartConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  crmKey: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fetchInterval: {
    type: Number,
    default: 15 // minutes
  },
  overlapDuration: {
    type: Number,
    default: 5 // minutes
  },
  lastFetchTime: {
    type: Date,
    default: null
  },
  nextFetchTime: {
    type: Date,
    default: null
  },
  totalLeadsFetched: {
    type: Number,
    default: 0
  },
  totalApiCalls: {
    type: Number,
    default: 0
  },
  lastApiCallStatus: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'pending'
  },
  lastApiCallError: {
    type: String,
    default: null
  },
  settings: {
    autoFetch: {
      type: Boolean,
      default: true
    },
    retryFailedCalls: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    notifications: {
      type: Boolean,
      default: true
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
}, { timestamps: true });

// Indexes for better performance
indiaMartConfigSchema.index({ userId: 1 });
indiaMartConfigSchema.index({ isActive: 1 });
indiaMartConfigSchema.index({ nextFetchTime: 1 });

const IndiaMartConfig = mongoose.model('IndiaMartConfig', indiaMartConfigSchema);

export default IndiaMartConfig; 