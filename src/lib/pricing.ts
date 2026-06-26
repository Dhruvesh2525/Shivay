// src/lib/pricing.ts
// Shared, server-side price calculation. Used by /api/pricing/calculate,
// /api/bookings/create, and /api/payments/verify so the price is always
// recomputed on the server (never trusted from the client) via one code path.
import { SupabaseClient } from '@supabase/supabase-js';

export interface PricingBreakdownItem {
  slot: string;
  price: number;
}

export interface PricingResult {
  sport: string;
  totalSlots: number;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  breakdown: PricingBreakdownItem[];
}

/**
 * Recompute a booking's price from the canonical pricing_rules /
 * duration_discounts tables. Throws on misconfiguration (no rules) so callers
 * can surface a 500 instead of silently charging a wrong amount.
 */
export async function calculateBookingPrice(
  client: SupabaseClient,
  courtId: string,
  date: string,
  slots: string[]
): Promise<PricingResult> {
  // 1. Resolve sport for the court
  const { data: court, error: courtError } = await client
    .from('courts')
    .select('sport')
    .eq('id', courtId)
    .single();

  if (courtError || !court) {
    throw new Error('Court not found for pricing.');
  }

  const sport: string = court.sport;

  // 2. Resolve day type (weekday vs weekend)
  const bookingDate = new Date(`${date}T00:00:00`);
  const dayOfWeek = bookingDate.getDay();
  const dayType = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';

  // 3. Fetch active pricing rules for this sport + day type
  const { data: rules } = await client
    .from('pricing_rules')
    .select('start_time, end_time, price_per_30min')
    .eq('sport', sport)
    .eq('day_type', dayType)
    .eq('is_active', true);

  if (!rules || rules.length === 0) {
    throw new Error('Pricing rules not configured for this court.');
  }

  // 4. Match each slot to a rule. Normalize times to zero-padded HH:MM:SS so
  // lexicographic comparison is valid regardless of how rows are stored.
  const normalize = (t: string) => {
    if (!t) return '';
    const parts = String(t).split(':');
    const h = parts[0]?.padStart(2, '0') ?? '00';
    const m = (parts[1] ?? '00').padStart(2, '0');
    const s = (parts[2] ?? '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  let basePrice = 0;
  const breakdown: PricingBreakdownItem[] = slots.map((slotTime) => {
    const normalizedSlot = normalize(slotTime);
    const rule = rules.find((r) => {
      return normalizedSlot >= normalize(r.start_time) && normalizedSlot < normalize(r.end_time);
    });
    const price = rule ? Number(rule.price_per_30min) : 300;
    basePrice += price;
    return { slot: slotTime, price };
  });

  // 5. Single-slot pickleball surcharge (30 min flat rate)
  const totalSlots = slots.length;
  let finalPrice = basePrice;
  let discountPercent = 0;
  let discountAmount = 0;

  if (sport === 'pickleball' && totalSlots === 1) {
    basePrice = 400;
    finalPrice = 400;
    if (breakdown[0]) breakdown[0].price = 400;
  } else {
    // 6. Best applicable duration discount (largest min_slots that fits)
    const { data: discounts } = await client
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

    discountAmount = (basePrice * discountPercent) / 100;
    finalPrice = basePrice - discountAmount;
  }

  return {
    sport,
    totalSlots,
    basePrice,
    discountPercent,
    discountAmount,
    finalPrice,
    breakdown,
  };
}
