/*
# Fix RLS: Add missing UPDATE policy on badges + create screen_time table with RLS

1. Security Fix
- The `badges` table was missing an UPDATE policy. Authenticated users could not update their own badge records.
- Added `update_own_badges` policy: authenticated users can UPDATE only their own badge rows (auth.uid() = user_id).

2. New Table: screen_time
- Stores device screen time tracking entries per user.
- Columns: id, user_id, date, screen_minutes, heat_kj, created_at.
- RLS enabled with 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) for authenticated users.
- user_id defaults to auth.uid() so inserts without explicit user_id succeed.

3. Notes
- All policies use auth.uid() for ownership checks.
- No data loss — only additive changes.
*/

-- Fix: Add missing UPDATE policy on badges table
DROP POLICY IF EXISTS "update_own_badges" ON badges;
CREATE POLICY "update_own_badges"
ON badges FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create screen_time table for automatic screen time tracking
CREATE TABLE IF NOT EXISTS screen_time (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  screen_minutes integer NOT NULL DEFAULT 0,
  heat_kj numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE screen_time ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_screen_time" ON screen_time;
CREATE POLICY "select_own_screen_time"
ON screen_time FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_screen_time" ON screen_time;
CREATE POLICY "insert_own_screen_time"
ON screen_time FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_screen_time" ON screen_time;
CREATE POLICY "update_own_screen_time"
ON screen_time FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_screen_time" ON screen_time;
CREATE POLICY "delete_own_screen_time"
ON screen_time FOR DELETE
TO authenticated USING (auth.uid() = user_id);
