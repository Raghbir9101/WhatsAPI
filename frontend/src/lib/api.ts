let API_BASE_URL = 'http://localhost:80/api';

if(window.location.href.includes('localhost')) {
  API_BASE_URL = 'http://localhost:80/api';
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
  source?: 'api' | 'frontend'; // New field to track message source
  fileUrl?: string; // New field for file attachment URL
  fileName?: string; // New field for file name
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

    console.log('🌐 [API CLIENT] Making request:', {
      url,
      method: options.method || 'GET',
      headers: Object.keys(headers),
      hasApiKey: !!this.apiKey
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 [API CLIENT] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error('❌ [API CLIENT] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || errorData.message || 'API request failed');
      }

      const data = await response.json();
      console.log('✅ [API CLIENT] Request successful:', {
        dataType: typeof data,
        dataKeys: Object.keys(data || {})
      });
      return data;
    } catch (error) {
      console.error('❌ [API CLIENT] Request error:', error);
      throw error;
    }
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
      qrCode?: string;
      timestamp?: string;
      status?: string;
      isAuthenticated?: boolean;
      phoneNumber?: string;
      message?: string;
      error?: string;
      instructions?: string;
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
    source?: string;
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

  async getMessageStats(instanceId?: string, source?: string, days: number = 30) {
    const params = new URLSearchParams();
    if (instanceId) params.append('instanceId', instanceId);
    if (source) params.append('source', source);
    params.append('days', days.toString());

    return this.request<{
      totalMessages: number;
      incomingMessages: number;
      outgoingMessages: number;
      apiMessages: number;
      frontendMessages: number;
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

  // Groups & Channels
  async getGroups(instanceId: string) {
    return this.request<{
      instanceId: string;
      groups: {
        id: string;
        name: string;
        description: string;
        participantCount: number;
        isOwner: boolean;
        createdAt: string;
        lastMessage?: {
          body: string;
          timestamp: number;
          from: string;
        };
      }[];
      totalGroups: number;
      message?: string;
    }>(`/groups?instanceId=${instanceId}`);
  }

  async getGroupDetails(groupId: string, instanceId: string) {
    return this.request<{
      id: string;
      name: string;
      description: string;
      participants: {
        id: string;
        isAdmin: boolean;
        isSuperAdmin: boolean;
      }[];
      participantCount: number;
      isOwner: boolean;
      createdAt: string;
      inviteCode: string;
    }>(`/groups/${groupId}?instanceId=${instanceId}`);
  }

  async createGroup(data: {
    instanceId: string;
    name: string;
    participants: string[];
  }) {
    return this.request<{
      success: boolean;
      groupId: string;
      groupName: string;
      participants: string[];
      timestamp: string;
    }>('/groups/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendGroupMessage(data: {
    instanceId: string;
    groupId: string;
    message: string;
  }) {
    return this.request<{
      success: boolean;
      messageId: string;
      instanceId: string;
      groupId: string;
      message: string;
      timestamp: string;
    }>('/groups/send-message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Schedule & Campaigns
  async scheduleMessage(data: {
    instanceId: string;
    to: string;
    message: string;
    scheduledAt: string;
  }) {
    return this.request<{
      success: boolean;
      messageId: string;
      scheduledAt: string;
      message: string;
    }>('/schedule/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduledMessages(params: {
    instanceId?: string;
    status?: 'scheduled' | 'sent' | 'failed' | 'cancelled' | 'all';
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      scheduledMessages: Message[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/schedule/messages?${searchParams}`);
  }

  async cancelScheduledMessage(messageId: string) {
    return this.request<{
      success: boolean;
      message: string;
      messageId: string;
    }>(`/schedule/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Reports & Analytics
  async getAnalytics(params: {
    instanceId?: string;
    startDate?: string;
    endDate?: string;
    granularity?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      summary: {
        totalMessages: number;
        messagesByDirection: Record<string, number>;
        messagesByType: Record<string, number>;
        messagesByStatus: Record<string, number>;
      };
      timeline: {
        period: string;
        total: number;
        incoming: number;
        outgoing: number;
      }[];
      topContacts: {
        phoneNumber: string;
        messageCount: number;
        lastMessage: string;
      }[];
      campaigns: {
        totalCampaigns: number;
        completedCampaigns: number;
        totalRecipients: number;
        totalSent: number;
        totalFailed: number;
      };
    }>(`/reports/analytics?${searchParams}`);
  }

  async getDeliveryReport(params: {
    instanceId?: string;
    campaignId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      summary: Record<string, number>;
      dailyReport: {
        date: string;
        total: number;
        breakdown: Record<string, number>;
      }[];
    }>(`/reports/delivery?${searchParams}`);
  }

  async getPerformanceMetrics(params: {
    instanceId?: string;
    days?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<{
      messageVolume: {
        _id: string;
        hourlyVolume: { hour: number; count: number }[];
        dailyTotal: number;
      }[];
      responseRate: {
        percentage: number;
        totalSent: number;
        totalResponded: number;
      };
      activeHours: {
        hour: number;
        messageCount: number;
      }[];
      instancePerformance: {
        instanceName: string;
        phoneNumber: string;
        messageCount: number;
        isActive: boolean;
        status: string;
      }[];
    }>(`/reports/performance?${searchParams}`);
  }

  // IndiaMART Integration
  async getIndiaMartConfig() {
    return this.request<{
      configured: boolean;
      config?: {
        _id: string;
        crmKey: string;
        isActive: boolean;
        fetchInterval: number;
        overlapDuration: number;
        lastFetchTime: string;
        nextFetchTime: string;
        totalLeadsFetched: number;
        totalApiCalls: number;
        lastApiCallStatus: string;
        lastApiCallError: string;
        settings: {
          autoFetch: boolean;
          retryFailedCalls: boolean;
          maxRetries: number;
          notifications: boolean;
        };
      };
    }>('/indiamart/config');
  }

  async saveIndiaMartConfig(config: {
    crmKey: string;
    fetchInterval: number;
    overlapDuration: number;
    settings: {
      autoFetch: boolean;
      retryFailedCalls: boolean;
      maxRetries: number;
      notifications: boolean;
    };
  }) {
    return this.request<{
      message: string;
      config: any;
    }>('/indiamart/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getIndiaMartDashboard() {
    return this.request<{
      configured: boolean;
      statistics: {
        totalLeads: number;
        todayLeads: number;
        weekLeads: number;
        monthLeads: number;
        statusCounts: Record<string, number>;
      };
      fetchInfo: {
        lastFetch: string;
        nextFetch: string;
        timeUntilNextFetch: number;
        totalApiCalls: number;
        lastApiCallStatus: string;
        lastApiCallError: string;
      };
      recentActivity: any[];
    }>('/indiamart/dashboard');
  }

  async getIndiaMartLeads(params: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    senderName?: string;
    senderMobile?: string;
    queryType?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      leads: any[];
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/indiamart/leads?${queryParams.toString()}`);
  }

  async fetchIndiaMartLeads() {
    console.log('🌐 [API CLIENT] fetchIndiaMartLeads called');
    console.log('🌐 [API CLIENT] Making POST request to /indiamart/leads/fetch');
    console.log('🌐 [API CLIENT] API Base URL:', API_BASE_URL);
    console.log('🌐 [API CLIENT] Full URL:', `${API_BASE_URL}/indiamart/leads/fetch`);
    console.log('🌐 [API CLIENT] API Key present:', !!this.apiKey);
    
    try {
      const response = await this.request<{
        message: string;
        totalRecords: number;
        processedCount: number;
        skippedCount: number;
        errorCount: number;
        duration: number;
      }>('/indiamart/leads/fetch', {
        method: 'POST',
      });
      
      console.log('✅ [API CLIENT] fetchIndiaMartLeads successful:', response);
      return response;
    } catch (error) {
      console.error('❌ [API CLIENT] fetchIndiaMartLeads failed:', error);
      console.error('❌ [API CLIENT] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  async updateIndiaMartLeadStatus(leadId: string, data: {
    status: string;
    notes: string;
    followUpDate: string;
  }) {
    return this.request<{
      message: string;
      lead: any;
    }>(`/indiamart/leads/${leadId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getIndiaMartLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      logs: any[];
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/indiamart/logs?${queryParams.toString()}`);
  }

  // Flow APIs
  async getFlows(instanceId?: string) {
    const params = instanceId ? `?instanceId=${instanceId}` : '';
    return this.request(`/flows${params}`);
  }

  async getFlow(flowId: string) {
    return this.request(`/flows/${flowId}`);
  }

  async createFlow(flowData: {
    instanceId: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive?: boolean;
  }) {
    return this.request('/flows', {
      method: 'POST',
      body: JSON.stringify(flowData)
    });
  }

  async updateFlow(flowId: string, flowData: {
    name?: string;
    description?: string;
    nodes?: any[];
    edges?: any[];
    isActive?: boolean;
  }) {
    return this.request(`/flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(flowData)
    });
  }

  async deleteFlow(flowId: string) {
    return this.request(`/flows/${flowId}`, { method: 'DELETE' });
  }

  async toggleFlowStatus(flowId: string) {
    return this.request(`/flows/${flowId}/toggle`, { method: 'PATCH' });
  }

  async getFlowStats(instanceId?: string) {
    const params = instanceId ? `?instanceId=${instanceId}` : '';
    return this.request(`/flows/stats${params}`);
  }

  async testFlow(flowId: string, testData: { testMessage?: string; fromNumber?: string }) {
    return this.request(`/flows/${flowId}/test`, {
      method: 'POST',
      body: JSON.stringify(testData)
    });
  }
}

export const apiClient = new ApiClient();