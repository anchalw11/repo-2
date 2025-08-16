import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

const AdminMpinLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithMpin } = useAdmin();
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
      const success = await loginWithMpin(mpin);

      if (success) {
        navigate('/admin/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Shield className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-white">Admin Portal</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Signal Master Dashboard</h2>
          <p className="text-gray-400">Enter your 6-digit MPIN for secure access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
          {error && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin MPIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showMpin ? 'text' : 'password'}
                  value={mpin}
                  onChange={handleMpinChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMpin(!showMpin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showMpin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Enter the 6-digit MPIN provided by the system administrator
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || mpin.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
              Secure MPIN Authentication • Admin Access Only
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminMpinLogin;
