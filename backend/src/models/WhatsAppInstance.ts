import mongoose from 'mongoose';

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

const WhatsAppInstance = mongoose.model('WhatsAppInstance', whatsappInstanceSchema);

export default WhatsAppInstance; 