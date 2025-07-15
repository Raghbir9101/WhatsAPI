import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  credits: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  validityDays: {
    type: Number,
    required: true
  },
  features: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Package = mongoose.model('Package', packageSchema);

export default Package; 