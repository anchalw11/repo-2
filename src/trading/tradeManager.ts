// src/trading/tradeManager.ts

import { v4 as uuidv4 } from 'uuid';
import { Signal, Trade, TradeOutcome, TradingState } from './types';
import { updateEquity } from './equityTracker';
import { calculatePerformanceMetrics } from './performanceCalculator';
import { calculatePositionSize } from './riskManager';
import { saveState } from './dataStorage';

/**
 * Creates a new trade from a signal and adds it to the open positions.
 * @param state The current trading state.
 * @param signal The signal to execute a trade on.
 * @returns The updated trading state.
 */
export const openTrade = (state: TradingState, signal: Signal): TradingState => {
  const riskAmount = calculatePositionSize(state);
  const rewardAmount = signal.rewardAmount || riskAmount * 2; // Default 2:1 reward/risk

  const newTrade: Trade = {
    id: uuidv4(),
    signalId: signal.id,
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    riskAmount,
    rewardAmount,
    status: 'open',
    entryTime: new Date(),
    equityBefore: state.currentEquity,
  };

  const newState: TradingState = {
    ...state,
    openPositions: [...state.openPositions, newTrade],
  };

  saveState(newState);
  return newState;
};

/**
 * Closes an open trade with a specific outcome.
 * @param state The current trading state.
 * @param tradeId The ID of the trade to close.
 * @param outcome The outcome of the trade.
 * @param manualPnl The P&L if the trade was closed manually.
 * @returns The updated trading state.
 */
export const closeTrade = (state: TradingState, tradeId: string, outcome: TradeOutcome, manualPnl?: number): TradingState => {
  const tradeToClose = state.openPositions.find((t: Trade) => t.id === tradeId);
  if (!tradeToClose) return state;

  let pnl = 0;
  switch (outcome) {
    case 'Stop Loss Hit':
      pnl = -tradeToClose.riskAmount;
      break;
    case 'Target Hit':
      pnl = tradeToClose.rewardAmount;
      break;
    case 'Breakeven':
      pnl = 0;
      break;
    case 'Manual Close':
      pnl = manualPnl || 0;
      break;
  }

  const closedTrade: Trade = {
    ...tradeToClose,
    status: 'closed',
    closeTime: new Date(),
    outcome,
    pnl,
    equityAfter: state.currentEquity + pnl,
  };

  const newCurrentEquity = updateEquity(state.currentEquity, closedTrade);

  const newState: TradingState = {
    ...state,
    currentEquity: newCurrentEquity,
    openPositions: state.openPositions.filter((t: Trade) => t.id !== tradeId),
    trades: [...state.trades, closedTrade],
    dailyStats: {
      ...state.dailyStats,
      pnl: state.dailyStats.pnl + pnl,
      trades: state.dailyStats.trades + 1,
    },
  };

  // Recalculate performance metrics
  newState.performanceMetrics = calculatePerformanceMetrics(newState.trades, newState.currentEquity, newState.initialEquity);

  saveState(newState);
  return newState;
};
