import type { Player } from '@/lib/supabase';
import { calculateOverall, getAvatarInitials } from '@/lib/ratings';
import { ArrowUpRight } from 'lucide-react';

export default function PlayerCard({
  player,
  onClick,
  compact = false,
}: {
  player: Player;
  onClick?: () => void;
  compact?: boolean;
}) {
  const overall = calculateOverall(player);

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111526] text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.3)] ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-300 to-pink-400 opacity-80" />
      <div className="flex items-center gap-4">
        {player.avatar_url ? (
          <img src={player.avatar_url} alt={player.nickname} className={`${compact ? 'h-14 w-14' : 'h-24 w-24'} rounded-2xl object-cover ring-1 ring-white/15`} />
        ) : (
          <div className={`${compact ? 'h-14 w-14 text-base' : 'h-24 w-24 text-3xl'} flex flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/40 to-slate-800 font-display font-bold text-white ring-1 ring-white/15`}>
            {getAvatarInitials(player.nickname)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold uppercase tracking-wide text-white">{player.nickname}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{player.matches_played} matches</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-white">{overall}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">OVR</p>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-5 grid grid-cols-4 gap-2 ${compact ? '' : 'mt-7'}`}>
        {[
          ['G', player.goals],
          ['A', player.assists],
          ['T', player.tackles],
          ['S', player.saves],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
            <p className="font-display text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-blue-300 opacity-0 transition group-hover:opacity-100">
        View full profile <ArrowUpRight className="h-4 w-4" />
      </div>
    </button>
  );
}
