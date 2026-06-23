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
      <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
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
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-24 md:pb-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B]">
            <h2 className="text-xl font-black text-primary uppercase mb-1">Edit Profile</h2>
            <p className="text-xs text-muted-foreground mb-4">Manage your account details</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email</label>
                <input type="email" disabled value={user?.email || ''}
                  className="w-full p-3 rounded-lg bg-[#0A0F0D] border border-[#1E3A2B] text-muted-foreground text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone</label>
                <input type="tel" required pattern="[0-9]{10}" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Birth Date</label>
                <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground text-sm focus:outline-none focus:border-primary" />
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
                <div className="pt-4 border-t border-[#1E3A2B] mt-4">
                  <Link href="/admin"
                    className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-black tracking-wider flex items-center justify-center gap-2 transition-all text-sm uppercase">
                    <Shield className="w-4 h-4" /> Access Admin Dashboard
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Wallet */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#111A16] to-[#0A0F0D] border border-[#1E3A2B]">
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Personal Wallet</span>
            <h3 className="text-sm font-bold text-muted-foreground mt-4">Wallet Balance</h3>
            <p className="text-4xl font-black text-primary font-mono mt-1">₹{walletBalance.toFixed(2)}</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B]">
            <h4 className="text-xs font-bold text-[#A7C4B8] uppercase tracking-wider mb-4">Transaction History</h4>
            {walletTransactions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent transactions.</p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {walletTransactions.map((tx) => (
                  <div key={tx.id} className="pb-2 border-b border-[#1E3A2B] last:border-b-0 flex items-center justify-between">
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
