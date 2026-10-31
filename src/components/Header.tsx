import { ShieldCheck } from 'lucide-react';

const officialLogo = 'https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_Beşiktaş_JK.svg';

export default function Header() {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-transparent">
      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-5 sm:px-8 lg:pb-20">
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Official team hub
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <img
            src={officialLogo}
            alt="Beşiktaş JK official crest"
            className="mx-auto mb-7 h-20 w-auto drop-shadow-[0_0_26px_rgba(255,255,255,0.22)]"
          />
          <h1 className="font-display text-6xl font-bold uppercase leading-none tracking-[-0.04em] text-white sm:text-8xl">
            BESIKTAS
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Stats, results and highlights — all in one place. Track every goal, tackle and save across the season.
          </p>
        </div>
      </div>
    </header>
  );
}
