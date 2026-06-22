// src/components/home/home-data.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Megaphone, AlertTriangle, AlertCircle, MessageSquare, ExternalLink, Star } from 'lucide-react';

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
  const nextSlot = getNextSlot();
  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || '#';

  return (
    <>
      {/* Available Courts */}
      <section className="w-full max-w-4xl mx-auto px-4 mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-primary fill-primary" />
          <h2 className="text-xl font-bold tracking-tight">Available Now</h2>
        </div>

        {courts.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10 text-muted-foreground text-xs">
            No courts are active right now. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                onClick={() => router.push(`/book/${court.id}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {court.sport}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">NEXT SLOT</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground truncate">{court.name}</h3>
                  <p className="text-xs text-primary font-mono font-bold mt-1">{nextSlot}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/book/${court.id}`); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs"
                >
                  Book Court <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="w-full max-w-4xl mx-auto px-4 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements.map((ann) => {
              const isUrgent = ann.priority === 'urgent' || ann.priority === 'high';
              return (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border flex gap-3 items-start ${isUrgent ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}
                >
                  {isUrgent
                    ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                  <div>
                    <h3 className={`font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-foreground'}`}>{ann.title}</h3>
                    <p className="text-xs text-[#A7C4B8] mt-1 leading-relaxed">{ann.content}</p>
                    <span className="text-[10px] text-muted-foreground font-mono block mt-2">
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="w-full max-w-4xl mx-auto px-4 mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Player Reviews</h2>
          </div>
          {googleReviewUrl !== '#' && (
            <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
              Google Reviews <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10 text-muted-foreground text-xs">
            No reviews yet. Be the first to submit feedback after your booking!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rev.overall_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#1E3A2B]'}`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">{Number(rev.overall_rating).toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#A7C4B8] italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground truncate">{getProfileName(rev.profiles)}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">
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
