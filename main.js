/**
 * File layout:
 * - index.html : static rooms (lobby, keyroom, code, game, final, how, rejoin)
 * - style.css  : mobile-first styling for cards, stacks, banners, animations
 * - main.js    : this file (ES module) controls state, rooms, drag logic, bot
 *   helpers/question data live in-module to keep hosting simple.
 */

// ---------- State ----------
const roomNodes = document.querySelectorAll('[data-room]');
const testingCheckbox = document.getElementById('testing-toggle');
const sendButton = document.getElementById('send-question');
const questionStackEl = document.getElementById('question-stack');
const incomingEl = document.getElementById('incoming-question');
const scoreOneEl = document.getElementById('score-one');
const scoreTwoEl = document.getElementById('score-two');
const roundEl = document.getElementById('round-display');
const scoreFloater = document.getElementById('score-floater');
const bannerEl = document.getElementById('banner');
const packListEl = document.getElementById('pack-list');
const packModeSelect = document.getElementById('pack-mode');
const gameCodeEl = document.getElementById('game-code');
const finalOneEl = document.getElementById('final-one');
const finalTwoEl = document.getElementById('final-two');
const finalResultEl = document.getElementById('final-result');

const players = {
  ONE: { score: 0, questionOrder: [], answered: [] },
  TWO: { score: 0, questionOrder: [], answered: [] }
};
let currentRound = 1;
let testingMode = false;
let currentIncomingQuestion = null; // { id, options: [] }
let activeQuestions = {}; // questionId -> question
let selectedPackId = null;
let uploadedPacks = [];
let gameCode = '';
let bannerTimer = null;
const urlParams = new URLSearchParams(location.search);
const incomingCode = urlParams.get('code');

// ---------- Room navigation ----------
const navButtons = document.querySelectorAll('[data-nav]');
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => showRoom(btn.dataset.nav));
});

function showRoom(room) {
  roomNodes.forEach((section) => {
    section.classList.toggle('hidden', section.dataset.room !== room);
  });
}

// Lobby + rejoin actions
const lobbyGoBtn = document.getElementById('lobby-go');
const lobbyCodeInput = document.getElementById('lobby-code');
const rejoinBtn = document.getElementById('rejoin-go');
const rejoinInput = document.getElementById('rejoin-code');

lobbyGoBtn.addEventListener('click', () => {
  const code = lobbyCodeInput.value.trim();
  if (!code) return;
  loadSession(code);
});

rejoinBtn.addEventListener('click', () => {
  const code = rejoinInput.value.trim();
  if (!code) return;
  loadSession(code);
});

// ---------- Game setup ----------
const startGameBtn = document.getElementById('start-game');
const uploadInput = document.getElementById('pack-upload');

startGameBtn.addEventListener('click', () => {
  testingMode = testingCheckbox.checked;
  const mode = packModeSelect.value;
  const pack = selectQuestionPack(mode);
  if (!pack || pack.questions.length < 12) {
    alert('Need at least 12 questions in the chosen pack.');
    return;
  }
  bootGame(pack);
});

