// src/trading/types.ts

/**
 * Represents a potential trade signal.
 */
export interface Signal {
  id: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  market?: string;
  status?: 'active' | 'closed' | 'pending';
  confidence?: number;
  riskRewardRatio?: string;
  timestamp: string;
  description: string;
  // Optional risk/reward details if provided by the signal
  riskAmount?: number;
  rewardAmount?: number;
}

/**
 * Represents a trade that has been executed.
 */
export interface Trade {
  id: string;
  signalId: string; // The ID of the signal that generated this trade
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number; // The actual risk amount for this trade
  rewardAmount: number; // The potential reward amount
  status: 'open' | 'closed';
  entryTime: Date;
  closeTime?: Date;
  outcome?: TradeOutcome;
  pnl?: number; // Profit and Loss
  equityBefore: number;
  equityAfter?: number;
  notes?: string;
}

export type TradeOutcome = 'Stop Loss Hit' | 'Target Hit' | 'Breakeven' | 'Manual Close';

/**
 * Represents the comprehensive performance metrics of the trading account.
 */
export interface PerformanceMetrics {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  currentDrawdown: number;
  grossProfit: number;
  grossLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  // Optional advanced metrics
  sharpeRatio?: number;
}

/**
 * Represents the user-defined risk management settings.
 */
export interface RiskSettings {
  riskPerTrade: number; // as a percentage of equity (e.g., 1 for 1%)
  dailyLossLimit: number; // as a percentage of starting daily equity
  consecutiveLossesLimit: number; // number of losses before risk reduction
}

/**
 * Represents the overall state of the trading simulation.
 */
export interface TradingState {
  initialEquity: number;
  currentEquity: number;
  trades: Trade[]; // History of all closed trades
  openPositions: Trade[]; // All currently open trades
  riskSettings: RiskSettings;
  performanceMetrics: PerformanceMetrics;
  dailyStats: {
    pnl: number;
    trades: number;
    initialEquity: number; // Equity at the start of the day
  };
}
