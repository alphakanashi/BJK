/*
# Secure admin editing, manual player ratings, and scrim history

1. Modified Tables
- `players`
  - `overall_rating` (integer, not null, default 60) — manually controlled squad rating shown publicly.
- `highlights`
  - Write access is now restricted to signed-in administrators while public read access remains available.

2. New Tables
- `scrims`
  - `id` (uuid, primary key)
  - `opponent` (text, not null) — opposing team name.
  - `our_score` (integer, default 0) — Beşiktaş score.
  - `their_score` (integer, default 0) — opponent score.
  - `rating` (integer, default 0) — admin-entered scrim rating from 0 to 10.
  - `played_at` (date, default current date) — date of the scrim.
  - `notes` (text, nullable) — optional match notes.
  - `created_at` (timestamptz, default now()).

3. Security
- Public visitors can read players, highlights, and scrims.
- Only authenticated users can insert, update, or delete players, highlights, and scrims.
- Remove anonymous write grants and replace the old anonymous write policies.
- Enable RLS on `scrims` with separate policies for each CRUD action.

4. Important Notes
- Existing player statistics and highlights are preserved.
- The browser can never change player ratings while signed out; the Manage Squad screen will require Supabase email/password authentication.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS overall_rating integer NOT NULL DEFAULT 60;

CREATE TABLE IF NOT EXISTS scrims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent text NOT NULL,
  our_score integer NOT NULL DEFAULT 0,
  their_score integer NOT NULL DEFAULT 0,
  rating integer NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  played_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON players FROM anon;
GRANT INSERT, UPDATE, DELETE ON players TO authenticated;
DROP POLICY IF EXISTS "anon_insert_players" ON players;
DROP POLICY IF EXISTS "anon_update_players" ON players;
DROP POLICY IF EXISTS "anon_delete_players" ON players;

CREATE POLICY "authenticated_insert_players" ON players FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_players" ON players FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_players" ON players FOR DELETE
  TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON highlights FROM anon;
GRANT INSERT, UPDATE, DELETE ON highlights TO authenticated;
DROP POLICY IF EXISTS "anon_insert_highlights" ON highlights;
DROP POLICY IF EXISTS "anon_update_highlights" ON highlights;
DROP POLICY IF EXISTS "anon_delete_highlights" ON highlights;

CREATE POLICY "authenticated_insert_highlights" ON highlights FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_highlights" ON highlights FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_highlights" ON highlights FOR DELETE
  TO authenticated USING (true);

GRANT SELECT ON scrims TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON scrims TO authenticated;

DROP POLICY IF EXISTS "anon_select_scrims" ON scrims;
CREATE POLICY "anon_select_scrims" ON scrims FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_scrims" ON scrims;
CREATE POLICY "authenticated_insert_scrims" ON scrims FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_scrims" ON scrims;
CREATE POLICY "authenticated_update_scrims" ON scrims FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_delete_scrims" ON scrims;
CREATE POLICY "authenticated_delete_scrims" ON scrims FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scrims_played_at ON scrims (played_at DESC);
