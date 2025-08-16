import React from 'react';

const TradePerformance = ({ trades }: { trades: any[] }) => {
  const wins = trades.filter(t => t.status === 'target_hit').length;
  const losses = trades.filter(t => t.status === 'sl_hit').length;
  const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{trades.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Wins</div>
          <div className="stat-value" style={{ color: '#4caf50' }}>{wins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Losses</div>
          <div className="stat-value" style={{ color: '#f44336' }}>{losses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{winRate}%</div>
        </div>
      </div>
      <div className="trade-history">
        <h4 className="panel-title">Trade History</h4>
        <div className="trade-list">
          {trades.map(trade => (
            <div key={trade.id} className={`trade-item ${trade.status}`}>
              <div className="trade-symbol">{trade.symbol} ({trade.signalType})</div>
              <div className="trade-entry">Entry: {trade.entryPrice}</div>
              <div className="trade-sl">SL: {trade.stopLoss}</div>
              <div className="trade-tp">TP: {trade.takeProfit}</div>
              <div className="trade-analysis">Analysis: {trade.analysis}</div>
              <div className="trade-status">{trade.status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .trade-history { margin-top: 20px; }
        .trade-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
        .trade-item { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; align-items: center; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); }
        .trade-item.target_hit { background: rgba(76, 175, 80, 0.2); border-left: 4px solid #4caf50; }
        .trade-item.sl_hit { background: rgba(244, 67, 54, 0.2); border-left: 4px solid #f44336; }
        .trade-symbol { font-weight: bold; }
        .trade-status { text-transform: capitalize; font-weight: bold; }
      `}</style>
    </div>
  );
};

export default TradePerformance;
