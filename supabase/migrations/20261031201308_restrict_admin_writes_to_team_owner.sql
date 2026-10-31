/*
# Restrict team editing to the designated admin account

1. Security Changes
- Keep public SELECT access for players, highlights, and scrims.
- Restrict every INSERT, UPDATE, and DELETE policy to the authenticated account whose email is `justkanashi@gmail.com`.
- Keep table grants limited to the roles that need them.

2. Important Notes
- This is enforced by Supabase Row Level Security, not only by hiding buttons in the browser.
- The account must exist in Supabase Auth with email/password credentials before the private sign-in can succeed.
- No password is stored in application code or this migration.
*/

DROP POLICY IF EXISTS "authenticated_insert_players" ON players;
DROP POLICY IF EXISTS "authenticated_update_players" ON players;
DROP POLICY IF EXISTS "authenticated_delete_players" ON players;
CREATE POLICY "owner_insert_players" ON players FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_update_players" ON players FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_delete_players" ON players FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');

DROP POLICY IF EXISTS "authenticated_insert_highlights" ON highlights;
DROP POLICY IF EXISTS "authenticated_update_highlights" ON highlights;
DROP POLICY IF EXISTS "authenticated_delete_highlights" ON highlights;
CREATE POLICY "owner_insert_highlights" ON highlights FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_update_highlights" ON highlights FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_delete_highlights" ON highlights FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');

DROP POLICY IF EXISTS "authenticated_insert_scrims" ON scrims;
DROP POLICY IF EXISTS "authenticated_update_scrims" ON scrims;
DROP POLICY IF EXISTS "authenticated_delete_scrims" ON scrims;
CREATE POLICY "owner_insert_scrims" ON scrims FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_update_scrims" ON scrims FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
CREATE POLICY "owner_delete_scrims" ON scrims FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'justkanashi@gmail.com');
