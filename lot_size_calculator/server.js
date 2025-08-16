const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Mock exchange rates for demonstration purposes
const exchangeRates = {
  'EURUSD': 1.08,
  'GBPUSD': 1.25,
  'USDJPY': 145.0,
  'USDCAD': 1.35,
  'AUDUSD': 0.65,
  'NZDUSD': 0.60,
  'USDCHF': 0.90,
};

app.post('/calculate-lot-size', (req, res) => {
  const { accountCurrency, balance, riskPercentage, stopLossPips, pair } = req.body;

  if (!accountCurrency || !balance || !riskPercentage || !stopLossPips || !pair) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  const riskAmount = balance * (riskPercentage / 100);
  const pairKey = pair.replace('/', '');
  const exchangeRate = exchangeRates[pairKey];

  if (!exchangeRate) {
    return res.status(400).json({ error: `Exchange rate for pair ${pair} not found.` });
  }

  const quoteCurrency = pair.substring(3);
  let pipValue;

  if (quoteCurrency === 'JPY') {
    pipValue = 0.01;
  } else {
    pipValue = 0.0001;
  }

  let lotSize;
  if (accountCurrency === quoteCurrency) {
    lotSize = riskAmount / (stopLossPips * pipValue);
  } else {
    // This is a simplification. In a real scenario, you would need to convert
    // the risk amount to the quote currency using the current exchange rate.
    // For this example, we'll assume a 1:1 conversion rate for simplicity.
    const riskInQuoteCurrency = riskAmount; 
    lotSize = riskInQuoteCurrency / (stopLossPips * pipValue * exchangeRate);
  }

  res.json({ lotSize: lotSize / 100000 });
});

app.listen(PORT, () => {
  console.log(`Lot size calculator service listening on port ${PORT}`);
});
