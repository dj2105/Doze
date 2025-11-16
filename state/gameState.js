export function createGameState() {
  return {
    currentRoom: 'lobby',
    players: {
      ONE: { score: 0, questionOrder: [], answered: [] },
      TWO: { score: 0, questionOrder: [], answered: [] }
    },
    currentRound: 1,
    testingMode: false,
    activeQuestions: {},
    pendingQuestionOverlay: null,
    uploadedPacks: [],
    selectedPackId: null,
    gameCode: '',
    lastResult: null,
    packMode: 'placeholder',
    prefilledCode: ''
  };
}

export function clonePlayers(questionIds) {
  return {
    ONE: { score: 0, questionOrder: shuffle(questionIds), answered: [] },
    TWO: { score: 0, questionOrder: shuffle(questionIds), answered: [] }
  };
}

export function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function sampleQuestions(questions, n) {
  const pool = shuffle(questions);
  return pool.slice(0, n);
}

export function parseUploadedPack(name, raw) {
  try {
    if (name.endsWith('.json')) {
      const data = JSON.parse(raw);
      return (data || []).map((q, idx) => normalizeQuestion(q, `${name}-${idx}`)).filter(Boolean);
    }
  } catch (err) {
    console.error('JSON parse failed', err);
  }
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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

export function getDistractorCountForRound(round) {
  if (round <= 4) return 1;
  if (round <= 8) return 2;
  return 3;
}

export function getPointsForRound(round) {
  if (round <= 4) return 1;
  if (round <= 8) return 2;
  return 3;
}

export function buildOptions(question, distractorCount) {
  const chosenDistractors = shuffle([...question.distractors]).slice(0, distractorCount);
  return shuffle([question.correctAnswer, ...chosenDistractors]);
}

export function generateGameCode() {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(Math.random() * 100))}-${pad(Math.floor(Math.random() * 100))}-${pad(Math.floor(Math.random() * 100))}`;
}

export function randomDelay() {
  return 500 + Math.random() * 1500;
}

export const placeholderQuestions = [
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
