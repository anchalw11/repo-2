// Authentication Manager for persistent sessions
import UserDataManager from './userDataManager';

export interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  userType: 'user' | 'admin' | 'customer-service' | null;
}

class AuthManager {
  private static instance: AuthManager;
  private userDataManager: UserDataManager;

  constructor() {
    this.userDataManager = UserDataManager.getInstance();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Check if user is authenticated and restore session
  checkAuthState(): AuthState {
    try {
      // Check for user authentication
      const userToken = localStorage.getItem('traderedge_auth_token');
      const userData = this.userDataManager.getUserData();
      
      // Check for admin authentication
      const adminToken = localStorage.getItem('admin_token');
      const adminUserType = localStorage.getItem('admin_user_type');
      const adminAuth = localStorage.getItem('admin_mpin_authenticated');
      
      if (adminToken && adminAuth === 'true' && adminUserType) {
        return {
          isAuthenticated: true,
          user: { type: adminUserType },
          token: adminToken,
          userType: adminUserType as 'admin' | 'customer-service'
        };
      }
      
      if (userToken && userData) {
        // Update last login
        this.userDataManager.updateLastLogin();
        
        return {
          isAuthenticated: true,
          user: userData,
          token: userToken,
          userType: 'user'
        };
      }
      
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        userType: null
      };
    } catch (error) {
      console.error('Error checking auth state:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        userType: null
      };
    }
  }

  // Login user and create persistent session
  loginUser(userData: any, token: string): void {
    this.userDataManager.setAuthToken(token);
    this.userDataManager.saveUserData(userData);
    
    // Set additional auth flags
    localStorage.setItem('user_authenticated', 'true');
    localStorage.setItem('login_timestamp', new Date().toISOString());
  }

  // Login admin/customer service
  loginAdmin(userType: 'admin' | 'customer-service', mpin: string): boolean {
    const validMpins = {
      admin: '180623',
      'customer-service': '061823'
    };

    if (validMpins[userType] === mpin) {
      const loginTime = new Date().toISOString();
      localStorage.setItem('admin_token', 'mpin_authenticated_token');
      localStorage.setItem('admin_username', userType);
      localStorage.setItem('admin_login_time', loginTime);
      localStorage.setItem('admin_mpin_authenticated', 'true');
      localStorage.setItem('admin_user_type', userType);
      
      return true;
    }
    
    return false;
  }

  // Logout user
  logoutUser(): void {
    this.userDataManager.clearUserSession();
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('login_timestamp');
  }

  // Logout admin
  logoutAdmin(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('admin_mpin_authenticated');
    localStorage.removeItem('admin_user_type');
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_agent');
  }

  // Check if session is valid (not expired)
  isSessionValid(): boolean {
    const authTimestamp = localStorage.getItem('auth_timestamp');
    const loginTimestamp = localStorage.getItem('login_timestamp');
    
    if (!authTimestamp && !loginTimestamp) return false;
    
    const timestamp = authTimestamp || loginTimestamp;
    const sessionTime = new Date(timestamp!).getTime();
    const currentTime = new Date().getTime();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    return (currentTime - sessionTime) < sessionDuration;
  }

  // Refresh session
  refreshSession(): void {
    const authState = this.checkAuthState();
    if (authState.isAuthenticated) {
      localStorage.setItem('auth_timestamp', new Date().toISOString());
      if (authState.userType === 'user') {
        this.userDataManager.updateLastLogin();
      }
    }
  }

  // Auto-logout on session expiry
  setupAutoLogout(): void {
    setInterval(() => {
      if (!this.isSessionValid()) {
        const authState = this.checkAuthState();
        if (authState.isAuthenticated) {
          if (authState.userType === 'user') {
            this.logoutUser();
          } else {
            this.logoutAdmin();
          }
          window.location.reload();
        }
      }
    }, 60000); // Check every minute
  }
}

export default AuthManager;
