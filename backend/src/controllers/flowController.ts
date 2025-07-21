import { Request, Response } from 'express';
import { Flow } from '../models';

// Get all flows for a user
export const getFlows = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { instanceId } = req.query;

    const query: any = { userId: user._id };
    if (instanceId) {
      query.instanceId = instanceId;
    }

    const flows = await Flow.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      flows,
      total: flows.length
    });
  } catch (error) {
    console.error('Get flows error:', error);
    res.status(500).json({ error: 'Failed to get flows' });
  }
};

// Get a specific flow
export const getFlow = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const flow = await Flow.findOne({
      _id: id,
      userId: user._id
    }).lean();

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    res.json(flow);
  } catch (error) {
    console.error('Get flow error:', error);
    res.status(500).json({ error: 'Failed to get flow' });
  }
};

// Create a new flow
export const createFlow = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const {
      instanceId,
      name,
      description,
      nodes = [],
      edges = [],
      isActive = true
    } = req.body;

    if (!name || !instanceId) {
      return res.status(400).json({ error: 'Name and instanceId are required' });
    }

    const flow = new Flow({
      userId: user._id,
      instanceId,
      name,
      description,
      nodes,
      edges,
      isActive,
      triggerCount: 0
    });

    await flow.save();

    res.status(201).json(flow);
  } catch (error) {
    console.error('Create flow error:', error);
    res.status(500).json({ error: 'Failed to create flow' });
  }
};

// Update a flow
export const updateFlow = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      name,
      description,
      nodes,
      edges,
      isActive
    } = req.body;

    const flow = await Flow.findOneAndUpdate(
      { _id: id, userId: user._id },
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    res.json(flow);
  } catch (error) {
    console.error('Update flow error:', error);
    res.status(500).json({ error: 'Failed to update flow' });
  }
};

// Delete a flow
export const deleteFlow = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const flow = await Flow.findOneAndDelete({
      _id: id,
      userId: user._id
    });

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    res.json({ message: 'Flow deleted successfully' });
  } catch (error) {
    console.error('Delete flow error:', error);
    res.status(500).json({ error: 'Failed to delete flow' });
  }
};

// Toggle flow active status
export const toggleFlowStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const flow = await Flow.findOne({
      _id: id,
      userId: user._id
    });

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    flow.isActive = !flow.isActive;
    flow.updatedAt = new Date();
    await flow.save();

    res.json({
      message: `Flow ${flow.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: flow.isActive
    });
  } catch (error) {
    console.error('Toggle flow status error:', error);
    res.status(500).json({ error: 'Failed to toggle flow status' });
  }
};

// Get flow statistics
export const getFlowStats = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { instanceId } = req.query;

    const query: any = { userId: user._id };
    if (instanceId) {
      query.instanceId = instanceId;
    }

    const stats = await Flow.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalFlows: { $sum: 1 },
          activeFlows: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalTriggers: { $sum: '$triggerCount' },
          averageNodesPerFlow: { $avg: { $size: '$nodes' } }
        }
      }
    ]);

    const result = stats[0] || {
      totalFlows: 0,
      activeFlows: 0,
      totalTriggers: 0,
      averageNodesPerFlow: 0
    };

    // Get recent activity
    const recentFlows = await Flow.find(query)
      .sort({ lastTriggered: -1 })
      .limit(5)
      .select('name lastTriggered triggerCount')
      .lean();

    res.json({
      ...result,
      recentActivity: recentFlows.filter(flow => flow.lastTriggered)
    });
  } catch (error) {
    console.error('Get flow stats error:', error);
    res.status(500).json({ error: 'Failed to get flow statistics' });
  }
};

// Test a flow manually
export const testFlow = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { testMessage = 'test', fromNumber = '1234567890' } = req.body;

    const flow = await Flow.findOne({
      _id: id,
      userId: user._id
    });

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    // Create a mock message for testing
    const mockMessage = {
      body: testMessage,
      from: fromNumber,
      hasMedia: false,
      type: 'text',
      getContact: async () => ({ name: 'Test User', pushname: 'Test User' })
    };

    // Get the flow engine from the app locals
    const { whatsappManager } = req.app.locals;
    if (whatsappManager && whatsappManager.flowEngine) {
      await whatsappManager.flowEngine.checkTriggers(mockMessage, flow.instanceId, user._id.toString());
      
      res.json({
        message: 'Flow test executed successfully',
        testMessage,
        flowName: flow.name
      });
    } else {
      res.status(500).json({ error: 'Flow engine not available' });
    }
  } catch (error) {
    console.error('Test flow error:', error);
    res.status(500).json({ error: 'Failed to test flow' });
  }
}; 