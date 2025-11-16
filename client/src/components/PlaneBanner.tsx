import { motion, AnimatePresence } from 'framer-motion';
import type { BannerEvent } from '@shared/types/game';

interface PlaneBannerProps {
  banner?: BannerEvent;
}

const PlaneBanner: React.FC<PlaneBannerProps> = ({ banner }) => (
  <AnimatePresence>
    {banner ? (
      <motion.div
        key={banner.id}
        initial={{ x: '100vw', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-120vw', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        className="pointer-events-none fixed top-4 left-0 right-0 z-30 mx-auto flex max-w-md items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-lg"
      >
        <span className="text-2xl">✈️</span>
        <div>
          <p className="font-semibold uppercase tracking-tight">{banner.player} update</p>
          <p className="text-xs text-slate-600">
            {banner.player} {banner.correct ? 'correctly' : 'incorrectly'} answered “{banner.selectedAnswer}”.
          </p>
        </div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default PlaneBanner;
