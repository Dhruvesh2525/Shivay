// src/app/(customer)/book/[courtId]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Calendar, Zap, CreditCard, ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Props {
  params: Promise<{ courtId: string }>;
}

export default function BookCourtPage({ params }: Props) {
  const router = useRouter();
  const { courtId } = use(params);
  const supabase = createClient();

  const [court, setCourt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date selection states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [datesList, setDatesList] = useState<{ dateStr: string; dayLabel: string; dateNum: string }[]>([]);

  // Time slot grid states
  const [slots, setSlots] = useState<{ time: string; display: string; isBooked: boolean; isLocked: boolean; price: number }[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Holiday states
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState('');

  // Pricing calculator summaries
  const [checkoutPrice, setCheckoutPrice] = useState({ basePrice: 0, discountPercent: 0, discountAmount: 0, finalPrice: 0 });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Local copy of fetched pricing rules and discounts for immediate price calculation
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [durationDiscounts, setDurationDiscounts] = useState<any[]>([]);

  // Waitlist States
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    // Generate dates lists for the next 14 days
    const list = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = weekdays[d.getDay()];
      const dateNum = String(d.getDate());
      list.push({ dateStr, dayLabel, dateNum });
    }
    setDatesList(list);
    setSelectedDate(list[0].dateStr);
  }, []);

  const fetchCourtAndSlots = async () => {
    if (!courtId || !selectedDate) return;
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/book/details?courtId=${courtId}&date=${selectedDate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch slots details from server.');
      }
      
      const data = await res.json();
      const { court: courtDetail, opHours, bookingsData, locksData, pricing, discounts, isHoliday: serverIsHoliday, holidayReason: serverHolidayReason } = data;

      if (!courtDetail) return;
      setCourt(courtDetail);
      setIsHoliday(serverIsHoliday || false);
      setHolidayReason(serverHolidayReason || '');

      if (serverIsHoliday) {
        setSlots([]);
        setSelectedSlots([]);
        return;
      }

      const startHour = opHours?.value ? Number((opHours.value as any).opens_at.split(':')[0]) : 6;
      const endHour = opHours?.value ? Number((opHours.value as any).closes_at.split(':')[0]) : 23;

      const bookedSet = new Set(bookingsData?.map((b: any) => b.slot_time) || []);
      const lockedSet = new Set(locksData?.map((l: any) => l.slot_time) || []);

      setPricingRules(pricing || []);
      setDurationDiscounts(discounts || []);

      const generatedSlots = [];
      for (let h = startHour; h < endHour; h++) {
        const timeBlocks = ['00', '30'];
        for (const m of timeBlocks) {
          const slotTime = `${String(h).padStart(2, '0')}:${m}:00`;
          const rule = pricing?.find((r: any) => slotTime >= r.start_time && slotTime < r.end_time);
          let price = rule ? Number(rule.price_per_30min) : 300;

          generatedSlots.push({
            time: slotTime,
            display: `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`,
            isBooked: bookedSet.has(slotTime),
            isLocked: lockedSet.has(slotTime),
            price
          });
        }
      }

      setSlots(generatedSlots);
      setSelectedSlots([]);
      setCheckoutPrice({ basePrice: 0, discountPercent: 0, discountAmount: 0, finalPrice: 0 });
    } catch (err) {
      console.error('Error fetching slots details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourtAndSlots();
  }, [courtId, selectedDate]);

  // Recalculate price INSTANTLY client-side when slots selection changes
  useEffect(() => {
    if (selectedSlots.length === 0) {
      setCheckoutPrice({ basePrice: 0, discountPercent: 0, discountAmount: 0, finalPrice: 0 });
      return;
    }

    let basePrice = 0;
    selectedSlots.forEach((slotTime) => {
      const rule = pricingRules.find((r) => slotTime >= r.start_time && slotTime < r.end_time);
      basePrice += rule ? Number(rule.price_per_30min) : 300;
    });

    const totalSlots = selectedSlots.length;
    let discountPercent = 0;
    let discountAmount = 0;
    let finalPrice = basePrice;

    if (court?.sport === 'pickleball' && totalSlots === 1) {
      // Overridden price block for single 30 mins pickleball slots
      basePrice = 400;
      finalPrice = 400;
    } else {
      // Find the highest qualifying discount rules
      const sortedDiscounts = [...durationDiscounts]
        .filter((d) => d.min_slots <= totalSlots)
        .sort((a, b) => b.min_slots - a.min_slots);

      if (sortedDiscounts.length > 0) {
        discountPercent = Number(sortedDiscounts[0].discount_percentage);
      }

      discountAmount = (basePrice * discountPercent) / 100;
      finalPrice = basePrice - discountAmount;
    }

    setCheckoutPrice({ basePrice, discountPercent, discountAmount, finalPrice });
  }, [selectedSlots, pricingRules, durationDiscounts, court]);

  const handleToggleSlot = (time: string) => {
    setValidationError(null);
    setSelectedSlots((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time);
      }
      
      const newSelection = [...prev, time].sort();
      
      // CRITICAL BUG FIX (Non-consecutive selection validator):
      // Verify that all selected slots are strictly consecutive
      if (newSelection.length > 1) {
        const sortedMinutes = newSelection.map((slot) => {
          const [h, m] = slot.split(':').map(Number);
          return h * 60 + m;
        });

        for (let i = 0; i < sortedMinutes.length - 1; i++) {
          const diff = sortedMinutes[i + 1] - sortedMinutes[i];
          if (diff > 30) {
            setValidationError('Slots selection must be contiguous / consecutive (no gaps allowed).');
            return prev;
          }
        }
      }

      return newSelection;
    });
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistSlot || !courtId) return;
    setWaitlistLoading(true);
    setWaitlistError(null);
    setWaitlistSuccess(false);

    try {
      const [h, m] = waitlistSlot.split(':').map(Number);
      const endMinutes = h * 60 + m + 30;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId,
          date: selectedDate,
          startTime: waitlistSlot,
          endTime: endTime
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to join waitlist.');
      }

      setWaitlistSuccess(true);
      setTimeout(() => {
        setShowWaitlistModal(false);
        setWaitlistSuccess(false);
        setWaitlistSlot(null);
      }, 1500);
    } catch (err: any) {
      setWaitlistError(err.message || 'Failed to join waitlist.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    try {
      setCheckoutLoading(true);
      setError(null);
      setValidationError(null);

      // Verify slot requirements:
      // Cricket = Min 1 hour (2 slots), Pickleball = Min 30 mins (1 slot), Max booking = 4 hours (8 slots)
      const slotCount = selectedSlots.length;
      if (court?.sport === 'cricket' && slotCount < 2) {
        setValidationError('Minimum booking duration for Cricket is 1 hour (2 slots).');
        setCheckoutLoading(false);
        return;
      }
      if (court?.sport === 'pickleball' && slotCount < 1) {
        setValidationError('Minimum booking duration for Pickleball is 30 minutes (1 slot).');
        setCheckoutLoading(false);
        return;
      }
      if (slotCount > 8) {
        setValidationError('Maximum booking duration allowed is 4 hours (8 slots).');
        setCheckoutLoading(false);
        return;
      }

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId,
          bookingDate: selectedDate,
          slots: selectedSlots
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place booking.');
      }

      const { order } = await res.json();

      // Trigger Razorpay payment gateway checkout popup overlay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const rzpOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Shivay Sports Club',
          description: `Booking for ${court.name}`,
          order_id: order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  courtId,
                  date: selectedDate,
                  slots: selectedSlots,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                })
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                // Use the booking id returned by the server (created during verify)
                router.replace(`/bookings/${verifyData.id}`);
              } else {
                const verifyErr = await verifyRes.json();
                setError(verifyErr.error || 'Payment verification failed.');
              }
            } catch (vErr) {
              console.error('Verification error:', vErr);
              setError('Payment verification failed.');
            }
          },
          prefill: {
            name: 'Customer Details'
          },
          theme: { color: '#34D399' }
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      };

      document.body.appendChild(script);
    } catch (err: any) {
      setError(err.message || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Group slots by Morning, Noon, Night
  const morningSlots = slots.filter((s) => {
    const h = Number(s.time.split(':')[0]);
    return h >= 6 && h < 12;
  });

  const noonSlots = slots.filter((s) => {
    const h = Number(s.time.split(':')[0]);
    return h >= 12 && h < 18;
  });

  const nightSlots = slots.filter((s) => {
    const h = Number(s.time.split(':')[0]);
    return h >= 18 || h < 6;
  });

  const renderSlotButton = (s: any) => {
    const isSelected = selectedSlots.includes(s.time);
    const isUnavailable = s.isBooked || s.isLocked;

    return (
      <button
        key={s.time}
        onClick={() => {
          if (isUnavailable) {
            setWaitlistSlot(s.time);
            setWaitlistSuccess(false);
            setWaitlistError(null);
            setShowWaitlistModal(true);
          } else {
            handleToggleSlot(s.time);
          }
        }}
        className={`p-3 rounded-xl border text-center flex flex-col justify-center items-center transition-all ${
          s.isBooked
            ? 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-primary/20 cursor-pointer'
            : s.isLocked
            ? 'bg-red-500/5 border-red-500/15 text-red-400 hover:bg-red-500/10 cursor-pointer'
            : isSelected
            ? 'bg-primary/20 border-primary text-primary font-bold'
            : 'bg-card border-border text-foreground hover:border-primary/40'
        }`}
      >
        <span className="text-xs font-bold font-mono">{s.display}</span>
        <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
          {s.isBooked ? 'Booked (Waitlist)' : s.isLocked ? 'Locked (Waitlist)' : `₹${s.price}`}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-32">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {court && (
          <div className="mb-6">
            <button 
              onClick={() => router.push('/book')}
              className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-3 uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {court.sport}
              </span>
              <h1 className="text-2xl font-black text-foreground mt-1 uppercase">{court.name}</h1>
              <p className="text-xs text-muted-foreground">{court.description}</p>
            </div>
          </div>
        )}

        {/* Calendar Horizontal Selector */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none snap-x">
          {datesList.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`snap-center flex flex-col items-center justify-center min-w-[56px] py-3 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayLabel}</span>
                <span className="text-lg font-black mt-0.5">{d.dateNum}</span>
              </button>
            );
          })}
        </div>

        {/* Slot Selection Grid */}
        <div className="mt-4">
          {isHoliday ? (
            <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-base font-bold text-foreground uppercase">Facility Closed Today</h3>
              <p className="text-xs text-muted-foreground">{holidayReason || 'Facility is closed for holiday / maintenance.'}</p>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select Slots</h2>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select Slots</h2>

              {/* Morning slots */}
              {morningSlots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Morning (6 AM - 12 PM)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {morningSlots.map((s) => renderSlotButton(s))}
                  </div>
                </div>
              )}

              {/* Noon slots */}
              {noonSlots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Noon (12 PM - 6 PM)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {noonSlots.map((s) => renderSlotButton(s))}
                  </div>
                </div>
              )}

              {/* Night slots */}
              {nightSlots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-1">Night (6 PM onwards)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nightSlots.map((s) => renderSlotButton(s))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom checkout bar */}
      {!isHoliday && selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border p-4 flex flex-col gap-3 backdrop-blur-xl md:max-w-4xl md:mx-auto md:rounded-t-2xl">
          {validationError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {selectedSlots.length} Slots Selected
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-primary font-mono">₹{checkoutPrice.finalPrice}</span>
                {checkoutPrice.discountPercent > 0 && (
                  <span className="text-xs text-red-400 font-bold font-mono line-through">
                    ₹{checkoutPrice.basePrice}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCreateBooking}
              disabled={checkoutLoading}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wider uppercase text-xs flex items-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              {checkoutLoading ? 'Processing...' : 'Pay & Confirm'}
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Secure Razorpay Checkout • Instant Slot Lock</span>
          </div>
        </div>
      )}

      {/* Waitlist Join Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
              <Calendar className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase">Join Slot Waitlist</h3>
            </div>

            {waitlistError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{waitlistError}</span>
              </div>
            )}

            {waitlistSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-xs font-bold">
                Success! You are now on the waitlist for this slot. We will notify you if it gets freed.
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[#b9cbb9] leading-relaxed">
                <p>
                  You are joining the waitlist for the following slot:
                </p>
                <div className="bg-input p-3 rounded-lg border border-border/40 font-mono space-y-1">
                  <div className="flex justify-between"><span>Court:</span><span className="text-foreground font-bold">{court?.name}</span></div>
                  <div className="flex justify-between"><span>Date:</span><span className="text-foreground font-bold">{selectedDate}</span></div>
                  <div className="flex justify-between"><span>Slot:</span><span className="text-primary font-bold">{waitlistSlot}</span></div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#b9cbb9]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleJoinWaitlist}
                    disabled={waitlistLoading}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-black tracking-wide uppercase disabled:opacity-50"
                  >
                    {waitlistLoading ? 'Joining...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileNav />
      <Footer />
    </div>
  );
}
