import React, { useState, useEffect, useRef } from 'react';
import { Bot, Zap, TrendingUp, TrendingDown, Activity, Globe, Settings, Play, Pause, RefreshCw } from 'lucide-react';

interface ForexSignal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  confirmations: string[];
  timestamp: Date;
  analysis: string;
  sessionQuality: string;
  timeframe: string;
  status: 'active' | 'target_hit' | 'sl_hit';
  direction: 'bullish' | 'bearish';
  market: 'forex';
}

interface ForexSignalGeneratorProps {
  isBotRunning: boolean;
  setIsBotRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

const ForexSignalGenerator: React.FC<ForexSignalGeneratorProps> = ({ isBotRunning, setIsBotRunning }) => {
  const [isRunning, setIsRunning] = useState(isBotRunning);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [riskRewardRatio, setRiskRewardRatio] = useState(2.0);
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [logs, setLogs] = useState<Array<{message: string, type: string, timestamp: Date}>>([]);
  const [stats, setStats] = useState({
    activeSymbols: 0,
    liveSignals: 0,
    priceUpdates: 0,
    winRate: 0,
    bosCount: 0,
    chochCount: 0,
    orderBlocks: 0,
    fvgCount: 0,
    activeSignals: 0
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const forexSymbols = [
    'XAU/USD', 'XAG/USD', 'USOIL', 'US30', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY',
    'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CHF', 'EUR/CAD', 'GBP/AUD', 'GBP/CAD',
    'GBP/CHF', 'AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'CAD/CHF', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY'
  ];

  const timeframes = ['5m', '15m', '30m', '1h', '1d'];

  const addLog = (message: string, type: string = 'info') => {
    const newLog = {
      message,
      type,
      timestamp: new Date()
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const analyzeSymbolWithBackend = async (symbol: string, timeframe: string) => {
    addLog(`🔍 Analyzing ${symbol} on ${timeframe}...`, 'info');
    if (!timeframes.includes(timeframe)) {
      addLog(`❌ Invalid timeframe "${timeframe}" for Forex analysis. Skipping.`, 'error');
      return null;
    }
    try {
      const response = await fetch('http://localhost:3004/api/analyze-symbol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, timeframe }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || `HTTP ${response.status}`);
      }
      
      return result;

    } catch (error: any) {
      console.error(`Error analyzing ${symbol} with backend:`, error);
      addLog(`❌ Error analyzing ${symbol} on ${timeframe}: ${error.message}`, 'error');
      return null;
    }
  };

  const processSignal = (signal: any) => {
    const formattedSignal: ForexSignal = {
      id: `forex-signal-${signal.symbol}-${signal.timeframe}-${Date.now()}`,
      symbol: signal.symbol,
      signalType: signal.signalType,
      confidence: signal.confidence,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      riskReward: signal.primaryRiskReward || '1:2',
      confirmations: signal.confirmations,
      timestamp: new Date(signal.timestamp),
      analysis: signal.analysis,
      sessionQuality: signal.sessionQuality || 'N/A',
      timeframe: signal.timeframe,
      status: 'active',
      direction: signal.signalType === 'BUY' ? 'bullish' : 'bearish',
      market: 'forex',
    };

    const existingSignals = JSON.parse(localStorage.getItem('admin_generated_signals') || '[]');
    const signalForStorage = {
      ...formattedSignal,
      timestamp: formattedSignal.timestamp.toISOString()
    };
    existingSignals.unshift(signalForStorage);
    localStorage.setItem('admin_generated_signals', JSON.stringify(existingSignals.slice(0, 100)));
    
    const signalForUser = {
      id: Date.now(),
      text: `${signal.symbol}\n${signal.signalType} NOW\nEntry ${signal.entryPrice}\nStop Loss ${signal.stopLoss}\nTake Profit ${signal.takeProfit}\nConfidence ${signal.confidence}%\n\n${signal.analysis}`,
      timestamp: formattedSignal.timestamp.toISOString(),
      from: 'Forex Signal Generator',
      chat_id: 1,
      message_id: Date.now(),
      update_id: Date.now()
    };
    
    const existingMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
    existingMessages.unshift(signalForUser);
    localStorage.setItem('telegram_messages', JSON.stringify(existingMessages.slice(0, 100)));

    setStats(prev => ({
      ...prev,
      liveSignals: prev.liveSignals + 1,
      activeSignals: prev.activeSignals + 1,
      bosCount: prev.bosCount + (signal.confirmations.some((c: string) => c.includes('BOS')) ? 1 : 0),
      chochCount: prev.chochCount + (signal.confirmations.some((c: string) => c.includes('CHoCH')) ? 1 : 0),
      orderBlocks: prev.orderBlocks + (signal.confirmations.some((c: string) => c.includes('Order Block')) ? 1 : 0),
      fvgCount: prev.fvgCount + (signal.confirmations.some((c: string) => c.includes('Fair Value Gap')) ? 1 : 0)
    }));

    setSignals(prev => [formattedSignal, ...prev.slice(0, 19)]);
    
    addLog(`🎯 ${formattedSignal.signalType} signal for ${formattedSignal.symbol}: Confidence: ${formattedSignal.confidence}%`, 'success');
    
    window.dispatchEvent(new CustomEvent('newSignalGenerated', { 
      detail: signalForStorage 
    }));
  }

  const startAnalysis = async () => {
    if (!selectedSymbol || !selectedTimeframe) {
      addLog('⚠️ Please select a symbol and timeframe.', 'error');
      return;
    }

    setIsRunning(true);
    addLog('🚀 Forex analysis started.', 'success');
    addLog(`📊 Monitoring: ${selectedSymbol} | ${selectedTimeframe}`, 'info');

    const symbolsToAnalyze = selectedSymbol === 'ALL' ? forexSymbols : [selectedSymbol];
    const timeframesToAnalyze = selectedTimeframe === 'ALL' ? timeframes : [selectedTimeframe];

    const runAnalysis = async () => {
      if (!isRunningRef.current) return;

      addLog(`🔄 Starting new analysis cycle...`, 'info');

      for (const symbol of symbolsToAnalyze) {
        for (const timeframe of timeframesToAnalyze) {
          if (!isRunningRef.current) break;
          const result = await analyzeSymbolWithBackend(symbol, timeframe);
          
          if (result && result.signalType && result.signalType !== 'NEUTRAL') {
            processSignal(result);
          } else if (result) {
            addLog(`ℹ️ No signal for ${symbol} on ${timeframe}. Reason: ${result.analysis}`, 'info');
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        if (!isRunningRef.current) break;
      }

      setStats(prev => ({
        ...prev,
        priceUpdates: prev.priceUpdates + 1,
        activeSymbols: symbolsToAnalyze.length
      }));
    };

    await runAnalysis();
    
    intervalRef.current = setInterval(runAnalysis, 60000);
  };

  const stopAnalysis = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    addLog('⏹️ Forex analysis stopped.', 'warning');
  };

  const refreshSystem = () => {
    stopAnalysis();
    setSignals([]);
    setStats({
      activeSymbols: 0,
      liveSignals: 0,
      priceUpdates: 0,
      winRate: 0,
      bosCount: 0,
      chochCount: 0,
      orderBlocks: 0,
      fvgCount: 0,
      activeSignals: 0
    });
    addLog('🔄 Forex system refreshed.', 'success');
  };

  const copyTradeDetails = (signal: ForexSignal) => {
    const text = `Symbol: ${signal.symbol}\nType: ${signal.signalType}\nEntry: ${signal.entryPrice}\nStop Loss: ${signal.stopLoss}\nTake Profit: ${signal.takeProfit}\nConfidence: ${signal.confidence}%`;
    navigator.clipboard.writeText(text).then(() => {
      addLog('Trade details copied to clipboard!', 'success');
    });
  };

  useEffect(() => {
    addLog('💱 Forex SMC Signal Generator initialized', 'success');
    addLog('📊 Ready to generate forex trading signals', 'info');
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-600/80 text-white';
    if (confidence >= 70) return 'bg-yellow-600/80 text-white';
    return 'bg-red-600/80 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">💱</div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wider">Forex Signal Generator</h2>
              <p className="text-gray-400">Professional Smart Money Concepts for Forex Markets</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-gray-300">{isRunning ? 'Running' : 'Stopped'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-400" />
            Forex Trading Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Symbol</option>
                <option value="ALL" className="bg-blue-600 text-white font-bold">📊 ALL SYMBOLS</option>
                <optgroup label="🥇 Commodities">
                  <option value="XAU/USD">XAU/USD (Gold) ⭐</option>
                  <option value="XAG/USD">XAG/USD (Silver)</option>
                  <option value="USOIL">US Oil (WTI)</option>
                </optgroup>
                <optgroup label="📈 Stocks">
                  <option value="US30">US30</option>
                </optgroup>
                <optgroup label="💱 Forex Majors">
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="GBP/USD">GBP/USD</option>
                  <option value="USD/JPY">USD/JPY</option>
                  <option value="USD/CHF">USD/CHF</option>
                  <option value="AUD/USD">AUD/USD</option>
                  <option value="USD/CAD">USD/CAD</option>
                  <option value="NZD/USD">NZD/USD</option>
                </optgroup>
                <optgroup label="💱 Forex Crosses">
                  {forexSymbols.filter(s => !['XAU/USD', 'XAG/USD', 'USOIL', 'US30', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'].includes(s)).map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Timeframe</option>
                <option value="ALL" className="bg-blue-600 text-white font-bold">⏰ ALL TIMEFRAMES</option>
                {timeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={startAnalysis}
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Forex Analysis</span>
              </button>
              
              <button
                onClick={stopAnalysis}
                disabled={!isRunning}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Analysis</span>
              </button>
              
              <button
                onClick={refreshSystem}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh System</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Forex Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Active Symbols</div>
              <div className="text-lg font-bold text-blue-400">{stats.activeSymbols}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Live Signals</div>
              <div className="text-lg font-bold text-blue-400">{stats.liveSignals}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">BOS</div>
              <div className="text-lg font-bold text-blue-400">{stats.bosCount}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">CHoCH</div>
              <div className="text-lg font-bold text-blue-400">{stats.chochCount}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Order Blocks</div>
              <div className="text-lg font-bold text-blue-400">{stats.orderBlocks}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">FVG</div>
              <div className="text-lg font-bold text-blue-400">{stats.fvgCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-blue-400" />
          Live Forex Signals ({signals.length})
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto futuristic-scrollbar">
          {signals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Configure settings and start analysis for live forex signals</p>
              <p className="text-sm mt-2 opacity-70">Real-time SMC structure analysis with multi-API data</p>
            </div>
          ) : (
            signals.map(signal => (
              <div
                key={signal.id}
                className={`bg-gray-800/50 rounded-xl p-6 border-l-4 transition-all hover:bg-gray-700/50 ${
                  signal.direction === 'bullish' ? 'border-blue-400' : 'border-red-400'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {signal.direction === 'bullish' ? '🟢' : '🔴'}
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${
                        signal.direction === 'bullish' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {signal.signalType} {signal.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {signal.timeframe} • {signal.sessionQuality}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getConfidenceClass(signal.confidence)}`}>
                    {signal.confidence}% Confidence
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Entry</div>
                    <div className="text-blue-400 font-bold">{signal.entryPrice}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                    <div className="text-red-400 font-bold">{signal.stopLoss}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                    <div className="text-green-400 font-bold">{signal.takeProfit}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">R:R Ratio</div>
                    <div className="text-white font-bold">{signal.riskReward}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-300 mb-2">
                    📋 SMC Confirmations ({signal.confirmations.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {signal.confirmations.map((conf, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                      >
                        {conf}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <div className="text-sm font-semibold text-gray-300 mb-2">Analysis:</div>
                  <div className="text-gray-300 text-sm leading-relaxed">{signal.analysis}</div>
                </div>

                <button
                  onClick={() => copyTradeDetails(signal)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <span>📋</span>
                  <span>Copy Forex Trade Details</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📝 Forex System Logs</h3>
        <div className="bg-gray-800/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm futuristic-scrollbar">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-blue-400 font-bold">
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span className={`ml-2 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForexSignalGenerator;
