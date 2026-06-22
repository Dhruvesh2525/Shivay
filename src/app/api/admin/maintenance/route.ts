// src/app/api/admin/maintenance/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { courtId, date, startTime, endTime, reason } = await request.json();

    if (!courtId || !date || !startTime || !endTime || !reason) {
      return NextResponse.json({ error: 'Missing maintenance details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden. Admin or Manager access required.' }, { status: 403 });
    }

    const { data: block, error } = await adminSupabase
      .from('maintenance_blocks')
      .insert({
        court_id: courtId,
        block_date: date,
        start_time: startTime,
        end_time: endTime,
        reason,
        blocked_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Log action to Audit log
    await adminSupabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'maintenance_blocked',
        entity_type: 'maintenance_blocks',
        entity_id: block.id,
        new_values: { courtId, date, startTime, endTime, reason }
      });

    return NextResponse.json({ success: true, block });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create maintenance block.' }, { status: 500 });
  }
}
