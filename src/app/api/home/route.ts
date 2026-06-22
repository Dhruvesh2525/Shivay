// src/app/api/home/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Run all home page queries in parallel
    const [courtsRes, announcementsRes, reviewsRes] = await Promise.all([
      supabase
        .from('courts')
        .select('id, name, sport')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),

      supabase
        .from('announcements')
        .select('id, title, content, priority, created_at')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('reviews')
        .select('id, comment, overall_rating, created_at, profiles(full_name)')
        .eq('is_visible', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    return NextResponse.json({
      courts: courtsRes.data || [],
      announcements: announcementsRes.data || [],
      reviews: reviewsRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ courts: [], announcements: [], reviews: [] });
  }
}
