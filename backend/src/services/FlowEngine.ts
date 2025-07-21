import { Flow, Message, ConversationSession } from '../models';
import { MessageMedia } from 'whatsapp-web.js';
import { formatPhoneNumber } from '../utils/helpers';

export interface FlowContext {
  message: any; // Incoming message that triggered the flow
  instanceId: string;
  userId: string;
  whatsappManager: any;
  variables: Record<string, any>; // Variables that can be used throughout the flow
  session?: any; // Optional conversation session for stateful flows
}

export class FlowEngine {
  private whatsappManager: any;

  constructor(whatsappManager: any) {
    this.whatsappManager = whatsappManager;
  }

  // Check if incoming message matches any triggers or existing conversation sessions
  async checkTriggers(message: any, instanceId: string, userId: string): Promise<void> {
    try {
      const contactNumber = formatPhoneNumber(message.from);
      
      // First, check if there's an active conversation session waiting for response
      const activeSession = await ConversationSession.findOne({
        userId,
        instanceId,
        contactNumber,
        isActive: true,
        isWaitingForResponse: true
      }).populate('flowId');

      if (activeSession) {
        console.log(`Continuing existing conversation session for flow: ${(activeSession.flowId as any).name}`);
        await this.handleSessionResponse(activeSession, message);
        return; // Don't trigger new flows if we're in an active session
      }

      // Find all active flows for this user and instance
      const flows = await Flow.find({
        userId,
        instanceId,
        isActive: true
      });

      for (const flow of flows) {
        // Check if this flow has trigger nodes that match the message
        const triggerNodes = flow.nodes.filter(node => node.type === 'trigger');
        
        for (const triggerNode of triggerNodes) {
          if (await this.checkTriggerCondition(triggerNode, message)) {
            console.log(`Flow triggered: ${flow.name} by message: ${message.body}`);
            
            // Execute the flow
            await this.executeFlow(flow, message, instanceId, userId);
            
            // Update trigger statistics
            await Flow.findByIdAndUpdate(flow._id, {
              $inc: { triggerCount: 1 },
              lastTriggered: new Date()
            });
            
            break; // Only trigger once per message per flow
          }
        }
      }
    } catch (error) {
      console.error('Error checking triggers:', error);
    }
  }

  // Handle response from user in an existing conversation session
  async handleSessionResponse(session: any, message: any): Promise<void> {
    try {
      const flow = session.flowId;
      const userResponse = message.body || '';
      
      // Update session activity
      session.lastActivityAt = new Date();
      session.responseCount += 1;
      
      // Create flow context for this session
      const context: FlowContext = {
        message,
        instanceId: session.instanceId,
        userId: session.userId,
        whatsappManager: this.whatsappManager,
        variables: { ...session.variables }
      };

      // Find current node
      const currentNode = flow.nodes.find(node => node.id === session.currentNodeId);
      if (!currentNode) {
        console.error(`Current node ${session.currentNodeId} not found in flow`);
        await this.endSession(session, 'error');
        return;
      }

      // Handle response based on expected response type
      let nextNodeId = null;
      let responseValid = false;

      if (session.expectedResponse?.type === 'choice' && session.expectedResponse?.choices?.length > 0) {
        // Handle multiple choice responses
        const matchedChoice = session.expectedResponse.choices.find(choice => 
          userResponse.toLowerCase().trim() === choice.value.toLowerCase().trim()
        );
        
        if (matchedChoice) {
          nextNodeId = matchedChoice.targetNodeId;
          responseValid = true;
          console.log(`User selected choice: ${matchedChoice.label}`);
          
          // If no targetNodeId is set, try to get the next node automatically
          if (!nextNodeId) {
            nextNodeId = await this.getNextNodeId(currentNode, flow);
            console.log(`No targetNodeId set for choice, using automatic next node: ${nextNodeId}`);
          }
        }
      } else {
        // Handle other response types (text, any, etc.)
        responseValid = await this.validateResponse(userResponse, session.expectedResponse);
        if (responseValid) {
          // Store the response as a variable
          context.variables.lastResponse = userResponse;
          // Continue to next nodes in flow
          nextNodeId = await this.getNextNodeId(currentNode, flow);
        }
      }

      if (!responseValid) {
        // Send error message and wait for response again
        await this.sendResponseValidationError(session, context);
        return;
      }

      // Update session variables
      session.variables = context.variables;
      session.isWaitingForResponse = false;
      
      if (nextNodeId) {
        // Move to next node
        session.currentNodeId = nextNodeId;
        await session.save();
        
        const nextNode = flow.nodes.find(node => node.id === nextNodeId);
        if (nextNode) {
          // Add session to context for flow execution
          context.session = session;
          await this.executeNode(nextNode, flow, context);
        } else {
          console.error(`Next node ${nextNodeId} not found in flow`);
          await this.endSession(session, 'error');
        }
      } else {
        // No next node, end session
        await this.endSession(session, 'completed');
      }

    } catch (error) {
      console.error('Error handling session response:', error);
      await this.endSession(session, 'error');
    }
  }

