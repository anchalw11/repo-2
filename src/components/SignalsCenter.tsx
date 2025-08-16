import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle, Filter, Shield, XCircle, CheckSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { lotSizeCalculator } from '../utils/lotSizeCalculator';
import { useUser } from '../contexts/UserContext';
import { Signal } from '../trading/types';

interface SignalsCenterProps {
  signals: Signal[];
  handleTradeTaken: (signal: Signal) => void;
}

const SignalsCenter: React.FC<SignalsCenterProps> = ({ signals, handleTradeTaken }) => {
  const { user } = useUser();



  if (signals.length === 0) {
    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
            <div className="text-white text-lg font-semibold mb-2">Awaiting New Signals</div>
            <div className="text-gray-400">The system is actively scanning the markets. Please check back shortly.</div>
        </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Signals Center</h3>
            <div className="flex items-center space-x-4">
                <select 
                  className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    // Filter by market type
                    const marketType = e.target.value;
                    // This will be handled by the parent component's filtering
                  }}
                >
                    <option value="all">All Markets</option>
                    <option value="crypto">Crypto</option>
                    <option value="forex">Forex</option>
                </select>
                <select className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Signals</option>
                    <option>Active</option>
                    <option>Closed</option>
                </select>
                <select className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Newest First</option>
                    <option>Highest Confidence</option>
                </select>
            </div>
        </div>
      <div className="bg-gray-800 border border-yellow-500/50 rounded-lg p-4 mb-4">
        <p className="text-yellow-300 text-sm">
          <strong>Note:</strong> Your performance analytics are based on the trades you mark as taken. Please click "Mark as Taken" for any trade you execute to ensure accurate tracking.
        </p>
      </div>
      <div className="space-y-4">
        {signals.map((signal) => (
            <div key={signal.id} className={`bg-gray-900 rounded-lg p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-white">{signal.pair}</span>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${ signal.direction === 'LONG' ? 'bg-green-500 text-white' : 'bg-red-500 text-white' }`}>
                    {signal.direction}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-x-8">
                  <div>
                    <p className="text-sm text-gray-400">Entry</p>
                    <p className="text-lg font-semibold text-white">{signal.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Stop Loss</p>
                    <p className="text-lg font-semibold text-red-500">{signal.stopLoss}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Take Profit</p>
                    <p className="text-lg font-semibold text-green-500">{signal.takeProfit}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleTradeTaken(signal)}
                    className="px-4 py-2 font-semibold rounded-lg flex items-center bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Taken
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalsCenter;
