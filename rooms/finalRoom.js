export function renderFinalRoom(root, state, actions) {
  const { ONE, TWO } = state.players;
  const section = document.createElement('section');
  section.className = 'room final-room';
  const winner = ONE.score > TWO.score ? 'Player ONE wins!' : TWO.score > ONE.score ? 'Player TWO wins!' : 'It\'s a draw!';
  section.innerHTML = `
    <h2>Final scores</h2>
    <div class="scores">
      <div>ONE: <strong>${ONE.score}</strong></div>
      <div>TWO: <strong>${TWO.score}</strong></div>
    </div>
    <p>${winner}</p>
    <button id="final-lobby">Return to lobby</button>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('#final-lobby').addEventListener('click', () => actions.navigate('lobby'));
}
