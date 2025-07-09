import React, { createContext, useContext, useEffect, useState } from 'react';

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
    const adminToken = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_data');
    
    if (adminToken && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse admin data:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Mock admin login - replace with actual API call
      if (email === 'admin@ceoitbox.com' && password === 'admin123') {
        const adminData = {
          email: 'admin@ceoitbox.com',
          name: 'Admin User',
          role: 'SUPER_ADMIN'
        };

        setAdmin(adminData);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', 'mock_admin_token');
        localStorage.setItem('admin_data', JSON.stringify(adminData));
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
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