import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, Zap, Shield, Cpu } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
  options?: string[];
}

interface LiveChatWidgetProps {
  userId?: string;
  userName?: string;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ userId, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnectedToAgent, setIsConnectedToAgent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = useRef<string>(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const botResponses = {
    greeting: {
      text: "🚀 Quantum AI Assistant activated! I'm your advanced trading support companion. How may I assist you in optimizing your trading experience?",
      options: [
        "🔐 Account Matrix",
        "📡 Signal Analytics",
        "⚡ Platform Neural Hub",
        "💎 Quantum Billing",
        "🛡️ Tech Support Grid"
      ]
    },
    "account matrix": {
      text: "🔐 Accessing Account Matrix... What specific protocol requires attention?",
      options: [
        "🚫 Access Denied",
        "🔑 Quantum Reset",
        "✅ Identity Verification",
        "⚙️ Profile Configuration",
        "👤 Human Agent Transfer"
      ]
    },
    "signal analytics": {
      text: "📡 Signal Analytics Network online. Which neural pathway needs optimization?",
      options: [
        "📊 Signal Reception Protocol",
        "🎯 Accuracy Algorithms",
        "💫 Subscription Matrix",
        "📈 Historical Data Mining",
        "👤 Human Agent Transfer"
      ]
    },
    "platform neural hub": {
      text: "⚡ Neural Hub interface activated. Select your navigation protocol:",
      options: [
        "🗺️ Dashboard Navigation",
        "📊 Chart Analysis Engine",
        "🛡️ Risk Management Core",
        "📈 Performance Tracking",
        "👤 Human Agent Transfer"
      ]
    },
    "quantum billing": {
      text: "💎 Quantum Billing System accessed. Which financial protocol requires attention?",
      options: [
        "💳 Payment Quantum Gates",
        "🔄 Subscription Status",
        "↩️ Refund Protocols",
        "⬆️ Upgrade Matrix",
        "👤 Human Agent Transfer"
      ]
    },
    "tech support grid": {
      text: "🛡️ Technical Support Grid online. Diagnosing system anomalies...",
      options: [
        "🚫 Loading Failures",
        "🌐 Connection Disruptions",
        "🔧 Browser Compatibility",
        "📱 Mobile Interface Issues",
        "👤 Human Agent Transfer"
      ]
    },
    "access denied": {
      text: "🔐 Authentication Protocol Initiated...\n\n🔹 Verify credentials matrix\n🔹 Clear quantum cache\n🔹 Activate stealth mode\n🔹 Initialize password reset\n\nShall I connect you to our Human Agent for advanced troubleshooting?",
      options: ["✅ Execute Protocol", "👤 Human Agent Transfer"]
    },
    "quantum reset": {
      text: "🔑 Quantum Password Reset Sequence:\n\n🔹 Navigate to login portal\n🔹 Activate 'Forgot Password' protocol\n🔹 Input your registered email\n🔹 Check quantum mailbox for reset link\n🔹 Follow neural pathway instructions\n\nIf quantum mail doesn't arrive, check spam matrix. Need advanced assistance?",
      options: ["✅ Protocol Complete", "🆘 Still Need Help", "👤 Human Agent Transfer"]
    },
    "signal reception protocol": {
      text: "📡 Signal Reception Protocol Analysis:\n\n🔹 Verify subscription matrix is active\n🔹 Check notification neural pathways\n🔹 Enable quantum push notifications\n🔹 Signals transmitted to dashboard & email\n\nWhich protocol requires optimization?",
      options: ["🔍 Check Subscription", "🔔 Notification Settings", "👤 Human Agent Transfer"]
    },
    "human agent transfer": {
      text: "👤 Initiating Human Agent Transfer Protocol... Quantum tunneling in progress...",
      options: []
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'bot',
        text: botResponses.greeting.text,
        timestamp: new Date(),
        options: botResponses.greeting.options
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type !== 'user') {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        text: inputMessage.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      setIsTyping(true);
      
      setTimeout(() => {
        handleBotResponse(inputMessage.trim().toLowerCase());
        setIsTyping(false);
      }, 1000 + Math.random() * 1000);
    }
  };

  const handleOptionClick = (option: string) => {
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      text: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    setIsTyping(true);
    setTimeout(() => {
      handleBotResponse(option.toLowerCase());
      setIsTyping(false);
    }, 800);
  };

  const handleBotResponse = (userInput: string) => {
    let response = botResponses.greeting;

    // Check for specific responses
    for (const [key, value] of Object.entries(botResponses)) {
      if (userInput.includes(key.toLowerCase()) || key.toLowerCase().includes(userInput)) {
        response = value;
        break;
      }
    }

    // Special case for connecting to agent
    if (userInput.includes('human agent transfer') || userInput.includes('human') || userInput.includes('agent')) {
      response = botResponses["human agent transfer"];
      setTimeout(() => {
        setIsConnectedToAgent(true);
        const agentMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'agent',
          text: `🌟 Human Agent Connected! Hello ${userName || 'Quantum Trader'}! I'm your dedicated support specialist. I've analyzed your conversation with our AI. How can I enhance your trading experience?`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
        
        notifyCustomerService(userInput);
      }, 2000);
    }

    const botMessage: Message = {
      id: `msg_${Date.now()}`,
      type: isConnectedToAgent ? 'agent' : 'bot',
      text: response.text,
      timestamp: new Date(),
      options: response.options
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const notifyCustomerService = (query: string) => {
    const chatData = {
      chatId: chatId.current,
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous Quantum Trader',
      query: query,
      messages: messages,
      timestamp: new Date().toISOString()
    };

    const existingChats = JSON.parse(localStorage.getItem('cs_live_chats') || '[]');
    existingChats.push(chatData);
    localStorage.setItem('cs_live_chats', JSON.stringify(existingChats));

    window.dispatchEvent(new CustomEvent('newChatRequest', { detail: chatData }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 animate-pulse border-2 border-cyan-300/50"
          style={{
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.5), inset 0 0 30px rgba(147, 51, 234, 0.3)'
          }}
        >
          <MessageSquare className="w-6 h-6" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 animate-ping"></div>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
    }`}>
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-cyan-500/30 backdrop-blur-xl"
        style={{
          boxShadow: '0 0 50px rgba(6, 182, 212, 0.3), inset 0 0 50px rgba(147, 51, 234, 0.1)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="flex items-center space-x-3 relative z-10">
            {isConnectedToAgent ? (
              <>
                <div className="relative">
                  <User className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white"></div>
                </div>
                <span className="font-bold text-sm">🌟 QUANTUM AGENT</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Cpu className="w-5 h-5 animate-spin" />
                  <Zap className="absolute inset-0 w-5 h-5 text-yellow-300 animate-ping" />
                </div>
                <span className="font-bold text-sm">🤖 NEURAL AI</span>
              </>
            )}
            {isConnectedToAgent && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">LIVE</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 relative z-10">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-cyan-200 transition-colors p-1 rounded hover:bg-white/10"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-red-300 transition-colors p-1 rounded hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900/50 to-black/50 backdrop-blur-sm">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-2xl relative overflow-hidden ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                      : message.type === 'agent'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-100 border border-green-400/30 shadow-lg'
                      : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-100 border border-purple-400/30 shadow-lg'
                  }`}
                  style={{
                    boxShadow: message.type === 'user' 
                      ? '0 0 20px rgba(6, 182, 212, 0.3)' 
                      : message.type === 'agent'
                      ? '0 0 20px rgba(34, 197, 94, 0.2)'
                      : '0 0 20px rgba(147, 51, 234, 0.2)'
                  }}>
                    {message.type !== 'user' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse"></div>
                    )}
                    <div className="text-sm whitespace-pre-wrap relative z-10 font-medium">{message.text}</div>
                    <div className="text-xs opacity-70 mt-2 relative z-10">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {message.options && message.options.length > 0 && (
                      <div className="mt-3 space-y-2 relative z-10">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionClick(option)}
                            className="block w-full text-left text-xs bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-cyan-200 hover:from-cyan-600/20 hover:to-blue-600/20 border border-cyan-400/30 rounded-lg px-3 py-2 transition-all duration-300 hover:shadow-lg hover:border-cyan-300/50 font-medium backdrop-blur-sm"
                            style={{
                              boxShadow: '0 0 10px rgba(6, 182, 212, 0.1)'
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-100 border border-purple-400/30 p-3 rounded-2xl shadow-lg backdrop-blur-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gradient-to-r from-gray-800/50 to-black/50 rounded-b-2xl border-t border-cyan-500/20 backdrop-blur-sm">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter quantum message..."
                  className="flex-1 bg-gradient-to-r from-gray-700/50 to-gray-600/50 border border-cyan-400/30 rounded-xl px-4 py-2 text-sm text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm font-medium"
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.1)'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white p-2 rounded-xl transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-lg"
                  style={{
                    boxShadow: !inputMessage.trim() ? 'none' : '0 0 20px rgba(6, 182, 212, 0.4)'
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveChatWidget;
