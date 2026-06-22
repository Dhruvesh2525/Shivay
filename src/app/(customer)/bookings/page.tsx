// src/app/(customer)/bookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Calendar, ChevronRight, FileText, ArrowLeft } from 'lucide-react';

interface Booking {
  id: string;
  booking_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  final_price: number;
  status: string;
  courts: {
    name: string;
    sport: string;
  };
}

export default function BookingsListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyBookings() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_id,
            booking_date,
            start_time,
            end_time,
            final_price,
            status,
            courts (
              name,
              sport
            )
          `)
          .eq('user_id', user.id)
          .order('booking_date', { ascending: false });
        
        if (data) setBookings(data as any[]);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyBookings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-3 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-black text-primary uppercase">My Bookings</h1>
          <p className="text-[#A7C4B8] text-xs">Track your scheduled slots and download receipts.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-white/5 rounded-xl border border-white/10 text-muted-foreground text-xs">
            No bookings registered. Try booking a court to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isConfirmed = booking.status === 'confirmed';
              return (
                <div
                  key={booking.id}
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                  className="p-4 rounded-xl bg-[#111A16] border border-[#1E3A2B] hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {booking.courts?.sport}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{booking.booking_id}</span>
                    </div>

                    <h3 className="font-bold text-sm text-foreground truncate">{booking.courts?.name}</h3>
                    
                    <p className="text-xs text-[#A7C4B8] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {booking.booking_date} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-foreground">₹{booking.final_price}</p>
                      <span className={`text-[9px] font-bold uppercase ${isConfirmed ? 'text-primary' : 'text-red-400'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
