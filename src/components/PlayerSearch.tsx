import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Player } from '@/lib/supabase';
import PlayerCard from '@/components/PlayerCard';

export default function PlayerSearch({
  players,
  onSelect,
}: {
  players: Player[];
  onSelect: (player: Player) => void;
}) {
  const [query, setQuery] = useState('');
  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? players.filter((player) => player.nickname.toLowerCase().includes(normalizedQuery))
      : players;
  }, [players, query]);

  return (
    <section className="space-y-5">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a nickname..."
          className="w-full rounded-xl border border-white/10 bg-[#111526] py-4 pl-12 pr-12 text-base font-semibold text-white outline-none transition focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePlayers.map((player) => (
          <PlayerCard key={player.id} player={player} onClick={() => onSelect(player)} compact />
        ))}
      </div>
      {visiblePlayers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-slate-500">
          No players found. Add one from Manage Squad.
        </div>
      )}
    </section>
  );
}
