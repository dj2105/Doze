export function renderCodeRoom(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room code-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>Your game code</h2>
      <button class="link" data-nav="lobby">Back to lobby</button>
    </div>
    <p>Share this code with your opponent so they can open the same match on another device.</p>
    <div class="code-display">
      <p class="code">${state.gameCode || '-- -- --'}</p>
      <button id="copy-link">Copy invite link</button>
    </div>
    <div class="actions">
      <button class="secondary" data-nav="game">Enter game room</button>
    </div>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));
  section.querySelector('[data-nav="game"]').addEventListener('click', () => actions.navigate('game'));

  const copyBtn = section.querySelector('#copy-link');
  copyBtn.addEventListener('click', async () => {
    const ok = await actions.copyShareLink();
    if (ok) {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = original), 1500);
    }
  });
}
