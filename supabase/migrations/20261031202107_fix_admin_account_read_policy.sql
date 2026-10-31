/*
# Fix admin account read policy recursion

1. Security Changes
- Replace the recursive account-list policy with a non-recursive self-row policy.
- Account listing remains available only through the protected edge function for owner/admin users.

2. Important Notes
- The edge function uses the service role for account administration and is separately protected by the current session role.
*/

DROP POLICY IF EXISTS "admin_accounts_select" ON admin_accounts;
CREATE POLICY "admin_accounts_select_own" ON admin_accounts FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
