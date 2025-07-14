const mongoose = require('mongoose');

const leadDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leadSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadSource',
    required: true
  },
  sourceName: {
    type: String,
    required: true,
    enum: ['indiamart', 'zoho', 'facebook', 'google', 'justdial', 'tradeindia', 'other']
  },
  uniqueId: {
    type: String,
    required: true
  },
  // Contact Information
  contact: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      required: true
    },
    alternatePhone: {
      type: String,
      default: ''
    },
    alternateEmail: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    designation: {
      type: String,
      default: ''
    }
  },
  // Address Information
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    countryCode: {
      type: String,
      default: ''
    }
  },
  // Lead Details
  leadDetails: {
    queryTime: {
      type: Date,
      required: true
    },
    queryType: {
      type: String,
      default: ''
    },
    querySource: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    productName: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: ''
    },
    budget: {
      type: String,
      default: ''
    },
    quantity: {
      type: String,
      default: ''
    },
    unit: {
      type: String,
      default: ''
    }
  },
  // Lead Management
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost', 'junk'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  // Source-specific raw data (store complete original response)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Communication History
  communicationHistory: [{
    type: {
      type: String,
      enum: ['call', 'email', 'whatsapp', 'sms', 'meeting', 'note']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    content: String,
    duration: String, // for calls
    outcome: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Conversion Details
  conversion: {
    isConverted: {
      type: Boolean,
      default: false
    },
    convertedDate: Date,
    dealValue: Number,
    dealCurrency: {
      type: String,
      default: 'INR'
    },
    conversionNotes: String
  },
  // Timestamps
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
leadDataSchema.index({ userId: 1, createdAt: -1 });
leadDataSchema.index({ leadSourceId: 1 });
leadDataSchema.index({ sourceName: 1 });
leadDataSchema.index({ uniqueId: 1, sourceName: 1 }, { unique: true });
leadDataSchema.index({ status: 1 });
leadDataSchema.index({ 'contact.phone': 1 });
leadDataSchema.index({ 'contact.email': 1 });
leadDataSchema.index({ 'leadDetails.queryTime': -1 });
leadDataSchema.index({ followUpDate: 1 });
leadDataSchema.index({ assignedTo: 1 });

// Virtual for age of lead
leadDataSchema.virtual('leadAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // in days
});

// Method to add communication entry
leadDataSchema.methods.addCommunication = function(communicationData) {
  this.communicationHistory.push(communicationData);
  return this.save();
};

// Method to convert lead
leadDataSchema.methods.convertLead = function(conversionData) {
  this.status = 'converted';
  this.conversion = {
    isConverted: true,
    convertedDate: new Date(),
    ...conversionData
  };
  return this.save();
};

const LeadData = mongoose.model('LeadData', leadDataSchema);

export default LeadData; 