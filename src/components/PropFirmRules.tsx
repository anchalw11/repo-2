import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Target, Clock, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle, Info } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';

interface PropFirmRulesProps {
  dashboardData?: any;
}

const PropFirmRules: React.FC<PropFirmRulesProps> = ({ dashboardData }) => {
  const { user } = useUser();
  const { propFirm, accountConfig } = useTradingPlan();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [_, setForceUpdate] = useState(0);

  useEffect(() => {
    setForceUpdate(fu => fu + 1);
  }, [selectedCategory]);

  // Use dashboardData if available, otherwise fallback to context
  const propFirmRules = dashboardData?.propFirmRules;
  const userProfile = dashboardData?.userProfile;
  
  if (!propFirmRules && !propFirm) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">No Trading Plan Found</h3>
          <p className="text-gray-400">Please complete the questionnaire to see your prop firm rules.</p>
        </div>
      </div>
    );
  }

  const currentPropFirmName = userProfile?.propFirm || propFirm?.name || 'Unknown Prop Firm';
  const currentAccountSize = userProfile?.accountSize || accountConfig?.size || 10000;
  const currentAccountType = userProfile?.accountType || accountConfig?.challengeType || 'Challenge';

  const ruleCategories = [
    { id: 'all', label: 'All Rules', icon: <Shield className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Management', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'profit', label: 'Profit Targets', icon: <Target className="w-4 h-4" /> },
    { id: 'time', label: 'Time Limits', icon: <Clock className="w-4 h-4" /> },
    { id: 'trading', label: 'Trading Rules', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const rules = [
    {
      id: 'daily-loss',
      category: 'risk',
      title: 'Daily Loss Limit',
      description: 'Maximum loss allowed in a single trading day',
      value: propFirmRules?.daily_loss_limit || propFirm?.dailyLossLimit || 'Not Set',
      status: 'safe',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-600',
    },
    {
      id: 'max-drawdown',
      category: 'risk',
      title: 'Maximum Drawdown',
      description: 'Maximum total loss from the highest equity peak',
      value: propFirmRules?.max_drawdown || propFirm?.maximumLoss || 'Not Set',
      status: 'safe',
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/20',
      borderColor: 'border-orange-600',
    },
    {
      id: 'profit-target',
      category: 'profit',
      title: 'Profit Target Phase 1',
      description: 'Required profit to pass the challenge phase',
      value: propFirmRules?.profit_target_phase1 || propFirm?.profitTargets || 'Not Set',
      status: 'pending',
      icon: <Target className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-600',
    },
    {
      id: 'min-trading-days',
      category: 'time',
      title: 'Minimum Trading Days',
      description: 'Minimum number of days you must trade',
      value: propFirmRules?.min_trading_days || propFirm?.minTradingDays || 'Not Set',
      status: 'pending',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-600',
    },
    {
      id: 'overnight-positions',
      category: 'trading',
      title: 'Weekend Holding',
      description: 'Holding positions over the weekend',
      value: propFirmRules?.weekend_holding || propFirm?.overnightPositions || 'Not Set',
      status: 'info',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-600',
    },
    {
      id: 'news-trading',
      category: 'trading',
      title: 'News Trading',
      description: 'Trading during high-impact news events',
      value: propFirmRules?.news_trading || propFirm?.newsTrading || 'Not Set',
      status: 'info',
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-600',
    },
  ];

  const filteredRules = selectedCategory === 'all'
    ? rules 
    : rules.filter(rule => rule.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <>
      <style>{`
        :root {
            --primary-cyan: #00ffff;
            --primary-green: #00ff88;
            --primary-purple: #8b5cf6;
            --primary-pink: #ec4899;
            --danger-red: #ff4444;
            --warning-yellow: #ffaa00;
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
            flex-wrap: wrap;
        }
        .tab-btn {
            padding: 12px 24px;
            background: transparent;
            border: 1px solid var(--border-glow);
            color: white;
            border-radius: 12px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .tab-btn.active {
            background: var(--primary-green);
            color: var(--bg-dark);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        .glass-panel {
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glow);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .rule-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
        .rule-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
      `}</style>
      <div id="prop-firm-rules-page" className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">{currentPropFirmName} Rules</h1>
            <p className="page-subtitle">
              Account Size: ${currentAccountSize.toLocaleString()} • Challenge Type: {accountConfig?.challengeType || '2-step'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Compliance Status</div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">All Rules Compliant</span>
            </div>
          </div>
        </div>

        <div className="filters-bar">
          {ruleCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`tab-btn ${selectedCategory === category.id ? 'active' : ''}`}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.map(rule => (
              <div key={rule.id} className={`rule-card border ${rule.borderColor}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${rule.bgColor}`}>
                      <div className={rule.color}>
                        {rule.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                      <p className="text-sm text-gray-400">{rule.description}</p>
                    </div>
                  </div>
                  {getStatusIcon(rule.status)}
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-white">{rule.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex items-center space-x-2 text-blue-400 mb-4">
            <Info className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Risk Management Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="text-white font-medium mb-2">Daily Loss Management</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Never risk more than 1-2% per trade</li>
                <li>Set daily loss limits at 3-4% maximum</li>
                <li>Stop trading after 2-3 consecutive losses</li>
                <li>Use proper position sizing always</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Drawdown Protection</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Monitor your highest balance daily</li>
                <li>Reduce position sizes as you approach limits</li>
                <li>Use trailing stops to protect profits</li>
                <li>Never add to losing positions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropFirmRules;
