// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Don't clear localStorage here - let components handle 401 errors
      // Components can check error.response?.status === 401 and call logout from AuthContext
      // This prevents race conditions where localStorage is cleared but AuthContext still has user
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/') {
        // Already on login page, just reject the error
        return Promise.reject(error);
      }
      // For other pages, let the component handle the 401 error
      // ProtectedRoute will check AuthContext, not localStorage directly
    }
    return Promise.reject(error);
  }
);

export default api;
