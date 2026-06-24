// src/app/api/book/details/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get('courtId');
    const date = searchParams.get('date');

    if (!courtId || !date) {
      return NextResponse.json({ error: 'Missing courtId or date parameter.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch court details first to get the sport type
    const { data: courtDetail, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (courtError || !courtDetail) {
      return NextResponse.json({ error: courtError?.message || 'Court not found.' }, { status: 404 });
    }

    const resolvedDayType = new Date(date).getDay() === 0 || new Date(date).getDay() === 6 ? 'weekend' : 'weekday';

    // 2. Fetch all other details in parallel on the server (bypassing RLS)
    const [opHoursRes, holidaysRes, bookingsRes, locksRes, pricingRes, discountsRes] = await Promise.all([
      supabase
        .from('facility_settings')
        .select('value')
        .eq('key', 'operating_hours')
        .single(),
      supabase
        .from('facility_settings')
        .select('value')
        .eq('key', 'holiday_closures')
        .single(),
      supabase
        .from('booking_slots')
        .select('slot_time')
        .eq('court_id', courtId)
        .eq('slot_date', date),
      supabase
        .from('slot_locks')
        .select('slot_time')
        .eq('court_id', courtId)
        .eq('slot_date', date)
        .gt('locked_until', new Date().toISOString()),
      supabase
        .from('pricing_rules')
        .select('*')
        .eq('sport', courtDetail.sport)
        .eq('day_type', resolvedDayType),
      supabase
        .from('duration_discounts')
        .select('*')
        .eq('sport', courtDetail.sport)
        .eq('is_active', true)
    ]);

    const holidaysList = holidaysRes.data?.value?.holidays || [];
    let isHoliday = false;
    let holidayReason = '';

    for (const h of holidaysList) {
      if (date >= h.startDate && date <= h.endDate) {
        isHoliday = true;
        holidayReason = h.reason;
        break;
      }
    }

    return NextResponse.json({
      court: courtDetail,
      opHours: opHoursRes.data,
      bookingsData: bookingsRes.data || [],
      locksData: locksRes.data || [],
      pricing: pricingRes.data || [],
      discounts: discountsRes.data || [],
      isHoliday,
      holidayReason
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch details.' }, { status: 500 });
  }
}
