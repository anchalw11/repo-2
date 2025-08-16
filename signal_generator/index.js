const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ProfessionalSMCEngine = require('./pine_translator');

const app = express();
const port = 5005;
let FMP_API_KEY = 'UjCJfQmCbeDxXcMQnoWGibtSWq1kbG9a'; // Replace with your actual API key

const smcEngine = new ProfessionalSMCEngine();

app.use(cors());
app.use(express.json());

// =================================================================
// RECOMMENDED TRADES IDENTIFICATION SYSTEM FOR CLINE
// Criteria to identify highest probability trades for user dashboard
// =================================================================

const RECOMMENDED_TRADES_CRITERIA = {
    // =================================================================
    // TIER 1 CRITERIA - MUST HAVE (Critical Requirements)
    // =================================================================
    tier1Requirements: {
        minimumConfidence: 80,              // Must have 80%+ confidence
        primaryStructureConfirmations: 2,   // Must have 2+ primary confirmations (BOS/CHoCH)
        minimumTotalConfirmations: 6,       // Must have 6+ total confirmations
        sessionQuality: ['London Session - High', 'New York Session - High', 'London/NY Overlap - Very High'],
        riskRewardRatio: 2.0                // Minimum 1:2 R:R ratio
    },

    // =================================================================
    // TIER 2 CRITERIA - HIGHLY PREFERRED (Quality Enhancers)
    // =================================================================
    tier2Preferences: {
        multipleHighProbTargets: 3,         // 3+ targets with 70%+ probability
        orderBlockConfirmation: true,       // Order block respect confirmation
        fairValueGapConfirmation: true,     // FVG confirmation
        premiumDiscountZone: true,          // Optimal entry zone
        volumeConfirmation: true,           // Above average volume
        equalHighsLowsBreak: true          // EQH/EQL break confirmation
    },

    // =================================================================
    // TIER 3 CRITERIA - ADDITIONAL BONUSES (Extra Quality Points)
    // =================================================================
    tier3Bonuses: {
        multiTimeframeAlignment: true,      // Higher timeframe alignment
        institutionalCandle: true,          // Strong directional candle
        keyLevelRejection: true,           // Rejection from key level
        atrVolatilityFilter: true,         // Proper volatility conditions
        marketSessionBonus: true           // Peak trading session
    },

    // =================================================================
    // EXCLUSION CRITERIA - MUST NOT HAVE (Disqualifiers)
    // =================================================================
    exclusionCriteria: {
        maxConfidenceBelowThreshold: 79,    // Below 80% confidence
        insufficientConfirmations: 5,       // Less than 6 confirmations
        lowQualitySession: ['Asian Session - Medium'], // Low quality sessions
        poorRiskReward: 1.5,               // Below 1:2 R:R
        noStructureConfirmation: true       // No BOS/CHoCH confirmation
    }
};

// =================================================================
// IMPLEMENTATION FUNCTION FOR YOUR SMC SYSTEM
// =================================================================

