// src/app/api/bookings/create/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateBookingPrice } from '@/lib/pricing';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { courtId, date, slots } = await request.json();

    if (!courtId || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // Enforce booking window: today through 3 months in the future (PRD rule).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(`${date}T00:00:00`);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (bookingDate < today) {
      return NextResponse.json({ error: 'Cannot book a date in the past.' }, { status: 400 });
    }
    if (bookingDate > maxDate) {
      return NextResponse.json({ error: 'Bookings can only be made up to 3 months in advance.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify user authorization status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Ensure profile row exists (autocreate if missing, e.g. for manually created Supabase users)
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { error: insertProfileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: user.user_metadata?.phone || '0000000000',
          birth_date: user.user_metadata?.birth_date || '2000-01-01',
          role: 'customer',
          is_active: true
        });

      if (insertProfileError) {
        return NextResponse.json({ error: `User profile could not be initialized: ${insertProfileError.message}` }, { status: 500 });
      }
    }

    // 1. Fetch court details and enforce sport rules
    const { data: court } = await adminSupabase
      .from('courts')
      .select('sport, name')
      .eq('id', courtId)
      .single();

    if (!court) {
      return NextResponse.json({ error: `Court not found (id: ${courtId}).` }, { status: 404 });
    }

    const totalSlots = slots.length;

    // Cricket: Min 1 Hour (2 slots)
    if (court.sport === 'cricket' && totalSlots < 2) {
      return NextResponse.json({ error: 'Cricket bookings require a minimum of 1 hour (2 slots).' }, { status: 400 });
    }
    // Pickleball: Min 30 Mins (1 slot)
    if (court.sport === 'pickleball' && totalSlots < 1) {
      return NextResponse.json({ error: 'Pickleball bookings require a minimum of 30 minutes.' }, { status: 400 });
    }
    // Max: 4 Hours (8 slots)
    if (totalSlots > 8) {
      return NextResponse.json({ error: 'Maximum booking duration is 4 hours (8 slots).' }, { status: 400 });
    }

    // Ensure slots are contiguous
    const isSlotsContiguous = (slotList: string[]) => {
      if (slotList.length <= 1) return true;
      const minutes = slotList.map(s => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
      }).sort((a, b) => a - b);

      for (let i = 0; i < minutes.length - 1; i++) {
        if (minutes[i + 1] - minutes[i] !== 30) {
          return false;
        }
      }
      return true;
    };

    if (!isSlotsContiguous(slots)) {
      return NextResponse.json({ error: 'Selected slots must be contiguous.' }, { status: 400 });
    }

    // 2. Overbooking Protection: Query existing bookings and slot locks
    // Delete expired locks first to free up slots
    const nowStr = new Date().toISOString();
    await adminSupabase
      .from('slot_locks')
      .delete()
      .lt('locked_until', nowStr);

    // Query booked slots
    const { data: booked } = await supabase
      .from('booking_slots')
      .select('slot_time')
      .eq('court_id', courtId)
      .eq('slot_date', date)
      .in('slot_time', slots);

    if (booked && booked.length > 0) {
      return NextResponse.json({ error: 'One or more selected slots are already booked.' }, { status: 409 });
    }

    // Query active locks
    const { data: locked } = await supabase
      .from('slot_locks')
      .select('slot_time')
      .eq('court_id', courtId)
      .eq('slot_date', date)
      .in('slot_time', slots);

    if (locked && locked.length > 0) {
      return NextResponse.json({ error: 'One or more selected slots are currently locked by another user. Try again in 5 minutes.' }, { status: 409 });
    }

    // 3. Server-side Pricing Calculation (shared helper — never trusts client amounts)
    let basePrice: number;
    let discountAmount: number;
    let finalPrice: number;
    let breakdown: any[];
    try {
      const pricing = await calculateBookingPrice(adminSupabase as any, courtId, date, slots);
      basePrice = pricing.basePrice;
      discountAmount = pricing.discountAmount;
      finalPrice = pricing.finalPrice;
      breakdown = pricing.breakdown;
    } catch {
      return NextResponse.json({ error: 'Failed to calculate price.' }, { status: 500 });
    }

    // 4. Lock Selected Slots (5-Minute TTL)
    const lockedUntil = new Date(Date.now() + 5 * 60000).toISOString();
    const lockRows = slots.map((sTime) => ({
      court_id: courtId,
      slot_date: date,
      slot_time: sTime,
      locked_by: user.id,
      locked_until: lockedUntil
    }));

    const { error: lockError } = await adminSupabase
      .from('slot_locks')
      .insert(lockRows);

    if (lockError) {
      return NextResponse.json({ error: `Failed to lock slots: ${lockError.message || JSON.stringify(lockError)}. Someone may have just reserved them.` }, { status: 409 });
    }

    // 5. Initialize Razorpay Order
    // Fail loud if keys are missing rather than silently using placeholder keys.
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error('Razorpay keys are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Create Razorpay Order options
    const options = {
      amount: Math.round(finalPrice * 100), // Razorpay accepts in Paisa (INR * 100)
      currency: 'INR',
      receipt: `receipt_init_${Date.now()}`,
      notes: {
        userId: user.id,
        courtId: courtId,
        date: date,
        slots: slots.join(',')
      }
    };

    const order = await razorpay.orders.create(options);

    // Return both the Razorpay order object and the context the client must
    // echo back to /api/payments/verify so verification can recompute the price
    // server-side without trusting any amount from the browser.
    return NextResponse.json({
      bookingId: order.id, // temporary handle to correlate client + verify (order id)
      order: {
        id: order.id,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
      },
      basePrice,
      discountAmount,
      finalPrice,
      breakdown,
      lockedUntil,
      courtId,
      date,
      slots
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Booking checkout initialization failed.' }, { status: 500 });
  }
}
