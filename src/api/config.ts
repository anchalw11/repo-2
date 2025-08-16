// Always use production API URL to ensure consistency
const getApiBaseUrl = () => {
  const prodUrl = 'https://traderedgepro.com/api';
  console.log('Using production API URL:', prodUrl);
  return prodUrl;
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
