import { Message, User, WhatsAppInstance } from '../models';
import { formatPhoneNumber } from '../utils/helpers';

// Schedule a message
const scheduleMessage = async (req, res) => {
  const { instanceId, to, message, scheduledAt } = req.body;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    // Create scheduled message record
    const messageRecord = new Message({
      messageId: `scheduled_${Date.now()}`,
      instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to,
      type: 'text',
      content: { text: message },
      status: 'scheduled',
      timestamp: scheduledDate
    });

    await messageRecord.save();

    res.json({
      success: true,
      messageId: messageRecord.messageId,
      scheduledAt: scheduledDate,
      message: 'Message scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule message error:', error);
    res.status(500).json({ error: 'Failed to schedule message' });
  }
};

// Get scheduled messages
const getScheduledMessages = async (req, res) => {
  const { instanceId, status = 'all', page = 1, limit = 20 } = req.query;
  const user = req.user;

  try {
    const query = { 
      userId: user._id
    } as any;

    if (instanceId) {
      const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
      if (!instance) {
        return res.status(404).json({ error: 'WhatsApp instance not found' });
      }
      query.instanceId = instanceId;
    }

    // Build query based on status
    if (status === 'all') {
      query.$or = [
        { status: 'scheduled', timestamp: { $gt: new Date() } },
        { status: { $in: ['sent', 'failed', 'cancelled'] }, messageId: { $regex: '^scheduled_' } }
      ];
    } else if (status === 'scheduled') {
      query.status = 'scheduled';
      query.timestamp = { $gt: new Date() };
    } else {
      query.status = status;
      query.messageId = { $regex: '^scheduled_' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalScheduled = await Message.countDocuments(query);
    
    const scheduledMessages = await Message.find(query)
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      scheduledMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalScheduled,
        pages: Math.ceil(totalScheduled / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get scheduled messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve scheduled messages' });
  }
};

// Cancel scheduled message
const cancelScheduledMessage = async (req, res) => {
  const { messageId } = req.params;
  const user = req.user;

  try {
    const message = await Message.findOneAndUpdate(
      { messageId, userId: user._id, status: 'scheduled' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Scheduled message not found' });
    }

    res.json({
      success: true,
      message: 'Scheduled message cancelled successfully',
      messageId
    });
  } catch (error) {
    console.error('Cancel scheduled message error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled message' });
  }
};

export {
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage
}; 