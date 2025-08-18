// Payment Verification System
import UserDataManager, { PaymentRecord } from './userDataManager';

export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  accountId: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  merchantId: string;
}

export interface CryptoConfig {
  ethWallet: string;
  solWallet: string;
  btcWallet: string;
}

class PaymentVerificationManager {
  private static instance: PaymentVerificationManager;
  private userDataManager: UserDataManager;

  // Production payment configuration
  private stripeConfig: StripeConfig = {
    publicKey: 'pk_live_51234567890abcdef', // Replace with actual live key
    secretKey: 'sk_live_51234567890abcdef', // Replace with actual live key
    webhookSecret: 'whsec_1234567890abcdef', // Replace with actual webhook secret
    accountId: 'acct_1234567890abcdef' // Your Stripe account ID
  };

  private paypalConfig: PayPalConfig = {
    clientId: 'AYourPayPalClientId', // Replace with actual PayPal client ID
    clientSecret: 'EYourPayPalClientSecret', // Replace with actual PayPal secret
    merchantId: 'YourMerchantId' // Your PayPal merchant ID
  };

  private cryptoConfig: CryptoConfig = {
    ethWallet: '0x1234567890123456789012345678901234567890', // Your ETH wallet
    solWallet: 'YourSolanaWalletAddress123456789', // Your Solana wallet
    btcWallet: 'bc1qYourBitcoinWalletAddress123456789' // Your Bitcoin wallet
  };

  constructor() {
    this.userDataManager = UserDataManager.getInstance();
  }

  static getInstance(): PaymentVerificationManager {
    if (!PaymentVerificationManager.instance) {
      PaymentVerificationManager.instance = new PaymentVerificationManager();
    }
    return PaymentVerificationManager.instance;
  }

  // Verify Stripe payment
  async verifyStripePayment(paymentIntentId: string): Promise<boolean> {
    try {
      const response = await fetch('https://traderedgepro.com/api/verify-stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          accountId: this.stripeConfig.accountId
        }),
      });

      const result = await response.json();
      
      if (result.success && result.payment) {
        // Record payment in user data
        const paymentRecord: PaymentRecord = {
          paymentId: paymentIntentId,
          method: 'stripe',
          amount: result.payment.amount / 100, // Convert from cents
          currency: result.payment.currency,
          plan: result.payment.metadata?.plan || 'unknown',
          status: 'completed',
          timestamp: new Date().toISOString(),
          stripePaymentIntentId: paymentIntentId
        };

        this.userDataManager.addPaymentRecord(paymentRecord);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Stripe payment verification failed:', error);
      return false;
    }
  }

  // Verify PayPal payment
  async verifyPayPalPayment(orderId: string): Promise<boolean> {
    try {
      const response = await fetch('https://traderedgepro.com/api/verify-paypal-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          merchantId: this.paypalConfig.merchantId
        }),
      });

      const result = await response.json();
      
      if (result.success && result.payment) {
        const paymentRecord: PaymentRecord = {
          paymentId: orderId,
          method: 'paypal',
          amount: parseFloat(result.payment.amount),
          currency: result.payment.currency,
          plan: result.payment.plan || 'unknown',
          status: 'completed',
          timestamp: new Date().toISOString(),
          paypalOrderId: orderId
        };

        this.userDataManager.addPaymentRecord(paymentRecord);
        return true;
      }

      return false;
    } catch (error) {
      console.error('PayPal payment verification failed:', error);
      return false;
    }
  }

  // Verify cryptocurrency payment
  async verifyCryptoPayment(transactionHash: string, currency: 'ETH' | 'SOL' | 'BTC', expectedAmount: number): Promise<boolean> {
    try {
      const walletAddress = currency === 'ETH' ? this.cryptoConfig.ethWallet :
                           currency === 'SOL' ? this.cryptoConfig.solWallet :
                           this.cryptoConfig.btcWallet;

      const response = await fetch('https://traderedgepro.com/api/verify-crypto-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash,
          currency,
          walletAddress,
          expectedAmount
        }),
      });

      const result = await response.json();
      
      if (result.success && result.transaction) {
        const paymentRecord: PaymentRecord = {
          paymentId: transactionHash,
          method: 'crypto',
          amount: result.transaction.amount,
          currency: currency,
          plan: result.transaction.plan || 'unknown',
          status: 'completed',
          timestamp: new Date().toISOString(),
          transactionHash: transactionHash
        };

        this.userDataManager.addPaymentRecord(paymentRecord);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Crypto payment verification failed:', error);
      return false;
    }
  }

  // Get payment configuration for frontend
  getPaymentConfig() {
    return {
      stripe: {
        publicKey: this.stripeConfig.publicKey
      },
      paypal: {
        clientId: this.paypalConfig.clientId
      },
      crypto: {
        wallets: {
          ETH: this.cryptoConfig.ethWallet,
          SOL: this.cryptoConfig.solWallet,
          BTC: this.cryptoConfig.btcWallet
        }
      }
    };
  }

  // Process payment completion
  async processPaymentCompletion(paymentData: any): Promise<boolean> {
    try {
      let verified = false;

      switch (paymentData.method) {
        case 'stripe':
          verified = await this.verifyStripePayment(paymentData.paymentIntentId);
          break;
        case 'paypal':
          verified = await this.verifyPayPalPayment(paymentData.orderId);
          break;
        case 'crypto':
          verified = await this.verifyCryptoPayment(
            paymentData.transactionHash,
            paymentData.currency,
            paymentData.amount
          );
          break;
      }

      if (verified) {
        // Update user subscription status
        const userData = this.userDataManager.getUserData();
        if (userData) {
          this.userDataManager.updateUserData({
            plan: paymentData.plan,
            subscriptionStatus: 'active'
          });
        }

        // Send confirmation email
        await this.sendPaymentConfirmation(paymentData);
      }

      return verified;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return false;
    }
  }

  // Send payment confirmation
  private async sendPaymentConfirmation(paymentData: any): Promise<void> {
    try {
      await fetch('https://traderedgepro.com/api/send-payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  }

  // Get all payment records for user
  getUserPaymentHistory(): PaymentRecord[] {
    const userData = this.userDataManager.getUserData();
    return userData?.paymentHistory || [];
  }

  // Validate payment amount and plan
  validatePaymentAmount(plan: string, amount: number): boolean {
    const planPrices = {
      kickstarter: 29,
      basic: 49,
      pro: 99,
      enterprise: 199
    };

    return planPrices[plan as keyof typeof planPrices] === amount;
  }

  // Generate payment receipt
  generatePaymentReceipt(paymentId: string): any {
    const userData = this.userDataManager.getUserData();
    const payment = userData?.paymentHistory.find(p => p.paymentId === paymentId);
    
    if (!payment) return null;

    return {
      receiptId: `RECEIPT_${paymentId}`,
      customerName: userData?.username,
      customerEmail: userData?.email,
      payment: payment,
      generatedAt: new Date().toISOString()
    };
  }
}

export default PaymentVerificationManager;
