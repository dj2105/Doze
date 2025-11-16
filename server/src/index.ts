import { WebSocketServer, WebSocket } from 'ws';
import { drawQuestions } from '@shared/data/questions';
import type {
  BannerEvent,
  ClientToServerMessage,
  GameState,
  PlayerId,
  PlayerStackItem,
  RoundConfig,
  ServerToClientMessage
} from '@shared/types/game';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3001);

interface TestingBotState {
  sendTimeout?: NodeJS.Timeout;
  answerTimeout?: NodeJS.Timeout;
}

interface GameRoom {
  state: GameState;
  connections: Partial<Record<PlayerId, WebSocket>>;
  testingBot?: TestingBotState;
}

const games = new Map<string, GameRoom>();
const socketDirectory = new Map<WebSocket, { gameId: string; player: PlayerId }>();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as ClientToServerMessage & { payload?: { _requestId?: string } };
      handleMessage(socket, message);
    } catch (error) {
      console.error('Invalid payload', error);
      socket.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid payload' } } satisfies ServerToClientMessage));
    }
  });

  socket.on('close', () => {
    const meta = socketDirectory.get(socket);
    if (meta) {
      const room = games.get(meta.gameId);
      if (room) {
        delete room.connections[meta.player];
      }
    }
    socketDirectory.delete(socket);
  });
});

function handleMessage(socket: WebSocket, message: ClientToServerMessage & { payload?: { _requestId?: string } }) {
  const requestId = message.payload?._requestId;
  switch (message.type) {
    case 'CREATE_GAME':
      handleCreateGame(socket, message.payload, requestId);
      break;
    case 'JOIN_GAME':
      handleJoinGame(socket, message.payload, requestId);
      break;
    case 'SEND_QUESTION':
      handleSendQuestion(message.payload);
      break;
    case 'ANSWER_QUESTION':
      handleAnswerQuestion(message.payload);
      break;
    case 'SYNC_REQUEST':
      handleSync(socket, message.payload, requestId);
      break;
  }
}

function handleCreateGame(
  socket: WebSocket,
  payload: ClientToServerMessage & {
    payload: { packType: string; testingMode: boolean; specificFile?: string; _requestId?: string };
  }['payload'],
  requestId?: string
) {
  const code = generateGameCode();
  const questions = drawQuestions();
  const questionBank = Object.fromEntries(questions.map((question) => [question.id, question]));
  const rounds = buildRounds();
  const stackForPlayer = (seed: number): PlayerStackItem[] =>
    shuffle([...questions], seed).map((question, index) => ({ questionId: question.id, order: index }));

  const state: GameState = {
    id: code,
    createdAt: Date.now(),
    phase: 'playing',
    players: {
      ONE: {
        id: 'ONE',
        score: 0,
        stack: stackForPlayer(1),
        answeredIds: []
      },
      TWO: {
        id: 'TWO',
        score: 0,
        stack: stackForPlayer(2),
        answeredIds: []
      }
    },
    questionBank,
    rounds,
    activeRound: 1,
    testingMode: payload.testingMode
  };

  const room: GameRoom = { state, connections: { ONE: socket } };
  games.set(code, room);
  socketDirectory.set(socket, { gameId: code, player: 'ONE' });
  respond(socket, { type: 'GAME_CREATED', payload: { gameId: code, state } }, requestId);
  broadcastState(room);
  if (state.testingMode) {
    setupTestingMode(room);
  }
}

function handleJoinGame(
  socket: WebSocket,
  payload: ClientToServerMessage & { payload: { gameId: string; player: PlayerId; _requestId?: string } }['payload'],
  requestId?: string
) {
  const room = games.get(payload.gameId);
  if (!room) {
    respond(socket, { type: 'ERROR', payload: { message: 'Game not found' } }, requestId);
    return;
  }
  room.connections[payload.player] = socket;
  socketDirectory.set(socket, { gameId: payload.gameId, player: payload.player });
  respond(socket, { type: 'GAME_JOINED', payload: { state: room.state } }, requestId);
  broadcastState(room);
}

function handleSendQuestion(payload: { gameId: string; player: PlayerId }) {
  const room = games.get(payload.gameId);
  if (!room) return;
  const sender = room.state.players[payload.player];
  const receiver = room.state.players[payload.player === 'ONE' ? 'TWO' : 'ONE'];
  const item = sender.stack.shift();
  if (!item) return;
  receiver.incomingQuestionId = item.questionId;
  receiver.awaitingAnswer = true;
  broadcastState(room);

  if (room.state.testingMode) {
    if (payload.player === 'TWO') {
      console.log(`Testing mode: TWO sent question ${item.questionId}`);
    } else if (payload.player === 'ONE' && receiver.id === 'TWO') {
      scheduleBotAnswer(room, item.questionId);
    }
  }
}

function handleAnswerQuestion(payload: { gameId: string; player: PlayerId; questionId: string; answer: string }) {
  const room = games.get(payload.gameId);
  if (!room) return;
  const playerState = room.state.players[payload.player];
  if (playerState.incomingQuestionId !== payload.questionId) return;

  const question = room.state.questionBank[payload.questionId];
  if (!question) return;
  const round = room.state.rounds.find((entry) => entry.roundNumber === room.state.activeRound);
  const correct = question.correctAnswer === payload.answer;
  const pointsAwarded = correct ? round?.pointsPerCorrect ?? 1 : 0;
  if (pointsAwarded) {
    playerState.score += pointsAwarded;
  }
  playerState.incomingQuestionId = undefined;
  playerState.awaitingAnswer = false;
  playerState.answeredIds.push(payload.questionId);

  const banner: BannerEvent = {
    id: crypto.randomUUID(),
    player: payload.player,
    correct,
    selectedAnswer: payload.answer
  };
  room.state.banner = banner;

  advanceRound(room);
  broadcastState(room);
  broadcast(room, { type: 'BANNER', payload: { banner } });

  if (room.state.testingMode) {
    if (payload.player === 'TWO') {
      console.log(
        `Testing mode: TWO answered ${correct ? 'correctly' : 'incorrectly'} (selected "${payload.answer}")`
      );
      const roundNumber = round?.roundNumber ?? room.state.activeRound;
      console.log(`Testing mode: TWO earned ${pointsAwarded} points in round ${roundNumber}`);
    }
    scheduleBotSend(room);
  }
}

