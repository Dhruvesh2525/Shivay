// src/app/(admin)/admin/refunds/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, Check, X, Shield } from 'lucide-react';

interface RefundRequest {
  id: string;
  reason: string;
  cancellation_tier: string;
  calculated_refund: number;
  status: string;
  created_at: string;
  user_id: string;
  booking_id: string;
  profiles: {
    full_name: string;
  };
}

export default function AdminRefundsQueue() {
  const supabase = createClient();
  
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('refund_requests')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (data) setRequests(data as any[]);
    } catch (err) {
      console.error('Failed to query refund queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (id: string, action: 'approve' | 'reject', refundMethod = 'wallet') => {
    try {
      setProcessingId(id);
      setError(null);
      const reqDetail = requests.find((r) => r.id === id);
      if (!reqDetail) return;

      const res = await fetch('/api/admin/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundRequestId: id,
          action,
          approvedAmount: reqDetail.calculated_refund,
          refundMethod,
          adminNotes: `Refund request resolved via admin dashboard.`
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process refund.');
      }

      fetchQueue();
    } catch (err: any) {
      setError(err.message || 'Refund processing failed.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Refund Queue</h1>
        <p className="text-[#A7C4B8] text-sm mt-1">Review pending customer cancellation refund claims.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-[#A7C4B8]">Loading refund queue details...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
          No pending refund claims in the queue.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    PENDING CLAIM
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">TIER: {req.cancellation_tier}</span>
                </div>
                <h3 className="font-bold text-base text-foreground">
                  User: {req.profiles?.full_name || 'Anonymous Player'}
                </h3>
                <p className="text-xs text-[#A7C4B8] leading-relaxed max-w-lg italic">
                  &ldquo;{req.reason}&rdquo;
                </p>
                <span className="text-[10px] text-muted-foreground font-mono block">
                  Requested on: {new Date(req.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Calculated Payout</span>
                  <p className="text-xl font-black text-primary font-mono mt-0.5">₹{req.calculated_refund}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleDecision(req.id, 'reject')}
                    className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 text-xs"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleDecision(req.id, 'approve', 'wallet')}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-[#6EE7B7] transition-all flex items-center gap-1.5 text-xs"
                  >
                    <Check className="w-4 h-4" /> Approve to Wallet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