uploadInput.addEventListener('change', async () => {
  const files = Array.from(uploadInput.files || []);
  for (const file of files) {
    const text = await file.text();
    const questions = parseUploadedPack(file.name, text);
    if (!questions.length) continue;
    const pack = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${file.name} (${questions.length})`,
      questions
    };
    uploadedPacks.push(pack);
  }
  renderPackList();
  uploadInput.value = '';
});

function renderPackList() {
  packListEl.innerHTML = '';
  uploadedPacks.forEach((pack) => {
    const li = document.createElement('li');
    li.textContent = pack.name;
    li.dataset.id = pack.id;
    if (selectedPackId === pack.id) li.classList.add('selected');
    li.addEventListener('click', () => {
      selectedPackId = pack.id;
      renderPackList();
    });
    packListEl.appendChild(li);
  });
}

function selectQuestionPack(mode) {
  if (mode === 'placeholder') {
    return { id: 'placeholder', name: 'Built-in', questions: placeholderQuestions };
  }
  if (!uploadedPacks.length) return null;
  if (mode === 'random') {
    const pick = uploadedPacks[Math.floor(Math.random() * uploadedPacks.length)];
    return pick;
  }
  if (mode === 'specific') {
    if (!selectedPackId) return null;
    return uploadedPacks.find((p) => p.id === selectedPackId) || null;
  }
  return null;
}

function bootGame(pack) {
  const chosen = sampleQuestions(pack.questions, 12);
  activeQuestions = {};
  chosen.forEach((q) => {
    activeQuestions[q.id] = q;
  });
  players.ONE = { score: 0, questionOrder: shuffle(chosen.map((q) => q.id)), answered: [] };
  players.TWO = { score: 0, questionOrder: shuffle(chosen.map((q) => q.id)), answered: [] };
  currentRound = 1;
  currentIncomingQuestion = null;
  gameCode = generateGameCode();
  gameCodeEl.textContent = gameCode;
  saveSession(gameCode);
  showRoom('code');
  updateUI();
}

function generateGameCode() {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(Math.random() * 100))}-${pad(Math.floor(Math.random() * 100))}-${pad(Math.floor(Math.random() * 100))}`;
}

function saveSession(code) {
  const payload = {
    players,
    currentRound,
    activeQuestions,
    testingMode,
    code
  };
  localStorage.setItem(`doze-session-${code}`, JSON.stringify(payload));
}

function loadSession(code) {
  const stored = localStorage.getItem(`doze-session-${code}`);
  if (!stored) {
    alert('No saved session for that code on this device.');
    return;
  }
  const payload = JSON.parse(stored);
  Object.assign(players.ONE, payload.players.ONE);
  Object.assign(players.TWO, payload.players.TWO);
  currentRound = payload.currentRound;
  activeQuestions = payload.activeQuestions;
  testingMode = payload.testingMode;
  gameCode = code;
  showRoom('game');
  updateUI();
}

// ---------- Question stack UI ----------
function updateStack() {
  questionStackEl.innerHTML = '';
  players.ONE.questionOrder.forEach((id, index) => {
    const li = document.createElement('li');
    li.className = 'stack-tile';
    li.textContent = `${index + 1}. ${activeQuestions[id]?.text || 'Unknown question'}`;
    li.dataset.id = id;
    attachDragHandlers(li);
    questionStackEl.appendChild(li);
  });
  sendButton.disabled = players.ONE.questionOrder.length === 0;
}

function attachDragHandlers(tile) {
  tile.addEventListener('pointerdown', (e) => {
    tile.setPointerCapture(e.pointerId);
    tile.classList.add('dragging');
    const handleMove = (ev) => {
      ev.preventDefault();
      const afterElement = getDragAfterElement(questionStackEl, ev.clientY);
      if (afterElement == null) {
        questionStackEl.appendChild(tile);
      } else {
        questionStackEl.insertBefore(tile, afterElement);
      }
    };
    const handleUp = () => {
      tile.classList.remove('dragging');
      tile.releasePointerCapture(e.pointerId);
      tile.removeEventListener('pointermove', handleMove);
      tile.removeEventListener('pointerup', handleUp);
      tile.removeEventListener('pointercancel', handleUp);
      const newOrder = Array.from(questionStackEl.children).map((el) => el.dataset.id);
      players.ONE.questionOrder = newOrder;
      saveSession(gameCode);
    };
    tile.addEventListener('pointermove', handleMove);
    tile.addEventListener('pointerup', handleUp);
    tile.addEventListener('pointercancel', handleUp);
  });
}

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.stack-tile:not(.dragging)')];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  elements.forEach((child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: child };
    }
  });
  return closest.element;
}

