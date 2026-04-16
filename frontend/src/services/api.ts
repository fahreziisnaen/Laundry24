import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();
        if (!refreshToken) { logout(); return Promise.reject(error); }

        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        setTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

// Helper to extract .data from wrapped response { success, data, meta, message }
export const apiGet    = <T>(url: string, params?: any) => api.get<{ data: T }>(url, { params }).then(r => r.data.data);
export const apiPost   = <T>(url: string, body?: any)   => api.post<{ data: T }>(url, body).then(r => r.data.data);
export const apiPatch  = <T>(url: string, body?: any)   => api.patch<{ data: T }>(url, body).then(r => r.data.data);
export const apiDelete = <T>(url: string)               => api.delete<{ data: T }>(url).then(r => r.data.data);

// For paginated endpoints that return { data: T[], meta: { page, totalPages, total, limit } }
export const apiGetPaginated = <T>(url: string, params?: any) =>
  api.get<{ data: T[]; meta: any }>(url, { params }).then(r => ({
    data: r.data.data ?? [],
    meta: r.data.meta ?? {},
  }));
