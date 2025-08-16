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

const DashboardConcept3 = ({ onLogout }: { onLogout: () => void }) => {
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
      <div className="cyber-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="cyber-title">Welcome, {user.name}</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`cyber-card`}
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
        <div className="lg:col-span-2 cyber-card">
          <h3 className="cyber-title">Recent Trades</h3>
          {tradingState && tradingState.trades.length === 0 ? (
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
              {tradingState?.trades.slice(-5).reverse().map((trade, index) => (
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
        <div className="cyber-card">
          <h3 className="cyber-title">Market Status</h3>
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
      <div className="cyber-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="cyber-title">Economic Calendar</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Timezone:</label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="bg-black border border-green-500 rounded px-3 py-1 text-green-400 text-sm focus:outline-none focus:border-magenta-500"
              >
                {getAllTimezones().map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-black text-green-400">
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
                className="bg-black border border-green-500 rounded px-3 py-1 text-green-400 text-sm focus:outline-none focus:border-magenta-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Currency:</label>
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="bg-black border border-green-500 rounded px-3 py-1 text-green-400 text-sm focus:outline-none focus:border-magenta-500"
              >
                <option value="ALL" className="bg-black text-green-400">All Currencies</option>
                <option value="USD" className="bg-black text-green-400">USD</option>
                <option value="EUR" className="bg-black text-green-400">EUR</option>
                <option value="GBP" className="bg-black text-green-400">GBP</option>
                <option value="JPY" className="bg-black text-green-400">JPY</option>
                <option value="AUD" className="bg-black text-green-400">AUD</option>
                <option value="CAD" className="bg-black text-green-400">CAD</option>
                <option value="CHF" className="bg-black text-green-400">CHF</option>
                <option value="NZD" className="bg-black text-green-400">NZD</option>
                <option value="CNY" className="bg-black text-green-400">CNY</option>
              </select>
            </div>
          </div>
        </div>

        {isLoadingNews ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="ml-3 text-gray-400">Loading economic events...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-magenta-500/50">
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Time</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Currency</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Impact</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Event</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Actual</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Forecast</th>
                  <th className="text-left py-3 px-4 text-green-400 font-medium uppercase text-xs tracking-wider">Previous</th>
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
                    <tr key={index} className="border-b border-green-500/20 hover:bg-green-500/5 transition-colors">
                      <td className="py-3 px-4 text-white text-sm font-mono">
                        {formatEventTime(event.date, selectedTimezone)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/50">
                          {event.currency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)} shadow-lg`}></div>
                          <span className="text-xs text-gray-400 font-mono">{getImpactIcon(event.impact)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white text-sm max-w-xs truncate" title={event.event}>
                        {event.event}
                      </td>
                      <td className="py-3 px-4 text-green-400 text-sm font-medium font-mono">
                        {event.actual || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm font-mono">
                        {event.forecast || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm font-mono">
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
        /* CONCEPT 3: CYBERPUNK NEON */
        .concept3 {
            background: #0a0a0a;
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            display: flex;
        }

        .cyber-rain {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="20" font-family="monospace" font-size="10" fill="%2300ff00" opacity="0.1">01001</text></svg>');
            animation: rain-fall 10s linear infinite;
            opacity: 0.1;
        }

        @keyframes rain-fall {
            0% { transform: translateY(-100px); }
            100% { transform: translateY(100vh); }
        }

        .cyber-sidebar {
            width: 80px;
            height: 100%;
            background: #111;
            border-right: 2px solid #ff00ff;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            z-index: 100;
        }

        .cyber-icon {
            width: 50px;
            height: 50px;
            margin: 20px 0;
            border: 2px solid #00ff00;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
            font-size: 24px;
            color: #00ff00;
        }

        .cyber-icon.active {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 20px #00ff00;
        }

        .cyber-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #00ff00, transparent);
            transition: left 0.5s;
        }

        .cyber-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px #00ff00;
        }

        .cyber-icon:hover::before {
            left: 100%;
        }

        .cyber-main {
            flex: 1;
            padding: 40px;
            height: 100vh;
            overflow-y: auto;
        }

        .cyber-card {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ff00ff;
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
            clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
        }

        .cyber-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #ff00ff, #00ff00, #ff00ff);
            z-index: -1;
            clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
            animation: border-glow 3s linear infinite;
        }

        @keyframes border-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        .cyber-title {
            font-size: 18px;
            color: #00ff00;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #00ff00;
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
      <div className="concept3">
        <div className="cyber-rain"></div>
        <div className="cyber-sidebar">
            {sidebarTabs.map(item => (
                <div 
                    key={item.id}
                    className={`cyber-icon ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleTabClick(item.id)}
                    title={item.label}
                >
                    {item.icon}
                </div>
            ))}
        </div>
        <div className="cyber-main">
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

export default DashboardConcept3;
