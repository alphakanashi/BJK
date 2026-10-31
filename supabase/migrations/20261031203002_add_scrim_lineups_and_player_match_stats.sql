/*
# Add scrim lineups and per-player match stats

1. New Tables
- `scrim_players`
  - `id` (uuid, primary key)
  - `scrim_id` (uuid, required) — the recorded scrim.
  - `player_id` (uuid, required) — the squad player in the lineup.
  - `position` (text, nullable) — lineup position label.
  - `goals` (integer, default 0) — goals in this scrim.
  - `assists` (integer, default 0) — assists in this scrim.
  - `tackles` (integer, default 0) — tackles in this scrim.
  - `saves` (integer, default 0) — saves in this scrim.
  - `rating` (integer, default 0) — admin rating from 0 to 10.
  - `created_at` (timestamptz, default now()).

2. Security
- Public visitors can read lineups and match stats.
- Only users represented in `admin_accounts` with owner, admin, or editor role can write lineups and stats.
- Enable RLS and grant only the required verbs to each role.

3. Important Notes
- Deleting a scrim or player removes its dependent lineup rows through foreign-key cascades.
- Existing scrims remain valid and can receive lineups later.
*/

CREATE TABLE IF NOT EXISTS scrim_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id uuid NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position text,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  tackles integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  rating integer NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, player_id)
);

ALTER TABLE scrim_players ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON scrim_players TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON scrim_players TO authenticated;

DROP POLICY IF EXISTS "public_select_scrim_players" ON scrim_players;
CREATE POLICY "public_select_scrim_players" ON scrim_players FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_scrim_players" ON scrim_players;
CREATE POLICY "admin_insert_scrim_players" ON scrim_players FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
DROP POLICY IF EXISTS "admin_update_scrim_players" ON scrim_players;
CREATE POLICY "admin_update_scrim_players" ON scrim_players FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
DROP POLICY IF EXISTS "admin_delete_scrim_players" ON scrim_players;
CREATE POLICY "admin_delete_scrim_players" ON scrim_players FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));

CREATE INDEX IF NOT EXISTS idx_scrim_players_scrim_id ON scrim_players (scrim_id);
CREATE INDEX IF NOT EXISTS idx_scrim_players_player_id ON scrim_players (player_id);
