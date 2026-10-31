import { useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, Edit3, Plus, Shield, Trash2, X } from 'lucide-react';
import { supabase, type Player, type Scrim, type ScrimPlayer } from '@/lib/supabase';

type LineupDraft = { player_id: string; position: string; goals: number; assists: number; tackles: number; saves: number; rating: number };
const positions = ['Left wing', 'Center forward', 'Right wing', 'Left back', 'Center midfielder', 'Right back', 'Goalkeeper'];
const blankLineup = (position: string): LineupDraft => ({ player_id: '', position, goals: 0, assists: 0, tackles: 0, saves: 0, rating: 0 });

type MatchPlayerCardProps = { matchPlayer: ScrimPlayer | undefined; player: Player | undefined };

export default function ScrimHistory({ scrims, players, lineups, canManage, onChanged }: { scrims: Scrim[]; players: Player[]; lineups: ScrimPlayer[]; canManage: boolean; onChanged: () => void }) {
  const [editingScrim, setEditingScrim] = useState<string | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState({ opponent: '', our_score: 0, their_score: 0, rating: 0, played_at: new Date().toISOString().slice(0, 10), notes: '' });
  const [lineup, setLineup] = useState<LineupDraft[]>(positions.map(blankLineup));
  const [error, setError] = useState('');
  const [expandedScrims, setExpandedScrims] = useState<Set<string>>(new Set());

  const reset = () => {
    setShowMatchForm(false);
    setEditingScrim(null);
    setMatchForm({ opponent: '', our_score: 0, their_score: 0, rating: 0, played_at: new Date().toISOString().slice(0, 10), notes: '' });
    setLineup(positions.map(blankLineup));
    setError('');
  };

  const save = async () => {
    if (!matchForm.opponent.trim()) return setError('Enter the opponent name.');
    const payload = { opponent: matchForm.opponent.trim(), our_score: matchForm.our_score, their_score: matchForm.their_score, rating: matchForm.rating, played_at: matchForm.played_at, notes: matchForm.notes.trim() || null };
    const matchQuery = editingScrim ? supabase.from('scrims').update(payload).eq('id', editingScrim) : supabase.from('scrims').insert(payload);
    const { data: saved, error: matchError } = await matchQuery.select().maybeSingle();
    if (matchError || !saved) return setError('The scrim could not be saved.');
    const scrimId = (saved as Scrim).id;
    await supabase.from('scrim_players').delete().eq('scrim_id', scrimId);
    const lineupRows = lineup.filter((entry) => entry.player_id).map((entry) => ({ ...entry, scrim_id: scrimId }));
    if (lineupRows.length > 0) {
      const { error: lineupError } = await supabase.from('scrim_players').insert(lineupRows);
      if (lineupError) return setError('The match was saved, but the lineup could not be saved.');
    }
    onChanged();
    reset();
  };

  const edit = (scrim: Scrim) => {
    setEditingScrim(scrim.id);
    setShowMatchForm(true);
    setMatchForm({ opponent: scrim.opponent, our_score: scrim.our_score, their_score: scrim.their_score, rating: scrim.rating, played_at: scrim.played_at, notes: scrim.notes ?? '' });
    const existing = lineups.filter((item) => item.scrim_id === scrim.id);
    setLineup(positions.map((position, index) => {
      const item = existing[index];
      return item ? { player_id: item.player_id, position: item.position ?? position, goals: item.goals, assists: item.assists, tackles: item.tackles, saves: item.saves, rating: item.rating } : blankLineup(position);
    }));
  };

  const remove = async (id: string) => {
    const { error: removeError } = await supabase.from('scrims').delete().eq('id', id);
    if (removeError) return setError('The scrim could not be removed.');
    onChanged();
  };

  const result = (scrim: Scrim) => scrim.our_score > scrim.their_score ? 'W' : scrim.our_score < scrim.their_score ? 'L' : 'D';
  const wins = scrims.filter((scrim) => result(scrim) === 'W').length;
  const losses = scrims.filter((scrim) => result(scrim) === 'L').length;
  const draws = scrims.filter((scrim) => result(scrim) === 'D').length;
  const toggleLineup = (id: string) => setExpandedScrims((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const updateLineup = (index: number, key: keyof LineupDraft, value: string | number) => setLineup((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));

  return <section className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Match archive</p><h2 className="mt-2 font-display text-3xl font-bold uppercase text-white">SCRIM HISTORY</h2><p className="mt-2 text-sm text-slate-400">Results, lineups, player match stats, and ratings.</p></div><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest"><span className="rounded-lg bg-white px-3 py-2 text-black">Wins {wins}</span><span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white">Draws {draws}</span><span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white">Losses {losses}</span></div>{canManage && <button onClick={() => setShowMatchForm(true)} className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-400"><Plus className="h-4 w-4" /> Add scrim</button>}</div>
    {showMatchForm && canManage && <div className="rounded-2xl border border-blue-400/20 bg-[#111526] p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input value={matchForm.opponent} onChange={(event) => setMatchForm({ ...matchForm, opponent: event.target.value })} placeholder="Opponent" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><input type="date" value={matchForm.played_at} onChange={(event) => setMatchForm({ ...matchForm, played_at: event.target.value })} className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><input type="number" min="0" max="10" value={matchForm.rating} onChange={(event) => setMatchForm({ ...matchForm, rating: Math.max(0, Math.min(10, Number(event.target.value))) })} placeholder="Team rating / 10" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400" /><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#070914] px-3"><span className="text-xs uppercase tracking-widest text-slate-500">Score</span><input type="number" min="0" value={matchForm.our_score} onChange={(event) => setMatchForm({ ...matchForm, our_score: Math.max(0, Number(event.target.value)) })} className="w-14 bg-transparent px-2 py-3 text-center text-white outline-none" /><span className="text-slate-600">:</span><input type="number" min="0" value={matchForm.their_score} onChange={(event) => setMatchForm({ ...matchForm, their_score: Math.max(0, Number(event.target.value)) })} className="w-14 bg-transparent px-2 py-3 text-center text-white outline-none" /></div><input value={matchForm.notes} onChange={(event) => setMatchForm({ ...matchForm, notes: event.target.value })} placeholder="Notes (optional)" className="rounded-lg border border-white/10 bg-[#070914] px-4 py-3 text-white outline-none focus:border-blue-400 sm:col-span-2" /></div><div className="mt-6"><p className="text-xs font-bold uppercase tracking-widest text-blue-300">Match lineup and player ratings</p><div className="mt-3 grid gap-3 lg:grid-cols-2">{lineup.map((entry, index) => <div key={index} className="grid grid-cols-[1fr_66px_66px] gap-2 rounded-xl border border-white/10 bg-[#070914] p-3 sm:grid-cols-[1.4fr_72px_72px_72px_72px_72px]"><select value={entry.player_id} onChange={(event) => updateLineup(index, 'player_id', event.target.value)} className="min-w-0 rounded bg-[#111526] px-2 py-2 text-sm text-white outline-none [color-scheme:dark]"><option value="">{positions[index]}</option>{players.map((player) => <option className="bg-[#111526] text-white" key={player.id} value={player.id}>{player.nickname}</option>)}</select>{(['goals', 'assists', 'tackles', 'saves', 'rating'] as const).map((key) => <label key={key} className="text-center text-[9px] uppercase tracking-widest text-slate-500">{key === 'rating' ? 'RTG' : key.slice(0, 3)}<input type="number" min="0" max={key === 'rating' ? 10 : 999} value={entry[key]} onChange={(event) => updateLineup(index, key, Math.max(0, Math.min(key === 'rating' ? 10 : 999, Number(event.target.value))))} className="mt-1 w-full rounded bg-white/5 px-1 py-2 text-center text-sm font-bold text-white outline-none" /></label>)}</div>)}</div></div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={reset} className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"><X className="h-4 w-4" /> Cancel</button><button onClick={save} className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#070914]"><Check className="h-4 w-4" /> Save scrim</button></div></div>}
    {scrims.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><Shield className="mx-auto h-10 w-10 text-slate-600" /><p className="mt-3 text-slate-400">No scrims recorded yet.</p></div> : <div className="space-y-5">{scrims.map((scrim) => { const matchPlayers = lineups.filter((item) => item.scrim_id === scrim.id); return <article key={scrim.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111526]"><div className="flex flex-wrap items-center gap-4 border-b border-white/10 p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black ${result(scrim) === 'W' ? 'bg-emerald-500/15 text-emerald-300' : result(scrim) === 'L' ? 'bg-red-500/15 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}`}>{result(scrim)}</div><div className="min-w-[150px] flex-1"><p className="font-display text-xl font-bold uppercase text-white">Beşiktaş <span className="text-slate-500">vs</span> {scrim.opponent}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" /> {scrim.played_at}{scrim.notes ? ` · ${scrim.notes}` : ''}</p></div><p className="font-display text-3xl font-bold text-white">{scrim.our_score} : {scrim.their_score}</p><button onClick={() => toggleLineup(scrim.id)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20">{expandedScrims.has(scrim.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{expandedScrims.has(scrim.id) ? 'Hide lineup' : 'Show lineup'}</button>{canManage && <div className="flex gap-2"><button onClick={() => edit(scrim)} className="rounded-lg bg-white/10 p-2 text-slate-300 hover:text-white"><Edit3 className="h-4 w-4" /></button><button onClick={() => remove(scrim.id)} className="rounded-lg bg-white/10 p-2 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div>}</div>{expandedScrims.has(scrim.id) && <div className="relative overflow-hidden bg-[#061819] p-5"><div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(72,180,173,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(72,180,173,0.1)_1px,transparent_1px)] [background-size:100%_72px,100%_100%]" /><div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8"><p className="self-start text-xs font-bold uppercase tracking-widest text-blue-300">Match lineup</p><MatchFormationRow matchPlayers={matchPlayers.slice(0, 3)} players={players} positions={positions.slice(0, 3)} /><MatchFormationRow matchPlayers={matchPlayers.slice(3, 6)} players={players} positions={positions.slice(3, 6)} /><MatchFormationRow matchPlayers={matchPlayers.slice(6, 7)} players={players} positions={positions.slice(6, 7)} /></div>{matchPlayers.length === 0 && <p className="relative mt-8 text-center text-sm text-slate-500">No lineup added for this scrim yet.</p>}</div>}</article>; })}</div>}
  </section>;
}

function MatchFormationRow({ matchPlayers, players, positions }: { matchPlayers: ScrimPlayer[]; players: Player[]; positions: string[] }) {
  const indexes = matchPlayers.length === 1 ? [0] : [0, 1, 2];
  return <div className="flex w-full justify-center gap-4 sm:gap-16">{indexes.map((index) => { const matchPlayer = matchPlayers[index]; const player = matchPlayer ? players.find((item) => item.id === matchPlayer.player_id) : undefined; return <MatchPlayerCard key={matchPlayer?.id ?? index} matchPlayer={matchPlayer} player={player} position={positions[index]} elevated={matchPlayers.length > 1 && index === 1} />; })}</div>;
}

function MatchPlayerCard({ matchPlayer, player, position, elevated }: MatchPlayerCardProps & { position: string | undefined; elevated: boolean }) {
  if (!matchPlayer) return <div className="w-24 sm:w-32" />;
  return <div className={`w-24 text-center sm:w-32 ${elevated ? '-translate-y-3' : ''}`}><div className="mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-blue-500/70 bg-gradient-to-br from-blue-500/40 to-[#12233e] shadow-[0_0_20px_rgba(37,99,235,0.3)] sm:h-20 sm:w-20">{player?.avatar_url ? <img src={player.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-display text-xl font-bold text-white">{player?.nickname.slice(0, 2).toUpperCase() ?? 'PL'}</div>}</div><p className="mt-2 truncate text-sm font-semibold text-white">{player?.nickname ?? 'Player'}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{position ?? 'Player'}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">{matchPlayer.rating}/10</p><div className="mt-2 flex flex-wrap justify-center gap-1 text-[9px] text-slate-400"><span className="rounded bg-white/5 px-1.5 py-1">G {matchPlayer.goals}</span><span className="rounded bg-white/5 px-1.5 py-1">A {matchPlayer.assists}</span><span className="rounded bg-white/5 px-1.5 py-1">T {matchPlayer.tackles}</span><span className="rounded bg-white/5 px-1.5 py-1">S {matchPlayer.saves}</span></div></div>;
}
