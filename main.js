import {
  createGameState,
  clonePlayers,
  placeholderQuestions,
  sampleQuestions,
  parseUploadedPack,
  getDistractorCountForRound,
  getPointsForRound,
  buildOptions,
  generateGameCode,
  shuffle,
  randomDelay,
  buildQuestionPalette
} from './state/gameState.js';
import { renderLobby } from './rooms/lobby.js';
import { renderKeyRoom } from './rooms/keyRoom.js';
import { renderCodeRoom } from './rooms/codeRoom.js';
import { renderGameRoom } from './rooms/gameRoom.js';
import { renderFinalRoom } from './rooms/finalRoom.js';
import { renderHowToPlay } from './rooms/howToPlay.js';
import { renderRejoinRoom } from './rooms/rejoinRoom.js';
import { renderQuestionOverlay } from './ui/components.js';

const app = document.getElementById('app');
const state = createGameState();
let incomingResultTimer = null;

const rooms = {
  lobby: renderLobby,
  keyroom: renderKeyRoom,
  code: renderCodeRoom,
  game: renderGameRoom,
  final: renderFinalRoom,
  how: renderHowToPlay,
  rejoin: renderRejoinRoom
};

const actions = {
  navigate: (room) => {
    state.currentRoom = room;
    if (room !== 'game') {
      renderQuestionOverlay(null);
    }
    render();
  },
  startGame: (mode) => startGame(mode),
  setPackMode: (mode) => {
    state.packMode = mode;
    render();
  },
  selectPack: (id) => {
    state.selectedPackId = id;
    render();
  },
  uploadPacks: (files) => handleUploads(files),
  toggleTesting: (value) => {
    state.testingMode = value;
    render();
  },
  sendQuestion: (questionId) => {
    sendQuestion('ONE', questionId);
  },
  reorderQuestions: (order) => {
    state.players.ONE.questionOrder = order;
    saveSession();
    render();
  },
  loadSession: (code) => loadSession(code),
  copyShareLink: () => copyShareLink(),
  answerQuestion: (playerId, questionId, answer) => answerQuestion(playerId, questionId, answer),
  consumeOpponentResult: () => {
    state.pendingOpponentResult = null;
  }
};

function render() {
  const renderer = rooms[state.currentRoom] || renderLobby;
  renderer(app, state, actions);
}

function startGame(mode) {
  const pack = selectQuestionPack(mode);
  if (!pack || pack.questions.length < 12) {
    alert('Need at least 12 questions in the chosen pack.');
    return;
  }
  const chosen = sampleQuestions(pack.questions, 12);
  state.activeQuestions = {};
  chosen.forEach((question) => {
    state.activeQuestions[question.id] = question;
  });
  clearIncomingResultTimer();
  const baseIds = chosen.map((q) => q.id);
  state.players = clonePlayers(baseIds);
  state.questionColors = assignColors(baseIds);
  state.currentRound = 1;
  state.gameCode = generateGameCode();
  state.pendingQuestionOverlay = null;
  state.pendingOpponentResult = null;
  state.incomingResult = null;
  state.activeSendBoxQuestionId = null;
  state.sendBoxAnswer = null;
  state.prefilledCode = state.gameCode;
  state.currentRoom = 'code';
  saveSession();
  render();
}

function selectQuestionPack(mode) {
  if (mode === 'placeholder') {
    return { id: 'placeholder', name: 'Built-in', questions: placeholderQuestions };
  }
  if (!state.uploadedPacks.length) return null;
  if (mode === 'random') {
    return state.uploadedPacks[Math.floor(Math.random() * state.uploadedPacks.length)];
  }
  if (mode === 'specific') {
    if (!state.selectedPackId) return null;
    return state.uploadedPacks.find((pack) => pack.id === state.selectedPackId) || null;
  }
  return null;
}

