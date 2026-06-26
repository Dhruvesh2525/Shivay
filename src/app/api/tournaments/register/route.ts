// src/app/api/tournaments/register/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';
import { resolveAuth } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const { tournamentId, registrationType, teamName, captainName, captainPhone, captainEmail, players, skillLevel } = await request.json();

    if (!tournamentId || !registrationType) {
      return NextResponse.json({ error: 'Missing registration parameters.' }, { status: 400 });
    }

    const authCtx = await resolveAuth();
    if (authCtx instanceof NextResponse) return authCtx;
    const { user, supabase } = authCtx;
    const adminSupabase = createAdminClient();

    // Rate limit tournament registration (SRD)
    const limited = enforceRateLimit(request, {
      key: user.id,
      action: 'tournament_register',
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 registrations per hour
    });
    if (limited) return limited;

    // Verify tournament details
    const { data: tourney } = await supabase
      .from('tournaments')
      .select('id, status, allow_individual_registration, registration_deadline')
      .eq('id', tournamentId)
      .single();

    if (!tourney) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    // Verify deadline check
    if (new Date(tourney.registration_deadline) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed.' }, { status: 400 });
    }

    if (registrationType === 'individual') {
      if (!tourney.allow_individual_registration) {
        return NextResponse.json({ error: 'Individual registration is not enabled for this tournament.' }, { status: 400 });
      }

      // Check current customer name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const { data: indReg, error } = await adminSupabase
        .from('tournament_individual_registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          full_name: profile?.full_name || 'Anonymous Player',
          phone: profile?.phone || '',
          skill_level: skillLevel || 'beginner',
          status: 'registered'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'You are already registered for this tournament.' }, { status: 409 });
        }
        throw error;
      }

      return NextResponse.json({ success: true, registration: indReg });
    } else {
      // Team Registration
      if (!teamName || !captainName || !captainPhone) {
        return NextResponse.json({ error: 'Missing team contact details.' }, { status: 400 });
      }

      const { data: teamReg, error } = await adminSupabase
        .from('tournament_teams')
        .insert({
          tournament_id: tournamentId,
          team_name: teamName,
          captain_name: captainName,
          captain_phone: captainPhone,
          captain_email: captainEmail,
          players: players || [],
          status: 'registered'
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, registration: teamReg });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Tournament registration failed.' }, { status: 500 });
  }
}
