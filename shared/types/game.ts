export type PlayerId = 'ONE' | 'TWO';

export interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  distractors: [string, string, string];
  category?: string;
  difficulty?: 'medium' | 'medium-hard' | 'hard';
}

export interface PlayerStackItem {
  questionId: string;
  order: number;
}

export type RoundTier = 1 | 2 | 3;

export interface RoundConfig {
  roundNumber: number;
  tier: RoundTier;
  distractorCount: number;
  pointsPerCorrect: number;
}

export interface PlayerState {
  id: PlayerId;
  score: number;
  stack: PlayerStackItem[];
  answeredIds: string[];
  incomingQuestionId?: string;
  awaitingAnswer?: boolean;
}

export type GamePhase = 'lobby' | 'playing' | 'final';

export interface GameState {
  id: string;
  createdAt: number;
  phase: GamePhase;
  players: Record<PlayerId, PlayerState>;
  questionBank: Record<string, Question>;
  rounds: RoundConfig[];
  activeRound: number;
  testingMode: boolean;
  banner?: BannerEvent;
}

export interface BannerEvent {
  id: string;
  player: PlayerId;
  correct: boolean;
  selectedAnswer: string;
}

export type ClientToServerMessage =
  | {
      type: 'CREATE_GAME';
      payload: {
        packType: 'placeholder' | 'random' | 'specific';
        testingMode: boolean;
        specificFile?: string;
      };
    }
  | {
      type: 'JOIN_GAME';
      payload: { gameId: string; player: PlayerId };
    }
  | {
      type: 'SEND_QUESTION';
      payload: { gameId: string; player: PlayerId };
    }
  | {
      type: 'ANSWER_QUESTION';
      payload: { gameId: string; player: PlayerId; questionId: string; answer: string };
    }
  | {
      type: 'SYNC_REQUEST';
      payload: { gameId: string; player: PlayerId };
    };

export type ServerToClientMessage =
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'GAME_CREATED'; payload: { gameId: string; state: GameState } }
  | { type: 'GAME_JOINED'; payload: { state: GameState } }
  | { type: 'STATE_UPDATE'; payload: { state: GameState } }
  | { type: 'BANNER'; payload: { banner: BannerEvent } };
