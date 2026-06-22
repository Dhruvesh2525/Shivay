// src/app/(customer)/book/[courtId]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Calendar, Zap, CreditCard, ShieldCheck } from 'lucide-react';

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

  // Pricing calculator summaries
  const [checkoutPrice, setCheckoutPrice] = useState({ basePrice: 0, discountPercent: 0, discountAmount: 0, finalPrice: 0 });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
      // Fetch Court details
      const { data: courtDetail } = await supabase
        .from('courts')
        .select('*')
        .eq('id', courtId)
        .single();
      
      setCourt(courtDetail);

      // Fetch operating hours
      const { data: opHours } = await supabase
        .from('facility_settings')
        .select('value')
        .eq('key', 'operating_hours')
        .single();
      
      const startHour = opHours?.value ? Number(opHours.value.opens_at.split(':')[0]) : 6;
      const endHour = opHours?.value ? Number(opHours.value.closes_at.split(':')[0]) : 23;

      // Fetch bookings for this day
      const { data: bookingsData } = await supabase
        .from('booking_slots')
        .select('slot_time')
        .eq('court_id', courtId)
        .eq('slot_date', selectedDate);
      
      const bookedSet = new Set(bookingsData?.map(b => b.slot_time) || []);

      // Fetch locks for this day
      const { data: locksData } = await supabase
        .from('slot_locks')
        .select('slot_time')
        .eq('court_id', courtId)
        .eq('slot_date', selectedDate)
        .gt('locked_until', new Date().toISOString());
      
      const lockedSet = new Set(locksData?.map(l => l.slot_time) || []);

      // Generate 30-min slots based on sport price rules
      const resolvedDayType = new Date(selectedDate).getDay() === 0 || new Date(selectedDate).getDay() === 6 ? 'weekend' : 'weekday';
      const { data: pricingRules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('sport', courtDetail.sport)
        .eq('day_type', resolvedDayType);

      const generatedSlots = [];
      for (let h = startHour; h < endHour; h++) {
        const timeBlocks = ['00', '30'];
        for (const m of timeBlocks) {
          const slotTime = `${String(h).padStart(2, '0')}:${m}:00`;
          const rule = pricingRules?.find(r => slotTime >= r.start_time && slotTime < r.end_time);
          const price = rule ? Number(rule.price_per_30min) : 300;

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
    } catch (err) {
      console.error('Error fetching slots details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourtAndSlots();
  }, [courtId, selectedDate]);

  // Recalculate price in real time when slots selection changes
  useEffect(() => {
    async function calculateTotal() {
      if (selectedSlots.length === 0) {
        setCheckoutPrice({ basePrice: 0, discountPercent: 0, discountAmount: 0, finalPrice: 0 });
        return;
      }
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courtId, date: selectedDate, slots: selectedSlots })
        });
        if (res.ok) {
          const summary = await res.json();
          setCheckoutPrice(summary);
        }
      } catch (err) {
        console.error('Failed to calculate pricing total:', err);
      }
    }
    calculateTotal();
  }, [selectedSlots]);

  const handleToggleSlot = (time: string) => {
    setSelectedSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      // Initialize slot lock + Razorpay order on backend
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId, date: selectedDate, slots: selectedSlots })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to initialize booking.');
      }

      const checkoutData = await res.json();

      // Dynamically load Razorpay SDK
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const rzpOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          name: 'Shivay Sports Arena',
          description: `Booking for ${court.name}`,
          order_id: checkoutData.orderId,
          handler: async function (response: any) {
            // Verify payment on backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                courtId,
                date: selectedDate,
                slots: selectedSlots
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              router.push(`/bookings/${verifyData.id}?status=confirmed`);
            } else {
              alert('Payment verification failed.');
            }
          },
          theme: { color: '#34D399' }
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      };

      document.body.appendChild(script);
    } catch (err: any) {
      alert(err.message || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-32">
        {court && (
          <div className="mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {court.sport}
            </span>
            <h1 className="text-2xl font-black text-foreground mt-1 uppercase">{court.name}</h1>
            <p className="text-xs text-[#A7C4B8]">{court.description}</p>
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
                    : 'bg-[#111A16] border-[#1E3A2B] text-[#A7C4B8]'
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
          <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider mb-4">Select Slots</h2>
          
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((s) => {
                const isSelected = selectedSlots.includes(s.time);
                const disabled = s.isBooked || s.isLocked;

                return (
                  <button
                    key={s.time}
                    disabled={disabled}
                    onClick={() => handleToggleSlot(s.time)}
                    className={`p-3 rounded-xl border text-center flex flex-col justify-center items-center transition-all ${
                      s.isBooked
                        ? 'bg-white/2 border-white/5 text-muted-foreground/40 cursor-not-allowed line-through'
                        : s.isLocked
                        ? 'bg-red-500/5 border-red-500/10 text-red-500/30 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary/20 border-primary text-primary font-bold'
                        : 'bg-[#111A16] border-[#1E3A2B] text-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{s.display}</span>
                    <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-primary' : 'text-[#6B8F7E]'}`}>
                      {s.isBooked ? 'Booked' : s.isLocked ? 'Locked' : `₹${s.price}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom checkout bar */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111A16]/95 border-t border-[#1E3A2B] p-4 flex items-center justify-between backdrop-blur-xl md:max-w-4xl md:mx-auto md:rounded-t-2xl">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              Selected {selectedSlots.length} slot(s) • {selectedSlots.length * 30} mins
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-primary font-mono">₹{checkoutPrice.finalPrice}</span>
              {checkoutPrice.discountAmount > 0 && (
                <span className="text-xs text-[#6B8F7E] line-through font-mono">₹{checkoutPrice.basePrice}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wider flex items-center gap-2 hover:bg-[#6EE7B7] transition-all transform active:scale-95 text-sm"
          >
            <CreditCard className="w-4 h-4" /> {checkoutLoading ? 'Processing...' : 'Pay & Book'}
          </button>
        </div>
      )}

      <Footer />
      <MobileNav />
    </div>
  );
}
