// src/app/api/pricing/calculate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { courtId, date, slots } = await request.json();

    if (!courtId || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get court detail to resolve the sport
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('sport')
      .eq('id', courtId)
      .single();

    if (courtError || !court) {
      return NextResponse.json({ error: 'Court not found.' }, { status: 404 });
    }

    const sport = court.sport;

    // 2. Resolve day type (weekday vs weekend)
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';

    // 3. Fetch pricing rules for this sport and day type
    const { data: rules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('sport', sport)
      .eq('day_type', dayType)
      .eq('is_active', true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ error: 'Pricing rules not configured for this court.' }, { status: 500 });
    }

    // 4. Match each slot to a rule and aggregate the base price
    let basePrice = 0;
    const slotBreakdown = slots.map((slotTime) => {
      // Find matching pricing rule based on time boundaries
      const rule = rules.find((r) => {
        const start = r.start_time;
        const end = r.end_time;
        return slotTime >= start && slotTime < end;
      });

      const price = rule ? Number(rule.price_per_30min) : 0;
      basePrice += price;

      return {
        slot: slotTime,
        price
      };
    });

    // 5. Check for duration discounts (e.g. 2 hours/4 slots = 5% off)
    let discountPercent = 0;
    const totalSlots = slots.length;

    const { data: discounts } = await supabase
      .from('duration_discounts')
      .select('discount_percentage')
      .eq('sport', sport)
      .eq('is_active', true)
      .lte('min_slots', totalSlots)
      .order('min_slots', { ascending: false })
      .limit(1);

    if (discounts && discounts.length > 0) {
      discountPercent = Number(discounts[0].discount_percentage);
    }

    const discountAmount = (basePrice * discountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return NextResponse.json({
      sport,
      totalSlots,
      basePrice,
      discountPercent,
      discountAmount,
      finalPrice,
      breakdown: slotBreakdown
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Pricing calculation failed.' }, { status: 500 });
  }
}
