const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const mongoose = require('mongoose');
const { User, WhatsAppInstance, Message, MessageTemplate, BulkCampaign } = require('./models/User');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend", "dist")));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mp3|wav|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `csv_${Date.now()}_${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for CSV
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// In-memory storage for active clients and QR codes (these don't need persistence)
const qrCodes = new Map(); // instanceId -> QR code data
const activeClients = new Map(); // instanceId -> client instance

// Generate unique identifiers
const generateApiKey = () => {
  return 'wa_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const generateInstanceId = () => {
  return 'inst_' + uuidv4().replace(/-/g, '');
};

// Phone number formatter
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    return '91' + cleaned + '@c.us';
  }
  return cleaned + '@c.us';
};

// WhatsApp Manager Class
class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.clientStatus = new Map();
    this.qrCodes = new Map();
  }

  async createClient(userId, instanceId, instanceName) {
    const clientId = `${userId}_${instanceId}`;
    
    if (this.clients.has(clientId)) {
      const existingClient = this.clients.get(clientId);
      if (existingClient.pupPage && !existingClient.pupPage.isClosed()) {
        return existingClient;
      }
    }

    // const client = new Client({
    //   authStrategy: new LocalAuth({
    //     clientId: clientId,
    //     dataPath: path.join(os.tmpdir(), 'whatsapp-api-sessions')
    //   }),
    //   puppeteer: {
    //     headless: false // Keep this so we can see what's happening
    //   }
    // });
    const client = new Client();

    await this.setupClientEvents(client, clientId, instanceId, instanceName);
    this.clients.set(clientId, client);
    this.clientStatus.set(clientId, 'initializing');

    try {
      console.log(`[WhatsAppManager] Initializing client for clientId: ${clientId}`);
      console.log(`[WhatsAppManager] Starting client.initialize() call...`);
      
      await client.initialize();
      console.log(`[WhatsAppManager] Client ${clientId} initialized successfully.`);
      return client;
    } catch (error) {
      console.error(`[WhatsAppManager] FAILED to initialize client ${clientId}:`, error);
      this.clients.delete(clientId);
      this.clientStatus.delete(clientId);
      throw error;
    }
  }

  async setupClientEvents(client, clientId, instanceId, instanceName) {
    console.log(`[WhatsAppManager] Setting up event listeners for clientId: ${clientId}`);

    client.on('qr', async (qr) => {
      console.log(`[WhatsAppManager] QR Code event for ${clientId} (${instanceName})`);
      try {
        const qrCodeDataURL = await qrcode.toDataURL(qr);
        this.qrCodes.set(instanceId, {
          qr: qr,
          qrCodeDataURL: qrCodeDataURL,
          timestamp: new Date()
        });
        console.log(`QR code generated for ${instanceName}`);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
      this.clientStatus.set(clientId, 'qr_ready');
    });

    client.on('ready', async () => {
      console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) is ready!`);
      this.clientStatus.set(clientId, 'ready');
      
      // Get phone number info
      try {
        const info = client.info;
        if (info && info.wid) {
          const phoneNumber = info.wid.user;
          // Update instance in database
          await WhatsAppInstance.findOneAndUpdate(
            { instanceId },
            {
              phoneNumber: phoneNumber,
              connectedAt: new Date(),
              isActive: true,
              status: 'ready'
            }
          );
        }
      } catch (error) {
        console.error('Error getting phone number info:', error);
      }
    });

    client.on('authenticated', () => {
      console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) authenticated`);
      this.clientStatus.set(clientId, 'authenticated');
      // Remove QR code after authentication
      this.qrCodes.delete(instanceId);
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhatsAppManager] Client ${clientId} (${instanceName}) disconnected. Reason:`, reason);
      this.clientStatus.set(clientId, 'disconnected');
      
      // Update instance status in database
      try {
        await WhatsAppInstance.findOneAndUpdate(
          { instanceId },
          {
            isActive: false,
            disconnectedAt: new Date(),
            status: 'disconnected'
          }
        );
      } catch (error) {
        console.error('Error updating disconnected status:', error);
      }
    });

    client.on('auth_failure', (msg) => {
      console.error(`[WhatsAppManager] Client ${clientId} (${instanceName}) auth failure:`, msg);
      this.clientStatus.set(clientId, 'auth_failed');
      this.qrCodes.delete(instanceId);
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`[WhatsAppManager] Client ${clientId} loading screen: ${percent}% - ${message}`);
    });

    client.on('change_state', (state) => {
      console.log(`[WhatsAppManager] Client ${clientId} state changed to: ${state}`);
    });

    client.on('error', (error) => {
        console.error(`[WhatsAppManager] Client ${clientId} encountered an error:`, error);
    });

    client.on('message', async (message) => {
      console.log(`Message received on ${instanceName}:`, message.body);
      
      try {
        // Get user ID from instance
        const instance = await WhatsAppInstance.findOne({ instanceId });
        if (!instance) {
          console.error('Instance not found for message storage');
          return;
        }

        // Determine message type and content
        const messageType = message.hasMedia ? 
          (message.type === 'image' ? 'image' : 
           message.type === 'video' ? 'video' : 
           message.type === 'audio' ? 'audio' : 
           message.type === 'document' ? 'document' : 'text') : 'text';

        let content = {
          text: message.body || ''
        };

        // Handle media messages
        if (message.hasMedia) {
          try {
            const media = await message.downloadMedia();
            content.caption = message.body || '';
            content.mimeType = media.mimetype;
            content.fileName = media.filename || 'media_file';
            // Note: In production, you'd want to save media files to storage and store the URL
          } catch (mediaError) {
            console.error('Error downloading media:', mediaError);
          }
        }

        // Get contact info
        const contact = await message.getContact();
        const chat = await message.getChat();

        // Create message record
        const messageRecord = new Message({
          messageId: message.id._serialized,
          instanceId: instanceId,
          userId: instance.userId,
          direction: 'incoming',
          from: message.from,
          to: message.to,
          type: messageType,
          content: content,
          isGroup: chat.isGroup,
          groupId: chat.isGroup ? chat.id._serialized : null,
          contactName: contact.name || contact.pushname || contact.number,
          timestamp: new Date(message.timestamp * 1000),
          status: 'delivered'
        });

        await messageRecord.save();
        console.log(`Incoming message stored for instance ${instanceName}`);
      } catch (error) {
        console.error('Error storing incoming message:', error);
      }
    });
  }

  getClient(userId, instanceId) {
    const clientId = `${userId}_${instanceId}`;
    return this.clients.get(clientId);
  }

  getClientStatus(userId, instanceId) {
    const clientId = `${userId}_${instanceId}`;
    return this.clientStatus.get(clientId) || 'not_initialized';
  }

  getQRCode(instanceId) {
    return this.qrCodes.get(instanceId);
  }

  async destroyClient(userId, instanceId) {
    const clientId = `${userId}_${instanceId}`;
    const client = this.clients.get(clientId);
    
    if (client) {
      await client.destroy();
      this.clients.delete(clientId);
      this.clientStatus.delete(clientId);
      this.qrCodes.delete(instanceId);
    }
  }
}

const whatsappManager = new WhatsAppManager();

// Middleware to verify API key
const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  try {
    const user = await User.findOne({ apiKey, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// User registration
app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('company').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, company } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = generateApiKey();
    
    const user = new User({
      email,
      name,
      company: company || '',
      password: hashedPassword,
      apiKey
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      apiKey: user.apiKey,
      email: user.email,
      name: user.name,
      company: user.company
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email, isActive: true });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      apiKey: user.apiKey,
      userId: user._id,
      email: user.email,
      name: user.name,
      company: user.company
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Add new WhatsApp number
app.post('/api/numbers/add', verifyApiKey, [
  body('instanceName').notEmpty().isLength({ min: 1, max: 50 }),
  body('description').optional().isLength({ max: 200 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceName, description } = req.body;
  const user = req.user;

  try {
    // Check if instance name already exists for this user
    const existingInstance = await WhatsAppInstance.findOne({
      userId: user._id,
      instanceName
    });

    if (existingInstance) {
      return res.status(400).json({ error: 'Instance name already exists' });
    }

    const instanceId = generateInstanceId();
    
    const instance = new WhatsAppInstance({
      instanceId,
      userId: user._id,
      instanceName,
      description: description || ''
    });

    await instance.save();

    res.status(201).json({
      message: 'WhatsApp number instance created successfully',
      instanceId: instance.instanceId,
      instanceName: instance.instanceName,
      description: instance.description,
      status: instance.status
    });
  } catch (error) {
    console.error('Add number error:', error);
    res.status(500).json({ error: 'Failed to create WhatsApp number instance' });
  }
});

// Initialize WhatsApp client for a specific number
app.post('/api/numbers/:instanceId/initialize', verifyApiKey, async (req, res) => {
  const { instanceId } = req.params;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    await whatsappManager.createClient(user._id, instanceId, instance.instanceName);
    const status = whatsappManager.getClientStatus(user._id, instanceId);
    
    // Update status in database
    await WhatsAppInstance.findOneAndUpdate(
      { instanceId },
      { status: status }
    );
    
    res.json({
      message: 'WhatsApp client initialized',
      instanceId,
      instanceName: instance.instanceName,
      status: status,
      instructions: status === 'qr_ready' ? 'Please scan the QR code to connect' : 'Client is initializing...'
    });
  } catch (error) {
    console.error('Initialize error:', error);
    res.status(500).json({ error: 'Failed to initialize WhatsApp client' });
  }
});

// Get QR code for a specific number
app.get('/api/numbers/:instanceId/qr', verifyApiKey, async (req, res) => {
  const { instanceId } = req.params;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const qrData = whatsappManager.getQRCode(instanceId);
    if (!qrData) {
      return res.status(404).json({ error: 'QR code not available. Please initialize the client first.' });
    }

    res.json({
      instanceId,
      instanceName: instance.instanceName,
      qrCode: qrData.qrCodeDataURL,
      timestamp: qrData.timestamp
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to retrieve QR code' });
  }
});

// Get all WhatsApp numbers for a user
app.get('/api/numbers', verifyApiKey, async (req, res) => {
  const user = req.user;
  
  try {
    const instances = await WhatsAppInstance.find({ userId: user._id });
    
    const userNumbers = instances.map(instance => {
      const status = whatsappManager.getClientStatus(user._id, instance.instanceId);
      
      return {
        instanceId: instance.instanceId,
        instanceName: instance.instanceName,
        description: instance.description,
        phoneNumber: instance.phoneNumber,
        isActive: instance.isActive,
        status: status || instance.status,
        messagesSent: instance.messagesSent,
        createdAt: instance.createdAt,
        connectedAt: instance.connectedAt,
        disconnectedAt: instance.disconnectedAt
      };
    });

    res.json({
      numbers: userNumbers,
      totalNumbers: userNumbers.length
    });
  } catch (error) {
    console.error('Get numbers error:', error);
    res.status(500).json({ error: 'Failed to retrieve WhatsApp numbers' });
  }
});

// Get specific number details
app.get('/api/numbers/:instanceId', verifyApiKey, async (req, res) => {
  const { instanceId } = req.params;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    const status = whatsappManager.getClientStatus(user._id, instanceId);
    
    res.json({
      instanceId: instance.instanceId,
      instanceName: instance.instanceName,
      description: instance.description,
      phoneNumber: instance.phoneNumber,
      isActive: instance.isActive,
      status: status || instance.status,
      messagesSent: instance.messagesSent,
      createdAt: instance.createdAt,
      connectedAt: instance.connectedAt,
      disconnectedAt: instance.disconnectedAt
    });
  } catch (error) {
    console.error('Get number details error:', error);
    res.status(500).json({ error: 'Failed to retrieve WhatsApp number details' });
  }
});

// Send text message
app.post('/api/send-message', verifyApiKey, [
  body('instanceId').notEmpty(),
  body('to').notEmpty(),
  body('message').notEmpty().isLength({ max: 4096 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceId, to, message } = req.body;
  const user = req.user;

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
});

// Send media message
app.post('/api/send-media', verifyApiKey, upload.single('media'), [
  body('instanceId').notEmpty(),
  body('to').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceId, to, caption = '' } = req.body;
  const user = req.user;

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
    
    // Clean up uploaded file
    // fs.unlinkSync(req.file.path);
    
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
});

// Send media from URL
app.post('/api/send-media-url', verifyApiKey, [
  body('instanceId').notEmpty(),
  body('to').notEmpty(),
  body('mediaUrl').isURL()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceId, to, mediaUrl, caption = '' } = req.body;
  const user = req.user;

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  const numberData = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
  if (!numberData) {
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

  try {
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
      from: numberData.phoneNumber || instanceId,
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
      instanceName: numberData.instanceName,
      from: numberData.phoneNumber,
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
});

// Get chat info
app.get('/api/chat-info', verifyApiKey, [
  body('instanceId').notEmpty(),
  body('phoneNumber').notEmpty()
], async (req, res) => {
  const { instanceId, phoneNumber } = req.query;
  const user = req.user;

  if (!instanceId || !phoneNumber) {
    return res.status(400).json({ error: 'instanceId and phoneNumber are required' });
  }

  const numberData = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
  if (!numberData) {
    return res.status(404).json({ error: 'WhatsApp number instance not found' });
  }

  const client = whatsappManager.getClient(user._id, instanceId);
  if (!client) {
    return res.status(400).json({ error: 'WhatsApp client not initialized' });
  }

  try {
    const chatId = formatPhoneNumber(phoneNumber);
    const contact = await client.getContactById(chatId);
    const chat = await client.getChatById(chatId);
    
    res.json({
      instanceId: instanceId,
      instanceName: numberData.instanceName,
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
});

// Disconnect WhatsApp number
app.post('/api/numbers/:instanceId/disconnect', verifyApiKey, async (req, res) => {
  const { instanceId } = req.params;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    await whatsappManager.destroyClient(user._id, instanceId);
    
    // Update instance status in database
    await WhatsAppInstance.findOneAndUpdate(
      { instanceId },
      {
        isActive: false,
        disconnectedAt: new Date(),
        status: 'disconnected'
      }
    );
    
    res.json({
      message: 'WhatsApp number disconnected successfully',
      instanceId,
      instanceName: instance.instanceName
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp number' });
  }
});

// Delete WhatsApp number
app.delete('/api/numbers/:instanceId', verifyApiKey, async (req, res) => {
  const { instanceId } = req.params;
  const user = req.user;

  try {
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp number instance not found' });
    }

    // Disconnect client first
    await whatsappManager.destroyClient(user._id, instanceId);
    
    // Remove from database
    await WhatsAppInstance.findOneAndDelete({ instanceId });
    
    res.json({
      message: 'WhatsApp number instance deleted successfully',
      instanceId,
      instanceName: instance.instanceName
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete WhatsApp number instance' });
  }
});

// Get user statistics
app.get('/api/stats', verifyApiKey, async (req, res) => {
  const user = req.user;
  
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
});

// Get messages with filters
app.get('/api/messages', verifyApiKey, async (req, res) => {
  const user = req.user;
  const {
    instanceId,
    direction, // 'incoming', 'outgoing', 'all'
    type, // 'text', 'image', 'video', 'audio', 'document'
    search, // search text in message content
    from, // filter by sender
    to, // filter by recipient
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = req.query;

  try {
    // Build query
    const query = { userId: user._id };
    
    if (instanceId) {
      // Verify user has access to this instance
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
});

// Get message statistics
app.get('/api/messages/stats', verifyApiKey, async (req, res) => {
  const user = req.user;
  const { instanceId, days = 30 } = req.query;

  try {
    const query = { userId: user._id };
    
    if (instanceId) {
      const instance = await WhatsAppInstance.findOne({ instanceId, userId: user._id });
      if (!instance) {
        return res.status(404).json({ error: 'WhatsApp instance not found' });
      }
      query.instanceId = instanceId;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query.timestamp = { $gte: startDate };

    const [
      totalMessages,
      incomingMessages,
      outgoingMessages,
      messagesByType,
      messagesByDay
    ] = await Promise.all([
      Message.countDocuments(query),
      Message.countDocuments({ ...query, direction: 'incoming' }),
      Message.countDocuments({ ...query, direction: 'outgoing' }),
      Message.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 },
            incoming: {
              $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] }
            },
            outgoing: {
              $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      totalMessages,
      incomingMessages,
      outgoingMessages,
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      messagesByDay: messagesByDay.map(day => ({
        date: day._id,
        total: day.count,
        incoming: day.incoming,
        outgoing: day.outgoing
      }))
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve message statistics' });
  }
});

// Get conversations (grouped by contact)
app.get('/api/conversations', verifyApiKey, async (req, res) => {
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
});

// Template Management

// Get all templates for user
app.get('/api/templates', verifyApiKey, async (req, res) => {
  const user = req.user;
  const { category, search, page = 1, limit = 20 } = req.query;

  try {
    const query = { userId: user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalTemplates = await MessageTemplate.countDocuments(query);
    
    const templates = await MessageTemplate.find(query)
      .sort({ usageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTemplates,
        pages: Math.ceil(totalTemplates / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
});

// Create new template
app.post('/api/templates', verifyApiKey, [
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('content').notEmpty().isLength({ min: 1, max: 4096 }),
  body('description').optional().isLength({ max: 500 }),
  body('category').optional().isLength({ max: 50 }),
  body('variables').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, content, description, category, variables } = req.body;
  const user = req.user;

  try {
    // Check if template name already exists for this user
    const existingTemplate = await MessageTemplate.findOne({
      userId: user._id,
      name
    });

    if (existingTemplate) {
      return res.status(400).json({ error: 'Template name already exists' });
    }

    // Extract variables from content if not provided
    let templateVariables = variables || [];
    if (!variables) {
      const variableMatches = content.match(/\{\{(\w+)\}\}/g);
      if (variableMatches) {
        templateVariables = variableMatches.map(match => ({
          name: match.replace(/\{\{|\}\}/g, ''),
          defaultValue: '',
          required: true
        }));
      }
    }

    const template = new MessageTemplate({
      userId: user._id,
      name,
      content,
      description: description || '',
      category: category || 'general',
      variables: templateVariables
    });

    await template.save();

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
app.put('/api/templates/:templateId', verifyApiKey, [
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('content').optional().isLength({ min: 1, max: 4096 }),
  body('description').optional().isLength({ max: 500 }),
  body('category').optional().isLength({ max: 50 }),
  body('variables').optional().isArray()
], async (req, res) => {
  const { templateId } = req.params;
  const user = req.user;

  try {
    const template = await MessageTemplate.findOne({
      _id: templateId,
      userId: user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updates = req.body;
    
    // If content is updated, re-extract variables if not provided
    if (updates.content && !updates.variables) {
      const variableMatches = updates.content.match(/\{\{(\w+)\}\}/g);
      if (variableMatches) {
        updates.variables = variableMatches.map(match => ({
          name: match.replace(/\{\{|\}\}/g, ''),
          defaultValue: '',
          required: true
        }));
      }
    }

    updates.updatedAt = new Date();

    const updatedTemplate = await MessageTemplate.findByIdAndUpdate(
      templateId,
      updates,
      { new: true }
    );

    res.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
app.delete('/api/templates/:templateId', verifyApiKey, async (req, res) => {
  const { templateId } = req.params;
  const user = req.user;

  try {
    const template = await MessageTemplate.findOneAndDelete({
      _id: templateId,
      userId: user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      message: 'Template deleted successfully',
      templateName: template.name
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Send message using template
app.post('/api/send-template', verifyApiKey, [
  body('instanceId').notEmpty(),
  body('to').notEmpty(),
  body('templateId').notEmpty(),
  body('variables').optional().isObject()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceId, to, templateId, variables = {} } = req.body;
  const user = req.user;

  if (user.messagesSent >= user.monthlyLimit) {
    return res.status(429).json({ error: 'Monthly message limit exceeded' });
  }

  try {
    // Get template
    const template = await MessageTemplate.findOne({
      _id: templateId,
      userId: user._id,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get instance
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    // Check client status
    const client = whatsappManager.getClient(user._id, instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const clientStatus = whatsappManager.getClientStatus(user._id, instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    // Process template with variables
    let processedMessage = template.content;
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
    });

    // Send message
    const chatId = formatPhoneNumber(to);
    const sentMessage = await client.sendMessage(chatId, processedMessage);

    // Store message with template reference
    const messageRecord = new Message({
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      userId: user._id,
      direction: 'outgoing',
      from: instance.phoneNumber || instanceId,
      to: to,
      type: 'text',
      content: {
        text: processedMessage
      },
      templateId: template._id,
      status: 'sent',
      timestamp: new Date()
    });

    // Update counters and save message
    await Promise.all([
      User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } }),
      WhatsAppInstance.findOneAndUpdate({ instanceId }, { $inc: { messagesSent: 1 } }),
      MessageTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } }),
      messageRecord.save()
    ]);

    res.json({
      success: true,
      messageId: sentMessage.id._serialized,
      instanceId: instanceId,
      templateId: template._id,
      templateName: template.name,
      processedMessage: processedMessage,
      to: to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send template message error:', error);
    res.status(500).json({ error: 'Failed to send template message' });
  }
});

// Bulk Messaging

// Get all campaigns for user
app.get('/api/campaigns', verifyApiKey, async (req, res) => {
  const user = req.user;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const query = { userId: user._id };
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCampaigns = await BulkCampaign.countDocuments(query);
    
    const campaigns = await BulkCampaign.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('templateId', 'name');

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCampaigns,
        pages: Math.ceil(totalCampaigns / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaigns' });
  }
});

// Create bulk campaign from CSV
app.post('/api/campaigns/csv', verifyApiKey, csvUpload.single('csvFile'), [
  body('instanceId').notEmpty(),
  body('name').notEmpty().isLength({ min: 1, max: 100 }),
  body('message').optional().isLength({ min: 1, max: 4096 }),
  body('templateId').optional(),
  body('description').optional().isLength({ max: 500 }),
  body('delayBetweenMessages').optional().isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { instanceId, name, message, templateId, description, delayBetweenMessages } = req.body;
  const user = req.user;

  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  try {
    // Verify instance access
    const instance = await WhatsAppInstance.findOne({
      instanceId,
      userId: user._id
    });

    if (!instance) {
      return res.status(404).json({ error: 'WhatsApp instance not found' });
    }

    // Parse CSV file
    const recipients = [];
    const csvFilePath = req.file.path;

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Expected CSV columns: phoneNumber, name, and any variable columns
          const phoneNumber = row.phoneNumber || row.phone || row.number;
          if (phoneNumber) {
            const recipient = {
              phoneNumber: phoneNumber.toString(),
              name: row.name || '',
              variables: {}
            };

            // Extract variables (any column that's not phoneNumber or name)
            Object.keys(row).forEach(key => {
              if (!['phoneNumber', 'phone', 'number', 'name'].includes(key)) {
                recipient.variables[key] = row[key];
              }
            });

            recipients.push(recipient);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (recipients.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(csvFilePath);
      return res.status(400).json({ error: 'No valid recipients found in CSV file' });
    }

    // Verify template if provided
    let template = null;
    if (templateId) {
      template = await MessageTemplate.findOne({
        _id: templateId,
        userId: user._id,
        isActive: true
      });

      if (!template) {
        fs.unlinkSync(csvFilePath);
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    // Create campaign
    const campaign = new BulkCampaign({
      userId: user._id,
      instanceId,
      name,
      description: description || '',
      templateId: templateId || null,
      message: message || (template ? template.content : ''),
      recipients,
      totalRecipients: recipients.length,
      settings: {
        delayBetweenMessages: parseInt(delayBetweenMessages) || 1000,
        retryFailedMessages: true,
        maxRetries: 3
      }
    });

    await campaign.save();

    // Clean up uploaded file
    fs.unlinkSync(csvFilePath);

    res.status(201).json({
      message: 'Bulk campaign created successfully',
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        totalRecipients: campaign.totalRecipients,
        status: campaign.status
      }
    });
  } catch (error) {
    console.error('Create bulk campaign error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to create bulk campaign' });
  }
});

// Start bulk campaign
app.post('/api/campaigns/:campaignId/start', verifyApiKey, async (req, res) => {
  const { campaignId } = req.params;
  const user = req.user;

  try {
    const campaign = await BulkCampaign.findOne({
      _id: campaignId,
      userId: user._id,
      status: 'draft'
    }).populate('templateId');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or already started' });
    }

    // Verify client is ready
    const client = whatsappManager.getClient(user._id, campaign.instanceId);
    if (!client) {
      return res.status(400).json({ error: 'WhatsApp client not initialized' });
    }

    const clientStatus = whatsappManager.getClientStatus(user._id, campaign.instanceId);
    if (clientStatus !== 'ready') {
      return res.status(400).json({ error: `WhatsApp client not ready. Status: ${clientStatus}` });
    }

    // Update campaign status
    campaign.status = 'running';
    campaign.startedAt = new Date();
    await campaign.save();

    // Start sending messages (async)
    processBulkCampaign(campaign, user, client);

    res.json({
      message: 'Bulk campaign started successfully',
      campaignId: campaign._id,
      status: campaign.status
    });
  } catch (error) {
    console.error('Start campaign error:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

// Function to process bulk campaign
async function processBulkCampaign(campaign, user, client) {
  try {
    console.log(`Starting bulk campaign: ${campaign.name}`);
    
    for (let i = 0; i < campaign.recipients.length; i++) {
      const recipient = campaign.recipients[i];
      
      if (recipient.status !== 'pending') {
        continue; // Skip already processed recipients
      }

      try {
        // Process message with variables
        let processedMessage = campaign.message;
        
        if (campaign.templateId && campaign.templateId.variables) {
          campaign.templateId.variables.forEach(variable => {
            const value = recipient.variables[variable.name] || variable.defaultValue || '';
            const placeholder = `{{${variable.name}}}`;
            processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
          });
        }

        // Send message
        const chatId = formatPhoneNumber(recipient.phoneNumber);
        const sentMessage = await client.sendMessage(chatId, processedMessage);

        // Update recipient status
        recipient.status = 'sent';
        recipient.messageId = sentMessage.id._serialized;
        recipient.sentAt = new Date();
        
        // Store message record
        const messageRecord = new Message({
          messageId: sentMessage.id._serialized,
          instanceId: campaign.instanceId,
          userId: user._id,
          direction: 'outgoing',
          from: campaign.instanceId, // Will be updated with actual phone number
          to: recipient.phoneNumber,
          type: 'text',
          content: {
            text: processedMessage
          },
          campaignId: campaign._id,
          templateId: campaign.templateId?._id,
          status: 'sent',
          timestamp: new Date()
        });

        await messageRecord.save();

        // Update campaign counters
        campaign.sentCount++;
        await campaign.save();

        // Update user message count
        await User.findByIdAndUpdate(user._id, { $inc: { messagesSent: 1 } });

        console.log(`Message sent to ${recipient.phoneNumber}`);

        // Delay between messages
        if (i < campaign.recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, campaign.settings.delayBetweenMessages));
        }

      } catch (messageError) {
        console.error(`Failed to send message to ${recipient.phoneNumber}:`, messageError);
        
        recipient.status = 'failed';
        recipient.error = messageError.message;
        campaign.failedCount++;
        await campaign.save();
      }
    }

    // Mark campaign as completed
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    console.log(`Bulk campaign completed: ${campaign.name}`);
  } catch (error) {
    console.error('Bulk campaign processing error:', error);
    
    // Mark campaign as failed
    await BulkCampaign.findByIdAndUpdate(campaign._id, {
      status: 'cancelled',
      completedAt: new Date()
    });
  }
}

// Get campaign details
app.get('/api/campaigns/:campaignId', verifyApiKey, async (req, res) => {
  const { campaignId } = req.params;
  const user = req.user;

  try {
    const campaign = await BulkCampaign.findOne({
      _id: campaignId,
      userId: user._id
    }).populate('templateId', 'name');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign details error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign details' });
  }
});

// Pause/Resume campaign
app.post('/api/campaigns/:campaignId/pause', verifyApiKey, async (req, res) => {
  const { campaignId } = req.params;
  const user = req.user;

  try {
    const campaign = await BulkCampaign.findOne({
      _id: campaignId,
      userId: user._id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'running') {
      campaign.status = 'paused';
    } else if (campaign.status === 'paused') {
      campaign.status = 'running';
    } else {
      return res.status(400).json({ error: 'Campaign cannot be paused/resumed in current status' });
    }

    await campaign.save();

    res.json({
      message: `Campaign ${campaign.status === 'paused' ? 'paused' : 'resumed'} successfully`,
      status: campaign.status
    });
  } catch (error) {
    console.error('Pause/resume campaign error:', error);
    res.status(500).json({ error: 'Failed to pause/resume campaign' });
  }
});

// Delete campaign
app.delete('/api/campaigns/:campaignId', verifyApiKey, async (req, res) => {
  const { campaignId } = req.params;
  const user = req.user;

  try {
    const campaign = await BulkCampaign.findOneAndDelete({
      _id: campaignId,
      userId: user._id
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      message: 'Campaign deleted successfully',
      campaignName: campaign.name
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [totalUsers, totalNumbers] = await Promise.all([
      User.countDocuments(),
      WhatsAppInstance.countDocuments()
    ]);
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      totalUsers,
      totalNumbers,
      activeClients: activeClients.size
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
// });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  // Destroy all WhatsApp clients
  for (const [clientId, client] of whatsappManager.clients) {
    try {
      await client.destroy();
      console.log(`Client ${clientId} destroyed`);
    } catch (error) {
      console.error(`Error destroying client ${clientId}:`, error);
    }
  }
  
  process.exit(0);
});

// Create required directories
const dirs = ['sessions', 'uploads', 'public'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.listen(PORT, () => {
  console.log(`Multi-Number WhatsApp API Platform running on port ${PORT}`);
  console.log('Features:');
  console.log('- User registration and authentication');
  console.log('- Multiple WhatsApp numbers per user');
  console.log('- QR code scanning for each number');
  console.log('- Complete WhatsApp messaging API');
});

module.exports = app;


