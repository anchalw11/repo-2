import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api';

interface AdminUser {
  username: string;
  isAuthenticated: boolean;
  loginTime?: Date;
}

interface AdminContextType {
  admin: AdminUser | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  loginWithMpin: (mpin: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const validateToken = async (token: string) => {
    try {
      // For MPIN authentication, always return true (handled in useEffect)
      if (token === 'mpin_authenticated_token') {
        return true;
      }
      
      // Set the authorization header for the request
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await api.post('/admin/validate-token', {}, { headers });
      return response.status === 200;
    } catch (error) {
      console.error('Token validation error:', error);
      // In production, if backend is not available, allow MPIN tokens
      if (token === 'mpin_authenticated_token') {
        return true;
      }
      // Also allow if it's a network error (backend might be down)
      if ((error as any).code === 'NETWORK_ERROR' || (error as any).message?.includes('Network Error')) {
        return token === 'mpin_authenticated_token';
      }
      return false;
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('admin_token');
      const username = localStorage.getItem('admin_username');
      const mpinAuth = localStorage.getItem('admin_mpin_authenticated');
      const loginTime = localStorage.getItem('admin_login_time');
      
      if (token && username) {
        // For MPIN authentication, check if it's still valid (24 hours)
        if (token === 'mpin_authenticated_token' && mpinAuth === 'true') {
          if (loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
            
            // Keep MPIN session active for 24 hours
            if (hoursSinceLogin < 24) {
              setAdmin({
                username: username,
                isAuthenticated: true,
                loginTime: loginDate
              });
              return;
            }
          }
        }
        
        // For regular tokens, validate with backend
        const isValid = await validateToken(token);
        if (isValid) {
          setAdmin({
            username: username,
            isAuthenticated: true,
          });
        } else {
          // Only logout if it's not an MPIN token
          if (token !== 'mpin_authenticated_token') {
            logout();
          }
        }
      }
    };
    checkToken();
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const response = await api.post('/admin/login', credentials);

      if (response.status === 200) {
        const { access_token } = response.data;
        localStorage.setItem('admin_token', access_token);
        localStorage.setItem('admin_username', credentials.username);
        localStorage.setItem('admin_login_time', new Date().toISOString());
        setAdmin({
          username: credentials.username,
          isAuthenticated: true,
          loginTime: new Date(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      // In production, if backend is not available, fall back to MPIN
      if ((error as any).code === 'NETWORK_ERROR' || (error as any).message?.includes('Network Error')) {
        console.log('Backend unavailable, please use MPIN login');
      }
      return false;
    }
  };

  const loginWithMpin = async (mpin: string): Promise<boolean> => {
    try {
      // Admin MPIN is 180623, Customer Service MPIN is 123456
      if (mpin === '180623' || mpin === '123456') {
        const adminUsername = mpin === '180623' ? 'admin' : 'customer-service';
        const loginTime = new Date().toISOString();
        localStorage.setItem('admin_token', 'mpin_authenticated_token');
        localStorage.setItem('admin_username', adminUsername);
        localStorage.setItem('admin_login_time', loginTime);
        localStorage.setItem('admin_mpin_authenticated', 'true');
        localStorage.setItem('admin_user_type', mpin === '180623' ? 'admin' : 'customer-service');
        setAdmin({
          username: adminUsername,
          isAuthenticated: true,
          loginTime: new Date(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin MPIN login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('admin_mpin_authenticated');
    localStorage.removeItem('admin_user_type');
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, login, loginWithMpin, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
