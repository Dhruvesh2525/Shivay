// src/app/api/admin/organizers/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: Request) {
  try {
    const { applicationId, action } = await request.json();

    if (!applicationId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing review details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user context (Super Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admin required.' }, { status: 403 });
    }

    // Fetch application details
    const { data: app, error: appError } = await adminSupabase
      .from('organizer_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    if (app.status !== 'pending') {
      return NextResponse.json({ error: 'Application already reviewed.' }, { status: 400 });
    }

    if (action === 'approve') {
      // 1. Update Profile role to organizer
      await adminSupabase
        .from('profiles')
        .update({ role: 'organizer' })
        .eq('id', app.user_id);

      // 2. Close application
      await adminSupabase
        .from('organizer_applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      // 3. Log Audit Log
      await adminSupabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action: 'organizer_approved',
          entity_type: 'organizer_applications',
          entity_id: applicationId,
          new_values: { user_id: app.user_id }
        });
    } else {
      // Reject application
      await adminSupabase
        .from('organizer_applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      // Log Audit Log
      await adminSupabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action: 'organizer_rejected',
          entity_type: 'organizer_applications',
          entity_id: applicationId,
          new_values: { user_id: app.user_id }
        });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to review organizer application.' }, { status: 500 });
  }
}
