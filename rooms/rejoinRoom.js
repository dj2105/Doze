export function renderRejoinRoom(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room rejoin-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>Rejoin</h2>
      <button class="link" data-nav="lobby">Back</button>
    </div>
    <p>Reload a saved local session by entering its code.</p>
    <label class="field">
      <span>Enter code</span>
      <input type="text" id="rejoin-code" placeholder="##-##-##" />
    </label>
    <button id="rejoin-go">Resume</button>
    <p class="rejoin-note">Sessions are saved per device. Rejoin works only for matches you previously started here.</p>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));
  const input = section.querySelector('#rejoin-code');
  section.querySelector('#rejoin-go').addEventListener('click', () => {
    const code = input.value.trim();
    if (code) {
      actions.loadSession(code);
    }
  });
}
