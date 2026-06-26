// src/app/api/pricing/calculate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBookingPrice } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const { courtId, date, slots } = await request.json();

    if (!courtId || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Price is always recomputed server-side via the shared helper so it can
    // never be tampered with by the client.
    const pricing = await calculateBookingPrice(supabase as any, courtId, date, slots);

    return NextResponse.json(pricing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Pricing calculation failed.' }, { status: 500 });
  }
}
