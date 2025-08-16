// =================================================================
// RISK REWARD CALCULATOR CLASS - Complete implementation
// =================================================================

class RiskRewardCalculator {
    constructor() {
        this.supportResistanceLevels = new Map();
        this.fibonacciLevels = new Map();
        this.previousSwingLevels = new Map();
    }

    // Calculate logical multiple targets based on market structure
    calculateLogicalTargets(symbol, signalDirection, entryPrice, stopLoss, priceHistory) {
        const targets = [];
        const atr = this.calculateATR(priceHistory, 14);
        
        // 1. STRUCTURE-BASED TARGETS
        const structureTargets = this.calculateStructureTargets(symbol, signalDirection, entryPrice, priceHistory);
        targets.push(...structureTargets);
        
        // 2. FIBONACCI EXTENSION TARGETS
        const fibTargets = this.calculateFibonacciTargets(signalDirection, entryPrice, stopLoss, priceHistory);
        targets.push(...fibTargets);
        
        // 3. ATR-BASED TARGETS
        const atrTargets = this.calculateATRTargets(signalDirection, entryPrice, atr);
        targets.push(...atrTargets);
        
        // 4. SUPPORT/RESISTANCE TARGETS
        const srTargets = this.calculateSupportResistanceTargets(symbol, signalDirection, entryPrice, priceHistory);
        targets.push(...srTargets);
        
        // Sort targets by distance and select best ones
        const sortedTargets = this.prioritizeTargets(targets, entryPrice, stopLoss, signalDirection);
        
        // Return top 3-5 most logical targets
        return sortedTargets.slice(0, 5);
    }

    calculateStructureTargets(symbol, direction, entryPrice, priceHistory) {
        const targets = [];
        
        // Get recent swing levels
        const recentSwings = this.getRecentSwingLevels(priceHistory);
        
        if (direction === 'BUY') {
            // For buy signals, target previous swing highs
            recentSwings.highs.forEach((high, index) => {
                if (high > entryPrice) {
                    targets.push({
                        price: high,
                        type: 'Structure',
                        description: `Previous Swing High ${index + 1}`,
                        priority: 'High',
                        probability: 85 - (index * 10) // Higher probability for closer targets
                    });
                }
            });
        } else {
            // For sell signals, target previous swing lows
            recentSwings.lows.forEach((low, index) => {
                if (low < entryPrice) {
                    targets.push({
                        price: low,
                        type: 'Structure',
                        description: `Previous Swing Low ${index + 1}`,
                        priority: 'High',
                        probability: 85 - (index * 10)
                    });
                }
            });
        }
        
        return targets;
    }

    calculateFibonacciTargets(direction, entryPrice, stopLoss, priceHistory) {
        const targets = [];
        const riskDistance = Math.abs(entryPrice - stopLoss);
        
        // Standard Fibonacci extension levels
        const fibLevels = [1.272, 1.414, 1.618, 2.0, 2.618];
        
        fibLevels.forEach((level, index) => {
            const targetPrice = direction === 'BUY' ? 
                entryPrice + (riskDistance * level) : 
                entryPrice - (riskDistance * level);
            
            targets.push({
                price: targetPrice,
                type: 'Fibonacci',
                description: `Fib ${level} Extension`,
                priority: index < 3 ? 'High' : 'Medium',
                probability: 75 - (index * 10)
            });
        });
        
        return targets;
    }

    calculateATRTargets(direction, entryPrice, atr) {
        const targets = [];
        const atrMultipliers = [1.5, 2.0, 3.0, 4.0, 5.0];
        
        atrMultipliers.forEach((multiplier, index) => {
            const targetPrice = direction === 'BUY' ? 
                entryPrice + (atr * multiplier) : 
                entryPrice - (atr * multiplier);
            
            targets.push({
                price: targetPrice,
                type: 'ATR',
                description: `${multiplier}x ATR Target`,
                priority: index < 2 ? 'Medium' : 'Low',
                probability: 70 - (index * 8)
            });
        });
        
        return targets;
    }

    calculateSupportResistanceTargets(symbol, direction, entryPrice, priceHistory) {
        const targets = [];
        
        // Find significant support/resistance levels
        const srLevels = this.findSupportResistanceLevels(priceHistory);
        
        srLevels.forEach((level, index) => {
            const isValidTarget = direction === 'BUY' ? 
                level.price > entryPrice : 
                level.price < entryPrice;
            
            if (isValidTarget) {
                targets.push({
                    price: level.price,
                    type: 'S/R',
                    description: `${level.type} Level (${level.touches} touches)`,
                    priority: level.touches >= 3 ? 'High' : 'Medium',
                    probability: Math.min(80, 50 + (level.touches * 10))
                });
            }
        });
        
        return targets;
    }

    prioritizeTargets(targets, entryPrice, stopLoss, direction) {
        const riskDistance = Math.abs(entryPrice - stopLoss);
        
        return targets
            .map(target => {
                // Calculate risk-reward ratio for this target
                const rewardDistance = Math.abs(target.price - entryPrice);
                const riskReward = rewardDistance / riskDistance;
                
                // Calculate priority score
                let priorityScore = 0;
                if (target.priority === 'High') priorityScore = 100;
                else if (target.priority === 'Medium') priorityScore = 70;
                else priorityScore = 40;
                
                // Add probability and RR bonus
                priorityScore += target.probability * 0.5;
                priorityScore += Math.min(riskReward * 10, 50); // Bonus for good RR
                
                return {
                    ...target,
                    riskReward: parseFloat(riskReward.toFixed(2)),
                    priorityScore
                };
            })
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .filter(target => target.riskReward >= 1.0); // Only targets with positive RR
    }

    getRecentSwingLevels(priceHistory) {
        const highs = [];
        const lows = [];
        
        // Simple swing detection
        for (let i = 5; i < priceHistory.length - 5; i++) {
            const current = priceHistory[i];
            let isSwingHigh = true;
            let isSwingLow = true;
            
            // Check 5 bars on each side
            for (let j = i - 5; j <= i + 5; j++) {
                if (j !== i && j >= 0 && j < priceHistory.length) {
                    if (priceHistory[j].high >= current.high) isSwingHigh = false;
                    if (priceHistory[j].low <= current.low) isSwingLow = false;
                }
            }
            
            if (isSwingHigh) highs.push(current.high);
            if (isSwingLow) lows.push(current.low);
        }
        
        return {
            highs: highs.slice(-5), // Last 5 swing highs
            lows: lows.slice(-5)    // Last 5 swing lows
        };
    }

    findSupportResistanceLevels(priceHistory) {
        const levels = [];
        const tolerance = 0.001; // 0.1% tolerance for level grouping
        
        // Collect all highs and lows
        const allLevels = [];
        priceHistory.forEach(bar => {
            allLevels.push({ price: bar.high, type: 'Resistance' });
            allLevels.push({ price: bar.low, type: 'Support' });
        });
        
        // Group similar levels and count touches
        const groupedLevels = new Map();
        
        allLevels.forEach(level => {
            let foundGroup = false;
            
            for (let [groupKey, group] of groupedLevels) {
                if (Math.abs(level.price - groupKey) / groupKey <= tolerance) {
                    group.touches++;
                    group.avgPrice = (group.avgPrice * (group.touches - 1) + level.price) / group.touches;
                    foundGroup = true;
                    break;
                }
            }
            
            if (!foundGroup) {
                groupedLevels.set(level.price, {
                    avgPrice: level.price,
                    type: level.type,
                    touches: 1
                });
            }
        });
        
        // Convert to array and filter significant levels
        for (let [key, group] of groupedLevels) {
            if (group.touches >= 2) { // At least 2 touches to be significant
                levels.push({
                    price: group.avgPrice,
                    type: group.type,
                    touches: group.touches
                });
            }
        }
        
        return levels.sort((a, b) => b.touches - a.touches).slice(0, 10);
    }

