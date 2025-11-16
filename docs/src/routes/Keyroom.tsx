import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameContext } from '../context/GameProvider';

const packOptions = ['placeholder', 'random', 'specific'] as const;
type PackOption = (typeof packOptions)[number];

const Keyroom = () => {
  const { createGame } = useGameContext();
  const [packChoice, setPackChoice] = useState<PackOption>('placeholder');
  const [testing, setTesting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>();
  const [status, setStatus] = useState<string>();
  const navigate = useNavigate();

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!event.target.files) return;
    const next = Array.from(event.target.files);
    setFiles(next);
    setSelectedFile(next[0]?.name);
  };

  const handleStart = async () => {
    try {
      setStatus('Creating game...');
      const gameId = await createGame(packChoice, testing, selectedFile);
      navigate(`/code/${gameId}`);
    } catch (error) {
      console.error(error);
      setStatus('Failed to start game.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">Keyroom</p>
        <h1 className="text-3xl font-bold">Create a duel</h1>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="flex flex-1 flex-col gap-1 text-xs uppercase tracking-widest text-white/70">
            Pack source
            <select
              value={packChoice}
              onChange={(event) => setPackChoice(event.target.value as PackOption)}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-base text-white"
            >
              <option value="placeholder">Placeholder</option>
              <option value="random">Random</option>
              <option value="specific">Specific</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={testing}
              onChange={(event) => setTesting(event.target.checked)}
              className="h-5 w-5 rounded border-white/30 bg-transparent"
            />
            Testing
          </label>
          <motion.button whileTap={{ scale: 0.97 }} className="rounded-2xl bg-sky px-6 py-3 text-slate-900" onClick={handleStart}>
            Start game
          </motion.button>
        </div>
        {status && <p className="mt-2 text-xs text-white/60">{status}</p>}
      </div>

      <section className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Question packs</h2>
            <p className="text-xs text-white/60">Upload .json or .txt files</p>
          </div>
          <label className="cursor-pointer rounded-full border border-white/30 px-4 py-2 text-sm">
            Upload
            <input type="file" accept=".json,.txt" multiple hidden onChange={handleUpload} />
          </label>
        </div>
        <div className="mt-4 max-h-64 overflow-y-auto">
          {fileNames.length === 0 && <p className="text-sm text-white/50">No files yet.</p>}
          <ul className="flex flex-col divide-y divide-white/5">
            {fileNames.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-2 py-3 text-left text-sm ${
                    selectedFile === name ? 'text-sky' : 'text-white'
                  }`}
                  onClick={() => setSelectedFile(name)}
                >
                  <span>{name}</span>
                  {selectedFile === name && <span className="text-xs uppercase tracking-wide">Selected</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Keyroom;