// ---------- Sending & receiving ----------
sendButton.addEventListener('click', () => {
  sendQuestion('ONE');
  if (testingMode) {
    setTimeout(botSendQuestionIfNeeded, randomDelay());
  }
});

function sendQuestion(playerId) {
  const player = players[playerId];
  const questionId = player.questionOrder[0];
  if (!questionId) return;
  player.questionOrder = player.questionOrder.slice(1);
  animateSentTile(questionId);
  const opponentId = playerId === 'ONE' ? 'TWO' : 'ONE';
  receiveQuestion(opponentId, questionId);
  updateUI();
  saveSession(gameCode);
}

function receiveQuestion(playerId, questionId) {
  const question = activeQuestions[questionId];
  if (!question) return;
  if (testingMode && playerId === 'TWO') {
    botAnswerQuestion(questionId, question);
    return;
  }
  showQuestionToPlayer(playerId, question);
}

function showQuestionToPlayer(playerId, question) {
  if (playerId !== 'ONE') return;
  const optionCount = 1 + getDistractorCountForRound(currentRound);
  const options = buildOptions(question, optionCount - 1);
  currentIncomingQuestion = { id: question.id, options };
  incomingEl.classList.remove('empty');
  incomingEl.innerHTML = `<h4>${question.text}</h4>`;
  const list = document.createElement('div');
  list.className = 'incoming-options';
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.addEventListener('click', () => {
      answerQuestion('ONE', question.id, option);
    });
    list.appendChild(btn);
  });
  incomingEl.appendChild(list);
}

function buildOptions(question, distractorCount) {
  const chosenDistractors = shuffle([...question.distractors]).slice(0, distractorCount);
  const options = shuffle([question.correctAnswer, ...chosenDistractors]);
  return options;
}

function answerQuestion(playerId, questionId, selectedAnswer) {
  const question = activeQuestions[questionId];
  if (!question) return;
  const isCorrect = selectedAnswer === question.correctAnswer;
  const points = getPointsForRound(currentRound);
  if (isCorrect) {
    players[playerId].score += points;
  }
  players[playerId].answered.push(questionId);
  if (playerId === 'ONE') {
    currentIncomingQuestion = null;
    incomingEl.classList.add('empty');
    incomingEl.innerHTML = '<p>Waiting for your opponent...</p>';
  }
  showScoreAnimation(playerId, isCorrect ? points : 0);
  showBanner(`${playerId} ${isCorrect ? 'correctly' : 'incorrectly'} answered "${selectedAnswer}"`);
  maybeAdvanceRound();
  updateUI();
  saveSession(gameCode);
}

function maybeAdvanceRound() {
  const completed = Math.min(players.ONE.answered.length, players.TWO.answered.length);
  currentRound = Math.min(12, completed + 1);
  if (players.ONE.answered.length >= 12 && players.TWO.answered.length >= 12) {
    finishGame();
  }
}

function finishGame() {
  finalOneEl.textContent = players.ONE.score;
  finalTwoEl.textContent = players.TWO.score;
  if (players.ONE.score > players.TWO.score) {
    finalResultEl.textContent = 'ONE wins!';
  } else if (players.ONE.score < players.TWO.score) {
    finalResultEl.textContent = 'TWO wins!';
  } else {
    finalResultEl.textContent = 'Draw game!';
  }
  showRoom('final');
}

function getDistractorCountForRound(round) {
  if (round <= 4) return 1;
  if (round <= 8) return 2;
  return 3;
}

function getPointsForRound(round) {
  if (round <= 4) return 1;
  if (round <= 8) return 2;
  return 3;
}

function showScoreAnimation(playerId, points) {
  scoreFloater.textContent = `${playerId} ${points > 0 ? '+' + points : '+0'}`;
  scoreFloater.classList.add('show');
  setTimeout(() => scoreFloater.classList.remove('show'), 700);
}

