# API Documentation

Quick reference for using the WhatsApp API

## Authentication

All API endpoints require authentication using an API key in the header:
```
Headers: { "x-api-key": "your-api-key" }
```

## Send Text Message

```
POST /api/send-message
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "message": "Hello from WhatsApp API!"
}
```

## Send Media

### Send Media File (Upload)

```
POST /api/send-media
Headers: { "x-api-key": "your-api-key" }
Content-Type: multipart/form-data
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "media": [FILE],
  "caption": "Check this out!"
}
```

### Send Media from URL

```
POST /api/send-media-url
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check this out!"
}
```

## WhatsApp Numbers Management

### Get Numbers

```
GET /api/numbers
Headers: { "x-api-key": "your-api-key" }
```

### Add New Number

```
POST /api/numbers/add
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceName": "My WhatsApp",
  "description": "Primary business number"
}
```

### Initialize Number

```
POST /api/numbers/{instanceId}/initialize
Headers: { "x-api-key": "your-api-key" }
```

### Get QR Code

```
GET /api/numbers/{instanceId}/qr
Headers: { "x-api-key": "your-api-key" }
```

## Groups & Channels

### Get All Groups

```
GET /api/groups?instanceId=your-instance-id
Headers: { "x-api-key": "your-api-key" }
```

### Get Group Details

```
GET /api/groups/{groupId}?instanceId=your-instance-id
Headers: { "x-api-key": "your-api-key" }
```

### Create New Group

```
POST /api/groups/create
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "name": "My Group",
  "participants": ["919876543210", "919876543211"]
}
```

### Send Message to Group

```
POST /api/groups/send-message
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "groupId": "group-id@g.us",
  "message": "Hello everyone!"
}
```

## Schedule & Campaigns

### Schedule a Message

```
POST /api/schedule/message
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "message": "This is a scheduled message",
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

### Get Scheduled Messages

```
GET /api/schedule/messages?instanceId=your-instance-id&status=scheduled
Headers: { "x-api-key": "your-api-key" }
```

### Cancel Scheduled Message

```
DELETE /api/schedule/messages/{messageId}
Headers: { "x-api-key": "your-api-key" }
```

### Create Bulk Campaign

```
POST /api/campaigns/csv
Headers: { "x-api-key": "your-api-key" }
Content-Type: multipart/form-data
Body: {
  "instanceId": "your-instance-id",
  "name": "Campaign Name",
  "message": "Hello {{name}}, welcome to our service!",
  "csvFile": [CSV_FILE],
  "delayBetweenMessages": 2000
}
```

### Start Campaign

```
POST /api/campaigns/{campaignId}/start
Headers: { "x-api-key": "your-api-key" }
```

### Get Campaigns

```
GET /api/campaigns?status=all&page=1&limit=20
Headers: { "x-api-key": "your-api-key" }
```

### Pause/Resume Campaign

```
POST /api/campaigns/{campaignId}/pause
Headers: { "x-api-key": "your-api-key" }
```

## Templates

### Get Templates

```
GET /api/templates?category=marketing&search=welcome
Headers: { "x-api-key": "your-api-key" }
```

### Create Template

```
POST /api/templates
Headers: { "x-api-key": "your-api-key" }
Body: {
  "name": "Welcome Template",
  "content": "Welcome {{name}}! Your account is ready.",
  "description": "Welcome message for new users",
  "category": "welcome",
  "variables": [
    {
      "name": "name",
      "defaultValue": "User",
      "required": true
    }
  ]
}
```

### Send Template Message

```
POST /api/send-template
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "templateId": "template-id",
  "variables": {
    "name": "John Doe"
  }
}
```

## Reports & Analytics

### Get Analytics Report

```
GET /api/reports/analytics?instanceId=your-instance-id&startDate=2024-01-01&endDate=2024-01-31&granularity=daily
Headers: { "x-api-key": "your-api-key" }
```

### Get Delivery Report

```
GET /api/reports/delivery?instanceId=your-instance-id&campaignId=campaign-id&startDate=2024-01-01
Headers: { "x-api-key": "your-api-key" }
```

### Get Performance Metrics

```
GET /api/reports/performance?instanceId=your-instance-id&days=30
Headers: { "x-api-key": "your-api-key" }
```

## Messages Management

### Get Messages

```
GET /api/messages?instanceId=your-instance-id&direction=all&type=text&page=1&limit=50
Headers: { "x-api-key": "your-api-key" }
```

### Get Message Statistics

```
GET /api/messages/stats?instanceId=your-instance-id&days=30
Headers: { "x-api-key": "your-api-key" }
```

### Get Conversations

```
GET /api/conversations?instanceId=your-instance-id&limit=20
Headers: { "x-api-key": "your-api-key" }
```

## Chat Management

### Get Chat Info

```
GET /api/chat-info?instanceId=your-instance-id&phoneNumber=919876543210
Headers: { "x-api-key": "your-api-key" }
```

## User Management

### Register User

```
POST /api/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Example Company"
}
```

### Login User

```
POST /api/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

### Get User Statistics

```
GET /api/stats
Headers: { "x-api-key": "your-api-key" }
```

## Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Rate Limiting

- 200 requests per 15 minutes per IP
- Message sending respects monthly limits based on user plan
- Bulk operations have additional throttling

## File Upload Limits

- Media files: 10MB maximum
- CSV files: 5MB maximum
- Supported formats: JPEG, PNG, GIF, PDF, DOC, DOCX, MP4, MP3, WAV, WEBP

## CSV Format for Bulk Campaigns

```csv
phoneNumber,name,customField1,customField2
919876543210,John Doe,Value1,Value2
919876543211,Jane Smith,Value3,Value4
```

## Status Codes

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 429: Rate Limited
- 500: Internal Server Error 