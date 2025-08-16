// src/trading/equityTracker.ts

import { Trade } from './types';

/**
 * Updates the equity based on the result of a single trade.
 * @param currentEquity The equity before the trade.
 * @param trade The trade that was just closed.
 * @returns The new equity after the trade.
 */
export const updateEquity = (currentEquity: number, trade: Trade): number => {
  if (trade.pnl === undefined) {
    return currentEquity;
  }
  return currentEquity + trade.pnl;
};

/**
 * Calculates the unrealized P&L for all open positions.
 * This would typically require a live price feed.
 * For this simulation, we might need to simplify or mock this.
 * @param openPositions An array of open trades.
 * @param currentPrices A map of current prices for the pairs in open positions.
 * @returns The total unrealized P&L.
 */
export const calculateUnrealizedPnl = (openPositions: Trade[], currentPrices: { [pair: string]: number }): number => {
  return openPositions.reduce((totalPnl, trade) => {
    const currentPrice = currentPrices[trade.pair];
    if (!currentPrice) return totalPnl;

    let pnl = 0;
    if (trade.direction === 'LONG') {
      pnl = (currentPrice - trade.entryPrice) * 1; // Simplified calculation
    } else {
      pnl = (trade.entryPrice - currentPrice) * 1; // Simplified calculation
    }
    return totalPnl + pnl;
  }, 0);
};
