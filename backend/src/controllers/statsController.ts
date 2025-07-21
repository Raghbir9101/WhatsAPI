import { User, WhatsAppInstance, Message, BulkCampaign } from '../models';

// Get user statistics
const getUserStats = async (req, res) => {
  const user = req.user;
  const { whatsappManager } = req.app.locals;
  
  try {
    const instances = await WhatsAppInstance.find({ userId: user._id });
    
    const numbersStats = instances.map(instance => {
      const status = whatsappManager.getClientStatus(user._id, instance.instanceId);
      
      return {
        instanceId: instance.instanceId,
        instanceName: instance.instanceName,
        phoneNumber: instance.phoneNumber,
        status: status || instance.status,
        messagesSent: instance.messagesSent,
        isActive: instance.isActive
      };
    });

    res.json({
      user: {
        email: user.email,
        name: user.name,
        company: user.company,
        createdAt: user.createdAt
      },
      usage: {
        messagesSent: user.messagesSent,
        monthlyLimit: user.monthlyLimit,
        remainingMessages: user.monthlyLimit - user.messagesSent
      },
      numbers: numbersStats,
      totalNumbers: numbersStats.length,
      activeNumbers: numbersStats.filter(n => n.isActive).length
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
};

// Get message statistics
const getMessageStats = async (req, res) => {
  try {
    const { instanceId, source, days = 30 } = req.query;
    const userId = req.user.id;

    const query: any = { userId };
    if (instanceId) query.instanceId = instanceId;
    if (source) query.source = source;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total message counts
    const totalMessages = await Message.countDocuments(query);
    const incomingMessages = await Message.countDocuments({
      ...query,
      direction: 'incoming'
    });
    const outgoingMessages = await Message.countDocuments({
      ...query,
      direction: 'outgoing'
    });

    // Get messages by source
    const apiMessages = await Message.countDocuments({
      ...query,
      source: 'api'
    });
    const frontendMessages = await Message.countDocuments({
      ...query,
      source: 'frontend'
    });

    // Get messages by type
    const messagesByType = await Message.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    const messagesByTypeObj = {};
    messagesByType.forEach(item => {
      messagesByTypeObj[item.type] = item.count;
    });

    // Get daily stats
    const messagesByDay = await Message.aggregate([
      {
        $match: {
          ...query,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          total: { $sum: 1 },
          incoming: {
            $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
          },
          outgoing: {
            $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          incoming: 1,
          outgoing: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      totalMessages,
      incomingMessages,
      outgoingMessages,
      apiMessages,
      frontendMessages,
      messagesByType: messagesByTypeObj,
      messagesByDay
    });
  } catch (error) {
    console.error('Error getting message stats:', error);
    res.status(500).json({ error: 'Failed to get message stats' });
  }
};

export {
  getUserStats,
  getMessageStats
}; 