"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowEngine = void 0;
const models_1 = require("../models");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const helpers_1 = require("../utils/helpers");
class FlowEngine {
    constructor(whatsappManager) {
        this.whatsappManager = whatsappManager;
    }
    // Check if incoming message matches any triggers or existing conversation sessions
    checkTriggers(message, instanceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contactNumber = (0, helpers_1.formatPhoneNumber)(message.from);
                // First, check if there's an active conversation session waiting for response
                const activeSession = yield models_1.ConversationSession.findOne({
                    userId,
                    instanceId,
                    contactNumber,
                    isActive: true,
                    isWaitingForResponse: true
                }).populate('flowId');
                if (activeSession) {
                    console.log(`Continuing existing conversation session for flow: ${activeSession.flowId.name}`);
                    yield this.handleSessionResponse(activeSession, message);
                    return; // Don't trigger new flows if we're in an active session
                }
                // Find all active flows for this user and instance
                const flows = yield models_1.Flow.find({
                    userId,
                    instanceId,
                    isActive: true
                });
                for (const flow of flows) {
                    // Check if this flow has trigger nodes that match the message
                    const triggerNodes = flow.nodes.filter(node => node.type === 'trigger');
                    for (const triggerNode of triggerNodes) {
                        if (yield this.checkTriggerCondition(triggerNode, message)) {
                            console.log(`Flow triggered: ${flow.name} by message: ${message.body}`);
                            // Execute the flow
                            yield this.executeFlow(flow, message, instanceId, userId);
                            // Update trigger statistics
                            yield models_1.Flow.findByIdAndUpdate(flow._id, {
                                $inc: { triggerCount: 1 },
                                lastTriggered: new Date()
                            });
                            break; // Only trigger once per message per flow
                        }
                    }
                }
            }
            catch (error) {
                console.error('Error checking triggers:', error);
            }
        });
    }
    // Handle response from user in an existing conversation session
    handleSessionResponse(session, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const flow = session.flowId;
                const userResponse = message.body || '';
                // Update session activity
                session.lastActivityAt = new Date();
                session.responseCount += 1;
                // Create flow context for this session
                const context = {
                    message,
                    instanceId: session.instanceId,
                    userId: session.userId,
                    whatsappManager: this.whatsappManager,
                    variables: Object.assign({}, session.variables)
                };
                // Find current node
                const currentNode = flow.nodes.find(node => node.id === session.currentNodeId);
                if (!currentNode) {
                    console.error(`Current node ${session.currentNodeId} not found in flow`);
                    yield this.endSession(session, 'error');
                    return;
                }
                // Handle response based on expected response type
                let nextNodeId = null;
                let responseValid = false;
                if (((_a = session.expectedResponse) === null || _a === void 0 ? void 0 : _a.type) === 'choice' && ((_c = (_b = session.expectedResponse) === null || _b === void 0 ? void 0 : _b.choices) === null || _c === void 0 ? void 0 : _c.length) > 0) {
                    // Handle multiple choice responses
                    const matchedChoice = session.expectedResponse.choices.find(choice => userResponse.toLowerCase().trim() === choice.value.toLowerCase().trim());
                    if (matchedChoice) {
                        // Find target node from flow edges using the choice value as sourceHandle
                        const targetEdge = flow.edges.find(edge => edge.source === session.currentNodeId &&
                            edge.sourceHandle === matchedChoice.value);
                        nextNodeId = targetEdge ? targetEdge.target : matchedChoice.targetNodeId;
                        responseValid = true;
                        console.log(`User selected choice: ${matchedChoice.label}`);
                        console.log(`Routing to next node: ${nextNodeId}`);
                    }
                }
                else {
                    // Handle other response types (text, any, etc.)
                    responseValid = yield this.validateResponse(userResponse, session.expectedResponse);
                    if (responseValid) {
                        // Store the response as a variable
                        context.variables.lastResponse = userResponse;
                        // Continue to next nodes in flow
                        nextNodeId = yield this.getNextNodeId(currentNode, flow);
                    }
                }
                if (!responseValid) {
                    // Send error message and wait for response again
                    yield this.sendResponseValidationError(session, context);
                    return;
                }
                // Update session variables
                session.variables = context.variables;
                if (nextNodeId) {
                    // Find the next node first to determine how to handle the session
                    const nextNode = flow.nodes.find(node => node.id === nextNodeId);
                    if (nextNode) {
                        // Only set isWaitingForResponse = false if next node is NOT a response node
                        // Response nodes will manage their own waiting state
                        if (nextNode.type !== 'response') {
                            session.isWaitingForResponse = false;
                        }
                        // Move to next node
                        session.currentNodeId = nextNodeId;
                        yield session.save();
                        // Add session to context for flow execution
                        context.session = session;
                        console.log(`Executing next node: ${nextNode.type} - ${((_d = nextNode.data) === null || _d === void 0 ? void 0 : _d.label) || nextNode.id}`);
                        yield this.executeNode(nextNode, flow, context);
                    }
                    else {
                        console.error(`Next node ${nextNodeId} not found in flow`);
                        yield this.endSession(session, 'error');
                    }
                }
                else {
                    // No next node, end session
                    session.isWaitingForResponse = false;
                    yield this.endSession(session, 'completed');
                }
            }
            catch (error) {
                console.error('Error handling session response:', error);
                yield this.endSession(session, 'error');
            }
        });
    }
    // Check if a trigger condition matches the message
    checkTriggerCondition(triggerNode, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const config = triggerNode.data.config;
            const messageText = message.body || '';
            switch (config.triggerType) {
                case 'text_equals':
                    return messageText.toLowerCase() === ((_a = config.text) === null || _a === void 0 ? void 0 : _a.toLowerCase());
                case 'text_contains':
                    return messageText.toLowerCase().includes((_b = config.text) === null || _b === void 0 ? void 0 : _b.toLowerCase());
                case 'text_starts_with':
                    return messageText.toLowerCase().startsWith((_c = config.text) === null || _c === void 0 ? void 0 : _c.toLowerCase());
                case 'text_ends_with':
                    return messageText.toLowerCase().endsWith((_d = config.text) === null || _d === void 0 ? void 0 : _d.toLowerCase());
                case 'text_regex':
                    try {
                        const regex = new RegExp(config.pattern, config.flags || 'i');
                        return regex.test(messageText);
                    }
                    catch (error) {
                        console.error('Invalid regex pattern:', config.pattern);
                        return false;
                    }
                case 'any_message':
                    return true; // Triggers on any message
                case 'media_received':
                    return message.hasMedia && (!config.mediaType || message.type === config.mediaType);
                default:
                    return false;
            }
        });
    }
    // Execute a flow when triggered
    executeFlow(flow, triggerMessage, instanceId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const context = {
                message: triggerMessage,
                instanceId,
                userId,
                whatsappManager: this.whatsappManager,
                variables: {
                    messageText: triggerMessage.body || '',
                    senderNumber: triggerMessage.from,
                    senderName: ((_a = (yield triggerMessage.getContact())) === null || _a === void 0 ? void 0 : _a.name) || ((_b = (yield triggerMessage.getContact())) === null || _b === void 0 ? void 0 : _b.pushname) || 'Unknown',
                    timestamp: new Date().toISOString()
                }
            };
            // Find trigger nodes to start execution
            const triggerNodes = flow.nodes.filter(node => node.type === 'trigger');
            for (const triggerNode of triggerNodes) {
                if (yield this.checkTriggerCondition(triggerNode, triggerMessage)) {
                    yield this.executeNode(triggerNode, flow, context);
                }
            }
        });
    }
    // Execute a specific node in the flow
    executeNode(node, flow, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Executing node: ${node.type} - ${node.data.label}`);
                switch (node.type) {
                    case 'trigger':
                        // Trigger nodes just start the flow, move to next nodes
                        yield this.executeNextNodes(node, flow, context);
                        break;
                    case 'action':
                        yield this.executeAction(node, context);
                        yield this.executeNextNodes(node, flow, context);
                        break;
                    case 'condition':
                        const conditionResult = yield this.evaluateCondition(node, context);
                        yield this.executeConditionalNext(node, flow, context, conditionResult);
                        break;
                    case 'delay':
                        yield this.executeDelay(node, context);
                        yield this.executeNextNodes(node, flow, context);
                        break;
                    case 'response':
                        yield this.executeResponse(node, flow, context);
                        break;
                    default:
                        console.warn(`Unknown node type: ${node.type}`);
                }
            }
            catch (error) {
                console.error(`Error executing node ${node.id}:`, error);
            }
        });
    }
    // Execute action nodes
    executeAction(node, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = node.data.config;
            switch (config.actionType) {
                case 'send_message':
                    yield this.sendMessage(config, context);
                    break;
                case 'send_image':
                    yield this.sendImage(config, context);
                    break;
                case 'send_document':
                    yield this.sendDocument(config, context);
                    break;
                case 'set_variable':
                    context.variables[config.variableName] = this.replaceVariables(config.value, context.variables);
                    break;
                case 'webhook':
                    yield this.callWebhook(config, context);
                    break;
                default:
                    console.warn(`Unknown action type: ${config.actionType}`);
            }
        });
    }
    // Send a text message
    sendMessage(config, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.whatsappManager.getClient(context.userId, context.instanceId);
            if (!client) {
                throw new Error('WhatsApp client not available');
            }
            const messageText = this.replaceVariables(config.message, context.variables);
            const chatId = (0, helpers_1.formatPhoneNumber)(context.message.from);
            yield client.sendMessage(chatId, messageText);
            console.log(`Sent message: ${messageText} to ${chatId}`);
        });
    }
    // Send an image
    sendImage(config, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.whatsappManager.getClient(context.userId, context.instanceId);
            if (!client) {
                throw new Error('WhatsApp client not available');
            }
            const caption = this.replaceVariables(config.caption || '', context.variables);
            const chatId = (0, helpers_1.formatPhoneNumber)(context.message.from);
            if (config.imageUrl) {
                const media = yield whatsapp_web_js_1.MessageMedia.fromUrl(config.imageUrl);
                yield client.sendMessage(chatId, media, { caption });
            }
        });
    }
    // Send a document
    sendDocument(config, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.whatsappManager.getClient(context.userId, context.instanceId);
            if (!client) {
                throw new Error('WhatsApp client not available');
            }
            const chatId = (0, helpers_1.formatPhoneNumber)(context.message.from);
            if (config.documentUrl) {
                const media = yield whatsapp_web_js_1.MessageMedia.fromUrl(config.documentUrl);
                yield client.sendMessage(chatId, media);
            }
        });
    }
    // Call a webhook
    callWebhook(config, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = {
                    message: context.message.body,
                    from: context.message.from,
                    variables: context.variables,
                    timestamp: new Date().toISOString()
                };
                const response = yield fetch(config.webhookUrl, {
                    method: config.method || 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, config.headers),
                    body: JSON.stringify(payload)
                });
                console.log(`Webhook called: ${config.webhookUrl}, Status: ${response.status}`);
            }
            catch (error) {
                console.error('Webhook call failed:', error);
            }
        });
    }
    // Evaluate condition nodes
    evaluateCondition(node, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = node.data.config;
            const variable = context.variables[config.variable];
            switch (config.operator) {
                case 'equals':
                    return variable === config.value;
                case 'not_equals':
                    return variable !== config.value;
                case 'contains':
                    return String(variable).includes(config.value);
                case 'greater_than':
                    return Number(variable) > Number(config.value);
                case 'less_than':
                    return Number(variable) < Number(config.value);
                default:
                    return false;
            }
        });
    }
    // Execute delay
    executeDelay(node, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const config = (_a = node.data) === null || _a === void 0 ? void 0 : _a.config;
            console.log('Delay node config:', config);
            const duration = (config === null || config === void 0 ? void 0 : config.duration) || 1;
            const delayMs = duration * 1000; // Convert seconds to milliseconds
            console.log(`Delaying execution for ${duration} seconds`);
            yield new Promise(resolve => setTimeout(resolve, delayMs));
        });
    }
    // Execute next nodes in the flow
    executeNextNodes(currentNode, flow, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextEdges = flow.edges.filter(edge => edge.source === currentNode.id);
            for (const edge of nextEdges) {
                const nextNode = flow.nodes.find(node => node.id === edge.target);
                if (nextNode) {
                    yield this.executeNode(nextNode, flow, context);
                }
            }
        });
    }
    // Execute conditional next nodes
    executeConditionalNext(currentNode, flow, context, conditionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextEdges = flow.edges.filter(edge => edge.source === currentNode.id &&
                (edge.sourceHandle === (conditionResult ? 'true' : 'false') || !edge.sourceHandle));
            for (const edge of nextEdges) {
                const nextNode = flow.nodes.find(node => node.id === edge.target);
                if (nextNode) {
                    yield this.executeNode(nextNode, flow, context);
                }
            }
        });
    }
    // Replace variables in text with actual values
    replaceVariables(text, variables) {
        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        });
        return result;
    }
    // Execute response node - sends message and waits for user response
    executeResponse(node, flow, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = node.data.config;
            const contactNumber = (0, helpers_1.formatPhoneNumber)(context.message.from);
            // Send the message first
            yield this.sendMessage(config, context);
            // Use existing session if available, otherwise create new one
            let session = context.session;
            if (!session) {
                // No existing session, find or create one
                session = yield models_1.ConversationSession.findOne({
                    userId: context.userId,
                    instanceId: context.instanceId,
                    contactNumber,
                    isActive: true
                });
                if (!session) {
                    session = new models_1.ConversationSession({
                        flowId: flow._id,
                        userId: context.userId,
                        instanceId: context.instanceId,
                        contactNumber,
                        currentNodeId: node.id,
                        variables: context.variables
                    });
                }
            }
            // Update session for this response node
            session.currentNodeId = node.id;
            session.variables = Object.assign(Object.assign({}, session.variables), context.variables);
            session.isWaitingForResponse = true;
            session.expectedResponse = {
                type: config.responseType || 'any',
                choices: config.choices || [],
                validation: config.validation || {},
                timeout: config.timeout || { minutes: 30 }
            };
            session.lastActivityAt = new Date();
            session.messageCount += 1;
            yield session.save();
            console.log(`Session updated for response node: ${node.data.label || node.id}`);
            console.log(`Session waiting for response: ${session.isWaitingForResponse}`);
            console.log(`Expected response type: ${session.expectedResponse.type}`);
        });
    }
    // End a conversation session
    endSession(session, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                session.isActive = false;
                session.isWaitingForResponse = false;
                session.status = status;
                session.completedAt = new Date();
                yield session.save();
                console.log(`Session ended with status: ${status}`);
            }
            catch (error) {
                console.error('Error ending session:', error);
            }
        });
    }
    // Validate user response based on expected response configuration
    validateResponse(response, expectedResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!expectedResponse)
                return true;
            const validation = expectedResponse.validation || {};
            // Check if response is required
            if (validation.required && (!response || response.trim().length === 0)) {
                return false;
            }
            // Check minimum length
            if (validation.minLength && response.length < validation.minLength) {
                return false;
            }
            // Check maximum length
            if (validation.maxLength && response.length > validation.maxLength) {
                return false;
            }
            // Check regex pattern
            if (validation.pattern) {
                try {
                    const regex = new RegExp(validation.pattern);
                    if (!regex.test(response)) {
                        return false;
                    }
                }
                catch (error) {
                    console.error('Invalid regex pattern:', validation.pattern);
                    return false;
                }
            }
            // Additional type-specific validation
            switch (expectedResponse.type) {
                case 'number':
                    return !isNaN(Number(response));
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(response);
                case 'phone':
                    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                    return phoneRegex.test(response.replace(/[\s\-\(\)]/g, ''));
                default:
                    return true;
            }
        });
    }
    // Get next node ID from current node (for non-choice responses)
    getNextNodeId(currentNode, flow) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextEdges = flow.edges.filter(edge => edge.source === currentNode.id);
            if (nextEdges.length > 0) {
                return nextEdges[0].target;
            }
            return null;
        });
    }
    // Send validation error message to user
    sendResponseValidationError(session, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const client = this.whatsappManager.getClient(context.userId, context.instanceId);
                if (!client)
                    return;
                const chatId = (0, helpers_1.formatPhoneNumber)(context.message.from);
                let errorMessage = "Sorry, that's not a valid response. Please try again.";
                // Customize error message based on expected response type
                const expectedResponse = session.expectedResponse;
                if ((expectedResponse === null || expectedResponse === void 0 ? void 0 : expectedResponse.type) === 'choice' && ((_a = expectedResponse === null || expectedResponse === void 0 ? void 0 : expectedResponse.choices) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                    const validChoices = expectedResponse.choices.map(choice => choice.value).join(', ');
                    errorMessage = `Please choose one of the following options: ${validChoices}`;
                }
                else if (expectedResponse === null || expectedResponse === void 0 ? void 0 : expectedResponse.validation) {
                    const validation = expectedResponse.validation;
                    if (validation.minLength) {
                        errorMessage = `Please enter at least ${validation.minLength} characters.`;
                    }
                    else if (validation.pattern) {
                        errorMessage = "Please enter a valid format.";
                    }
                }
                yield client.sendMessage(chatId, errorMessage);
                console.log(`Sent validation error: ${errorMessage}`);
            }
            catch (error) {
                console.error('Error sending validation error:', error);
            }
        });
    }
}
exports.FlowEngine = FlowEngine;
exports.default = FlowEngine;
