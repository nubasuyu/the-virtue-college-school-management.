/* import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});
 */
// Automatically attach the token to every request
/* api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; */

import axios from 'axios';

const api = axios.create({
  // 👇 THIS IS THE CRITICAL FIX
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001',
  timeout: 5000,
  //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add your JWT interceptor here if you have one...
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;