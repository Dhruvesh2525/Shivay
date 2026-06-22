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

    // 3. Create the Booking & Slot Entries atomically inside a Database Transaction RPC call
    const slotTimes = breakdown.map((item: any) => item.slot);
    const slotPrices = breakdown.map((item: any) => item.price);

    const { data: transactionResult, error: transactionError } = await adminSupabase.rpc(
      'confirm_booking_transaction',
      {
        p_user_id: user.id,
        p_court_id: courtId,
        p_booking_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_total_slots: slots.length,
        p_base_price: basePrice,
        p_discount_amount: discountAmount,
        p_final_price: finalPrice,
        p_payment_id: razorpay_payment_id,
        p_payment_order_id: razorpay_order_id,
        p_payment_signature: razorpay_signature,
        p_slots: slotTimes,
        p_slot_prices: slotPrices
      }
    );

    if (transactionError || !transactionResult || transactionResult.length === 0) {
      throw new Error(transactionError?.message || 'Double booking collision or query error encountered.');
    }

    const { booking_uuid, formatted_booking_id } = transactionResult;

    // Return successfully completed booking payload
    return NextResponse.json({
      success: true,
      bookingId: formatted_booking_id,
      id: booking_uuid
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment verification handler failed.' }, { status: 500 });
  }
}
