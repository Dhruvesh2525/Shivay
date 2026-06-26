-- supabase/migrations/005_waitlist_and_rls_fixes.sql

-- 1. Create trigger to delete slots on cancellation/refund
CREATE OR REPLACE FUNCTION delete_slots_on_booking_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('refunded', 'cancelled') THEN
    DELETE FROM booking_slots WHERE booking_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_slots_on_booking_cancellation
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION delete_slots_on_booking_cancellation();


-- 2. Create trigger to consume/notify waitlist when slots are freed
CREATE OR REPLACE FUNCTION process_waitlist_on_slot_free()
RETURNS TRIGGER AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- OLD contains the deleted booking_slots row
  -- Find the first active waitlist entry that covers this court, date, and time
  SELECT id, user_id FROM waitlist
  WHERE court_id = OLD.court_id
    AND desired_date = OLD.slot_date
    AND is_active = true
    AND desired_start_time <= OLD.slot_time
    AND desired_end_time > OLD.slot_time
    AND notified = false
  ORDER BY created_at ASC
  LIMIT 1
  INTO waitlist_entry;

  IF waitlist_entry.id IS NOT NULL THEN
    -- Mark as notified and deactivate the waitlist entry
    UPDATE waitlist
    SET notified = true,
        notified_at = now(),
        is_active = false
    WHERE id = waitlist_entry.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_process_waitlist_on_slot_free
  AFTER DELETE ON booking_slots
  FOR EACH ROW
  EXECUTE FUNCTION process_waitlist_on_slot_free();


-- 3. Tighten RLS Policies

-- Drop old loose policies for tournament_teams
DROP POLICY IF EXISTS "Tournament Teams - read registrations" ON tournament_teams;
DROP POLICY IF EXISTS "Tournament Teams - registration" ON tournament_teams;
DROP POLICY IF EXISTS "Tournament Teams - organizer and admin manage" ON tournament_teams;

-- Create secure policies for tournament_teams
CREATE POLICY "Tournament Teams - select secure" ON tournament_teams
  FOR SELECT USING (
    get_auth_role() IN ('super_admin', 'manager')
    OR EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_teams.tournament_id 
        AND tournaments.organizer_id = auth.uid()
    )
    -- Allow captains to view their own team registration
    OR captain_email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Tournament Teams - insert secure" ON tournament_teams
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Tournament Teams - update secure" ON tournament_teams
  FOR UPDATE USING (
    get_auth_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_teams.tournament_id 
        AND tournaments.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Tournament Teams - delete secure" ON tournament_teams
  FOR DELETE USING (
    get_auth_role() = 'super_admin'
  );


-- Drop old loose policies for tournament_individual_registrations
DROP POLICY IF EXISTS "Tournament Individual Registrations - select" ON tournament_individual_registrations;
DROP POLICY IF EXISTS "Tournament Individual Registrations - own control" ON tournament_individual_registrations;
DROP POLICY IF EXISTS "Tournament Individual Registrations - organizer control" ON tournament_individual_registrations;

-- Create secure policies for tournament_individual_registrations
CREATE POLICY "Tournament Individual Registrations - select secure" ON tournament_individual_registrations
  FOR SELECT USING (
    get_auth_role() IN ('super_admin', 'manager')
    OR EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_individual_registrations.tournament_id 
        AND tournaments.organizer_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Tournament Individual Registrations - insert secure" ON tournament_individual_registrations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Tournament Individual Registrations - update secure" ON tournament_individual_registrations
  FOR UPDATE USING (
    get_auth_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = tournament_individual_registrations.tournament_id 
        AND tournaments.organizer_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Tournament Individual Registrations - delete secure" ON tournament_individual_registrations
  FOR DELETE USING (
    get_auth_role() = 'super_admin'
    OR user_id = auth.uid()
  );


-- Drop old facility_settings policies
DROP POLICY IF EXISTS "Facility Settings - public read" ON facility_settings;
DROP POLICY IF EXISTS "Facility Settings - super admins have full control" ON facility_settings;

-- Create secure policies for facility_settings
CREATE POLICY "Facility Settings - read authenticated" ON facility_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Facility Settings - super admins write" ON facility_settings
  FOR ALL USING (get_auth_role() = 'super_admin');
