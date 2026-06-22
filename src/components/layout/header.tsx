// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Bell, User } from 'lucide-react';

export default function Header() {
  const { user, logout, profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0F0D]/80 backdrop-blur-md border-b border-[#1E3A2B] px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex flex-col">
        <span className="text-xl font-black tracking-wider text-primary">SHIVAY</span>
        <span className="text-[9px] tracking-widest text-[#6B8F7E] uppercase -mt-1 font-semibold">The Cricketing Hub</span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Simple Notification Button */}
        <button className="relative p-2 text-[#A7C4B8] hover:text-primary transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <Link 
              href="/profile" 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary border border-[#1E3A2B] text-primary hover:border-primary transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
            {profile && ['super_admin', 'manager', 'organizer'].includes(profile.role) && (
              <Link href="/admin" className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-mono uppercase">
                Admin
              </Link>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold hover:bg-[#6EE7B7] transition-colors">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