    calculateATR(priceHistory, period) {
        if (priceHistory.length < period + 1) {
            return priceHistory[0].close * 0.001;
        }
        
        const trueRanges = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const current = priceHistory[i];
            const previous = priceHistory[i - 1];
            
            const tr = Math.max(
                current.high - current.low,
                Math.abs(current.high - previous.close),
                Math.abs(current.low - previous.close)
            );
            trueRanges.push(tr);
        }
        
        const recentTRs = trueRanges.slice(-period);
        return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
    }
}

// =================================================================
// ADVANCED SMC TRADING LOGIC - BASED ON YOUR PINE SCRIPT INDICATOR
// Directly implements the logic from your TradingView indicator
// =================================================================

class ProfessionalSMCEngine {
    constructor() {
        this.priceHistory = new Map();
        this.swingHighs = new Map();
        this.swingLows = new Map();
        this.internalHighs = new Map();
        this.internalLows = new Map();
        this.swingTrend = new Map();
        this.internalTrend = new Map();
        this.orderBlocks = new Map();
        this.fairValueGaps = new Map();
        this.equalHighs = new Map();
        this.equalLows = new Map();
        this.lastSignalTime = new Map();
        
        // NEW: Position tracking and exit monitoring
        this.activePositions = new Map(); // Track open positions
        this.positionHistory = new Map();  // Track position performance
        this.marketConditions = new Map();  // Track market state changes
        this.exitSignals = new Map();      // Track exit signals
        
        // Confidence scoring based on your indicator's confirmations
        this.confirmationScores = {
            // PRIMARY STRUCTURE CONFIRMATIONS (High Impact)
            'swingBullishBOS': 30,
            'swingBearishBOS': 30,
            'swingBullishCHoCH': 25,
            'swingBearishCHoCH': 25,
            'internalBullishBOS': 20,
            'internalBearishBOS': 20,
            'internalBullishCHoCH': 18,
            'internalBearishCHoCH': 18,
            
            // ORDER BLOCK CONFIRMATIONS
            'swingOrderBlockRespect': 22,
            'internalOrderBlockRespect': 18,
            
            // FAIR VALUE GAP CONFIRMATIONS
            'bullishFairValueGap': 15,
            'bearishFairValueGap': 15,
            
            // EQUAL HIGHS/LOWS
            'equalHighsBreak': 12,
            'equalLowsBreak': 12,
            
            // PREMIUM/DISCOUNT ZONES
            'premiumZoneEntry': 10,
            'discountZoneEntry': 10,
            'equilibriumZone': 8,
            
            // ADDITIONAL CONFLUENCES
            'multiTimeframeAlignment': 8,
            'volumeConfirmation': 6,
            'strongWeakHighLow': 5,
            'atrVolatilityFilter': 4
        };
        
        // Exit signal criteria
        this.exitCriteria = {
            // Structure invalidation (High priority exits)
            'oppositeStructureBreak': 40,      // Opposite BOS/CHoCH formed
            'swingFailure': 35,                // Failed to hold key swing level
            'trendReversal': 30,               // Clear trend reversal pattern
            
            // Market condition changes (Medium priority)
            'momentumDivergence': 25,          // Momentum divergence detected
            'volumeWeakness': 20,              // Volume declining significantly
            'orderBlockBroken': 18,            // Supporting order block broken
            'fvgFilled': 15,                   // Fair value gap filled against position
            
            // Risk management (Lower priority but important)
            'volatilitySpike': 12,             // Unusual volatility increase
            'sessionChange': 10,               // Moving into low-quality session
            'timeBasedExit': 8,                // Position held too long
            'partialProfitZone': 5             // Reached partial profit zone
        };
        
        // Minimum requirements for signal generation
        this.signalRequirements = {
            minPrimaryConfirmations: 1,  // Must have BOS/CHoCH
            minTotalConfirmations: 4,    // Minimum 4 confirmations
            minConfidenceScore: 60,      // Minimum 60% confidence
            minHistoryBars: 25,          // Need enough price history
            cooldownPeriod: 300000       // 5 minutes between signals
        };
        
        // Exit signal requirements
        this.exitRequirements = {
            minExitScore: 30,            // Minimum score to suggest exit
            criticalExitScore: 50,       // Score for immediate exit suggestion
            maxPositionAge: 14400000     // 4 hours max position age
        };
    }

    // =================================================================
    // MAIN ANALYSIS FUNCTION - Enhanced with position monitoring
    // =================================================================
    analyzeSMCPatterns(symbol, currentPriceData) {
        try {
            const currentPrice = parseFloat(currentPriceData.price);
            const timestamp = Date.now();
            
            // Initialize data structures
            this.initializeSymbolData(symbol, currentPriceData);
            
            // Check for position exit signals FIRST
            const exitAnalysis = this.analyzePositionExits(symbol, currentPrice, timestamp);
            if (exitAnalysis) {
                return exitAnalysis; // Return exit signal if needed
            }
            
            // Check cooldown period for new entries
            if (!this.canGenerateSignal(symbol, timestamp)) {
                return null;
            }
            
            // Get price history and perform structure analysis
            const priceHistory = this.priceHistory.get(symbol);
            if (priceHistory.length < this.signalRequirements.minHistoryBars) {
                return null;
            }
            
            // Perform comprehensive SMC analysis based on your indicator
            const analysis = this.performStructureAnalysis(symbol, priceHistory, currentPrice);
            
            // Generate signal if requirements are met
            if (this.validateSignalQuality(analysis)) {
                this.lastSignalTime.set(symbol, timestamp);
                const signal = this.createTradingSignal(symbol, analysis, currentPrice);
                
                // Track the new position
                this.trackNewPosition(symbol, signal, timestamp);
                
                return signal;
            }
            
            return null;
            
        } catch (error) {
            console.error(`SMC Analysis Error for ${symbol}:`, error);
            return null;
        }
    }

    // =================================================================
    // STRUCTURE ANALYSIS - Implements your Pine Script detection logic
    // =================================================================
    performStructureAnalysis(symbol, priceHistory, currentPrice) {
        const confirmations = [];
        const currentAlerts = {
            swingBullishBOS: false, swingBearishBOS: false,
            swingBullishCHoCH: false, swingBearishCHoCH: false,
            internalBullishBOS: false, internalBearishBOS: false,
            internalBullishCHoCH: false, internalBearishCHoCH: false,
            swingOrderBlock: false, internalOrderBlock: false,
            bullishFairValueGap: false, bearishFairValueGap: false,
            equalHighs: false, equalLows: false
        };
        
        let primaryBrokenLevel = null;
        
        // 1. SWING STRUCTURE ANALYSIS (Your displayStructure function logic)
        const swingAnalysis = this.analyzeSwingStructure(symbol, priceHistory, currentPrice);
        Object.assign(currentAlerts, swingAnalysis.alerts);
        confirmations.push(...swingAnalysis.confirmations);
        if (swingAnalysis.brokenLevel) primaryBrokenLevel = swingAnalysis.brokenLevel;
        
        // 2. INTERNAL STRUCTURE ANALYSIS 
        const internalAnalysis = this.analyzeInternalStructure(symbol, priceHistory, currentPrice);
        Object.assign(currentAlerts, internalAnalysis.alerts);
        confirmations.push(...internalAnalysis.confirmations);
        if (!primaryBrokenLevel && internalAnalysis.brokenLevel) primaryBrokenLevel = internalAnalysis.brokenLevel;
        
        // Continue with other analyses...
        const orderBlockAnalysis = this.analyzeOrderBlocks(symbol, priceHistory, currentPrice);
        Object.assign(currentAlerts, orderBlockAnalysis.alerts);
        confirmations.push(...orderBlockAnalysis.confirmations);
        
        const fvgAnalysis = this.analyzeFairValueGaps(symbol, priceHistory, currentPrice);
        Object.assign(currentAlerts, fvgAnalysis.alerts);
        confirmations.push(...fvgAnalysis.confirmations);
        
        const eqhlAnalysis = this.analyzeEqualHighsLows(symbol, priceHistory, currentPrice);
        Object.assign(currentAlerts, eqhlAnalysis.alerts);
        confirmations.push(...eqhlAnalysis.confirmations);
        
        const zoneAnalysis = this.analyzePremiumDiscountZones(symbol, priceHistory, currentPrice);
        confirmations.push(...zoneAnalysis.confirmations);
        
        const additionalConfluences = this.analyzeAdditionalFactors(symbol, priceHistory, currentPrice);
        confirmations.push(...additionalConfluences.confirmations);
        
        // Determine signal direction based on your Pine Script buySignal/sellSignal logic
        let signalDirection = null;
        if (currentAlerts.swingBullishBOS || currentAlerts.swingBullishCHoCH || 
            currentAlerts.internalBullishBOS || currentAlerts.internalBullishCHoCH) {
            signalDirection = 'BUY';
        } else if (currentAlerts.swingBearishBOS || currentAlerts.swingBearishCHoCH || 
                   currentAlerts.internalBearishBOS || currentAlerts.internalBearishCHoCH) {
            signalDirection = 'SELL';
        }
        
        return {
            signalDirection,
            confirmations,
            alerts: currentAlerts,
            brokenLevel: primaryBrokenLevel,
            analysis: this.generateAnalysisText(signalDirection, confirmations)
        };
    }

