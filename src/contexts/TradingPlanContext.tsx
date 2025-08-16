import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import api from '../api';
import { useUser } from './UserContext';

interface PropFirm {
  name: string;
  logo?: string;
  description?: string;
  dailyLossLimit: string;
  maximumLoss: string;
  profitTargets: string;
  minTradingDays: string;
  overnightPositions: string;
  newsTrading: string;
  consistencyRule?: boolean;
  consistencyPercentage?: number;
  rules?: {
    dailyLoss: number;
    maxDrawdown: number;
    profitTarget: number;
    minTradingDays: number;
    maxPositionSize: number;
    scalingTarget: number;
    challengeTypes: string[];
    accountSizes: number[];
    overnightPositions?: boolean;
    newsTrading?: boolean;
    weekendHolding?: boolean;
    consistencyRule?: boolean;
  };
  popular?: boolean;
}

interface PropFirmAccount {
  id: string;
  propFirm: string;
  accountSize: number;
  currentBalance: number;
  phase: 'Challenge' | 'Verification' | 'Funded';
  profitTarget: number;
  currentProfit: number;
  dailyLoss: number;
  maxDrawdown: number;
  currentDrawdown: number;
  tradingDays: number;
  minTradingDays: number;
  status: 'active' | 'passed' | 'failed' | 'pending';
  lastUpdate: Date;
}

interface AccountConfig {
  size: number;
  challengeType: string;
}

interface RiskConfig {
  riskPercentage: number;
  riskRewardRatio: number;
  tradingExperience?: string;
  dailyTradingTime?: string;
  maxConsecutiveLosses?: number;
  preferredSession?: string;
  tradesPerDay?: string;
  winRate?: number;
}

export interface TradingPlan {
  userProfile: {
    initialBalance: number;
    accountEquity: number;
    tradesPerDay: string;
    tradingSession: string;
    cryptoAssets: string[];
    forexAssets: string[];
    hasAccount: string;
    experience: string;
  };
  riskParameters: {
    maxDailyRisk: number;
    maxDailyRiskPct: string;
    baseTradeRisk: number;
    baseTradeRiskPct: string;
    minRiskReward: string;
  };
  trades: Array<{
    trade: string;
    asset: string;
    lossLimit: number;
    profitTarget: number;
    riskRewardRatio: string;
  }>;
  propFirmCompliance: {
    dailyLossLimit: string;
    totalDrawdownLimit: string;
    profitTarget: string;
    consistencyRule: string;
  };
}

interface TradingPlanContextType {
  propFirm: PropFirm | null;
  accountConfig: AccountConfig | null;
  riskConfig: RiskConfig | null;
  tradingPlan: TradingPlan | null;
  accounts: PropFirmAccount[];
  updatePropFirm: (firm: PropFirm) => void;
  updateAccountConfig: (config: AccountConfig) => void;
  updateRiskConfig: (config: RiskConfig) => void;
  updateTradingPlan: (plan: TradingPlan) => void;
  addAccount: (account: PropFirmAccount) => void;
  resetPlan: () => void;
}

const TradingPlanContext = createContext<TradingPlanContextType | undefined>(undefined);

export const TradingPlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [propFirm, setPropFirm] = useState<PropFirm | null>(null);
  const [accountConfig, setAccountConfig] = useState<AccountConfig | null>(null);
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [tradingPlan, setTradingPlan] = useState<TradingPlan | null>(null);
  const [accounts, setAccounts] = useState<PropFirmAccount[]>([]);

  useEffect(() => {
    const loadTradingPlan = () => {
      if (user?.email) {
        // Load from localStorage based on user email
        const savedTradingPlan = localStorage.getItem(`trading_plan_${user.email}`);
        const savedPropFirm = localStorage.getItem(`prop_firm_${user.email}`);
        const savedAccountConfig = localStorage.getItem(`account_config_${user.email}`);
        const savedRiskConfig = localStorage.getItem(`risk_config_${user.email}`);
        
        if (savedTradingPlan) {
          setTradingPlan(JSON.parse(savedTradingPlan));
        }
        if (savedPropFirm) {
          setPropFirm(JSON.parse(savedPropFirm));
        }
        if (savedAccountConfig) {
          setAccountConfig(JSON.parse(savedAccountConfig));
        }
        if (savedRiskConfig) {
          setRiskConfig(JSON.parse(savedRiskConfig));
        }
      }
    };

    loadTradingPlan();
  }, [user?.email]);

  const saveData = (data: any, user: any) => {
    if (user?.email) {
      // Save to localStorage with user email as key
      if (data.tradingPlan) {
        localStorage.setItem(`trading_plan_${user.email}`, JSON.stringify(data.tradingPlan));
      }
      if (data.propFirm) {
        localStorage.setItem(`prop_firm_${user.email}`, JSON.stringify(data.propFirm));
      }
      if (data.accountConfig) {
        localStorage.setItem(`account_config_${user.email}`, JSON.stringify(data.accountConfig));
      }
      if (data.riskConfig) {
        localStorage.setItem(`risk_config_${user.email}`, JSON.stringify(data.riskConfig));
      }
    }
  };

  const addAccount = useCallback((account: PropFirmAccount) => {
    setAccounts(prev => {
      const newAccounts = [...prev, account];
      saveData({ accounts: newAccounts });
      return newAccounts;
    });
  }, []);

  const updatePropFirm = useCallback((firm: PropFirm) => {
    setPropFirm(firm);
    if (user?.email) {
      localStorage.setItem(`prop_firm_${user.email}`, JSON.stringify(firm));
    }
  }, [user?.email]);

  const updateAccountConfig = useCallback((config: AccountConfig) => {
    setAccountConfig(config);
    if (user?.email) {
      localStorage.setItem(`account_config_${user.email}`, JSON.stringify(config));
    }
  }, [user?.email]);

  const updateRiskConfig = useCallback((config: RiskConfig) => {
    setRiskConfig(config);
    if (user?.email) {
      localStorage.setItem(`risk_config_${user.email}`, JSON.stringify(config));
    }
  }, [user?.email]);

  const updateTradingPlan = useCallback((plan: TradingPlan) => {
    setTradingPlan(plan);
    if (user?.email) {
      localStorage.setItem(`trading_plan_${user.email}`, JSON.stringify(plan));
    }
  }, [user?.email]);

  const resetPlan = useCallback(async () => {
    setPropFirm(null);
    setAccountConfig(null);
    setRiskConfig(null);
    setTradingPlan(null);
    try {
      await api.delete('/api/trading-plan');
    } catch (error) {
      console.error('Failed to reset trading plan', error);
    }
  }, []);

  return (
    <TradingPlanContext.Provider value={{
      propFirm,
      accountConfig,
      riskConfig,
      tradingPlan,
      updatePropFirm,
      updateAccountConfig,
      updateRiskConfig,
      updateTradingPlan,
      accounts,
      addAccount,
      resetPlan
    }}>
      {children}
    </TradingPlanContext.Provider>
  );
};

export const useTradingPlan = () => {
  const context = useContext(TradingPlanContext);
  if (context === undefined) {
    throw new Error('useTradingPlan must be used within a TradingPlanProvider');
  }
  return context;
};
