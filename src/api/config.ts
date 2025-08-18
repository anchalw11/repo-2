// Dynamic API URL configuration
const getApiBaseUrl = () => {
  // For development and testing, always use local backend
  // In production, this should be set via environment variables
  const apiUrl = 'https://repo-2-1vzb.onrender.com';
  
  // Log the configuration for debugging
  console.log('API Configuration:', {
    apiUrl,
    hostname: window.location.hostname,
    env: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    envVars: {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV
    }
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
