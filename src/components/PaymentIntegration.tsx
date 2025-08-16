import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Bitcoin, Check, Shield, Lock, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_iSQmzHiUwz1pmfaVTSXSEpbx');

// Type declarations for window properties
declare global {
  interface Window {
    ApplePaySession: any;
    google: any;
  }
}

interface PaymentIntegrationProps {
  selectedPlan: {
    name: string;
    price: number;
    period: string;
  };
  onPaymentComplete: () => void;
}

const CheckoutForm: React.FC<PaymentIntegrationProps> = ({ selectedPlan, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showCryptoVerification, setShowCryptoVerification] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [verificationData, setVerificationData] = useState({
    transactionHash: '',
    screenshot: null as File | null,
    amount: '',
    fromAddress: ''
  });
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const paymentMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Shield className="w-6 h-6" />,
      description: 'Pay with your PayPal account',
      fees: 'No additional fees',
      enabled: true
    },
    {
      id: 'stripe',
      name: 'Stripe Checkout',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Secure payment processing',
      fees: 'No additional fees',
      enabled: true
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-6 h-6" />,
      description: 'Ethereum (ETH), Solana (SOL)',
      fees: 'Manual verification required',
      enabled: true
    },
  ];

  // Coupon functions
  const applyCoupon = () => {
    if (couponCode === 'TRADERFREE') {
      setCouponApplied(true);
      setDiscountAmount(selectedPlan.price);
      setError('');
    } else {
      setError('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setDiscountAmount(0);
    setCouponCode('');
  };

  // Stripe Payment Processing
  const processStripePayment = async () => {
    if (!stripe || !elements) {
      return { success: false, error: 'Stripe.js has not loaded yet.' };
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      return { success: false, error: 'Card element not found.' };
    }

    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: selectedPlan.price * 100 }),
    });

    const { clientSecret, error: backendError } = await response.json();

    if (backendError) {
      return { success: false, error: backendError };
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (stripeError) {
      return { success: false, error: stripeError.message };
    }

    return { success: true, paymentIntent };
  };

  // PayPal Payment Processing
  const processPayPalPayment = async () => {
    try {
      // In a real implementation, you would integrate PayPal SDK
      // Create order and capture payment
      
      console.log("Simulating PayPal payment...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Simulate successful payment for demo
      return { success: true, orderId: 'paypal_' + Math.random().toString(36).substr(2, 9) };
    } catch (error) {
      console.error('PayPal payment error:', error);
      return { success: false, error: 'PayPal payment failed' };
    }
  };

  // Cryptocurrency Payment Processing
  const processCryptoPayment = async () => {
    try {
      // Show crypto verification page instead of processing immediately
      setShowCryptoVerification(true);
      return { success: false, showVerification: true };
    } catch (error) {
      console.error('Crypto payment error:', error);
      return { success: false, error: 'Crypto payment failed' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    let paymentSuccessful = false;

    try {
      // Handle free checkout
      if (couponApplied && discountAmount >= selectedPlan.price) {
        localStorage.setItem('payment_details', JSON.stringify({
          method: 'coupon',
          amount: 0,
          plan: selectedPlan.name,
          paymentId: `coupon_${new Date().getTime()}`,
          timestamp: new Date().toISOString()
        }));
        onPaymentComplete();
        paymentSuccessful = true;
        return;
      }

      let paymentResult;

      // Process payment based on selected method
      switch (selectedMethod) {
        case 'stripe':
          paymentResult = await processStripePayment();
          break;
        case 'paypal':
          paymentResult = await processPayPalPayment();
          break;
        case 'crypto':
          paymentResult = await processCryptoPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if ((paymentResult as any).success) {
        // Store payment details
        localStorage.setItem('payment_details', JSON.stringify({
          method: selectedMethod,
          amount: selectedPlan.price,
          plan: selectedPlan.name,
          paymentId: (paymentResult as any).paymentIntent?.id || (paymentResult as any).orderId,
          timestamp: new Date().toISOString()
        }));
        onPaymentComplete();
        paymentSuccessful = true;
      } else if ((paymentResult as any).showVerification) {
        // Don't reset processing state, as we're moving to a new UI
        return;
      } else {
        setError((paymentResult as any).error || 'Payment failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      if (!paymentSuccessful) {
        setIsProcessing(false);
      }
    }
  };

  const cryptoAddresses = {
    ETH: {
      address: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
      name: 'Ethereum (ETH)',
      network: 'Ethereum Mainnet',
      symbol: 'ETH'
    },
    SOL: {
      address: 'GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3',
      name: 'Solana (SOL)',
      network: 'Solana Mainnet',
      symbol: 'SOL'
    }
  };

  const handleCryptoSelection = (crypto: string) => {
    setSelectedCrypto(crypto);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      // Validate verification data
      if (!verificationData.transactionHash.trim()) {
        throw new Error('Transaction hash is required');
      }
      
      if (!verificationData.amount || parseFloat(verificationData.amount) <= 0) {
        throw new Error('Valid amount is required');
      }

      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Store verification details
      localStorage.setItem('crypto_verification', JSON.stringify({
        crypto: selectedCrypto,
        address: cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address,
        transactionHash: verificationData.transactionHash,
        amount: verificationData.amount,
        fromAddress: verificationData.fromAddress,
        screenshot: verificationData.screenshot?.name,
        timestamp: new Date().toISOString(),
        status: 'pending_verification'
      }));

      onPaymentComplete();

    } catch (error: any) {
      setError(error.message || 'Verification failed. Please check your details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Screenshot file size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      setVerificationData(prev => ({ ...prev, screenshot: file }));
      setError('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Crypto Verification Page
  if (showCryptoVerification) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">₿</div>
            <h2 className="text-2xl font-bold text-white mb-4">Cryptocurrency Payment</h2>
            <p className="text-gray-400">
              Send payment to one of our crypto addresses and verify your transaction
            </p>
          </div>

          {!selectedCrypto ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white text-center mb-6">Select Cryptocurrency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cryptoAddresses).map(([key, crypto]) => (
                  <button
                    key={key}
                    onClick={() => handleCryptoSelection(key)}
                    className="p-6 bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-600 hover:border-blue-500 transition-all text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{crypto.symbol}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{crypto.name}</div>
                        <div className="text-gray-400 text-sm">{crypto.network}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Payment Instructions */}
              <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Payment Instructions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Send {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].symbol} to this address:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address)}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-semibold ml-2">${selectedPlan.price} USD equivalent</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Network:</span>
                      <span className="text-white font-semibold ml-2">
                        {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].network}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Verify Your Payment</h3>
                
                
                {error && (
                  <div className="p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Transaction Hash *
                    </label>
                    <input
                      type="text"
                      value={verificationData.transactionHash}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, transactionHash: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter transaction hash"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount Sent (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={verificationData.amount}
                      onChange={(e) => setVerificationData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={selectedPlan.price.toString()}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Wallet Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={verificationData.fromAddress}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, fromAddress: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Your sending wallet address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Screenshot (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                  />
                  {verificationData.screenshot && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ {verificationData.screenshot.name} uploaded
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Max file size: 5MB</p>
                </div>

                <div className="bg-yellow-600/20 border border-yellow-600 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Important Notes</span>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Send the exact USD equivalent amount in {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].symbol}</li>
                    <li>• Use the correct network ({cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].network})</li>
                    <li>• Verification may take 1-24 hours</li>
                    <li>• You'll receive email confirmation once verified</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCrypto('');
                      setVerificationData({ transactionHash: '', screenshot: null, amount: '', fromAddress: '' });
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Submit for Verification</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Order Summary</h3>
              <button
                onClick={() => navigate('/membership')}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Change
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">{selectedPlan.name}</span>
                <span className="text-white font-medium">${selectedPlan.price}/{selectedPlan.period}</span>
              </div>
              
              {/* Coupon Section */}
              <div className="border-t border-gray-600 pt-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                      disabled={couponApplied}
                    />
                    {!couponApplied ? (
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Apply
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {couponApplied && (
                    <div className="bg-green-600/20 border border-green-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Coupon Applied</span>
                      </div>
                      <div className="text-green-300 text-sm mt-1">
                        You saved ${discountAmount.toFixed(2)}!
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <div className="border-t border-gray-600 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">${selectedPlan.price.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between">
                      <span className="text-green-400">Discount</span>
                      <span className="text-green-400">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-white font-bold">
                      ${Math.max(0, selectedPlan.price - discountAmount).toFixed(2)}
                      {couponApplied && discountAmount >= selectedPlan.price && (
                        <span className="text-green-400 ml-2 text-sm">(FREE!)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-600/20 border border-blue-600 rounded-xl">
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">What's Included</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Full access to all features</li>
                <li>• Unlimited trading signals</li>
                <li>• Custom trading plans</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Payment Method</h3>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={!method.enabled}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : method.enabled 
                        ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        : 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={selectedMethod === method.id ? 'text-blue-400' : 'text-gray-400'}>
                      {method.icon}
                    </div>
                    <span className="text-white font-medium">{method.name}</span>
                  </div>
                  <p className="text-sm text-gray-400">{method.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{method.fees}</p>
                </button>
              ))}
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {selectedMethod === 'stripe' && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <CardElement options={{
                    style: {
                      base: {
                        color: '#ffffff',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                          color: '#aab7c4'
                        }
                      },
                      invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                      }
                    }
                  }} />
                </div>
              )}

              {selectedMethod === 'paypal' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💳</div>
                  <p className="text-gray-400">You'll be redirected to PayPal to complete your payment</p>
                </div>
              )}

              {selectedMethod === 'crypto' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">₿</div>
                  <p className="text-gray-400 mb-4">Pay with Ethereum (ETH) or Solana (SOL)</p>
                  <p className="text-sm text-gray-500">Manual verification required after payment</p>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <div className="flex items-center space-x-2 text-blue-400 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                <p className="text-sm text-gray-400">
                  Your payment information is encrypted and secure. We use industry-standard SSL encryption 
                  and never store your payment details.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>
                    {selectedMethod === 'crypto' ? 'Pay with Crypto' :
                     'Complete Purchase'}
                  </span>
                )}
              </button>

              <p className="text-center text-sm text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentIntegration: React.FC<PaymentIntegrationProps> = (props) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm {...props} />
  </Elements>
);

export default PaymentIntegration;
