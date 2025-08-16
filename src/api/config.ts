// Always use production API URL to ensure consistency
const getApiBaseUrl = () => {
  // Force production URL in all environments
  const prodUrl = 'https://traderedgepro.com/api';
  
  // Log the API URL being used (visible in browser console)
  console.log('API Base URL:', prodUrl);
  
  return prodUrl;
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
  withCredentials: true // Include cookies in cross-origin requests
};

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_BASE_URL,
};
