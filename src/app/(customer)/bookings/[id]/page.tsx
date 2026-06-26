// src/app/(customer)/bookings/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { ShieldCheck, Download, Calendar, ArrowLeft, FileText, BadgeInfo, ShieldAlert } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClient();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review states
  const [existingReview, setExistingReview] = useState<any>(null);
  const [turfQuality, setTurfQuality] = useState(5);
  const [lighting, setLighting] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [staff, setStaff] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refund request states — declared BEFORE any early returns to respect the
  // Rules of Hooks (hooks must run in the same order on every render).
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBookingDetail() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('bookings')
          .select(`
            *,
            courts (
              name,
              sport,
              description
            )
          `)
          .eq('id', id)
          .single();
        
        setBooking(data);

        // Fetch existing review if booking exists
        if (data) {
          const { data: rev } = await supabase
            .from('reviews')
            .select('*')
            .eq('booking_id', id)
            .maybeSingle();
          setExistingReview(rev);
        }
      } catch (err) {
        console.error('Error fetching booking detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookingDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex justify-center items-center text-primary">Loading details...</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 p-8 text-center text-muted-foreground">Booking not found.</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed';

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRefundSubmitting(true);
      setError(null);
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, reason: refundReason })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit refund request.');
      }

      setShowRefundModal(false);
      setRefundReason('');
      
      // Reload booking detail
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (
            name,
            sport,
            description
          )
        `)
        .eq('id', id)
        .single();
      
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Refund submission failed.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          turfQuality,
          lighting,
          cleanliness,
          staff,
          comment
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit review.');
      }

      setReviewSuccess(true);
      
      // Reload review detail
      const { data: rev } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', id)
        .maybeSingle();
      setExistingReview(rev);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 pb-24 text-sm">
        {/* Back Link */}
        <button 
          onClick={() => router.push('/bookings')} 
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </button>

        {/* Success Status Banner */}
        {isConfirmed && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <div className="inline-flex p-2 rounded-full bg-emerald-500/20 text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide">Booking Confirmed!</h2>
            <p className="text-xs text-emerald-400">Your playing slots are locked and confirmed. Have a great game!</p>
          </div>
        )}

        {/* Core Receipt Card */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="border-b border-border pb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">REFERENCE ID</span>
              <p className="text-sm font-black font-mono mt-0.5 text-primary">{booking.booking_id}</p>
            </div>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isConfirmed ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {booking.status}
            </span>
          </div>

          {/* Slots breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Venue details</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-input text-primary mt-0.5">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">{booking.courts?.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{booking.booking_date}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)} ({booking.total_slots * 30} mins)</p>
              </div>
            </div>
          </div>

          {/* Pricing detail */}
          <div className="border-t border-border pt-4 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Base Amount</span>
              <span className="font-mono text-foreground">₹{booking.base_price}</span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-xs text-primary">
                <span>Duration Discount</span>
                <span className="font-mono">- ₹{booking.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-muted-foreground">Total Amount Paid</span>
              <span className="text-lg font-black text-primary font-mono">₹{booking.final_price}</span>
            </div>
          </div>

          {/* Receipt actions */}
          <div className="space-y-2 pt-2">
            {isConfirmed && (
              <a
                href={`/api/bookings/receipt/${booking.id}`}
                download
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wider hover:bg-[#6EE7B7] transition-all transform active:scale-95 text-xs text-center"
              >
                <Download className="w-4 h-4" /> Download PDF Receipt
              </a>
            )}

            {isConfirmed && (
              <button
                onClick={() => { setError(null); setShowRefundModal(true); }}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground font-bold text-xs transition-colors"
              >
                Cancel Booking & Request Refund
              </button>
            )}
          </div>
        </div>

        {/* Review Section */}
        {existingReview ? (
          <div className="mt-6 p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Review</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                <div className="flex justify-between items-center bg-input p-2.5 rounded-lg border border-border/40 font-bold">
                  <span>Turf Quality:</span>
                  <span className="text-yellow-400 font-mono">{existingReview.turf_quality} ★</span>
                </div>
                <div className="flex justify-between items-center bg-input p-2.5 rounded-lg border border-border/40 font-bold">
                  <span>Lighting:</span>
                  <span className="text-yellow-400 font-mono">{existingReview.lighting} ★</span>
                </div>
                <div className="flex justify-between items-center bg-input p-2.5 rounded-lg border border-border/40 font-bold">
                  <span>Cleanliness:</span>
                  <span className="text-yellow-400 font-mono">{existingReview.cleanliness} ★</span>
                </div>
                <div className="flex justify-between items-center bg-input p-2.5 rounded-lg border border-border/40 font-bold">
                  <span>Staff:</span>
                  <span className="text-yellow-400 font-mono">{existingReview.staff} ★</span>
                </div>
              </div>
              {existingReview.comment && (
                <div className="p-3 bg-input/60 border border-border/35 rounded-lg text-foreground italic leading-relaxed">
                  &ldquo;{existingReview.comment}&rdquo;
                </div>
              )}
            </div>
          </div>
        ) : (
          (booking.status === 'confirmed' || booking.status === 'completed') && (
            <div className="mt-6 p-6 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Submit a Review</h3>
              {reviewSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-xs font-bold">
                  Thank you! Your review has been submitted.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {reviewError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { label: 'Turf Quality', value: turfQuality, setter: setTurfQuality },
                      { label: 'Lighting', value: lighting, setter: setLighting },
                      { label: 'Cleanliness', value: cleanliness, setter: setCleanliness },
                      { label: 'Staff & Service', value: staff, setter: setStaff },
                    ].map((ratingField) => (
                      <div key={ratingField.label} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold">{ratingField.label}</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => ratingField.setter(star)}
                              className={`text-lg leading-none transition-colors ${
                                star <= ratingField.value ? 'text-yellow-400' : 'text-neutral-700'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase">Your Comment</label>
                    <textarea
                      placeholder="Share your experience playing at our arena..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wider hover:bg-[#6EE7B7] transition-all transform active:scale-95 text-xs text-center"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )
        )}

        {/* Refund Submission Form Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BadgeInfo className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase">Cancel Booking</h3>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed bg-input p-3 rounded-lg border border-border">
                <p className="font-bold">Cancellation Refund Policy:</p>
                <p>• &gt; 12 hours: 100% Refund</p>
                <p>• 6 to 12 hours: 70% Refund</p>
                <p>• 3 to 6 hours: 50% Refund</p>
                <p>• &lt; 3 hours: No Refund (0%)</p>
              </div>

              <form onSubmit={handleRefundSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Reason for Cancellation</label>
                  <textarea
                    required
                    placeholder="Enter reason here..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={refundSubmitting}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold"
                  >
                    {refundSubmitting ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
