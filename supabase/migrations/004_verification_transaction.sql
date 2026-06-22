-- supabase/migrations/004_verification_transaction.sql

-- 1. Create a composite index to speed up availability slots checking
CREATE INDEX IF NOT EXISTS idx_booking_slots_query 
ON booking_slots (court_id, slot_date, slot_time);

-- 2. Postgres Function to handle payment verification atomic insertion
CREATE OR REPLACE FUNCTION confirm_booking_transaction(
  p_user_id UUID,
  p_court_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_total_slots INTEGER,
  p_base_price DECIMAL,
  p_discount_amount DECIMAL,
  p_final_price DECIMAL,
  p_payment_id TEXT,
  p_payment_order_id TEXT,
  p_payment_signature TEXT,
  p_slots TIME[],
  p_slot_prices DECIMAL[]
)
RETURNS TABLE (
  booking_uuid UUID,
  formatted_booking_id TEXT
) AS $$
DECLARE
  v_booking_id UUID;
  v_formatted_id TEXT;
  i INTEGER;
BEGIN
  -- Verify slots are not already booked (double booking prevention)
  IF EXISTS (
    SELECT 1 
    FROM booking_slots
    WHERE court_id = p_court_id
      AND slot_date = p_booking_date
      AND slot_time = ANY(p_slots)
  ) THEN
    RAISE EXCEPTION 'Double booking collision detected during slot allocation.';
  END IF;

  -- Create booking
  INSERT INTO bookings (
    user_id,
    court_id,
    booking_date,
    start_time,
    end_time,
    total_slots,
    base_price,
    discount_amount,
    final_price,
    status,
    payment_id,
    payment_order_id,
    payment_signature
  ) VALUES (
    p_user_id,
    p_court_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    p_total_slots,
    p_base_price,
    p_discount_amount,
    p_final_price,
    'confirmed',
    p_payment_id,
    p_payment_order_id,
    p_payment_signature
  ) RETURNING id, booking_id INTO v_booking_id, v_formatted_id;

  -- Insert matching slot entries
  FOR i IN 1 .. array_length(p_slots, 1) LOOP
    INSERT INTO booking_slots (
      booking_id,
      court_id,
      slot_date,
      slot_time,
      price
    ) VALUES (
      v_booking_id,
      p_court_id,
      p_booking_date,
      p_slots[i],
      p_slot_prices[i]
    );
  END LOOP;

  -- Delete corresponding active temporary slot locks
  DELETE FROM slot_locks
  WHERE court_id = p_court_id
    AND slot_date = p_booking_date
    AND slot_time = ANY(p_slots);

  RETURN QUERY SELECT v_booking_id, v_formatted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
