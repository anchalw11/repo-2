import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Video,
  MoreHorizontal,
  Star,
  Send,
  Paperclip,
  Smile,
  Settings,
  Bell,
  User,
  BarChart3,
  Calendar,
  Tag,
  Archive,
  RefreshCw,
  LifeBuoy,
  Shield,
  LogOut,
  Zap,
  Bot,
  Globe,
  Database,
  Activity,
  Headphones
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  time: string;
  status: 'active' | 'waiting' | 'resolved';
}

interface Message {
  type: 'customer' | 'agent';
  text: string;
  time: string;
}

interface Stats {
  activeConversations: number;
  avgResponseTime: string;
  customerSatisfaction: string;
  resolvedToday: number;
}

const CustomerServiceDashboard: React.FC = () => {
  const [currentChat, setCurrentChat] = useState<number | null>(null);
  const [chats, setChats] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<{ [key: number]: Message[] }>({});
  const [messageInput, setMessageInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState<Stats>({
    activeConversations: 12,
    avgResponseTime: '2.4 min',
    customerSatisfaction: '4.8/5',
    resolvedToday: 28
  });

  // Initialize sample data
  useEffect(() => {
    const customers: Customer[] = [
      { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', message: 'I need help with my account access', priority: 'high', time: '2 min ago', status: 'active' },
      { id: 2, name: 'Mike Chen', email: 'mike@email.com', message: 'Question about trading signals', priority: 'medium', time: '5 min ago', status: 'active' },
      { id: 3, name: 'Emma Wilson', email: 'emma@email.com', message: 'How do I upgrade my plan?', priority: 'low', time: '10 min ago', status: 'waiting' },
      { id: 4, name: 'Alex Kumar', email: 'alex@email.com', message: 'Technical issue with the platform', priority: 'high', time: '15 min ago', status: 'active' },
      { id: 5, name: 'Lisa Park', email: 'lisa@email.com', message: 'Thank you for your help!', priority: 'low', time: '30 min ago', status: 'resolved' }
    ];

    setChats(customers);
    
    // Initialize messages for each chat
    const initialMessages: { [key: number]: Message[] } = {};
    customers.forEach(customer => {
      initialMessages[customer.id] = [
        { type: 'customer', text: customer.message, time: customer.time },
        { type: 'agent', text: 'Hello! I\'m here to help you.', time: '1 min ago' }
      ];
    });
    setMessages(initialMessages);
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeConversations: Math.floor(Math.random() * 5) + 10,
        resolvedToday: Math.floor(Math.random() * 10) + 25
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new chats
  useEffect(() => {
    const names = ['David Lee', 'Anna Smith', 'Tom Brown', 'Julia Martinez', 'Robert Wilson'];
    const issues = [
      'Need help with password reset',
      'Question about trading limits',
      'How to withdraw funds?',
      'Account verification pending',
      'Platform not loading properly'
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7 && chats.length < 10) {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomIssue = issues[Math.floor(Math.random() * issues.length)];
        const newChat: Customer = {
          id: Date.now(),
          name: randomName,
          email: randomName.toLowerCase().replace(' ', '.') + '@email.com',
          message: randomIssue,
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
          time: 'Just now',
          status: 'waiting'
        };

        setChats(prev => [newChat, ...prev]);
        setMessages(prev => ({
          ...prev,
          [newChat.id]: [{ type: 'customer', text: randomIssue, time: 'Just now' }]
        }));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [chats.length]);

  const selectChat = (chatId: number) => {
    setCurrentChat(chatId);
  };

  const sendMessage = () => {
    if (messageInput.trim() && currentChat) {
      const newMessage: Message = {
        type: 'agent',
        text: messageInput.trim(),
        time: 'Just now'
      };

      setMessages(prev => ({
        ...prev,
        [currentChat]: [...(prev[currentChat] || []), newMessage]
      }));

      setMessageInput('');

      // Simulate customer response
      setTimeout(() => {
        const responses = [
          'Thank you for your help!',
          'I understand, what should I do next?',
          'That makes sense, thanks for explaining.',
          'Is there anything else I need to know?',
          'Perfect, that solves my issue!'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const customerMessage: Message = {
          type: 'customer',
          text: randomResponse,
          time: 'Just now'
        };

        setMessages(prev => ({
          ...prev,
          [currentChat]: [...(prev[currentChat] || []), customerMessage]
        }));

        // Update chat preview
        setChats(prev => prev.map(chat => 
          chat.id === currentChat 
            ? { ...chat, message: randomResponse, time: 'Just now' }
            : chat
        ));
      }, 2000);
    }
  };

  const sendTemplate = (type: string) => {
    const templates = {
      greeting: 'Hello! Welcome to our support. How can I assist you today?',
      help: 'I\'m here to help! Could you please provide more details about your issue?',
      resolved: 'Great! I\'m glad we could resolve your issue. Is there anything else you need help with?',
      escalate: 'I\'ll escalate this to our senior team for immediate attention. They\'ll be with you shortly.'
    };

    if (currentChat && templates[type as keyof typeof templates]) {
      setMessageInput(templates[type as keyof typeof templates]);
    }
  };

  const filterChats = (status: string) => {
    setActiveFilter(status);
  };

  const transferChat = () => {
    if (currentChat) {
      alert('Chat transferred to senior agent');
      setChats(prev => prev.filter(c => c.id !== currentChat));
      setCurrentChat(null);
    }
  };

  const resolveChat = () => {
    if (currentChat) {
      setChats(prev => prev.map(chat => 
        chat.id === currentChat 
          ? { ...chat, status: 'resolved' as const }
          : chat
      ));
      alert('Chat marked as resolved');
    }
  };

  const closeChat = () => {
    if (currentChat && confirm('Are you sure you want to close this chat?')) {
      setChats(prev => prev.filter(c => c.id !== currentChat));
      setCurrentChat(null);
    }
  };

  const currentChatData = chats.find(c => c.id === currentChat);
  const filteredChats = activeFilter === 'all' ? chats : chats.filter(c => c.status === activeFilter);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-5 bg-black bg-opacity-20 border-b border-white border-opacity-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <LifeBuoy className="w-8 h-8" />
            <span>Support Hub</span>
          </div>
        </div>
        
        <nav className="flex-1 py-5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: chats.filter(c => c.status === 'active').length },
            { id: 'tickets', label: 'Tickets', icon: Tag, badge: 3 },
            { id: 'customers', label: 'Customers', icon: Users, badge: null },
            { id: 'team', label: 'Team', icon: User, badge: null },
            { id: 'reports', label: 'Reports', icon: TrendingUp, badge: null },
            { id: 'settings', label: 'Settings', icon: Settings, badge: null }
          ].map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all relative ${
                activePage === item.id ? 'bg-indigo-600' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              onClick={() => setActivePage(item.id)}
            >
              {activePage === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activePage === 'dashboard' ? 'Dashboard' : 
               activePage === 'conversations' ? 'Conversations' :
               activePage === 'tickets' ? 'Support Tickets' :
               activePage === 'customers' ? 'Customer Management' :
               activePage === 'team' ? 'Team Overview' :
               activePage === 'reports' ? 'Reports & Analytics' : 'Settings'}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers, tickets..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="relative p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <div className="font-semibold text-sm">John Doe</div>
                <div className="text-xs text-gray-500">Support Agent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
          {activePage === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  { title: 'Active Conversations', value: stats.activeConversations, change: '8% from yesterday', icon: MessageSquare, color: 'blue' },
                  { title: 'Avg Response Time', value: stats.avgResponseTime, change: '12% improvement', icon: Clock, color: 'green' },
                  { title: 'Customer Satisfaction', value: stats.customerSatisfaction, change: '0.2 points', icon: Star, color: 'yellow' },
                  { title: 'Resolved Today', value: stats.resolvedToday, change: '5% from average', icon: CheckCircle, color: 'pink' }
                ].map((stat, index) => (
                  <div key={index} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-gray-500 text-sm font-medium">{stat.title}</span>
                      <div className={`p-2 rounded-lg ${
                        stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        stat.color === 'green' ? 'bg-green-100 text-green-600' :
                        stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-pink-100 text-pink-600'
                      }`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 mb-2">{stat.value}</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Section */}
              <h3 className="text-xl font-semibold text-gray-800 mb-5">Live Support</h3>
              <div className="grid grid-cols-12 gap-5 h-96">
                {/* Chat List */}
                <div className="col-span-4 bg-white rounded-xl overflow-hidden flex flex-col">
                  <div className="p-4 bg-gray-50 border-b">
                    <h4 className="font-semibold mb-3">Conversations</h4>
                    <div className="flex gap-2">
                      {['all', 'active', 'waiting', 'resolved'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => filterChats(filter)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            activeFilter === filter
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {filteredChats.map(chat => (
                      <div
                        key={chat.id}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                          currentChat === chat.id ? 'bg-blue-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectChat(chat.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-800">{chat.name}</span>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 truncate">{chat.message}</div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            chat.priority === 'high' ? 'bg-red-100 text-red-800' :
                            chat.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {chat.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="col-span-5 bg-white rounded-xl flex flex-col">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {currentChatData ? currentChatData.name.split(' ').map(n => n[0]).join('') : 'SC'}
                      </div>
                      <div>
                        <h3 className="font-semibold">{currentChatData?.name || 'Select a conversation'}</h3>
                        <p className="text-sm text-gray-500">{currentChatData?.email || 'Choose a chat from the list to begin'}</p>
                      </div>
                    </div>
                    
                    {currentChatData && (
                      <div className="flex gap-2">
                        <button onClick={transferChat} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={resolveChat} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={closeChat} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {currentChat && messages[currentChat]?.map((msg, index) => (
                      <div key={index} className={`flex gap-3 ${msg.type === 'customer' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {msg.type === 'customer' ? (currentChatData?.name.split(' ').map(n => n[0]).join('') || 'C') : 'JD'}
                        </div>
                        <div className={`max-w-xs ${msg.type === 'customer' ? 'text-right' : ''}`}>
                          <div className={`p-3 rounded-lg ${
                            msg.type === 'customer' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.text}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={sendMessage}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Info Panel */}
                <div className="col-span-3 bg-white rounded-xl p-5 overflow-y-auto">
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Name', value: currentChatData?.name || '-' },
                        { label: 'Email', value: currentChatData?.email || '-' },
                        { label: 'Phone', value: '+1 234-567-8900' },
                        { label: 'Account Type', value: 'Premium' },
                        { label: 'Member Since', value: 'Jan 2024' }
                      ].map(item => (
                        <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500 text-sm">{item.label}</span>
                          <span className="text-gray-800 text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Send Greeting', action: () => sendTemplate('greeting') },
                        { label: 'How can I help?', action: () => sendTemplate('help') },
                        { label: 'Mark as Resolved', action: () => sendTemplate('resolved') },
                        { label: 'Escalate to Manager', action: () => sendTemplate('escalate') }
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full p-2 text-left bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 text-sm"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>• Opened ticket #1234</div>
                      <div>• Contacted support 2 days ago</div>
                      <div>• Account upgraded last month</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceDashboard;
