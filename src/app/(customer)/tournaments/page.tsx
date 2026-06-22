// src/app/(customer)/tournaments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Trophy, Calendar } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  start_date: string;
  registration_deadline: string;
  entry_fee: number;
  status: string;
}

export default function TournamentsListPage() {
  const router = useRouter();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true);
        // Use the API route which uses admin client (bypasses RLS)
        const res = await fetch('/api/tournaments');
        if (!res.ok) throw new Error('Failed to fetch tournaments');
        const json = await res.json();
        setTournaments(json.tournaments || []);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-primary uppercase">Tournaments</h1>
            <p className="text-[#A7C4B8] text-xs">Join local leagues, team brackets, and player matches at Shivay.</p>
          </div>
          <button 
            onClick={() => router.push('/organizer')}
            className="px-3.5 py-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary font-bold text-xs"
          >
            Organizer Dashboard
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
            No upcoming tournaments scheduled yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tourney) => (
              <div
                key={tourney.id}
                onClick={() => router.push(`/tournaments/${tourney.id}`)}
                className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {tourney.sport}
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {tourney.entry_fee > 0 ? `₹${tourney.entry_fee} Entry` : 'Free Entry'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black tracking-wide text-foreground truncate">{tourney.name}</h3>
                  <p className="text-xs text-[#A7C4B8] mt-1 line-clamp-2 leading-relaxed">{tourney.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" /> Starts {tourney.start_date}
                  </span>
                  <span className="text-red-400 font-bold uppercase text-[10px]">
                    Deadline: {tourney.registration_deadline}
                  </span>
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
