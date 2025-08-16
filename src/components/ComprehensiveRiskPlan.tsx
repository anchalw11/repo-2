import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertTriangle, CheckCircle, TrendingUp, Target, Calculator, BarChart3 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import FuturisticBackground from './FuturisticBackground';
import FuturisticCursor from './FuturisticCursor';

interface ComprehensivePlan {
  prop_firm_analysis: {
    firm_name: string;
    account_type: string;
    account_size: number;
    working_capital: number;
    extracted_rules: {
      daily_loss_limit: string;
      max_drawdown: string;
      profit_target_phase1: string;
      profit_target_phase2: string;
      min_trading_days: number;
      consistency_rule: string;
      news_trading: string;
      weekend_holding: string;
    };
  };
  risk_calculations: {
    max_daily_risk: number;
    risk_per_trade: number;
    total_daily_risk_used: number;
    daily_risk_utilization: string;
    safety_margin: number;
  };
  success_projections: {
    days_to_pass_phase1: number;
    days_to_pass_phase2: number;
    daily_profit_potential: number;
    daily_risk_exposure: number;
    expected_daily_pnl: number;
    win_rate_assumption: string;
  };
  detailed_trades: Array<{
    trade: string;
    asset: string;
    risk_amount: number;
    profit_target: number;
    risk_reward_ratio: string;
    position_size_calculation: string;
    max_loss_per_trade: string;
    expected_profit: string;
  }>;
  compliance_status: {
    daily_risk_compliant: boolean;
    drawdown_protected: boolean;
    consistency_achievable: boolean;
    overall_status: string;
  };
}

