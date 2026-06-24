// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user context
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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate'); // YYYY-MM-DD
    const endDateParam = searchParams.get('endDate'); // YYYY-MM-DD
    const sportParam = searchParams.get('sport') || 'all'; // 'all' | 'cricket' | 'pickleball'

    if (adminProfile.role === 'organizer') {
      let tournamentsQuery = adminSupabase
        .from('tournaments')
        .select('id, name, sport, entry_fee, status, max_teams, prize_pool, start_date')
        .eq('organizer_id', user.id)
        .is('deleted_at', null);

      if (sportParam !== 'all') {
        tournamentsQuery = tournamentsQuery.eq('sport', sportParam);
      }
      if (startDateParam) {
        tournamentsQuery = tournamentsQuery.gte('start_date', startDateParam);
      }
      if (endDateParam) {
        tournamentsQuery = tournamentsQuery.lte('start_date', endDateParam);
      }

      const { data: tournaments } = await tournamentsQuery.order('created_at', { ascending: false });

      const tournamentIds = tournaments?.map(t => t.id) || [];
      let totalTeams = 0;
      let totalIndividuals = 0;
      let tournamentsSummary: any[] = [];

      if (tournamentIds.length > 0) {
        const { data: teams } = await adminSupabase
          .from('tournament_teams')
          .select('id, tournament_id')
          .in('tournament_id', tournamentIds);

        const { data: individuals } = await adminSupabase
          .from('tournament_individual_registrations')
          .select('id, tournament_id')
          .in('tournament_id', tournamentIds);

        const teamCountsByTournament = (teams || []).reduce((acc: any, curr: any) => {
          acc[curr.tournament_id] = (acc[curr.tournament_id] || 0) + 1;
          return acc;
        }, {});

        const indCountsByTournament = (individuals || []).reduce((acc: any, curr: any) => {
          acc[curr.tournament_id] = (acc[curr.tournament_id] || 0) + 1;
          return acc;
        }, {});

        totalTeams = teams?.length || 0;
        totalIndividuals = individuals?.length || 0;

        tournamentsSummary = (tournaments || []).map(t => ({
          id: t.id,
          name: t.name,
          sport: t.sport,
          entryFee: Number(t.entry_fee),
          status: t.status,
          maxTeams: t.max_teams,
          prizePool: t.prize_pool,
          registeredTeams: teamCountsByTournament[t.id] || 0,
          registeredIndividuals: indCountsByTournament[t.id] || 0
        }));
      }

      const totalTournaments = tournaments?.length || 0;
      const pendingTournaments = tournaments?.filter(t => t.status === 'pending').length || 0;
      const activeTournaments = tournaments?.filter(t => ['approved', 'published', 'registration_open', 'in_progress'].includes(t.status)).length || 0;

      return NextResponse.json({
        role: 'organizer',
        totalTournaments,
        pendingTournaments,
        activeTournaments,
        totalTeams,
        totalIndividuals,
        tournamentsSummary
      });
    }

    // 1. Calculate Revenue Statistics (Confirmed & Completed bookings)
    let bookingsQuery = adminSupabase
      .from('bookings')
      .select(`
        id,
        final_price,
        booking_date,
        court_id,
        total_slots,
        status,
        created_at,
        profiles (
          full_name,
          email
        ),
        courts (
          name,
          sport
        )
      `)
      .in('status', ['confirmed', 'completed']);

    if (startDateParam) {
      bookingsQuery = bookingsQuery.gte('booking_date', startDateParam);
    }
    if (endDateParam) {
      bookingsQuery = bookingsQuery.lte('booking_date', endDateParam);
    }

    const { data: bookings, error: bookingsErr } = await bookingsQuery;
    if (bookingsErr) throw bookingsErr;

    // Filter by sport
    const filteredBookings = bookings?.filter((b: any) => {
      if (sportParam === 'all') return true;
      return b.courts?.sport === sportParam;
    }) || [];

    // Date range helper for trend chart
    let start = startDateParam;
    if (!start) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    }
    let end = endDateParam;
    if (!end) {
      end = new Date().toISOString().split('T')[0];
    }

    const datesList: string[] = [];
    const curr = new Date(start);
    const last = new Date(end);
    let count = 0;
    while (curr <= last && count < 30) {
      datesList.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      count++;
    }

    const dailyRevenue: Record<string, number> = {};
    datesList.forEach(d => {
      dailyRevenue[d] = 0;
    });

    let totalRevenue = 0;
    filteredBookings.forEach((b: any) => {
      const price = Number(b.final_price);
      totalRevenue += price;
      
      const dateKey = b.booking_date;
      if (dailyRevenue[dateKey] !== undefined) {
        dailyRevenue[dateKey] += price;
      } else {
        dailyRevenue[dateKey] = price;
      }
    });

    // Sort dates
    const sortedRevenue = Object.entries(dailyRevenue)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }));

    // 2. Fetch court utilization statistics
    let courtsQuery = adminSupabase
      .from('courts')
      .select('id, name, sport')
      .eq('is_active', true);
    
    if (sportParam !== 'all') {
      courtsQuery = courtsQuery.eq('sport', sportParam);
    }
    const { data: courts } = await courtsQuery;

    let slotsQuery = adminSupabase
      .from('booking_slots')
      .select('court_id, slot_date');

    if (startDateParam) {
      slotsQuery = slotsQuery.gte('slot_date', startDateParam);
    }
    if (endDateParam) {
      slotsQuery = slotsQuery.lte('slot_date', endDateParam);
    }
    const { data: slots } = await slotsQuery;

    const courtBookingCount: Record<string, number> = {};
    slots?.forEach((s) => {
      courtBookingCount[s.court_id] = (courtBookingCount[s.court_id] || 0) + 1;
    });

    const daysCount = datesList.length || 7;
    const utilization = courts?.map((c) => {
      const totalBookedSlots = courtBookingCount[c.id] || 0;
      const totalPossibleSlots = daysCount * 34; // days count * 34 slots of 30-mins per day (6 AM - 11 PM)
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

    // 4. Detail Bookings View List
    const detailBookings = filteredBookings.map((b: any) => ({
      id: b.id,
      finalPrice: Number(b.final_price),
      bookingDate: b.booking_date,
      totalSlots: b.total_slots,
      status: b.status,
      customerName: b.profiles?.full_name || 'N/A',
      customerEmail: b.profiles?.email || 'N/A',
      courtName: b.courts?.name || 'N/A',
      sport: b.courts?.sport || 'N/A'
    }));

    return NextResponse.json({
      totalRevenue,
      usersCount: usersCount || 0,
      bookingsCount: filteredBookings.length,
      revenueChart: sortedRevenue,
      utilization,
      detailBookings
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch analytics.' }, { status: 500 });
  }
}
