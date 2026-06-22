// src/app/api/tournaments/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public GET - returns all active/upcoming tournaments (bypasses RLS)
export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('tournaments')
      .select('id, name, sport, description, start_date, registration_deadline, entry_fee, status, max_teams')
      .in('status', ['approved', 'published', 'registration_open', 'registration_closed', 'in_progress'])
      .is('deleted_at', null)
      .order('start_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tournaments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch tournaments.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, sport, description, rules, format, startDate, endDate, deadline, maxTeams, minTeamSize, maxTeamSize, entryFee, prizePool, allowIndividual } = await request.json();

    if (!name || !sport || !startDate || !endDate || !deadline || !maxTeams) {
      return NextResponse.json({ error: 'Missing tournament details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify organizer or admin credentials
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'organizer' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Organizer or Admin role required.' }, { status: 403 });
    }

    const { data: tournament, error } = await adminSupabase
      .from('tournaments')
      .insert({
        organizer_id: user.id,
        name,
        sport,
        description,
        rules,
        format,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: deadline,
        max_teams: maxTeams,
        min_team_size: minTeamSize || 1,
        max_team_size: maxTeamSize || minTeamSize || 1,
        entry_fee: entryFee || 0,
        prize_pool: prizePool,
        allow_individual_registration: allowIndividual || false,
        status: profile.role === 'super_admin' ? 'approved' : 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, tournament });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create tournament.' }, { status: 500 });
  }
}
