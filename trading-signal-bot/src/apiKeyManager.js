const apiKeys = {
  'oanda.com': {
    'EUR/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'GBP/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'USD/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'XAU/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'XAG/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'USD/CHF': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'AUD/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'USD/CAD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'NZD/USD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'EUR/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'GBP/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'EUR/GBP': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'EUR/AUD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'GBP/AUD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'AUD/CAD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'CAD/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'CHF/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'AUD/CHF': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'CAD/CHF': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'EUR/CHF': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'GBP/CHF': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'NZD/CAD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'NZD/JPY': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
    'AUD/NZD': ['a60f9153-b032-4b5d-a86d-2427ead0196e'],
  },
  'financialmodellingprep.com': {
    // Crypto pairs would go here, but none are defined in the original file.
  },
};

const keyUsage = {};

function getHostForPair(pair) {
  // Prioritize Oanda for all forex pairs defined under it.
  if (apiKeys['oanda.com'][pair]) {
    return 'oanda.com';
  }
  // Fallback for other hosts if any
  for (const host in apiKeys) {
    if (apiKeys[host][pair]) {
      return host;
    }
  }
  return null;
}

function getNextKey(pair) {
  const host = getHostForPair(pair);
  if (!host) {
    return null;
  }

  if (!keyUsage[pair]) {
    keyUsage[pair] = 0;
  }

  const keys = apiKeys[host][pair];
  const keyIndex = keyUsage[pair] % keys.length;
  return keys[keyIndex];
}

function rotateKey(pair) {
  const host = getHostForPair(pair);
  if (!host) {
    return;
  }

  if (!keyUsage[pair]) {
    keyUsage[pair] = 0;
  }

  keyUsage[pair]++;
}

module.exports = {
  getNextKey,
  rotateKey,
  getHostForPair,
};
