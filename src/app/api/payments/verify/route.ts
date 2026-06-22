// src/app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      courtId,
      date,
      slots
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courtId || !date || !slots) {
      return NextResponse.json({ error: 'Missing payment signature details.' }, { status: 400 });
    }

    // 1. Verify Razorpay Signature (HMAC SHA256)
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature. Payment verification failed.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Fetch authorized user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 2. Perform pricing calculation again on the server to prevent tamper
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const pricingRes = await fetch(`${protocol}://${host}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtId, date, slots })
    });

    if (!pricingRes.ok) {
      throw new Error('Failed to recalculate booking totals.');
    }

    const { basePrice, discountAmount, finalPrice, breakdown } = await pricingRes.json();

    // Sort slots to find start and end boundaries
    const sortedSlots = [...slots].sort();
    const startTime = sortedSlots[0];
    
    // Add 30 minutes to last slot for end boundary
    const lastSlotTime = sortedSlots[sortedSlots.length - 1];
    const [h, m, s] = lastSlotTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    // 3. Create the Booking & Slot Entries inside a Database Transaction sequence
    // A. Insert Booking record
    const { data: booking, error: bookingError } = await adminSupabase
      .from('bookings')
      .insert({
        user_id: user.id,
        court_id: courtId,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        total_slots: slots.length,
        base_price: basePrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: 'confirmed',
        payment_id: razorpay_payment_id,
        payment_order_id: razorpay_order_id,
        payment_signature: razorpay_signature
      })
      .select('id, booking_id')
      .single();

    if (bookingError || !booking) {
      throw new Error(bookingError?.message || 'Failed to register booking in database.');
    }

    // B. Insert Booking Slots
    const slotRows = breakdown.map((item: any) => ({
      booking_id: booking.id,
      court_id: courtId,
      slot_date: date,
      slot_time: item.slot,
      price: item.price
    }));

    const { error: slotsError } = await adminSupabase
      .from('booking_slots')
      .insert(slotRows);

    if (slotsError) {
      // Revert booking on slot insertion failures
      await adminSupabase.from('bookings').delete().eq('id', booking.id);
      throw new Error('Double booking collision detected during slot allocation.');
    }

    // C. Clean up / Release Slot Locks
    await adminSupabase
      .from('slot_locks')
      .delete()
      .eq('court_id', courtId)
      .eq('slot_date', date)
      .in('slot_time', slots);

    // Return successfully completed booking payload
    return NextResponse.json({
      success: true,
      bookingId: booking.booking_id,
      id: booking.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment verification handler failed.' }, { status: 500 });
  }
}
