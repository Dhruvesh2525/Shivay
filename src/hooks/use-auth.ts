// src/hooks/use-auth.ts
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type Profile } from '@/stores/auth-store';

// Module-level flag to prevent multiple simultaneous auth checks
let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;

export function useAuth() {
  const supabase = createClient();
  const { user, profile, loading, setAuth, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    // Only run the full initialization once across all hook instances
    if (authInitialized) return;
    authInitialized = true;

    const checkUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuth(session.user, prof as Profile);
      } else {
        clearAuth();
      }
    };

    checkUser();

    // Set up auth state change listeners (only once)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // Single Session Enforcement Check (Client Side)
        const currentToken = session.access_token;
        if (prof?.active_session_id && currentToken && prof.active_session_id !== currentToken) {
          await supabase.auth.signOut();
          clearAuth();
          authInitialized = false;
          authSubscription = null;
          window.location.href = '/login?error=session_terminated';
          return;
        }

        setAuth(session.user, prof as Profile);
      } else {
        // Only clear on explicit sign-out events, not on initial INITIAL_SESSION
        if (event !== 'INITIAL_SESSION') {
          clearAuth();
        }
      }
    });

    authSubscription = subscription;

    // Cleanup on page unload (not on component unmount to keep state alive)
    return () => {
      // Do NOT unsubscribe here — we want the listener to persist across page navigations
      // The subscription is module-level and shared
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) throw error;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    clearAuth();
    authInitialized = false;
    authSubscription = null;
    window.location.href = '/login';
  };

  return {
    user,
    profile,
    loading,
    loginWithGoogle,
    loginWithEmail,
    logout,
  };
}