    // =================================================================
    // ENHANCED TRADING LEVELS CALCULATION - Multiple targets with logical RR
    // =================================================================
    calculateTradingLevels(symbol, signalDirection, currentPrice, priceHistory, brokenLevel) {
        // Initialize risk-reward calculator
        const rrCalculator = new RiskRewardCalculator();
        
        // Get ATR measure exactly like your Pine Script (ta.atr(200))
        const atrMeasure = this.calculateATR(priceHistory, 200);
        
        // Entry at current close price when structure breaks
        let entryPrice = currentPrice;
        let stopLossLevel;
        
        if (signalDirection === 'BUY') {
            stopLossLevel = brokenLevel - (atrMeasure * 0.5);
            if (stopLossLevel >= entryPrice) {
                stopLossLevel = entryPrice - (atrMeasure * 1.0);
            }
        } else {
            stopLossLevel = brokenLevel + (atrMeasure * 0.5);
            if (stopLossLevel <= entryPrice) {
                stopLossLevel = entryPrice + (atrMeasure * 1.0);
            }
        }
        
        // Calculate multiple logical targets
        const logicalTargets = rrCalculator.calculateLogicalTargets(
            symbol, signalDirection, entryPrice, stopLossLevel, priceHistory
        );
        
        // Primary target (highest probability)
        const primaryTarget = logicalTargets[0];
        const primaryTakeProfit = primaryTarget ? primaryTarget.price : 
            (signalDirection === 'BUY' ? 
                entryPrice + (Math.abs(entryPrice - stopLossLevel) * 2.0) : 
                entryPrice - (Math.abs(entryPrice - stopLossLevel) * 2.0));
        
        // Calculate risk-reward ratios for all targets
        const riskDistance = Math.abs(entryPrice - stopLossLevel);
        const targetAnalysis = logicalTargets.map((target, index) => ({
            level: index + 1,
            price: parseFloat(target.price.toFixed(this.getSymbolPrecision(symbol))),
            riskReward: target.riskReward,
            type: target.type,
            description: target.description,
            probability: target.probability,
            priority: target.priority
        }));
        
        // Apply precision based on symbol type
        const precision = this.getSymbolPrecision(symbol);
        
        return {
            entryPrice: parseFloat(entryPrice.toFixed(precision)),
            stopLoss: parseFloat(stopLossLevel.toFixed(precision)),
            takeProfit: parseFloat(primaryTakeProfit.toFixed(precision)),
            
            // Enhanced target analysis
            primaryRiskReward: `1:${primaryTarget ? primaryTarget.riskReward : 2.0}`,
            multipleTargets: targetAnalysis,
            targetSummary: this.generateTargetSummary(targetAnalysis),
            
            // Technical details
            atrUsed: parseFloat(atrMeasure.toFixed(precision)),
            riskDistance: parseFloat(riskDistance.toFixed(precision)),
            
            // Risk management recommendations
            positionSizing: this.calculatePositionSizing(targetAnalysis),
            exitStrategy: this.generateExitStrategy(targetAnalysis)
        };
    }

    generateTargetSummary(targets) {
        if (targets.length === 0) return 'Standard 1:2 Risk-Reward Target';
        
        const highProbTargets = targets.filter(t => t.probability >= 70).length;
        const avgRR = targets.reduce((sum, t) => sum + t.riskReward, 0) / targets.length;
        
        return `${targets.length} logical targets identified. ${highProbTargets} high-probability levels. Average RR: 1:${avgRR.toFixed(1)}`;
    }

    calculatePositionSizing(targets) {
        const highProbTargets = targets.filter(t => t.probability >= 75);
        
        if (highProbTargets.length >= 3) {
            return { recommended: 'Standard', percentage: '1-2%', reason: 'Multiple high-probability targets' };
        } else if (highProbTargets.length >= 1) {
            return { recommended: 'Conservative', percentage: '0.5-1%', reason: 'Limited high-probability targets' };
        } else {
            return { recommended: 'Minimal', percentage: '0.25-0.5%', reason: 'Lower probability setup' };
        }
    }

    generateExitStrategy(targets) {
        if (targets.length <= 1) {
            return 'Single target exit at TP level';
        }
        
        let strategy = 'Partial exit strategy: ';
        
        if (targets.length >= 3) {
            strategy += '25% at Target 1, 35% at Target 2, 40% at Target 3+';
        } else {
            strategy += '50% at Target 1, 50% at Target 2';
        }
        
        strategy += '. Move SL to breakeven after Target 1.';
        
        return strategy;
    }

    createTradingSignal(symbol, analysis, currentPrice) {
        const confidence = this.calculateConfidence(analysis.confirmations);
        const priceHistory = this.priceHistory.get(symbol);
        
        // Use the exact broken level for precise SL calculation (matching your Pine Script)
        const tradingLevels = this.calculateTradingLevels(
            symbol, 
            analysis.signalDirection, 
            currentPrice, 
            priceHistory, 
            analysis.brokenLevel // Pass the actual broken swing level
        );
        
        return {
            symbol,
            signalType: analysis.signalDirection,
            confidence,
            entryPrice: tradingLevels.entryPrice,
            stopLoss: tradingLevels.stopLoss,
            takeProfit: tradingLevels.takeProfit,
            primaryRiskReward: tradingLevels.primaryRiskReward,
            multipleTargets: tradingLevels.multipleTargets,
            targetSummary: tradingLevels.targetSummary,
            positionSizing: tradingLevels.positionSizing,
            exitStrategy: tradingLevels.exitStrategy,
            confirmations: this.formatConfirmations(analysis.confirmations),
            timestamp: new Date(),
            analysis: analysis.analysis,
            sessionQuality: this.getSessionQuality(),
            timeframe: '15m',
            // Additional technical details
            atrUsed: tradingLevels.atrUsed,
            riskDistance: tradingLevels.riskDistance,
            brokenLevel: analysis.brokenLevel
        };
    }