function handleSync(
  socket: WebSocket,
  payload: ClientToServerMessage & { payload: { gameId: string; player: PlayerId; _requestId?: string } }['payload'],
  requestId?: string
) {
  const room = games.get(payload.gameId);
  if (!room) {
    respond(socket, { type: 'ERROR', payload: { message: 'Game not found' } }, requestId);
    return;
  }
  respond(socket, { type: 'STATE_UPDATE', payload: { state: room.state } }, requestId);
}

function respond(socket: WebSocket, message: ServerToClientMessage, requestId?: string) {
  const payload = 'payload' in message && requestId ? { ...message.payload, _requestId: requestId } : message.payload;
  socket.send(JSON.stringify({ ...message, payload }));
}

function broadcastState(room: GameRoom) {
  broadcast(room, { type: 'STATE_UPDATE', payload: { state: room.state } });
}

function broadcast(room: GameRoom, message: ServerToClientMessage) {
  Object.values(room.connections).forEach((socket) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  });
}

function advanceRound(room: GameRoom) {
  const answeredCount = Math.max(room.state.players.ONE.answeredIds.length, room.state.players.TWO.answeredIds.length);
  room.state.activeRound = Math.min(answeredCount + 1, room.state.rounds.length);
  if (
    room.state.players.ONE.answeredIds.length >= room.state.rounds.length &&
    room.state.players.TWO.answeredIds.length >= room.state.rounds.length
  ) {
    room.state.phase = 'final';
    clearTestingBot(room);
  }
}

function setupTestingMode(room: GameRoom) {
  if (!room.state.testingMode) return;
  if (!room.testingBot) {
    room.testingBot = {};
  }
  scheduleBotSend(room);
}

function scheduleBotSend(room: GameRoom) {
  if (!room.state.testingMode) return;
  if (!room.testingBot) {
    room.testingBot = {};
  }
  if (room.testingBot.sendTimeout || room.state.phase === 'final') return;
  const delay = randomBetween(2000, 6000);
  room.testingBot.sendTimeout = setTimeout(() => {
    if (!room.testingBot) return;
    room.testingBot.sendTimeout = undefined;
    if (room.state.phase === 'final') return;
    const bot = room.state.players.TWO;
    const opponent = room.state.players.ONE;
    if (!bot.stack.length) return;
    if (opponent.incomingQuestionId) {
      scheduleBotSend(room);
      return;
    }
    handleSendQuestion({ gameId: room.state.id, player: 'TWO' });
  }, delay);
}

function scheduleBotAnswer(room: GameRoom, questionId: string) {
  if (!room.state.testingMode) return;
  if (!room.testingBot) {
    room.testingBot = {};
  }
  if (room.testingBot.answerTimeout) {
    clearTimeout(room.testingBot.answerTimeout);
  }
  const delay = randomBetween(3000, 8000);
  room.testingBot.answerTimeout = setTimeout(() => {
    if (!room.testingBot) return;
    room.testingBot.answerTimeout = undefined;
    if (room.state.phase === 'final') return;
    const bot = room.state.players.TWO;
    if (bot.incomingQuestionId !== questionId) {
      if (bot.incomingQuestionId) {
        scheduleBotAnswer(room, bot.incomingQuestionId);
      }
      return;
    }
    const question = room.state.questionBank[questionId];
    if (!question) return;
    const roundNumber = bot.answeredIds.length + 1;
    const accuracy = getBotAccuracy(roundNumber);
    const shouldBeCorrect = Math.random() < accuracy;
    const answer = shouldBeCorrect
      ? question.correctAnswer
      : question.distractors[Math.floor(Math.random() * question.distractors.length)];
    handleAnswerQuestion({ gameId: room.state.id, player: 'TWO', questionId, answer });
  }, delay);
}

function getBotAccuracy(roundNumber: number) {
  if (roundNumber <= 4) return 0.7;
  if (roundNumber <= 8) return 0.6;
  return 0.5;
}

function clearTestingBot(room: GameRoom) {
  if (!room.testingBot) return;
  if (room.testingBot.sendTimeout) {
    clearTimeout(room.testingBot.sendTimeout);
  }
  if (room.testingBot.answerTimeout) {
    clearTimeout(room.testingBot.answerTimeout);
  }
  room.testingBot = undefined;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGameCode() {
  const parts = Array.from({ length: 3 }, () => String(Math.floor(Math.random() * 100)).padStart(2, '0'));
  return parts.join('-');
}

function buildRounds(): RoundConfig[] {
  const configs: RoundConfig[] = [];
  for (let roundNumber = 1; roundNumber <= 12; roundNumber += 1) {
    let tier: 1 | 2 | 3 = 1;
    if (roundNumber >= 5 && roundNumber <= 8) tier = 2;
    if (roundNumber >= 9) tier = 3;
    configs.push({
      roundNumber,
      tier,
      distractorCount: tier,
      pointsPerCorrect: tier
    });
  }
  return configs;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(seed + i) * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function random(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

console.log(`WebSocket server running on ws://localhost:${PORT}`);
