import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Film, LayoutDashboard, LogIn, LogOut, Search, Settings, Trophy, Users } from 'lucide-react';
import Header from '@/components/Header';
import PlayerSearch from '@/components/PlayerSearch';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import Leaderboard from '@/components/Leaderboard';
import Highlights from '@/components/Highlights';
import ManagePanel from '@/components/ManagePanel';
import ScrimHistory from '@/components/ScrimHistory';
import AuthPanel from '@/components/AuthPanel';
import AccountManager from '@/components/AccountManager';
import { adminRequest, type AdminRole } from '@/lib/adminApi';
import { calculateOverall, getTopPlayers } from '@/lib/ratings';
import { supabase, type Highlight, type Player, type Scrim, type ScrimPlayer } from '@/lib/supabase';

type View = 'overview' | 'squad' | 'weekly' | 'highlights' | 'scrims' | 'manage';
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [scrimPlayers, setScrimPlayers] = useState<ScrimPlayer[]>([]);
  const [view, setView] = useState<View>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: playerData }, { data: highlightData }, { data: scrimData }, { data: scrimPlayerData }] = await Promise.all([
      supabase.from('players').select('*').order('overall_rating', { ascending: false }),
      supabase.from('highlights').select('*').order('created_at', { ascending: false }),
      supabase.from('scrims').select('*').order('played_at', { ascending: false }),
      supabase.from('scrim_players').select('*'),
    ]);
    setPlayers((playerData ?? []) as Player[]);
    setHighlights((highlightData ?? []) as Highlight[]);
    setScrims((scrimData ?? []) as Scrim[]);
    setScrimPlayers((scrimPlayerData ?? []) as ScrimPlayer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
      if (data.session) adminRequest('me').then((result) => setCurrentRole(result.account?.role as AdminRole ?? null)).catch(() => setCurrentRole(null));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      if (!session) {
        setCurrentRole(null);
        return;
      }
      (async () => {
        try {
          const result = await adminRequest('me');
          setCurrentRole(result.account?.role as AdminRole ?? null);
        } catch {
          setCurrentRole(null);
        }
      })();
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchData]);

  const totals = useMemo(() => ({ goals: players.reduce((total, player) => total + player.goals, 0), matches: scrims.length }), [players, scrims.length]);
  const topPlayers = useMemo(() => getTopPlayers(players, 4), [players]);
  const canManage = Boolean(sessionEmail && currentRole);

  const handlePlayerUpdated = (player: Player) => {
    setPlayers((current) => current.some((item) => item.id === player.id) ? current.map((item) => item.id === player.id ? player : item) : [...current, player]);
    setSelectedPlayer(player);
  };
  const handlePlayerDeleted = (id: string) => {
    setPlayers((current) => current.filter((player) => player.id !== id));
    setSelectedPlayer(null);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentRole(null);
    setView('overview');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/406d70d42745727444b6ebcd3f3e3a11%20copy%203.jpg')] bg-cover bg-center bg-no-repeat opacity-100" />
      </div>

      <div className="relative z-10">
        <Header />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav className="-mt-7 relative z-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#111526]/95 p-2 shadow-2xl md:justify-start">
            <NavItem active={view === 'overview'} onClick={() => setView('overview')} icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
            <NavItem active={view === 'squad'} onClick={() => setView('squad')} icon={<Users className="h-4 w-4" />} label="View Squad" />
            <NavItem active={view === 'weekly'} onClick={() => setView('weekly')} icon={<Trophy className="h-4 w-4" />} label="Team of the Week" />
            <NavItem active={view === 'highlights'} onClick={() => setView('highlights')} icon={<Film className="h-4 w-4" />} label="Highlights" />
            <NavItem active={view === 'scrims'} onClick={() => setView('scrims')} icon={<BarChart3 className="h-4 w-4" />} label="Scrim History" />
            {canManage && <NavItem active={view === 'manage'} onClick={() => setView('manage')} icon={<Settings className="h-4 w-4" />} label="Manage Squad" />}
            <button onClick={canManage ? signOut : () => setShowAuth(true)} className="ml-0 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white/5 hover:text-white md:ml-auto">
              {canManage ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {canManage ? 'Sign out' : 'Admin sign in'}
            </button>
          </nav>

          <main className="py-10 sm:py-14">
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" /></div>
            ) : (
              <>
                {view === 'overview' && <Overview players={players} totals={totals} highlightsCount={highlights.length} topPlayers={topPlayers} scrims={scrims} onView={setView} onSelect={setSelectedPlayer} />}
                {view === 'squad' && <section className="animate-fade-in"><SectionHeading eyebrow="Squad directory" title="View squad" icon={<Search className="h-5 w-5" />} /><PlayerSearch players={players} onSelect={setSelectedPlayer} /></section>}
                {view === 'weekly' && <div className="animate-fade-in"><Leaderboard players={players} onSelect={setSelectedPlayer} /></div>}
                {view === 'highlights' && <div className="animate-fade-in"><Highlights highlights={highlights} players={players} canManage={canManage} onCreated={(highlight) => setHighlights((current) => [highlight, ...current])} /></div>}
                {view === 'scrims' && <div className="animate-fade-in"><ScrimHistory scrims={scrims} players={players} lineups={scrimPlayers} canManage={canManage} onChanged={fetchData} /></div>}
                {view === 'manage' && canManage && <div className="animate-fade-in space-y-6"><ManagePanel players={players} onPlayerUpdated={handlePlayerUpdated} onPlayerDeleted={handlePlayerDeleted} />{(currentRole === 'owner' || currentRole === 'admin') && <AccountManager role={currentRole} />}</div>}
              </>
            )}
          </main>
        </div>
        <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.2em] text-slate-600">Beşiktaş Scrim Team · Official Stats Hub</footer>
      </div>

      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {showAuth && <AuthPanel onClose={() => setShowAuth(false)} onSuccess={(role) => { setCurrentRole(role as AdminRole); setShowAuth(false); }} />}
    </div>
  );
}

