// src/app/api/admin/pricing/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { sport, dayType, startTime, endTime, price } = await request.json();

    if (!sport || !dayType || !startTime || !endTime || price === undefined) {
      return NextResponse.json({ error: 'Missing pricing parameters.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify Super Admin credentials
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admin required.' }, { status: 403 });
    }

    // Insert new pricing rule
    const { data: rule, error } = await adminSupabase
      .from('pricing_rules')
      .insert({
        sport,
        day_type: dayType,
        start_time: startTime,
        end_time: endTime,
        price_per_30min: price,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Log to Audit Log
    await adminSupabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'pricing_changed',
        entity_type: 'pricing_rules',
        entity_id: rule.id,
        new_values: { sport, day_type: dayType, price }
      });

    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create pricing rule.' }, { status: 500 });
  }
}
