import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const DOCS_URL = `${API_BASE}/docs`;
const TOKEN_KEY = 'billing_client_token';

export const api = axios.create({ baseURL: `${API_BASE}/api/client` });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const auth = {
  async login(email, password, totp) {
    const { data } = await api.post('/auth/login', { email, password, totp });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem('billing_client', JSON.stringify(data.client));
    return data;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('billing_client');
    location.href = '/login';
  },
  isAuthed: () => !!localStorage.getItem(TOKEN_KEY),
  me: () => { try { return JSON.parse(localStorage.getItem('billing_client') || 'null'); } catch { return null; } },
};

export const usdt = (n) => `${Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} USDT`;
