import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  instanceId: { type: String, required: true },
  userId: { type: String, required: true },
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact'], 
    required: true 
  },
  content: {
    text: String,
    caption: String,
    mediaUrl: String,
    fileName: String,
    mimeType: String,
    fileSize: Number
  },
  isGroup: { type: Boolean, default: false },
  groupId: String,
  contactName: String,
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read', 'failed'], 
    default: 'sent' 
  },
  campaignId: String,
  templateId: String,
  source: { 
    type: String, 
    enum: ['api', 'frontend'], 
    default: 'frontend' 
  },
  fileUrl: String,
  fileName: String,
  timestamp: { type: Date, default: Date.now },
}, { 
  timestamps: true 
});

// Add indexes for better query performance
messageSchema.index({ instanceId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ campaignId: 1 });
messageSchema.index({ source: 1 });

export default mongoose.model('Message', messageSchema); 