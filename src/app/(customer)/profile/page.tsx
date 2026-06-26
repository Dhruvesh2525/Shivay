// src/app/(customer)/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const profileLoadedRef = useRef(false);

  // 2FA States
  const [twoFaStatus, setTwoFaStatus] = useState<{ enabled: boolean; verified: boolean } | null>(null);
  const [enrollData, setEnrollData] = useState<{ secret: string; qrUrl: string } | null>(null);
  const [twoFaToken, setTwoFaToken] = useState('');
  const [verifying2Fa, setVerifying2Fa] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaSuccess, setTwoFaSuccess] = useState('');


  // Redirect guests to login (only after we're sure — avoid flash redirect)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) router.push('/login');
    }, 800); // short grace period for auth to rehydrate from localStorage
    return () => clearTimeout(timer);
  }, [user, router]);

  // Populate form once from persisted profile
  useEffect(() => {
    if (profile && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBirthDate(profile.birth_date || '');
      setWalletBalance(Number(profile.wallet_balance) || 0);
    }
  }, [profile]);

  // Fetch wallet transactions
  useEffect(() => {
    if (!user) return;
    supabase
      .from('wallet_transactions')
      .select('id, reason, type, amount, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setWalletTransactions(data); });
  }, [user]);

  // Fetch 2FA Status
  const fetch2FaStatus = async () => {
    if (profile && ['super_admin', 'manager', 'organizer'].includes(profile.role)) {
      try {
        const res = await fetch('/api/auth/2fa/status');
        if (res.ok) {
          const data = await res.json();
          setTwoFaStatus(data);
        }
      } catch (err) {
        console.error('Error fetching 2FA status:', err);
      }
    }
  };

  useEffect(() => {
    fetch2FaStatus();
  }, [profile]);

  const handleEnroll2Fa = async () => {
    setTwoFaError('');
    setTwoFaSuccess('');
    try {
      const res = await fetch('/api/auth/2fa/enroll', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setEnrollData({ secret: data.secret, qrUrl: data.qrUrl });
      } else {
        setTwoFaError(data.error || 'Failed to start 2FA enrollment.');
      }
    } catch {
      setTwoFaError('Failed to start 2FA enrollment.');
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaError('');
    setTwoFaSuccess('');
    setVerifying2Fa(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFaToken })
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFaSuccess('Two-Factor Authentication enabled successfully!');
        setEnrollData(null);
        setTwoFaToken('');
        fetch2FaStatus();
      } else {
        setTwoFaError(data.error || 'Invalid verification token.');
      }
    } catch {
      setTwoFaError('Failed to verify token.');
    } finally {
      setVerifying2Fa(false);
    }
  };

  const handleDisable2Fa = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This lowers your account security.')) return;
    setTwoFaError('');
    setTwoFaSuccess('');
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTwoFaSuccess('Two-Factor Authentication has been disabled.');
        fetch2FaStatus();
      } else {
        setTwoFaError(data.error || 'Failed to disable 2FA.');
      }
    } catch {
      setTwoFaError('Failed to disable 2FA.');
    }
  };


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!user) throw new Error('Not authenticated');
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone, birth_date: birthDate })
        .eq('id', user.id);
      if (err) throw err;
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // If not logged in, show minimal guest state (not a full spinner)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-muted-foreground text-sm">Please sign in to view your profile.</p>
          <Link href="/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-[#6EE7B7] transition-colors">
            Login / Sign Up
          </Link>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-24 md:pb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-xl font-black text-primary uppercase mb-1">Edit Profile</h2>
            <p className="text-xs text-muted-foreground mb-4">Manage your account details</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email</label>
                <input type="email" disabled value={user?.email || ''}
                  className="w-full p-3 rounded-lg bg-background border border-border text-muted-foreground text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone</label>
                <input type="tel" required pattern="[0-9]{10}" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Birth Date</label>
                <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wide hover:bg-[#6EE7B7] transition-all text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={logout}
                  className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold flex items-center gap-2 transition-all text-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>

              {profile && ['super_admin', 'manager', 'organizer'].includes(profile.role) && (
                <div className="pt-4 border-t border-border mt-4">
                  <Link href="/admin"
                    className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-black tracking-wider flex items-center justify-center gap-2 transition-all text-sm uppercase">
                    <Shield className="w-4 h-4" /> Access Admin Dashboard
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* 2-Factor Authentication Section (Staff Only) */}
          {profile && ['super_admin', 'manager', 'organizer'].includes(profile.role) && (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
                <Shield className="w-5 h-5" />
                <h2 className="text-base font-black uppercase tracking-wider">Two-Factor Authentication (2FA)</h2>
              </div>

              {twoFaError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{twoFaError}</div>}
              {twoFaSuccess && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">{twoFaSuccess}</div>}

              {twoFaStatus?.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    <span>✓ 2FA is currently active on your account.</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your account is secured with TOTP-based two-factor authentication. You will be prompted for a security code when logging in.
                  </p>
                  <button
                    onClick={handleDisable2Fa}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Protect your administrative account by enforcing 2-Factor TOTP authentication. To set up, click the button below to generate a new secret.
                  </p>

                  {!enrollData ? (
                    <button
                      type="button"
                      onClick={handleEnroll2Fa}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wide hover:bg-[#6EE7B7] transition-all text-xs"
                    >
                      Enable 2FA
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 rounded-xl bg-input border border-border animate-in fade-in duration-300">
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(enrollData.qrUrl)}`}
                          alt="2FA QR Code"
                          className="border-4 border-white rounded-lg p-1"
                        />
                        <p className="text-[10px] text-center text-muted-foreground">
                          Scan this QR code using Google Authenticator, Authy, or any compatible TOTP app.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Or enter this key manually:</span>
                        <code className="block p-2 rounded bg-background border border-border text-xs font-mono font-bold text-center tracking-widest text-primary selection:bg-primary/20 select-all">
                          {enrollData.secret}
                        </code>
                      </div>

                      <form onSubmit={handleVerify2Fa} className="space-y-3 pt-2 border-t border-border/50">
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Verify Code</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="000000"
                            value={twoFaToken}
                            onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center tracking-widest text-sm font-bold font-mono p-2.5 rounded-lg bg-background border border-border text-primary focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEnrollData(null)}
                            className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-muted-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={verifying2Fa || twoFaToken.length < 6}
                            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-black tracking-wider uppercase disabled:opacity-50"
                          >
                            {verifying2Fa ? 'Verifying...' : 'Verify & Activate'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wallet */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-background border border-border">
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Personal Wallet</span>
            <h3 className="text-sm font-bold text-muted-foreground mt-4">Wallet Balance</h3>
            <p className="text-4xl font-black text-primary font-mono mt-1">₹{walletBalance.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Transaction History</h4>
            {walletTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent transactions.</p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {walletTransactions.map((tx) => (
                  <div key={tx.id} className="pb-2 border-b border-border last:border-b-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{tx.reason}</p>
                      <span className="text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${tx.type === 'credit' ? 'text-primary' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