function evaluateRecommendedTrade(signal) {
    const evaluation = {
        symbol: signal.symbol,
        signalType: signal.signalType,
        confidence: signal.confidence,
        isRecommended: false,
        recommendationLevel: 'NONE',
        totalScore: 0,
        qualificationDetails: {
            tier1Met: false,
            tier1Score: 0,
            tier2Score: 0,
            tier3Score: 0,
            tier1Details: {},
            tier2Details: {},
            tier3Details: {}
        },
        recommendationReason: '',
        userDashboardTag: '',
        expectedWinRate: '70-80%'
    };

    // =================================================================
    // TIER 1 EVALUATION (MUST HAVE ALL)
    // =================================================================
    let tier1Count = 0;
    
    // 1. Confidence Level
    if (signal.confidence >= RECOMMENDED_TRADES_CRITERIA.tier1Requirements.minimumConfidence) {
        evaluation.qualificationDetails.tier1Details.confidence = `✅ ${signal.confidence}% (≥80%)`;
        tier1Count++;
    } else {
        evaluation.qualificationDetails.tier1Details.confidence = `❌ ${signal.confidence}% (<80%)`;
        return evaluation; // Immediate disqualification
    }
    
    // 2. Primary Structure Confirmations
    const primaryConfirmations = signal.confirmations.filter(c => 
        c.includes('BOS') || c.includes('CHoCH')
    ).length;
    
    if (primaryConfirmations >= RECOMMENDED_TRADES_CRITERIA.tier1Requirements.primaryStructureConfirmations) {
        evaluation.qualificationDetails.tier1Details.primaryStructure = `✅ ${primaryConfirmations} confirmations (≥2)`;
        tier1Count++;
    } else {
        evaluation.qualificationDetails.tier1Details.primaryStructure = `❌ ${primaryConfirmations} confirmations (<2)`;
        return evaluation;
    }
    
    // 3. Total Confirmations
    if (signal.confirmations.length >= RECOMMENDED_TRADES_CRITERIA.tier1Requirements.minimumTotalConfirmations) {
        evaluation.qualificationDetails.tier1Details.totalConfirmations = `✅ ${signal.confirmations.length} confirmations (≥6)`;
        tier1Count++;
    } else {
        evaluation.qualificationDetails.tier1Details.totalConfirmations = `❌ ${signal.confirmations.length} confirmations (<6)`;
        return evaluation;
    }
    
    // 4. Session Quality
    const isHighQualitySession = RECOMMENDED_TRADES_CRITERIA.tier1Requirements.sessionQuality.includes(signal.sessionQuality);
    if (isHighQualitySession) {
        evaluation.qualificationDetails.tier1Details.sessionQuality = `✅ ${signal.sessionQuality}`;
        tier1Count++;
    } else {
        evaluation.qualificationDetails.tier1Details.sessionQuality = `❌ ${signal.sessionQuality}`;
        return evaluation;
    }
    
    // 5. Risk-Reward Ratio
    const rrRatio = parseFloat(signal.primaryRiskReward.split(':')[1]);
    if (rrRatio >= RECOMMENDED_TRADES_CRITERIA.tier1Requirements.riskRewardRatio) {
        evaluation.qualificationDetails.tier1Details.riskReward = `✅ ${signal.primaryRiskReward} (≥1:2)`;
        tier1Count++;
    } else {
        evaluation.qualificationDetails.tier1Details.riskReward = `❌ ${signal.primaryRiskReward} (<1:2)`;
        return evaluation;
    }
    
    // All Tier 1 requirements met
    if (tier1Count === 5) {
        evaluation.qualificationDetails.tier1Met = true;
        evaluation.qualificationDetails.tier1Score = 100;
        evaluation.totalScore += 100;
    }
    
    // =================================================================
    // TIER 2 EVALUATION (QUALITY ENHANCERS)
    // =================================================================
    let tier2Score = 0;
    
    // Multiple High-Probability Targets
    const highProbTargets = signal.multipleTargets?.filter(t => t.probability >= 70).length || 0;
    if (highProbTargets >= 3) {
        evaluation.qualificationDetails.tier2Details.multipleTargets = `✅ ${highProbTargets} targets with 70%+ probability (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.multipleTargets = `❌ ${highProbTargets} high-prob targets (<3) (0)`;
    }
    
    // Order Block Confirmation
    const hasOrderBlock = signal.confirmations.some(c => c.includes('Order Block'));
    if (hasOrderBlock) {
        evaluation.qualificationDetails.tier2Details.orderBlock = `✅ Order block confirmation (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.orderBlock = `❌ No order block confirmation (0)`;
    }
    
    // Fair Value Gap Confirmation
    const hasFVG = signal.confirmations.some(c => c.includes('Fair Value Gap'));
    if (hasFVG) {
        evaluation.qualificationDetails.tier2Details.fairValueGap = `✅ FVG confirmation (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.fairValueGap = `❌ No FVG confirmation (0)`;
    }
    
    // Premium/Discount Zone
    const hasOptimalZone = signal.confirmations.some(c => c.includes('Premium Zone') || c.includes('Discount Zone'));
    if (hasOptimalZone) {
        evaluation.qualificationDetails.tier2Details.premiumDiscount = `✅ Optimal entry zone (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.premiumDiscount = `❌ No optimal zone entry (0)`;
    }
    
    // Volume Confirmation
    const hasVolume = signal.confirmations.some(c => c.includes('Volume'));
    if (hasVolume) {
        evaluation.qualificationDetails.tier2Details.volume = `✅ Volume confirmation (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.volume = `❌ No volume confirmation (0)`;
    }
    
    // Equal Highs/Lows Break
    const hasEQHL = signal.confirmations.some(c => c.includes('Equal'));
    if (hasEQHL) {
        evaluation.qualificationDetails.tier2Details.equalHighsLows = `✅ EQH/EQL break (+10)`;
        tier2Score += 10;
    } else {
        evaluation.qualificationDetails.tier2Details.equalHighsLows = `❌ No EQH/EQL break (0)`;
    }
    
    evaluation.qualificationDetails.tier2Score = tier2Score;
    evaluation.totalScore += tier2Score;
    
    // =================================================================
    // TIER 3 EVALUATION (ADDITIONAL BONUSES)
    // =================================================================
    let tier3Score = 0;
    
    // Additional confirmations that provide bonuses
    const bonusConfirmations = [
        'Multi-timeframe Alignment',
        'Institutional Candle',
        'Key Level Rejection',
        'ATR Volatility Filter',
        'Market Session Bonus'
    ];
    
    bonusConfirmations.forEach(bonus => {
        const hasBonus = signal.confirmations.some(c => c.includes(bonus));
        if (hasBonus) {
            tier3Score += 5;
        }
    });
    
    evaluation.qualificationDetails.tier3Score = tier3Score;
    evaluation.totalScore += tier3Score;
    
    // =================================================================
    // FINAL RECOMMENDATION DETERMINATION
    // =================================================================
    if (evaluation.totalScore >= 160) {
        evaluation.isRecommended = true;
        evaluation.recommendationLevel = 'PREMIUM';
        evaluation.userDashboardTag = '🌟 PREMIUM RECOMMENDED';
        evaluation.expectedWinRate = '90-95%';
        evaluation.recommendationReason = `Premium recommended trade with ${signal.confirmations.length} SMC confirmations, ${signal.confidence}% confidence, during ${signal.sessionQuality}. Multiple high-probability targets with excellent risk-reward ratio.`;
    } else if (evaluation.totalScore >= 140) {
        evaluation.isRecommended = true;
        evaluation.recommendationLevel = 'STANDARD';
        evaluation.userDashboardTag = '⭐ RECOMMENDED';
        evaluation.expectedWinRate = '85-90%';
        evaluation.recommendationReason = `Recommended trade with strong SMC confirmations and high confidence during quality trading session.`;
    } else if (evaluation.totalScore >= 120) {
        evaluation.isRecommended = false;
        evaluation.recommendationLevel = 'QUALITY';
        evaluation.userDashboardTag = '📊 QUALITY TRADE';
        evaluation.expectedWinRate = '80-85%';
        evaluation.recommendationReason = `Quality trade setup with good confirmations.`;
    } else {
        evaluation.isRecommended = false;
        evaluation.recommendationLevel = 'STANDARD';
        evaluation.userDashboardTag = '';
        evaluation.expectedWinRate = '70-80%';
        evaluation.recommendationReason = `Standard trade setup.`;
    }
    
    return evaluation;
}

// Function to fetch data and generate a signal for a single asset and timeframe
async function getSignalFor(asset, timeframe) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/${timeframe}/${asset}?apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    
    if (!response.data || response.data.length === 0) {
      // console.log(`No data for ${asset} on ${timeframe}`);
      return null;
    }
    
    const historicalData = response.data;
    // The new engine manages its own history, so we pass the latest data point.
    const latestData = historicalData[0];
    const signal = smcEngine.analyzeSMCPatterns(asset, {
        price: latestData.close,
        high: latestData.high,
        low: latestData.low,
        open: latestData.open,
        volume: latestData.volume,
        date: latestData.date,
    });

    if (signal) {
      const recommendation = evaluateRecommendedTrade(signal);
      return {
        ...signal,
        symbol: asset,
        timeframe: timeframe,
        recommendation: recommendation,
      };
    }
    return null;
  } catch (error) {
    // console.error(`Error fetching signal for ${asset} on ${timeframe}:`, error.message);
    return null;
  }
}

// Endpoint to set API key
app.post('/api/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    FMP_API_KEY = apiKey;
    res.status(200).json({ message: 'API Key updated successfully' });
  } else {
    res.status(400).json({ error: 'API Key is required' });
  }
});

// Endpoint for a single signal
app.get('/api/signal', async (req, res) => {
  const { asset, timeframe } = req.query;

  if (!asset || !timeframe) {
    return res.status(400).json({ error: 'Asset and timeframe are required' });
  }

  const signal = await getSignalFor(asset, timeframe);

  if (signal) {
    res.json(signal);
  } else {
    res.status(200).json({ message: 'No signal generated' });
  }
});

app.listen(port, () => {
  console.log(`Signal generator server listening at http://localhost:${port}`);
});
