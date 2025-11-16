import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameContext } from '../context/GameProvider';

const Lobby = () => {
  const { joinGame } = useGameContext();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.match(/\d{2}-\d{2}-\d{2}/)) {
      setError('Enter a code like 21-05-25');
      return;
    }
    setLoading(true);
    try {
      await joinGame(code, 'TWO');
      navigate(`/game/${code}`);
    } catch (err) {
      console.error(err);
      setError('Unable to join that room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 pb-16 pt-12">
      <div>
        <p className="text-sm uppercase tracking-widest text-white/60">Doze</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Pub quiz dogfights on your phone.</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 shadow-inner">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter game code"
          className="w-full rounded-xl bg-slate-900/60 px-3 py-3 text-lg tracking-[0.3em] text-center font-mono"
          maxLength={8}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky px-5 py-3 font-bold uppercase text-slate-900"
        >
          {loading ? '...' : 'Go'}
        </motion.button>
      </form>
      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/keyroom" className="rounded-full border border-white/20 px-4 py-2">
          Keyroom
        </Link>
        <Link to="/rejoin" className="rounded-full border border-white/20 px-4 py-2">
          Rejoin
        </Link>
        <Link to="/how-to-play" className="rounded-full border border-white/20 px-4 py-2">
          How to play
        </Link>
      </div>
    </div>
  );
};

export default Lobby;
