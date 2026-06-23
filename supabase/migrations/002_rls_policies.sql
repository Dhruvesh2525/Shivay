-- supabase/migrations/002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE duration_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_individual_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_applications ENABLE ROW LEVEL SECURITY;

-- Helper functions for cleaner policy declarations
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================================
-- 1. Profiles Policies
-- =====================================================================
CREATE POLICY "Profiles - read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles - update own customer profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "Profiles - managers and admins can read profiles" ON profiles
  FOR SELECT USING (get_auth_role() IN ('manager', 'super_admin'));

CREATE POLICY "Profiles - super admins have full control" ON profiles
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 2. Courts Policies
-- =====================================================================
CREATE POLICY "Courts - public read active courts" ON courts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Courts - managers and admins read all" ON courts
  FOR SELECT USING (get_auth_role() IN ('manager', 'super_admin'));

CREATE POLICY "Courts - super admins have full control" ON courts
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 3. Facility Settings Policies
-- =====================================================================
CREATE POLICY "Facility Settings - public read" ON facility_settings
  FOR SELECT USING (true);

CREATE POLICY "Facility Settings - super admins have full control" ON facility_settings
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 4. Pricing Rules & Duration Discounts Policies (Super Admin Only)
-- =====================================================================
CREATE POLICY "Pricing Rules - public read active rules" ON pricing_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Pricing Rules - super admins have full control" ON pricing_rules
  FOR ALL USING (get_auth_role() = 'super_admin');

CREATE POLICY "Duration Discounts - public read active discounts" ON duration_discounts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Duration Discounts - super admins have full control" ON duration_discounts
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 5. Bookings Policies (Manager can read but has no pricing visibility via API masking)
-- =====================================================================
CREATE POLICY "Bookings - read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can create bookings
CREATE POLICY "Bookings - insert bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Bookings - managers and admins read all bookings" ON bookings
  FOR SELECT USING (get_auth_role() IN ('manager', 'super_admin'));

CREATE POLICY "Bookings - super admins have full control" ON bookings
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 6. Booking Slots & Slot Locks Policies
-- =====================================================================
CREATE POLICY "Booking Slots - read own booking slots" ON booking_slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_slots.booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Booking Slots - managers and admins read all slots" ON booking_slots
  FOR SELECT USING (get_auth_role() IN ('manager', 'super_admin'));

CREATE POLICY "Booking Slots - super admins have full control" ON booking_slots
  FOR ALL USING (get_auth_role() = 'super_admin');

CREATE POLICY "Slot Locks - select locks" ON slot_locks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Slot Locks - users manage own locks" ON slot_locks
  FOR ALL USING (auth.uid() = locked_by);

-- =====================================================================
-- 7. Maintenance Blocks Policies
-- =====================================================================
CREATE POLICY "Maintenance Blocks - read active blocks" ON maintenance_blocks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Maintenance Blocks - managers and admins full control" ON maintenance_blocks
  FOR ALL USING (get_auth_role() IN ('manager', 'super_admin'));

-- =====================================================================
-- 8. Refund Requests Policies (Super Admin Only for approval/processing)
-- =====================================================================
CREATE POLICY "Refund Requests - read own requests" ON refund_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Refund Requests - customers request refund" ON refund_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Refund Requests - super admins have full control" ON refund_requests
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 9. Waitlist Policies
-- =====================================================================
CREATE POLICY "Waitlist - own entries control" ON waitlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Waitlist - admins read all" ON waitlist
  FOR SELECT USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 10. Reviews & Photos Policies
-- =====================================================================
CREATE POLICY "Reviews - read visible" ON reviews
  FOR SELECT USING (is_visible = true AND deleted_at IS NULL);

CREATE POLICY "Reviews - users create own review" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM bookings WHERE id = reviews.booking_id AND user_id = auth.uid() AND status = 'completed')
  );

CREATE POLICY "Reviews - managers and admins read all" ON reviews
  FOR SELECT USING (get_auth_role() IN ('manager', 'super_admin'));

CREATE POLICY "Reviews - admins manage visibility & soft deletes" ON reviews
  FOR ALL USING (get_auth_role() = 'super_admin');

CREATE POLICY "Review Photos - read visible" ON review_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reviews WHERE id = review_photos.review_id AND is_visible = true AND deleted_at IS NULL)
  );

CREATE POLICY "Review Photos - insert own review photos" ON review_photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM reviews WHERE id = review_id AND user_id = auth.uid())
  );

CREATE POLICY "Review Photos - super admins full control" ON review_photos
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 11. Tournaments, Teams & Registrations Policies
-- =====================================================================
CREATE POLICY "Tournaments - read published tournaments" ON tournaments
  FOR SELECT USING (status IN ('approved', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed') AND deleted_at IS NULL);

CREATE POLICY "Tournaments - organizers manage own tournaments" ON tournaments
  FOR ALL USING (organizer_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Tournaments - super admins full control" ON tournaments
  FOR ALL USING (get_auth_role() = 'super_admin');

CREATE POLICY "Tournament Teams - read registrations" ON tournament_teams
  FOR SELECT USING (true);

CREATE POLICY "Tournament Teams - registration" ON tournament_teams
  FOR INSERT WITH CHECK (true); -- Registrations are external payments and open to inputs

CREATE POLICY "Tournament Teams - organizer and admin manage" ON tournament_teams
  FOR ALL USING (
    get_auth_role() = 'super_admin'
    OR EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_teams.tournament_id AND organizer_id = auth.uid())
  );

CREATE POLICY "Tournament Individual Registrations - select" ON tournament_individual_registrations
  FOR SELECT USING (true);

CREATE POLICY "Tournament Individual Registrations - own control" ON tournament_individual_registrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tournament Individual Registrations - organizer control" ON tournament_individual_registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_individual_registrations.tournament_id AND organizer_id = auth.uid())
  );

-- =====================================================================
-- 12. Gallery Policies
-- =====================================================================
CREATE POLICY "Gallery - public read visible" ON gallery
  FOR SELECT USING (is_visible = true AND deleted_at IS NULL);

CREATE POLICY "Gallery - admins full control" ON gallery
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 13. Announcements Policies
-- =====================================================================
CREATE POLICY "Announcements - public read active" ON announcements
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at >= now()) AND deleted_at IS NULL);

CREATE POLICY "Announcements - admins full control" ON announcements
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 14. Wallet Transactions (Super Admin & Customer Own-Only, NO Manager)
-- =====================================================================
CREATE POLICY "Wallet - customer view own log" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Wallet - admins full control" ON wallet_transactions
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 15. Audit Logs Policies (Super Admin Only, NO Manager)
-- =====================================================================
CREATE POLICY "Audit Logs - super admins full control" ON audit_logs
  FOR ALL USING (get_auth_role() = 'super_admin');

-- =====================================================================
-- 16. Organizer Applications Policies
-- =====================================================================
CREATE POLICY "Organizer Apps - customers view and create own application" ON organizer_applications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Organizer Apps - super admins full control" ON organizer_applications
  FOR ALL USING (get_auth_role() = 'super_admin');
