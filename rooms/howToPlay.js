export function renderHowToPlay(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room how-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>How to play</h2>
      <button class="link" data-nav="lobby">Back</button>
    </div>
    <p>Q&M is a fast paced duel. Drag colorful tiles from your grid into the send box while answering the incoming questions at the top.</p>
    <ul class="how-list">
      <li>Each round uses a 3×4 grid of questions. Drag any unused tile into the “DRAG QUESTIONS HERE TO SEND” box to fire it at your opponent.</li>
      <li>Sent tiles stay in the grid but fade to show they have already been used.</li>
      <li>Incoming questions appear in the black-bordered box with 2–4 multiple-choice answers depending on the round.</li>
      <li>Rounds 1–4: 1 point, 5–8: 2 points, 9–12: 3 points. Incorrect answers are worth 0.</li>
      <li>Enable testing mode in the keyroom to simulate Player TWO with a 65% accurate bot.</li>
      <li>Complete 12 rounds to reveal the winner.</li>
    </ul>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));
}
