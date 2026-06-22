// src/app/api/admin/refunds/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: Request) {
  try {
    const { refundRequestId, action, approvedAmount, refundMethod, adminNotes } = await request.json();

    if (!refundRequestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify user authorization role (Super Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    // Fetch refund request details
    const { data: refundReq, error: reqError } = await adminSupabase
      .from('refund_requests')
      .select('*, bookings(id, final_price, status)')
      .eq('id', refundRequestId)
      .single();

    if (reqError || !refundReq) {
      return NextResponse.json({ error: 'Refund request not found.' }, { status: 404 });
    }

    if (refundReq.status !== 'pending') {
      return NextResponse.json({ error: 'This refund request has already been processed.' }, { status: 400 });
    }

    const finalApprovedAmount = action === 'approve' ? Number(approvedAmount || refundReq.calculated_refund) : 0;

    if (action === 'approve') {
      // 1. Process Wallet Credit if selected
      if (refundMethod === 'wallet') {
        // Fetch current user wallet balance
        const { data: clientProfile } = await adminSupabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', refundReq.user_id)
          .single();

        const currentBalance = Number(clientProfile?.wallet_balance || 0);
        const newBalance = currentBalance + finalApprovedAmount;

        // Update profile balance
        await adminSupabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('id', refundReq.user_id);

        // Record wallet transaction log
        await adminSupabase
          .from('wallet_transactions')
          .insert({
            user_id: refundReq.user_id,
            amount: finalApprovedAmount,
            type: 'credit',
            reason: 'Booking cancellation compensation credit',
            reference_id: refundReq.booking_id,
            reference_type: 'refund',
            created_by: user.id
          });
      }

      // 2. Update booking status
      await adminSupabase
        .from('bookings')
        .update({ status: 'refunded' })
        .eq('id', refundReq.booking_id);

      // 3. Update refund request row
      await adminSupabase
        .from('refund_requests')
        .update({
          status: 'approved',
          approved_amount: finalApprovedAmount,
          refund_method: refundMethod || 'custom',
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundRequestId);

      // 4. Log Audit Log entry
      await adminSupabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action: 'refund_approved',
          entity_type: 'refund_requests',
          entity_id: refundRequestId,
          new_values: { approved_amount: finalApprovedAmount, refund_method: refundMethod }
        });

    } else {
      // Reject Flow
      // 1. Revert booking status back to confirmed
      await adminSupabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', refundReq.booking_id);

      // 2. Update request row
      await adminSupabase
        .from('refund_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundRequestId);

      // 3. Log Audit Log entry
      await adminSupabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action: 'refund_rejected',
          entity_type: 'refund_requests',
          entity_id: refundRequestId,
          new_values: { notes: adminNotes }
        });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Refund processing failed.' }, { status: 500 });
  }
}
