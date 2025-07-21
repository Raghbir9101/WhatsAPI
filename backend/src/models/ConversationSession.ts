import mongoose from 'mongoose';

const conversationSessionSchema = new mongoose.Schema({
  // Flow and user identification
  flowId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Flow',
    required: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  instanceId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // Contact information
  contactNumber: { 
    type: String, 
    required: true,
    index: true 
  },
  contactName: String,
  
  // Session state
  currentNodeId: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  isWaitingForResponse: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  
  // Session variables - data that persists through the conversation
  variables: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  
  // Expected response configuration (when waiting for user input)
  expectedResponse: {
    type: {
      type: String,
      enum: ['any', 'choice', 'text', 'number', 'email', 'phone', 'media'],
      default: 'any'
    },
    choices: [{ // For multiple choice responses
      value: String,      // What user needs to type (e.g., "1", "video", "yes")
      label: String,      // Display label (e.g., "Option 1", "Get Video", "Yes, continue")  
      targetNodeId: String // Which node to go to if this choice is selected
    }],
    validation: {
      pattern: String,    // Regex pattern for validation
      minLength: Number,
      maxLength: Number,
      required: { type: Boolean, default: true }
    },
    timeout: {
      minutes: { type: Number, default: 30 }, // Session timeout
      timeoutNodeId: String // Node to execute on timeout
    }
  },
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Metrics
  messageCount: { type: Number, default: 0 },
  responseCount: { type: Number, default: 0 },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'error', 'timeout'],
    default: 'active'
  },
  
  // Error handling
  lastError: String,
  retryCount: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Indexes for performance
conversationSessionSchema.index({ userId: 1, instanceId: 1, contactNumber: 1 });
conversationSessionSchema.index({ isActive: 1, isWaitingForResponse: 1 });
conversationSessionSchema.index({ flowId: 1, status: 1 });
conversationSessionSchema.index({ lastActivityAt: 1 }); // For cleanup of old sessions

// Compound index for finding active sessions waiting for response
conversationSessionSchema.index({ 
  userId: 1, 
  instanceId: 1, 
  contactNumber: 1, 
  isActive: 1, 
  isWaitingForResponse: 1 
});

export default mongoose.model('ConversationSession', conversationSessionSchema); 