// User Data Management System
export interface UserData {
  userId: string;
  username: string;
  email: string;
  plan: 'kickstarter' | 'basic' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  joinDate: string;
  lastLogin: string;
  dashboardData: {
    trades: any[];
    analytics: any;
    preferences: any;
    chatHistory: any[];
  };
  paymentHistory: any[];
  profileData: any;
}

export interface PaymentRecord {
  paymentId: string;
  method: 'stripe' | 'paypal' | 'crypto';
  amount: number;
  currency: string;
  plan: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  transactionHash?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
}

class UserDataManager {
  private static instance: UserDataManager;
  private userData: UserData | null = null;
  private storageKey = 'traderedge_user_data';
  private authKey = 'traderedge_auth_token';

  static getInstance(): UserDataManager {
    if (!UserDataManager.instance) {
      UserDataManager.instance = new UserDataManager();
    }
    return UserDataManager.instance;
  }

  // Initialize user data from localStorage
  initializeUserData(): UserData | null {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        this.userData = JSON.parse(storedData);
        return this.userData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return null;
  }

  // Save user data to localStorage
  saveUserData(userData: UserData): void {
    try {
      this.userData = userData;
      localStorage.setItem(this.storageKey, JSON.stringify(userData));
      localStorage.setItem('user_plan', userData.plan);
      localStorage.setItem('user_id', userData.userId);
      localStorage.setItem('user_email', userData.email);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get current user data
  getUserData(): UserData | null {
    if (!this.userData) {
      return this.initializeUserData();
    }
    return this.userData;
  }

  // Update specific user data fields
  updateUserData(updates: Partial<UserData>): void {
    if (this.userData) {
      this.userData = { ...this.userData, ...updates };
      this.saveUserData(this.userData);
    }
  }

  // Add trade to user's dashboard
  addTrade(trade: any): void {
    if (this.userData) {
      if (!this.userData.dashboardData.trades) {
        this.userData.dashboardData.trades = [];
      }
      this.userData.dashboardData.trades.push(trade);
      this.saveUserData(this.userData);
    }
  }

  // Add payment record
  addPaymentRecord(payment: PaymentRecord): void {
    if (this.userData) {
      if (!this.userData.paymentHistory) {
        this.userData.paymentHistory = [];
      }
      this.userData.paymentHistory.push(payment);
      this.saveUserData(this.userData);
    }
  }

  // Check authentication status
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.authKey);
    const userData = this.getUserData();
    return !!(token && userData);
  }

  // Set authentication token
  setAuthToken(token: string): void {
    localStorage.setItem(this.authKey, token);
    localStorage.setItem('auth_timestamp', new Date().toISOString());
  }

  // Clear user session
  clearUserSession(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.authKey);
    localStorage.removeItem('user_plan');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('auth_timestamp');
    this.userData = null;
  }

  // Create new user data structure
  createUserData(userData: Partial<UserData>): UserData {
    const newUserData: UserData = {
      userId: userData.userId || `user_${Date.now()}`,
      username: userData.username || '',
      email: userData.email || '',
      plan: userData.plan || 'basic',
      subscriptionStatus: userData.subscriptionStatus || 'trial',
      joinDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      dashboardData: {
        trades: [],
        analytics: {},
        preferences: {},
        chatHistory: []
      },
      paymentHistory: [],
      profileData: {},
      ...userData
    };

    this.saveUserData(newUserData);
    return newUserData;
  }

  // Update last login
  updateLastLogin(): void {
    if (this.userData) {
      this.userData.lastLogin = new Date().toISOString();
      this.saveUserData(this.userData);
    }
  }

  // Get user plan for priority determination
  getUserPlan(): string {
    const userData = this.getUserData();
    return userData?.plan || 'basic';
  }

  // Check if user has priority support
  hasPrioritySupport(): boolean {
    const plan = this.getUserPlan();
    return ['pro', 'enterprise'].includes(plan);
  }

  // Export user data for backup
  exportUserData(): string {
    const userData = this.getUserData();
    return JSON.stringify(userData, null, 2);
  }

  // Import user data from backup
  importUserData(dataString: string): boolean {
    try {
      const userData = JSON.parse(dataString);
      this.saveUserData(userData);
      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      return false;
    }
  }
}

export default UserDataManager;
