# Admin Functionality Setup Guide

This guide explains how to set up and use the admin functionality in the WhatsApp API backend.

## Features Added

### Backend Admin Features
- **Admin Authentication**: JWT-based authentication for admin users
- **Client Management**: View, manage, and update client accounts
- **Package Management**: Create and manage subscription packages
- **Statistics Dashboard**: View system-wide statistics and metrics including real-time WhatsApp instance connectivity
- **Settings Management**: Configure system settings

### Frontend Admin Features
- **Admin Dashboard**: Overview of system statistics and metrics including real-time connected WhatsApp instances
- **Client Management**: Search, filter, and manage client accounts
- **Package Management**: Create, edit, and delete subscription packages
- **Admin Settings**: Configure system settings and preferences

## Setup Instructions

### 1. Database Setup

The system will automatically create the necessary database schema and seed data when you start the server. The following collections will be created:

- `users` - Extended with admin fields (role, packageType, credits, etc.)
- `packages` - Subscription packages with pricing and features

### 2. Admin User Creation

When you first start the server, an admin user will be automatically created:

```
Email: admin@ceoitbox.com
Password: admin123
Role: ADMIN
```

**⚠️ Important**: Change the admin password immediately after first login!

### 3. Starting the Server

```bash
cd backend
npm install
npm run dev
```

The server will:
1. Connect to MongoDB
2. Run the seed script to create default packages and admin user
3. Start the API server on port 3000

### 4. Admin API Endpoints

All admin routes are prefixed with `/api/admin/`:

#### Authentication
- `POST /api/admin/login` - Admin login

#### Client Management
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/clients/:id` - Get specific client
- `PUT /api/admin/clients/:id/status` - Update client status
- `PUT /api/admin/clients/:id/extend` - Extend client validity
- `PUT /api/admin/clients/:id/credits` - Add credits to client

#### Package Management
- `GET /api/admin/packages` - Get all packages
- `POST /api/admin/packages` - Create new package
- `PUT /api/admin/packages/:id` - Update package
- `DELETE /api/admin/packages/:id` - Delete package

#### Statistics
- `GET /api/admin/stats` - Get admin dashboard statistics

#### Settings
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### 5. Frontend Admin Access

The frontend admin panel is accessible at:
```
http://localhost:5173/admin
```

Login with the admin credentials created during setup.

## Default Packages

The system comes with three default packages:

1. **BASIC** - $99/month
   - 5,000 messages
   - 1 WhatsApp number
   - Basic support

2. **PREMIUM** - $199/month
   - 15,000 messages
   - 5 WhatsApp numbers
   - Priority support
   - Analytics

3. **ENTERPRISE** - $499/month
   - 50,000 messages
   - Unlimited WhatsApp numbers
   - 24/7 support
   - Advanced analytics
   - API access

## User Model Updates

The User model has been extended with the following fields:

- `role`: 'USER' | 'ADMIN'
- `packageType`: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
- `creditsTotal`: Total credits allocated
- `creditsUsed`: Credits consumed
- `validityDate`: Subscription expiry date
- `status`: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
- `lastLogin`: Last login timestamp

## WhatsApp Instance Monitoring

The admin dashboard now provides real-time monitoring of WhatsApp instances:

- **Total Instances**: Shows the total number of WhatsApp instances created by all users
- **Connected Instances**: Shows how many instances are currently connected and active
- **Connection Rate**: Displays the percentage of instances that are currently connected
- **Real-time Status**: Uses the WhatsAppManager service to get live connection status

### Instance Statuses:
- `ready` - Fully connected and ready to send messages
- `authenticated` - Successfully authenticated with WhatsApp
- `qr_ready` - Waiting for QR code scan
- `disconnected` - Not connected to WhatsApp
- `auth_failed` - Authentication failed

## Security

- Admin routes are protected with JWT authentication
- Admin tokens expire after 24 hours
- All sensitive operations require admin role verification
- Passwords are hashed using bcrypt

## Manual Seed Script

You can also run the seed script manually:

```bash
cd backend
npx ts-node src/scripts/seed.ts
```

## Environment Variables

Make sure to set the following environment variables:

```env
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/whatsapp-api
```

## Next Steps

1. Change the default admin password
2. Configure system settings through the admin panel
3. Create additional admin users if needed
4. Set up proper production security measures
5. Configure email notifications for admin alerts

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**: Make sure MongoDB is running and accessible
2. **Admin Login Failed**: Check if admin user was created properly during seed
3. **API Errors**: Check server logs for detailed error messages
4. **Frontend Not Loading**: Ensure backend server is running on port 3000

### Checking Admin User:

You can check if the admin user was created by connecting to your MongoDB and querying:

```javascript
db.users.findOne({ role: 'ADMIN' })
```

For support, check the server logs or contact the development team. 