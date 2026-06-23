// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user context (Super Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: adminProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || !['super_admin', 'manager', 'organizer'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    // 1. Calculate Revenue Statistics (Confirmed & Completed bookings)
    const { data: bookings } = await adminSupabase
      .from('bookings')
      .select('final_price, booking_date, court_id, total_slots')
      .in('status', ['confirmed', 'completed']);

    let totalRevenue = 0;
    const dailyRevenue: Record<string, number> = {};
    
    bookings?.forEach((b) => {
      const price = Number(b.final_price);
      totalRevenue += price;
      
      const dateKey = b.booking_date;
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + price;
    });

    // Sort dates
    const sortedRevenue = Object.entries(dailyRevenue)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-7); // Get last 7 days

    // 2. Fetch court utilization statistics
    const { data: courts } = await adminSupabase
      .from('courts')
      .select('id, name, sport')
      .eq('is_active', true);

    const { data: slots } = await adminSupabase
      .from('booking_slots')
      .select('court_id, slot_date');

    const courtBookingCount: Record<string, number> = {};
    slots?.forEach((s) => {
      courtBookingCount[s.court_id] = (courtBookingCount[s.court_id] || 0) + 1;
    });

    const utilization = courts?.map((c) => {
      // Mock utilization rate based on bookings count
      const totalBookedSlots = courtBookingCount[c.id] || 0;
      const totalPossibleSlots = 14 * 34; // 14 days, 34 slots of 30-mins per day (6 AM - 11 PM)
      const rate = Math.min(Math.round((totalBookedSlots / totalPossibleSlots) * 100), 100);

      return {
        courtId: c.id,
        name: c.name,
        sport: c.sport,
        rate
      };
    }) || [];

    // 3. Count total active users
    const { count: usersCount } = await adminSupabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer');

    return NextResponse.json({
      totalRevenue,
      usersCount: usersCount || 0,
      bookingsCount: bookings?.length || 0,
      revenueChart: sortedRevenue,
      utilization
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch analytics.' }, { status: 500 });
  }
}
