# WhatsApp API Platform - API Documentation

## Overview

This WhatsApp API Platform allows you to manage multiple WhatsApp accounts and send messages programmatically. The API is built with Node.js and Express, using MongoDB for data persistence.

**Base URL:** `http://localhost:3000/api`

## Authentication

The API uses API keys for authentication. Include your API key in the `x-api-key` header for all protected endpoints.

```
x-api-key: wa_your_api_key_here
```

## Rate Limiting

- **Rate Limit:** 200 requests per 15 minutes per IP address
- **Message Limit:** 5000 messages per month per user (configurable)

---

## Endpoints

### 1. User Management

#### Register a New User

**POST** `/register`

Creates a new user account and returns an API key.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "company": "Acme Corp" // optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "64f8b2c3d4e5f6a7b8c9d0e1",
  "apiKey": "wa_abc123def456",
  "email": "john@example.com",
  "name": "John Doe",
  "company": "Acme Corp"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "company": "Acme Corp"
  }'
```

---

#### User Login

**POST** `/login`

Authenticates a user and returns a JWT token and API key.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "apiKey": "wa_abc123def456",
  "userId": "64f8b2c3d4e5f6a7b8c9d0e1",
  "email": "john@example.com",
  "name": "John Doe",
  "company": "Acme Corp"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

### 2. WhatsApp Instance Management

#### Add New WhatsApp Instance

**POST** `/numbers/add`

Creates a new WhatsApp instance that can be connected to a phone number.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Request Body:**
```json
{
  "instanceName": "My Work Phone",
  "description": "Used for business communications" // optional
}
```

**Response:**
```json
{
  "message": "WhatsApp number instance created successfully",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "description": "Used for business communications",
  "status": "created"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/numbers/add \
  -H "Content-Type: application/json" \
  -H "x-api-key: wa_your_api_key_here" \
  -d '{
    "instanceName": "My Work Phone",
    "description": "Used for business communications"
  }'
```

---

#### Initialize WhatsApp Instance

**POST** `/numbers/{instanceId}/initialize`

Starts the WhatsApp client for the specified instance. This will generate a QR code that needs to be scanned.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "message": "WhatsApp client initialized",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "status": "qr_ready",
  "instructions": "Please scan the QR code to connect"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/numbers/inst_abc123def456/initialize \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Get QR Code

**GET** `/numbers/{instanceId}/qr`

Retrieves the QR code for scanning with WhatsApp mobile app.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/numbers/inst_abc123def456/qr \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Get All WhatsApp Instances

**GET** `/numbers`

Retrieves all WhatsApp instances for the authenticated user.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "numbers": [
    {
      "instanceId": "inst_abc123def456",
      "instanceName": "My Work Phone",
      "description": "Used for business communications",
      "phoneNumber": "919876543210",
      "isActive": true,
      "status": "ready",
      "messagesSent": 45,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "connectedAt": "2024-01-15T10:35:00.000Z",
      "disconnectedAt": null
    }
  ],
  "totalNumbers": 1
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/numbers \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Get Specific Instance Details

**GET** `/numbers/{instanceId}`

Retrieves details for a specific WhatsApp instance.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "description": "Used for business communications",
  "phoneNumber": "919876543210",
  "isActive": true,
  "status": "ready",
  "messagesSent": 45,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "connectedAt": "2024-01-15T10:35:00.000Z",
  "disconnectedAt": null
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/numbers/inst_abc123def456 \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Disconnect WhatsApp Instance

**POST** `/numbers/{instanceId}/disconnect`

Disconnects the WhatsApp client for the specified instance.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "message": "WhatsApp number disconnected successfully",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/numbers/inst_abc123def456/disconnect \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Delete WhatsApp Instance

**DELETE** `/numbers/{instanceId}`

Permanently deletes a WhatsApp instance.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "message": "WhatsApp number instance deleted successfully",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/numbers/inst_abc123def456 \
  -H "x-api-key: wa_your_api_key_here"
```

---

### 3. Messaging

#### Send Text Message

**POST** `/send-message`

Sends a text message to a WhatsApp number.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Request Body:**
```json
{
  "instanceId": "inst_abc123def456",
  "to": "919876543210",
  "message": "Hello! This is a test message from WhatsApp API."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "true_919876543210@c.us_3EB0C767D0D8B8E4F1A2B3C4D5E6F7A8",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "from": "919876543210",
  "to": "919876543210",
  "message": "Hello! This is a test message from WhatsApp API.",
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: wa_your_api_key_here" \
  -d '{
    "instanceId": "inst_abc123def456",
    "to": "919876543210",
    "message": "Hello! This is a test message from WhatsApp API."
  }'
```

---

#### Send Media Message (File Upload)

**POST** `/send-media`

Sends a media message (image, video, document) by uploading a file.

**Headers:**
```
x-api-key: wa_your_api_key_here
Content-Type: multipart/form-data
```

**Form Data:**
- `instanceId`: The WhatsApp instance ID
- `to`: Recipient phone number
- `caption`: Optional caption for the media
- `media`: The media file (max 10MB)