    // =================================================================
    // POSITION EXIT ANALYSIS - New intelligent exit system
    // =================================================================
    analyzePositionExits(symbol, currentPrice, timestamp) {
        const activePosition = this.activePositions.get(symbol);
        if (!activePosition) return null; // No position to monitor
        
        const exitFactors = [];
        let exitScore = 0;
        
        // 1. CHECK FOR OPPOSITE STRUCTURE BREAKS
        const currentTrend = this.swingTrend.get(symbol) || { bias: 0 };
        const positionDirection = activePosition.signalType;
        
        if ((positionDirection === 'BUY' && currentTrend.bias === -1) ||
            (positionDirection === 'SELL' && currentTrend.bias === 1)) {
            exitFactors.push('oppositeStructureBreak');
            exitScore += this.exitCriteria.oppositeStructureBreak;
        }
        
        // 2. CHECK FOR SWING LEVEL FAILURES
        const swingFailure = this.detectSwingFailure(symbol, currentPrice, activePosition);
        if (swingFailure.detected) {
            exitFactors.push('swingFailure');
            exitScore += this.exitCriteria.swingFailure;
        }
        
        // 3. CHECK FOR TREND REVERSAL PATTERNS
        const trendReversal = this.detectTrendReversal(symbol, currentPrice);
        if (trendReversal) {
            exitFactors.push('trendReversal');
            exitScore += this.exitCriteria.trendReversal;
        }
        
        // 4. CHECK FOR MOMENTUM DIVERGENCE
        const momentumDiv = this.detectMomentumDivergence(symbol, currentPrice, activePosition);
        if (momentumDiv) {
            exitFactors.push('momentumDivergence');
            exitScore += this.exitCriteria.momentumDivergence;
        }
        
        // 5. CHECK FOR VOLUME WEAKNESS
        const volumeWeakness = this.detectVolumeWeakness(symbol);
        if (volumeWeakness) {
            exitFactors.push('volumeWeakness');
            exitScore += this.exitCriteria.volumeWeakness;
        }
        
        // 6. CHECK FOR ORDER BLOCK BREAKS
        const orderBlockBroken = this.checkOrderBlockBreaks(symbol, currentPrice, activePosition);
        if (orderBlockBroken) {
            exitFactors.push('orderBlockBroken');
            exitScore += this.exitCriteria.orderBlockBroken;
        }
        
        // 7. CHECK FOR FVG FILLS AGAINST POSITION
        const fvgFilled = this.checkFVGFills(symbol, currentPrice, activePosition);
        if (fvgFilled) {
            exitFactors.push('fvgFilled');
            exitScore += this.exitCriteria.fvgFilled;
        }
        
        // 8. CHECK FOR VOLATILITY SPIKES
        const volSpike = this.detectVolatilitySpike(symbol);
        if (volSpike) {
            exitFactors.push('volatilitySpike');
            exitScore += this.exitCriteria.volatilitySpike;
        }
        
        // 9. CHECK FOR SESSION QUALITY CHANGES
        const sessionChange = this.checkSessionQuality(timestamp);
        if (sessionChange.lowQuality) {
            exitFactors.push('sessionChange');
            exitScore += this.exitCriteria.sessionChange;
        }
        
        // 10. CHECK FOR TIME-BASED EXITS
        const positionAge = timestamp - activePosition.entryTime;
        if (positionAge > this.exitRequirements.maxPositionAge) {
            exitFactors.push('timeBasedExit');
            exitScore += this.exitCriteria.timeBasedExit;
        }
        
        // 11. CHECK FOR PARTIAL PROFIT ZONES
        const partialProfit = this.checkPartialProfitZone(currentPrice, activePosition);
        if (partialProfit.inZone) {
            exitFactors.push('partialProfitZone');
            exitScore += this.exitCriteria.partialProfitZone;
        }
        
        // EVALUATE EXIT NECESSITY
        if (exitScore >= this.exitRequirements.criticalExitScore) {
            return this.createExitSignal(symbol, activePosition, exitFactors, exitScore, 'CRITICAL', currentPrice);
        } else if (exitScore >= this.exitRequirements.minExitScore) {
            return this.createExitSignal(symbol, activePosition, exitFactors, exitScore, 'WARNING', currentPrice);
        }
        
        // Update position tracking
        this.updatePositionTracking(symbol, currentPrice, timestamp);
        
        return null; // No exit needed
    }

    // =================================================================
    // EXIT DETECTION HELPER FUNCTIONS
    // =================================================================
    detectSwingFailure(symbol, currentPrice, position) {
        const swingHigh = this.swingHighs.get(symbol);
        const swingLow = this.swingLows.get(symbol);
        
        if (position.signalType === 'BUY' && swingLow && swingLow.currentLevel) {
            // For buy positions, check if price failed to hold above key swing low
            if (currentPrice < swingLow.currentLevel) {
                return { detected: true, level: swingLow.currentLevel, type: 'swing_low_break' };
            }
        }
        
        if (position.signalType === 'SELL' && swingHigh && swingHigh.currentLevel) {
            // For sell positions, check if price failed to hold below key swing high
            if (currentPrice > swingHigh.currentLevel) {
                return { detected: true, level: swingHigh.currentLevel, type: 'swing_high_break' };
            }
        }
        
        return { detected: false };
    }
    
    detectTrendReversal(symbol, currentPrice) {
        const priceHistory = this.priceHistory.get(symbol);
        if (priceHistory.length < 10) return false;
        
        // Simple trend reversal detection based on recent price action
        const recentBars = priceHistory.slice(-10);
        const highs = recentBars.map(bar => bar.high);
        const lows = recentBars.map(bar => bar.low);
        
        // Check for lower highs in uptrend or higher lows in downtrend
        const recentHighs = highs.slice(-5);
        const recentLows = lows.slice(-5);
        
        const lowerHighs = recentHighs.every((high, index) => 
            index === 0 || high < recentHighs[index - 1]
        );
        
        const higherLows = recentLows.every((low, index) => 
            index === 0 || low > recentLows[index - 1]
        );
        
        return lowerHighs || higherLows;
    }
    
    detectMomentumDivergence(symbol, currentPrice, position) {
        const priceHistory = this.priceHistory.get(symbol);
        if (priceHistory.length < 20) return false;
        
        // Simplified momentum divergence detection
        const recentBars = priceHistory.slice(-20);
        const prices = recentBars.map(bar => bar.close);
        
        // Calculate simple momentum (rate of change)
        const momentum1 = prices[prices.length - 1] - prices[prices.length - 6];
        const momentum2 = prices[prices.length - 6] - prices[prices.length - 11];
        
        // Check for divergence based on position direction
        if (position.signalType === 'BUY') {
            return momentum1 < momentum2 && momentum1 < 0; // Weakening upward momentum
        } else {
            return momentum1 > momentum2 && momentum1 > 0; // Weakening downward momentum
        }
    }
    
    detectVolumeWeakness(symbol) {
        const priceHistory = this.priceHistory.get(symbol);
        if (priceHistory.length < 10) return false;
        
        const recentVolumes = priceHistory.slice(-5).map(bar => bar.volume);
        const previousVolumes = priceHistory.slice(-10, -5).map(bar => bar.volume);
        
        const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const previousAvg = previousVolumes.reduce((a, b) => a + b, 0) / previousVolumes.length;
        
        return recentAvg < previousAvg * 0.7; // 30% volume decline
    }
    
    checkOrderBlockBreaks(symbol, currentPrice, position) {
        const orderBlocks = this.orderBlocks.get(symbol) || [];
        
        // Check if any supporting order blocks have been broken
        return orderBlocks.some(ob => {
            if (position.signalType === 'BUY' && ob.bias === 1) {
                return currentPrice < ob.low; // Bullish OB broken on buy position
            }
            if (position.signalType === 'SELL' && ob.bias === -1) {
                return currentPrice > ob.high; // Bearish OB broken on sell position
            }
            return false;
        });
    }
    
