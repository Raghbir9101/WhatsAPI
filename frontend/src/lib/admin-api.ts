// Real API for admin operations

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  package: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  validityDate: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  messagesSent: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  createdAt: string;
  lastLogin: string;
  whatsappInstances: number;
}

export interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  validityDays: number;
  features: string[];
}

// API base URL
let API_BASE_URL = 'http://localhost:80/api';

if(window.location.href.includes('localhost')) {
  API_BASE_URL = 'http://localhost:80/api';
} else {
  API_BASE_URL = '/api';
}
// Get token from localStorage
const getToken = () => localStorage.getItem('admin-token');

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

export const adminApi = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('admin-token', response.token);
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('admin-token');
  },

  // Client management
  getClients: async (): Promise<Client[]> => {
    const response = await apiRequest('/admin/clients');
    return response.clients || [];
  },

  getClient: async (id: string): Promise<Client | null> => {
    try {
      return await apiRequest(`/admin/clients/${id}`);
    } catch (error) {
      return null;
    }
  },

  updateClientStatus: async (id: string, status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'): Promise<void> => {
    await apiRequest(`/admin/clients/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  extendClientValidity: async (id: string, days: number): Promise<void> => {
    await apiRequest(`/admin/clients/${id}/extend`, {
      method: 'PUT',
      body: JSON.stringify({ days }),
    });
  },

  addCredits: async (id: string, credits: number): Promise<void> => {
    await apiRequest(`/admin/clients/${id}/credits`, {
      method: 'PUT',
      body: JSON.stringify({ credits }),
    });
  },

  // Package management
  getPackages: async (): Promise<Package[]> => {
    return await apiRequest('/admin/packages');
  },

  createPackage: async (packageData: Omit<Package, 'id'>): Promise<Package> => {
    return await apiRequest('/admin/packages', {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
  },

  updatePackage: async (id: string, packageData: Omit<Package, 'id'>): Promise<Package> => {
    return await apiRequest(`/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(packageData),
    });
  },

  deletePackage: async (id: string): Promise<void> => {
    await apiRequest(`/admin/packages/${id}`, {
      method: 'DELETE',
    });
  },

  // Statistics
  getAdminStats: async () => {
    return await apiRequest('/admin/stats');
  },

  // System settings
  getSystemSettings: async () => {
    return await apiRequest('/admin/settings');
  },

  updateSystemSettings: async (settings: any) => {
    return await apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};