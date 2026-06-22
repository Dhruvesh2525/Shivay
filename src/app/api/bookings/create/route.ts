// src/app/api/bookings/create/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { courtId, date, slots } = await request.json();

    if (!courtId || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify user authorization status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1. Fetch court details and enforce sport rules
    const { data: court } = await supabase
      .from('courts')
      .select('sport, name')
      .eq('id', courtId)
      .single();

    if (!court) {
      return NextResponse.json({ error: 'Court not found.' }, { status: 404 });
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

    // 3. Server-side Pricing Calculation
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const pricingRes = await fetch(`${protocol}://${host}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtId, date, slots })
    });

    if (!pricingRes.ok) {
      return NextResponse.json({ error: 'Failed to calculate price.' }, { status: 500 });
    }

    const { basePrice, discountAmount, finalPrice, breakdown } = await pricingRes.json();

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
    // Setup Razorpay instance (using placeholder keys)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
    });

    // Create Razorpay Order options
    const options = {
      amount: Math.round(finalPrice * 100), // Razorpay accepts in Paisa (INR * 100)
      currency: 'INR',
      receipt: `receipt_init_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      basePrice,
      discountAmount,
      finalPrice,
      breakdown,
      lockedUntil
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Booking checkout initialization failed.' }, { status: 500 });
  }
}