**Response:**
```json
{
  "success": true,
  "messageId": "true_919876543210@c.us_3EB0C767D0D8B8E4F1A2B3C4D5E6F7A8",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "from": "919876543210",
  "to": "919876543210",
  "mediaType": "image/jpeg",
  "caption": "Check out this image!",
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/send-media \
  -H "x-api-key: wa_your_api_key_here" \
  -F "instanceId=inst_abc123def456" \
  -F "to=919876543210" \
  -F "caption=Check out this image!" \
  -F "media=@/path/to/your/image.jpg"
```

---

#### Send Media Message (URL)

**POST** `/send-media-url`

Sends a media message from a publicly accessible URL.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Request Body:**
```json
{
  "instanceId": "inst_abc123def456",
  "to": "919876543210",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check out this image from URL!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "true_919876543210@c.us_3EB0C767D0D8B8E4F1A2B3C4D5E6F7A8",
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "from": "919876543210",
  "to": "919876543210",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check out this image from URL!",
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/send-media-url \
  -H "Content-Type: application/json" \
  -H "x-api-key: wa_your_api_key_here" \
  -d '{
    "instanceId": "inst_abc123def456",
    "to": "919876543210",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check out this image from URL!"
  }'
```

---

### 4. Utility Endpoints

#### Get Chat Information

**GET** `/chat-info`

Retrieves information about a specific WhatsApp chat/contact.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Query Parameters:**
- `instanceId`: The WhatsApp instance ID
- `phoneNumber`: The phone number to get info for

**Response:**
```json
{
  "instanceId": "inst_abc123def456",
  "instanceName": "My Work Phone",
  "chatId": "919876543210@c.us",
  "name": "John Doe",
  "isGroup": false,
  "isOnline": true,
  "lastSeen": "2024-01-15T10:55:00.000Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/chat-info?instanceId=inst_abc123def456&phoneNumber=919876543210" \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Get User Statistics

**GET** `/stats`

Retrieves usage statistics for the authenticated user.

**Headers:**
```
x-api-key: wa_your_api_key_here
```

**Response:**
```json
{
  "user": {
    "email": "john@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "createdAt": "2024-01-15T09:00:00.000Z"
  },
  "usage": {
    "messagesSent": 45,
    "monthlyLimit": 5000,
    "remainingMessages": 4955
  },
  "numbers": [
    {
      "instanceId": "inst_abc123def456",
      "instanceName": "My Work Phone",
      "phoneNumber": "919876543210",
      "status": "ready",
      "messagesSent": 45,
      "isActive": true
    }
  ],
  "totalNumbers": 1,
  "activeNumbers": 1
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/stats \
  -H "x-api-key: wa_your_api_key_here"
```

---

#### Health Check

**GET** `/health`

Checks the health status of the API and database.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "totalUsers": 25,
  "totalNumbers": 45,
  "activeClients": 12
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/health
```

---

## Phone Number Format

Phone numbers should be in international format without the '+' sign:
- ✅ Correct: `919876543210` (India)
- ✅ Correct: `14155552671` (US)
- ❌ Incorrect: `+919876543210`
- ❌ Incorrect: `9876543210` (missing country code)

## Instance Status Values

- `created`: Instance created but not initialized
- `initializing`: Client is starting up
- `qr_ready`: QR code is ready for scanning
- `authenticated`: Phone has been linked successfully
- `ready`: Instance is ready to send/receive messages
- `disconnected`: Instance has been disconnected
- `auth_failed`: Authentication failed

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors, missing parameters)
- `401`: Unauthorized (invalid or missing API key)
- `404`: Not Found (instance or resource not found)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error (server-side error)

## SDKs and Examples

### Python Example

```python
import requests
import json

API_BASE = "http://localhost:3000/api"
API_KEY = "wa_your_api_key_here"

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

# Send a text message
def send_message(instance_id, to, message):
    url = f"{API_BASE}/send-message"
    data = {
        "instanceId": instance_id,
        "to": to,
        "message": message
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Example usage
result = send_message("inst_abc123def456", "919876543210", "Hello from Python!")
print(result)
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const API_KEY = 'wa_your_api_key_here';

const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
};

// Send a text message
async function sendMessage(instanceId, to, message) {
    try {
        const response = await axios.post(`${API_BASE}/send-message`, {
            instanceId,
            to,
            message
        }, { headers });
        
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response.data);
        throw error;
    }
}

// Example usage
sendMessage('inst_abc123def456', '919876543210', 'Hello from Node.js!')
    .then(result => console.log(result))
    .catch(error => console.error(error));
```

### PHP Example

```php
<?php
$apiBase = 'http://localhost:3000/api';
$apiKey = 'wa_your_api_key_here';

function sendMessage($instanceId, $to, $message) {
    global $apiBase, $apiKey;
    
    $url = $apiBase . '/send-message';
    $data = json_encode([
        'instanceId' => $instanceId,
        'to' => $to,
        'message' => $message
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Example usage
$result = sendMessage('inst_abc123def456', '919876543210', 'Hello from PHP!');
print_r($result);
?>
```

## Support

For support and questions, please refer to the application logs or contact the development team.

---

**Last Updated:** January 2024
**API Version:** 1.0.0 