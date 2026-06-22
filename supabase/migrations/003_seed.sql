-- supabase/migrations/003_seed.sql

-- 1. Seed Courts
INSERT INTO courts (name, sport, description, image_url, display_order) VALUES
('Cricket Turf Main', 'cricket', 'Premium outdoor artificial grass cricket pitch with tournament-grade floodlighting and sightscreens.', '/images/courts/cricket_turf.jpg', 1),
('Pickleball Court Alpha', 'pickleball', 'Professional-grade cushion-acrylic pickleball court (Court 1) under high-intensity LED floodlights.', '/images/courts/pickleball_alpha.jpg', 2),
('Pickleball Court Beta', 'pickleball', 'Professional-grade cushion-acrylic pickleball court (Court 2) under high-intensity LED floodlights.', '/images/courts/pickleball_beta.jpg', 3)
ON CONFLICT DO NOTHING;

-- 2. Seed Default Facility Settings
INSERT INTO facility_settings (key, value) VALUES
('operating_hours', '{
  "opens_at": "06:00:00",
  "closes_at": "23:00:00"
}'::jsonb),
('booking_rules', '{
  "booking_window_months": 3,
  "cricket_min_booking_mins": 60,
  "pickleball_min_booking_mins": 30,
  "max_booking_mins": 240,
  "slot_lock_seconds": 300
}'::jsonb),
('contact_details', '{
  "address": "Shivay Box Cricket and Pickleball, Karai Dam Road, Karai, Gujarat 382330",
  "phone": "+91-9998168681",
  "email": "contact@shivaycricketinghub.com",
  "instagram": "@shivay_thecricketinghub"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Seed Default Pricing Rules (30-minute slot basis)
-- Weekday Cricket (Standard: 6 AM to 5 PM = 500 INR/30min; Peak: 5 PM to 11 PM = 750 INR/30min)
INSERT INTO pricing_rules (sport, day_type, start_time, end_time, price_per_30min) VALUES
('cricket', 'weekday', '06:00:00', '17:00:00', 500.00),
('cricket', 'weekday', '17:00:00', '23:00:00', 750.00),
-- Weekend Cricket (All slots peak: 850 INR/30min)
('cricket', 'weekend', '06:00:00', '23:00:00', 850.00),

-- Weekday Pickleball (Standard: 6 AM to 4 PM = 250 INR/30min; Peak: 4 PM to 11 PM = 350 INR/30min)
('pickleball', 'weekday', '06:00:00', '16:00:00', 250.00),
('pickleball', 'weekday', '16:00:00', '23:00:00', 350.00),
-- Weekend Pickleball (All slots peak: 400 INR/30min)
('pickleball', 'weekend', '06:00:00', '23:00:00', 400.00)
ON CONFLICT DO NOTHING;

-- 4. Seed Duration Discounts
-- 2 hours (4 slots) gives 5% off, 3 hours (6 slots) gives 10% off, 4 hours (8 slots) gives 15% off
INSERT INTO duration_discounts (sport, min_slots, discount_percentage) VALUES
('cricket', 4, 5.00),
('cricket', 6, 10.00),
('cricket', 8, 15.00),
('pickleball', 4, 5.00),
('pickleball', 6, 10.00),
('pickleball', 8, 15.00)
ON CONFLICT DO NOTHING;
