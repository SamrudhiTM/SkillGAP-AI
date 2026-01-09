import axios from "axios";

// API base URL - automatically detects environment
const getApiUrl = () => {
  // In production, API is served from the same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // In development, use environment variable or default
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
};

export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;