    checkFVGFills(symbol, currentPrice, position) {
        // Simplified FVG fill check
        const priceHistory = this.priceHistory.get(symbol);
        if (priceHistory.length < 5) return false;
        
        // Check if recent price action has filled gaps against the position
        const recentBars = priceHistory.slice(-5);
        const hasGapFill = recentBars.some(bar => {
            if (position.signalType === 'BUY') {
                return bar.low < position.entryPrice * 0.998; // 0.2% gap fill against buy
            } else {
                return bar.high > position.entryPrice * 1.002; // 0.2% gap fill against sell
            }
        });
        
        return hasGapFill;
    }
    
    detectVolatilitySpike(symbol) {
        const priceHistory = this.priceHistory.get(symbol);
        if (priceHistory.length < 20) return false;
        
        const currentATR = this.calculateATR(priceHistory, 14);
        const previousATR = this.calculateATR(priceHistory.slice(0, -5), 14);
        
        return currentATR > previousATR * 1.5; // 50% volatility increase
    }
    
    checkSessionQuality(timestamp) {
        const now = new Date(timestamp);
        const hour = now.getUTCHours();
        
        // Low quality sessions (Asian session outside major news)
        const lowQuality = (hour >= 21 || hour <= 7) && 
                          !(hour >= 23 && hour <= 2); // Exclude Asian major hours
        
        return { lowQuality, session: this.getSessionQuality() };
    }
    
    checkPartialProfitZone(currentPrice, position) {
        const entryPrice = parseFloat(position.entryPrice);
        const targetPrice = parseFloat(position.takeProfit);
        
        // Calculate if we're in 25%, 50%, or 75% profit zone
        const totalDistance = Math.abs(targetPrice - entryPrice);
        const currentDistance = Math.abs(currentPrice - entryPrice);
        const profitPercentage = (currentDistance / totalDistance) * 100;
        
        return {
            inZone: profitPercentage >= 25,
            percentage: profitPercentage,
            zone: profitPercentage >= 75 ? '75%' : profitPercentage >= 50 ? '50%' : '25%'
        };
    }

    // =================================================================
    // EXIT SIGNAL CREATION
    // =================================================================
    createExitSignal(symbol, position, exitFactors, exitScore, urgency, currentPrice) {
        const exitSignal = {
            type: 'EXIT_SIGNAL',
            symbol,
            urgency, // 'CRITICAL' or 'WARNING'
            exitScore,
            position: {
                signalType: position.signalType,
                entryPrice: position.entryPrice,
                entryTime: position.entryTime,
                currentPrice: currentPrice.toFixed(5)
            },
            exitFactors: this.formatExitFactors(exitFactors),
            recommendation: this.generateExitRecommendation(urgency, exitScore, exitFactors),
            timestamp: new Date(),
            currentPL: this.calculateCurrentPL(position, currentPrice)
        };
        
        // Update position status
        if (urgency === 'CRITICAL') {
            this.closePosition(symbol, 'SYSTEM_EXIT', currentPrice);
        }
        
        return exitSignal;
    }
    
    formatExitFactors(exitFactors) {
        const formattedFactors = [];
        
        exitFactors.forEach(factor => {
            switch(factor) {
                case 'oppositeStructureBreak':
                    formattedFactors.push('Opposite Structure Break Detected');
                    break;
                case 'swingFailure':
                    formattedFactors.push('Key Swing Level Failed');
                    break;
                case 'trendReversal':
                    formattedFactors.push('Trend Reversal Pattern');
                    break;
                case 'momentumDivergence':
                    formattedFactors.push('Momentum Divergence');
                    break;
                case 'volumeWeakness':
                    formattedFactors.push('Volume Weakness');
                    break;
                case 'orderBlockBroken':
                    formattedFactors.push('Supporting Order Block Broken');
                    break;
                case 'fvgFilled':
                    formattedFactors.push('Fair Value Gap Filled Against Position');
                    break;
                case 'volatilitySpike':
                    formattedFactors.push('Unusual Volatility Spike');
                    break;
                case 'sessionChange':
                    formattedFactors.push('Low Quality Trading Session');
                    break;
                case 'timeBasedExit':
                    formattedFactors.push('Maximum Position Age Reached');
                    break;
                case 'partialProfitZone':
                    formattedFactors.push('Partial Profit Zone Reached');
                    break;
                default:
                    formattedFactors.push(factor);
            }
        });
        
        return formattedFactors;
    }
    
    generateExitRecommendation(urgency, exitScore, exitFactors) {
        let recommendation = '';
        
        if (urgency === 'CRITICAL') {
            recommendation = `🚨 IMMEDIATE EXIT RECOMMENDED - Market conditions have changed significantly against your position. Exit Score: ${exitScore}/100. `;
        } else {
            recommendation = `⚠️ CONSIDER EXIT - Market showing signs of potential reversal. Exit Score: ${exitScore}/100. `;
        }
        
        // Add specific guidance based on factors
        if (exitFactors.includes('oppositeStructureBreak')) {
            recommendation += 'Structure has broken against your position direction. ';
        }
        
        if (exitFactors.includes('swingFailure')) {
            recommendation += 'Key support/resistance levels have been violated. ';
        }
        
        if (exitFactors.includes('momentumDivergence')) {
            recommendation += 'Momentum is showing signs of exhaustion. ';
        }
        
        if (urgency === 'CRITICAL') {
            recommendation += 'Recommended action: Close position immediately.';
        } else {
            recommendation += 'Recommended action: Monitor closely or consider partial exit.';
        }
        
        return recommendation;
    }

    // =================================================================
    // POSITION TRACKING FUNCTIONS
    // =================================================================
    trackNewPosition(symbol, signal, timestamp) {
        const position = {
            symbol,
            signalType: signal.signalType,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            entryTime: timestamp,
            confidence: signal.confidence,
            confirmations: signal.confirmations,
            status: 'ACTIVE'
        };
        
        this.activePositions.set(symbol, position);
    }
    
    updatePositionTracking(symbol, currentPrice, timestamp) {
        const position = this.activePositions.get(symbol);
        if (!position) return;
        
        position.lastUpdateTime = timestamp;
        position.currentPrice = currentPrice;
        position.currentPL = this.calculateCurrentPL(position, currentPrice);
    }
    
    closePosition(symbol, reason, exitPrice) {
        const position = this.activePositions.get(symbol);
        if (!position) return;
        
        position.status = 'CLOSED';
        position.exitPrice = exitPrice;
        position.exitReason = reason;
        position.exitTime = Date.now();
        position.finalPL = this.calculateCurrentPL(position, exitPrice);
        
        // Move to history
        if (!this.positionHistory.has(symbol)) {
            this.positionHistory.set(symbol, []);
        }
        this.positionHistory.get(symbol).unshift(position);
        
        // Remove from active positions
        this.activePositions.delete(symbol);
    }
    
    calculateCurrentPL(position, currentPrice) {
        const entryPrice = parseFloat(position.entryPrice);
        const priceDiff = position.signalType === 'BUY' ? 
            currentPrice - entryPrice : 
            entryPrice - currentPrice;
        
        const plPips = priceDiff * (position.symbol.includes('JPY') ? 100 : 10000);
        return {
            pips: parseFloat(plPips.toFixed(1)),
            percentage: parseFloat(((priceDiff / entryPrice) * 100).toFixed(2)),
            status: priceDiff >= 0 ? 'PROFIT' : 'LOSS'
        };
    }

