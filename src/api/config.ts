// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in production
  if (import.meta.env.PROD) {
    // Check if we're on Amplify
    if (window.location.hostname.includes('amplifyapp.com')) {
      // Point to your production Flask backend
      return 'https://traderedgepro.com/api';
    }
    // In production on your own domain
    return '/api';
  }
  
  // In development, use the proxy
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_BASE_URL,
};
