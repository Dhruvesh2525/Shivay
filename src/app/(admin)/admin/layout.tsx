// src/app/(admin)/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, Calendar, Settings, ShieldAlert, Award, AlertTriangle, Key } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();

  // 2FA states
  const [checking2Fa, setChecking2Fa] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(true);
  const [totpToken, setTotpToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'organizer') {
        if (pathname !== '/admin/tournaments' && pathname !== '/admin') {
          router.replace('/admin');
        }
      } else if (profile.role === 'manager') {
        if (pathname === '/admin/refunds' || pathname === '/admin/tournaments') {
          router.replace('/admin');
        }
      }
    }
  }, [profile, loading, pathname, router]);

  useEffect(() => {
    const check2FaStatus = async () => {
      if (!loading && profile && ['super_admin', 'manager', 'organizer'].includes(profile.role)) {
        try {
          const res = await fetch('/api/auth/2fa/status');
          if (res.ok) {
            const data = await res.json();
            setTwoFactorEnabled(data.enabled);
            setTwoFactorVerified(data.verified);
          }
        } catch (err) {
          console.error('Failed to check 2FA status:', err);
        } finally {
          setChecking2Fa(false);
        }
      } else if (!loading) {
        setChecking2Fa(false);
      }
    };
    check2FaStatus();
  }, [profile, loading]);

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpToken) return;
    try {
      setVerifying(true);
      setVerifyError(null);
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpToken })
      });
      if (res.ok) {
        setTwoFactorVerified(true);
      } else {
        const data = await res.json();
        setVerifyError(data.error || 'Invalid 2FA code.');
      }
    } catch {
      setVerifyError('Failed to verify code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const allLinks = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'manager', 'organizer'] },
    { label: 'Courts & Settings', href: '/admin/courts', icon: Settings, roles: ['super_admin'] },
    { label: 'Bookings List', href: '/admin/bookings', icon: Calendar, roles: ['super_admin', 'manager'] },
    { label: 'Tournaments', href: '/admin/tournaments', icon: Award, roles: ['super_admin', 'organizer'] },
    { label: 'Refund Claims', href: '/admin/refunds', icon: ShieldAlert, roles: ['super_admin'] },
  ];

  const sidebarLinks = allLinks.filter(link => profile && link.roles.includes(profile.role));

  if (loading || checking2Fa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary text-xs font-bold font-mono">
        Loading admin workspace...
      </div>
    );
  }

  // 2FA Admin Gate UI Overlay
  if (twoFactorEnabled && !twoFactorVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <Key className="w-5 h-5" />
            <h3 className="font-black text-sm uppercase">2-Factor Security Gate</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This account has Two-Factor Authentication enabled. Enter the 6-digit verification code from your authenticator app to proceed.
          </p>

          {verifyError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerify2Fa} className="space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest text-lg font-bold font-mono p-3 rounded-lg bg-input border border-border text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground hover:bg-white/10 transition-colors"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={verifying || totpToken.length < 6}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-black tracking-wider uppercase hover:bg-[#6EE7B7] transition-all disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-6 text-sm shrink-0">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-black text-primary tracking-wider">SHIVAY</Link>
          <span className="text-[10px] text-muted-foreground uppercase font-mono block tracking-widest mt-0.5">
            {profile?.role === 'super_admin' ? 'Super Admin Layout' : profile?.role === 'manager' ? 'Manager Layout' : 'Organizer Layout'}
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-primary'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
          <span>Logged in as: <span className="font-bold text-foreground block truncate max-w-[120px]">{profile?.full_name || 'Admin'}</span></span>
          <button 
            onClick={handleLogout} 
            className="text-[10px] border border-white/10 px-2 py-1 rounded hover:bg-white/5 hover:text-red-400 transition-colors uppercase font-mono"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden w-full bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-black text-primary tracking-wide">SHIVAY ADMIN</span>
          <button onClick={handleLogout} className="text-xs text-muted-foreground border border-white/10 px-2.5 py-1 rounded-lg">
            Exit
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
