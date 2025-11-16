export function renderHowToPlay(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room how-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>How to play</h2>
      <button class="link" data-nav="lobby">Back</button>
    </div>
    <p>Q&M is a fast paced duel. Each of you builds a stack of questions and fires them off while answering the incoming ones.</p>
    <ul class="how-list">
      <li>Drag the tiles to reorder your question stack. The top card is sent when you press <strong>Send</strong>.</li>
      <li>Incoming questions appear as an overlay. Tap an option to answer.</li>
      <li>Rounds 1–4: 1 point, 5–8: 2 points, 9–12: 3 points. Incorrect answers are worth 0.</li>
      <li>Enable testing mode in the keyroom to simulate Player TWO with a 65% accurate bot.</li>
      <li>Complete 12 rounds to reveal the winner.</li>
    </ul>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));
}
