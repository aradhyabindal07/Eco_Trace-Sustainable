/*
  Survey system + trips table for EcoVibe v2
  1. user_survey_responses — app-wide survey with RLS
  2. trips — activity detection/tracking with RLS
  3. screen_time_entries — screen time tracking with RLS
*/

-- ── Survey responses ──
CREATE TABLE IF NOT EXISTS user_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  overall_rating text,
  ease_of_use text,
  most_used_features text[],
  environmental_information_rating text,
  automatic_tracking_rating text,
  dashboard_rating text,
  design_rating text,
  improvement_areas text[],
  new_feature_request text,
  recommendation_rating text,
  liked_feature text,
  final_feedback text,
  survey_version text DEFAULT 'v1'
);

ALTER TABLE user_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_surveys" ON user_survey_responses;
CREATE POLICY "select_own_surveys" ON user_survey_responses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_surveys" ON user_survey_responses;
CREATE POLICY "insert_own_surveys" ON user_survey_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_surveys" ON user_survey_responses;
CREATE POLICY "delete_own_surveys" ON user_survey_responses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Owner can see all surveys
DROP POLICY IF EXISTS "owner_select_all_surveys" ON user_survey_responses;
CREATE POLICY "owner_select_all_surveys" ON user_survey_responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_owner = true)
  );

-- ── Trips table ──
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'walking',
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds integer DEFAULT 0,
  distance_km numeric DEFAULT 0,
  co2_calculated numeric DEFAULT 0,
  co2_saved numeric DEFAULT 0,
  detection_confidence numeric DEFAULT 0,
  detection_method text DEFAULT 'manual',
  status text DEFAULT 'completed',
  analysis_start_time timestamptz,
  detection_time timestamptz,
  analysis_duration_seconds integer DEFAULT 0,
  tracking_duration_seconds integer DEFAULT 0,
  analysis_distance_km numeric DEFAULT 0,
  tracking_distance_km numeric DEFAULT 0,
  total_distance_km numeric DEFAULT 0,
  data_quality text DEFAULT 'good',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trips" ON trips;
CREATE POLICY "select_own_trips" ON trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trips" ON trips;
CREATE POLICY "insert_own_trips" ON trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trips" ON trips;
CREATE POLICY "update_own_trips" ON trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trips" ON trips;
CREATE POLICY "delete_own_trips" ON trips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Screen time entries ──
CREATE TABLE IF NOT EXISTS screen_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  screen_minutes integer NOT NULL DEFAULT 0,
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE screen_time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_screen_time_entries" ON screen_time_entries;
CREATE POLICY "select_own_screen_time_entries" ON screen_time_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_screen_time_entries" ON screen_time_entries;
CREATE POLICY "insert_own_screen_time_entries" ON screen_time_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_screen_time_entries" ON screen_time_entries;
CREATE POLICY "update_own_screen_time_entries" ON screen_time_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_screen_time_entries" ON screen_time_entries;
CREATE POLICY "delete_own_screen_time_entries" ON screen_time_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
