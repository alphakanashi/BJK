import { supabase } from '@/lib/supabase';

export type AdminRole = 'owner' | 'admin' | 'editor';
export type AdminAccount = { id: string; username: string; role: AdminRole; created_at: string };

type AdminResponse = { session?: { access_token: string; refresh_token: string }; account?: AdminAccount; accounts?: AdminAccount[]; error?: string };

export async function adminRequest(action: string, payload: Record<string, unknown> = {}): Promise<AdminResponse> {
  const sessionResult = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionResult.data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json() as AdminResponse;
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}

export async function signInAdmin(username: string, password: string, bootstrap: boolean): Promise<AdminResponse> {
  const result = await adminRequest(bootstrap ? 'bootstrap' : 'login', { username, password });
  if (result.session) await supabase.auth.setSession(result.session);
  return result;
}
