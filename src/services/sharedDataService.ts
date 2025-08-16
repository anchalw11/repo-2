import { TradingState } from '../trading/types';

export interface SharedUserData {
  email: string;
  name: string;
  membershipTier: string;
  tradingData?: {
    propFirm: string;
    accountType: string;
    accountSize: string;
    tradingExperience: string;
    tradesPerDay: string;
    riskPerTrade: string;
    riskRewardRatio: string;
    tradingSession: string;
  };
  isAuthenticated: boolean;
  setupComplete: boolean;
}

export interface SharedTradingState extends TradingState {
  lastUpdated: Date;
}

export interface SharedMarketData {
  forexNews: any[];
  marketStatus: {
    isOpen: boolean;
    currentSession: string;
    nextSession: string;
    timeUntilNext: string;
    localTime: string;
  };
  selectedTimezone: string;
  lastUpdated: Date;
}

class SharedDataService {
  private static instance: SharedDataService;
  private userData: SharedUserData | null = null;
  private tradingState: SharedTradingState | null = null;
  private marketData: SharedMarketData | null = null;
  private subscribers: Set<(data: any) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SharedDataService {
    if (!SharedDataService.instance) {
      SharedDataService.instance = new SharedDataService();
    }
    return SharedDataService.instance;
  }

  // User Data Management
  public setUserData(userData: SharedUserData): void {
    this.userData = userData;
    this.saveToStorage('userData', userData);
    this.notifySubscribers('userData', userData);
  }

  public getUserData(): SharedUserData | null {
    return this.userData;
  }

  public updateUserTradingData(tradingData: Partial<SharedUserData['tradingData']>): void {
    if (this.userData) {
      this.userData.tradingData = { 
        ...this.userData.tradingData, 
        ...tradingData 
      } as SharedUserData['tradingData'];
      this.saveToStorage('userData', this.userData);
      this.notifySubscribers('userData', this.userData);
    }
  }

  // Trading State Management
  public setTradingState(tradingState: TradingState): void {
    this.tradingState = {
      ...tradingState,
      lastUpdated: new Date()
    };
    this.saveToStorage('tradingState', this.tradingState);
    this.notifySubscribers('tradingState', this.tradingState);
  }

  public getTradingState(): SharedTradingState | null {
    return this.tradingState;
  }

  public updateTradingMetrics(metrics: Partial<TradingState['performanceMetrics']>): void {
    if (this.tradingState) {
      this.tradingState.performanceMetrics = { 
        ...this.tradingState.performanceMetrics, 
        ...metrics 
      };
      this.tradingState.lastUpdated = new Date();
      this.saveToStorage('tradingState', this.tradingState);
      this.notifySubscribers('tradingState', this.tradingState);
    }
  }

  // Market Data Management
  public setMarketData(marketData: Omit<SharedMarketData, 'lastUpdated'>): void {
    this.marketData = {
      ...marketData,
      lastUpdated: new Date()
    };
    this.saveToStorage('marketData', this.marketData);
    this.notifySubscribers('marketData', this.marketData);
  }

  public getMarketData(): SharedMarketData | null {
    return this.marketData;
  }

  public updateForexNews(forexNews: any[]): void {
    if (this.marketData) {
      this.marketData.forexNews = forexNews;
      this.marketData.lastUpdated = new Date();
      this.saveToStorage('marketData', this.marketData);
      this.notifySubscribers('marketData', this.marketData);
    }
  }

  public updateMarketStatus(marketStatus: SharedMarketData['marketStatus']): void {
    if (this.marketData) {
      this.marketData.marketStatus = marketStatus;
      this.marketData.lastUpdated = new Date();
      this.saveToStorage('marketData', this.marketData);
      this.notifySubscribers('marketData', this.marketData);
    }
  }

  public setSelectedTimezone(timezone: string): void {
    if (this.marketData) {
      this.marketData.selectedTimezone = timezone;
      this.marketData.lastUpdated = new Date();
      this.saveToStorage('marketData', this.marketData);
      this.notifySubscribers('marketData', this.marketData);
    }
  }

