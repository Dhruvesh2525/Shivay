// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

function getSearchParam(key: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) || '';
}

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const { user, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Read error from URL params (client-side only)
  useEffect(() => {
    const err = getSearchParam('error');
    if (err === 'session_terminated') setError('You were logged out because this account was used on another device.');
    else if (err === 'deactivated') setError('This account has been deactivated. Contact the administrator.');
    else if (err === 'auth_failed') setError('Authentication failed. Please try again.');
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      if (isForgotMode) {
        // Password reset request (SRD) — rate limited server-side.
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reset request failed.');
        setSent(true);
        setStatusMessage(data.message || 'If an account exists, a reset link has been sent.');

      } else if (isRegisterMode) {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Sign up failed. Please try again.');

        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          phone,
          birth_date: birthDate,
          role: 'customer',
          is_active: true,
        });

        setStatusMessage('Account created! Taking you home...');
        // Use router.replace — no page reload needed, auth state updates via onAuthStateChange
        setTimeout(() => router.replace('/'), 1000);

      } else if (isPasswordMode) {
        // Password Login — routed through our server endpoint so it is
        // rate-limited (SRD) by IP before hitting Supabase Auth.
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Authentication failed.');
        }
        // onAuthStateChange in use-auth.ts will update the store automatically
        router.replace('/');

      } else {
        // Magic Link OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (otpError) throw otpError;
        setSent(true);
        setStatusMessage('Magic link sent! Check your email inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-background min-h-screen">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-wider text-primary">SHIVAY</h1>
          <p className="text-xs tracking-widest text-muted-foreground uppercase mt-1">The Cricketing Hub</p>
        </div>

        <h2 className="text-xl font-bold text-center mb-1">
          {isForgotMode ? 'Reset Password' : isRegisterMode ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {isForgotMode
            ? 'Enter your email to receive a reset link'
            : isRegisterMode
              ? 'Join Shivay to book courts and join tournaments'
              : 'Sign in to access your account'}
        </p>

        {/* Error / Status */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        {statusMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{statusMessage}</div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors active:scale-95 text-sm mb-5 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-border" />
          <span className="px-3 text-xs text-muted-foreground uppercase tracking-widest">or</span>
          <hr className="flex-grow border-border" />
        </div>

        {/* Password / OTP tabs (only in sign-in mode) */}
        {!isRegisterMode && (
          <div className="flex border-b border-border mb-4">
            {[{ label: 'Password', val: true }, { label: 'Magic Link', val: false }].map(({ label, val }) => (
              <button key={label} type="button"
                onClick={() => { setIsPasswordMode(val); setError(''); setStatusMessage(''); }}
                className={`flex-1 pb-2 text-sm font-semibold transition-colors ${isPasswordMode === val ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
              <input type="text" required placeholder="John Doe" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address</label>
            <input type="email" required placeholder="name@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} disabled={sent || loading}
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-60" />
          </div>

          {(isRegisterMode || (isPasswordMode && !isForgotMode)) && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Password</label>
              <input type="password" required placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary disabled:opacity-60" />
            </div>
          )}

          {/* Forgot password toggle (sign-in + password mode only) */}
          {!isRegisterMode && isPasswordMode && !isForgotMode && (
            <div className="text-right">
              <button type="button"
                onClick={() => { setIsForgotMode(true); setError(''); setStatusMessage(''); setSent(false); }}
                className="text-xs text-muted-foreground hover:text-primary hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number</label>
                <input type="tel" required pattern="[0-9]{10}" placeholder="9876543210" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Birth Date</label>
                <input type="date" required value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full py-3 rounded-lg bg-primary hover:bg-[#6EE7B7] text-primary-foreground font-bold tracking-wide transition-all active:scale-95 text-sm disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : isRegisterMode
                ? 'Create Account'
                : isForgotMode
                  ? sent
                    ? 'Reset Link Sent ✓'
                    : 'Send Reset Link'
                  : isPasswordMode
                    ? 'Sign In'
                    : sent
                      ? 'Magic Link Sent ✓'
                      : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); setStatusMessage(''); setSent(false); }}
            className="text-primary font-semibold hover:underline">
            {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </main>
  );
}
