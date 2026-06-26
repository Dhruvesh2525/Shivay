// src/app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateBookingPrice } from '@/lib/pricing';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Accept both snake_case (Razorpay native) and camelCase (client) field names.
    const razorpay_payment_id = body.razorpay_payment_id ?? body.razorpayPaymentId;
    const razorpay_order_id = body.razorpay_order_id ?? body.razorpayOrderId;
    const razorpay_signature = body.razorpay_signature ?? body.razorpaySignature;
    const courtId = body.courtId;
    const date = body.date;
    const slots = body.slots;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courtId || !date || !slots) {
      return NextResponse.json({ error: 'Missing payment signature details.' }, { status: 400 });
    }

    // 1. Verify Razorpay Signature (HMAC SHA256). Fail loud if the secret is
    // not configured — never fall back to a hardcoded value.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not configured.');
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time comparison to avoid leaking signature bytes via timing.
    const a = Buffer.from(generatedSignature, 'utf8');
    const b = Buffer.from(razorpay_signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid signature. Payment verification failed.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Fetch authorized user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // 1b. Duplicate payment prevention — reject any payment id already used.
    const { data: existingPayment } = await adminSupabase
      .from('bookings')
      .select('id')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ error: 'This payment has already been processed.' }, { status: 409 });
    }

    // 2. Recompute price server-side (never trust the client).
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
      return NextResponse.json({ error: 'Failed to recalculate booking totals.' }, { status: 500 });
    }

    // Sort slots to find start and end boundaries
    const sortedSlots = [...slots].sort();
    const startTime = sortedSlots[0];

    // Add 30 minutes to last slot for end boundary
    const lastSlotTime = sortedSlots[sortedSlots.length - 1];
    const [h, m] = lastSlotTime.split(':').map(Number);
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

    const { booking_uuid, formatted_booking_id } = transactionResult[0];

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
