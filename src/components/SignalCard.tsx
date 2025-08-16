import React, { useState, useEffect } from 'react';
import { Signal } from '../trading/types';

interface SignalCardProps {
  signal: Signal;
  questionnaireData: {
    accountBalance: number;
    riskPercentage: number;
  };
  isTaken: boolean;
  isSkipped: boolean;
  dailyLossLimitHit: boolean;
  handleMarkAsTakenClick: (signal: Signal) => void;
  handleSkipTrade: (signal: Signal) => void;
  cardClass: string;
  type: 'winning' | 'losing' | 'active' | 'skipped';
}

const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  questionnaireData,
  isTaken,
  isSkipped,
  dailyLossLimitHit,
  handleMarkAsTakenClick,
  handleSkipTrade,
  cardClass,
  type,
}) => {
  const [lotSize, setLotSize] = useState(0);

  useEffect(() => {
    const calculateLotSize = async () => {
      try {
        const response = await fetch('http://localhost:3002/calculate-lot-size', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountCurrency: 'USD', // Assuming USD for now
            balance: questionnaireData.accountBalance,
            riskPercentage: questionnaireData.riskPercentage,
            stopLossPips: Math.abs(signal.entryPrice - signal.stopLoss) * 10000,
            pair: signal.pair,
          }),
        });
        const data = await response.json();
        if (data.lotSize) {
          setLotSize(data.lotSize);
        }
      } catch (error) {
        console.error('Error calculating lot size:', error);
      }
    };

    calculateLotSize();
  }, [signal, questionnaireData]);

  const cardClasses = [
    'signal-card',
    cardClass,
    isTaken ? 'taken-trade' : '',
    isSkipped ? 'skipped-trade' : '',
    dailyLossLimitHit ? 'limit-hit' : ''
  ].join(' ');

  return (
    <div key={signal.id} className={cardClasses}>
      <div>
        <div className="signal-header">
          <span className="signal-pair">{signal.pair}</span>
          <span className={`signal-type ${signal.direction.toLowerCase()}`}>{signal.direction}</span>
          <span style={{ color: 'var(--primary-green)', fontWeight: 600 }}>{signal.confidence}% Confidence</span>
          {signal.status && <span className={`signal-status ${signal.status.toLowerCase().replace(' ', '-')}`}>{signal.status}</span>}
        </div>
        {isSkipped ? (
          <div className="skipped-message">
            <div className="text-2xl font-bold text-gray-400">Trade Skipped</div>
            <div className="text-sm text-gray-500">This trade can no longer be taken.</div>
          </div>
        ) : (
          <div className="signal-details">
            <div className="signal-detail">
              <span className="detail-label">Entry</span>
              <span className="detail-value entry">{signal.entryPrice}</span>
            </div>
            <div className="signal-detail">
              <span className="detail-label">Stop Loss</span>
              <span className="detail-value sl">{signal.stopLoss}</span>
            </div>
            <div className="signal-detail">
              <span className="detail-label">Take Profit</span>
              <span className="detail-value tp">{signal.takeProfit}</span>
            </div>
            <div className="signal-detail">
              <span className="detail-label">R:R Ratio</span>
              <span className="detail-value" style={{ color: 'var(--primary-cyan)' }}>{signal.riskRewardRatio}</span>
            </div>
            <div className="signal-detail">
              <span className="detail-label">Lot Size</span>
              <span className="detail-value" style={{ color: 'var(--primary-purple)' }}>{lotSize.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="signal-footer">
          <p className="signal-description">{signal.description}</p>
          <span className="signal-time">{new Date(signal.timestamp).toLocaleString()}</span>
        </div>
      </div>
      {type === 'active' && !isSkipped && (
        <div className="flex flex-col space-y-2">
          <button className="action-btn" onClick={() => handleMarkAsTakenClick(signal)} disabled={isTaken || dailyLossLimitHit}>
            {isTaken ? 'Taken' : 'Mark as Taken'}
          </button>
          <button className="action-btn" style={{ background: 'var(--warning-yellow)'}} onClick={() => handleSkipTrade(signal)} disabled={isTaken || dailyLossLimitHit}>
            Skip Trade
          </button>
        </div>
      )}
    </div>
  );
};

export default SignalCard;
