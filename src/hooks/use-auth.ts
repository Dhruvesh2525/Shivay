// src/hooks/use-auth.ts
import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore, type Profile } from '@/stores/auth-store';

// Module-level guard: only set up the Supabase subscription once per browser session
let subscriptionActive = false;

export function useAuth() {
  const supabase = createClient();
  const { user, profile, loading, setAuth, clearAuth } = useAuthStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current || subscriptionActive) return;
    didInit.current = true;
    subscriptionActive = true;

    // Silent background revalidation — doesn't block UI since loading starts false
    const revalidate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const currentProfile = useAuthStore.getState().profile;
          if (currentProfile && currentProfile.id === session.user.id) {
            setAuth(session.user, currentProfile);
            return;
          }
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setAuth(session.user, prof as Profile);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    };

    revalidate();

    // Listen for auth changes (sign-in, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const currentProfile = useAuthStore.getState().profile;
        let prof = currentProfile;
        if (!prof || prof.id !== session.user.id) {
          const { data: fetchedProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          prof = fetchedProf as Profile;
        }

        // Single session enforcement
        const localActiveSessionId = currentProfile?.active_session_id;

        if (event === 'SIGNED_IN') {
          // New login: update active_session_id in DB if it's different
          if (prof && prof.active_session_id !== session.access_token) {
            await supabase
              .from('profiles')
              .update({ active_session_id: session.access_token })
              .eq('id', session.user.id);
            prof.active_session_id = session.access_token;
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token rotated: update DB only if we were the active session
          if (prof?.active_session_id && localActiveSessionId && prof.active_session_id === localActiveSessionId) {
            await supabase
              .from('profiles')
              .update({ active_session_id: session.access_token })
              .eq('id', session.user.id);
            prof.active_session_id = session.access_token;
          } else {
            // Mismatch: another device logged in or session terminated
            await supabase.auth.signOut();
            clearAuth();
            subscriptionActive = false;
            window.location.href = '/login?error=session_terminated';
            return;
          }
        } else {
          // For other events (e.g. INITIAL_SESSION, USER_UPDATED), check if there is a mismatch
          if (prof?.active_session_id && session.access_token && prof.active_session_id !== session.access_token) {
            await supabase.auth.signOut();
            clearAuth();
            subscriptionActive = false;
            window.location.href = '/login?error=session_terminated';
            return;
          }
        }

        setAuth(session.user, prof as Profile);
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        subscriptionActive = false;
      }
    });

    return () => {
      subscription.unsubscribe();
      subscriptionActive = false;
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    subscriptionActive = false;
    window.location.href = '/login';
  };

  return { user, profile, loading, loginWithGoogle, loginWithEmail, logout };
}
