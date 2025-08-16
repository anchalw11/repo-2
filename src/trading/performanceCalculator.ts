// src/trading/performanceCalculator.ts

import { PerformanceMetrics, Trade, TradingState } from './types';

/**
 * Calculates all performance metrics from the trade history.
 * @param trades An array of closed trades.
 * @param currentEquity The current account equity.
 * @param initialEquity The starting equity.
 * @returns A full PerformanceMetrics object.
 */
export const calculatePerformanceMetrics = (trades: Trade[], currentEquity: number, initialEquity: number): PerformanceMetrics => {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalPnl: 0,
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      grossProfit: 0,
      grossLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
    };
  }

  const winningTrades = trades.filter(t => t.pnl! > 0);
  const losingTrades = trades.filter(t => t.pnl! < 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl!, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0));

  const winRate = (winningTrades.length / totalTrades) * 100;
  const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  // Drawdown calculations
  let peakEquity = initialEquity;
  let maxDrawdown = 0;
  let equityCurve = [initialEquity];

  trades.forEach(trade => {
    const newEquity = equityCurve[equityCurve.length - 1] + trade.pnl!;
    equityCurve.push(newEquity);
    if (newEquity > peakEquity) {
      peakEquity = newEquity;
    }
    const drawdown = ((peakEquity - newEquity) / peakEquity) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  const currentDrawdown = ((peakEquity - currentEquity) / peakEquity) * 100;

  // Consecutive wins/losses
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let currentConsecutiveWins = 0;
  let currentConsecutiveLosses = 0;

  trades.forEach(trade => {
    if (trade.pnl! > 0) {
      currentConsecutiveWins++;
      currentConsecutiveLosses = 0;
      if (currentConsecutiveWins > consecutiveWins) {
        consecutiveWins = currentConsecutiveWins;
      }
    } else if (trade.pnl! < 0) {
      currentConsecutiveLosses++;
      currentConsecutiveWins = 0;
      if (currentConsecutiveLosses > consecutiveLosses) {
        consecutiveLosses = currentConsecutiveLosses;
      }
    }
  });

  return {
    totalPnl: grossProfit - grossLoss,
    winRate,
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    averageWin,
    averageLoss,
    profitFactor,
    maxDrawdown,
    currentDrawdown,
    grossProfit,
    grossLoss,
    consecutiveWins,
    consecutiveLosses,
  };
};
