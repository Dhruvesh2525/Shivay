// src/components/home/quick-book.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary fill-primary animate-pulse" />
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
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {courts.map((court) => (
            <motion.div 
              key={court.id} 
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                boxShadow: "0 10px 30px -10px rgba(52,211,153,0.15)"
              }}
              className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
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
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs"
              >
                Book Court <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