function showBanner(text) {
  bannerEl.textContent = text;
  bannerEl.classList.remove('hidden');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    bannerEl.classList.add('hidden');
  }, 4000);
}

function updateUI() {
  updateStack();
  scoreOneEl.textContent = players.ONE.score;
  scoreTwoEl.textContent = players.TWO.score;
  roundEl.textContent = `${currentRound} / 12`;
}

function animateSentTile(questionId) {
  const tile = questionStackEl.querySelector(`.stack-tile[data-id="${questionId}"]`);
  if (tile) {
    tile.classList.add('sent');
    setTimeout(() => tile.remove(), 400);
  }
}

// ---------- Bot helpers ----------
function botChooseQuestionToSend() {
  return players.TWO.questionOrder[0];
}

function botSendQuestionIfNeeded() {
  if (!testingMode) return;
  const qId = botChooseQuestionToSend();
  if (!qId) return;
  sendQuestion('TWO');
}

function botAnswerQuestion(questionId, question) {
  const correctProbability = 0.65;
  const willBeCorrect = Math.random() < correctProbability;
  const answer = willBeCorrect
    ? question.correctAnswer
    : shuffle([...question.distractors])[0];
  setTimeout(() => {
    answerQuestion('TWO', questionId, answer);
  }, randomDelay());
}

function randomDelay() {
  return 500 + Math.random() * 1500;
}

