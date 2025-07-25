import { MessageMedia } from 'whatsapp-web.js';
import fs from 'fs';
import { WhatsAppInstance, Message, User, AssignedPackages, Usage } from '../models';
import { formatPhoneNumber } from '../utils/helpers';
import FileUploadController from './uploadController';

// Helper function to find the next available package with credits
const findNextAvailablePackage = async (user) => {
  // Sort assigned packages by lastDate in descending order (most recent first)
  const assignedPackages = await AssignedPackages.find({
    _id: { $in: user.assignedPackages },
    lastDate: { $gte: new Date() }
  }).populate('package').sort({ lastDate: -1 });

  // Find the first package with remaining credits
  for (const assignedPackage of assignedPackages) {
    const creditsUsed = await Usage.countDocuments({
      userId: user._id,
      assignedPackage: assignedPackage._id
    });

    const creditsTotal = (assignedPackage.package as any).credits;
    if (creditsUsed < creditsTotal) {
      return assignedPackage;
    }
  }

  return null; // No packages with available credits
};

// const sendMessageUnified = async (req, res) => {
//   const { instanceId, to, message, mediaUrl, caption = '' } = req.body;
//   const user = req.user;
//   const { whatsappManager } = req.app.locals;

//   // Check monthly limit
//   if (user.messagesSent >= user.monthlyLimit) {
//     return res.status(429).json({ error: 'Monthly message limit exceeded' });
//   }

//   try {
//     // Find WhatsApp instance
//     const instance = await WhatsAppInstance.findOne({
//       instanceId,
//       userId: user._id
//     });

//     if (!instance) {
//       return res.status(404).json({ error: 'WhatsApp number instance not found' });
//     }

//     // Get WhatsApp client
//     const client = whatsappManager.getClient(user._id, instanceId);
//     if (!client) {
//       return res.status(400).json({ error: 'WhatsApp client not initialized' });
//     }

//     // Check client status
//     const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
//     if (clientStatus !== 'ready') {
//       return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
//     }

//     const chatId = formatPhoneNumber(to);
//     let sentMessage;
//     let messageType = 'text';
//     let messageContent = {};
//     let responseData = {};

//     // Determine message type and send accordingly
//     if (req.file) {
//       // File upload - send media from file
//       const media = MessageMedia.fromFilePath(req.file.path);
//       sentMessage = await client.sendMessage(chatId, media, { caption });

//       messageType = req.file.mimetype.startsWith('image/') ? 'image' :
//         req.file.mimetype.startsWith('video/') ? 'video' :
//           req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

//       messageContent = {
//         caption: caption,
//         fileName: req.file.originalname,
//         mimeType: req.file.mimetype,
//         fileSize: req.file.size
//       };

//       responseData = {
//         mediaType: req.file.mimetype,
//         caption: caption,
//         fileName: req.file.originalname
//       };

//     } else if (mediaUrl) {
//       // Media URL - send media from URL
//       const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
//       sentMessage = await client.sendMessage(chatId, media, { caption });

//       messageType = media.mimetype?.startsWith('image/') ? 'image' :
//         media.mimetype?.startsWith('video/') ? 'video' :
//           media.mimetype?.startsWith('audio/') ? 'audio' : 'document';

//       messageContent = {
//         caption: caption,
//         mediaUrl: mediaUrl,
//         mimeType: media.mimetype
//       };

//       responseData = {
//         mediaUrl: mediaUrl,
//         caption: caption,
//         mimeType: media.mimetype
//       };

//     } else if (message) {
//       // Text message
//       sentMessage = await client.sendMessage(chatId, message);
//       messageType = 'text';
//       messageContent = { text: message };
//       responseData = { message: message };

//     } else {
//       return res.status(400).json({
//         error: 'No message content provided. Please provide either message text, file upload, or mediaUrl.'
//       });
//     }

//     // Store message in database
//     const messageRecord = new Message({
//       messageId: sentMessage.id._serialized,
//       instanceId: instanceId,
//       userId: user._id,
//       direction: 'outgoing',
//       from: instance.phoneNumber || instanceId,
//       to: to,
//       type: messageType,
//       content: messageContent,
//       status: 'sent',
//       timestamp: new Date()
//     });

//     // Update message counts and store message record
//     await Promise.all([
//       User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
//       WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
//       messageRecord.save()
//     ]);

//     // Send success response
//     res.json({
//       success: true,
//       messageId: sentMessage.id._serialized,
//       instanceId: instanceId,
//       instanceName: instance.instanceName,
//       from: instance.phoneNumber,
//       to: to,
//       type: messageType,
//       timestamp: new Date().toISOString(),
//       ...responseData
//     });

//   } catch (error) {
//     // Clean up uploaded file on error
//     if (req.file && fs.existsSync(req.file.path)) {
//       fs.unlinkSync(req.file.path);
//     }

