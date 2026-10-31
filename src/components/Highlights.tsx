import { useState } from 'react';
import { Film, Plus, ExternalLink } from 'lucide-react';
import { supabase, type Highlight, type Player } from '@/lib/supabase';

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname === 'youtu.be') return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname === 'www.vimeo.com' || parsed.hostname === 'vimeo.com') return `https://player.vimeo.com/video/${parsed.pathname.split('/').pop()}`;
    return null;
  } catch {
    return null;
  }
}

export default function Highlights({ highlights, players, canManage, onCreated }: { highlights: Highlight[]; players: Player[]; canManage: boolean; onCreated: (highlight: Highlight) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');

  const addHighlight = async () => {
    if (!title.trim() || !clipUrl.trim()) return setError('Add a title and clip URL.');
    const { data, error: insertError } = await supabase.from('highlights').insert({ title: title.trim(), clip_url: clipUrl.trim(), thumbnail_url: thumbnailUrl.trim() || null, player_id: playerId || null }).select().maybeSingle();
    if (insertError || !data) return setError('The highlight could not be added.');
    onCreated(data as Highlight);
    setTitle(''); setClipUrl(''); setThumbnailUrl(''); setPlayerId(''); setError(''); setShowForm(false);
  };

  return <section className="space-y-5">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Matchday archive</p><h2 className="mt-2 font-display text-3xl font-bold uppercase text-white">Highlights</h2></div>{canManage && <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#070914] transition hover:bg-blue-100"><Plus className="h-4 w-4" /> Add clip</button>}</div>
    {showForm && <div className="rounded-2xl border border-blue-400/20 bg-[#111526] p-5"><div className="grid gap-3 sm:grid-cols-2"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clip title" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><input value={clipUrl} onChange={(e) => setClipUrl(e.target.value)} placeholder="YouTube or Vimeo URL" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Thumbnail URL (optional)" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400"><option value="">Related player (optional)</option>{players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</select></div>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white">Cancel</button><button onClick={addHighlight} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-400">Save highlight</button></div></div>}
    {highlights.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center"><Film className="mx-auto h-10 w-10 text-slate-600" /><p className="mt-3 text-slate-400">No highlights yet. Add the first match clip.</p></div> : <div className="grid gap-5 md:grid-cols-2">{highlights.map((highlight) => { const embedUrl = getEmbedUrl(highlight.clip_url); const player = players.find((item) => item.id === highlight.player_id); return <article key={highlight.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111526]"><div className="aspect-video bg-[#070914]">{embedUrl ? <iframe src={embedUrl} title={highlight.title} className="h-full w-full" allowFullScreen /> : highlight.thumbnail_url ? <img src={highlight.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Film className="h-12 w-12 text-slate-600" /></div>}</div><div className="p-4"><h3 className="font-display text-xl font-bold uppercase text-white">{highlight.title}</h3><div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{player ? player.nickname : 'Team highlight'}</span>{!embedUrl && <a href={highlight.clip_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-300 hover:text-white">Open clip <ExternalLink className="h-3.5 w-3.5" /></a>}</div></div></article>})}</div>}
  </section>;
}
