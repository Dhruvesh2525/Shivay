// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { bookingId, turfQuality, lighting, cleanliness, staff, comment, photos } = await request.json();

    if (!bookingId || !turfQuality || !lighting || !cleanliness || !staff) {
      return NextResponse.json({ error: 'Missing rating details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    // Verify customer completed booking status (to guarantee reviews are from verified users only)
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, user_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking reference not found.' }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized booking reference.' }, { status: 403 });
    }

    // Check overall average
    const overallRating = (Number(turfQuality) + Number(lighting) + Number(cleanliness) + Number(staff)) / 4;

    // Insert Review
    const { data: review, error: reviewError } = await adminSupabase
      .from('reviews')
      .insert({
        user_id: user.id,
        booking_id: bookingId,
        turf_quality: turfQuality,
        lighting,
        cleanliness,
        staff,
        overall_rating: overallRating,
        comment,
        is_visible: true
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Handle review photos insertion (up to 3 photos limit)
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const photoRows = photos.slice(0, 3).map((url, idx) => ({
        review_id: review.id,
        image_url: url,
        display_order: idx
      }));

      await adminSupabase.from('review_photos').insert(photoRows);
    }

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post review.' }, { status: 500 });
  }
}
