import { useState } from 'react';
import { KeyRound, LogIn, ShieldCheck, X } from 'lucide-react';
import { signInAdmin } from '@/lib/adminApi';

export default function AuthPanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: (role: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrap, setBootstrap] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || password.length < 6) return setError('Use a username and a password with at least 6 characters.');
    setLoading(true);
    setError('');
    try {
      const result = await signInAdmin(username, password, bootstrap);
      onSuccess(result.account?.role ?? 'editor');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111526] p-7 shadow-2xl"><button onClick={onClose} className="absolute right-5 top-5 text-slate-500 hover:text-white"><X className="h-5 w-5" /></button><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><ShieldCheck className="h-6 w-6" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Private access</p><h2 className="mt-2 font-display text-3xl font-bold uppercase text-white">{bootstrap ? 'Create owner' : 'Admin sign in'}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{bootstrap ? 'This setup can only work once. The first account becomes the owner.' : 'Sign in with your private username to manage the team.'}</p><div className="mt-6 space-y-3"><input autoFocus value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="Username" className="w-full rounded-xl border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Password" className="w-full rounded-xl border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /></div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<button onClick={submit} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-bold text-white hover:bg-blue-400 disabled:opacity-50">{bootstrap ? <KeyRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{loading ? 'Working...' : bootstrap ? 'Create first owner' : 'Sign in'}</button><button onClick={() => { setBootstrap(!bootstrap); setError(''); }} className="mt-4 w-full text-xs font-semibold text-slate-500 hover:text-blue-300">{bootstrap ? 'Already have an account? Sign in' : 'First setup: create the owner account'}</button></div></div>;
}
