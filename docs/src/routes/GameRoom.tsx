import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Scoreboard from '../components/Scoreboard';
import QuestionStack from '../components/QuestionStack';
import PlaneBanner from '../components/PlaneBanner';
import { useGameContext } from '../context/GameProvider';
import type { PlayerId } from '@shared/types/game';

const GameRoom = () => {
  const { state, banner, sendTopQuestion, answerQuestion, sync } = useGameContext();
  const { gameId = '' } = useParams();
  const [params] = useSearchParams();
  const player = (params.get('joinAs') as PlayerId) ?? 'ONE';
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<string>();

  useEffect(() => {
    if (gameId) {
      sync(gameId, player);
    }
  }, [gameId, player, sync]);

  useEffect(() => {
    if (state?.phase === 'final' && gameId) {
      navigate(`/final/${gameId}`);
    }
  }, [state?.phase, gameId, navigate]);

  const incomingQuestion = useMemo(() => {
    if (!state) return undefined;
    const questionId = state.players[player].incomingQuestionId;
    if (!questionId) return undefined;
    return state.questionBank[questionId];
  }, [state, player]);

  const roundConfig = state?.rounds.find((round) => round.roundNumber === state.activeRound);

  const answerOptions = useMemo(() => {
    if (!incomingQuestion) return [];
    const distractorCount = roundConfig?.distractorCount ?? 1;
    const options = [incomingQuestion.correctAnswer, ...incomingQuestion.distractors.slice(0, distractorCount)];
    return options
      .map((text) => ({ text, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((entry) => entry.text);
  }, [incomingQuestion, roundConfig]);

  const handleSend = () => {
    if (!gameId) return;
    sendTopQuestion(gameId, player);
  };

  const handleAnswer = (answer: string) => {
    if (!incomingQuestion || !gameId) return;
    setSelectedAnswer(answer);
    answerQuestion(gameId, player, incomingQuestion.id, answer);
    setTimeout(() => setSelectedAnswer(undefined), 1200);
  };

  const playerLabel = player === 'ONE' ? 'Commander ONE' : 'Commander TWO';

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 px-4 pb-20 pt-6 text-white">
      <PlaneBanner banner={banner} />
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <header className="sticky top-4 z-10">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">{playerLabel}</p>
          <Scoreboard state={state} />
        </header>

        <section>
          <h2 className="mb-3 text-sm uppercase tracking-widest text-white/60">Question stack</h2>
          <QuestionStack state={state} player={player} onSend={handleSend} />
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-white/60">Incoming</h2>
          <div className="relative min-h-[220px]">
            <AnimatePresence mode="wait">
              {incomingQuestion ? (
                <motion.div
                  key={incomingQuestion.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18 }}
                  className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Round {state?.activeRound}</p>
                  <p className="mt-2 text-lg font-semibold leading-snug">{incomingQuestion.text}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {answerOptions.map((option) => (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAnswer(option)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                          selectedAnswer === option ? 'border-sky bg-sky/20' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl border border-dashed border-white/10 p-5 text-center text-sm text-white/60"
                >
                  Waiting for opponent to send a question...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameRoom;
