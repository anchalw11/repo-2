// src/trading/dataStorage.ts

import { TradingState } from './types';
import api from '../api';

/**
 * Saves the trading state to the server.
 * @param state The trading state to save.
 */
export const saveState = async (state: TradingState): Promise<void> => {
  try {
    // Save to localStorage for persistence
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId) {
      localStorage.setItem(`trading_state_${userId}`, JSON.stringify(state));
    }
    
    // Also try to save to server
    try {
      await api.post('/api/trading-state', state);
    } catch (error) {
      console.warn('Failed to save to server, using localStorage only:', error);
    }
  } catch (error) {
    console.error("Error saving state to server:", error);
  }
};

/**
 * Loads the trading state from the server.
 * @returns The loaded trading state or null if not found or error.
 */
export const loadState = async (): Promise<TradingState | null> => {
  try {
    // Try to load from localStorage first
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId) {
      const localState = localStorage.getItem(`trading_state_${userId}`);
      if (localState) {
        const parsed = JSON.parse(localState);
        // Convert date strings back to Date objects
        if (parsed.trades) {
          parsed.trades = parsed.trades.map((trade: any) => ({
            ...trade,
            entryTime: new Date(trade.entryTime),
            closeTime: trade.closeTime ? new Date(trade.closeTime) : undefined
          }));
        }
        return parsed;
      }
    }
    
    // Fallback to server
    try {
      const response = await api.get('/api/trading-state');
      return response.data;
    } catch (error) {
      console.warn('Failed to load from server, using localStorage only:', error);
      return null;
    }
  } catch (error) {
    console.error("Error loading state from server:", error);
    return null;
  }
};

/**
 * Clears the trading state from the server.
 */
export const clearState = async (): Promise<void> => {
  try {
    // Clear from localStorage
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId) {
      localStorage.removeItem(`trading_state_${userId}`);
    }
    
    // Also try to clear from server
    try {
      await api.delete('/api/trading-state');
    } catch (error) {
      console.warn('Failed to clear from server:', error);
    }
  } catch (error) {
    console.error("Error clearing state from server:", error);
  }
};