const ComprehensiveRiskPlan: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [comprehensivePlan, setComprehensivePlan] = useState<ComprehensivePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the comprehensive plan from localStorage
    const storedPlan = localStorage.getItem('comprehensive_plan');
    if (storedPlan) {
      try {
        const plan = JSON.parse(storedPlan);
        setComprehensivePlan(plan);
      } catch (error) {
        console.error('Error parsing comprehensive plan:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleContinueToDashboard = () => {
    if (user) {
      const updatedUser = { ...user, setupComplete: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading your comprehensive risk plan...</p>
        </div>
      </div>
    );
  }

  if (!comprehensivePlan) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Risk Plan Found</h2>
          <p className="text-gray-400 mb-6">Please complete the questionnaire first.</p>
          <button
            onClick={() => navigate('/questionnaire')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
          >
            Go to Questionnaire
          </button>
        </div>
      </div>
    );
  }

  const { prop_firm_analysis, risk_calculations, success_projections, detailed_trades, compliance_status } = comprehensivePlan;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <FuturisticBackground />
      <FuturisticCursor />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 text-blue-400 mb-4">
              <Shield className="w-8 h-8" />
              <span className="text-lg font-medium">Comprehensive Risk Management Plan</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {prop_firm_analysis.firm_name} Strategy
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
              Detailed analysis with prop firm rules extraction, trade-by-trade calculations, and success projections.
            </p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
              compliance_status.overall_status === 'COMPLIANT' 
                ? 'bg-green-900/50 text-green-400 border border-green-700' 
                : 'bg-red-900/50 text-red-400 border border-red-700'
            }`}>
              {compliance_status.overall_status === 'COMPLIANT' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              {compliance_status.overall_status}
            </div>
          </div>

          {/* Prop Firm Analysis Section */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Target className="w-8 h-8 mr-3 text-blue-400" />
              Prop Firm Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-blue-400 text-2xl font-bold mb-2">{prop_firm_analysis.firm_name}</div>
                <div className="text-gray-400 text-sm">Selected Firm</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-green-400 text-2xl font-bold mb-2">{prop_firm_analysis.account_type}</div>
                <div className="text-gray-400 text-sm">Account Type</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-purple-400 text-2xl font-bold mb-2">${prop_firm_analysis.account_size.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Account Size</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-cyan-400 text-2xl font-bold mb-2">${prop_firm_analysis.working_capital.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Working Capital</div>
              </div>
            </div>

            <h4 className="text-xl font-bold text-white mb-4">Extracted Prop Firm Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-red-400 font-semibold">Daily Loss Limit</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.daily_loss_limit}</div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-red-400 font-semibold">Max Drawdown</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.max_drawdown}</div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-green-400 font-semibold">Phase 1 Target</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.profit_target_phase1}</div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-green-400 font-semibold">Phase 2 Target</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.profit_target_phase2}</div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-blue-400 font-semibold">Min Trading Days</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.min_trading_days} days</div>
              </div>
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="text-yellow-400 font-semibold">Consistency Rule</div>
                <div className="text-white text-lg">{prop_firm_analysis.extracted_rules.consistency_rule}</div>
              </div>
            </div>
          </div>

          {/* Risk Calculations Section */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Calculator className="w-8 h-8 mr-3 text-green-400" />
              Risk Calculations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-red-400 text-2xl font-bold mb-2">${risk_calculations.max_daily_risk}</div>
                <div className="text-gray-400 text-sm">Max Daily Risk</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-yellow-400 text-2xl font-bold mb-2">${risk_calculations.risk_per_trade}</div>
                <div className="text-gray-400 text-sm">Risk Per Trade</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-orange-400 text-2xl font-bold mb-2">${risk_calculations.total_daily_risk_used}</div>
                <div className="text-gray-400 text-sm">Total Risk Used</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-purple-400 text-2xl font-bold mb-2">{risk_calculations.daily_risk_utilization}</div>
                <div className="text-gray-400 text-sm">Risk Utilization</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-green-400 text-2xl font-bold mb-2">${risk_calculations.safety_margin}</div>
                <div className="text-gray-400 text-sm">Safety Margin</div>
              </div>
            </div>
          </div>

          {/* Success Projections Section */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-purple-400" />
              Success Projections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-blue-400 text-3xl font-bold mb-2">{success_projections.days_to_pass_phase1}</div>
                <div className="text-gray-400 text-sm">Days to Pass Phase 1</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-green-400 text-3xl font-bold mb-2">{success_projections.days_to_pass_phase2}</div>
                <div className="text-gray-400 text-sm">Days to Pass Phase 2</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-purple-400 text-3xl font-bold mb-2">${success_projections.daily_profit_potential}</div>
                <div className="text-gray-400 text-sm">Daily Profit Potential</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-red-400 text-3xl font-bold mb-2">${success_projections.daily_risk_exposure}</div>
                <div className="text-gray-400 text-sm">Daily Risk Exposure</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-cyan-400 text-3xl font-bold mb-2">${success_projections.expected_daily_pnl}</div>
                <div className="text-gray-400 text-sm">Expected Daily P&L</div>
              </div>
              <div className="text-center p-6 bg-gray-700/50 rounded-xl">
                <div className="text-yellow-400 text-3xl font-bold mb-2">{success_projections.win_rate_assumption}</div>
                <div className="text-gray-400 text-sm">Win Rate Assumption</div>
              </div>
            </div>
          </div>

          {/* Detailed Trade Plan Section */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-cyan-400" />
              Detailed Trade-by-Trade Plan
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="p-4 text-gray-300 font-semibold">Trade</th>
                    <th className="p-4 text-gray-300 font-semibold">Asset</th>
                    <th className="p-4 text-gray-300 font-semibold">Risk Amount</th>
                    <th className="p-4 text-gray-300 font-semibold">Profit Target</th>
                    <th className="p-4 text-gray-300 font-semibold">R:R Ratio</th>
                    <th className="p-4 text-gray-300 font-semibold">Position Calculation</th>
                  </tr>
                </thead>
                <tbody>
                  {detailed_trades.map((trade, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 text-white font-semibold">{trade.trade}</td>
                      <td className="p-4 text-blue-400 font-medium">{trade.asset}</td>
                      <td className="p-4 text-red-400 font-bold">${trade.risk_amount}</td>
                      <td className="p-4 text-green-400 font-bold">${trade.profit_target}</td>
                      <td className="p-4 text-cyan-400 font-medium">{trade.risk_reward_ratio}</td>
                      <td className="p-4 text-gray-300 text-sm">{trade.position_size_calculation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h4 className="text-lg font-bold text-blue-400 mb-2">How to Use This Plan:</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Calculate position size by dividing risk amount by stop loss distance</li>
                <li>• Never exceed the specified risk amount per trade</li>
                <li>• Aim for the profit target based on the risk-reward ratio</li>
                <li>• Rotate through your selected assets as shown</li>
                <li>• Track your daily total to stay within prop firm limits</li>
              </ul>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
            <h3 className="text-3xl font-bold text-white mb-6">Compliance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-6 rounded-xl text-center ${compliance_status.daily_risk_compliant ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                {compliance_status.daily_risk_compliant ? (
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                )}
                <div className="text-white font-semibold">Daily Risk</div>
                <div className={compliance_status.daily_risk_compliant ? 'text-green-400' : 'text-red-400'}>
                  {compliance_status.daily_risk_compliant ? 'Compliant' : 'Needs Adjustment'}
                </div>
              </div>
              
              <div className={`p-6 rounded-xl text-center ${compliance_status.drawdown_protected ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                {compliance_status.drawdown_protected ? (
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                )}
                <div className="text-white font-semibold">Drawdown</div>
                <div className={compliance_status.drawdown_protected ? 'text-green-400' : 'text-red-400'}>
                  {compliance_status.drawdown_protected ? 'Protected' : 'At Risk'}
                </div>
              </div>
              
              <div className={`p-6 rounded-xl text-center ${compliance_status.consistency_achievable ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                {compliance_status.consistency_achievable ? (
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                )}
                <div className="text-white font-semibold">Consistency</div>
                <div className={compliance_status.consistency_achievable ? 'text-green-400' : 'text-red-400'}>
                  {compliance_status.consistency_achievable ? 'Achievable' : 'Challenging'}
                </div>
              </div>
              
              <div className="p-6 rounded-xl text-center bg-blue-900/30 border border-blue-700">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-white font-semibold">Overall Status</div>
                <div className="text-blue-400 font-bold">{compliance_status.overall_status}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
      </main>
    </div>
  );
};

export default ComprehensiveRiskPlan;
