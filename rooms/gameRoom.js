import { renderQuestionOverlay, showResultMessage } from '../ui/components.js';

export function renderGameRoom(root, state, actions) {
  renderQuestionOverlay(null);
  const section = document.createElement('section');
  section.className = 'room game-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>Game room</h2>
      <button class="link" data-nav="lobby">Exit</button>
    </div>
    <div class="scoreboard">
      <div class="block">
        <div class="label">Player ONE</div>
        <div class="value" id="score-one">${state.players.ONE.score}</div>
      </div>
      <div class="block">
        <div class="label">Player TWO</div>
        <div class="value" id="score-two">${state.players.TWO.score}</div>
      </div>
      <div class="block">
        <div class="label">Round</div>
        <div class="value">${state.currentRound} / 12</div>
      </div>
    </div>
    <div class="incoming-box">
      <div class="incoming-header">
        <h3>Received question</h3>
        <p class="incoming-note">These arrive when your opponent drags a card into their send box.</p>
      </div>
      <div class="incoming-card" id="incoming-card"></div>
    </div>
    <div class="send-panel">
      <div class="send-target" id="send-target" aria-label="Drag a question here to send">
        <div class="send-label">DRAG QUESTIONS HERE TO SEND</div>
      </div>
    </div>
    <div class="question-grid" aria-label="Your questions"></div>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));

  renderIncomingCard(section, state, actions);
  renderSendTarget(section, state, actions);
  renderQuestionGrid(section, state, actions);

  if (state.pendingOpponentResult) {
    const { answer, isCorrect, questionId } = state.pendingOpponentResult;
    const descriptor = isCorrect ? 'correct' : 'incorrect';
    const questionText = state.activeQuestions[questionId]?.text;
    const suffix = questionText ? ` to "${questionText}"` : '';
    showResultMessage(isCorrect ? 'correct' : 'incorrect', `TWO answered ${answer}${suffix}. This is ${descriptor}.`);
    actions.consumeOpponentResult();
  }
}

function renderIncomingCard(section, state, actions) {
  const card = section.querySelector('#incoming-card');
  card.innerHTML = '';
  card.classList.remove('filled');

  const overlayData = state.pendingQuestionOverlay;
  if (!overlayData) {
    const waiting = document.createElement('p');
    waiting.className = 'incoming-waiting';
    waiting.textContent = 'Waiting for your opponent to send you a question…';
    card.appendChild(waiting);
    return;
  }

  card.classList.add('filled');
  const question = document.createElement('p');
  question.className = 'incoming-question-text';
  question.textContent = overlayData.text;
  card.appendChild(question);

  const options = document.createElement('div');
  options.className = 'incoming-options';
  overlayData.options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      options.querySelectorAll('button').forEach((b) => (b.disabled = true));
      const result = actions.answerQuestion('ONE', overlayData.id, option);
      if (result) {
        showResultMessage(result.isCorrect ? 'correct' : 'incorrect', result.message);
      }
    });
    options.appendChild(btn);
  });
  card.appendChild(options);
}

function renderSendTarget(section, state, actions) {
  const sendTarget = section.querySelector('#send-target');
  const label = sendTarget.querySelector('.send-label');
  const activeId = state.sendBoxAnswer?.questionId || state.activeSendBoxQuestionId;
  const activeQuestion = activeId ? state.activeQuestions[activeId] : null;
  const baseColor = activeId ? state.questionColors[activeId] || '#f9f9f9' : '#fefefe';

  sendTarget.classList.remove('show-answer', 'waiting-answer');
  sendTarget.style.backgroundColor = baseColor;

  if (state.sendBoxAnswer) {
    sendTarget.classList.add('show-answer');
    sendTarget.style.backgroundColor = state.sendBoxAnswer.isCorrect ? 'rgba(60, 179, 113, 0.25)' : 'rgba(198, 40, 40, 0.2)';
    label.textContent = `Opponent answered: ${state.sendBoxAnswer.answer}`;
  } else if (activeQuestion) {
    sendTarget.classList.add('waiting-answer');
    label.textContent = activeQuestion.text;
  } else {
    label.textContent = 'DRAG QUESTIONS HERE TO SEND';
  }

  const handleDragOver = (event) => {
    if (state.activeSendBoxQuestionId || state.sendBoxAnswer) return;
    event.preventDefault();
    sendTarget.classList.add('drag-hover');
  };

  const handleDrop = (event) => {
    if (state.activeSendBoxQuestionId || state.sendBoxAnswer) return;
    event.preventDefault();
    sendTarget.classList.remove('drag-hover');
    const questionId = event.dataTransfer.getData('text/plain');
    actions.sendQuestion(questionId);
  };

  const handleDragLeave = () => {
    sendTarget.classList.remove('drag-hover');
  };

  sendTarget.addEventListener('dragover', handleDragOver);
  sendTarget.addEventListener('drop', handleDrop);
  sendTarget.addEventListener('dragleave', handleDragLeave);
  sendTarget.addEventListener('dragend', handleDragLeave);
}

function renderQuestionGrid(section, state, actions) {
  const grid = section.querySelector('.question-grid');
  grid.innerHTML = '';
  const order = state.players.ONE.questionOrder;
  if (!order.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No questions available.';
    empty.className = 'incoming-waiting';
    grid.appendChild(empty);
    return;
  }

  order.forEach((id) => {
    const question = state.activeQuestions[id];
    if (!question) return;
    const used = state.players.ONE.sentQuestions.includes(id);
    const card = document.createElement('div');
    card.className = `question-card${used ? ' used' : ''}`;
    card.style.backgroundColor = state.questionColors[id] || '#f7f7f7';
    card.textContent = question.text;
    if (!used) {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    }
    grid.appendChild(card);
  });
}
