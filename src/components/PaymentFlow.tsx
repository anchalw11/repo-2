import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  priceId?: string;
}

interface PaymentDetails {
  plan: string;
  price: number;
  period: string;
  date: string;
  status: 'completed' | 'failed' | 'pending';
}

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  
  // State management
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plan from location state or redirect if missing
  useEffect(() => {
    const plan = location.state?.selectedPlan;
    if (!plan) {
      // If no plan selected, redirect to plans page
      navigate('/pricing', { replace: true });
      return;
    }
    setSelectedPlan(plan);
    setIsLoading(false);
  }, [location.state, navigate]);

  // Handle authentication and temporary accounts
  useEffect(() => {
    if (!user?.isAuthenticated) {
      // Store intended URL before redirecting to sign in
      localStorage.setItem('redirect_after_login', '/payment');
      navigate('/signin', { replace: true });
      return;
    }
    
    if (user?.isTemporary) {
      // Handle temporary account flow if needed
      console.log('Processing payment for temporary account');
    }
  }, [user, navigate]);

  const handlePaymentComplete = async () => {
    if (!selectedPlan) {
      setError('No plan selected. Please select a plan and try again.');
      return;
    }

    try {
      setPaymentComplete(true);
      
      if (user) {
        const newMembershipTier = selectedPlan.id;
        
        // Update user's plan on the backend
        await axios.put(
          'https://traderedgepro.com/api/user/plan', 
          { 
            plan: newMembershipTier,
            price: selectedPlan.price,
            period: selectedPlan.period
          }, 
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update user context with new membership
        setUser({
          ...user,
          membershipTier: newMembershipTier as 'starter' | 'pro' | 'enterprise'
        });
        
        // Store payment details
        const paymentDetails: PaymentDetails = {
          plan: selectedPlan.name,
          price: selectedPlan.price,
          period: selectedPlan.period,
          date: new Date().toISOString(),
          status: 'completed'
        };
        
        localStorage.setItem('payment_details', JSON.stringify(paymentDetails));
        
        // Redirect to questionnaire after a short delay
        setTimeout(() => {
          navigate('/questionnaire', { 
            state: { 
              fromPayment: true,
              plan: selectedPlan
            },
            replace: true
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      setError('Failed to process payment. Please try again.');
      setPaymentComplete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">No Plan Selected</h2>
          <p className="text-gray-400 mb-6">Please select a plan to continue with the payment process.</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

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

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

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
              selectedPlan={{
                name: selectedPlan.name,
                price: selectedPlan.price,
                period: selectedPlan.period,
                priceId: selectedPlan.priceId || ''
              }}
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
