/*
# Add player profile media and highlight clips

1. Modified Tables
- `players`
  - `avatar_url` (text, nullable) — optional public image URL shown in cards and profiles.

2. New Tables
- `highlights`
  - `id` (uuid, primary key)
  - `title` (text, not null) — highlight title.
  - `clip_url` (text, not null) — public video or clip URL.
  - `thumbnail_url` (text, nullable) — optional preview image URL.
  - `player_id` (uuid, nullable) — optional related player.
  - `created_at` (timestamptz, default now()).

3. Security
- Enable RLS on `highlights`.
- Grant CRUD access to anon and authenticated roles because the shared team dashboard has no sign-in.
- Add separate public CRUD policies for highlights.

4. Important Notes
- Existing player records are preserved; new media fields are optional.
- The frontend embeds only supported video hosts and displays other links as safe external links.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  clip_url text NOT NULL,
  thumbnail_url text,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON highlights TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_highlights" ON highlights;
CREATE POLICY "anon_select_highlights" ON highlights FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_highlights" ON highlights;
CREATE POLICY "anon_insert_highlights" ON highlights FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_highlights" ON highlights;
CREATE POLICY "anon_update_highlights" ON highlights FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_highlights" ON highlights;
CREATE POLICY "anon_delete_highlights" ON highlights FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_player_id ON highlights (player_id);
