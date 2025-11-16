import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../context/GameProvider';
import type { PlayerId } from '@shared/types/game';

const RejoinRoom = () => {
  const { joinGame } = useGameContext();
  const [code, setCode] = useState('');
  const [player, setPlayer] = useState<PlayerId>('ONE');
  const [error, setError] = useState<string>();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await joinGame(code, player);
      navigate(`/game/${code}?joinAs=${player}`);
    } catch (err) {
      console.error(err);
      setError('Unable to rejoin.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">Rejoin a match</h1>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="text-xs uppercase text-white/60">Game code</label>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="##-##-##"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        />
        <label className="text-xs uppercase text-white/60">I am</label>
        <select
          value={player}
          onChange={(event) => setPlayer(event.target.value as PlayerId)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <option value="ONE">Player ONE</option>
          <option value="TWO">Player TWO</option>
        </select>
        <button type="submit" className="rounded-full bg-sky px-4 py-3 font-semibold text-slate-900">
          Rejoin
        </button>
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </form>
    </div>
  );
};

export default RejoinRoom;
