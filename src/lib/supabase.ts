import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  overall_rating: number;
  goals: number;
  assists: number;
  tackles: number;
  saves: number;
  matches_played: number;
  created_at: string;
};

export type Highlight = {
  id: string;
  title: string;
  clip_url: string;
  thumbnail_url: string | null;
  player_id: string | null;
  created_at: string;
};

export type Scrim = {
  id: string;
  opponent: string;
  our_score: number;
  their_score: number;
  rating: number;
  played_at: string;
  notes: string | null;
  created_at: string;
};

export type ScrimPlayer = {
  id: string;
  scrim_id: string;
  player_id: string;
  position: string | null;
  goals: number;
  assists: number;
  tackles: number;
  saves: number;
  rating: number;
  created_at: string;
};

export type PlayerStatKey = 'overall_rating' | 'goals' | 'assists' | 'tackles' | 'saves' | 'matches_played';
