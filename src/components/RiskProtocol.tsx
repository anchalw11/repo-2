import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Target, TrendingDown, DollarSign, Calendar, TrendingUp, BarChart3, Info, CheckCircle, Clock, Building } from 'lucide-react';

interface RiskProtocolProps {
  dashboardData?: any;
}

const RiskProtocol: React.FC<RiskProtocolProps> = ({ dashboardData }) => {
  const [comprehensivePlan, setComprehensivePlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load comprehensive risk management plan from multiple sources
    const loadComprehensivePlan = () => {
      try {
        // Try to load from localStorage first
        const savedPlan = localStorage.getItem('comprehensive_plan');
        const questionnaireAnswers = localStorage.getItem('questionnaireAnswers');
        
        let planData = null;
        let questionnaireData = null;
        
        if (savedPlan) {
          planData = JSON.parse(savedPlan);
        }
        
        if (questionnaireAnswers) {
          questionnaireData = JSON.parse(questionnaireAnswers);
        }

        // Use dashboardData if available, otherwise use localStorage data
        const riskProtocol = dashboardData?.riskProtocol || planData?.risk_calculations;
        const userProfile = dashboardData?.userProfile || questionnaireData;
        const propFirmAnalysis = planData?.prop_firm_analysis;
        const detailedTrades = planData?.detailed_trades;
        const successProjections = planData?.success_projections;

        setComprehensivePlan({
          riskProtocol,
          userProfile,
          propFirmAnalysis,
          detailedTrades,
          successProjections,
          planData
        });
      } catch (error) {
        console.error('Error loading comprehensive plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComprehensivePlan();
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-400 animate-pulse">Loading your risk management plan...</div>
      </div>
    );
  }

  if (!comprehensivePlan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">No Risk Management Plan Found</h3>
          <p className="text-gray-400">Please complete the questionnaire to generate your personalized risk management plan.</p>
        </div>
      </div>
    );
  }

  const { riskProtocol, userProfile, propFirmAnalysis, detailedTrades, successProjections, planData } = comprehensivePlan;

  const riskRules = [
    {
      id: 'max-position-size',
      title: 'Max Position Size',
      description: 'Maximum size for a single position, relative to account balance.',
      value: riskProtocol?.max_position_size || userProfile?.riskPercentage ? `${userProfile.riskPercentage}%` : '2%',
      icon: Shield,
      color: 'text-green-400',
    },
    {
      id: 'max-daily-risk',
      title: 'Max Daily Risk',
      description: 'Maximum percentage of account to risk in a single day.',
      value: riskProtocol?.max_daily_risk ? `$${riskProtocol.max_daily_risk.toFixed(2)}` : `${parseFloat(userProfile?.riskPercentage || '2') * 3}%`,
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      id: 'max-weekly-drawdown',
      title: 'Max Weekly Drawdown',
      description: 'Maximum drawdown allowed in a single week to protect capital.',
      value: riskProtocol?.max_weekly_drawdown || '5%',
      icon: TrendingDown,
      color: 'text-orange-400',
    },
    {
      id: 'min-rr-ratio',
      title: 'Minimum R:R Ratio',
      description: 'Minimum risk-to-reward ratio required for entering a trade.',
      value: riskProtocol?.min_rr_ratio || userProfile?.riskReward || '1:2.5',
      icon: Target,
      color: 'text-blue-400',
    },
  ];

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
        .rule-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
        .rule-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: white;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metric-card {
            background: linear-gradient(135deg, rgba(30, 30, 60, 0.8), rgba(40, 40, 70, 0.8));
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 12px;
            padding: 15px;
            text-align: center;
        }
        .trade-row {
            background: rgba(20, 20, 40, 0.6);
            border: 1px solid rgba(0, 255, 136, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
            align-items: center;
        }
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Complete Risk Management Plan</h1>
            <p className="page-subtitle">Your comprehensive trading strategy and risk protocol.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Plan Status</div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Active & Compliant</span>
            </div>
          </div>
        </div>

        {/* Account & Prop Firm Overview */}
        <div className="glass-panel">
          <h2 className="section-title">
            <Building className="w-6 h-6 text-blue-400" />
            Account & Prop Firm Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="metric-card">
              <div className="text-2xl font-bold text-blue-400">{userProfile?.propFirm || 'Not Set'}</div>
              <div className="text-sm text-gray-400">Prop Firm</div>
            </div>
            <div className="metric-card">
              <div className="text-2xl font-bold text-green-400">
                ${userProfile?.accountSize ? parseInt(userProfile.accountSize).toLocaleString() : 'Not Set'}
              </div>
              <div className="text-sm text-gray-400">Account Size</div>
            </div>
            <div className="metric-card">
              <div className="text-2xl font-bold text-purple-400">{userProfile?.accountType || 'Not Set'}</div>
              <div className="text-sm text-gray-400">Challenge Type</div>
            </div>
          </div>

          {propFirmAnalysis?.extracted_rules && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="metric-card">
                <div className="text-lg font-bold text-red-400">{propFirmAnalysis.extracted_rules.daily_loss_limit}</div>
                <div className="text-sm text-gray-400">Daily Loss Limit</div>
              </div>
              <div className="metric-card">
                <div className="text-lg font-bold text-orange-400">{propFirmAnalysis.extracted_rules.max_drawdown}</div>
                <div className="text-sm text-gray-400">Max Drawdown</div>
              </div>
              <div className="metric-card">
                <div className="text-lg font-bold text-green-400">{propFirmAnalysis.extracted_rules.profit_target_phase1}</div>
                <div className="text-sm text-gray-400">Profit Target</div>
              </div>
              <div className="metric-card">
                <div className="text-lg font-bold text-blue-400">{propFirmAnalysis.extracted_rules.min_trading_days} days</div>
                <div className="text-sm text-gray-400">Min Trading Days</div>
              </div>
              <div className="metric-card">
                <div className="text-lg font-bold text-purple-400">{propFirmAnalysis.extracted_rules.news_trading}</div>
                <div className="text-sm text-gray-400">News Trading</div>
              </div>
              <div className="metric-card">
                <div className="text-lg font-bold text-cyan-400">{propFirmAnalysis.extracted_rules.weekend_holding}</div>
                <div className="text-sm text-gray-400">Weekend Holding</div>
              </div>
            </div>
          )}
        </div>

        {/* Risk Parameters */}
        <div className="glass-panel">
          <h2 className="section-title">
            <Shield className="w-6 h-6 text-green-400" />
            Risk Management Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskRules.map(rule => (
              <div key={rule.id} className="rule-card">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gray-800 ${rule.color}`}>
                    <rule.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                  </div>
                </div>
                <div className="text-right mt-4">
                  <span className={`text-2xl font-bold ${rule.color}`}>{rule.value}</span>
                </div>
              </div>
            ))}
          </div>

          {riskProtocol && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="metric-card">
                <div className="text-xl font-bold text-blue-400">
                  ${riskProtocol.max_daily_risk?.toFixed(2) || 'Not Set'}
                </div>
                <div className="text-sm text-gray-400">Max Daily Risk ($)</div>
              </div>
              <div className="metric-card">
                <div className="text-xl font-bold text-green-400">
                  ${riskProtocol.risk_per_trade?.toFixed(2) || 'Not Set'}
                </div>
                <div className="text-sm text-gray-400">Risk Per Trade ($)</div>
              </div>
              <div className="metric-card">
                <div className="text-xl font-bold text-purple-400">
                  {riskProtocol.daily_risk_utilization || 'Not Set'}
                </div>
                <div className="text-sm text-gray-400">Daily Risk Utilization</div>
              </div>
            </div>
          )}
        </div>

        {/* Success Projections */}
        {successProjections && (
          <div className="glass-panel">
            <h2 className="section-title">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Success Projections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="text-2xl font-bold text-blue-400">{successProjections.days_to_pass_phase1} days</div>
                <div className="text-sm text-gray-400">Days to Pass Phase 1</div>
              </div>
              <div className="metric-card">
                <div className="text-2xl font-bold text-purple-400">{successProjections.days_to_pass_phase2} days</div>
                <div className="text-sm text-gray-400">Days to Pass Phase 2</div>
              </div>
              <div className="metric-card">
                <div className="text-2xl font-bold text-green-400">${successProjections.daily_profit_potential?.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Daily Profit Potential</div>
              </div>
              <div className="metric-card">
                <div className="text-2xl font-bold text-orange-400">${successProjections.expected_daily_pnl?.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Expected Daily P&L</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Trade Plan */}
        {detailedTrades && detailedTrades.length > 0 && (
          <div className="glass-panel">
            <h2 className="section-title">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Detailed Trade-by-Trade Plan
            </h2>
            <div className="space-y-2">
              <div className="trade-row font-semibold text-gray-300 border-b border-gray-600 pb-2">
                <div>Trade</div>
                <div>Asset</div>
                <div>Risk Amount</div>
                <div>Profit Target</div>
              </div>
              {detailedTrades.slice(0, 10).map((trade: any, index: number) => (
                <div key={index} className="trade-row">
                  <div className="text-white font-medium">{trade.trade}</div>
                  <div className="text-blue-400">{trade.asset}</div>
                  <div className="text-red-400">${trade.risk_amount}</div>
                  <div className="text-green-400">${trade.profit_target}</div>
                </div>
              ))}
              {detailedTrades.length > 10 && (
                <div className="text-center text-gray-400 text-sm mt-4">
                  ... and {detailedTrades.length - 10} more trades in your complete plan
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Management Tips */}
        <div className="glass-panel">
          <h2 className="section-title">
            <Info className="w-6 h-6 text-blue-400" />
            Risk Management Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Daily Risk Management</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Never risk more than {userProfile?.riskPercentage || 2}% per trade</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Stop trading after reaching daily loss limit</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Take maximum {userProfile?.tradesPerDay || '1-2'} trades per day</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Use proper position sizing always</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Prop Firm Compliance</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Monitor drawdown limits continuously</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Maintain minimum trading days requirement</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Follow news trading restrictions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <span>Respect weekend holding policies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RiskProtocol;
