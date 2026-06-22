// src/app/api/refunds/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function calculateRefundTier(bookingDateStr: string, startTimeStr: string): { tier: string; percentage: number } {
  const bookingTime = new Date(`${bookingDateStr}T${startTimeStr}`);
  const now = new Date();
  
  const diffMs = bookingTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours > 12) {
    return { tier: '100%', percentage: 1.00 };
  } else if (diffHours >= 6) {
    return { tier: '77%', percentage: 0.70 }; // Typo resolution: 70% as requested
  } else if (diffHours >= 3) {
    return { tier: '50%', percentage: 0.50 };
  } else {
    return { tier: '0%', percentage: 0.00 };
  }
}

export async function POST(request: Request) {
  try {
    const { bookingId, reason } = await request.json();

    if (!bookingId || !reason) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Fetch user context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, booking_date, start_time, final_price, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Verify booking ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized booking access.' }, { status: 403 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Only confirmed bookings can be cancelled/refunded.' }, { status: 400 });
    }

    // Calculate refund details
    const { tier, percentage } = calculateRefundTier(booking.booking_date, booking.start_time);
    const calculatedRefund = Number(booking.final_price) * percentage;

    // Log refund request
    const { error: refundError } = await adminSupabase
      .from('refund_requests')
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        reason,
        request_type: 'cancellation',
        cancellation_tier: tier,
        calculated_refund: calculatedRefund,
        status: 'pending'
      });

    if (refundError) throw refundError;

    // Update booking status
    await adminSupabase
      .from('bookings')
      .update({ status: 'refund_requested' })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      tier,
      calculatedRefund
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit refund request.' }, { status: 500 });
  }
}
