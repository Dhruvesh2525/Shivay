// src/app/(customer)/book/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Trophy, Calendar } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  image_url: string;
}

export default function BookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedSport, setSelectedSport] = useState<'all' | 'cricket' | 'pickleball'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourts() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('courts')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (data) setCourts(data as Court[]);
      } catch (err) {
        console.error('Error fetching courts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourts();
  }, []);

  const filteredCourts = courts.filter(
    (c) => selectedSport === 'all' || c.sport === selectedSport
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-primary uppercase">Select Court</h1>
          <p className="text-[#A7C4B8] text-xs">Choose Cricket Turf or Pickleball Court to view available slots.</p>
        </div>

        {/* Custom Sport Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {(['all', 'cricket', 'pickleball'] as const).map((sportType) => (
            <button
              key={sportType}
              onClick={() => setSelectedSport(sportType)}
              className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                selectedSport === sportType
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-[#111A16] border-[#1E3A2B] text-[#A7C4B8] hover:border-primary/40'
              }`}
            >
              {sportType}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredCourts.length === 0 ? (
          <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
            No courts match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourts.map((court) => (
              <div
                key={court.id}
                onClick={() => router.push(`/book/${court.id}`)}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-[#111A16] border border-[#1E3A2B] hover:border-primary/60 transition-all duration-200"
              >
                <div className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {court.sport}
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-wide group-hover:text-primary transition-colors">
                      {court.name}
                    </h3>
                    <p className="text-xs text-[#A7C4B8] mt-1 leading-relaxed line-clamp-2">
                      {court.description || 'No description available for this court.'}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary group-hover:underline">
                    <Calendar className="w-4 h-4" /> View Time Slots
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
