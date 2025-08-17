// Dynamic API URL configuration
const getApiBaseUrl = () => {
  const isDev = import.meta.env.DEV;
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAmplify = hostname.includes('amplifyapp.com');

  if (isDev || isLocal) {
    // Development environment
    const apiUrl = 'http://127.0.0.1:5000/api';
    console.log('API Base URL (dev):', apiUrl, { isDev, isLocal, isAmplify, hostname });
    return apiUrl;
  }

  // Production: prefer explicit backend URL from env
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  const apiUrl = fromEnv && fromEnv.trim().length > 0 ? fromEnv : '/api';

  console.log('API Base URL (prod):', apiUrl, {
    fromEnv,
    NODE_ENV: process.env.NODE_ENV,
    isDev,
    isLocal,
    isAmplify,
    hostname
  });
  return apiUrl;
};

// Export the base URL directly
const API_BASE_URL = getApiBaseUrl();

// Log the API base URL when the module loads
console.log('API Configuration Initialized:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  VITE_API_URL: import.meta.env.VITE_API_URL
});

export { API_BASE_URL };

export const API_CONFIG = {
  baseURL: API_BASE_URL, // Explicitly set baseURL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: false, // Disable for cross-origin requests to prevent CORS issues
  maxRedirects: 0, // Prevent automatic redirects that convert POST to GET
  validateStatus: function (status: number) {
    return status >= 200 && status < 300; // Only accept success status codes
  }
};

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_BASE_URL,
};
