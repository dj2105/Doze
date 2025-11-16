import { useState } from 'react';
import { Reorder, motion } from 'framer-motion';
import type { GameState, PlayerStackItem } from '@shared/types/game';

interface QuestionStackProps {
  state?: GameState;
  player: 'ONE' | 'TWO';
  onSend: () => void;
}

const QuestionStack: React.FC<QuestionStackProps> = ({ state, player, onSend }) => {
  const stack = state?.players[player].stack ?? [];
  const [order, setOrder] = useState<PlayerStackItem[]>(stack);

  if (stack.length && order.length !== stack.length) {
    setOrder(stack);
  }

  return (
    <div className="flex flex-col gap-3">
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-3">
        {order.map((item, index) => {
          const question = state?.questionBank[item.questionId];
          return (
            <Reorder.Item
              key={item.questionId}
              value={item}
              className="rounded-2xl border border-white/15 bg-white/5 p-4 text-left text-sm text-white shadow-lg"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              whileDrag={{ scale: 1.02 }}
            >
              <p className="text-xs text-white/60">#{index + 1}</p>
            <p className="text-base font-semibold line-clamp-2">{question?.text ?? item.questionId}</p>
            <p className="text-xs text-white/60">Tap-hold to reorder</p>
          </Reorder.Item>
          );
        })}
      </Reorder.Group>
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full rounded-full bg-sky px-4 py-3 text-center font-semibold text-slate-900"
        onClick={onSend}
      >
        Send top question
      </motion.button>
    </div>
  );
};

export default QuestionStack;
