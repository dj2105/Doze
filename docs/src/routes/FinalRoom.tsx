import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameContext } from '../context/GameProvider';

const FinalRoom = () => {
  const { state } = useGameContext();
  const { gameId = '' } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) {
      navigate(`/game/${gameId}`);
    }
  }, [state, gameId, navigate]);

  const oneScore = state?.players.ONE.score ?? 0;
  const twoScore = state?.players.TWO.score ?? 0;

  let verdict = 'It’s a draw!';
  if (oneScore > twoScore) verdict = 'ONE takes the crown!';
  if (twoScore > oneScore) verdict = 'TWO rules the skies!';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xs uppercase tracking-[0.5em] text-white/60">Final scores</p>
      <h1 className="text-4xl font-black">{verdict}</h1>
      <div className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-2xl font-bold">
        <span>ONE</span>
        <span>{oneScore}</span>
      </div>
      <div className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-2xl font-bold">
        <span>TWO</span>
        <span>{twoScore}</span>
      </div>
      <Link to="/" className="mt-6 rounded-full border border-white/30 px-5 py-3 text-sm uppercase tracking-widest">
        Return to lobby
      </Link>
    </div>
  );
};

export default FinalRoom;
