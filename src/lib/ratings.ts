import type { Player } from '@/lib/supabase';

export function calculateOverall(player: Player): number {
  return Math.max(0, Math.min(99, player.overall_rating));
}

export function getTopPlayers(squad: Player[], count = 5): Player[] {
  return [...squad].sort((a, b) => calculateOverall(b) - calculateOverall(a)).slice(0, count);
}

export function getAvatarInitials(nickname: string): string {
  return nickname.slice(0, 2).toUpperCase();
}
