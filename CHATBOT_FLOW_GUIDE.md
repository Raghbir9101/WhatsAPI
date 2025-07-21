# WhatsApp Chatbot Flow Builder Guide

## Overview
Your WhatsApp chatbot now supports visual conversation flows with multiple-choice branching, input validation, and dynamic response routing. Users can create complex decision trees using a drag-and-drop interface.

## ✅ What's Now Available

### Backend Features:
- **ConversationSession Management**: Tracks user progress through flows
- **Response Node Support**: Sends messages and waits for user responses
- **Multiple-choice Branching**: Route conversations based on user choices
- **Input Validation**: Email, phone, number, text length validation
- **Session Persistence**: Maintains conversation state across messages
- **Timeout Handling**: Automatic session cleanup

### Frontend Features:
- **Visual Flow Builder**: React Flow-based drag-and-drop interface
- **Response Node Configuration**: Easy setup for conversation flows
- **Multiple Choice Editor**: Visual choice configuration with validation
- **Real-time Preview**: See flow structure as you build
- **Flow Management**: Save, load, activate/deactivate flows

## 🎯 Example Use Cases

### 1. Customer Support Flow
```
Trigger: "help" → Response: "How can I help you? Reply:
1. Technical Support
2. Billing Questions  
3. General Inquiry"

User replies "1" → Route to Technical Support flow
User replies "2" → Route to Billing flow
User replies "3" → Route to General Inquiry flow
```

### 2. Product Catalog Flow
```
Trigger: "catalog" → Response: "What are you looking for?
- video (for video catalog)
- image (for image gallery)
- pdf (for PDF brochure)"

User replies "video" → Send video + ask for contact info
User replies "image" → Send image gallery + follow-up questions
User replies "pdf" → Send PDF + capture lead data
```

### 3. Survey/Feedback Flow
```
Trigger: "feedback" → Response: "Rate our service 1-5"
User replies "5" → Response: "Thank you! Would you recommend us?"
User replies "1-4" → Response: "How can we improve? Please explain:"
  → Collect feedback text → Route to customer service
```

## 🔧 How to Create Flows

### Step 1: Access Flow Builder
1. Go to `/flows` page in your WhatsApp API dashboard
2. Select your WhatsApp instance
3. Click "Create New Flow"

### Step 2: Build Your Flow
1. **Add Trigger Node**: Define what message starts the flow
   - Text equals: Exact match (e.g., "start")
   - Text contains: Partial match (e.g., contains "help")
   - Text regex: Pattern matching
   - Any message: Catch-all trigger

2. **Add Response Node**: Send message and wait for user response
   - **Message**: What to send to user
   - **Response Type**: 
     - `Multiple Choice`: User selects from predefined options
     - `Text Input`: Free text with validation
     - `Number`: Numeric input only
     - `Email`: Email validation
     - `Phone`: Phone number validation

3. **Configure Choices** (for Multiple Choice):
   - **User Types**: What user needs to type (e.g., "1", "video")
   - **Display Label**: Description shown in flow (e.g., "Option 1")
   - Each choice creates a separate connection point

4. **Add Action Nodes**: Send responses, images, documents
5. **Add Condition Nodes**: Branch based on variables
6. **Add Delay Nodes**: Pause execution

### Step 3: Connect Nodes
- Drag from node handles to create connections
- Response nodes with choices have multiple output handles
- Each choice routes to different nodes

### Step 4: Test and Deploy
1. Save your flow
2. Activate it 
3. Test by sending trigger message to your WhatsApp number

## 📱 Real-World Example: Media Request Flow

Here's a complete example you can build:

### Flow Structure:
```
[Trigger: "media"] 
    ↓
[Response: "What type of media do you want?
- video (for our demo video)  
- image (for product images)
- brochure (for PDF brochure)"]
    ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ User: video │  │ User: image │  │User:brochure│
└─────────────┘  └─────────────┘  └─────────────┘
    ↓                ↓                ↓
[Send Video]     [Send Images]    [Send PDF]
    ↓                ↓                ↓
[Response: "Did this help? yes/no"]  [Same]  [Same]
    ↓                ↓                ↓
[If yes: Thank you] [If no: Contact support]
```

### Configuration Details:

**Trigger Node:**
- Type: Text Equals
- Text: "media"

**Response Node 1:**
- Message: "What type of media do you want?\n- video (for our demo video)\n- image (for product images)\n- brochure (for PDF brochure)"
- Response Type: Multiple Choice
- Choices:
  - Choice 1: User Types "video", Label "Demo Video"
  - Choice 2: User Types "image", Label "Product Images"  
  - Choice 3: User Types "brochure", Label "PDF Brochure"

**Action Nodes (3 separate):**
- Video Action: Send Video URL
- Image Action: Send Image URL
- PDF Action: Send Document URL

**Response Node 2:**
- Message: "Did this help you? Please reply yes or no"
- Response Type: Multiple Choice
- Choices:
  - Choice 1: User Types "yes", Label "Yes"
  - Choice 2: User Types "no", Label "No"

## 🎨 Advanced Features

### Variable Support
- Store user responses: `{{lastResponse}}`
- Use contact info: `{{senderName}}`, `{{senderNumber}}`
- Custom variables: Set in Action nodes, use in messages

### Input Validation
- **Text**: Min/max length, regex patterns
- **Number**: Numeric validation
- **Email**: Email format validation  
- **Phone**: Phone number validation
- **Custom Regex**: Define your own patterns

### Session Management
- **Automatic Timeout**: Sessions expire after inactivity (default 30 minutes)
- **State Persistence**: User progress saved across messages
- **Error Handling**: Invalid responses trigger retry with helpful messages

### Conditional Logic
- Branch based on variables
- Compare values (equals, contains, greater than, etc.)
- Create complex decision trees

## 🔄 Flow Execution Process

1. **User sends message** → System checks for trigger match
2. **Flow starts** → Creates conversation session
3. **Response node executes** → Sends message, waits for response
4. **User replies** → System validates response and routes to next node
5. **Flow continues** → Until completion or timeout

## 🛠 Technical Implementation

### Backend (Completed ✅)
- `ConversationSession` model tracks user progress
- `FlowEngine` handles message processing and routing
- Response validation and error handling
- Integration with WhatsApp message handling

### Frontend (Completed ✅)
- React Flow visual builder
- Response node configuration UI
- Multiple choice editor
- Flow management interface

## 🚀 Getting Started

1. **Create your first flow**:
   - Go to Flows page
   - Select WhatsApp instance
   - Add Trigger → Response → Action nodes
   - Connect them and save

2. **Test it**:
   - Send trigger message to your WhatsApp number
   - Follow the conversation flow
   - Check session tracking in backend

3. **Iterate and improve**:
   - Monitor flow statistics
   - Update responses based on user feedback
   - Add more complex branching as needed

Your WhatsApp chatbot is now a powerful conversational AI platform! 🎉 