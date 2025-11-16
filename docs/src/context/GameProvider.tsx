import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { GameState, PlayerId, BannerEvent } from '@shared/types/game';
import { gameClient } from '../lib/gameClient';

type PackChoice = 'placeholder' | 'random' | 'specific';

interface GameContextValue {
  state?: GameState;
  banner?: BannerEvent;
  createGame: (packType: PackChoice, testing: boolean, specificFile?: string) => Promise<string>;
  joinGame: (gameId: string, player: PlayerId) => Promise<GameState | undefined>;
  sendTopQuestion: (gameId: string, player: PlayerId) => void;
  answerQuestion: (gameId: string, player: PlayerId, questionId: string, answer: string) => void;
  sync: (gameId: string, player: PlayerId) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>();
  const [banner, setBanner] = useState<BannerEvent>();

  useEffect(() => {
    const unsubscribe = gameClient.onState((next) => setState(next));
    const unsubscribeBanner = gameClient.onBanner(({ banner: nextBanner }) => {
      setBanner(nextBanner);
      setTimeout(() => setBanner(undefined), 4200);
    });
    return () => {
      unsubscribe();
      unsubscribeBanner();
    };
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      banner,
      createGame: async (packType, testing, specificFile) => {
        const payload = (await gameClient.createGame(packType, testing, specificFile)) as { gameId: string };
        return payload.gameId;
      },
      joinGame: async (gameId, player) => {
        const payload = (await gameClient.joinGame(gameId, player)) as { state: GameState };
        return payload.state;
      },
      sendTopQuestion: (gameId, player) => gameClient.sendQuestion(gameId, player),
      answerQuestion: (gameId, player, questionId, answer) =>
        gameClient.answerQuestion(gameId, player, questionId, answer),
      sync: (gameId, player) => gameClient.sync(gameId, player)
    }),
    [state, banner]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return ctx;
};
