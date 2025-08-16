import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import Web3 from 'web3';
import { Connection, PublicKey } from '@solana/web3.js';

// API Keys
const ETHERSCAN_API_KEY = 'RZWN53EMKX2ZZ5AA8TRE5GE9887K6SEZJS';
const SOLSCAN_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTUyNzgwNTgyNzAsImVtYWlsIjoiZ2lnZ2xldGFsZXMxOEBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NTUyNzgwNTh9.DHscBo08yV5qhquq3hTESZkauO8Ee5SFSpEW3JCwGzQ';

// Wallet addresses
const CRYPTO_ADDRESSES = {
  ETH: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
  SOL: 'GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3'
};

// Initialize Web3 for ETH price conversion
const web3 = new Web3();

// Initialize Solana connection
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com');

interface CryptoVerificationRequest {
  transactionHash: string;
  expectedAmountUSD: number;
  cryptocurrency: 'ETH' | 'SOL';
  tolerance?: number; // Tolerance percentage for price fluctuations (default 2%)
}

// Get current crypto prices in USD
async function getCryptoPrices(): Promise<{ ETH: number; SOL: number }> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd'
    );
    
    return {
      ETH: response.data.ethereum.usd,
      SOL: response.data.solana.usd
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    throw new Error('Failed to fetch current crypto prices');
  }
}

// Verify Ethereum transaction
async function verifyEthereumTransaction(
  txHash: string, 
  expectedAmountUSD: number, 
  tolerance: number = 2
): Promise<{ verified: boolean; details: any; error?: string }> {
  try {
    // Get transaction details from Etherscan
    const response = await axios.get(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
    );

    if (!response.data.result) {
      return { verified: false, details: null, error: 'Transaction not found' };
    }

    const tx = response.data.result;
    
    // Check if transaction is to our address
    if (tx.to.toLowerCase() !== CRYPTO_ADDRESSES.ETH.toLowerCase()) {
      return { 
        verified: false, 
        details: tx, 
        error: `Transaction not sent to our address. Expected: ${CRYPTO_ADDRESSES.ETH}, Got: ${tx.to}` 
      };
    }

    // Get transaction receipt to check if it was successful
    const receiptResponse = await axios.get(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
    );

    if (!receiptResponse.data.result || receiptResponse.data.result.status !== '0x1') {
      return { verified: false, details: tx, error: 'Transaction failed or pending' };
    }

    // Convert Wei to ETH
    const amountETH = parseFloat(web3.utils.fromWei(tx.value, 'ether'));
    
    // Get current ETH price
    const prices = await getCryptoPrices();
    const amountUSD = amountETH * prices.ETH;
    
    // Check if amount matches within tolerance
    const toleranceAmount = expectedAmountUSD * (tolerance / 100);
    const amountDifference = Math.abs(amountUSD - expectedAmountUSD);
    
    if (amountDifference > toleranceAmount) {
      return {
        verified: false,
        details: {
          ...tx,
          amountETH,
          amountUSD,
          expectedAmountUSD,
          difference: amountDifference,
          tolerance: toleranceAmount
        },
        error: `Amount mismatch. Expected: $${expectedAmountUSD}, Got: $${amountUSD.toFixed(2)}, Difference: $${amountDifference.toFixed(2)}`
      };
    }

    return {
      verified: true,
      details: {
        ...tx,
        amountETH,
        amountUSD,
        expectedAmountUSD,
        difference: amountDifference,
        ethPrice: prices.ETH
      }
    };

  } catch (error) {
    console.error('Ethereum verification error:', error);
    return { 
      verified: false, 
      details: null, 
      error: `Verification failed: ${(error as any).message}` 
    };
  }
}

