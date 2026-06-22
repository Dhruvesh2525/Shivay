// src/components/layout/mobile-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Trophy, User, BookOpen, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Book', href: '/book', icon: Calendar },
    { label: 'Bookings', href: '/bookings', icon: BookOpen, requireAuth: true },
    { label: 'Tournaments', href: '/tournaments', icon: Trophy },
    { label: 'Profile', href: '/profile', icon: User, requireAuth: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#111A16]/95 backdrop-blur-lg border-t border-[#1E3A2B] px-4 flex items-center justify-around md:hidden">
      {navItems.map((item) => {
        if (item.requireAuth && !user) return null;
        
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-[#6B8F7E] hover:text-[#A7C4B8]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}

      {/* Show Login button when not authenticated */}
      {!user && (
        <Link
          href="/login"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
            pathname === '/login' ? 'text-primary' : 'text-[#6B8F7E] hover:text-[#A7C4B8]'
          }`}
        >
          <LogIn className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Login</span>
        </Link>
      )}
    </nav>
  );
}