  // Subscription Management
  public subscribe(callback: (data: any) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(type: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // Storage Management
  private saveToStorage(key: string, data: any): void {
    try {
      const userEmail = this.userData?.email || 'default';
      const storageKey = `${key}_${userEmail}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      // Try to load user data first
      const userDataKeys = Object.keys(localStorage).filter(key => key.startsWith('userData_'));
      if (userDataKeys.length > 0) {
        const latestUserDataKey = userDataKeys[userDataKeys.length - 1];
        const userData = localStorage.getItem(latestUserDataKey);
        if (userData) {
          this.userData = JSON.parse(userData);
        }
      }

      // Load other data if user data exists
      if (this.userData?.email) {
        const userEmail = this.userData.email;
        
        const tradingStateData = localStorage.getItem(`tradingState_${userEmail}`);
        if (tradingStateData) {
          this.tradingState = JSON.parse(tradingStateData);
        }

        const marketDataData = localStorage.getItem(`marketData_${userEmail}`);
        if (marketDataData) {
          this.marketData = JSON.parse(marketDataData);
        }
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  // Utility Methods
  public clearAllData(): void {
    this.userData = null;
    this.tradingState = null;
    this.marketData = null;
    
    // Clear from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('userData_') || key.includes('tradingState_') || key.includes('marketData_')) {
        localStorage.removeItem(key);
      }
    });

    this.notifySubscribers('cleared', null);
  }

  public exportData(): any {
    return {
      userData: this.userData,
      tradingState: this.tradingState,
      marketData: this.marketData,
      exportedAt: new Date().toISOString()
    };
  }

  public importData(data: any): void {
    if (data.userData) {
      this.setUserData(data.userData);
    }
    if (data.tradingState) {
      this.setTradingState(data.tradingState);
    }
    if (data.marketData) {
      this.setMarketData(data.marketData);
    }
  }

  // Dashboard-specific methods
  public getStatsForDashboard(): any {
    const tradingState = this.getTradingState();
    const userData = this.getUserData();
    
    if (!tradingState || !userData) {
      return {
        accountBalance: '$0',
        winRate: '0%',
        totalTrades: 0,
        totalPnL: '$0.00'
      };
    }

    return {
      accountBalance: `$${tradingState.currentEquity.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`,
      winRate: `${tradingState.performanceMetrics.winRate.toFixed(1)}%`,
      totalTrades: tradingState.trades.length,
      totalPnL: `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
    };
  }

  public getRecentTrades(limit: number = 5): any[] {
    const tradingState = this.getTradingState();
    if (!tradingState || !tradingState.trades) {
      return [];
    }

    return tradingState.trades
      .slice(-limit)
      .reverse()
      .map(trade => ({
        pair: trade.pair,
        outcome: trade.outcome,
        pnl: trade.pnl || 0,
        entryTime: trade.entryTime,
        closeTime: trade.closeTime
      }));
  }

  public getUserTradingProfile(): any {
    const userData = this.getUserData();
    if (!userData || !userData.tradingData) {
      return {};
    }

    return {
      propFirm: userData.tradingData.propFirm || 'Not Set',
      accountType: userData.tradingData.accountType || 'Not Set',
      accountSize: userData.tradingData.accountSize ? `$${parseInt(userData.tradingData.accountSize).toLocaleString()}` : 'Not Set',
      experience: userData.tradingData.tradingExperience || 'Not Set',
      tradesPerDay: userData.tradingData.tradesPerDay || 'Not Set',
      riskPerTrade: userData.tradingData.riskPerTrade ? `${userData.tradingData.riskPerTrade}%` : 'Not Set',
      riskRewardRatio: userData.tradingData.riskRewardRatio ? `1:${userData.tradingData.riskRewardRatio}` : 'Not Set',
      session: userData.tradingData.tradingSession || 'Not Set'
    };
  }
}

export default SharedDataService.getInstance();
