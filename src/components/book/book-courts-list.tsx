// src/components/book/book-courts-list.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import ThreeDTilt from '@/components/ui/three-d-tilt';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  image_url: string;
}

export default function BookCourtsList({ courts }: { courts: Court[] }) {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<'all' | 'cricket' | 'pickleball'>('all');

  const filtered = courts.filter(c => selectedSport === 'all' || c.sport === selectedSport);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-3 uppercase tracking-wider"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-primary uppercase">Select Court</h1>
        <p className="text-muted-foreground text-xs">Choose Cricket Turf or Pickleball Court to view available slots.</p>
      </div>

      {/* Sport Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'cricket', 'pickleball'] as const).map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedSport === sport
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
          No courts match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((court) => (
            <ThreeDTilt
              key={court.id}
              className="cursor-pointer"
            >
              <div
                onClick={() => router.push(`/book/${court.id}`)}
                className="w-full h-full p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {court.sport}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-wide text-foreground hover:text-primary transition-colors">{court.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {court.description || 'Premium sports court. Click to view available slots.'}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary">
                  <Calendar className="w-4 h-4" /> View Time Slots
                </div>
              </div>
            </ThreeDTilt>
          ))}
        </div>
      )}
    </main>
  );
}
