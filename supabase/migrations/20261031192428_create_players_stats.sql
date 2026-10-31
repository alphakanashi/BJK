/*
# Create players table for Beşiktaş scrim team stats

1. New Tables
- `players`
  - `id` (uuid, primary key)
  - `nickname` (text, unique, not null) — oyuncunun oyun nickname'i
  - `goals` (integer, default 0) — atılan goller
  - `assists` (integer, default 0) — asistler
  - `tackles` (integer, default 0) — tackle'lar
  - `saves` (integer, default 0) — kurtarışlar
  - `matches_played` (integer, default 0) — oynanan maç sayısı
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `players`.
- Grant CRUD to `anon` + `authenticated` so the Data API can reach the table.
- Allow anon + authenticated full CRUD because this is a shared/public team stats app with no sign-in.
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text UNIQUE NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  tackles integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  matches_played integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_players_nickname ON players (nickname);
