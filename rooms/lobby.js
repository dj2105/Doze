export function renderLobby(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room lobby';
  section.innerHTML = `
    <h2>Lobby</h2>
    <p>Already have a code? Jump straight into your ongoing duel.</p>
    <label class="field">
      <span>Enter game code</span>
      <input type="text" id="lobby-code" placeholder="##-##-##" value="${state.prefilledCode || ''}" />
    </label>
    <div class="room-links">
      <button class="secondary" data-nav="keyroom">Go to keyroom</button>
      <button class="secondary" data-nav="rejoin">Rejoin</button>
      <button class="secondary" data-nav="how">How to play</button>
    </div>
    <button id="lobby-go">Load session</button>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="keyroom"]').addEventListener('click', () => actions.navigate('keyroom'));
  section.querySelector('[data-nav="rejoin"]').addEventListener('click', () => actions.navigate('rejoin'));
  section.querySelector('[data-nav="how"]').addEventListener('click', () => actions.navigate('how'));

  const input = section.querySelector('#lobby-code');
  const goBtn = section.querySelector('#lobby-go');
  goBtn.addEventListener('click', () => {
    const code = input.value.trim();
    if (code) {
      actions.loadSession(code);
    }
  });
}
