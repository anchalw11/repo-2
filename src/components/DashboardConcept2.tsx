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
import { useTradingPlan } from '../contexts/TradingPlanContext';
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
import { getAllTimezones, getMarketStatus } from '../services/timezoneService';
import { fetchForexFactoryNews, getImpactColor, getImpactIcon, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';

const DashboardConcept2 = ({ onLogout }: { onLogout: () => void }) => {
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
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [currentTime, setCurrentTime] = useState(new Date());
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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate market status based on timezone
  useEffect(() => {
    const calculateMarketStatus = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const dayOfWeek = now.getUTCDay();
      
      // Adjust for selected timezone
      const timezoneOffsets: { [key: string]: number } = {
        'UTC': 0,
        'UTC+5:30': 5.5,
        'UTC-5': -5,
        'UTC-8': -8,
        'UTC+1': 1,
        'UTC+9': 9,
        'UTC+10': 10
      };
      
      const offset = timezoneOffsets[selectedTimezone] || 0;
      const localHour = (utcHour + offset + 24) % 24;
      
      // Weekend check
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && utcHour >= 22);
      
      let currentSession = 'Market Closed';
      let nextSession = 'Sydney';
      let timeUntilNext = '';
      let isOpen = false;
      
      if (!isWeekend) {
        // Sydney: 22:00 UTC - 07:00 UTC
        if (utcHour >= 22 || utcHour < 7) {
          currentSession = 'Sydney';
          nextSession = 'Tokyo';
          isOpen = true;
        }
        // Tokyo: 00:00 UTC - 09:00 UTC
        else if (utcHour >= 0 && utcHour < 9) {
          currentSession = 'Tokyo';
          nextSession = 'London';
          isOpen = true;
        }
        // London: 08:00 UTC - 17:00 UTC
        else if (utcHour >= 8 && utcHour < 17) {
          currentSession = 'London';
          nextSession = 'New York';
          isOpen = true;
        }
        // New York: 13:00 UTC - 22:00 UTC
        else if (utcHour >= 13 && utcHour < 22) {
          currentSession = 'New York';
          nextSession = 'Sydney';
          isOpen = true;
        }
      }
      
      // Calculate time until next session
      if (isWeekend) {
        const nextSunday = new Date(now);
        nextSunday.setUTCDate(now.getUTCDate() + (7 - dayOfWeek));
        nextSunday.setUTCHours(22, 0, 0, 0);
        const diff = nextSunday.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeUntilNext = `${hours}h ${minutes}m`;
      } else {
        // Calculate time to next session
        const sessionTimes = [22, 0, 8, 13]; // Sydney, Tokyo, London, NY
        const currentSessionIndex = sessionTimes.findIndex((time, index) => {
          const nextTime = sessionTimes[(index + 1) % sessionTimes.length];
          return time <= utcHour && utcHour < nextTime;
        });
        
        if (currentSessionIndex !== -1) {
          const nextSessionTime = sessionTimes[(currentSessionIndex + 1) % sessionTimes.length];
          let hoursUntilNext = nextSessionTime - utcHour;
          if (hoursUntilNext <= 0) hoursUntilNext += 24;
          timeUntilNext = `${hoursUntilNext}h 0m`;
        }
      }
      
      setMarketStatus({
        isOpen,
        currentSession,
        nextSession,
        timeUntilNext,
        localTime: now.toLocaleString('en-US', {
          timeZone: selectedTimezone === 'UTC+5:30' ? 'Asia/Kolkata' : 'UTC',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      });
    };
    
    calculateMarketStatus();
  }, [selectedTimezone, currentTime]);

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

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setUserAccounts(response.data);
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      const fetchPerformanceData = async () => {
        try {
          const response = await api.get(`/performance?account_id=${selectedAccount}`);
          setPerformanceData(response.data);
        } catch (error) {
          console.error('Error fetching performance data:', error);
        }
      };

      fetchPerformanceData();
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (userAccounts.length > 0 && selectedAccount) {
      const account = userAccounts.find((acc) => acc.id === selectedAccount) || userAccounts[0];
      setCurrentAccount(account);
    }
  }, [selectedAccount, userAccounts]);

  useEffect(() => {
    const initState = async () => {
      if (user && tradingPlan && currentAccount) {
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
          // Get initial balance from trading plan
          const initialEquity = tradingPlan.userProfile.accountEquity || 100000;
          
          const initialState: TradingState = {
            initialEquity,
            currentEquity: initialEquity,
            trades: [],
            openPositions: [],
            riskSettings: {
              riskPerTrade: parseFloat(tradingPlan.riskParameters?.baseTradeRiskPct?.replace('%', '') || '1'),
              dailyLossLimit: parseFloat(tradingPlan.riskParameters?.maxDailyRiskPct?.replace('%', '') || '5'),
              consecutiveLossesLimit: 3,
            },
            performanceMetrics: {
              totalPnl: 0,
              winRate: 0,
              totalTrades: 0,
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
  }, [user?.email, tradingPlan, currentAccount]);

  // Save trading state to localStorage whenever it changes
  useEffect(() => {
    if (tradingState && user?.email) {
      const stateKey = `trading_state_${user.email}`;
      localStorage.setItem(stateKey, JSON.stringify(tradingState));
    }
  }, [tradingState, user?.email]);

  // Fetch Forex Factory news
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoadingNews(true);
      try {
        const news = await fetchForexFactoryNews(selectedNewsDate, selectedCurrency, selectedTimezone);
        setForexNews(news);
      } catch (error) {
        console.error('Error fetching Forex Factory news:', error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
    // Refresh news every 30 minutes
    const newsInterval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, [selectedNewsDate, selectedCurrency, selectedTimezone]);

  const handleNewsDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedNewsDate(new Date(e.target.value));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };


  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Loading User...</div>
        </div>
      </div>
    );
  }

  const hasProAccess = ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier);
  const hasJournalAccess = ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier);
  const hasEnterpriseAccess = ['enterprise'].includes(user.membershipTier);

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
      value: tradingState ? `$${tradingState.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (tradingPlan ? `$${tradingPlan.userProfile.accountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0'),
      change: 'Live Data',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green',
    },
    {
      label: 'Win Rate',
      value: tradingState ? `${tradingState.performanceMetrics.winRate.toFixed(1)}%` : '0%',
      change: 'From Taken Trades',
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
    },
    {
      label: 'Total Trades',
      value: tradingState ? tradingState.trades.length.toString() : '0',
      change: 'Active Trading',
      icon: <Activity className="w-8 h-8" />,
      color: 'purple',
    },
    {
      label: 'Total P&L',
      value:
        tradingState
          ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
          : '$0.00',
      change: 'From Trades',
      icon: <Award className="w-8 h-8" />,
      color: tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'green' : 'red',
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}</h2>
            <p className="text-gray-400">
              Your {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)} Dashboard
            </p>
            
            {/* Display questionnaire data */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm max-w-4xl mx-auto">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Prop Firm:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.propFirm || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Account Type:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.accountType || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Account Size:</span>
                <span className="text-white ml-2 font-semibold">
                  {user.tradingData?.accountSize ? `$${parseInt(user.tradingData.accountSize).toLocaleString()}` : 'Not Set'}
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Experience:</span>
                <span className="text-white ml-2 font-semibold capitalize">{user.tradingData?.tradingExperience || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Trades/Day:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.tradesPerDay || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Risk/Trade:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.riskPerTrade || 'Not Set'}%</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Risk:Reward:</span>
                <span className="text-white ml-2 font-semibold">1:{user.tradingData?.riskRewardRatio || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Session:</span>
                <span className="text-white ml-2 font-semibold capitalize">{user.tradingData?.tradingSession || 'Not Set'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total P&L</div>
            <div className={`text-3xl font-bold ${tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tradingState
                ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
                : '$0'}
            </div>
          </div>
        </div>
      </div>

      <div className="quantum-grid">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`glass-panel`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 bg-gray-800/60 rounded-full text-blue-400 transition-all duration-300 group-hover:bg-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel">
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
        <div className="glass-panel">
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

      {/* Economic Calendar Section */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Economic Calendar</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Timezone:</label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {getAllTimezones().map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Date:</label>
              <input
                type="date"
                value={selectedNewsDate.toISOString().split('T')[0]}
                onChange={handleNewsDateChange}
                className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Currency:</label>
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Currencies</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="CHF">CHF</option>
                <option value="NZD">NZD</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          </div>
        </div>

        {isLoadingNews ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span className="ml-3 text-gray-400">Loading economic events...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Currency</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Impact</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Event</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actual</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Forecast</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Previous</th>
                </tr>
              </thead>
              <tbody>
                {forexNews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No economic events found for the selected date and currency.
                    </td>
                  </tr>
                ) : (
                  forexNews.map((event, index) => (
                    <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4 text-white text-sm">
                        {formatEventTime(event.date, selectedTimezone)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-white">
                          {event.currency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)}`}></div>
                          <span className="text-xs text-gray-400">{getImpactIcon(event.impact)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white text-sm max-w-xs truncate" title={event.event}>
                        {event.event}
                      </td>
                      <td className="py-3 px-4 text-white text-sm font-medium">
                        {event.actual || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {event.forecast || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {event.previous || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const handleMarkAsTaken = (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
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
      localStorage.setItem(`trading_state_${user.email}`, JSON.stringify(finalState));

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
        /* CONCEPT 2: QUANTUM GLASS */
        .concept2 {
            background: linear-gradient(135deg, #0f0f23 0%, #1a0033 100%);
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            display: flex;
        }

        .quantum-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: -1;
        }

        .q-particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, #fff, #00ffff);
            border-radius: 50%;
            animation: quantum-float 15s infinite linear;
        }

        @keyframes quantum-float {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }

        .glass-panel {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05), 
                rgba(255, 255, 255, 0.01));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
            position: relative;
            overflow: hidden;
            margin-bottom: 30px;
        }

        .glass-panel::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent);
            animation: rotate-glow 10s linear infinite;
        }

        @keyframes rotate-glow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .quantum-sidebar {
            width: 250px;
            height: 100%;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(139, 92, 246, 0.3);
            z-index: 100;
            display: flex;
            flex-direction: column;
        }

        .quantum-logo {
            padding: 30px;
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }

        .quantum-menu-item {
            padding: 20px 30px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .quantum-menu-item.active {
            background: rgba(139, 92, 246, 0.1);
            border-left: 3px solid #8b5cf6;
            color: #8b5cf6;
        }

        .quantum-menu-item:not(.active) {
            color: #fff;
        }

        .quantum-menu-item::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent);
            transition: left 0.5s;
        }

        .quantum-menu-item:hover::before {
            left: 100%;
        }

        .quantum-main {
            flex: 1;
            padding: 40px;
            position: relative;
            height: 100vh;
            overflow-y: auto;
        }

        .quantum-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
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
      <div className="concept2">
        <div className="quantum-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="q-particle" style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}></div>
          ))}
        </div>
        <div className="quantum-sidebar">
            <div className="quantum-logo">TraderEdgePro</div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {sidebarTabs.map((item) => (
                  <div 
                    key={item.id}
                    className={`quantum-menu-item ${activeTab === item.id ? 'active' : ''}`} 
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

        <div className="quantum-main">
            <div className="container mx-auto">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'signals' && <SignalsFeed onMarkAsTaken={handleMarkAsTaken} onAddToJournal={handleAddToJournal} onChatWithNexus={handleChatWithNexus} />}
              {activeTab === 'analytics' && <PerformanceAnalytics tradingState={tradingState} />}
              {activeTab === 'journal' && hasJournalAccess && <TradingJournalDashboard />}
              {activeTab === 'accounts' && hasProAccess && <MultiAccountTracker />}
              {activeTab === 'rules' && <PropFirmRules />}
              {activeTab === 'risk-protocol' && <RiskProtocol />}
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
    </>
  );
};

export default DashboardConcept2;