    // =================================================================
    // SWING STRUCTURE ANALYSIS - Your exact displayStructure logic
    // =================================================================
    analyzeSwingStructure(symbol, priceHistory, currentPrice) {
        const alerts = {};
        const confirmations = [];
        let brokenLevel = null;
        
        const swingHigh = this.swingHighs.get(symbol) || { currentLevel: null, crossed: false };
        const swingLow = this.swingLows.get(symbol) || { currentLevel: null, crossed: false };
        const swingTrend = this.swingTrend.get(symbol) || { bias: 0 }; // 0=neutral, 1=bullish, -1=bearish
        
        // Detect swing points using your leg() function logic
        const swingPoints = this.detectSwingPoints(priceHistory, 50); // swingsLengthInput = 50
        
        // Update swing levels
        if (swingPoints.newHigh) {
            swingHigh.currentLevel = swingPoints.high;
            swingHigh.crossed = false;
            this.swingHighs.set(symbol, swingHigh);
        }
        if (swingPoints.newLow) {
            swingLow.currentLevel = swingPoints.low;
            swingLow.crossed = false;
            this.swingLows.set(symbol, swingLow);
        }
        
        // Check for bullish structure break (ta.crossover logic) - EXACT PINE SCRIPT LOGIC
        if (swingHigh.currentLevel && currentPrice > swingHigh.currentLevel && !swingHigh.crossed) {
            // string tag = t_rend.bias == BEARISH ? CHOCH : BOS
            const tag = swingTrend.bias === -1 ? 'CHoCH' : 'BOS'; // BEARISH to BULLISH = CHoCH
            
            alerts.swingBullishBOS = tag === 'BOS';
            alerts.swingBullishCHoCH = tag === 'CHoCH';
            
            if (tag === 'BOS') confirmations.push('swingBullishBOS');
            if (tag === 'CHoCH') confirmations.push('swingBullishCHoCH');
            
            brokenLevel = swingHigh.currentLevel; // Store broken level for SL calculation
            
            swingHigh.crossed = true;
            swingTrend.bias = 1; // BULLISH
            this.swingTrend.set(symbol, swingTrend);
        }
        
        // Check for bearish structure break (ta.crossunder logic) - EXACT PINE SCRIPT LOGIC
        if (swingLow.currentLevel && currentPrice < swingLow.currentLevel && !swingLow.crossed) {
            // string tag = t_rend.bias == BULLISH ? CHOCH : BOS
            const tag = swingTrend.bias === 1 ? 'CHoCH' : 'BOS'; // BULLISH to BEARISH = CHoCH
            
            alerts.swingBearishBOS = tag === 'BOS';
            alerts.swingBearishCHoCH = tag === 'CHoCH';
            
            if (tag === 'BOS') confirmations.push('swingBearishBOS');
            if (tag === 'CHoCH') confirmations.push('swingBearishCHoCH');
            
            brokenLevel = swingLow.currentLevel; // Store broken level for SL calculation
            
            swingLow.crossed = true;
            swingTrend.bias = -1; // BEARISH
            this.swingTrend.set(symbol, swingTrend);
        }
        
        return { alerts, confirmations, brokenLevel };
    }

    // =================================================================
    // INTERNAL STRUCTURE ANALYSIS - 5-period structure
    // =================================================================
    analyzeInternalStructure(symbol, priceHistory, currentPrice) {
        const alerts = {};
        const confirmations = [];
        let brokenLevel = null;
        
        const internalHigh = this.internalHighs.get(symbol) || { currentLevel: null, crossed: false };
        const internalLow = this.internalLows.get(symbol) || { currentLevel: null, crossed: false };
        const internalTrend = this.internalTrend.get(symbol) || { bias: 0 };
        
        // Detect internal swing points (5-period lookback)
        const internalSwings = this.detectSwingPoints(priceHistory, 5);
        
        // Update internal levels
        if (internalSwings.newHigh) {
            internalHigh.currentLevel = internalSwings.high;
            internalHigh.crossed = false;
            this.internalHighs.set(symbol, internalHigh);
        }
        if (internalSwings.newLow) {
            internalLow.currentLevel = internalSwings.low;
            internalLow.crossed = false;
            this.internalLows.set(symbol, internalLow);
        }
        
        // Internal bullish structure break
        if (internalHigh.currentLevel && currentPrice > internalHigh.currentLevel && !internalHigh.crossed) {
            const tag = internalTrend.bias === -1 ? 'CHoCH' : 'BOS';
            
            alerts.internalBullishBOS = tag === 'BOS';
            alerts.internalBullishCHoCH = tag === 'CHoCH';
            
            if (tag === 'BOS') confirmations.push('internalBullishBOS');
            if (tag === 'CHoCH') confirmations.push('internalBullishCHoCH');
            
            if (!brokenLevel) brokenLevel = internalHigh.currentLevel; // Use as backup if no swing level
            
            internalHigh.crossed = true;
            internalTrend.bias = 1;
            this.internalTrend.set(symbol, internalTrend);
        }
        
        // Internal bearish structure break
        if (internalLow.currentLevel && currentPrice < internalLow.currentLevel && !internalLow.crossed) {
            const tag = internalTrend.bias === 1 ? 'CHoCH' : 'BOS';
            
            alerts.internalBearishBOS = tag === 'BOS';
            alerts.internalBearishCHoCH = tag === 'CHoCH';
            
            if (tag === 'BOS') confirmations.push('internalBearishBOS');
            if (tag === 'CHoCH') confirmations.push('internalBearishCHoCH');
            
            if (!brokenLevel) brokenLevel = internalLow.currentLevel; // Use as backup if no swing level
            
            internalLow.crossed = true;
            internalTrend.bias = -1;
            this.internalTrend.set(symbol, internalTrend);
        }
        
        return { alerts, confirmations, brokenLevel };
    }

    // =================================================================
    // ORDER BLOCK ANALYSIS - Your storeOrderBlock logic
    // =================================================================
    analyzeOrderBlocks(symbol, priceHistory, currentPrice) {
        const alerts = {};
        const confirmations = [];
        
        if (priceHistory.length < 10) return { alerts, confirmations };
        
        // Get stored order blocks for this symbol
        let orderBlocks = this.orderBlocks.get(symbol) || [];
        
        // Check for order block mitigation/respect
        const atr = this.calculateATR(priceHistory, 14);
        
        orderBlocks.forEach(orderBlock => {
            const inOrderBlockZone = currentPrice >= orderBlock.low && currentPrice <= orderBlock.high;
            
            if (inOrderBlockZone) {
                if (orderBlock.bias === 1) { // Bullish order block
                    confirmations.push('swingOrderBlockRespect');
                    alerts.swingOrderBlock = true;
                } else if (orderBlock.bias === -1) { // Bearish order block
                    confirmations.push('swingOrderBlockRespect');
                    alerts.swingOrderBlock = true;
                }
            }
        });
        
        // Create new order blocks when structure breaks (simplified logic)
        const recentBars = priceHistory.slice(-5);
        const hasOrderBlockFormation = this.detectOrderBlockFormation(recentBars);
        
        if (hasOrderBlockFormation.bullish) {
            const newOB = {
                high: hasOrderBlockFormation.high,
                low: hasOrderBlockFormation.low,
                bias: 1,
                timestamp: Date.now()
            };
            orderBlocks.unshift(newOB);
            confirmations.push('internalOrderBlockRespect');
        }
        
        if (hasOrderBlockFormation.bearish) {
            const newOB = {
                high: hasOrderBlockFormation.high,
                low: hasOrderBlockFormation.low,
                bias: -1,
                timestamp: Date.now()
            };
            orderBlocks.unshift(newOB);
            confirmations.push('internalOrderBlockRespect');
        }
        
        // Keep only recent order blocks (max 10)
        if (orderBlocks.length > 10) {
            orderBlocks = orderBlocks.slice(0, 10);
        }
        
        this.orderBlocks.set(symbol, orderBlocks);
        
        return { alerts, confirmations };
    }

