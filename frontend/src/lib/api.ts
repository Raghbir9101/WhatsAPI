let API_BASE_URL = 'http://localhost/api';

if(window.location.href.includes('localhost')) {
  API_BASE_URL = 'http://localhost/api';
} else {
  API_BASE_URL = '/api';
}

export interface User {
  _id: string;
  email: string;
  name: string;
  company: string;
  apiKey: string;
  messagesSent: number;
  monthlyLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface WhatsAppInstance {
  instanceId: string;
  instanceName: string;
  description: string;
  phoneNumber?: string;
  isActive: boolean;
  status: string;
  messagesSent: number;
  createdAt: string;
  connectedAt?: string;
  disconnectedAt?: string;
}

export interface MessageTemplate {
  _id: string;
  userId: string;
  name: string;
  description: string;
  content: string;
  variables: {
    name: string;
    defaultValue: string;
    required: boolean;
  }[];
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  messageId: string;
  instanceId: string;
  userId: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  to: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  content: {
    text?: string;
    caption?: string;
    mediaUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  };
  isGroup: boolean;
  groupId?: string;
  contactName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  campaignId?: string;
  templateId?: string;
  timestamp: string;
  createdAt: string;
}

export interface BulkCampaign {
  _id: string;
  userId: string;
  instanceId: string;
  name: string;
  description: string;
  templateId?: string;
  message: string;
  recipients: {
    phoneNumber: string;
    name: string;
    variables: Record<string, any>;
    status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
    messageId?: string;
    sentAt?: string;
    error?: string;
  }[];
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  settings: {
    delayBetweenMessages: number;
    retryFailedMessages: boolean;
    maxRetries: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

class ApiClient {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = localStorage.getItem('apiKey');
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('apiKey', apiKey);
  }

  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('apiKey');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }) {
    return this.request<{
      message: string;
      userId: string;
      apiKey: string;
      email: string;
      name: string;
      company: string;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      token: string;
      apiKey: string;
      userId: string;
      email: string;
      name: string;
      company: string;
    }>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // WhatsApp number management
  async addNumber(data: { instanceName: string; description?: string }) {
    return this.request<{
      message: string;
      instanceId: string;
      instanceName: string;
      description: string;
      status: string;
    }>('/numbers/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNumbers() {
    return this.request<{
      numbers: WhatsAppInstance[];
      totalNumbers: number;
    }>('/numbers');
  }

  async getNumber(instanceId: string) {
    return this.request<WhatsAppInstance>(`/numbers/${instanceId}`);
  }

  async initializeNumber(instanceId: string) {
    return this.request<{
      message: string;
      instanceId: string;
      instanceName: string;
      status: string;
      instructions: string;
    }>(`/numbers/${instanceId}/initialize`, {
      method: 'POST',
    });
  }

  async getQRCode(instanceId: string) {
    return this.request<{
      instanceId: string;
      instanceName: string;
      qrCode: string;
      timestamp: string;
    }>(`/numbers/${instanceId}/qr`);
  }

  async disconnectNumber(instanceId: string) {
    return this.request<{
      message: string;
      instanceId: string;
      instanceName: string;
    }>(`/numbers/${instanceId}/disconnect`, {
      method: 'POST',
    });
  }

  async deleteNumber(instanceId: string) {
    return this.request<{
      message: string;
      instanceId: string;
      instanceName: string;
    }>(`/numbers/${instanceId}`, {
      method: 'DELETE',
    });
  }

  // Messaging
  async sendMessage(data: {
    instanceId: string;
    to: string;
    message: string;
  }) {
    return this.request<{
      success: boolean;
      messageId: string;
      instanceId: string;
      instanceName: string;
      from: string;
      to: string;
      message: string;
      timestamp: string;
    }>('/send-message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMedia(data: FormData) {
    const headers: HeadersInit = {};
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(`${API_BASE_URL}/send-media`, {
      method: 'POST',
      headers,
      body: data,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || 'Failed to send media');
    }

    return response.json();
  }

  async sendMediaUrl(data: {
    instanceId: string;
    to: string;
    mediaUrl: string;
    caption?: string;
  }) {
    return this.request('/send-media-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Statistics
  async getStats() {
    return this.request<{
      user: {
        email: string;
        name: string;
        company: string;
        createdAt: string;
      };
      usage: {
        messagesSent: number;
        monthlyLimit: number;
        remainingMessages: number;
      };
      numbers: WhatsAppInstance[];
      totalNumbers: number;
      activeNumbers: number;
    }>('/stats');
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
      totalUsers: number;
      totalNumbers: number;
      activeClients: number;
    }>('/health');
  }

  async getChatInfo(instanceId: string, phoneNumber: string) {
    return this.request(
      `/chat-info?instanceId=${instanceId}&phoneNumber=${phoneNumber}`
    );
  }

  // Messages
  async getMessages(params: {
    instanceId?: string;
    direction?: 'incoming' | 'outgoing' | 'all';
    type?: string;
    search?: string;
    from?: string;
    to?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      messages: Message[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/messages?${queryParams.toString()}`);
  }

  async getMessageStats(instanceId?: string, days: number = 30) {
    const params = new URLSearchParams();
    if (instanceId) params.append('instanceId', instanceId);
    params.append('days', days.toString());

    return this.request<{
      totalMessages: number;
      incomingMessages: number;
      outgoingMessages: number;
      messagesByType: Record<string, number>;
      messagesByDay: {
        date: string;
        total: number;
        incoming: number;
        outgoing: number;
      }[];
    }>(`/messages/stats?${params.toString()}`);
  }

  async getConversations(instanceId?: string, limit: number = 20) {
    const params = new URLSearchParams();
    if (instanceId) params.append('instanceId', instanceId);
    params.append('limit', limit.toString());

    return this.request<{
      conversations: {
        contact: string;
        instanceId: string;
        contactName: string;
        lastMessage: {
          content: any;
          type: string;
          direction: string;
          timestamp: string;
        };
        messageCount: number;
        unreadCount: number;
      }[];
    }>(`/conversations?${params.toString()}`);
  }

  // Templates
  async getTemplates(params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      templates: MessageTemplate[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/templates?${queryParams.toString()}`);
  }

  async createTemplate(data: {
    name: string;
    content: string;
    description?: string;
    category?: string;
    variables?: {
      name: string;
      defaultValue: string;
      required: boolean;
    }[];
  }) {
    return this.request<{
      message: string;
      template: MessageTemplate;
    }>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(templateId: string, data: Partial<MessageTemplate>) {
    return this.request<{
      message: string;
      template: MessageTemplate;
    }>(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(templateId: string) {
    return this.request<{
      message: string;
      templateName: string;
    }>(`/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async sendTemplate(data: {
    instanceId: string;
    to: string;
    templateId: string;
    variables?: Record<string, string>;
  }) {
    return this.request<{
      success: boolean;
      messageId: string;
      instanceId: string;
      templateId: string;
      templateName: string;
      processedMessage: string;
      to: string;
      timestamp: string;
    }>('/send-template', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bulk Campaigns
  async getCampaigns(params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      campaigns: BulkCampaign[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/campaigns?${queryParams.toString()}`);
  }

  async createCampaignFromCSV(data: FormData) {
    const headers: HeadersInit = {};
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(`${API_BASE_URL}/campaigns/csv`, {
      method: 'POST',
      headers,
      body: data,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || 'Failed to create campaign');
    }

    return response.json();
  }

  async getCampaign(campaignId: string) {
    return this.request<{
      campaign: BulkCampaign;
    }>(`/campaigns/${campaignId}`);
  }

  async startCampaign(campaignId: string) {
    return this.request<{
      message: string;
      campaignId: string;
      status: string;
    }>(`/campaigns/${campaignId}/start`, {
      method: 'POST',
    });
  }

  async pauseCampaign(campaignId: string) {
    return this.request<{
      message: string;
      status: string;
    }>(`/campaigns/${campaignId}/pause`, {
      method: 'POST',
    });
  }

  async deleteCampaign(campaignId: string) {
    return this.request<{
      message: string;
      campaignName: string;
    }>(`/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();