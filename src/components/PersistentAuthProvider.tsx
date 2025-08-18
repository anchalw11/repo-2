import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthManager, { AuthState } from '../utils/authManager';

interface PersistentAuthContextType {
  authState: AuthState;
  refreshAuth: () => void;
  isLoading: boolean;
}

const PersistentAuthContext = createContext<PersistentAuthContextType | undefined>(undefined);

export const usePersistentAuth = () => {
  const context = useContext(PersistentAuthContext);
  if (!context) {
    throw new Error('usePersistentAuth must be used within PersistentAuthProvider');
  }
  return context;
};

interface PersistentAuthProviderProps {
  children: React.ReactNode;
}

export const PersistentAuthProvider: React.FC<PersistentAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    userType: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const authManager = AuthManager.getInstance();

  const refreshAuth = () => {
    const newAuthState = authManager.checkAuthState();
    setAuthState(newAuthState);
  };

  useEffect(() => {
    // Initialize authentication state
    refreshAuth();
    setIsLoading(false);

    // Set up periodic auth refresh
    const interval = setInterval(() => {
      if (authManager.isSessionValid()) {
        authManager.refreshSession();
        refreshAuth();
      } else {
        const currentAuthState = authManager.checkAuthState();
        if (currentAuthState.isAuthenticated) {
          // Session expired, logout
          if (currentAuthState.userType === 'user') {
            authManager.logoutUser();
          } else {
            authManager.logoutAdmin();
          }
          refreshAuth();
        }
      }
    }, 60000); // Check every minute

    // Listen for storage changes (multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('admin_') || e.key?.startsWith('traderedge_') || e.key?.startsWith('cs_')) {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authManager]);

  const value = {
    authState,
    refreshAuth,
    isLoading
  };

  return (
    <PersistentAuthContext.Provider value={value}>
      {children}
    </PersistentAuthContext.Provider>
  );
};

export default PersistentAuthProvider;