// Verify Solana transaction
async function verifySolanaTransaction(
  txHash: string, 
  expectedAmountUSD: number, 
  tolerance: number = 2
): Promise<{ verified: boolean; details: any; error?: string }> {
  try {
    // Get transaction details from Solana RPC
    const transaction = await solanaConnection.getTransaction(txHash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return { verified: false, details: null, error: 'Transaction not found' };
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      return { verified: false, details: transaction, error: 'Transaction failed' };
    }

    // Find the transfer to our address
    const ourAddress = new PublicKey(CRYPTO_ADDRESSES.SOL);
    let transferAmount = 0;
    let foundTransfer = false;

    // Check post balances vs pre balances
    if (transaction.meta?.postBalances && transaction.meta?.preBalances) {
      const accountKeys = transaction.transaction.message.getAccountKeys ? 
        transaction.transaction.message.getAccountKeys().keySegments().flat() :
        (transaction.transaction.message as any).accountKeys;
      
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys[i].equals(ourAddress)) {
          const balanceChange = transaction.meta.postBalances[i] - transaction.meta.preBalances[i];
          if (balanceChange > 0) {
            transferAmount = balanceChange / 1e9; // Convert lamports to SOL
            foundTransfer = true;
            break;
          }
        }
      }
    }

    if (!foundTransfer) {
      return { 
        verified: false, 
        details: transaction, 
        error: 'No transfer found to our address' 
      };
    }

    // Get current SOL price
    const prices = await getCryptoPrices();
    const amountUSD = transferAmount * prices.SOL;
    
    // Check if amount matches within tolerance
    const toleranceAmount = expectedAmountUSD * (tolerance / 100);
    const amountDifference = Math.abs(amountUSD - expectedAmountUSD);
    
    if (amountDifference > toleranceAmount) {
      return {
        verified: false,
        details: {
          ...transaction,
          amountSOL: transferAmount,
          amountUSD,
          expectedAmountUSD,
          difference: amountDifference,
          tolerance: toleranceAmount
        },
        error: `Amount mismatch. Expected: $${expectedAmountUSD}, Got: $${amountUSD.toFixed(2)}, Difference: $${amountDifference.toFixed(2)}`
      };
    }

    return {
      verified: true,
      details: {
        ...transaction,
        amountSOL: transferAmount,
        amountUSD,
        expectedAmountUSD,
        difference: amountDifference,
        solPrice: prices.SOL
      }
    };

  } catch (error) {
    console.error('Solana verification error:', error);
    return { 
      verified: false, 
      details: null, 
      error: `Verification failed: ${(error as any).message}` 
    };
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    transactionHash, 
    expectedAmountUSD, 
    cryptocurrency, 
    tolerance = 2 
  }: CryptoVerificationRequest = request.body;

  // Validate input
  if (!transactionHash || !expectedAmountUSD || !cryptocurrency) {
    return response.status(400).json({ 
      error: 'Missing required fields: transactionHash, expectedAmountUSD, cryptocurrency' 
    });
  }

  if (!['ETH', 'SOL'].includes(cryptocurrency)) {
    return response.status(400).json({ 
      error: 'Invalid cryptocurrency. Supported: ETH, SOL' 
    });
  }

  if (expectedAmountUSD <= 0) {
    return response.status(400).json({ 
      error: 'Expected amount must be greater than 0' 
    });
  }

  try {
    let verificationResult;

    if (cryptocurrency === 'ETH') {
      verificationResult = await verifyEthereumTransaction(
        transactionHash, 
        expectedAmountUSD, 
        tolerance
      );
    } else {
      verificationResult = await verifySolanaTransaction(
        transactionHash, 
        expectedAmountUSD, 
        tolerance
      );
    }

    return response.status(200).json({
      verified: verificationResult.verified,
      cryptocurrency,
      transactionHash,
      expectedAmountUSD,
      tolerance,
      details: verificationResult.details,
      error: verificationResult.error,
      timestamp: new Date().toISOString(),
      walletAddress: CRYPTO_ADDRESSES[cryptocurrency]
    });

  } catch (error) {
    console.error('Crypto verification error:', error);
    return response.status(500).json({ 
      error: 'Internal server error during verification',
      details: (error as any).message 
    });
  }
}