  // Check if a trigger condition matches the message
  private async checkTriggerCondition(triggerNode: any, message: any): Promise<boolean> {
    const config = triggerNode.data.config;
    const messageText = message.body || '';

    switch (config.triggerType) {
      case 'text_equals':
        return messageText.toLowerCase() === config.text?.toLowerCase();
      
      case 'text_contains':
        return messageText.toLowerCase().includes(config.text?.toLowerCase());
      
      case 'text_starts_with':
        return messageText.toLowerCase().startsWith(config.text?.toLowerCase());
      
      case 'text_ends_with':
        return messageText.toLowerCase().endsWith(config.text?.toLowerCase());
      
      case 'text_regex':
        try {
          const regex = new RegExp(config.pattern, config.flags || 'i');
          return regex.test(messageText);
        } catch (error) {
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
  }

  // Execute a flow when triggered
  private async executeFlow(flow: any, triggerMessage: any, instanceId: string, userId: string): Promise<void> {
    const context: FlowContext = {
      message: triggerMessage,
      instanceId,
      userId,
      whatsappManager: this.whatsappManager,
      variables: {
        messageText: triggerMessage.body || '',
        senderNumber: triggerMessage.from,
        senderName: (await triggerMessage.getContact())?.name || (await triggerMessage.getContact())?.pushname || 'Unknown',
        timestamp: new Date().toISOString()
      }
    };

    // Find trigger nodes to start execution
    const triggerNodes = flow.nodes.filter(node => node.type === 'trigger');
    
    for (const triggerNode of triggerNodes) {
      if (await this.checkTriggerCondition(triggerNode, triggerMessage)) {
        await this.executeNode(triggerNode, flow, context);
      }
    }
  }

  // Execute a specific node in the flow
  private async executeNode(node: any, flow: any, context: FlowContext): Promise<void> {
    try {
      console.log(`Executing node: ${node.type} - ${node.data.label}`);

      switch (node.type) {
        case 'trigger':
          // Trigger nodes just start the flow, move to next nodes
          await this.executeNextNodes(node, flow, context);
          break;

        case 'action':
          await this.executeAction(node, context);
          await this.executeNextNodes(node, flow, context);
          break;

        case 'condition':
          const conditionResult = await this.evaluateCondition(node, context);
          await this.executeConditionalNext(node, flow, context, conditionResult);
          break;

        case 'delay':
          await this.executeDelay(node, context);
          await this.executeNextNodes(node, flow, context);
          break;

        case 'response':
          await this.executeResponse(node, flow, context);
          break;

        default:
          console.warn(`Unknown node type: ${node.type}`);
      }
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
    }
  }

  // Execute action nodes
  private async executeAction(node: any, context: FlowContext): Promise<void> {
    const config = node.data.config;

    switch (config.actionType) {
      case 'send_message':
        await this.sendMessage(config, context);
        break;

      case 'send_image':
        await this.sendImage(config, context);
        break;

      case 'send_document':
        await this.sendDocument(config, context);
        break;

      case 'set_variable':
        context.variables[config.variableName] = this.replaceVariables(config.value, context.variables);
        break;

      case 'webhook':
        await this.callWebhook(config, context);
        break;

      default:
        console.warn(`Unknown action type: ${config.actionType}`);
    }
  }

  // Send a text message
  private async sendMessage(config: any, context: FlowContext): Promise<void> {
    const client = this.whatsappManager.getClient(context.userId, context.instanceId);
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const messageText = this.replaceVariables(config.message, context.variables);
    const chatId = formatPhoneNumber(context.message.from);

    await client.sendMessage(chatId, messageText);
    console.log(`Sent message: ${messageText} to ${chatId}`);
  }

  // Send an image
  private async sendImage(config: any, context: FlowContext): Promise<void> {
    const client = this.whatsappManager.getClient(context.userId, context.instanceId);
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const caption = this.replaceVariables(config.caption || '', context.variables);
    const chatId = formatPhoneNumber(context.message.from);

    if (config.imageUrl) {
      const media = await MessageMedia.fromUrl(config.imageUrl);
      await client.sendMessage(chatId, media, { caption });
    }
  }

  // Send a document
  private async sendDocument(config: any, context: FlowContext): Promise<void> {
    const client = this.whatsappManager.getClient(context.userId, context.instanceId);
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const chatId = formatPhoneNumber(context.message.from);

    if (config.documentUrl) {
      const media = await MessageMedia.fromUrl(config.documentUrl);
      await client.sendMessage(chatId, media);
    }
  }

  // Call a webhook
  private async callWebhook(config: any, context: FlowContext): Promise<void> {
    try {
      const payload = {
        message: context.message.body,
        from: context.message.from,
        variables: context.variables,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(config.webhookUrl, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(payload)
      });

      console.log(`Webhook called: ${config.webhookUrl}, Status: ${response.status}`);
    } catch (error) {
      console.error('Webhook call failed:', error);
    }
  }

  // Evaluate condition nodes
  private async evaluateCondition(node: any, context: FlowContext): Promise<boolean> {
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
  }

  // Execute delay
  private async executeDelay(node: any, context: FlowContext): Promise<void> {
    const config = node.data?.config;
    console.log('Delay node config:', config);
    const duration = config?.duration || 1;
    const delayMs = duration * 1000; // Convert seconds to milliseconds
    
    console.log(`Delaying execution for ${duration} seconds`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Execute next nodes in the flow
  private async executeNextNodes(currentNode: any, flow: any, context: FlowContext): Promise<void> {
    const nextEdges = flow.edges.filter(edge => edge.source === currentNode.id);
    
    for (const edge of nextEdges) {
      const nextNode = flow.nodes.find(node => node.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode, flow, context);
      }
    }
  }

  // Execute conditional next nodes
  private async executeConditionalNext(currentNode: any, flow: any, context: FlowContext, conditionResult: boolean): Promise<void> {
    const nextEdges = flow.edges.filter(edge => 
      edge.source === currentNode.id && 
      (edge.sourceHandle === (conditionResult ? 'true' : 'false') || !edge.sourceHandle)
    );
    
    for (const edge of nextEdges) {
      const nextNode = flow.nodes.find(node => node.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode, flow, context);
      }
    }
  }

  // Replace variables in text with actual values
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    
    return result;
  }

  // Execute response node - sends message and waits for user response
  private async executeResponse(node: any, flow: any, context: FlowContext): Promise<void> {
    const config = node.data.config;
    const contactNumber = formatPhoneNumber(context.message.from);

    // Send the message first
    await this.sendMessage(config, context);

    // Create or update conversation session
    let session = await ConversationSession.findOne({
      userId: context.userId,
      instanceId: context.instanceId,
      contactNumber,
      isActive: true
    });

    if (!session) {
      session = new ConversationSession({
        flowId: flow._id,
        userId: context.userId,
        instanceId: context.instanceId,
        contactNumber,
        currentNodeId: node.id,
        variables: context.variables
      });
    } else {
      session.currentNodeId = node.id;
      session.variables = { ...session.variables, ...context.variables };
    }

    // Set up expected response configuration
    session.isWaitingForResponse = true;
    session.expectedResponse = {
      type: config.responseType || 'any',
      choices: config.choices || [],
      validation: config.validation || {},
      timeout: config.timeout || { minutes: 30 }
    };

    session.lastActivityAt = new Date();
    session.messageCount += 1;
    
    await session.save();
    console.log(`Session created/updated for response node: ${node.data.label}`);
  }

  // End a conversation session
  private async endSession(session: any, status: string): Promise<void> {
    try {
      session.isActive = false;
      session.isWaitingForResponse = false;
      session.status = status;
      session.completedAt = new Date();
      await session.save();
      console.log(`Session ended with status: ${status}`);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  // Validate user response based on expected response configuration
  private async validateResponse(response: string, expectedResponse: any): Promise<boolean> {
    if (!expectedResponse) return true;

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
      } catch (error) {
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
  }

  // Get next node ID from current node (for non-choice responses)
  private async getNextNodeId(currentNode: any, flow: any): Promise<string | null> {
    const nextEdges = flow.edges.filter(edge => edge.source === currentNode.id);
    
    if (nextEdges.length > 0) {
      return nextEdges[0].target;
    }
    
    return null;
  }

  // Send validation error message to user
  private async sendResponseValidationError(session: any, context: FlowContext): Promise<void> {
    try {
      const client = this.whatsappManager.getClient(context.userId, context.instanceId);
      if (!client) return;

      const chatId = formatPhoneNumber(context.message.from);
      let errorMessage = "Sorry, that's not a valid response. Please try again.";

      // Customize error message based on expected response type
      const expectedResponse = session.expectedResponse;
      if (expectedResponse?.type === 'choice' && expectedResponse?.choices?.length > 0) {
        const validChoices = expectedResponse.choices.map(choice => choice.value).join(', ');
        errorMessage = `Please choose one of the following options: ${validChoices}`;
      } else if (expectedResponse?.validation) {
        const validation = expectedResponse.validation;
        if (validation.minLength) {
          errorMessage = `Please enter at least ${validation.minLength} characters.`;
        } else if (validation.pattern) {
          errorMessage = "Please enter a valid format.";
        }
      }

      await client.sendMessage(chatId, errorMessage);
      console.log(`Sent validation error: ${errorMessage}`);
    } catch (error) {
      console.error('Error sending validation error:', error);
    }
  }
}

export default FlowEngine; 