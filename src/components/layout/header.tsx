// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, User } from 'lucide-react';

export default function Header() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();

  const isStaff = profile && ['super_admin', 'manager', 'organizer'].includes(profile.role);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Book', href: '/book' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'History', href: '/bookings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center transition-all duration-300">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-2 cursor-pointer active:scale-95 transition-all">
        {/* SVG Cricket Bat and Ball Icon */}
        <svg className="w-7 h-7 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.5 5.5L5.5 18.5" />
          <path d="M15 4l5 5-2 2-5-5z" />
          <circle cx="7" cy="7" r="2.5" fill="currentColor" />
        </svg>
        <h1 className="font-display text-2xl font-black tracking-tighter text-primary select-none">SHIVAY</h1>
      </Link>

      {/* Desktop navigation */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-8 mr-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link-animated font-mono-custom text-xs uppercase tracking-widest transition-all duration-200 hover:text-primary ${
                  isActive 
                    ? 'nav-link-active text-primary font-bold drop-shadow-[0_0_8px_rgba(171,214,0,0.5)]' 
                    : 'text-[#8e9379]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User state / Profile actions */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              {isStaff && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-black font-mono-custom text-[10px] uppercase tracking-wider hover:opacity-90 transition-all hover:scale-105 active:scale-100 shadow-md shadow-primary/10"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden hover:border-primary transition-all active:scale-90"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-foreground/80" />
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="font-mono-custom text-[11px] font-black uppercase tracking-wider bg-primary text-primary-foreground px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_16px_rgba(171,214,0,0.3)] hover:scale-105 active:scale-95"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
