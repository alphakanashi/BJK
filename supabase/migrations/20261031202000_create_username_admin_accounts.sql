/*
# Create username-based private administration

1. New Tables
- `admin_accounts`
  - `id` (uuid, primary key)
  - `auth_user_id` (uuid, unique) — the protected Supabase Auth identity.
  - `username` (text, unique, lowercase) — the private sign-in name.
  - `role` (text) — one of `owner`, `admin`, or `editor`.
  - `created_at` (timestamptz, default now()).

2. Security Changes
- Enable RLS on `admin_accounts`.
- Only authenticated administrators can read account records; the edge function handles account creation, role changes, and deletion.
- Player, highlight, and scrim writes are allowed only when the current authenticated user has an admin account with an allowed role.
- Public visitors retain read-only access to the public team content.

3. Important Notes
- Usernames are the only credential shown in the application; internal auth identities remain hidden.
- Passwords are handled by Supabase Auth and are never stored in this table.
- The first bootstrap account becomes `owner`; later account creation is not public.
*/

CREATE TABLE IF NOT EXISTS admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username = lower(username)),
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON admin_accounts TO authenticated;

DROP POLICY IF EXISTS "admin_accounts_select" ON admin_accounts;
CREATE POLICY "admin_accounts_select" ON admin_accounts FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_accounts viewer
      WHERE viewer.auth_user_id = auth.uid()
      AND viewer.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "owner_insert_players" ON players;
DROP POLICY IF EXISTS "owner_update_players" ON players;
DROP POLICY IF EXISTS "owner_delete_players" ON players;
CREATE POLICY "admin_insert_players" ON players FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_update_players" ON players FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_delete_players" ON players FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));

DROP POLICY IF EXISTS "owner_insert_highlights" ON highlights;
DROP POLICY IF EXISTS "owner_update_highlights" ON highlights;
DROP POLICY IF EXISTS "owner_delete_highlights" ON highlights;
CREATE POLICY "admin_insert_highlights" ON highlights FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_update_highlights" ON highlights FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_delete_highlights" ON highlights FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));

DROP POLICY IF EXISTS "owner_insert_scrims" ON scrims;
DROP POLICY IF EXISTS "owner_update_scrims" ON scrims;
DROP POLICY IF EXISTS "owner_delete_scrims" ON scrims;
CREATE POLICY "admin_insert_scrims" ON scrims FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_update_scrims" ON scrims FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
CREATE POLICY "admin_delete_scrims" ON scrims FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')));
