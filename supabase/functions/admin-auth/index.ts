import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const adminClient = createClient(supabaseUrl, serviceRoleKey);
const usernamePattern = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

type Role = 'owner' | 'admin' | 'editor';

type Account = {
  id: string;
  auth_user_id: string;
  username: string;
  role: Role;
  created_at: string;
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeUsername(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 6 && value.length <= 128;
}

async function signInAccount(username: string, password: string) {
  const { data: account, error: accountError } = await adminClient
    .from('admin_accounts')
    .select('auth_user_id, username, role')
    .eq('username', username)
    .maybeSingle();
  if (accountError || !account) return response({ error: 'Invalid username or password.' }, 401);

  const { data, error } = await adminClient.auth.signInWithPassword({
    email: `${username}@besiktas-team.internal`,
    password,
  });
  if (error || !data.session) return response({ error: 'Invalid username or password.' }, 401);
  return response({ session: data.session, account });
}

async function getCurrentAccount(request: Request): Promise<Account | null> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data: userData } = await adminClient.auth.getUser(token);
  if (!userData.user) return null;
  const { data } = await adminClient
    .from('admin_accounts')
    .select('*')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  return (data as Account | null) ?? null;
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;

    if (action === 'bootstrap') {
      const username = normalizeUsername(body.username);
      if (!usernamePattern.test(username) || !validPassword(body.password)) return response({ error: 'Choose a valid username and password.' }, 400);
      const { count, error: countError } = await adminClient.from('admin_accounts').select('id', { count: 'exact', head: true });
      if (countError) return response({ error: 'Account setup is unavailable.' }, 500);
      if ((count ?? 0) > 0) return response({ error: 'The first owner account already exists.' }, 409);

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: `${username}@besiktas-team.internal`,
        password: body.password as string,
        email_confirm: true,
      });
      if (authError || !authData.user) return response({ error: 'The owner account could not be created.' }, 400);

      const { error: insertError } = await adminClient.from('admin_accounts').insert({ auth_user_id: authData.user.id, username, role: 'owner' });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return response({ error: 'The owner account could not be created.' }, 400);
      }
      return signInAccount(username, body.password as string);
    }

    if (action === 'login') {
      const username = normalizeUsername(body.username);
      if (!usernamePattern.test(username) || !validPassword(body.password)) return response({ error: 'Invalid username or password.' }, 401);
      return signInAccount(username, body.password as string);
    }

    const current = await getCurrentAccount(request);
    if (!current) return response({ error: 'Admin access required.' }, 401);

    if (action === 'me') return response({ account: { id: current.id, username: current.username, role: current.role, created_at: current.created_at } });

    if (action === 'list_accounts') {
      if (!['owner', 'admin'].includes(current.role)) return response({ error: 'Not authorized.' }, 403);
      const { data, error } = await adminClient.from('admin_accounts').select('id, username, role, created_at').order('created_at', { ascending: true });
      if (error) return response({ error: 'Accounts could not be loaded.' }, 500);
      return response({ accounts: data ?? [] });
    }

    if (action === 'create_account') {
      const username = normalizeUsername(body.username);
      const role = body.role as Role;
      if (!['owner', 'admin'].includes(current.role)) return response({ error: 'Not authorized.' }, 403);
      if (!usernamePattern.test(username) || !validPassword(body.password) || !['admin', 'editor'].includes(role)) return response({ error: 'Choose valid account details.' }, 400);
      if (current.role === 'admin' && role !== 'editor') return response({ error: 'Admins can only create editor accounts.' }, 403);

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email: `${username}@besiktas-team.internal`, password: body.password as string, email_confirm: true });
      if (authError || !authData.user) return response({ error: 'The account could not be created.' }, 400);
      const { data, error } = await adminClient.from('admin_accounts').insert({ auth_user_id: authData.user.id, username, role }).select('id, username, role, created_at').maybeSingle();
      if (error || !data) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return response({ error: 'The account could not be created.' }, 400);
      }
      return response({ account: data });
    }

    if (action === 'update_role') {
      if (current.role !== 'owner') return response({ error: 'Only the owner can change roles.' }, 403);
      const role = body.role as Role;
      if (!['admin', 'editor'].includes(role) || typeof body.accountId !== 'string') return response({ error: 'Invalid role.' }, 400);
      const { data, error } = await adminClient.from('admin_accounts').update({ role }).eq('id', body.accountId).select('id, username, role, created_at').maybeSingle();
      if (error || !data) return response({ error: 'The role could not be updated.' }, 400);
      return response({ account: data });
    }

    if (action === 'delete_account') {
      if (current.role !== 'owner' || typeof body.accountId !== 'string') return response({ error: 'Only the owner can remove accounts.' }, 403);
      const { data: target } = await adminClient.from('admin_accounts').select('auth_user_id').eq('id', body.accountId).maybeSingle();
      if (!target || target.auth_user_id === current.auth_user_id) return response({ error: 'That account cannot be removed.' }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(target.auth_user_id);
      if (error) return response({ error: 'The account could not be removed.' }, 400);
      return response({ success: true });
    }

    return response({ error: 'Unknown action.' }, 400);
  } catch {
    return response({ error: 'The request could not be completed.' }, 500);
  }
});
