const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const { WhatsAppInstance, Message, User } = require('../models');
const { formatPhoneNumber } = require('../utils/helpers');

// Send text message
const sendMessage = async (req, res) => {
  const { instanceId, to, message } = req.body;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    const chatId = formatPhoneNumber(to);
    const sentMessage = await client.sendMessage(chatId, message);
    
    // Store outgoing message in database
    const messageRecord = new Message({
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to: to,
      type: 'text',
      content: {
        text: message
      },
      status: 'sent',
      timestamp: new Date()
    });
    
    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save()
    ]);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      instanceName: instance.instanceName,
      from: instance.phoneNumber,
      to: to,
      message: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
};

// Send media message
const sendMedia = async (req, res) => {
  const { instanceId, to, caption = '' } = req.body;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  if (!req.file) {
    return res.status(400).json({ error: 'No media file provided' });
  }

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    const chatId = formatPhoneNumber(to);
    const media = MessageMedia.fromFilePath(req.file.path);
    
    const sentMessage = await client.sendMessage(chatId, media, { caption });
    
    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' :
                      req.file.mimetype.startsWith('video/') ? 'video' :
                      req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

    // Store outgoing media message in database
    const messageRecord = new Message({
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to: to,
      type: mediaType,
      content: {
        caption: caption,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      },
      status: 'sent',
      timestamp: new Date()
    });
    
    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save()
    ]);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      instanceName: instance.instanceName,
      from: instance.phoneNumber,
      to: to,
      mediaType: req.file.mimetype,
      caption: caption,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Send media error:', error);
    res.status(500).json({
      error: 'Failed to send media',
      details: error.message
    });
  }
};

// Send media from URL
const sendMediaUrl = async (req, res) => {
  const { instanceId, to, mediaUrl, caption = '' } = req.body;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    const chatId = formatPhoneNumber(to);
    const media = await MessageMedia.fromUrl(mediaUrl, {unsafeMime: true});
    
    const sentMessage = await client.sendMessage(chatId, media, { caption });
    
    // Determine media type from URL or mime type
    const mediaType = media.mimetype?.startsWith('image/') ? 'image' :
                      media.mimetype?.startsWith('video/') ? 'video' :
                      media.mimetype?.startsWith('audio/') ? 'audio' : 'document';

    // Store outgoing media URL message in database
    const messageRecord = new Message({
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to: to,
      type: mediaType,
      content: {
        caption: caption,
        mediaUrl: mediaUrl,
        mimeType: media.mimetype
      },
      status: 'sent',
      timestamp: new Date()
    });
    
    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save()
    ]);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      instanceName: instance.instanceName,
      from: instance.phoneNumber,
      to: to,
      mediaUrl: mediaUrl,
      caption: caption,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send media URL error:', error);
    res.status(500).json({
      error: 'Failed to send media from URL',
      details: error.message
    });
  }
};

// Get chat info
const getChatInfo = async (req, res) => {
  const { instanceId, phoneNumber } = req.query;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  if (!instanceId || !phoneNumber) {
    return res.status(400).json({ error: 'instanceId and phoneNumber are required' });
  }

  try {
    const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const chatId = formatPhoneNumber(phoneNumber);
    const contact = await client.getContactById(chatId);
    const chat = await client.getChatById(chatId);
    
    res.json({
      instanceId: instanceId,
      instanceName: instance.instanceName,
      chatId: chatId,
      name: contact.name || contact.pushname || 'Unknown',
      isGroup: chat.isGroup,
      isOnline: contact.isOnline,
      lastSeen: contact.lastSeen
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get chat info',
      details: error.message
    });
  }
};

// Get messages with filters
const getMessages = async (req, res) => {
  const user = req.user;
  const {
    instanceId,
    direction,
    type,
    search,
    from,
    to,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = req.query;

  try {
    // Build query
    const query = { userId: user._id };
    
    if (instanceId) {
      const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
      if (!instance) {
        return res.status(404).json({ error: 'WhatsApp instance not found' });
      }
      query.instanceId = instanceId;
    }
    
    if (direction && direction !== 'all') {
      query.direction = direction;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (from) {
      query.from = new RegExp(from, 'i');
    }
    
    if (to) {
      query.to = new RegExp(to, 'i');
    }
    
    if (search) {
      query.$or = [
        { 'content.text': new RegExp(search, 'i') },
        { 'content.caption': new RegExp(search, 'i') },
        { contactName: new RegExp(search, 'i') }
      ];
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalMessages = await Message.countDocuments(query);
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('templateId', 'name')
      .populate('campaignId', 'name');

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

// Get conversations (grouped by contact)
const getConversations = async (req, res) => {
  const user = req.user;
  const { instanceId, limit = 20 } = req.query;

  try {
    const query = { userId: user._id };
    
    if (instanceId) {
      const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
      if (!instance) {
        return res.status(404).json({ error: 'WhatsApp instance not found' });
      }
      query.instanceId = instanceId;
    }

    const conversations = await Message.aggregate([
      { $match: query },
      {
        $addFields: {
          contact: {
            $cond: [
              { $eq: ['$direction', 'incoming'] },
              '$from',
              '$to'
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            contact: '$contact',
            instanceId: '$instanceId'
          },
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$direction', 'incoming'] },
                  { $ne: ['$status', 'read'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          contact: '$_id.contact',
          instanceId: '$_id.instanceId',
          contactName: '$lastMessage.contactName',
          lastMessage: {
            content: '$lastMessage.content',
            type: '$lastMessage.type',
            direction: '$lastMessage.direction',
            timestamp: '$lastMessage.timestamp'
          },
          messageCount: 1,
          unreadCount: 1
        }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

module.exports = {
  sendMessage,
  sendMedia,
  sendMediaUrl,
  getChatInfo,
  getMessages,
  getConversations
}; 