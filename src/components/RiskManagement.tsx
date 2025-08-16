import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingState, Trade } from '../trading/types';
import { propFirms } from '../data/propFirms';

interface QuestionnaireAnswers {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  propFirm: string;
  accountType: string;
  accountSize: number | string;
  riskPercentage: number;
}

interface RiskManagementProps {
  tradingState: TradingState | null;
}

const RiskManagement: React.FC<RiskManagementProps> = ({ tradingState }) => {
  const navigate = useNavigate();
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [positionSize, setPositionSize] = useState<number | null>(null);
  const [detailedView, setDetailedView] = useState(false);
  const [editableRiskSettings, setEditableRiskSettings] = useState(tradingState?.riskSettings);
  const [tradeFilter, setTradeFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trade; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    const savedAnswers = localStorage.getItem('questionnaireAnswers');
    if (savedAnswers) {
      const parsedAnswers = JSON.parse(savedAnswers);
      setQuestionnaireAnswers(parsedAnswers);
      const generatedSettings = generateRiskSettings(parsedAnswers);
      if (generatedSettings) {
        setEditableRiskSettings(generatedSettings);
      }
    }
  }, []);

  const generateRiskSettings = (answers: QuestionnaireAnswers) => {
    if (!answers) return null;
    const firm = propFirms.find(f => f.name === answers.propFirm);
    if (!firm) return null;

    const profitTarget = parseFloat(firm.profitTargets.split(',')[0].replace(/[^0-9.]/g, ''));
    const maxLoss = parseFloat(firm.maximumLoss.replace(/[^0-9.]/g, ''));
    const accountSize = typeof answers.accountSize === 'number' ? answers.accountSize : parseFloat(answers.accountSize);

    const riskAmount = accountSize * (answers.riskPercentage / 100);
    const profitAmount = riskAmount * 2; // Assuming a 1:2 risk-reward ratio

    const tradesToPass = Math.ceil((accountSize * (profitTarget / 100)) / profitAmount);

    return {
      riskPerTrade: answers.riskPercentage,
      dailyLossLimit: parseFloat(firm.dailyLossLimit.replace(/[^0-9.]/g, '')),
      maxLoss,
      profitTarget,
      tradesToPass,
      riskAmount,
      profitAmount,
      consecutiveLossesLimit: 3, // Default value
    };
  };

  if (!tradingState || !editableRiskSettings) {
    return <div>Loading...</div>;
  }

  const riskSettings = editableRiskSettings;
  const equityFromQuestionnaire = questionnaireAnswers?.hasAccount === 'yes' ? parseFloat(questionnaireAnswers.accountEquity as string) : null;
  const currentEquity = equityFromQuestionnaire ?? tradingState.currentEquity;

  const calculatePositionSize = () => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    if (isNaN(entry) || isNaN(sl) || sl >= entry) {
      alert('Please enter valid entry and stop loss prices.');
      return;
    }

    const riskAmount = currentEquity * (riskSettings.riskPerTrade / 100);
    const pipsAtRisk = (entry - sl) / 0.0001; // Simplified for non-JPY pairs
    const position = riskAmount / (pipsAtRisk * 10); // Simplified calculation
    setPositionSize(position);
  };

  const dailyRiskUsed = tradingState.dailyStats.pnl < 0 ? Math.abs(tradingState.dailyStats.pnl) : 0;
  const maxDailyRiskAmount = currentEquity * (riskSettings.dailyLossLimit / 100);
  const dailyRiskRemaining = maxDailyRiskAmount - dailyRiskUsed;
  const riskAmountPerTrade = currentEquity * (riskSettings.riskPerTrade / 100);
  const consecutiveLosses = tradingState.trades.slice(-riskSettings.consecutiveLossesLimit).filter(t => (t.pnl || 0) < 0).length;

  const exportToCSV = () => {
    const headers = [
      'Metric',
      'Value'
    ];

    const data = [
      ['Current Equity', currentEquity.toFixed(2)],
      ['Daily PnL', tradingState.dailyStats.pnl.toFixed(2)],
      ['Current Drawdown', tradingState.performanceMetrics.currentDrawdown.toFixed(2)],
      ['Max Drawdown', tradingState.performanceMetrics.maxDrawdown.toFixed(2)],
      ['Remaining Daily Risk', dailyRiskRemaining.toFixed(2)],
      ['Risk Per Trade (%)', riskSettings.riskPerTrade.toFixed(2)],
      ['Daily Loss Limit (%)', riskSettings.dailyLossLimit.toFixed(2)],
      ['Max Consecutive Losses', riskSettings.consecutiveLossesLimit],
      ['Current Consecutive Losses', consecutiveLosses],
      ['Total PnL', tradingState.performanceMetrics.totalPnl.toFixed(2)],
      ['Profit Factor', tradingState.performanceMetrics.profitFactor.toFixed(2)],
      ['Win Rate (%)', tradingState.performanceMetrics.winRate.toFixed(2)],
      ['Average Win', tradingState.performanceMetrics.averageWin.toFixed(2)],
      ['Average Loss', tradingState.performanceMetrics.averageLoss.toFixed(2)],
      ['Trades Today', tradingState.dailyStats.trades],
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "risk_management_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableRiskSettings(prev => prev ? { ...prev, [name]: parseFloat(value) } : undefined);
  };

  const saveSettings = () => {
    if (editableRiskSettings) {
      // Here you would typically call an API to save the settings on the backend.
      console.log('Saving settings:', editableRiskSettings);
      alert('Settings saved.');
    }
  };

  const requestSort = (key: keyof Trade) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTrades = React.useMemo(() => {
    let sortableItems = [...tradingState.trades];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key]! > b[sortConfig.key]!) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tradingState.trades, sortConfig]);

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all risk management data? This action cannot be undone.')) {
      // Here you would typically call an API to reset the data on the backend.
      // For this example, we'll just log a message.
      console.log('Data reset requested.');
      alert('Data has been reset.');
    }
  };

  const handleAnalyze = () => {
    if (questionnaireAnswers) {
      const plan = generateRiskSettings(questionnaireAnswers);
      navigate('/risk-management-plan', { state: { answers: questionnaireAnswers, plan } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAnalyze}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Analyze and Build Plan
        </button>
      </div>
      <div className="flex justify-end mb-4 space-x-4">
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Export to CSV
        </button>
        <button
          onClick={() => setDetailedView(!detailedView)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
        >
          {detailedView ? 'Show Simple View' : 'Show Detailed View'}
        </button>
        <button
          onClick={resetData}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Reset Data
        </button>
      </div>

      {detailedView ? (
        <>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Current Risk Settings</h4>
                <p><span className="font-medium text-gray-300">Risk Per Trade:</span> {riskSettings.riskPerTrade.toFixed(2)}%</p>
                <p><span className="font-medium text-gray-300">Daily Loss Limit:</span> {riskSettings.dailyLossLimit.toFixed(2)}%</p>
                <p><span className="font-medium text-gray-300">Max Consecutive Losses:</span> {riskSettings.consecutiveLossesLimit}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 col-span-2">
                <h4 className="text-md font-semibold text-white mb-3">Edit Risk Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="number" name="riskPerTrade" value={editableRiskSettings.riskPerTrade} onChange={handleSettingsChange} className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                  <input type="number" name="dailyLossLimit" value={editableRiskSettings.dailyLossLimit} onChange={handleSettingsChange} className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                  <input type="number" name="consecutiveLossesLimit" value={editableRiskSettings.consecutiveLossesLimit} onChange={handleSettingsChange} className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg" />
                </div>
                <button onClick={saveSettings} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Save Settings
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">Dynamic Risk Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Daily Risk Status</h4>
                <p><span className="font-medium text-gray-300">Daily Risk Used:</span> ${dailyRiskUsed.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Max Daily Risk:</span> ${maxDailyRiskAmount.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Remaining Daily Risk:</span> ${dailyRiskRemaining.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Drawdown</h4>
                <p><span className="font-medium text-gray-300">Current Drawdown:</span> ${tradingState.performanceMetrics.currentDrawdown.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Max Drawdown:</span> ${tradingState.performanceMetrics.maxDrawdown.toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Trade Risk</h4>
                <p><span className="font-medium text-gray-300">Risk Amount Per Trade:</span> ${riskAmountPerTrade.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Consecutive Losses</h4>
                <p><span className="font-medium text-gray-300">Current Consecutive Losses:</span> {consecutiveLosses}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Profitability</h4>
                <p><span className="font-medium text-gray-300">Total PnL:</span> ${tradingState.performanceMetrics.totalPnl.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Profit Factor:</span> {tradingState.performanceMetrics.profitFactor.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Win/Loss</h4>
                <p><span className="font-medium text-gray-300">Win Rate:</span> {tradingState.performanceMetrics.winRate.toFixed(2)}%</p>
                <p><span className="font-medium text-gray-300">Avg Win:</span> ${tradingState.performanceMetrics.averageWin.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Avg Loss:</span> ${tradingState.performanceMetrics.averageLoss.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Daily Stats</h4>
                <p><span className="font-medium text-gray-300">Daily PnL:</span> ${tradingState.dailyStats.pnl.toFixed(2)}</p>
                <p><span className="font-medium text-gray-300">Trades Today:</span> {tradingState.dailyStats.trades}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Trade History</h3>
              <select value={tradeFilter} onChange={e => setTradeFilter(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded-lg">
                <option value="All">All</option>
                <option value="Stop Loss Hit">Stop Loss Hit</option>
                <option value="Target Hit">Target Hit</option>
                <option value="Breakeven">Breakeven</option>
                <option value="Manual Close">Manual Close</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-700">ID</th>
                    <th className="py-2 px-4 border-b border-gray-700">
                      <button onClick={() => requestSort('entryTime')}>Date</button>
                    </th>
                    <th className="py-2 px-4 border-b border-gray-700">Outcome</th>
                    <th className="py-2 px-4 border-b border-gray-700">
                      <button onClick={() => requestSort('pnl')}>PnL</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades
                    .filter(trade => tradeFilter === 'All' || trade.outcome === tradeFilter)
                    .map(trade => (
                      <tr key={trade.id}>
                        <td className="py-2 px-4 border-b border-gray-700">{trade.id}</td>
                        <td className="py-2 px-4 border-b border-gray-700">{new Date(trade.entryTime).toLocaleDateString()}</td>
                        <td className="py-2 px-4 border-b border-gray-700">{trade.outcome}</td>
                        <td className={`py-2 px-4 border-b border-gray-700 ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{(trade.pnl || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Position Sizing Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Entry Price"
                className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder="Stop Loss Price"
                className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={calculatePositionSize} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Calculate
              </button>
            </div>
            {positionSize !== null && (
              <div className="mt-4 text-center">
                <p className="text-lg text-white">Recommended Position Size:</p>
                <p className="text-2xl font-bold text-green-400">{positionSize.toFixed(2)} lots</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h4 className="text-md font-semibold text-white mb-2">Current Equity</h4>
              <p className="text-2xl font-bold text-green-400">${currentEquity.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h4 className="text-md font-semibold text-white mb-2">Daily PnL</h4>
              <p className={`text-2xl font-bold ${tradingState.dailyStats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${tradingState.dailyStats.pnl.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h4 className="text-md font-semibold text-white mb-2">Current Drawdown</h4>
              <p className="text-2xl font-bold text-red-400">${tradingState.performanceMetrics.currentDrawdown.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <h4 className="text-md font-semibold text-white mb-2">Remaining Daily Risk</h4>
              <p className="text-2xl font-bold text-yellow-400">${dailyRiskRemaining.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskManagement;
