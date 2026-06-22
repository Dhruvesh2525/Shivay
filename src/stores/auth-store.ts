// src/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  avatar_url?: string;
  role: 'customer' | 'manager' | 'organizer' | 'super_admin';
  wallet_balance: number;
  is_active: boolean;
  two_factor_enabled: boolean;
  active_session_id?: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  setAuth: (user: any | null, profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      // Start as false — persisted data is available immediately from localStorage
      // The hook will briefly revalidate in the background without blocking UI
      loading: false,
      setAuth: (user, profile) => set({ user, profile, loading: false }),
      setLoading: (loading) => set({ loading }),
      clearAuth: () => set({ user: null, profile: null, loading: false }),
    }),
    {
      name: 'shivay-auth', // localStorage key
      partialize: (state) => ({ user: state.user, profile: state.profile }),
      // Don't persist loading — always start as false
    }
  )
);
