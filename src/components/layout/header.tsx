// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { User, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { user, profile, loading } = useAuth();

  // Determine dashboard URL based on role
  const getDashboardHref = () => {
    if (!profile) return '/admin';
    if (profile.role === 'organizer') return '/admin';
    if (profile.role === 'manager') return '/admin';
    return '/admin';
  };

  const isStaff = profile && ['super_admin', 'manager', 'organizer'].includes(profile.role);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0F0D]/90 backdrop-blur-md border-b border-[#1E3A2B] px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex flex-col">
        <span className="text-xl font-black tracking-wider text-primary">SHIVAY</span>
        <span className="text-[9px] tracking-widest text-[#6B8F7E] uppercase -mt-1 font-semibold">The Cricketing Hub</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Show skeleton during auth loading */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        ) : user ? (
          <>
            {/* Dashboard button — prominent for staff */}
            {isStaff && (
              <Link
                href={getDashboardHref()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-[#6EE7B7] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}

            {/* Profile avatar */}
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A2620] border border-[#1E3A2B] text-primary hover:border-primary transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:bg-[#6EE7B7] transition-colors"
          >
            Login / Sign Up
          </Link>
        )}
      </div>
    </header>
  );
}
