# WhatsApp API - MVC Architecture

This project has been restructured following the **Model-View-Controller (MVC)** architecture pattern for better maintainability, scalability, and organization.

## 📁 New Project Structure

```
WhatsAPI/
├── server.js                    # Main server file (replaces index.js)
├── index.js                     # Legacy file (can be removed)
├── src/                         # Source code directory
│   ├── config/                  # Configuration files
│   │   ├── database.js          # MongoDB connection
│   │   └── multer.js            # File upload configuration
│   ├── models/                  # Database models (Mongoose schemas)
│   │   ├── User.js              # User model
│   │   ├── WhatsAppInstance.js  # WhatsApp instance model
│   │   ├── Message.js           # Message model
│   │   ├── MessageTemplate.js   # Template model
│   │   ├── BulkCampaign.js      # Campaign model
│   │   └── index.js             # Models index
│   ├── controllers/             # Business logic controllers
│   │   ├── authController.js    # Authentication logic
│   │   ├── numbersController.js # WhatsApp numbers management
│   │   ├── messagesController.js# Messaging functionality
│   │   └── ...                  # Other controllers
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # Authentication middleware
│   │   ├── validation.js        # Input validation rules
│   │   └── errorHandler.js      # Error handling middleware
│   ├── routes/                  # Express routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── numbers.js           # Numbers management routes
│   │   ├── messages.js          # Messaging routes
│   │   └── index.js             # Routes index
│   ├── services/                # Business logic services
│   │   ├── WhatsAppManager.js   # WhatsApp client management
│   │   └── SchedulerService.js  # Message scheduling service
│   └── utils/                   # Utility functions
│       └── helpers.js           # Helper functions
├── frontend/                    # Frontend React app (unchanged)
├── models/                      # Legacy models folder (can be removed)
├── package.json                 # Dependencies and scripts
└── README_MVC.md                # This documentation
```

## 🚀 Benefits of MVC Architecture

### ✅ **Separation of Concerns**
- **Models**: Handle data logic and database operations
- **Views**: Frontend React app (unchanged)  
- **Controllers**: Handle HTTP requests and business logic

### ✅ **Improved Maintainability**
- Each component has a specific responsibility
- Easier to locate and fix bugs
- Cleaner, more readable code

### ✅ **Better Scalability**
- Easy to add new features without affecting existing code
- Modular structure allows team collaboration
- Services can be easily extracted to microservices

### ✅ **Enhanced Testability**
- Each layer can be tested independently
- Easier to mock dependencies
- Better unit test coverage

## 📦 Key Components

### **Models** (`src/models/`)
- `User.js`: User authentication and profile data
- `WhatsAppInstance.js`: WhatsApp number instances
- `Message.js`: Message storage and history
- `MessageTemplate.js`: Message templates
- `BulkCampaign.js`: Bulk messaging campaigns

### **Controllers** (`src/controllers/`)
- `authController.js`: Registration, login, JWT handling
- `numbersController.js`: WhatsApp number management
- `messagesController.js`: Send/receive messages, media handling

### **Services** (`src/services/`)
- `WhatsAppManager.js`: WhatsApp client lifecycle management
- `SchedulerService.js`: Scheduled message processing

### **Middleware** (`src/middleware/`)
- `auth.js`: API key verification
- `validation.js`: Input validation rules
- `errorHandler.js`: Centralized error handling

### **Routes** (`src/routes/`)
- `auth.js`: `/api/register`, `/api/login`
- `numbers.js`: `/api/numbers/*`
- `messages.js`: `/api/messages/*`

## 🔄 Migration Guide

### **Before (Old Structure)**
```javascript
// Everything in one file (index.js)
const app = express();
// 3000+ lines of mixed code
```

### **After (MVC Structure)**
```javascript
// server.js - Clean and organized
const authRoutes = require('./src/routes/auth');
const numbersRoutes = require('./src/routes/numbers');
app.use('/api', authRoutes);
app.use('/api/numbers', numbersRoutes);
```

## 🛠 Development Workflow

### **Adding a New Feature**

1. **Model**: Create/modify database schema in `src/models/`
2. **Controller**: Add business logic in `src/controllers/`
3. **Routes**: Define API endpoints in `src/routes/`
4. **Middleware**: Add validation/authentication if needed
5. **Service**: Add complex business logic to `src/services/`

### **Example: Adding Templates Feature**

```bash
# 1. Model already exists: src/models/MessageTemplate.js
# 2. Create controller
touch src/controllers/templatesController.js
# 3. Create routes
touch src/routes/templates.js
# 4. Add to main routes
# Edit src/routes/index.js to include templates routes
```

## 🎯 API Endpoints (Unchanged)

All existing API endpoints work exactly the same:

- `POST /api/register` - User registration
- `POST /api/login` - User login  
- `POST /api/numbers/add` - Add WhatsApp number
- `POST /api/numbers/:id/initialize` - Initialize WhatsApp client
- `POST /api/send-message` - Send text message
- `POST /api/send-media` - Send media message
- And all other existing endpoints...

## 🔧 Configuration

### **Environment Variables** (same as before)
```env
MONGODB_URI=mongodb://localhost:27017/whatsapp-api
JWT_SECRET=your-secret-key
NODE_ENV=production
CHROME_BIN=/usr/bin/google-chrome-stable
PORT=3000
```

### **Starting the Server**
```bash
# Development
npm run dev

# Production
npm start

# Using the new server file
node server.js
```

## 🧪 Testing

The MVC structure makes testing much easier:

```javascript
// Test a controller
const { register } = require('./src/controllers/authController');

// Test a service
const WhatsAppManager = require('./src/services/WhatsAppManager');

// Test middleware
const { verifyApiKey } = require('./src/middleware/auth');
```

## 🚀 Deployment

### **PM2 Configuration** (updated)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whatsapi-mvc',
    script: 'server.js', // Changed from index.js
    // ... rest of config
  }]
};
```

### **Docker** (if using)
```dockerfile
# Update Dockerfile to use server.js
CMD ["node", "server.js"]
```

## 🔄 Gradual Migration

You can migrate gradually:

1. **Phase 1**: Use new `server.js` alongside old `index.js`
2. **Phase 2**: Move remaining features to MVC structure
3. **Phase 3**: Remove old `index.js` and `models/User.js`

## 📝 Next Steps

1. **Complete Migration**: Move remaining features (templates, campaigns, groups, reports)
2. **Add Tests**: Implement unit tests for each layer
3. **Documentation**: Add JSDoc comments
4. **Monitoring**: Add logging and monitoring
5. **Caching**: Add Redis for session management
6. **Rate Limiting**: Enhance rate limiting per user
7. **Database**: Add database connection pooling

## 🤝 Contributing

With the new MVC structure:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow MVC patterns:
   - Add models in `src/models/`
   - Add controllers in `src/controllers/`
   - Add routes in `src/routes/`
4. Add tests for your changes
5. Submit pull request

## 🆘 Support

If you encounter issues with the new structure:

1. Check this documentation
2. Verify all imports are correct
3. Ensure environment variables are set
4. Check logs for specific error messages

The new MVC structure provides a solid foundation for scaling your WhatsApp API platform! 🎉 