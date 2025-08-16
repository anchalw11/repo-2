import React, { useState, useEffect } from 'react';

interface LivePriceFeedProps {
  market: 'forex' | 'crypto';
}

const LivePriceFeed: React.FC<LivePriceFeedProps> = ({ market }) => {
  const [prices, setPrices] = useState<any>({});

  const symbols = {
    forex: [
      'XAU/USD', 'XAG/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
      'EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'EUR/GBP',
      'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD',
      'AUD/CHF', 'AUD/CAD', 'AUD/NZD', 'CAD/CHF', 'NZD/CHF', 'NZD/CAD'
    ],
    crypto: [
      'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT',
      'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'LTCUSDT', 'XLMUSDT', 'FILUSDT', 'AAVEUSDT'
    ]
  };

  const selectedSymbols = symbols[market];

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        if (market === 'forex') {
          const url = `http://127.0.0.1:5009/api/bulk-forex-price?pairs=${selectedSymbols.join(',')}`;
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Error fetching bulk forex prices: ${response.statusText}`);
            return;
          }
          const results = await response.json();
          const newPrices: any = {};
          for (const symbol in results) {
            if (results[symbol] && results[symbol].price) {
              newPrices[symbol] = {
                price: results[symbol].price.toFixed(5),
                provider: 'yfinance',
              };
            }
          }
          setPrices(newPrices);
        } else {
          const newPrices: any = {};
          for (const symbol of selectedSymbols) {
            await new Promise(resolve => setTimeout(resolve, 200));
            try {
              const url = `/binance-api/ticker/price?symbol=${symbol}`;
              const response = await fetch(url);
              if (!response.ok) {
                console.error(`Error fetching price for ${symbol}: ${response.statusText}`);
                continue;
              }
              const result = await response.json();
              if (result && result.price) {
                newPrices[symbol] = {
                  price: parseFloat(result.price).toFixed(5),
                  provider: 'Binance',
                };
              }
            } catch (error) {
              console.error(`Error fetching price for ${symbol}:`, error);
            }
          }
          setPrices(newPrices);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [market, selectedSymbols]);

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">Live Prices</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.keys(prices).length > 0 ? (
          Object.keys(prices).map(symbol => (
            <div key={symbol} className="flex justify-between items-center p-2 bg-gray-900/50 rounded-lg">
              <span className="text-white font-semibold">{symbol}</span>
              <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">({prices[symbol].provider})</span>
                  <span className="text-green-400 font-bold">{prices[symbol].price}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400">Loading live prices...</p>
        )}
      </div>
    </div>
  );
};

export default LivePriceFeed;
