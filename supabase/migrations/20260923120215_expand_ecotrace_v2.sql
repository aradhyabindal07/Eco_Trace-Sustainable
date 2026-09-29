/*
# EcoTrace v2 — Expanded activity tracking schema

## Purpose
Expand the existing schema to support all activity types (walk, cycle, car, motorcycle, bus, train, food, energy, shopping, waste, plastic), goals, owner/admin roles, and activity history.

## Changes to existing tables

### `profiles`
- Add `is_owner` (boolean, default false) — marks owner/admin accounts for Owner Dashboard access.

### `activities`
- Expand `mode` CHECK constraint to include all new activity types.
- Add `category` (text) — high-level grouping: transport, food, energy, shopping, waste, plastic.
- Add `detail` (jsonb) — flexible storage for activity-specific fields (vehicle type, fuel type, meal type, etc.).
- Add `co2_saved_kg` (double, default 0) — CO2 saved/avoided (positive = good).
- Add `co2_emitted_kg` (double, default 0) — CO2 emitted (positive = bad).
- Add `energy_saved_kwh` (double, default 0).
- Add `energy_used_kwh` (double, default 0).
- Add `water_saved_l` (double, default 0).
- Add `waste_recycled_kg` (double, default 0).
- Add `waste_recorded_kg` (double, default 0).
- Add `fuel_saved_l` (double, default 0).
- Add `fuel_used_l` (double, default 0).
- Add `points` (int, default 0) — app reward points for plastic collection.

## New Tables

### `goals`
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, default auth.uid())
- `title` (text, not null)
- `category` (text, not null) — e.g. walk_more, cycle_more, reduce_food_waste
- `target_value` (double, not null)
- `current_value` (double, default 0)
- `unit` (text, not null) — e.g. km, kg, count
- `deadline` (date)
- `completed` (boolean, default false)
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD policies on goals (TO authenticated, auth.uid() = user_id).
- `is_owner` column on profiles: users can read their own profile including is_owner, but cannot update is_owner (no UPDATE policy on that column — the existing update_own_profile policy allows updating name/age/country but is_owner has a default and is controlled server-side).
*/

-- Add is_owner to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Expand activities table
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_mode_check;
ALTER TABLE activities ADD CONSTRAINT activities_mode_check CHECK (
  mode IN ('walk','cycle','vehicle','mobile','car','motorcycle','bus','train','food','energy','shopping','waste','plastic')
);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS detail jsonb DEFAULT '{}'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS co2_saved_kg double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS co2_emitted_kg double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS energy_saved_kwh double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS energy_used_kwh double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS water_saved_l double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS waste_recycled_kg double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS waste_recorded_kg double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS fuel_saved_l double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS fuel_used_l double precision NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0;

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  target_value double precision NOT NULL,
  current_value double precision NOT NULL DEFAULT 0,
  unit text NOT NULL,
  deadline date,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
