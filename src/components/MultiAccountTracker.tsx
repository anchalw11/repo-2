import React, { useState } from 'react';
import { Building, TrendingUp, DollarSign, Target, Plus, Settings, Eye, AlertTriangle, X } from 'lucide-react';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { propFirms } from '../data/propFirms';

const MultiAccountTracker: React.FC = () => {
  const { accounts, addAccount } = useTradingPlan();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    propFirm: propFirms[0].name,
    accountSize: propFirms[0].accountSizes[0],
    phase: 'Challenge',
  });

  const handleAddAccount = () => {
    const firm = propFirms.find(f => f.name === newAccount.propFirm);
    if (firm) {
      const accountToAdd = {
        id: new Date().toISOString(),
        propFirm: firm.name,
        accountSize: newAccount.accountSize,
        currentBalance: newAccount.accountSize,
        phase: newAccount.phase as 'Challenge' | 'Verification' | 'Funded',
        profitTarget: (firm.profitTargets as any)[newAccount.phase.toLowerCase()] || 0,
        currentProfit: 0,
        dailyLoss: parseFloat(firm.dailyLossLimit.replace('%','')),
        maxDrawdown: parseFloat(firm.maximumLoss.replace('%','')),
        currentDrawdown: 0,
        tradingDays: 0,
        minTradingDays: parseInt(firm.minTradingDays),
        status: 'active' as 'active' | 'passed' | 'failed' | 'pending',
        lastUpdate: new Date(),
      };
      addAccount(accountToAdd);
      setShowAddAccount(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'text-blue-400 bg-blue-600/20';
    if (status === 'passed') return 'text-green-400 bg-green-600/20';
    if (status === 'failed') return 'text-red-400 bg-red-600/20';
    return 'text-yellow-400 bg-yellow-600/20';
  };

  const getPhaseColor = (phase: string) => {
    if (phase === 'Challenge') return 'text-orange-400 bg-orange-600/20';
    if (phase === 'Verification') return 'text-blue-400 bg-blue-600/20';
    return 'text-green-400 bg-green-600/20';
  };

  const calculateProgress = (current: number, target: number) => target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const totalAccountValue = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalProfit = accounts.reduce((sum, acc) => sum + acc.currentProfit, 0);

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
        .account-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
        .account-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Multi-Account Tracker</h1>
            <p className="page-subtitle">Monitor all your prop firm accounts in one place.</p>
          </div>
          <button onClick={() => setShowAddAccount(true)} className="action-btn flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Account</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="glass-panel p-4"><DollarSign className="w-6 h-6 text-blue-400 mb-2" /> <div className="text-2xl font-bold text-white">${totalAccountValue.toLocaleString()}</div><div className="text-sm text-gray-400">Total Value</div></div>
            <div className="glass-panel p-4"><TrendingUp className="w-6 h-6 text-green-400 mb-2" /> <div className="text-2xl font-bold text-white">${totalProfit.toLocaleString()}</div><div className="text-sm text-gray-400">Total Profit</div></div>
            <div className="glass-panel p-4"><Building className="w-6 h-6 text-purple-400 mb-2" /> <div className="text-2xl font-bold text-white">{accounts.length}</div><div className="text-sm text-gray-400">Active Accounts</div></div>
            <div className="glass-panel p-4"><Target className="w-6 h-6 text-yellow-400 mb-2" /> <div className="text-2xl font-bold text-white">{accounts.filter(a => a.phase === 'Funded').length}</div><div className="text-sm text-gray-400">Funded</div></div>
        </div>

        <div className="glass-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                {/* Card content here */}
              </div>
            ))}
          </div>
        </div>

        {showAddAccount && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-panel max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-semibold text-white">Add New Account</h4>
                <button onClick={() => setShowAddAccount(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prop Firm</label>
                  <select value={newAccount.propFirm} onChange={e => setNewAccount({ ...newAccount, propFirm: e.target.value, accountSize: propFirms.find(f=>f.name === e.target.value)!.accountSizes[0] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan">
                    {propFirms.map(firm => <option key={firm.id}>{firm.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Size</label>
                  <select value={newAccount.accountSize} onChange={e => setNewAccount({ ...newAccount, accountSize: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan">
                    {propFirms.find(f => f.name === newAccount.propFirm)?.accountSizes.map(size => <option key={size} value={size}>${size.toLocaleString()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Phase</label>
                  <select value={newAccount.phase} onChange={e => setNewAccount({ ...newAccount, phase: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan">
                    <option>Challenge</option>
                    <option>Verification</option>
                    <option>Funded</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setShowAddAccount(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors">Cancel</button>
                  <button onClick={handleAddAccount} className="flex-1 action-btn">Add Account</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MultiAccountTracker;
