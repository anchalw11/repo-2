import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal } from '../trading/types';
import { openTrade, closeTrade } from '../trading/tradeManager';
import { isDailyLossLimitReached } from '../trading/riskManager';
import { loadState } from '../trading/dataStorage';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  DollarSign, 
  Activity, 
  Bell, 
  Settings, 
  LogOut,
  Zap,
  BookOpen,
  PieChart,
  Building,
  Shield,
  Cpu,
  Rocket,
  GitBranch,
  Layers,
  LifeBuoy
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan, TradingPlan } from '../contexts/TradingPlanContext';
import api from '../api';
import SignalsFeed from './SignalsFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import TradingJournalDashboard from './TradingJournalDashboard';
import MultiAccountTracker from './MultiAccountTracker';
import RiskManagement from './RiskManagement';
import AlertSystem from './AlertSystem';
import NotificationCenter from './NotificationCenter';
import AccountSettings from './AccountSettings';
import PropFirmRules from './PropFirmRules';
import RiskProtocol from './RiskProtocol';
import TradeMentor from './TradeMentor';
import ConsentForm from './ConsentForm';
import FuturisticBackground from './FuturisticBackground';
import FuturisticCursor from './FuturisticCursor';
import LiveChatWidget from './LiveChatWidget';
import { getAllTimezones, getMarketStatus } from '../services/timezoneService';
import { fetchForexFactoryNews, getImpactColor, getImpactIcon, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';

const DashboardConcept1 = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useUser();
  const { accounts, accountConfig, updateAccountConfig, tradingPlan, updateTradingPlan, propFirm, updatePropFirm } = useTradingPlan();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const aiCoachRef = useRef<HTMLIFrameElement>(null);
  const [notifications, setNotifications] = useState(3);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [tradingState, setTradingState] = useState<TradingState | null>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [forexNews, setForexNews] = useState<ForexFactoryEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedNewsDate, setSelectedNewsDate] = useState(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');

  // Check if user has given consent
  useEffect(() => {
    const consentGiven = localStorage.getItem('user_consent_accepted');
    if (!consentGiven && user?.isAuthenticated && user?.setupComplete) {
      setShowConsentForm(true);
    }
  }, [user]);

  // Initialize dashboard data from multiple sources with caching
  useEffect(() => {
    let isMounted = true;
    
    const initializeDashboardData = async () => {
      if (user?.email && !dashboardData && !isLoadingData) { // Only fetch if we don't have data and not already loading
        try {
          setIsLoadingData(true);
          const response = await api.get(`/dashboard-data/${encodeURIComponent(user.email)}`);
          if (isMounted) {
            setDashboardData(response.data);
          }
        } catch (error) {
          console.error('Error initializing dashboard data:', error);
          if (isMounted) {
            // Set default data to prevent infinite loading
            setDashboardData({
              userProfile: {
                propFirm: 'Not Set',
                accountType: 'Not Set',
                accountSize: 'Not Set',
                experience: 'Not Set',
                tradesPerDay: 'Not Set',
                riskPerTrade: 'Not Set',
                riskReward: '1:Not Set',
                session: 'Not Set'
              },
              performance: {
                accountBalance: 0,
                winRate: 0,
                totalTrades: 0,
                totalPnL: 0
              }
            });
          }
        } finally {
          if (isMounted) {
            setIsLoadingData(false);
          }
        }
      }
    };

    initializeDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.email]); // Removed dashboardData dependency to prevent infinite loop

  // Update current time every 5 minutes to reduce flickering
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 300000); // Update every 5 minutes instead of every minute
    return () => clearInterval(timer);
  }, []);

  // Calculate market status using the new timezone service with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const status = getMarketStatus(selectedTimezone);
      setMarketStatus((prevStatus: any) => {
        // Only update if status actually changed
        if (!prevStatus || 
            prevStatus.isOpen !== status.isOpen || 
            prevStatus.currentSession !== status.currentSession) {
          return status;
        }
        return prevStatus;
      });
    }, 500); // Increased debounce time
    
    return () => clearTimeout(timeoutId);
  }, [selectedTimezone, currentTime]);

  // Fetch Forex Factory news with better caching
  useEffect(() => {
    let isMounted = true;
    
    const fetchNews = async () => {
      // Only fetch if not already loading
      if (isLoadingNews) return;
      
      setIsLoadingNews(true);
      try {
        const news = await fetchForexFactoryNews(selectedNewsDate, selectedCurrency, selectedTimezone);
        if (isMounted) {
          setForexNews(news);
        }
      } catch (error) {
        console.error('Error fetching Forex Factory news:', error);
      } finally {
        if (isMounted) {
          setIsLoadingNews(false);
        }
      }
    };

    // Debounce the fetch to prevent rapid calls
    const timeoutId = setTimeout(fetchNews, 1000); // Increased debounce
    
    // Refresh news every 60 minutes instead of 30
    const newsInterval = setInterval(fetchNews, 60 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(newsInterval);
    };
  }, [selectedNewsDate, selectedCurrency, selectedTimezone]); // Removed isLoadingNews dependency

  const handleNewsDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedNewsDate(new Date(e.target.value));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };

  const handleConsentAccept = () => {
    localStorage.setItem('user_consent_accepted', 'true');
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    onLogout();
  };

  // Load trading plan and user data on component mount
  useEffect(() => {
    if (user?.email) {
      // Load user-specific data
      const userKey = `user_data_${user.email}`;
      const savedUserData = localStorage.getItem(userKey);
      
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        // Update trading plan context with saved data
        if (userData.tradingPlan) {
          updateTradingPlan(userData.tradingPlan);
        }
        if (userData.propFirm) {
          updatePropFirm(userData.propFirm);
        }
        if (userData.accountConfig) {
          updateAccountConfig(userData.accountConfig);
        }
      }
    }
  }, [user?.email]);

  // Save user data whenever trading plan changes
  useEffect(() => {
    if (user?.email && tradingPlan) {
      const userKey = `user_data_${user.email}`;
      const userData = {
        tradingPlan,
        propFirm: propFirm,
        accountConfig: accountConfig,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(userKey, JSON.stringify(userData));
    }
  }, [user?.email, tradingPlan, propFirm, accountConfig]);

  useEffect(() => {
    const initState = async () => {
      if (user && dashboardData && dashboardData.performance) {
        // Load user-specific trading state
        const stateKey = `trading_state_${user.email}`;
        const localState = localStorage.getItem(stateKey);
        let loadedState = null;
        
        if (localState) {
          try {
            loadedState = JSON.parse(localState);
            // Convert date strings back to Date objects
            if (loadedState.trades) {
              loadedState.trades = loadedState.trades.map((trade: any) => ({
                ...trade,
                entryTime: new Date(trade.entryTime),
                closeTime: trade.closeTime ? new Date(trade.closeTime) : undefined
              }));
            }
          } catch (e) {
            console.error('Error parsing local state:', e);
          }
        }
        
        if (loadedState) {
          setTradingState(loadedState);
        } else {
          // Get initial balance from dashboard data
          const initialEquity = dashboardData.performance.accountBalance || 100000;
          
          const initialState: TradingState = {
            initialEquity,
            currentEquity: initialEquity,
            trades: [],
            openPositions: [],
            riskSettings: {
              riskPerTrade: parseFloat(dashboardData.userProfile.riskPerTrade?.replace('%', '') || '1'),
              dailyLossLimit: 5, // Default 5%
              consecutiveLossesLimit: 3,
            },
            performanceMetrics: {
              totalPnl: dashboardData.performance.totalPnL || 0,
              winRate: dashboardData.performance.winRate || 0,
              totalTrades: dashboardData.performance.totalTrades || 0,
              winningTrades: 0,
              losingTrades: 0,
              averageWin: 0,
              averageLoss: 0,
              profitFactor: 0,
              maxDrawdown: 0,
              currentDrawdown: 0,
              grossProfit: 0,
              grossLoss: 0,
              consecutiveWins: 0,
              consecutiveLosses: 0,
            },
            dailyStats: {
              pnl: 0,
              trades: 0,
              initialEquity: initialEquity,
            },
          };
          setTradingState(initialState);
          // Save initial state to localStorage
          localStorage.setItem(stateKey, JSON.stringify(initialState));
        }
      }
    };
    initState();
  }, [user?.email, dashboardData]);

  // Save trading state to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (tradingState && user?.email) {
      const timeoutId = setTimeout(() => {
        const stateKey = `trading_state_${user.email}`;
        localStorage.setItem(stateKey, JSON.stringify(tradingState));
        
        // Also update dashboard data performance metrics (only if significantly changed)
        if (dashboardData) {
          const currentBalance = dashboardData.performance?.accountBalance || 0;
          const newBalance = tradingState.currentEquity;
          
          // Only update if balance changed by more than $1 to prevent constant re-renders
          if (Math.abs(currentBalance - newBalance) > 1) {
            setDashboardData((prevData: any) => ({
              ...prevData,
              performance: {
                ...prevData.performance,
                accountBalance: tradingState.currentEquity,
                winRate: tradingState.performanceMetrics.winRate,
                totalTrades: tradingState.performanceMetrics.totalTrades,
                totalPnL: tradingState.performanceMetrics.totalPnl
              }
            }));
          }
        }
      }, 1000); // Debounce by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [tradingState, user?.email, dashboardData?.performance?.accountBalance]);

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const hasProAccess = user && ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier || '');
  const hasJournalAccess = user && ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier || '');
  const hasEnterpriseAccess = user && ['enterprise'].includes(user.membershipTier || '');
  const hasMultiAccountAccess = hasProAccess || hasEnterpriseAccess;

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(e.target.value);
  };

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-5 h-5" /> },
    { id: 'signals', label: 'Signal Feed', icon: <Zap className="w-5 h-5" /> },
    { id: 'rules', label: 'Prop Firm Rules', icon: <Shield className="w-5 h-5" /> },
    { id: 'analytics', label: 'Performance', icon: <PieChart className="w-5 h-5" /> },
    ...(hasJournalAccess ? [{ id: 'journal', label: 'Trade Journal', icon: <BookOpen className="w-5 h-5" /> }] : []),
    ...(hasProAccess || hasEnterpriseAccess ? [{ id: 'accounts', label: 'Multi-Account', icon: <GitBranch className="w-5 h-5" /> }] : []),
    { id: 'risk-protocol', label: 'Risk Protocol', icon: <Target className="w-5 h-5" /> },
    { id: 'ai-coach', label: 'AI Coach', icon: <Cpu className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const stats = [
    {
      label: 'Account Balance',
      value: dashboardData?.performance?.accountBalance 
        ? `$${dashboardData.performance.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : (tradingState ? `$${tradingState.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0'),
      change: 'Live Data',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green',
    },
    {
      label: 'Win Rate',
      value: dashboardData?.performance?.winRate 
        ? `${dashboardData.performance.winRate}%` 
        : (tradingState ? `${tradingState.performanceMetrics.winRate.toFixed(1)}%` : '0%'),
      change: 'From Taken Trades',
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
    },
    {
      label: 'Total Trades',
      value: dashboardData?.performance?.totalTrades?.toString() 
        || (tradingState ? tradingState.trades.length.toString() : '0'),
      change: 'Active Trading',
      icon: <Activity className="w-8 h-8" />,
      color: 'purple',
    },
    {
      label: 'Total P&L',
      value: dashboardData?.performance?.totalPnL !== undefined
        ? `${dashboardData.performance.totalPnL >= 0 ? '+' : ''}$${dashboardData.performance.totalPnL.toFixed(2)}`
        : (tradingState
          ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
          : '$0.00'),
      change: 'From Trades',
      icon: <Award className="w-8 h-8" />,
      color: (dashboardData?.performance?.totalPnL !== undefined 
        ? dashboardData.performance.totalPnL >= 0 
        : tradingState && tradingState.performanceMetrics.totalPnl >= 0) ? 'green' : 'red',
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="holo-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user?.name}</h2>
            <p className="text-gray-400">
              Your {user?.membershipTier?.charAt(0).toUpperCase() + (user?.membershipTier?.slice(1) || '')} Dashboard
            </p>
            
            {/* Display questionnaire data from dashboard */}
            {isLoadingData ? (
              <div className="mt-8 text-center">
                <div className="text-blue-400 animate-pulse">Loading your trading profile...</div>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm max-w-4xl mx-auto">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Prop Firm:</span>
                  <span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.propFirm || 'Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Account Type:</span>
                  <span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.accountType || 'Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Account Size:</span>
                  <span className="text-white ml-2 font-semibold">
                    {dashboardData?.userProfile?.accountSize ? `$${parseInt(dashboardData.userProfile.accountSize).toLocaleString()}` : 'Not Set'}
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white ml-2 font-semibold capitalize">{dashboardData?.userProfile?.experience || 'Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Trades/Day:</span>
                  <span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.tradesPerDay || 'Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Risk/Trade:</span>
                  <span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.riskPerTrade || 'Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Risk:Reward:</span>
                  <span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.riskReward || '1:Not Set'}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Session:</span>
                  <span className="text-white ml-2 font-semibold capitalize">{dashboardData?.userProfile?.session || 'Not Set'}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-400">Timezone</div>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600 max-w-xs"
            >
              {getAllTimezones().map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="holo-stats">
        {stats.map((stat, index) => (
          <div key={index} className="holo-stat">
            <div className="holo-value">{stat.value}</div>
            <div style={{color: 'rgba(255,255,255,0.5)', marginTop: '10px'}}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 holo-card">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
          {!tradingState || tradingState.trades.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 text-lg font-medium mb-2">No trades recorded yet</div>
              <div className="text-sm text-gray-500 mb-4">
                Start taking signals and mark them as "taken" to see your performance here
              </div>
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Important:</strong> Click "Mark as Taken" on any signal you execute. This helps us track
                  your performance without accessing your trading account credentials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {tradingState.trades.slice(-5).reverse().map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        (trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-white font-medium">{trade.pair}</div>
                      <div className="text-sm text-gray-400">
                        {trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      ${(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="holo-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
          {marketStatus && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400 mb-2">
                {marketStatus.localTime}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Forex Market</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {marketStatus.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Session</span>
                <span className="text-white text-sm">{marketStatus.currentSession}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Next Session</span>
                <span className="text-white text-sm">{marketStatus.nextSession} ({marketStatus.timeUntilNext})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forex Factory News Section - Enhanced Futuristic Design */}
      <div className="holo-card relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Economic Calendar
                </h3>
                <p className="text-xs text-gray-400 mt-1">Real-time market-moving events</p>
              </div>
            </div>
            
            {/* Enhanced Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                <label className="block text-xs font-medium text-cyan-400 mb-1">📅 Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedNewsDate.toISOString().split('T')[0]}
                    onChange={handleNewsDateChange}
                    className="bg-gray-900/80 backdrop-blur-sm text-white text-sm px-4 py-2 pr-10 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 hover:border-cyan-400/50"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400">
                    📅
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <label className="block text-xs font-medium text-cyan-400 mb-1">💱 Currency</label>
                <div className="relative">
                  <select
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className="bg-gray-900/80 backdrop-blur-sm text-white text-sm px-4 py-2 pr-10 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all duration-300 hover:border-cyan-400/50 appearance-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-gray-900">🌍 All Currencies</option>
                    <option value="USD" className="bg-gray-900">🇺🇸 USD - US Dollar</option>
                    <option value="EUR" className="bg-gray-900">🇪🇺 EUR - Euro</option>
                    <option value="GBP" className="bg-gray-900">🇬🇧 GBP - British Pound</option>
                    <option value="JPY" className="bg-gray-900">🇯🇵 JPY - Japanese Yen</option>
                    <option value="AUD" className="bg-gray-900">🇦🇺 AUD - Australian Dollar</option>
                    <option value="CAD" className="bg-gray-900">🇨🇦 CAD - Canadian Dollar</option>
                    <option value="CHF" className="bg-gray-900">🇨🇭 CHF - Swiss Franc</option>
                    <option value="NZD" className="bg-gray-900">🇳🇿 NZD - New Zealand Dollar</option>
                    <option value="CNY" className="bg-gray-900">🇨🇳 CNY - Chinese Yuan</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 pointer-events-none">
                    ▼
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">Live Data</span>
                <span className="text-cyan-400 font-medium">Forex Factory</span>
              </div>
            </div>
          </div>
          
          {isLoadingNews ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="text-cyan-400 font-medium">Loading economic events...</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Enhanced Table with Futuristic Design */}
              <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-gray-900/40 backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                      <th className="text-left py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        ⏰ Time
                      </th>
                      <th className="text-left py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        💱 Currency
                      </th>
                      <th className="text-left py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        📊 Impact
                      </th>
                      <th className="text-left py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        📰 Event
                      </th>
                      <th className="text-center py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        📈 Actual
                      </th>
                      <th className="text-center py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        🎯 Forecast
                      </th>
                      <th className="text-center py-4 px-4 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                        📊 Previous
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {forexNews.slice(0, 15).map((event, index) => (
                      <tr 
                        key={event.id} 
                        className="border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-cyan-500/5 hover:to-blue-500/5 transition-all duration-300 group"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-white font-mono text-sm bg-gray-800/50 px-2 py-1 rounded">
                              {formatEventTime(event.time, selectedTimezone)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {event.currency}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getImpactColor(event.impact)} ${
                            event.impact === 'high' ? 'border-red-400/50 shadow-red-400/20 shadow-lg' :
                            event.impact === 'medium' ? 'border-yellow-400/50 shadow-yellow-400/20 shadow-lg' :
                            'border-green-400/50 shadow-green-400/20 shadow-lg'
                          }`}>
                            {getImpactIcon(event.impact)} {event.impact.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs">
                            <div className="text-white font-medium truncate group-hover:text-cyan-300 transition-colors" title={event.event}>
                              {event.event}
                            </div>
                            {event.detail && (
                              <div className="text-xs text-gray-400 mt-1 truncate" title={event.detail}>
                                {event.detail}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                            event.actual ? 
                              (event.forecast && parseFloat(event.actual.replace(/[^\d.-]/g, '')) > parseFloat(event.forecast.replace(/[^\d.-]/g, '')) 
                                ? 'text-green-400 bg-green-400/10' 
                                : event.forecast && parseFloat(event.actual.replace(/[^\d.-]/g, '')) < parseFloat(event.forecast.replace(/[^\d.-]/g, ''))
                                ? 'text-red-400 bg-red-400/10'
                                : 'text-white bg-gray-700/30'
                              ) : 'text-gray-500'
                          }`}>
                            {event.actual || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-300 text-sm bg-gray-800/30 px-2 py-1 rounded">
                            {event.forecast || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-400 text-sm">
                            {event.previous || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {forexNews.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-gray-400 text-lg font-medium mb-2">No Economic Events</div>
                    <div className="text-gray-500 text-sm">
                      No events found for {selectedCurrency === 'ALL' ? 'all currencies' : selectedCurrency} on {selectedNewsDate.toLocaleDateString()}
                    </div>
                    <div className="mt-4 text-xs text-cyan-400">
                      Try selecting a different date or currency filter
                    </div>
                  </div>
                )}
              </div>
              
              {/* Event Count and Status */}
              {forexNews.length > 0 && (
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <span>Showing {Math.min(forexNews.length, 15)} of {forexNews.length} events</span>
                    {forexNews.length > 15 && (
                      <span className="text-cyan-400">• More events available</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleMarkAsTaken = async (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    if (tradingState) {
      if (isDailyLossLimitReached(tradingState)) {
        alert("You have hit your daily loss limit. No more trades are allowed today.");
        return;
      }
      const stateAfterOpen = openTrade(tradingState, signal);
      const newTrade = stateAfterOpen.openPositions[stateAfterOpen.openPositions.length - 1];
      const finalState = closeTrade(stateAfterOpen, newTrade.id, outcome, pnl);
      setTradingState(finalState);
      
      // Save to localStorage immediately
      if (user?.email) {
        localStorage.setItem(`trading_state_${user.email}`, JSON.stringify(finalState));
      }

      // Try to save to backend as well
      try {
        await api.post('/trades', {
          id: signal.id,
          pair: signal.pair,
          type: signal.direction,
          entry: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          outcome: outcome,
          pnl: pnl || 0
        });
      } catch (error) {
        console.error('Failed to save trade to backend:', error);
        // Continue anyway since we have localStorage backup
      }

      if (hasProAccess) {
        handleTabClick('ai-coach');
        setTimeout(() => {
          if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
            const signalData = {
              symbol: signal.pair,
              type: signal.direction,
              entryPrice: signal.entryPrice.toString(),
            };
            (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
          }
        }, 100);
      }
    }
  };

  const handleAddToJournal = (signal: Signal) => {
    console.log('Adding to journal:', signal);
    handleTabClick('journal');
  };

  const handleChatWithNexus = (signal: Signal) => {
    console.log('Chatting with Nexus about:', signal);
    handleTabClick('ai-coach');
    setTimeout(() => {
      if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
        const signalData = {
          symbol: signal.pair,
          type: signal.direction,
          entryPrice: signal.entryPrice.toString(),
        };
        (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
      }
    }, 100);
  };

  return (
    <>
      <style>{`
        .concept1 {
            background: radial-gradient(ellipse at center, #0a0a1f 0%, #000000 100%);
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100vh;
            display: flex;
        }

        .neural-grid {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
        }

        .holo-sidebar {
            width: 250px;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(0, 255, 255, 0.3);
            z-index: 100;
            display: flex;
            flex-direction: column;
        }

        .holo-logo {
            padding: 30px;
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
        }

        .holo-menu-item {
            padding: 20px 30px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .holo-menu-item.active {
            background: rgba(0, 255, 255, 0.1);
            border-left: 3px solid #00ffff;
            color: #00ffff;
        }

        .holo-menu-item:not(.active) {
            color: #fff;
        }

        .holo-menu-item::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }

        .holo-menu-item:hover::before {
            left: 100%;
        }

        .holo-main {
            flex: 1;
            padding: 40px;
            position: relative;
            height: 100vh;
            overflow-y: auto;
        }

        .holo-card {
            background: rgba(0, 20, 40, 0.6);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            position: relative;
            backdrop-filter: blur(10px);
            animation: holo-float 6s ease-in-out infinite;
        }

        @keyframes holo-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .holo-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }

        .holo-stat {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), transparent);
            border-radius: 15px;
            border: 1px solid rgba(0, 255, 255, 0.2);
        }

        .holo-value {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .tab-content {
            display: none;
            animation: fadeIn 0.5s ease;
        }

        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="concept1">
        <div className="neural-grid"></div>
        <div className="holo-sidebar">
            <div className="holo-logo">TraderEdgePro</div>
            {hasMultiAccountAccess && (
              <div className="p-4">
                <select
                  value={selectedAccount}
                  onChange={handleAccountChange}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600"
                >
                  {accounts.map((account: any) => (
                    <option key={account.id} value={account.id}>{account.account_name}</option>
                  ))}
                </select>
              </div>
            )}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {sidebarTabs.map((item) => (
                  <div 
                    key={item.id}
                    className={`holo-menu-item ${activeTab === item.id ? 'active' : ''}`} 
                    onClick={() => handleTabClick(item.id)}
                  >
                    {item.icon} <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </nav>
            <div className="p-4 border-t border-gray-800 flex items-center justify-around">
              <button onClick={onLogout} className="text-gray-400 hover:text-white"><LogOut className="w-6 h-6" /></button>
            </div>
        </div>

        <div className="holo-main">
            <div className="container mx-auto">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'signals' && <SignalsFeed key={activeTab} onMarkAsTaken={handleMarkAsTaken} onAddToJournal={handleAddToJournal} onChatWithNexus={handleChatWithNexus} />}
              {activeTab === 'analytics' && <PerformanceAnalytics tradingState={tradingState} />}
              {activeTab === 'journal' && hasJournalAccess && <TradingJournalDashboard />}
              {activeTab === 'accounts' && hasProAccess && <MultiAccountTracker />}
              {activeTab === 'rules' && <PropFirmRules dashboardData={dashboardData} />}
              {activeTab === 'risk-protocol' && <RiskProtocol dashboardData={dashboardData} />}
              {activeTab === 'ai-coach' && (
                <iframe
                  ref={aiCoachRef}
                  src="/src/components/AICoach.html"
                  title="AI Coach"
                  style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: '1rem' }}
                />
              )}
              {activeTab === 'alerts' && <AlertSystem />}
              {activeTab === 'notifications' && <NotificationCenter />}
              {activeTab === 'settings' && <AccountSettings />}
            </div>
        </div>
      </div>
      <ConsentForm
          isOpen={showConsentForm}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      <LiveChatWidget 
        userId={user?.id || user?.email} 
        userName={user?.name || 'TraderEdgePro User'} 
      />
    </>
  );
};

export default DashboardConcept1;
