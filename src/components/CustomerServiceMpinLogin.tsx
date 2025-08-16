import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Lock, LifeBuoy } from 'lucide-react';

const CustomerServiceMpinLogin: React.FC = () => {
  const navigate = useNavigate();
  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (mpin.length !== 6) {
      setError('MPIN must be 6 digits');
      setIsLoading(false);
      return;
    }

    try {
      // Customer Service MPIN is 061823
      if (mpin === '061823') {
        localStorage.setItem('cs_token', 'cs_mpin_authenticated_token');
        localStorage.setItem('cs_agent', 'Customer Service Agent');
        navigate('/customer-service/dashboard');
      } else {
        setError('Invalid MPIN. Access denied.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMpin(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <LifeBuoy className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">Support Portal</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Customer Service Hub</h2>
          <p className="text-indigo-100">Enter your 6-digit MPIN for secure access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-400 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Agent MPIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-200 w-5 h-5" />
                <input
                  type={showMpin ? 'text' : 'password'}
                  value={mpin}
                  onChange={handleMpinChange}
                  className="w-full pl-10 pr-12 py-3 bg-white/20 border border-white/30 rounded-lg text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-white focus:border-transparent placeholder-indigo-200"
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMpin(!showMpin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-200 hover:text-white"
                >
                  {showMpin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-indigo-100">
                Enter the 6-digit MPIN provided by the system administrator
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || mpin.length !== 6}
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-white/50 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Access Support Dashboard
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="text-xs text-indigo-100">
              Secure MPIN Authentication • Customer Service Access Only
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerServiceMpinLogin;
