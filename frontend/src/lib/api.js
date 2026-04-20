import axios from 'axios';

const STORAGE_KEY = 'tms_token';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem(STORAGE_KEY);
      let role = null;
      if (token) {
        try { role = JSON.parse(atob(token.split('.')[1]))?.role ?? null; } catch { /* ignore */ }
      }
      localStorage.removeItem(STORAGE_KEY);
      const paths = { customer: '/customer/login', staff: '/staff/login', driver: '/driver/login', owner: '/owner/login' };
      window.location.href = paths[role] ?? '/customer/login';
    }
    return Promise.reject(error);
  }
);

export default api;
