// src/app/api/waitlist/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { courtId, date, startTime, endTime } = await request.json();

    if (!courtId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing waitlist details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: waitlistEntry, error } = await adminSupabase
      .from('waitlist')
      .insert({
        user_id: user.id,
        court_id: courtId,
        desired_date: date,
        desired_start_time: startTime,
        desired_end_time: endTime,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You are already on the waitlist for this slot.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, waitlistEntry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join waitlist.' }, { status: 500 });
  }
}
