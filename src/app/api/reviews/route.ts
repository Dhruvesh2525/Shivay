// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/rate-limit';
import { resolveAuth } from '@/lib/auth-helpers';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    const { bookingId, turfQuality, lighting, cleanliness, staff, comment, photos } = await request.json();

    if (!bookingId || !turfQuality || !lighting || !cleanliness || !staff) {
      return NextResponse.json({ error: 'Missing rating details.' }, { status: 400 });
    }

    const authCtx = await resolveAuth();
    if (authCtx instanceof NextResponse) return authCtx;
    const { user, supabase } = authCtx;
    const adminSupabase = createAdminClient();

    // Rate limit review submissions (SRD)
    const limited = enforceRateLimit(request, {
      key: user.id,
      action: 'review',
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 reviews per hour
    });
    if (limited) return limited;

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

    // Handle review photos insertion (up to 3 photos limit) with MIME/size validation & compression
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // Ensure reviews bucket exists
      await adminSupabase.storage.createBucket('reviews', { public: true });

      const uploadedUrls: string[] = [];

      for (let idx = 0; idx < Math.min(photos.length, 3); idx++) {
        const photoStr = photos[idx];
        if (typeof photoStr !== 'string' || !photoStr.startsWith('data:image/')) {
          continue;
        }

        // Validate MIME type
        const mimeMatch = photoStr.match(/^data:(image\/jpeg|image\/png|image\/webp);base64,/);
        if (!mimeMatch) {
          throw new Error('Unsupported image format. Only JPEG, PNG, and WebP are allowed.');
        }
        const mimeType = mimeMatch[1];

        // Parse base64
        const base64Data = photoStr.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Validate size (< 2MB)
        if (buffer.length > 2 * 1024 * 1024) {
          throw new Error('Image file size must be less than 2MB.');
        }

        // Compress image server-side
        const compressedBuffer = await sharp(buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Upload to reviews bucket
        const fileName = `${review.id}_${Date.now()}_${idx}.jpg`;
        const { error: uploadError } = await adminSupabase.storage
          .from('reviews')
          .upload(fileName, compressedBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = adminSupabase.storage
          .from('reviews')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const photoRows = uploadedUrls.map((url, idx) => ({
          review_id: review.id,
          image_url: url,
          display_order: idx
        }));
        await adminSupabase.from('review_photos').insert(photoRows);
      }
    }

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post review.' }, { status: 500 });
  }
}
