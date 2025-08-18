import React, { useState } from 'react';
import { CreditCard, Shield, CheckCircle, Lock } from 'lucide-react';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentVerificationManager from '../utils/paymentVerification';

const stripePromise = loadStripe('pk_test_iSQmzHiUwz1pmfaVTSXSEpbx');

interface PaymentIntegrationProps {
  selectedPlan: {
    name: string;
    price: number;
    period: string;
    priceId?: string;
  };
  onPaymentComplete: () => void;
}

const CheckoutForm: React.FC<PaymentIntegrationProps> = ({ selectedPlan, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const paymentVerification = PaymentVerificationManager.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment intent
      const paymentData = selectedPlan.priceId 
        ? { priceId: selectedPlan.priceId }
        : { amount: selectedPlan.price * 100, currency: 'usd' };

      const response = await fetch('https://traderedgepro.com/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        setError(backendError);
        setIsProcessing(false);
        return;
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Verify payment and update user data
        const paymentData = {
          method: 'stripe',
          amount: selectedPlan.price,
          plan: selectedPlan.name.toLowerCase(),
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString()
        };

        // Process payment completion with verification
        const verified = await paymentVerification.processPaymentCompletion(paymentData);
        
        if (verified) {
          // Update user plan in localStorage for immediate access
          localStorage.setItem('user_plan', selectedPlan.name.toLowerCase());
          localStorage.setItem('payment_details', JSON.stringify(paymentData));
          
          onPaymentComplete();
        } else {
          setError('Payment verification failed. Please contact support.');
          setIsProcessing(false);
        }
      } else {
        setError('Payment was not successful. Please try again.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        {/* Plan Summary */}
        <div className="mb-8 p-6 bg-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{selectedPlan.name} Plan</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">${selectedPlan.price}</div>
              <div className="text-sm text-gray-400">per {selectedPlan.period}</div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Card Information
            </label>
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': {
                        color: '#9ca3af',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Security Info */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Complete Payment - ${selectedPlan.price}</span>
              </>
            )}
          </button>
        </form>

        {/* Trust Indicators */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Stripe Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentIntegration: React.FC<PaymentIntegrationProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentIntegration;
