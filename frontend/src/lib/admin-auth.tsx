import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminApi } from './admin-api';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: {
    email: string;
    name: string;
    role: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminAuthContextType['admin']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin-token');
    const adminData = localStorage.getItem('admin-data');
    
    if (adminToken && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse admin data:', error);
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-data');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await adminApi.login(email, password);
      
      const adminData = {
        email: response.admin.email,
        name: response.admin.name,
        role: response.admin.role
      };

      setAdmin(adminData);
      setIsAuthenticated(true);
      localStorage.setItem('admin-data', JSON.stringify(adminData));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    adminApi.logout();
    localStorage.removeItem('admin-data');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        admin,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};