    // =================================================================
    // FAIR VALUE GAP ANALYSIS - Your drawFairValueGaps logic
    // =================================================================
    analyzeFairValueGaps(symbol, priceHistory, currentPrice) {
        const alerts = {};
        const confirmations = [];
        
        if (priceHistory.length < 5) return { alerts, confirmations };
        
        const recentBars = priceHistory.slice(-5);
        
        // Detect bullish FVG: gap between bar[2].high and current.low
        for (let i = 2; i < recentBars.length; i++) {
            const prev2 = recentBars[i - 2];
            const current = recentBars[i];
            
            // Bullish FVG
            if (prev2.high < current.low) {
                confirmations.push('bullishFairValueGap');
                alerts.bullishFairValueGap = true;
            }
            
            // Bearish FVG
            if (prev2.low > current.high) {
                confirmations.push('bearishFairValueGap');
                alerts.bearishFairValueGap = true;
            }
        }
        
        return { alerts, confirmations };
    }

    // =================================================================
    // EQUAL HIGHS/LOWS ANALYSIS - Your drawEqualHighLow logic
    // =================================================================
    analyzeEqualHighsLows(symbol, priceHistory, currentPrice) {
        const alerts = {};
        const confirmations = [];
        
        if (priceHistory.length < 10) return { alerts, confirmations };
        
        const atr = this.calculateATR(priceHistory, 14);
        const threshold = 0.1 * atr; // equalHighsLowsThresholdInput = 0.1
        
        // Get recent highs and lows
        const recentBars = priceHistory.slice(-10);
        const highs = recentBars.map(bar => bar.high);
        const lows = recentBars.map(bar => bar.low);
        
        // Check for equal highs
        const equalHighLevels = this.findEqualLevels(highs, threshold);
        if (equalHighLevels.length >= 2 && currentPrice > Math.max(...equalHighLevels)) {
            confirmations.push('equalHighsBreak');
            alerts.equalHighs = true;
        }
        
        // Check for equal lows
        const equalLowLevels = this.findEqualLevels(lows, threshold);
        if (equalLowLevels.length >= 2 && currentPrice < Math.min(...equalLowLevels)) {
            confirmations.push('equalLowsBreak');
            alerts.equalLows = true;
        }
        
        return { alerts, confirmations };
    }

    // =================================================================
    // PREMIUM/DISCOUNT ZONE ANALYSIS
    // =================================================================
    analyzePremiumDiscountZones(symbol, priceHistory, currentPrice) {
        const confirmations = [];
        
        if (priceHistory.length < 20) return { confirmations };
        
        // Get recent swing high and low
        const recentBars = priceHistory.slice(-20);
        const swingHigh = Math.max(...recentBars.map(bar => bar.high));
        const swingLow = Math.min(...recentBars.map(bar => bar.low));
        
        const range = swingHigh - swingLow;
        const currentLevel = (currentPrice - swingLow) / range;
        
        // Premium zone (70% and above)
        if (currentLevel >= 0.7) {
            confirmations.push('premiumZoneEntry');
        }
        // Discount zone (30% and below)
        else if (currentLevel <= 0.3) {
            confirmations.push('discountZoneEntry');
        }
        // Equilibrium zone (40-60%)
        else if (currentLevel >= 0.4 && currentLevel <= 0.6) {
            confirmations.push('equilibriumZone');
        }
        
        return { confirmations };
    }

    // =================================================================
    // ADDITIONAL CONFLUENCE FACTORS
    // =================================================================
    analyzeAdditionalFactors(symbol, priceHistory, currentPrice) {
        const confirmations = [];
        
        // Volume confirmation (simplified)
        if (priceHistory.length >= 10) {
            const avgVolume = priceHistory.slice(-10).reduce((sum, bar) => sum + bar.volume, 0) / 10;
            const currentVolume = priceHistory[priceHistory.length - 1].volume;
            
            if (currentVolume > avgVolume * 1.3) {
                confirmations.push('volumeConfirmation');
            }
        }
        
        // ATR volatility filter
        if (priceHistory.length >= 14) {
            const atr = this.calculateATR(priceHistory, 14);
            const currentRange = priceHistory[priceHistory.length - 1].high - priceHistory[priceHistory.length - 1].low;
            
            if (currentRange > atr * 1.2) {
                confirmations.push('atrVolatilityFilter');
            }
        }
        
        return { confirmations };
    }

    // =================================================================
    // CONFIDENCE CALCULATION - Dynamic scoring system
    // =================================================================
    calculateConfidence(confirmations) {
        let totalScore = 0;
        let primaryConfirmations = 0;
        
        confirmations.forEach(confirmation => {
            if (this.confirmationScores[confirmation]) {
                totalScore += this.confirmationScores[confirmation];
                
                // Count primary structure confirmations
                if (confirmation.includes('BOS') || confirmation.includes('CHoCH')) {
                    primaryConfirmations++;
                }
            }
        });
        
        // Bonus for multiple primary confirmations
        if (primaryConfirmations >= 2) {
            totalScore += 10;
        }
        
        // Penalty for insufficient confirmations
        if (confirmations.length < 4) {
            totalScore *= 0.8;
        }
        
        return Math.min(Math.round(totalScore), 100);
    }

    // =================================================================
    // HELPER FUNCTION - Get symbol precision
    // =================================================================
    getSymbolPrecision(symbol) {
        const precisionMap = {
            'USD/JPY': 3,
            'EUR/USD': 5, 'GBP/USD': 5, 'USD/CHF': 5, 'AUD/USD': 5, 'USD/CAD': 5, 'NZD/USD': 5,
            'XAU/USD': 2, 'XAG/USD': 3,
            'BTC/USD': 2, 'ETH/USD': 2,
            'USOIL': 2, 'US30': 1
        };
        return precisionMap[symbol] || 5;
    }

    // =================================================================
    // SIGNAL VALIDATION - Quality control
    // =================================================================
    validateSignalQuality(analysis) {
        if (!analysis.signalDirection) return false;
        
        const primaryCount = analysis.confirmations.filter(c => 
            c.includes('BOS') || c.includes('CHoCH')
        ).length;
        
        const confidence = this.calculateConfidence(analysis.confirmations);
        
        return (
            primaryCount >= this.signalRequirements.minPrimaryConfirmations &&
            analysis.confirmations.length >= this.signalRequirements.minTotalConfirmations &&
            confidence >= this.signalRequirements.minConfidenceScore
        );
    }

    // =================================================================
    // HELPER FUNCTIONS
    // =================================================================
    initializeSymbolData(symbol, currentPriceData) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        const history = this.priceHistory.get(symbol);
        history.push(currentPriceData);
        
