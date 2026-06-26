// src/app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateBookingPrice } from '@/lib/pricing';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook signature secret is not configured.' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 });
    }

    // Verify webhook signature (HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    
    // Process captured payment events
    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const razorpay_payment_id = paymentEntity.id;
      const razorpay_order_id = paymentEntity.order_id;
      
      const adminSupabase = createAdminClient();

      // Check if booking already exists
      const { data: existingBooking } = await adminSupabase
        .from('bookings')
        .select('id, status')
        .eq('payment_order_id', razorpay_order_id)
        .maybeSingle();

      if (existingBooking) {
        // If booking exists and is pending, confirm it
        if (existingBooking.status === 'pending') {
          await adminSupabase
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_id: razorpay_payment_id
            })
            .eq('id', existingBooking.id);
        }
        return NextResponse.json({ success: true, message: 'Existing booking processed.' });
      }

      // If booking does not exist yet (verify endpoint failed or wasn't called)
      // Extract notes metadata sent from bookings/create
      const notes = paymentEntity.notes || {};
      const { userId, courtId, date, slots: slotsStr } = notes;

      if (!userId || !courtId || !date || !slotsStr) {
        return NextResponse.json({ error: 'Missing metadata notes in payment entity.' }, { status: 400 });
      }

      const slots = slotsStr.split(',');

      // Recompute price server-side
      const pricing = await calculateBookingPrice(adminSupabase as any, courtId, date, slots);
      const { basePrice, discountAmount, finalPrice, breakdown } = pricing;

      // Sort slots to calculate start/end boundaries
      const sortedSlots = [...slots].sort();
      const startTime = sortedSlots[0];
      const lastSlotTime = sortedSlots[sortedSlots.length - 1];
      const [h, m] = lastSlotTime.split(':').map(Number);
      const endMinutes = h * 60 + m + 30;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      const slotTimes = breakdown.map((item: any) => item.slot);
      const slotPrices = breakdown.map((item: any) => item.price);

      // Call database transaction RPC to create booking and slots atomically
      const { data: transactionResult, error: transactionError } = await adminSupabase.rpc(
        'confirm_booking_transaction',
        {
          p_user_id: userId,
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
          p_payment_signature: signature, // use webhook signature since it is authenticated
          p_slots: slotTimes,
          p_slot_prices: slotPrices
        }
      );

      if (transactionError || !transactionResult || transactionResult.length === 0) {
        throw new Error(transactionError?.message || 'Double booking collision or query error encountered.');
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: err.message || 'Webhook handler failed.' }, { status: 500 });
  }
}
