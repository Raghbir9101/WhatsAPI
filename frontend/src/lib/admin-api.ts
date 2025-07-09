// Mock API for admin operations - replace with real API calls

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

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    email: 'john@company.com',
    name: 'John Doe',
    company: 'Tech Corp',
    package: 'PREMIUM',
    validityDate: '2024-12-31',
    creditsTotal: 10000,
    creditsUsed: 3450,
    creditsRemaining: 6550,
    messagesSent: 3450,
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    lastLogin: '2024-07-08',
    whatsappInstances: 3
  },
  {
    id: '2',
    email: 'sarah@business.com',
    name: 'Sarah Wilson',
    company: 'Business Solutions',
    package: 'BASIC',
    validityDate: '2024-08-15',
    creditsTotal: 5000,
    creditsUsed: 4800,
    creditsRemaining: 200,
    messagesSent: 4800,
    status: 'ACTIVE',
    createdAt: '2024-02-10',
    lastLogin: '2024-07-09',
    whatsappInstances: 1
  },
  {
    id: '3',
    email: 'mike@enterprise.com',
    name: 'Mike Johnson',
    company: 'Enterprise Inc',
    package: 'ENTERPRISE',
    validityDate: '2025-06-30',
    creditsTotal: 50000,
    creditsUsed: 12300,
    creditsRemaining: 37700,
    messagesSent: 12300,
    status: 'ACTIVE',
    createdAt: '2023-12-01',
    lastLogin: '2024-07-09',
    whatsappInstances: 10
  },
  {
    id: '4',
    email: 'expired@test.com',
    name: 'Test User',
    company: 'Test Company',
    package: 'BASIC',
    validityDate: '2024-06-30',
    creditsTotal: 5000,
    creditsUsed: 5000,
    creditsRemaining: 0,
    messagesSent: 5000,
    status: 'EXPIRED',
    createdAt: '2024-01-01',
    lastLogin: '2024-06-29',
    whatsappInstances: 2
  }
];

const mockPackages: Package[] = [
  {
    id: '1',
    name: 'BASIC',
    credits: 5000,
    price: 99,
    validityDays: 30,
    features: ['5,000 messages', '1 WhatsApp number', 'Basic support']
  },
  {
    id: '2',
    name: 'PREMIUM',
    credits: 15000,
    price: 199,
    validityDays: 30,
    features: ['15,000 messages', '5 WhatsApp numbers', 'Priority support', 'Analytics']
  },
  {
    id: '3',
    name: 'ENTERPRISE',
    credits: 50000,
    price: 499,
    validityDays: 30,
    features: ['50,000 messages', 'Unlimited WhatsApp numbers', '24/7 support', 'Advanced analytics', 'API access']
  }
];

export const adminApi = {
  // Client management
  getClients: async (): Promise<Client[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockClients;
  },

  getClient: async (id: string): Promise<Client | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockClients.find(c => c.id === id) || null;
  },

  updateClientStatus: async (id: string, status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const client = mockClients.find(c => c.id === id);
    if (client) {
      client.status = status;
    }
  },

  extendClientValidity: async (id: string, days: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const client = mockClients.find(c => c.id === id);
    if (client) {
      const currentDate = new Date(client.validityDate);
      currentDate.setDate(currentDate.getDate() + days);
      client.validityDate = currentDate.toISOString().split('T')[0];
    }
  },

  addCredits: async (id: string, credits: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const client = mockClients.find(c => c.id === id);
    if (client) {
      client.creditsTotal += credits;
      client.creditsRemaining += credits;
    }
  },

  // Package management
  getPackages: async (): Promise<Package[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPackages;
  },

  // Statistics
  getAdminStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalClients: mockClients.length,
      activeClients: mockClients.filter(c => c.status === 'ACTIVE').length,
      expiredClients: mockClients.filter(c => c.status === 'EXPIRED').length,
      suspendedClients: mockClients.filter(c => c.status === 'SUSPENDED').length,
      totalCreditsIssued: mockClients.reduce((sum, c) => sum + c.creditsTotal, 0),
      totalCreditsUsed: mockClients.reduce((sum, c) => sum + c.creditsUsed, 0),
      totalMessagesSent: mockClients.reduce((sum, c) => sum + c.messagesSent, 0),
      totalRevenue: mockClients.length * 199, // Mock calculation
      monthlyRevenue: 15920,
      newClientsThisMonth: 8
    };
  }
};