//     console.error('Send message error:', error);
//     res.status(500).json({
//       error: 'Failed to send message',
//       details: error.message
//     });
//   }
// };

const sendMessageUnified = async (req, res) => {
  const { instanceId, to, message, mediaUrl, caption = '', base64Data } = req.body;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  // Check monthly limit
  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    // Find the current active package with available credits
    const currentPackage = await findNextAvailablePackage(user);

    if (!currentPackage) {
      return res.status(400).json({ error: 'No active package with available credits' });
    }

    // Find WhatsApp instance
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    // Get WhatsApp client
    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    // Check client status
    const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    const chatId = formatPhoneNumber(to);
    let sentMessage;
    let messageType = 'text';
    let messageContent = {};
    let responseData = {};

    let fileUrl = null;
    let fileName = null;

    // Determine message type and send accordingly
    if (req.file) {
      // File upload - upload to Cloudinary and send media from file
      const base64String = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const base64File = `data:${mimeType};base64,${base64String}`;
      
      // Upload to Cloudinary
      fileUrl = await FileUploadController.uploadFile(base64File, req.file.originalname);
      fileName = req.file.originalname;

      // Create media from buffer since we're using memory storage
      const media = new MessageMedia(mimeType, base64String, fileName);
      sentMessage = await client.sendMessage(chatId, media, { caption });

      messageType = req.file.mimetype.startsWith('image/') ? 'image' :
        req.file.mimetype.startsWith('video/') ? 'video' :
          req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

      messageContent = {
        caption: caption,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        mediaUrl: fileUrl
      };

      responseData = {
        mediaType: req.file.mimetype,
        caption: caption,
        fileName: req.file.originalname,
        fileUrl: fileUrl
      };

    } else if (base64Data) {
      // Base64 data - upload to Cloudinary and send media from base64 (full data URI format)

      // Extract mime type from data URI (e.g., "data:image/png;base64,...")
      const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!dataUriMatch) {
        return res.status(400).json({
          error: 'Invalid base64 data format. Expected data URI format (data:mime/type;base64,data)'
        });
      }

      const mimeType = dataUriMatch[1];
      const base64Content = dataUriMatch[2];

      // Generate random filename based on mime type
      const generateRandomFileName = (mimeType) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = mimeType.split('/')[1] || 'bin';
        return `file_${timestamp}_${randomStr}.${extension}`;
      };

      fileName = generateRandomFileName(mimeType);

      // Upload to Cloudinary
      fileUrl = await FileUploadController.uploadFile(base64Data, fileName);

      const media = new MessageMedia(mimeType, base64Content, fileName);
      sentMessage = await client.sendMessage(chatId, media, { caption });

      messageType = mimeType.startsWith('image/') ? 'image' :
        mimeType.startsWith('video/') ? 'video' :
          mimeType.startsWith('audio/') ? 'audio' : 'document';

      messageContent = {
        caption: caption,
        fileName: fileName,
        mimeType: mimeType,
        mediaUrl: fileUrl,
        isBase64: true
      };

      responseData = {
        mediaType: mimeType,
        caption: caption,
        fileName: fileName,
        fileUrl: fileUrl
      };

    } else if (mediaUrl) {
      // Media URL - send media from URL
      const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
      sentMessage = await client.sendMessage(chatId, media, { caption });

      messageType = media.mimetype?.startsWith('image/') ? 'image' :
        media.mimetype?.startsWith('video/') ? 'video' :
          media.mimetype?.startsWith('audio/') ? 'audio' : 'document';

      // Use the provided URL as fileUrl
      fileUrl = mediaUrl;
      fileName = mediaUrl.split('/').pop() || 'media_file';

      messageContent = {
        caption: caption,
        mediaUrl: mediaUrl,
        mimeType: media.mimetype
      };

      responseData = {
        mediaUrl: mediaUrl,
        caption: caption,
        mimeType: media.mimetype,
        fileUrl: fileUrl
      };

    } else if (message) {
      // Text message
      sentMessage = await client.sendMessage(chatId, message);
      messageType = 'text';
      messageContent = { text: message };
      responseData = { message: message };

    } else {
      return res.status(400).json({
        error: 'No message content provided. Please provide either message text, file upload, mediaUrl, or base64Data (data URI format).'
      });
    }

    // Store message in database
    const messageRecord = new Message({
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to: to,
      type: messageType,
      content: messageContent,
      status: 'sent',
      source: 'api', // Mark messages from sendMessageUnified as API messages
      fileUrl: fileUrl, // Store the file URL for frontend display
      fileName: fileName, // Store the file name
      timestamp: new Date()
    });

    // Calculate credits used (1 credit per message)
    const creditsUsed = 1;

    // Create usage record
    const usageRecord = new Usage({
      userId: user._id,
      creditsUsed: creditsUsed,
      assignedPackage: currentPackage._id
    });

    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { 
        $inc: { 
          messagesSent: 1,
          creditsUsed: creditsUsed 
        } 
      }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save(),
      usageRecord.save()
    ]);

    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      instanceName: instance.instanceName,
      from: instance.phoneNumber,
      to: to,
      type: messageType,
      timestamp: new Date().toISOString(),
      creditsUsed: creditsUsed,
      packageName: (currentPackage.package as any).name,
      ...responseData
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
};
// Send text message
const sendMessage = async (req, res) => {
  const { instanceId, to, message } = req.body;
  const user = req.user;
  const { whatsappManager } = req.app.locals;

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    // Find the current active package with available credits
    const currentPackage = await findNextAvailablePackage(user);

    if (!currentPackage) {
      return res.status(400).json({ error: 'No active package with available credits' });
    }

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
      source: 'frontend', // Mark as frontend message
      timestamp: new Date()
    });

    // Calculate credits used (1 credit per message)
    const creditsUsed = 1;

    // Create usage record
    const usageRecord = new Usage({
      userId: user._id,
      creditsUsed: creditsUsed,
      assignedPackage: currentPackage._id
    });

    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { 
        $inc: { 
          messagesSent: 1,
          creditsUsed: creditsUsed 
        } 
      }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save(),
      usageRecord.save()
    ]);

    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      instanceName: instance.instanceName,
      from: instance.phoneNumber,
      to: to,
      message: message,
      timestamp: new Date().toISOString(),
      creditsUsed: creditsUsed,
      packageName: (currentPackage.package as any).name
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
    // Find the current active package with available credits
    const currentPackage = await findNextAvailablePackage(user);

    if (!currentPackage) {
      return res.status(400).json({ error: 'No active package with available credits' });
    }

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

    // Upload file to Cloudinary for storage
    const base64String = req.file.buffer.toString('base64');
    const base64File = `data:${req.file.mimetype};base64,${base64String}`;
    const cloudinaryUrl = await FileUploadController.uploadFile(base64File, req.file.originalname);

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
      source: 'frontend', // Mark as frontend message
      fileUrl: cloudinaryUrl, // Store the file URL for frontend display
      fileName: req.file.originalname, // Store the file name
      timestamp: new Date()
    });

    // Calculate credits used (1 credit per message)
    const creditsUsed = 1;

    // Create usage record
    const usageRecord = new Usage({
      userId: user._id,
      creditsUsed: creditsUsed,
      assignedPackage: currentPackage._id
    });

    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { 
        $inc: { 
          messagesSent: 1,
          creditsUsed: creditsUsed 
        } 
      }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save(),
      usageRecord.save()
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
      timestamp: new Date().toISOString(),
      creditsUsed: creditsUsed,
      packageName: (currentPackage.package as any).name
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
    // Find the current active package with available credits
    const currentPackage = await findNextAvailablePackage(user);

    if (!currentPackage) {
      return res.status(400).json({ error: 'No active package with available credits' });
    }

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
    const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });

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
      source: 'frontend', // Mark as frontend message
      fileUrl: mediaUrl, // Use the media URL as the file URL for display
      fileName: mediaUrl.split('/').pop() || 'media_file', // Extract filename from URL
      timestamp: new Date()
    });

    // Calculate credits used (1 credit per message)
    const creditsUsed = 1;

    // Create usage record
    const usageRecord = new Usage({
      userId: user._id,
      creditsUsed: creditsUsed,
      assignedPackage: currentPackage._id
    });

    // Update message counts and store message record
    await Promise.all([
      User.findByIdAndUpdate(user._id, { 
        $inc: { 
          messagesSent: 1,
          creditsUsed: creditsUsed 
        } 
      }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      messageRecord.save(),
      usageRecord.save()
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
      timestamp: new Date().toISOString(),
      creditsUsed: creditsUsed,
      packageName: (currentPackage.package as any).name
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
    source,
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
    const query = { userId: user._id } as any;

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

    // Handle search and source filters properly
    const andConditions = [];
    
    if (source && source !== 'all') {
      // Handle case where source field might not exist for older messages
      if (source === 'frontend') {
        andConditions.push({
          $or: [
            { source: 'frontend' },
            { source: { $exists: false } } // Include messages without source field (default to frontend)
          ]
        });
      } else {
        andConditions.push({ source: source });
      }
    }

    if (search) {
      andConditions.push({
        $or: [
          { 'content.text': new RegExp(search, 'i') },
          { 'content.caption': new RegExp(search, 'i') },
          { contactName: new RegExp(search, 'i') }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
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
    const query = { userId: user._id } as any;

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
                {
                  $and: [
                    { $eq: ['$direction', 'incoming'] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
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

export {
  sendMessageUnified,
  sendMessage,
  sendMedia,
  sendMediaUrl,
  getChatInfo,
  getMessages,
  getConversations
}; 