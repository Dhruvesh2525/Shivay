// src/app/(admin)/admin/bookings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, User, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

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
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function AdminBookings() {
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllBookings() {
      try {
        setLoading(true);
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
            ),
            profiles (
              full_name,
              phone
            )
          `)
          .order('booking_date', { ascending: false });

        if (data) setBookings(data as any[]);
      } catch (err) {
        console.error('Failed to query bookings list:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllBookings();
  }, []);

  const isManager = profile?.role === 'manager';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">All Bookings</h1>
        <p className="text-[#A7C4B8] text-sm mt-1">Review scheduled matches, turf reservations, and customer contact details.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#A7C4B8]">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
          No bookings placed yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div 
              key={b.id} 
              className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {b.courts?.sport}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{b.booking_id}</span>
                </div>
                <h3 className="font-bold text-base text-foreground">
                  {b.courts?.name}
                </h3>
                <p className="text-xs text-[#A7C4B8] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {b.booking_date} • {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <User className="w-3.5 h-3.5" />
                  Player: {b.profiles?.full_name} ({b.profiles?.phone})
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Price Total</span>
                {isManager ? (
                  <p className="text-sm font-bold text-muted-foreground flex items-center gap-1 mt-0.5 justify-end">
                    <EyeOff className="w-3.5 h-3.5" /> [Hidden]
                  </p>
                ) : (
                  <p className="text-lg font-black text-primary font-mono mt-0.5">₹{b.final_price}</p>
                )}
                <span className="text-[9px] font-bold uppercase block mt-1 text-primary">
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
