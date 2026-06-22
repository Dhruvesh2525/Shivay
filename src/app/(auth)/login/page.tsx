// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user, loginWithGoogle, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for session warnings passed in URL parameters
    const err = searchParams.get('error');
    if (err === 'session_terminated') {
      setError('You have been logged out because this account was logged into on another device.');
    } else if (err === 'deactivated') {
      setError('This account has been deactivated. Please contact the administrator.');
    } else if (err === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }

    // If session matches, skip login
    if (user) {
      router.push('/');
    }
  }, [searchParams, user, router]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (isPasswordMode) {
        // Sign in using email & password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        setStatusMessage('Success! Logging you in...');
        setTimeout(() => {
          router.push('/');
          // Reload page to refresh auth state
          window.location.reload();
        }, 800);
      } else {
        // OTP magic link authentication
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (otpError) throw otpError;
        setSent(true);
        setStatusMessage('Login link sent! Please check your email inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-wider text-primary">SHIVAY</h1>
        <p className="text-xs tracking-widest text-[#6B8F7E] uppercase mt-1">The Cricketing Hub</p>
      </div>

      <h2 className="text-xl font-bold text-center mb-2">Welcome Back</h2>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Sign in to book courts, join tournaments & access your bookings
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {statusMessage}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading || authLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors transform active:scale-95 text-sm mb-5"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center my-4">
        <hr className="flex-grow border-[#1E3A2B]" />
        <span className="px-3 text-xs text-muted-foreground uppercase tracking-widest">or</span>
        <hr className="flex-grow border-[#1E3A2B]" />
      </div>

      <div className="flex border-b border-[#1E3A2B] mb-4">
        <button
          type="button"
          onClick={() => { setIsPasswordMode(true); setError(''); setStatusMessage(''); }}
          className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
            isPasswordMode ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => { setIsPasswordMode(false); setError(''); setStatusMessage(''); }}
          className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
            !isPasswordMode ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Magic Link OTP
        </button>
      </div>

      <form onSubmit={handleAuthSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent || loading}
            className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        {isPasswordMode && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || authLoading}
          className="w-full py-3 rounded-lg bg-primary hover:bg-[#6EE7B7] text-primary-foreground font-bold tracking-wide transition-all duration-200 transform active:scale-95 text-sm"
        >
          {loading ? 'Authenticating...' : isPasswordMode ? 'Sign In with Password' : sent ? 'Magic Link Sent' : 'Send Magic Link'}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-[#0A0F0D]">
      <Suspense fallback={<div className="text-primary">Loading parameters...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
