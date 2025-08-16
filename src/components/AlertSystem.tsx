import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown, AlertTriangle, Volume2, Mail, MessageSquare } from 'lucide-react';
import { marketDataService, PriceData as MarketPriceData } from '../services/marketData';

interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'technical' | 'news';
  condition: string;
  value: number;
  currentPrice?: number;
  isActive: boolean;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationMethods: ('email' | 'push' | 'sms' | 'sound')[];
}

interface PriceData {
  [symbol: string]: number;
}

const AlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<PriceData>({});
  const [recentTriggers, setRecentTriggers] = useState<Alert[]>([]);
  const [activeFilter, setActiveFilter] = useState('active');
  const [newAlert, setNewAlert] = useState({
    symbol: 'EURUSD',
    type: 'price' as const,
    condition: 'above',
    value: 0,
    notificationMethods: ['push', 'sound'] as ('email' | 'push' | 'sms' | 'sound')[]
  });

  const symbols = [
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'XAUUSD', label: 'XAU/USD (Gold)' },
    { value: 'AUDUSD', label: 'AUD/USD' },
    { value: 'BTCUSD', label: 'BTC/USD' }
  ];

  const conditions = [
    { value: 'above', label: 'Price Above' },
    { value: 'below', label: 'Price Below' },
    { value: 'crosses_up', label: 'Crosses Up' },
    { value: 'crosses_down', label: 'Crosses Down' }
  ];

  const notificationOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'push', label: 'Push', icon: Bell },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'sound', label: 'Sound', icon: Volume2 }
  ];

  useEffect(() => {
    marketDataService.initializeRealTimeData();

    const symbolsToWatch = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD', 'BTCUSD'];
    
    symbolsToWatch.forEach(symbol => {
      marketDataService.subscribeToSymbol(symbol, (data: MarketPriceData) => {
        setCurrentPrices(prevPrices => ({
          ...prevPrices,
          [symbol]: data.price
        }));
      });
    });

    return () => {
      marketDataService.destroy();
    };
  }, []);

  // Check alert conditions
  useEffect(() => {
    if (Object.keys(currentPrices).length === 0) return;

    alerts.forEach(alert => {
      if (!alert.isActive || alert.triggered) return;

      const currentPrice = currentPrices[alert.symbol];
      if (!currentPrice) return;

      let shouldTrigger = false;

      switch (alert.condition) {
        case 'above':
          shouldTrigger = currentPrice > alert.value;
          break;
        case 'below':
          shouldTrigger = currentPrice < alert.value;
          break;
        case 'crosses_up':
          // For simplicity, using current price > alert value
          shouldTrigger = currentPrice > alert.value;
          break;
        case 'crosses_down':
          // For simplicity, using current price < alert value
          shouldTrigger = currentPrice < alert.value;
          break;
      }

      if (shouldTrigger) {
        triggerAlert(alert.id, currentPrice);
      }
    });
  }, [currentPrices, alerts]);

  const triggerAlert = (alertId: string, triggeredPrice: number) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        const triggeredAlert = {
          ...alert,
          triggered: true,
          triggeredAt: new Date(),
          currentPrice: triggeredPrice
        };

        // Add to recent triggers
        setRecentTriggers(prevTriggers => [triggeredAlert, ...prevTriggers.slice(0, 4)]);

        // Send notifications
        sendNotifications(triggeredAlert);

        return triggeredAlert;
      }
      return alert;
    }));
  };

  const sendNotifications = (alert: Alert) => {
    alert.notificationMethods.forEach(method => {
      switch (method) {
        case 'sound':
          // Play notification sound
          if ('AudioContext' in window) {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
          }
          break;
        case 'push':
          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`TraderEdge Pro Alert: ${alert.symbol}`, {
              body: `${alert.symbol} ${alert.condition} ${alert.value} - Current: ${alert.currentPrice}`,
              icon: '/favicon.ico'
            });
          }
          break;
        case 'email':
          console.log('Email notification sent for alert:', alert.id);
          break;
        case 'sms':
          console.log('SMS notification sent for alert:', alert.id);
          break;
      }
    });
  };

  const createAlert = () => {
    if (newAlert.value <= 0) {
      window.alert('Please enter a valid price level');
      return;
    }

    const newAlertObject: Alert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol,
      type: newAlert.type,
      condition: newAlert.condition,
      value: newAlert.value,
      isActive: true,
      triggered: false,
      createdAt: new Date(),
      notificationMethods: newAlert.notificationMethods
    };

    setAlerts(prev => [...prev, newAlertObject]);
    setShowCreateAlert(false);
    setNewAlert({ 
      symbol: 'EURUSD', 
      type: 'price', 
      condition: 'above', 
      value: 0,
      notificationMethods: ['push', 'sound']
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const resetAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, triggered: false, triggeredAt: undefined, currentPrice: undefined } : alert
    ));
  };

  const getSymbolLabel = (symbol: string) => {
    return symbols.find(s => s.value === symbol)?.label || symbol;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'active') return alert.isActive && !alert.triggered;
    if (activeFilter === 'triggered') return alert.triggered;
    if (activeFilter === 'paused') return !alert.isActive;
    return true;
  });

  return (
    <>
      <style>{`
        :root {
            --primary-cyan: #00ffff;
            --primary-green: #00ff88;
            --bg-dark: #0a0a0f;
            --bg-panel: rgba(15, 15, 35, 0.6);
            --border-glow: rgba(0, 255, 136, 0.3);
        }
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid var(--border-glow);
        }
        .page-title {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .page-subtitle {
            color: rgba(255, 255, 255, 0.6);
            margin-top: 5px;
        }
        .filters-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }
        .tab-btn {
            padding: 10px 20px;
            background: transparent;
            border: 1px solid var(--border-glow);
            color: white;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .tab-btn.active {
            background: var(--primary-green);
            color: var(--bg-dark);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }
        .glass-panel {
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glow);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .action-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, var(--primary-green), var(--primary-cyan));
            border: none;
            border-radius: 12px;
            color: var(--bg-dark);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .alert-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Alert System</h1>
            <p className="page-subtitle">Create and manage real-time market alerts.</p>
          </div>
          <button onClick={() => setShowCreateAlert(true)} className="action-btn flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Alert</span>
          </button>
        </div>

        <div className="filters-bar">
          <button onClick={() => setActiveFilter('active')} className={`tab-btn ${activeFilter === 'active' ? 'active' : ''}`}>Active</button>
          <button onClick={() => setActiveFilter('triggered')} className={`tab-btn ${activeFilter === 'triggered' ? 'active' : ''}`}>Triggered</button>
          <button onClick={() => setActiveFilter('paused')} className={`tab-btn ${activeFilter === 'paused' ? 'active' : ''}`}>Paused</button>
        </div>

        <div className="glass-panel">
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className={`alert-card p-4 border transition-all ${
                alert.triggered ? 'border-red-500 bg-red-500/10' : 
                alert.isActive ? 'border-green-500/50' : 'border-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.triggered ? 'bg-red-500 animate-pulse' :
                      alert.isActive ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <div className="text-white font-medium">{getSymbolLabel(alert.symbol)}</div>
                      <div className="text-sm text-gray-400">
                        {conditions.find(c => c.value === alert.condition)?.label} {alert.value}
                        {currentPrices[alert.symbol] && (
                          <span className="ml-2 text-blue-400">
                            (Current: {currentPrices[alert.symbol].toFixed(alert.symbol.includes('JPY') ? 3 : 5)})
                          </span>
                        )}
                      </div>
                      {alert.triggeredAt && (
                        <div className="text-xs text-red-400">
                          Triggered at {alert.triggeredAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alert.triggered && (
                      <button
                        onClick={() => resetAlert(alert.id)}
                        className="px-3 py-1 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 rounded text-sm transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        alert.isActive 
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                    >
                      {alert.isActive ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showCreateAlert && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-panel max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-white">Create Price Alert</h4>
                <button
                  onClick={() => setShowCreateAlert(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trading Pair</label>
                  <select
                    value={newAlert.symbol}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, symbol: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan"
                  >
                    {symbols.map(symbol => (
                      <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Alert Condition</label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan"
                  >
                    {conditions.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Price Level
                    {currentPrices[newAlert.symbol] && (
                      <span className="text-blue-400 ml-2">
                        (Current: {currentPrices[newAlert.symbol].toFixed(newAlert.symbol.includes('JPY') ? 3 : 5)})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step={newAlert.symbol.includes('JPY') ? "0.001" : "0.00001"}
                    value={newAlert.value || ''}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan"
                    placeholder="Enter price level"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Notification Methods</label>
                  <div className="space-y-2">
                    {notificationOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAlert.notificationMethods.includes(option.value as any)}
                          onChange={(e) => {
                            const method = option.value as any;
                            setNewAlert(prev => ({
                              ...prev,
                              notificationMethods: e.target.checked
                                ? [...prev.notificationMethods, method]
                                : prev.notificationMethods.filter(m => m !== method)
                            }));
                          }}
                          className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <option.icon className="w-4 h-4" />
                          <span className="text-white">{option.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={createAlert}
                    disabled={newAlert.value <= 0 || newAlert.notificationMethods.length === 0}
                    className="flex-1 action-btn"
                  >
                    Create Alert
                  </button>
                  <button
                    onClick={() => setShowCreateAlert(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AlertSystem;
