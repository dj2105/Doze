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

interface GameRoom {
  state: GameState;
  connections: Partial<Record<PlayerId, WebSocket>>;
  testingTimer?: NodeJS.Timeout;
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
  payload: ClientToServerMessage & { payload: { packType: string; testing: boolean; specificFile?: string; _requestId?: string } }['payload'],
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
    testingMode: payload.testing
  };

  const room: GameRoom = { state, connections: { ONE: socket } };
  games.set(code, room);
  socketDirectory.set(socket, { gameId: code, player: 'ONE' });
  respond(socket, { type: 'GAME_CREATED', payload: { gameId: code, state } }, requestId);
  broadcastState(room);
  if (payload.testing) {
    startTestingTimer(room);
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
  if (correct) {
    playerState.score += round?.pointsPerCorrect ?? 1;
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
  if (room.state.players.ONE.answeredIds.length >= room.state.rounds.length && room.state.players.TWO.answeredIds.length >= room.state.rounds.length) {
    room.state.phase = 'final';
    if (room.testingTimer) {
      clearInterval(room.testingTimer);
    }
  }
}

function startTestingTimer(room: GameRoom) {
  const loop = () => {
    if (room.state.phase === 'final') {
      if (room.testingTimer) {
        clearInterval(room.testingTimer);
      }
      return;
    }
    const bot = room.state.players.TWO;
    const incoming = bot.incomingQuestionId;
    if (incoming) {
      const question = room.state.questionBank[incoming];
      if (!question) return;
      const shouldBeCorrect = Math.random() > 0.4;
      const options = [question.correctAnswer, ...question.distractors];
      const answer = shouldBeCorrect ? question.correctAnswer : options[Math.floor(Math.random() * options.length)];
      handleAnswerQuestion({ gameId: room.state.id, player: 'TWO', questionId: incoming, answer });
      return;
    }
    if (bot.stack.length) {
      handleSendQuestion({ gameId: room.state.id, player: 'TWO' });
    }
  };
  room.testingTimer = setInterval(loop, 3500);
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
