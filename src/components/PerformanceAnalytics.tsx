import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TradingState } from '../trading/types';

interface PerformanceAnalyticsProps {
  tradingState: TradingState | null;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ tradingState }) => {
  const [timeframe, setTimeframe] = React.useState('ALL');

  if (!tradingState || tradingState.trades.length === 0) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Performance Analytics</h1>
            <p className="page-subtitle">No trading data available.</p>
          </div>
        </div>
        <div className="glass-panel">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Start trading to see your performance analysis.</div>
          </div>
        </div>
      </div>
    );
  }

  const { trades } = tradingState;

  const equityData = trades.map(trade => ({
    name: new Date(trade.entryTime).toLocaleDateString(),
    equity: trade.equityAfter || 0,
  }));

  const monthlyPnl = trades.reduce((acc, trade) => {
    const month = new Date(trade.entryTime).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + (trade.pnl || 0);
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.keys(monthlyPnl).map(month => ({
    name: month,
    pnl: monthlyPnl[month],
  }));

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
        .recharts-text {
            fill: #A0AEC0;
        }
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Performance Analytics</h1>
            <p className="page-subtitle">Real-time analysis of your trading performance</p>
          </div>
        </div>

        <div className="filters-bar">
          <button onClick={() => setTimeframe('1D')} className={`tab-btn ${timeframe === '1D' ? 'active' : ''}`}>1D</button>
          <button onClick={() => setTimeframe('1W')} className={`tab-btn ${timeframe === '1W' ? 'active' : ''}`}>1W</button>
          <button onClick={() => setTimeframe('1M')} className={`tab-btn ${timeframe === '1M' ? 'active' : ''}`}>1M</button>
          <button onClick={() => setTimeframe('ALL')} className={`tab-btn ${timeframe === 'ALL' ? 'active' : ''}`}>ALL</button>
        </div>

        <div className="glass-panel">
          <h3 className="text-xl font-semibold text-white mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid var(--border-glow)' }} />
              <Legend wrapperStyle={{ color: '#A0AEC0' }} />
              <Line type="monotone" dataKey="equity" stroke="var(--primary-cyan)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel">
          <h3 className="text-xl font-semibold text-white mb-4">Monthly Performance (PNL)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid var(--border-glow)' }} />
              <Legend wrapperStyle={{ color: '#A0AEC0' }} />
              <Bar dataKey="pnl" fill="var(--primary-green)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default PerformanceAnalytics;
