import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from './config';

// Create axios instance with production configuration
const api = axios.create({
  ...API_CONFIG,
  // Ensure we're using the correct base URL
  baseURL: API_BASE_URL,
  // Add response type
  responseType: 'json',
});

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
        config: response.config
      });
    }
    return response;
  },
  (error) => {
    // Log error details
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      request: {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
        timeout: error.config?.timeout,
        withCredentials: error.config?.withCredentials
      },
      config: error.config
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('session-invalid'));
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token and add request logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

export default api;
