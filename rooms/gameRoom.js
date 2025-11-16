import { renderQuestionOverlay, showResultMessage } from '../ui/components.js';

export function renderGameRoom(root, state, actions) {
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
    <section class="stack-section">
      <h3>Your question stack</h3>
      <p class="stack-hint">Drag to reorder. The top tile is sent when you hit send.</p>
      <ul class="stack-list"></ul>
      <div class="actions">
        <button id="send-question">Send top question</button>
      </div>
    </section>
    <section class="incoming">
      <h3>Incoming question</h3>
      <p class="incoming-status"></p>
    </section>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));

  const stackList = section.querySelector('.stack-list');
  const order = state.players.ONE.questionOrder;
  if (!order.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No cards left in your stack.';
    empty.style.opacity = '0.6';
    stackList.appendChild(empty);
  } else {
    order.forEach((id, index) => {
      const li = document.createElement('li');
      li.className = 'stack-tile';
      li.dataset.id = id;
      li.dataset.index = index + 1;
      const span = document.createElement('span');
      span.className = 'text';
      span.textContent = state.activeQuestions[id]?.text || 'Unknown question';
      li.appendChild(span);
      stackList.appendChild(li);
    });
    setupDragReorder(stackList, (newOrder) => {
      actions.reorderQuestions(newOrder);
    });
  }

  const sendBtn = section.querySelector('#send-question');
  sendBtn.disabled = order.length === 0;
  sendBtn.addEventListener('click', () => actions.sendQuestion());

  const incomingStatus = section.querySelector('.incoming-status');
  incomingStatus.textContent = state.pendingQuestionOverlay
    ? 'Answer the question in the overlay to continue.'
    : 'Waiting for your opponent to send you a question…';

  const overlayData = state.pendingQuestionOverlay;
  if (overlayData) {
    renderQuestionOverlay(overlayData, (selection) => {
      const result = actions.answerQuestion('ONE', overlayData.id, selection);
      if (result) {
        showResultMessage(result.isCorrect ? 'correct' : 'incorrect', result.message);
      }
    });
  } else {
    renderQuestionOverlay(null);
  }
}

function setupDragReorder(list, onReorder) {
  list.querySelectorAll('.stack-tile').forEach((tile) => {
    tile.addEventListener('pointerdown', (event) => {
      tile.setPointerCapture(event.pointerId);
      tile.classList.add('dragging');
      const handleMove = (ev) => {
        ev.preventDefault();
        const afterElement = getDragAfterElement(list, ev.clientY);
        if (!afterElement) {
          list.appendChild(tile);
        } else {
          list.insertBefore(tile, afterElement);
        }
      };
      const handleUp = () => {
        tile.classList.remove('dragging');
        tile.releasePointerCapture(event.pointerId);
        tile.removeEventListener('pointermove', handleMove);
        tile.removeEventListener('pointerup', handleUp);
        tile.removeEventListener('pointercancel', handleUp);
        const newOrder = Array.from(list.children)
          .filter((child) => child.dataset.id)
          .map((child) => child.dataset.id);
        onReorder(newOrder);
      };
      tile.addEventListener('pointermove', handleMove);
      tile.addEventListener('pointerup', handleUp);
      tile.addEventListener('pointercancel', handleUp);
    });
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
