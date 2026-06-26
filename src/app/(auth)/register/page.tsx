// src/app/(auth)/register/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Populate parameters from URL callback (e.g. from Google login)
    setEmail(searchParams.get('email') || '');
    setFullName(searchParams.get('name') || '');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user session found. Please log in first.');
      }

      // Insert profile details
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email || email,
          phone,
          birth_date: birthDate,
          role: 'customer',
          is_active: true
        });

      if (profileError) throw profileError;

      // Single active session tracking update
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('profiles')
          .update({ active_session_id: session.access_token })
          .eq('id', user.id);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
      <h2 className="text-3xl font-bold tracking-tight text-center text-primary mb-2">Complete Profile</h2>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Fill out your profile details to book turfs and courts at Shivay
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Profile saved! Redirecting to home...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
          <input
            type="text"
            required
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address</label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full p-3 rounded-lg bg-card border border-border text-muted-foreground cursor-not-allowed text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number (Mandatory)</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Birth Date (Mandatory)</label>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary hover:bg-[#6EE7B7] text-primary-foreground font-bold tracking-wide transition-all duration-200 transform active:scale-95 text-sm"
        >
          {loading ? 'Saving Profile...' : 'Complete & Continue'}
        </button>
      </form>
    </div>
  );
}

export default function Register() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center p-4 bg-background">
      <Suspense fallback={<div className="text-primary">Loading parameters...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
