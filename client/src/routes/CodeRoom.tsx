import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const CodeRoom = () => {
  const { gameId = '' } = useParams();
  const shareUrl = `${window.location.origin}/game/${gameId}?joinAs=TWO`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join my Doze game', url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    alert('Link copied!');
  }, [shareUrl]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-sm uppercase tracking-[0.5em] text-white/60">Game code</p>
      <p className="text-5xl font-black tracking-[0.3em] text-sand">{gameId}</p>
      <motion.button whileTap={{ scale: 0.96 }} className="rounded-full bg-white/90 px-6 py-3 text-slate-900" onClick={handleShare}>
        Copy link
      </motion.button>
      <Link to="/" className="text-sm text-white/70 underline">
        Back to lobby
      </Link>
    </div>
  );
};

export default CodeRoom;
