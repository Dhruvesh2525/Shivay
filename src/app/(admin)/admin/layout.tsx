// src/app/(admin)/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, Calendar, Settings, ShieldAlert, Award, FileText } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();

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

  const allLinks = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'manager', 'organizer'] },
    { label: 'Courts & Settings', href: '/admin/courts', icon: Settings, roles: ['super_admin'] },
    { label: 'Bookings List', href: '/admin/bookings', icon: Calendar, roles: ['super_admin', 'manager'] },
    { label: 'Tournaments', href: '/admin/tournaments', icon: Award, roles: ['super_admin', 'organizer'] },
    { label: 'Refund Claims', href: '/admin/refunds', icon: ShieldAlert, roles: ['super_admin'] },
  ];

  const sidebarLinks = allLinks.filter(link => profile && link.roles.includes(profile.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0F0D]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111A16] border-r border-[#1E3A2B] p-6 text-sm shrink-0">
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
                    : 'text-[#A7C4B8] hover:bg-white/5 hover:text-primary'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-[#1E3A2B] text-xs text-muted-foreground">
          Logged in as: <span className="font-bold text-foreground">{profile?.full_name || 'Admin'}</span>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden w-full bg-[#111A16] border-b border-[#1E3A2B] px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-black text-primary tracking-wide">SHIVAY ADMIN</span>
          <Link href="/" className="text-xs text-muted-foreground border border-white/10 px-2.5 py-1 rounded-lg">
            Exit
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
