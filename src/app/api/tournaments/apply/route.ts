// src/app/api/tournaments/apply/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { organizationName, experience, reason } = await request.json();

    if (!organizationName || !reason) {
      return NextResponse.json({ error: 'Missing organizer application details.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify authorized user context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { data: application, error } = await adminSupabase
      .from('organizer_applications')
      .insert({
        user_id: user.id,
        organization_name: organizationName,
        experience,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit application.' }, { status: 500 });
  }
}
