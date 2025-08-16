// src/trading/riskManager.ts

import { Trade, RiskSettings, TradingState } from './types';

/**
 * Calculates the appropriate position size based on risk settings.
 * @param state The current trading state.
 * @returns The calculated risk amount in dollars.
 */
export const calculatePositionSize = (state: TradingState): number => {
  const { currentEquity, riskSettings } = state;
  let riskPercentage = riskSettings.riskPerTrade;

  // Example of dynamic risk adjustment:
  // Reduce risk after a series of losses
  const recentLosses = state.trades.slice(-riskSettings.consecutiveLossesLimit);
  if (recentLosses.length === riskSettings.consecutiveLossesLimit && recentLosses.every(t => t.pnl! < 0)) {
    riskPercentage *= 0.5; // Reduce risk by 50%
  }

  return (currentEquity * riskPercentage) / 100;
};

/**
 * Checks if the daily loss limit has been reached.
 * @param state The current trading state.
 * @returns True if the limit has been reached, false otherwise.
 */
export const isDailyLossLimitReached = (state: TradingState): boolean => {
  const { dailyStats, riskSettings } = state;
  const dailyLoss = Math.abs(dailyStats.pnl);
  const dailyLossLimitAmount = (dailyStats.initialEquity * riskSettings.dailyLossLimit) / 100;

  return dailyLoss >= dailyLossLimitAmount;
};

/**
 * Provides a summary of the current risk status.
 * @param state The current trading state.
 * @returns An object with risk summary data.
 */
export const getRiskSummary = (state: TradingState) => {
  const { currentEquity, riskSettings, dailyStats } = state;
  const riskPerTradeAmount = (currentEquity * riskSettings.riskPerTrade) / 100;
  const dailyLossLimitAmount = (dailyStats.initialEquity * riskSettings.dailyLossLimit) / 100;
  const dailyRiskUsed = Math.abs(dailyStats.pnl);
  const maxDailyRiskRemaining = dailyLossLimitAmount - dailyRiskUsed;

  return {
    currentRiskPerTrade: riskSettings.riskPerTrade,
    riskPerTradeAmount,
    dailyRiskUsed,
    maxDailyRiskRemaining,
    dailyLossLimit: riskSettings.dailyLossLimit,
  };
};