// ---------- Clipboard ----------
const copyBtn = document.getElementById('copy-code');
copyBtn.addEventListener('click', async () => {
  const shareUrl = `${location.origin}${location.pathname}?code=${gameCode}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy link'), 1500);
  } catch {
    alert('Copy failed');
  }
});

// ---------- Helpers ----------
function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function sampleQuestions(questions, n) {
  const pool = shuffle(questions);
  return pool.slice(0, n);
}

function parseUploadedPack(name, raw) {
  try {
    if (name.endsWith('.json')) {
      const data = JSON.parse(raw);
      return (data || []).map((q, idx) => normalizeQuestion(q, `${name}-${idx}`)).filter(Boolean);
    }
  } catch (err) {
    console.error('JSON parse failed', err);
  }
  // fallback to txt lines (question|correct|d1|d2|d3)
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines
    .map((line, idx) => {
      const [text, correct, ...distractors] = line.split('|').map((part) => part.trim());
      if (!text || !correct || distractors.length === 0) return null;
      return normalizeQuestion({ id: `${name}-${idx}`, text, correctAnswer: correct, distractors }, `${name}-${idx}`);
    })
    .filter(Boolean);
}

function normalizeQuestion(question, fallbackId) {
  if (!question) return null;
  const id = question.id || fallbackId;
  if (!id || !question.text || !question.correctAnswer || !Array.isArray(question.distractors)) return null;
  return {
    id,
    text: question.text,
    correctAnswer: question.correctAnswer,
    distractors: question.distractors
  };
}

// ---------- Placeholder pool (60 questions) ----------
const placeholderQuestions = [
  { id: 'q1', text: 'What element gives blood its red color?', correctAnswer: 'Iron', distractors: ['Copper', 'Magnesium', 'Chromium'] },
  { id: 'q2', text: 'Which mathematician introduced the concept of a Möbius strip?', correctAnswer: 'August Möbius', distractors: ['Leonhard Euler', 'Carl Gauss', 'Blaise Pascal'] },
  { id: 'q3', text: 'The city of Samarkand lies in which modern country?', correctAnswer: 'Uzbekistan', distractors: ['Kazakhstan', 'Iran', 'Azerbaijan'] },
  { id: 'q4', text: 'In chess, what is the only piece that can jump over another piece?', correctAnswer: 'Knight', distractors: ['Bishop', 'Queen', 'Rook'] },
  { id: 'q5', text: 'Which physicist proposed the uncertainty principle?', correctAnswer: 'Werner Heisenberg', distractors: ['Max Planck', 'Erwin Schrödinger', 'Niels Bohr'] },
  { id: 'q6', text: 'What is the capital of the Canadian province Saskatchewan?', correctAnswer: 'Regina', distractors: ['Saskatoon', 'Winnipeg', 'Edmonton'] },
  { id: 'q7', text: 'Who painted The Garden of Earthly Delights?', correctAnswer: 'Hieronymus Bosch', distractors: ['Pieter Bruegel the Elder', 'Sandro Botticelli', 'Jan van Eyck'] },
  { id: 'q8', text: 'Which river carved the Grand Canyon?', correctAnswer: 'Colorado River', distractors: ['Missouri River', 'Rio Grande', 'Snake River'] },
  { id: 'q9', text: 'What is the chemical formula for ozone?', correctAnswer: 'O3', distractors: ['O2', 'CO2', 'O2H'] },
  { id: 'q10', text: 'Which country is home to the wine region of Mendoza?', correctAnswer: 'Argentina', distractors: ['Chile', 'Spain', 'Portugal'] },
  { id: 'q11', text: 'The term “Viking” originally referred to people from which region?', correctAnswer: 'Scandinavia', distractors: ['The Baltics', 'Iberia', 'Gaul'] },
  { id: 'q12', text: 'Which poet wrote “Do not go gentle into that good night”?', correctAnswer: 'Dylan Thomas', distractors: ['W. H. Auden', 'T. S. Eliot', 'Seamus Heaney'] },
  { id: 'q13', text: 'In computing, what does the acronym RAID stand for?', correctAnswer: 'Redundant Array of Independent Disks', distractors: ['Random Access Integrated Data', 'Rapid Architecture Input Device', 'Read And Index Drive'] },
  { id: 'q14', text: 'Which Italian city is famous for its Palio horse race?', correctAnswer: 'Siena', distractors: ['Florence', 'Verona', 'Bologna'] },
  { id: 'q15', text: 'What is the rarest naturally occurring element on Earth?', correctAnswer: 'Astatine', distractors: ['Francium', 'Rhenium', 'Promethium'] },
  { id: 'q16', text: 'Who directed the film “Pan’s Labyrinth”?', correctAnswer: 'Guillermo del Toro', distractors: ['Alfonso Cuarón', 'Pedro Almodóvar', 'Alejandro González Iñárritu'] },
  { id: 'q17', text: 'The Battle of Agincourt took place during which war?', correctAnswer: 'Hundred Years’ War', distractors: ['War of the Roses', 'Thirty Years’ War', 'English Civil War'] },
  { id: 'q18', text: 'Which scientist discovered penicillin by accident?', correctAnswer: 'Alexander Fleming', distractors: ['Louis Pasteur', 'Joseph Lister', 'Robert Koch'] },
  { id: 'q19', text: 'What instrument measures atmospheric pressure?', correctAnswer: 'Barometer', distractors: ['Anemometer', 'Hygrometer', 'Altimeter'] },
  { id: 'q20', text: 'Which Greek island is famous for its windmills and nightlife?', correctAnswer: 'Mykonos', distractors: ['Crete', 'Rhodes', 'Santorini'] },
  { id: 'q21', text: 'Who wrote the essay “Civil Disobedience”?', correctAnswer: 'Henry David Thoreau', distractors: ['Ralph Waldo Emerson', 'Thomas Paine', 'Walt Whitman'] },
  { id: 'q22', text: 'The aorta is part of which body system?', correctAnswer: 'Circulatory system', distractors: ['Digestive system', 'Endocrine system', 'Nervous system'] },
  { id: 'q23', text: 'Which language family does Hungarian belong to?', correctAnswer: 'Uralic', distractors: ['Slavic', 'Romance', 'Germanic'] },
  { id: 'q24', text: 'In music, how many semitones are in a perfect fifth?', correctAnswer: 'Seven', distractors: ['Six', 'Eight', 'Nine'] },
  { id: 'q25', text: 'Who is the author of “Invisible Cities”?', correctAnswer: 'Italo Calvino', distractors: ['Umberto Eco', 'Gabriel García Márquez', 'José Saramago'] },
  { id: 'q26', text: 'Which scientist gave the law of universal gravitation?', correctAnswer: 'Isaac Newton', distractors: ['Galileo Galilei', 'Johannes Kepler', 'Tycho Brahe'] },
  { id: 'q27', text: 'What is the world’s largest species of owl?', correctAnswer: 'Blakiston’s fish owl', distractors: ['Great grey owl', 'Snowy owl', 'Eurasian eagle-owl'] },
  { id: 'q28', text: 'The state of Bhutan measures national progress using what index?', correctAnswer: 'Gross National Happiness', distractors: ['Human Development Index', 'Happy Planet Index', 'Quality of Life Index'] },
  { id: 'q29', text: 'Which gas is primarily responsible for the smell of rotten eggs?', correctAnswer: 'Hydrogen sulfide', distractors: ['Methane', 'Ammonia', 'Sulfur dioxide'] },
  { id: 'q30', text: 'What is the traditional Japanese art of flower arranging?', correctAnswer: 'Ikebana', distractors: ['Origami', 'Kintsugi', 'Sumi-e'] },
  { id: 'q31', text: 'Who composed the opera “The Barber of Seville”?', correctAnswer: 'Gioachino Rossini', distractors: ['Giuseppe Verdi', 'Gaetano Donizetti', 'Claudio Monteverdi'] },
  { id: 'q32', text: 'Which ocean current keeps Western Europe milder than other regions at similar latitudes?', correctAnswer: 'Gulf Stream', distractors: ['Canary Current', 'Kuroshio Current', 'California Current'] },
  { id: 'q33', text: 'Who was the first woman to win a Nobel Prize?', correctAnswer: 'Marie Curie', distractors: ['Lise Meitner', 'Dorothy Hodgkin', 'Rosalind Franklin'] },
  { id: 'q34', text: 'In mythology, who solved the riddle of the Sphinx?', correctAnswer: 'Oedipus', distractors: ['Perseus', 'Jason', 'Theseus'] },
  { id: 'q35', text: 'What is the smallest bone in the human body?', correctAnswer: 'Stapes', distractors: ['Incus', 'Malleus', 'Hyoid'] },
  { id: 'q36', text: 'Which U.S. landmark was designed by Frédéric Auguste Bartholdi?', correctAnswer: 'Statue of Liberty', distractors: ['Mount Rushmore', 'Golden Gate Bridge', 'Hoover Dam'] },
  { id: 'q37', text: 'What is the SI unit for electrical capacitance?', correctAnswer: 'Farad', distractors: ['Tesla', 'Henry', 'Siemens'] },
  { id: 'q38', text: 'Who wrote the play “Rosencrantz and Guildenstern Are Dead”?', correctAnswer: 'Tom Stoppard', distractors: ['Harold Pinter', 'Samuel Beckett', 'Edward Albee'] },
  { id: 'q39', text: 'Which country’s flag features a cedar tree?', correctAnswer: 'Lebanon', distractors: ['Cyprus', 'Tunisia', 'Jordan'] },
  { id: 'q40', text: 'What is the only mammal capable of sustained flight?', correctAnswer: 'Bat', distractors: ['Flying squirrel', 'Colugo', 'Flying lemur'] },
  { id: 'q41', text: 'Who discovered the moons of Jupiter known as the Galilean moons?', correctAnswer: 'Galileo Galilei', distractors: ['Nicolaus Copernicus', 'Johannes Kepler', 'Christiaan Huygens'] },
  { id: 'q42', text: 'Which desert covers much of Botswana and Namibia?', correctAnswer: 'Kalahari Desert', distractors: ['Namib Desert', 'Sahara Desert', 'Gobi Desert'] },
  { id: 'q43', text: 'What is the world’s deepest freshwater lake?', correctAnswer: 'Lake Baikal', distractors: ['Lake Tanganyika', 'Great Slave Lake', 'Crater Lake'] },
  { id: 'q44', text: 'Which 18th-century economist wrote “The Wealth of Nations”?', correctAnswer: 'Adam Smith', distractors: ['David Ricardo', 'Thomas Malthus', 'John Locke'] },
  { id: 'q45', text: 'The medical condition scurvy is caused by a deficiency in which vitamin?', correctAnswer: 'Vitamin C', distractors: ['Vitamin D', 'Vitamin B12', 'Vitamin A'] },
  { id: 'q46', text: 'What is the collective noun for a group of crows?', correctAnswer: 'A murder', distractors: ['A parliament', 'A gaggle', 'A knot'] },
  { id: 'q47', text: 'Which scientist coined the term “cell” for biological units?', correctAnswer: 'Robert Hooke', distractors: ['Antonie van Leeuwenhoek', 'Marcello Malpighi', 'Jan Swammerdam'] },
  { id: 'q48', text: 'What is the capital of the ancient Inca Empire?', correctAnswer: 'Cusco', distractors: ['Quito', 'La Paz', 'Lima'] },
  { id: 'q49', text: 'Which composer created the “Goldberg Variations”?', correctAnswer: 'Johann Sebastian Bach', distractors: ['George Frideric Handel', 'Antonio Vivaldi', 'Domenico Scarlatti'] },
  { id: 'q50', text: 'What kind of animal is a “Markhor”?', correctAnswer: 'Wild goat', distractors: ['Antelope', 'Wild sheep', 'Yak'] },
  { id: 'q51', text: 'Which explorer completed the first solo nonstop flight across the Atlantic?', correctAnswer: 'Charles Lindbergh', distractors: ['Amelia Earhart', 'Howard Hughes', 'Beryl Markham'] },
  { id: 'q52', text: 'The Richter scale is used to measure what?', correctAnswer: 'Earthquake magnitude', distractors: ['Tornado intensity', 'Volcanic explosivity', 'Hurricane strength'] },
  { id: 'q53', text: 'What is the main ingredient in the Japanese dish miso soup?', correctAnswer: 'Fermented soybean paste', distractors: ['Fish sauce', 'Buckwheat noodles', 'Seaweed gel'] },
  { id: 'q54', text: 'Which philosopher wrote “Being and Nothingness”?', correctAnswer: 'Jean-Paul Sartre', distractors: ['Martin Heidegger', 'Simone de Beauvoir', 'Albert Camus'] },
  { id: 'q55', text: 'What is the longest river entirely within France?', correctAnswer: 'Loire', distractors: ['Seine', 'Garonne', 'Rhone'] },
  { id: 'q56', text: 'In astronomy, what is a pulsar?', correctAnswer: 'Rapidly rotating neutron star', distractors: ['Binary white dwarf', 'Young protostar', 'Collapsing black hole'] },
  { id: 'q57', text: 'Which English king signed the Magna Carta?', correctAnswer: 'King John', distractors: ['Henry II', 'Richard I', 'Edward I'] },
  { id: 'q58', text: 'What does the culinary term “al dente” mean?', correctAnswer: 'To the tooth / slightly firm', distractors: ['Cooked in milk', 'To the flame', 'Very soft'] },
  { id: 'q59', text: 'Which planet has the shortest day in the solar system?', correctAnswer: 'Jupiter', distractors: ['Saturn', 'Mars', 'Mercury'] },
  { id: 'q60', text: 'What is the national sport of Japan?', correctAnswer: 'Sumo wrestling', distractors: ['Baseball', 'Judo', 'Karate'] }
];

// ---------- Init ----------
showRoom('lobby');
updateUI();
if (incomingCode) {
  lobbyCodeInput.value = incomingCode;
  loadSession(incomingCode);
}