        // Keep last 100 bars
        if (history.length > 200) {
            history.splice(0, history.length - 200);
        }
    }

    detectSwingPoints(priceHistory, lookback) {
        if (priceHistory.length < lookback * 2 + 1) {
            return { newHigh: false, newLow: false, high: null, low: null };
        }
        
        const currentIndex = priceHistory.length - lookback - 1;
        const currentBar = priceHistory[currentIndex];
        
        let isSwingHigh = true;
        let isSwingLow = true;
        
        // Check if current bar is highest/lowest in lookback period
        for (let i = currentIndex - lookback; i <= currentIndex + lookback; i++) {
            if (i !== currentIndex && i >= 0 && i < priceHistory.length) {
                if (priceHistory[i].high >= currentBar.high) isSwingHigh = false;
                if (priceHistory[i].low <= currentBar.low) isSwingLow = false;
            }
        }
        
        return {
            newHigh: isSwingHigh,
            newLow: isSwingLow,
            high: isSwingHigh ? currentBar.high : null,
            low: isSwingLow ? currentBar.low : null
        };
    }

    calculateATR(priceHistory, period) {
        if (priceHistory.length < period + 1) {
            return priceHistory[0].close * 0.001; // Default ATR
        }
        
        const trueRanges = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const current = priceHistory[i];
            const previous = priceHistory[i - 1];
            
            const tr = Math.max(
                current.high - current.low,
                Math.abs(current.high - previous.close),
                Math.abs(current.low - previous.close)
            );
            trueRanges.push(tr);
        }
        
        const recentTRs = trueRanges.slice(-period);
        return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
    }

    detectOrderBlockFormation(recentBars) {
        // Simplified order block detection
        if (recentBars.length < 3) return { bullish: false, bearish: false };
        
        const prev = recentBars[recentBars.length - 3];
        const current = recentBars[recentBars.length - 2];
        const next = recentBars[recentBars.length - 1];
        
        // Bullish order block: down candle followed by strong up move
        const bullishOB = (prev.close < prev.open) && 
                         (next.close > current.high) && 
                         ((next.high - next.low) > (current.high - current.low) * 1.5);
        
        // Bearish order block: up candle followed by strong down move
        const bearishOB = (prev.close > prev.open) && 
                         (next.close < current.low) && 
                         ((next.high - next.low) > (current.high - current.low) * 1.5);
        
        return {
            bullish: bullishOB,
            bearish: bearishOB,
            high: current.high,
            low: current.low
        };
    }

    findEqualLevels(levels, threshold) {
        const equalLevels = [];
        
        for (let i = 0; i < levels.length; i++) {
            for (let j = i + 1; j < levels.length; j++) {
                if (Math.abs(levels[i] - levels[j]) <= threshold) {
                    if (!equalLevels.includes(levels[i])) equalLevels.push(levels[i]);
                    if (!equalLevels.includes(levels[j])) equalLevels.push(levels[j]);
                }
            }
        }
        
        return equalLevels;
    }

    canGenerateSignal(symbol, timestamp) {
        const lastSignal = this.lastSignalTime.get(symbol);
        return !lastSignal || (timestamp - lastSignal) >= this.signalRequirements.cooldownPeriod;
    }

    getSymbolVolatility(symbol) {
        const volatilityMap = {
            'EUR/USD': 0.0008, 'GBP/USD': 0.0012, 'USD/JPY': 0.008,
            'XAU/USD': 0.002, 'XAG/USD': 0.003, 'BTC/USD': 0.02,
            'ETH/USD': 0.025, 'USOIL': 0.015
        };
        return volatilityMap[symbol] || 0.001;
    }

    formatConfirmations(confirmations) {
        const formattedConfirmations = [];
        
        confirmations.forEach(confirmation => {
            switch(confirmation) {
                case 'swingBullishBOS':
                    formattedConfirmations.push('Swing Bullish BOS');
                    break;
                case 'swingBearishBOS':
                    formattedConfirmations.push('Swing Bearish BOS');
                    break;
                case 'swingBullishCHoCH':
                    formattedConfirmations.push('Swing Bullish CHoCH');
                    break;
                case 'swingBearishCHoCH':
                    formattedConfirmations.push('Swing Bearish CHoCH');
                    break;
                case 'internalBullishBOS':
                    formattedConfirmations.push('Internal Bullish BOS');
                    break;
                case 'internalBearishBOS':
                    formattedConfirmations.push('Internal Bearish BOS');
                    break;
                case 'internalBullishCHoCH':
                    formattedConfirmations.push('Internal Bullish CHoCH');
                    break;
                case 'internalBearishCHoCH':
                    formattedConfirmations.push('Internal Bearish CHoCH');
                    break;
                case 'swingOrderBlockRespect':
                    formattedConfirmations.push('Swing Order Block Respect');
                    break;
                case 'internalOrderBlockRespect':
                    formattedConfirmations.push('Internal Order Block Respect');
                    break;
                case 'bullishFairValueGap':
                    formattedConfirmations.push('Bullish Fair Value Gap');
                    break;
                case 'bearishFairValueGap':
                    formattedConfirmations.push('Bearish Fair Value Gap');
                    break;
                case 'equalHighsBreak':
                    formattedConfirmations.push('Equal Highs Break');
                    break;
                case 'equalLowsBreak':
                    formattedConfirmations.push('Equal Lows Break');
                    break;
                case 'premiumZoneEntry':
                    formattedConfirmations.push('Premium Zone Entry');
                    break;
                case 'discountZoneEntry':
                    formattedConfirmations.push('Discount Zone Entry');
                    break;
                case 'equilibriumZone':
                    formattedConfirmations.push('Equilibrium Zone');
                    break;
                case 'volumeConfirmation':
                    formattedConfirmations.push('Volume Confirmation');
                    break;
                case 'atrVolatilityFilter':
                    formattedConfirmations.push('ATR Volatility Filter');
                    break;
                default:
                    formattedConfirmations.push(confirmation);
            }
        });
        
        return formattedConfirmations;
    }

    generateAnalysisText(signalDirection, confirmations) {
        if (!signalDirection) return 'No clear directional bias detected.';
        
        const direction = signalDirection === 'BUY' ? 'bullish' : 'bearish';
        const confidence = this.calculateConfidence(confirmations);
        
        let analysis = `${confidence >= 80 ? 'Very Strong' : confidence >= 70 ? 'Strong' : 'Moderate'} ${direction} setup detected. `;
        
        // Structure analysis
        const hasSwingBOS = confirmations.some(c => c.includes('swingBullishBOS') || c.includes('swingBearishBOS'));
        const hasSwingCHoCH = confirmations.some(c => c.includes('swingBullishCHoCH') || c.includes('swingBearishCHoCH'));
        const hasInternalBOS = confirmations.some(c => c.includes('internalBullishBOS') || c.includes('internalBearishBOS'));
        
        if (hasSwingBOS) {
            analysis += `Major swing Break of Structure confirms ${direction} momentum shift. `;
        }
        if (hasSwingCHoCH) {
            analysis += `Swing Change of Character indicates potential trend reversal. `;
        }
        if (hasInternalBOS) {
            analysis += `Internal structure break provides additional confluence. `;
        }
        
        // Order block analysis
        if (confirmations.some(c => c.includes('OrderBlock'))) {
            analysis += `Price respecting institutional order block levels. `;
        }
        
        // Fair Value Gap analysis
        if (confirmations.some(c => c.includes('FairValueGap'))) {
            analysis += `Fair Value Gap providing strong directional bias. `;
        }
        
        // Zone analysis
        if (confirmations.includes('premiumZoneEntry')) {
            analysis += `Entry from premium zone - ideal for ${direction === 'bearish' ? 'sell' : 'buy'} setups. `;
        }
        if (confirmations.includes('discountZoneEntry')) {
            analysis += `Entry from discount zone - optimal for ${direction === 'bullish' ? 'buy' : 'sell'} entries. `;
        }
        
        // Risk assessment
        if (confidence >= 80) {
            analysis += `High-probability setup suitable for standard position sizing.`;
        } else if (confidence >= 70) {
            analysis += `Good probability setup - consider normal position size.`;
        } else if (confidence >= 60) {
            analysis += `Moderate probability - use reduced position size and tight risk management.`;
        }
        
        return analysis;
    }

    getSessionQuality() {
        const now = new Date();
        const hour = now.getUTCHours();
        
        // London session (7-16 UTC) - High quality
        if (hour >= 7 && hour <= 16) return 'London Session - High';
        // New York session (12-21 UTC) - High quality  
        if (hour >= 12 && hour <= 21) return 'New York Session - High';
        // London/NY overlap (12-16 UTC) - Very High quality
        if (hour >= 12 && hour <= 16) return 'London/NY Overlap - Very High';
        // Asian session (21-7 UTC) - Medium quality
        return 'Asian Session - Medium';
    }
}

module.exports = ProfessionalSMCEngine;
