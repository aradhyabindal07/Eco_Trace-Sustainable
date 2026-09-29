/*
# EcoTrace — Eco-friendly activity tracker schema

## Purpose
Multi-user app with sign-in. Each user has a profile (name, age, country).
Users log activities (walk, cycle, vehicle, mobile) tracked via GPS or screen time,
recycle plastic bottles, and earn badges. The app calculates CO2 saved/emitted,
distance, and phone heat released.

## New Tables

1. `profiles`
   - `id` (uuid, PK, references auth.users)
   - `name` (text, not null)
   - `age` (int, not null)
   - `country` (text, not null)
   - `country_code` (text, not null)
   - `created_at` (timestamptz, default now())

2. `activities`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, default auth.uid())
   - `mode` (text: walk | cycle | vehicle | mobile)
   - `distance_km` (double, default 0)
   - `duration_min` (double, default 0)
   - `co2_kg` (double, default 0) — positive = saved, negative = emitted
   - `heat_kj` (double, default 0) — phone heat released
   - `created_at` (timestamptz, default now())

3. `bottle_recycles`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, default auth.uid())
   - `count` (int, not null, default 1)
   - `co2_saved_kg` (double, default 0)
   - `oil_saved_ml` (double, default 0)
   - `energy_saved_kwh` (double, default 0)
   - `water_saved_l` (double, default 0)
   - `created_at` (timestamptz, default now())

4. `badges`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, default auth.uid())
   - `badge_key` (text, not null) — e.g. 'first_steps', 'green_walker'
   - `tier` (text: bronze | silver | gold)
   - `awarded_at` (timestamptz, default now())
   - UNIQUE(user_id, badge_key, tier)

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD policies (TO authenticated, auth.uid() = user_id).
- profiles table: user can read/update only their own row.
- All owner columns default to auth.uid() so inserts work without passing user_id.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age int NOT NULL,
  country text NOT NULL,
  country_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('walk','cycle','vehicle','mobile')),
  distance_km double precision NOT NULL DEFAULT 0,
  duration_min double precision NOT NULL DEFAULT 0,
  co2_kg double precision NOT NULL DEFAULT 0,
  heat_kj double precision NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activities" ON activities;
CREATE POLICY "select_own_activities" ON activities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activities" ON activities;
CREATE POLICY "insert_own_activities" ON activities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_activities" ON activities;
CREATE POLICY "update_own_activities" ON activities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_activities" ON activities;
CREATE POLICY "delete_own_activities" ON activities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at);

-- bottle_recycles
CREATE TABLE IF NOT EXISTS bottle_recycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  count int NOT NULL DEFAULT 1,
  co2_saved_kg double precision NOT NULL DEFAULT 0,
  oil_saved_ml double precision NOT NULL DEFAULT 0,
  energy_saved_kwh double precision NOT NULL DEFAULT 0,
  water_saved_l double precision NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bottle_recycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recycles" ON bottle_recycles;
CREATE POLICY "select_own_recycles" ON bottle_recycles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recycles" ON bottle_recycles;
CREATE POLICY "insert_own_recycles" ON bottle_recycles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recycles" ON bottle_recycles;
CREATE POLICY "update_own_recycles" ON bottle_recycles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recycles" ON bottle_recycles;
CREATE POLICY "delete_own_recycles" ON bottle_recycles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recycles_user_created ON bottle_recycles(user_id, created_at);

-- badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('bronze','silver','gold')),
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key, tier)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_badges" ON badges;
CREATE POLICY "select_own_badges" ON badges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_badges" ON badges;
CREATE POLICY "insert_own_badges" ON badges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_badges" ON badges;
CREATE POLICY "delete_own_badges" ON badges FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);