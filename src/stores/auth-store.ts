// src/stores/auth-store.ts
import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setAuth: (user, profile) => set({ user, profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearAuth: () => set({ user: null, profile: null, loading: false }),
}));
