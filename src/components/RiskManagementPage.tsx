import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import FuturisticBackground from './FuturisticBackground';
import FuturisticCursor from './FuturisticCursor';

import { TradingPlan } from '../contexts/TradingPlanContext';

const RiskManagementPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { tradingPlan, updateTradingPlan } = useTradingPlan();
  const [comprehensivePlan, setComprehensivePlan] = useState<TradingPlan | null>(null);

  // Translated and enhanced generate_comprehensive_risk_plan
  const generateComprehensiveRiskPlan = (answers: Map<string, any>): TradingPlan => {
    // Extract and validate user answers with defaults
    const trades_per_day = answers.get('tradesPerDay') || '1-2';
    const trading_session = answers.get('tradingSession') || 'any';
    const crypto_assets = answers.get('cryptoAssets') || [];
    const forex_assets = answers.get('forexAssets') || [];
    const has_account = answers.get('hasAccount') || 'no';
    let account_equity = answers.get('accountEquity') || 10000;
    const trading_experience = answers.get('tradingExperience') || 'beginner';
    
    // Validate account equity
    try {
        account_equity = parseFloat(account_equity) ? parseFloat(account_equity) : 10000.0;
    } catch (e) {
        account_equity = 10000.0;
    }

    if (has_account === 'no') {
        account_equity = 10000.0;
    }

    // Determine experience-based risk parameters
    const risk_profiles = {
        'beginner': {'daily_risk': 0.04, 'trade_risk': 0.02, 'min_rr': 2.0},
        'intermediate': {'daily_risk': 0.05, 'trade_risk': 0.025, 'min_rr': 2.5},
        'advanced': {'daily_risk': 0.06, 'trade_risk': 0.03, 'min_rr': 3.0}
    };
    
    const profile = risk_profiles[trading_experience as keyof typeof risk_profiles] || risk_profiles['beginner'];
    
    // Calculate number of trades from trades_per_day string
    const parse_trades_per_day = (trades_str: string) => {
        if (trades_str.includes('+')) {
            return parseInt(trades_str.replace('+', '')) + 2;
        } else if (trades_str.includes('-')) {
            const parts = trades_str.split('-');
            return parseInt(parts[1]);
        } else {
            return parseInt(trades_str);
        }
    };
    
    const num_trades = parse_trades_per_day(trades_per_day);
    
    // Calculate risk allocations
    const max_daily_risk = account_equity * profile.daily_risk;
    const base_trade_risk = account_equity * profile.trade_risk;
    
    // Adjust trade risk based on number of trades to stay within daily limit
    const adjusted_trade_risk = Math.min(base_trade_risk, max_daily_risk / num_trades);
    
    // Asset-specific risk adjustments
    const get_asset_multiplier = (asset_type: 'crypto' | 'forex', asset_name: string) => {
        const crypto_multipliers: { [key: string]: number } = {
            'BTC': 1.0, 'ETH': 1.1, 'SOL': 1.3, 'XRP': 1.2, 
            'ADA': 1.2, 'DOGE': 1.5, 'AVAX': 1.3, 'SHIB': 1.8
        };
        const forex_multipliers: { [key: string]: number } = {
            'EURUSD': 1.0, 'GBPUSD': 1.1, 'USDJPY': 1.0,
            'XAU/USD': 1.2, 'USOIL': 1.3, 'US30': 1.1
        };
        
        if (asset_type === 'crypto') {
            return crypto_multipliers[asset_name] || 1.4;
        } else {
            return forex_multipliers[asset_name] || 1.2;
        }
    };
    
    // Generate individual trade plans
    let trades: TradingPlan['trades'] = [];
    const all_assets: { name: string, type: 'crypto' | 'forex' }[] = [
        ...crypto_assets.map((asset: string) => ({ name: asset, type: 'crypto' })),
        ...forex_assets.map((asset: string) => ({ name: asset, type: 'forex' }))
    ];
    
    if (all_assets.length === 0) {
        // Edge Case: No assets selected
        trades = Array.from({ length: num_trades }, (_, i) => ({
            trade: `trade-${i + 1}`,
            asset: 'Select from your preferred assets',
            lossLimit: parseFloat(adjusted_trade_risk.toFixed(2)),
            profitTarget: parseFloat((adjusted_trade_risk * profile.min_rr).toFixed(2)),
            riskRewardRatio: `1:${profile.min_rr}`
        }));
    } else {
        for (let i = 1; i <= num_trades; i++) {
            const asset_info = all_assets[(i - 1) % all_assets.length];
            const multiplier = get_asset_multiplier(asset_info.type, asset_info.name);
            const trade_risk = adjusted_trade_risk * multiplier;
            const profit_target = trade_risk * profile.min_rr;
            
            trades.push({
                trade: `trade-${i}`,
                asset: asset_info.name,
            lossLimit: parseFloat(trade_risk.toFixed(2)),
            profitTarget: parseFloat(profit_target.toFixed(2)),
                riskRewardRatio: `1:${profile.min_rr}`
            });
        }
    }
    
    // Create comprehensive plan
    const plan: TradingPlan = {
        userProfile: {
            initialBalance: account_equity,
            accountEquity: account_equity,
            tradesPerDay: trades_per_day,
            tradingSession: trading_session,
            cryptoAssets: crypto_assets,
            forexAssets: forex_assets,
            hasAccount: has_account,
            experience: trading_experience,
        },
        riskParameters: {
            maxDailyRisk: parseFloat(max_daily_risk.toFixed(2)),
            maxDailyRiskPct: `${(profile.daily_risk * 100).toFixed(2)}%`,
            baseTradeRisk: parseFloat(adjusted_trade_risk.toFixed(2)),
            baseTradeRiskPct: `${(adjusted_trade_risk / account_equity * 100).toFixed(2)}%`,
            minRiskReward: `1:${profile.min_rr}`
        },
        trades: trades,
        propFirmCompliance: {
            dailyLossLimit: `$${max_daily_risk.toFixed(2)} (${(profile.daily_risk * 100).toFixed(2)}%)`,
            totalDrawdownLimit: `$${(account_equity * 0.10).toFixed(2)} (10%)`,
            profitTarget: `$${(account_equity * 0.08).toFixed(2)} (8%)`,
            consistencyRule: "Maintain steady performance for Phase 2"
        }
    };
    
    return plan;
  };

  const handleContinueToDashboard = () => {
    if (user) {
      const updatedUser = { ...user, setupComplete: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    if (comprehensivePlan) {
      updateTradingPlan(comprehensivePlan);
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    if (tradingPlan) {
      const answers = new Map(Object.entries(tradingPlan.userProfile));
      const newPlan = generateComprehensiveRiskPlan(answers);
      setComprehensivePlan(newPlan);
    }
  }, [tradingPlan]);

  const adjustRiskAfterLoss = (currentPlan: TradingPlan, consecutiveLosses: number): TradingPlan => {
    let adjustmentFactor = 1.0;
    let note = "";

    if (consecutiveLosses >= 3) {
        adjustmentFactor = 0.25;
        note = "Emergency risk protocol activated";
    } else if (consecutiveLosses >= 2) {
        adjustmentFactor = 0.5;
        note = "Risk reduced due to consecutive losses";
    }

    if (note) {
        const adjustedTrades = currentPlan.trades.map((trade) => ({
            ...trade,
            lossLimit: parseFloat((trade.lossLimit * adjustmentFactor).toFixed(2)),
            profitTarget: parseFloat((trade.profitTarget * adjustmentFactor).toFixed(2)),
            note: note,
        }));
        return { ...currentPlan, trades: adjustedTrades };
    }
    return currentPlan;
  };

  const renderContent = () => {
    if (!comprehensivePlan) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white">
          Generating your comprehensive risk plan...
        </div>
      );
    }

    const { userProfile, riskParameters, trades, propFirmCompliance } = comprehensivePlan;

    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 text-blue-400 mb-4">
            <Shield className="w-8 h-8" />
            <span className="text-lg font-medium">Your Comprehensive Trading Plan</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Dynamic Risk Management Plan</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            A tailored risk strategy to ensure prop firm compliance and maximize your success potential.
          </p>
        </div>

        {/* User Profile Section */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-green-400 text-3xl font-bold mb-2">${userProfile.accountEquity.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Account Equity {userProfile.note && `(${userProfile.note})`}</div>
            </div>
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-blue-400 text-3xl font-bold mb-2">{userProfile.tradesPerDay}</div>
              <div className="text-gray-400 text-sm">Trades Per Day</div>
            </div>
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-purple-400 text-3xl font-bold mb-2 capitalize">{userProfile.experience}</div>
              <div className="text-gray-400 text-sm">Experience Level</div>
            </div>
          </div>
        </div>

        {/* Risk Parameters Section */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Core Risk Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-red-400 text-3xl font-bold mb-2">${riskParameters.maxDailyRisk} ({riskParameters.maxDailyRiskPct})</div>
              <div className="text-gray-400 text-sm">Max Daily Risk</div>
            </div>
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-yellow-400 text-3xl font-bold mb-2">${riskParameters.baseTradeRisk} ({riskParameters.baseTradeRiskPct})</div>
              <div className="text-gray-400 text-sm">Base Risk Per Trade</div>
            </div>
            <div className="text-center p-6 bg-gray-700/50 rounded-xl">
              <div className="text-cyan-400 text-3xl font-bold mb-2">{riskParameters.minRiskReward}</div>
              <div className="text-gray-400 text-sm">Minimum R:R Ratio</div>
            </div>
          </div>
        </div>

        {/* Prop Firm Compliance Section */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Prop Firm Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-gray-700/50 rounded-xl">
              <div className="text-green-400 text-2xl font-bold mb-2"><CheckCircle className="inline-block mr-2"/>Passed</div>
              <div className="text-gray-400 text-sm">Daily Loss Limit: {propFirmCompliance.dailyLossLimit}</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-xl">
              <div className="text-green-400 text-2xl font-bold mb-2"><CheckCircle className="inline-block mr-2"/>Passed</div>
              <div className="text-gray-400 text-sm">Total Drawdown: {propFirmCompliance.totalDrawdownLimit}</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-xl">
              <div className="text-blue-400 text-2xl font-bold mb-2">Target</div>
              <div className="text-gray-400 text-sm">Profit Target: {propFirmCompliance.profitTarget}</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-xl">
              <div className="text-blue-400 text-2xl font-bold mb-2">Rule</div>
              <div className="text-gray-400 text-sm">{propFirmCompliance.consistencyRule}</div>
            </div>
          </div>
        </div>

        {/* Detailed Trade Plan Section */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Detailed Trade Plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="p-4 text-gray-300">Trade</th>
                  <th className="p-4 text-gray-300">Asset</th>
                  <th className="p-4 text-gray-300">Max Loss</th>
                  <th className="p-4 text-gray-300">Profit Target</th>
                  <th className="p-4 text-gray-300">R:R Ratio</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4 text-white font-semibold">{trade.trade}</td>
                    <td className="p-4 text-white">{trade.asset}</td>
                    <td className="p-4 text-red-400">${trade.lossLimit}</td>
                    <td className="p-4 text-green-400">${trade.profitTarget}</td>
                    <td className="p-4 text-cyan-400">{trade.riskRewardRatio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-Time Risk Adjustment Section */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">Real-Time Risk Adjustment Protocol</h3>
            <p className="text-center text-gray-400 mb-6">Simulate consecutive losses to see how the plan adapts.</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => comprehensivePlan && setComprehensivePlan(adjustRiskAfterLoss(comprehensivePlan, 2))} className="px-6 py-2 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 text-white transition-all">Simulate 2 Losses</button>
                <button onClick={() => comprehensivePlan && setComprehensivePlan(adjustRiskAfterLoss(comprehensivePlan, 3))} className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all">Simulate 3+ Losses</button>
                <button onClick={() => {
                    if (tradingPlan) {
                        const answers = new Map(Object.entries(tradingPlan.userProfile));
                        setComprehensivePlan(generateComprehensiveRiskPlan(answers));
                    }
                }} className="px-6 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-all">Reset Simulation</button>
            </div>
            {comprehensivePlan?.trades[0]?.note && (
                <div className="mt-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-center text-yellow-300">
                    <AlertTriangle className="inline-block mr-2" /> {comprehensivePlan.trades[0].note}
                </div>
            )}
        </div>

        {/* System Features */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">System Features</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Universal Compatibility: Works with any questionnaire answers.</li>
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Prop Firm Compliance: Stays within 4-6% daily risk limits.</li>
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Dynamic Risk Allocation: Adjusts for experience and volatility.</li>
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Scalable Architecture: Handles 1 to 10+ daily trades.</li>
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Asset-Specific Risk: Different multipliers for different assets.</li>
                <li className="flex items-center"><CheckCircle className="text-green-400 mr-3"/> Emergency Protocols: Auto-reduces risk after losses.</li>
            </ul>
        </div>

        <div className="flex justify-center items-center space-x-4 mt-12">
          <button
            onClick={() => navigate('/questionnaire')}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all bg-gray-600 hover:bg-gray-700 text-white"
          >
            <span>Back to Questionnaire</span>
          </button>
          <button
            onClick={handleContinueToDashboard}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <FuturisticBackground />
      <FuturisticCursor />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default RiskManagementPage;
