import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  
  // Get selected plan from location state or default
  const selectedPlan = location.state?.selectedPlan || {
    name: 'Professional',
    price: 99,
    period: 'month'
  };

  const [paymentComplete, setPaymentComplete] = useState(false);

  const handlePaymentComplete = async () => {
    setPaymentComplete(true);
    // Update user with premium membership
    if (user) {
      const newMembershipTier = selectedPlan.name.toLowerCase();
      try {
        await axios.put('/api/user/plan', { plan: newMembershipTier }, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setUser({
          ...user,
          membershipTier: newMembershipTier as 'basic' | 'professional' | 'institutional' | 'elite'
        });
      } catch (error) {
        console.error('Failed to update plan', error);
      }
    }
  };

  // Navigate to questionnaire only when payment is complete
  React.useEffect(() => {
    if (paymentComplete) {
      setTimeout(() => {
        navigate('/questionnaire');
      }, 3000); // 3-second delay to show the message
    }
  }, [paymentComplete, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">TraderEdge Pro</h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-white font-semibold">Complete Your Setup</div>
            <div className="text-sm text-gray-400">Step 2 of 2</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete Your Subscription
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Get instant access to all premium features and start your trading journey
            </p>
          </div>

          {/* Payment Integration */}
          {paymentComplete ? (
            <div className="max-w-2xl mx-auto p-6 text-center">
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-4">Payment Successful!</h2>
                <p className="text-gray-400 mb-6">
                  Welcome to TraderEdge Pro {selectedPlan.name}! Your account is being set up.
                </p>
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>
          ) : (
            <PaymentIntegration 
              selectedPlan={selectedPlan}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {/* Confirmation Message */}
          <div className="text-center mt-8 text-gray-400">
            <p>After successful payment, you will proceed to the questionnaire.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFlow;
