// src/components/home/quick-book.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Zap, ArrowRight } from 'lucide-react';

interface AvailableCourt {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  nextAvailableSlot: string;
}

export default function QuickBook() {
  const router = useRouter();
  const supabase = createClient();
  
  const [courts, setCourts] = useState<AvailableCourt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        setLoading(true);
        // Query active courts
        const { data: activeCourts } = await supabase
          .from('courts')
          .select('id, name, sport')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (activeCourts) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          // Formulate default mock next slot string based on current time
          const nextSlotHour = currentMinute >= 30 ? currentHour + 1 : currentHour;
          const nextSlotMins = currentMinute >= 30 ? '00' : '30';
          const period = nextSlotHour >= 12 ? 'PM' : 'AM';
          const displayHour = nextSlotHour > 12 ? nextSlotHour - 12 : nextSlotHour === 0 ? 12 : nextSlotHour;

          const formattedSlot = `${displayHour}:${nextSlotMins} ${period}`;

          const list = activeCourts.map((court) => ({
            id: court.id,
            name: court.name,
            sport: court.sport as 'cricket' | 'pickleball',
            nextAvailableSlot: formattedSlot
          }));
          
          setCourts(list);
        }
      } catch (err) {
        console.error('Error fetching quick book availability:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, []);

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary fill-primary" />
        <h2 className="text-xl font-bold tracking-tight">Available Now</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : courts.length === 0 ? (
        <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10 text-muted-foreground text-xs">
          No courts are active right now. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div 
              key={court.id} 
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {court.sport}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">NEXT SLOT</span>
                </div>
                <h3 className="font-bold text-sm text-foreground truncate">{court.name}</h3>
                <p className="text-xs text-primary font-mono font-bold mt-1">
                  {court.nextAvailableSlot}
                </p>
              </div>

              <button
                onClick={() => router.push(`/book/${court.id}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-xs"
              >
                Book Court <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
