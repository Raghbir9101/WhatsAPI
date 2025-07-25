// Real API for admin operations

export interface Package {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
  maxInstances: number;
  supportLevel: string;
  billingPeriod: string;
  isActive: boolean;
  validityDays?: number;
}

export interface AssignedPackage {
  _id: string;
  package: Package;
  lastDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  packageType: string;
  validityDate: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  messagesSent: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  createdAt: string;
  lastLogin: string;
  whatsappInstances: number;
  assignedPackages: AssignedPackage[];
}

export interface ClientResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
  getClients: async (page = 1, limit = 20, search = ''): Promise<ClientResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    const response = await apiRequest(`/admin/clients?${queryParams}`);
    return response;
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

  assignPackageToClient: async (clientId: string, packageId: string): Promise<void> => {
    await apiRequest(`/admin/clients/${clientId}/assign-package`, {
      method: 'POST',
      body: JSON.stringify({ packageId }),
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