async function handleUploads(files) {
  for (const file of files) {
    const text = await file.text();
    const questions = parseUploadedPack(file.name, text);
    if (!questions.length) continue;
    state.uploadedPacks.push({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${file.name} (${questions.length})`,
      questions
    });
  }
  render();
}

function sendQuestion(playerId, questionId) {
  const player = state.players[playerId];
  const chosenId = getNextAvailableQuestion(player, questionId);
  const opponentId = playerId === 'ONE' ? 'TWO' : 'ONE';
  if (!chosenId || player.sentQuestions.includes(chosenId)) return;
  if (playerId === 'ONE') {
    state.activeSendBoxQuestionId = chosenId;
    state.sendBoxAnswer = null;
  }
  player.sentQuestions.push(chosenId);
  receiveQuestion(opponentId, chosenId);
  saveSession();
  render();
  if (playerId === 'ONE' && state.testingMode) {
    setTimeout(botSendQuestionIfNeeded, randomDelay());
  }
}

function receiveQuestion(playerId, questionId) {
  const question = state.activeQuestions[questionId];
  if (!question) return;
  if (state.testingMode && playerId === 'TWO') {
    botAnswerQuestion(questionId, question);
    return;
  }
  if (playerId === 'ONE') {
    state.incomingResult = null;
    clearIncomingResultTimer();
    const distractorCount = getDistractorCountForRound(state.currentRound);
    const options = buildOptions(question, distractorCount);
    state.pendingQuestionOverlay = { id: question.id, text: question.text, options };
  }
}

function answerQuestion(playerId, questionId, selectedAnswer) {
  const question = state.activeQuestions[questionId];
  if (!question) return null;
  const isCorrect = selectedAnswer === question.correctAnswer;
  const points = isCorrect ? getPointsForRound(state.currentRound) : 0;
  if (isCorrect) {
    state.players[playerId].score += points;
  }
  if (!state.players[playerId].answered.includes(questionId)) {
    state.players[playerId].answered.push(questionId);
  }
  if (playerId === 'ONE') {
    state.pendingQuestionOverlay = null;
    state.incomingResult = { questionId, isCorrect, points };
    clearIncomingResultTimer();
    incomingResultTimer = setTimeout(() => {
      state.incomingResult = null;
      saveSession();
      render();
    }, 2000);
  } else {
    state.pendingOpponentResult = {
      playerId,
      questionId,
      answer: selectedAnswer,
      isCorrect
    };
    state.sendBoxAnswer = { questionId, answer: selectedAnswer, isCorrect };
    setTimeout(() => {
      state.activeSendBoxQuestionId = null;
      state.sendBoxAnswer = null;
      saveSession();
      render();
    }, 5000);
  }
  maybeAdvanceRound();
  saveSession();
  render();
  return { isCorrect, points, message: isCorrect ? `Correct! +${points} points` : 'Incorrect. 0 points' };
}

function maybeAdvanceRound() {
  const completed = Math.min(state.players.ONE.answered.length, state.players.TWO.answered.length);
  state.currentRound = Math.min(12, completed + 1);
  if (state.players.ONE.answered.length >= 12 && state.players.TWO.answered.length >= 12) {
    finishGame();
  }
}

function finishGame() {
  clearIncomingResultTimer();
  state.currentRoom = 'final';
  state.pendingOpponentResult = null;
  renderQuestionOverlay(null);
  render();
}

function botSendQuestionIfNeeded() {
  const questionId = getNextAvailableQuestion(state.players.TWO);
  if (!questionId) return;
  sendQuestion('TWO', questionId);
}

function botAnswerQuestion(questionId, question) {
  const willBeCorrect = Math.random() < 0.65;
  const answer = willBeCorrect ? question.correctAnswer : shuffle([...question.distractors])[0];
  setTimeout(() => {
    answerQuestion('TWO', questionId, answer);
  }, randomDelay());
}

function saveSession() {
  if (!state.gameCode) return;
  const payload = {
    players: state.players,
    currentRound: state.currentRound,
    activeQuestions: state.activeQuestions,
    testingMode: state.testingMode,
    questionColors: state.questionColors,
    activeSendBoxQuestionId: state.activeSendBoxQuestionId,
    sendBoxAnswer: state.sendBoxAnswer,
    incomingResult: state.incomingResult
  };
  localStorage.setItem(`doze-session-${state.gameCode}`, JSON.stringify(payload));
}

function loadSession(code) {
  const stored = localStorage.getItem(`doze-session-${code}`);
  if (!stored) {
    alert('No saved session for that code on this device.');
    render();
    return;
  }
  const payload = JSON.parse(stored);
  clearIncomingResultTimer();
  state.players = payload.players;
  state.currentRound = payload.currentRound;
  state.activeQuestions = payload.activeQuestions;
  state.testingMode = payload.testingMode;
  state.questionColors = payload.questionColors || {};
  state.activeSendBoxQuestionId = payload.activeSendBoxQuestionId || null;
  state.sendBoxAnswer = payload.sendBoxAnswer || null;
  state.incomingResult = payload.incomingResult || null;
  if (!Object.keys(state.questionColors).length && state.players.ONE.questionOrder?.length) {
    state.questionColors = assignColors(state.players.ONE.questionOrder);
  }
  state.gameCode = code;
  state.pendingQuestionOverlay = null;
  state.pendingOpponentResult = null;
  state.prefilledCode = code;
  state.currentRoom = 'game';
  render();
}

async function copyShareLink() {
  const shareUrl = `${location.origin}${location.pathname}?code=${state.gameCode}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (error) {
    alert('Copy failed.');
    return false;
  }
}

function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (code) {
    state.prefilledCode = code;
    loadSession(code);
    return true;
  }
  return false;
}

function getNextAvailableQuestion(player, chosenId) {
  if (chosenId && !player.sentQuestions.includes(chosenId)) {
    return chosenId;
  }
  return player.questionOrder.find((id) => !player.sentQuestions.includes(id)) || null;
}

function assignColors(questionIds) {
  const palette = buildQuestionPalette(questionIds.length || 12);
  const map = {};
  questionIds.forEach((id, idx) => {
    map[id] = palette[idx % palette.length];
  });
  return map;
}

if (!initFromUrl()) {
  render();
}

function clearIncomingResultTimer() {
  if (incomingResultTimer) {
    clearTimeout(incomingResultTimer);
    incomingResultTimer = null;
  }
}
