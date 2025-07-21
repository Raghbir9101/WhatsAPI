import mongoose from 'mongoose';

// Flow node types
interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'response';
  position: { x: number; y: number };
  data: {
    label: string;
    config: any; // Specific configuration for each node type
  };
}

// Flow edge connections
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

const flowSchema = new mongoose.Schema({
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
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  isActive: { 
    type: Boolean, 
    default: true 
  },
  nodes: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['trigger', 'action', 'condition', 'delay', 'response'],
      required: true 
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    data: {
      label: String,
      config: mongoose.Schema.Types.Mixed // Flexible config for different node types
    }
  }],
  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String
  }],
  triggerCount: { 
    type: Number, 
    default: 0 
  },
  lastTriggered: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// Indexes for performance
flowSchema.index({ userId: 1, instanceId: 1 });
flowSchema.index({ isActive: 1 });
flowSchema.index({ 'nodes.type': 1 });

export default mongoose.model('Flow', flowSchema); 