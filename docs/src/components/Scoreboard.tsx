import type { GameState } from '@shared/types/game';

interface ScoreboardProps {
  state?: GameState;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ state }) => {
  const oneScore = state?.players.ONE.score ?? 0;
  const twoScore = state?.players.TWO.score ?? 0;
  const round = state?.activeRound ?? 1;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm uppercase tracking-wide">
      <div className="flex flex-col text-left">
        <span className="text-xs text-white/60">Round</span>
        <span className="text-lg font-semibold text-sand">{round}</span>
      </div>
      <div className="flex flex-col text-center">
        <span className="text-xs text-white/60">ONE</span>
        <span className="text-2xl font-bold text-sky">{oneScore}</span>
      </div>
      <div className="h-8 w-px bg-white/20" />
      <div className="flex flex-col text-center">
        <span className="text-xs text-white/60">TWO</span>
        <span className="text-2xl font-bold text-emerald-300">{twoScore}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
