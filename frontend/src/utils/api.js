import axios from 'axios';

// In production (Vercel), the frontend vercel.json rewrites /api/* to the
// backend Vercel deployment, so baseURL stays '/api' in all environments.
// If you want to override (e.g. local dev hitting a remote backend), set
// VITE_API_URL in your .env file.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

// Attach stored token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('gb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (token expired / invalid)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gb_token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
