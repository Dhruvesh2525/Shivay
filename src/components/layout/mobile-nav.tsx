// src/components/layout/mobile-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Trophy, User, BookOpen, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function MobileNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const isStaff = profile && ['super_admin', 'manager', 'organizer'].includes(profile.role);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Book', href: '/book', icon: Calendar },
    { label: 'Bookings', href: '/bookings', icon: BookOpen, requireAuth: true },
    { label: 'Tournaments', href: '/tournaments', icon: Trophy },
    { label: 'Profile', href: '/profile', icon: User, requireAuth: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-lg border-t border-border px-2 flex items-center justify-around md:hidden">
      {navItems.map((item) => {
        if (item.requireAuth && !user) return null;

        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}

      {/* Dashboard button for staff */}
      {isStaff && (
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
            pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Dashboard</span>
        </Link>
      )}

      {/* Login button for guests */}
      {!user && (
        <Link
          href="/login"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
            pathname === '/login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LogIn className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Login</span>
        </Link>
      )}
    </nav>
  );
}
