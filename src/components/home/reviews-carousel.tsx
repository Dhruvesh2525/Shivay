// src/components/home/reviews-carousel.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, MessageSquare, ExternalLink } from 'lucide-react';

interface Review {
  id: string;
  comment: string;
  overall_rating: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function ReviewsCarousel() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('reviews')
          .select(`
            id,
            comment,
            overall_rating,
            created_at,
            profiles (
              full_name
            )
          `)
          .eq('is_visible', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (data) {
          setReviews(data as any[]);
        }
      } catch (err) {
        console.error('Error fetching review items:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_PLACE_ID/review';

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Player Reviews</h2>
        </div>
        
        <a 
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
        >
          Google Reviews <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {loading ? (
        <div className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
      ) : reviews.length === 0 ? (
        <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10 text-muted-foreground text-xs">
          No reviews published yet. Be the first to submit feedback after your booking!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(rev.overall_rating) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-[#1E3A2B]'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground font-mono ml-1">
                    {Number(rev.overall_rating).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-[#A7C4B8] italic leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">
                  {rev.profiles?.full_name || 'Anonymous Player'}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
