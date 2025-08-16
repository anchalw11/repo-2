import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, TrendingUp, TrendingDown, Target, Edit, Trash2, Eye, BarChart3, DollarSign, X } from 'lucide-react';
import TradingJournalEntry from './TradingJournalEntry';
import QuantumBacktester from './QuantumBacktester';

// (Keep the JournalEntry interface as is)
interface JournalEntry {
  id: string;
  dateTime: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  direction: 'long' | 'short';
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  rMultiple: number;
  preMarketConditions: string;
  keyLevels: string;
  marketSentiment: string;
  relevantNews: string;
  technicalSetup: string;
  strategyUsed: string;
  timeFrame: string;
  tradeManagement: string;
  emotionalState: string;
  planDeviations: string;
  entryTiming: 'excellent' | 'good' | 'average' | 'poor';
  exitTiming: 'excellent' | 'good' | 'average' | 'poor';
  profitLoss: number;
  profitLossPercentage: number;
  winRate: number;
  riskManagementScore: number;
  ruleAdherence: number;
  whatWentWell: string;
  mistakesMade: string;
  improvementAreas: string;
  actionItems: string;
  tradingStrategy: string;
  marketConditions: string;
  emotionalTags: string[];
  setupQuality: 'A' | 'B' | 'C';
  createdAt: string;
  updatedAt: string;
}

const TradingJournalDashboard: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState('journal');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem('trading_journal_entries');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
  }, []);

  useEffect(() => {
    localStorage.setItem('trading_journal_entries', JSON.stringify(entries));
  }, [entries]);

  const handleSaveEntry = (entry: JournalEntry) => {
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    } else {
      setEntries(prev => [entry, ...prev]);
    }
    setEditingEntry(null);
    setShowEntryModal(false);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tradingStrategy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTrades = entries.length;
  const winningTrades = entries.filter(e => e.profitLoss > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnL = entries.reduce((sum, e) => sum + e.profitLoss, 0);
  const avgRMultiple = totalTrades > 0 ? entries.reduce((sum, e) => sum + e.rMultiple, 0) / totalTrades : 0;

  const stats = [
    { label: 'Total Trades', value: totalTrades.toString(), icon: BookOpen, color: 'text-blue-400' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: Target, color: 'text-green-400' },
    { label: 'Total P&L', value: `$${totalPnL.toFixed(2)}`, icon: DollarSign, color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Avg R-Multiple', value: `${avgRMultiple.toFixed(2)}R`, icon: BarChart3, color: 'text-purple-400' }
  ];

  const getQualityColor = (quality: string) => {
    if (quality === 'A') return 'text-green-400 bg-green-600/20';
    if (quality === 'B') return 'text-yellow-400 bg-yellow-600/20';
    return 'text-red-400 bg-red-600/20';
  };

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
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Trading Journal</h1>
            <p className="page-subtitle">Track, analyze, and improve your trading performance.</p>
          </div>
          <button onClick={() => { setEditingEntry(null); setShowEntryModal(true); }} className="action-btn flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Entry</span>
          </button>
        </div>

        <div className="filters-bar">
          <button onClick={() => setActiveTab('journal')} className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}>Journal</button>
          <button onClick={() => setActiveTab('backtester')} className={`tab-btn ${activeTab === 'backtester' ? 'active' : ''}`}>Backtester</button>
        </div>

        {activeTab === 'journal' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {stats.map((stat, index) => (
                <div key={index} className="glass-panel p-4">
                  <div className={`flex items-center justify-between mb-2 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="glass-panel">
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by symbol or strategy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-cyan"
                />
              </div>
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {entry.direction === 'long' ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                      <div>
                        <div className="text-lg font-bold text-white">{entry.symbol}</div>
                        <div className="text-xs text-gray-400">{new Date(entry.dateTime).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`font-semibold text-lg ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${entry.profitLoss.toFixed(2)}
                    </div>
                    <div className={`font-semibold text-lg ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.profitLoss > 0 ? 'Win' : 'Loss'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setSelectedEntry(entry)} className="p-2 text-gray-400 hover:text-white"><Eye size={18} /></button>
                      <button onClick={() => handleEditEntry(entry)} className="p-2 text-gray-400 hover:text-white"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="p-2 text-gray-400 hover:text-white"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'backtester' && <QuantumBacktester />}

        <TradingJournalEntry isOpen={showEntryModal} onClose={() => { setShowEntryModal(false); setEditingEntry(null); }} onSave={handleSaveEntry} editEntry={editingEntry} />

        {selectedEntry && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="page-title">{selectedEntry.symbol}</h2>
                <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              {/* Simplified view of the selected entry */}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TradingJournalDashboard;
