import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    email: string;
    name: string;
    company: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey');
    const userData = localStorage.getItem('userData');
    
    if (apiKey && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        apiClient.setApiKey(apiKey);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('apiKey');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Mock authentication for demo
      if (email === 'customer@demo.com' && password === 'demo123') {
        const userData = {
          email: 'customer@demo.com',
          name: 'Demo Customer',
          company: 'Demo Company',
        };
        
        const mockApiKey = 'demo-api-key-12345';
        
        setUser(userData);
        setIsAuthenticated(true);
        apiClient.setApiKey(mockApiKey);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('apiKey', mockApiKey);
        return;
      }
      
      // For other credentials, try the actual API
      const response = await apiClient.login({ email, password });
      
      const userData = {
        email: response.email,
        name: response.name,
        company: response.company,
      };

      setUser(userData);
      setIsAuthenticated(true);
      apiClient.setApiKey(response.apiKey);
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    company?: string;
  }) => {
    try {
      const response = await apiClient.register(data);
      
      const userData = {
        email: response.email,
        name: response.name,
        company: response.company,
      };

      setUser(userData);
      setIsAuthenticated(true);
      apiClient.setApiKey(response.apiKey);
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    apiClient.clearApiKey();
    localStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};