import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface Customer {
  id: number;
  name: string;
  phone: string;
  walletBalance: number;
  loyaltyPoints: number;
}

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  login: (customer: Customer, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,

  login: async (customer, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('customer', JSON.stringify(customer));
    set({ customer, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('customer');
    set({ customer: null, isAuthenticated: false });
  },

  hydrateFromStorage: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    const customerStr = await SecureStore.getItemAsync('customer');
    if (token && customerStr) {
      set({ customer: JSON.parse(customerStr), isAuthenticated: true });
    }
  },
}));
