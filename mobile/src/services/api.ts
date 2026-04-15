import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1';

export const mobileApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

mobileApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

mobileApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('access_token', data.data.accessToken);
        await SecureStore.setItemAsync('refresh_token', data.data.refreshToken);

        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return mobileApi(error.config);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(error);
  },
);

export const get  = <T>(url: string, params?: any) => mobileApi.get<{data: T}>(url, { params }).then(r => r.data.data);
export const post = <T>(url: string, body?: any)   => mobileApi.post<{data: T}>(url, body).then(r => r.data.data);
