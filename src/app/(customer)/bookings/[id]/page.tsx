// src/app/(customer)/bookings/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { ShieldCheck, Download, Calendar, ArrowLeft, FileText, BadgeInfo } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClient();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
        <Header />
        <main className="flex-1 flex justify-center items-center text-primary">Loading details...</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
        <Header />
        <main className="flex-1 p-8 text-center text-muted-foreground">Booking not found.</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const isConfirmed = booking.status === 'confirmed';

  // Refund request states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRefundSubmitting(true);
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
      alert(err.message || 'Refund submission failed.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 pb-24 text-sm">
        {/* Back Link */}
        <button 
          onClick={() => router.push('/bookings')} 
          className="flex items-center gap-1.5 text-xs text-[#A7C4B8] mb-6 hover:text-primary transition-colors"
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
        <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-6">
          <div className="border-b border-[#1E3A2B] pb-4 flex justify-between items-center">
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
            <h3 className="text-xs font-bold text-[#A7C4B8] uppercase tracking-wider">Venue details</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#1A2620] text-primary mt-0.5">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">{booking.courts?.name}</h4>
                <p className="text-xs text-[#A7C4B8] mt-0.5">{booking.booking_date}</p>
                <p className="text-xs text-[#A7C4B8] mt-0.5 font-mono">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)} ({booking.total_slots * 30} mins)</p>
              </div>
            </div>
          </div>

          {/* Pricing detail */}
          <div className="border-t border-[#1E3A2B] pt-4 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#A7C4B8]">Base Amount</span>
              <span className="font-mono text-foreground">₹{booking.base_price}</span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-xs text-primary">
                <span>Duration Discount</span>
                <span className="font-mono">- ₹{booking.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-[#A7C4B8]">Total Amount Paid</span>
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
                onClick={() => setShowRefundModal(true)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#A7C4B8] font-bold text-xs transition-colors"
              >
                Cancel Booking & Request Refund
              </button>
            )}
          </div>
        </div>

        {/* Refund Submission Form Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BadgeInfo className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase">Cancel Booking</h3>
              </div>
              
              <div className="text-xs text-[#A7C4B8] space-y-1.5 leading-relaxed bg-[#1A2620] p-3 rounded-lg border border-[#1E3A2B]">
                <p className="font-bold">Cancellation Refund Policy:</p>
                <p>• &gt; 12 hours: 100% Refund</p>
                <p>• 6 to 12 hours: 70% Refund</p>
                <p>• 3 to 6 hours: 50% Refund</p>
                <p>• &lt; 3 hours: No Refund (0%)</p>
              </div>

              <form onSubmit={handleRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Reason for Cancellation</label>
                  <textarea
                    required
                    placeholder="Enter reason here..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#A7C4B8]"
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
