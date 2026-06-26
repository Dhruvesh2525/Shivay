// src/components/home/home-data.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Megaphone, Info, AlertTriangle, MessageSquare, ExternalLink } from 'lucide-react';
import ThreeDTilt from '@/components/ui/three-d-tilt';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

interface Review {
  id: string;
  comment: string;
  overall_rating: number;
  created_at: string;
  profiles: { full_name: string }[] | { full_name: string } | null;
}

interface Props {
  courts: Court[];
  announcements: Announcement[];
  reviews: Review[];
}

function getNextSlot() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const nextH = m >= 30 ? h + 1 : h;
  const nextM = m >= 30 ? '00' : '30';
  const period = nextH >= 12 ? 'PM' : 'AM';
  const display = nextH > 12 ? nextH - 12 : nextH === 0 ? 12 : nextH;
  return `${display}:${nextM} ${period}`;
}

function getProfileName(profiles: Review['profiles']): string {
  if (!profiles) return 'Anonymous Player';
  if (Array.isArray(profiles)) return profiles[0]?.full_name || 'Anonymous Player';
  return profiles.full_name || 'Anonymous Player';
}

export default function HomeData({ courts, announcements, reviews }: Props) {
  const router = useRouter();
  const [nextSlot, setNextSlot] = useState<string>('');

  useEffect(() => {
    setNextSlot(getNextSlot());
  }, []);
  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || '#';

  return (
    <>
      {/* Available Courts */}
      <section className="w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-primary w-5 h-5 animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-wider font-display text-primary">Available Now</h2>
        </div>

        {courts.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl text-muted-foreground text-xs font-mono-custom">
            No courts are active right now. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => {
              const bgImg = court.sport === 'cricket' 
                ? '/images/courts/cricket_turf.jpg' 
                : '/images/courts/pickleball_alpha.jpg';

              return (
                <ThreeDTilt
                  key={court.id}
                  className="min-h-[260px] cursor-pointer"
                >
                  <div
                    className="w-full h-full p-6 flex flex-col justify-between"
                    onClick={() => router.push(`/book/${court.id}`)}
                  >
                    {/* Card Background Image with Gradient Overlay */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      <img 
                        src={bgImg} 
                        alt={court.name} 
                        className="w-full h-full object-cover opacity-30 transition-all duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-[#051424]/50 to-transparent" />
                    </div>

                    <div className="relative z-10 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono-custom">
                            {court.sport}
                          </span>
                          <span className="text-[9px] text-[#8e9379] font-black tracking-widest font-mono-custom">NEXT SLOT</span>
                        </div>
                        <h3 className="font-display font-black text-base text-foreground transition-colors truncate">{court.name}</h3>
                        <p className="text-xs text-primary font-mono-custom font-bold mt-1 bg-primary/5 border border-primary/15 inline-block px-2.5 py-1 rounded-md">{nextSlot}</p>
                      </div>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/book/${court.id}`); }}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-black font-mono-custom hover:shadow-[0_0_12px_rgba(171, 214, 0, 0.4)] transition-all duration-300 text-[10px] uppercase tracking-wider active:scale-95"
                      >
                        Book Court <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </ThreeDTilt>
              );
            })}
          </div>
        )}
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="flex items-center gap-2 mb-6">
            <Megaphone className="text-primary w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-wider font-display text-primary">Announcements</h2>
          </div>
          <div className="space-y-4">
            {announcements.map((ann) => {
              const isUrgent = ann.priority === 'urgent' || ann.priority === 'high';
              return (
                <div
                  key={ann.id}
                  className={`p-5 rounded-2xl border flex gap-4 items-start transition-all duration-300 ${
                    isUrgent 
                      ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/35' 
                      : 'glass-card hover:border-primary/30'
                  }`}
                >
                  {isUrgent ? (
                    <AlertTriangle className="text-red-400 w-5 h-5 shrink-0" />
                  ) : (
                    <Info className="text-primary w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-display font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-foreground'}`}>{ann.title}</h3>
                    <p className="text-xs text-[#8e9379] mt-1 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-muted-foreground font-mono-custom block mt-2 uppercase tracking-wider">
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop mt-12 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-wider font-display text-primary">Player Reviews</h2>
          </div>
          {googleReviewUrl !== '#' && (
            <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono-custom text-[10px] uppercase tracking-wider text-primary font-bold hover:underline transition-all">
              Google Reviews <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl text-muted-foreground text-xs font-mono-custom">
            No reviews yet. Be the first to submit feedback after your booking!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-2xl glass-card flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-base leading-none select-none ${
                        i < Math.round(rev.overall_rating) ? 'text-yellow-400' : 'text-[#273647]'
                      }`}>★</span>
                    ))}
                    <span className="text-[10px] text-muted-foreground font-mono-custom ml-1.5">{Number(rev.overall_rating).toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#8e9379] italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-black text-foreground truncate">{getProfileName(rev.profiles)}</span>
                  <span className="text-[9px] text-muted-foreground font-mono-custom uppercase tracking-wider">
                    {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