function Overview({ players, totals, highlightsCount, topPlayers, scrims, onView, onSelect }: { players: Player[]; totals: { goals: number; matches: number }; highlightsCount: number; topPlayers: Player[]; scrims: Scrim[]; onView: (view: View) => void; onSelect: (player: Player) => void }) {
  const record = scrims.reduce((acc, s) => { if (s.our_score > s.their_score) acc.w++; else if (s.our_score < s.their_score) acc.l++; else acc.d++; return acc; }, { w: 0, l: 0, d: 0 });
  const avgRating = players.length ? Math.round(players.reduce((sum, p) => sum + calculateOverall(p), 0) / players.length) : 0;
  return <div className="animate-fade-in space-y-12"><div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Season dashboard</p><h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">The squad at a glance</h2></div><div className="flex gap-3"><button onClick={() => onView('squad')} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400">View squad</button><button onClick={() => onView('weekly')} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Team of the Week</button></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={<Users className="h-5 w-5" />} value={players.length} label="Squad players" tone="blue" /><Stat icon={<BarChart3 className="h-5 w-5" />} value={totals.goals} label="Goals scored" tone="pink" /><Stat icon={<Trophy className="h-5 w-5" />} value={totals.matches} label="Matches played" tone="green" /><Stat icon={<Film className="h-5 w-5" />} value={highlightsCount} label="Highlights" tone="yellow" /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={<Trophy className="h-5 w-5" />} value={record.w} label="Wins" tone="green" /><Stat icon={<BarChart3 className="h-5 w-5" />} value={record.l} label="Losses" tone="pink" /><Stat icon={<Users className="h-5 w-5" />} value={record.d} label="Draws" tone="yellow" /><Stat icon={<Trophy className="h-5 w-5" />} value={avgRating} label="Team OVR avg" tone="blue" /></div><section><SectionHeading eyebrow="Season leaders" title="Top performers" icon={<Trophy className="h-5 w-5" />} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{topPlayers.map((player) => <button key={player.id} onClick={() => onSelect(player)} className="rounded-2xl border border-white/10 bg-[#111526] p-5 text-left transition hover:-translate-y-1 hover:border-blue-400/40"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Top performer</span><span className="font-display text-3xl font-bold text-white">{calculateOverall(player)}</span></div><p className="mt-8 font-display text-2xl font-bold uppercase text-white">{player.nickname}</p><p className="mt-1 text-sm text-slate-500">{player.goals} goals · {player.assists} assists</p></button>)}</div></section></div>;
}

function Stat({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: 'blue' | 'pink' | 'green' | 'yellow' }) { const colors = { blue: 'text-blue-300 bg-blue-500/10', pink: 'text-pink-300 bg-pink-500/10', green: 'text-emerald-300 bg-emerald-500/10', yellow: 'text-yellow-300 bg-yellow-500/10' }; return <div className="rounded-2xl border border-white/10 bg-[#111526] p-5"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}>{icon}</div><p className="mt-6 font-display text-4xl font-bold text-white">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>; }
function SectionHeading({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: ReactNode }) { return <div className="mb-5 flex items-end gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">{icon}</div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p><h2 className="mt-1 font-display text-3xl font-bold uppercase text-white">{title}</h2></div></div>; }
function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) { return <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:px-4 ${active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{icon}{label}</button>; }
