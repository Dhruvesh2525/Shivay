// src/hooks/use-auth.ts
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type Profile } from '@/stores/auth-store';

export function useAuth() {
  const supabase = createClient();
  const { user, profile, loading, setAuth, setLoading, clearAuth } = useAuthStore();
  // Track if THIS store instance has already been initialized
  const initialized = useRef(useAuthStore.getState().user !== null || !useAuthStore.getState().loading);

  useEffect(() => {
    // If auth is already resolved (user known or explicitly logged out), skip re-fetch
    if (!useAuthStore.getState().loading) return;

    let isMounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (isMounted) setAuth(session.user, prof as Profile);
        } else {
          if (isMounted) clearAuth();
        }
      } catch {
        if (isMounted) clearAuth();
      }
    };

    init();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return;

        // Single Session Enforcement Check
        const currentToken = session.access_token;
        if (prof?.active_session_id && currentToken && prof.active_session_id !== currentToken) {
          await supabase.auth.signOut();
          clearAuth();
          window.location.href = '/login?error=session_terminated';
          return;
        }

        setAuth(session.user, prof as Profile);
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearAuth();
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
