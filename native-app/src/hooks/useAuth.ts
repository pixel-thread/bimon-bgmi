import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setToken: (token) => set({ token }),

    login: async (token, user) => {
        try {
            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('user_data', JSON.stringify(user));
            set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Failed to save auth data:', error);
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('user_data');
            set({ token: null, user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Failed to clear auth data:', error);
        }
    },

    loadStoredAuth: async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userDataStr = await SecureStore.getItemAsync('user_data');

            if (token && userDataStr) {
                const user = JSON.parse(userDataStr) as User;
                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to load stored auth:', error);
            set({ isLoading: false });
        }
    },
}));
