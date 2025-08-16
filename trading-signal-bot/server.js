const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const SmartMoneyAnalyzer = require('./src/SmartMoneyAnalyzer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize the Smart Money Analyzer
let analyzer = new SmartMoneyAnalyzer();

// --- Request Throttling ---
let lastRequestTimestamp = 0;
const REQUEST_COOLDOWN = 15000; // 15 seconds

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Trading Signal Bot',
    version: '1.0.0'
  });
});


// Price fetching endpoint
app.post('/api/get-price', async (req, res) => {
  try {
    const { symbol, timeframe } = req.body;
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: 'Symbol and timeframe are required.' });
    }
    // We can reuse the analyzer's fetch method, but we might want a more lightweight one later
    const historicalData = await analyzer.fetchHistoricalData(symbol, timeframe);
    if (historicalData && historicalData.length > 0) {
      res.json({ price: historicalData[0].close }); // Return the most recent price
    } else {
      res.status(404).json({ error: 'Price not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price', details: error.message });
  }
});

// Main analysis endpoint
app.post('/api/analyze-symbol', async (req, res) => {
  const now = Date.now();
  if (now - lastRequestTimestamp < REQUEST_COOLDOWN) {
    const timeLeft = Math.ceil((REQUEST_COOLDOWN - (now - lastRequestTimestamp)) / 1000);
    return res.status(429).json({
      error: 'Too Many Requests',
      details: `Please wait ${timeLeft} seconds before making another request.`,
      symbol: req.body.symbol,
      timeframe: req.body.timeframe,
    });
  }
  lastRequestTimestamp = now;

  try {
    const { symbol, timeframe } = req.body;
    
    // Validate input parameters
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid symbol. Please provide a valid symbol (e.g., "EURUSD", "BTCUSD").' 
      });
    }
    
    if (!timeframe || typeof timeframe !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid timeframe. Please provide a valid timeframe (e.g., "5m", "1h", "1d").' 
      });
    }

    console.log(`🔍 Analyzing ${symbol} on ${timeframe} timeframe...`);
    
    // Perform the analysis
    const analysisResult = await analyzer.analyzeSymbol(symbol, timeframe);

    console.log(`✅ Analysis completed for ${symbol}:`, {
      direction: analysisResult.signalType || analysisResult.direction,
      confidence: analysisResult.confidence,
      entry: analysisResult.entryPrice || 'N/A'
    });

        // Emit the signal to connected clients
    if (analysisResult.signalType !== 'NEUTRAL') {
      io.emit('newSignal', analysisResult);
    }
    
    res.json(analysisResult);
    
  } catch (error) {
    console.error(`❌ Analysis failed for ${req.body.symbol || 'unknown symbol'}:`, error.message);
    
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message,
      symbol: req.body.symbol || 'unknown',
      timeframe: req.body.timeframe || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/get-price',
      'POST /api/analyze-symbol',
    ],
    timestamp: new Date().toISOString()
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Trading Signal Bot started successfully!`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/get-price - Fetch latest price for a symbol`);
  console.log(`   POST /api/analyze-symbol - Analyze trading symbol`);
  console.log(`   GET /health - Health check`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n� Shutting down Trading Signal Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n� Shutting down Trading Signal Bot...');
  process.exit(0);
});
