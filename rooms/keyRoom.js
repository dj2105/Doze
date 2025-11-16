export function renderKeyRoom(root, state, actions) {
  const section = document.createElement('section');
  section.className = 'room key-room';
  section.innerHTML = `
    <div class="room-header">
      <h2>Keyroom</h2>
      <button class="link" data-nav="lobby">Back to lobby</button>
    </div>
    <p>Create a fresh match, pick a question pack and decide if you want to simulate Player TWO.</p>
    <label class="selector">
      <span>Question pack</span>
      <select id="pack-mode">
        <option value="placeholder">Built-in placeholder set</option>
        <option value="random">Random uploaded pack</option>
        <option value="specific">Specific uploaded pack</option>
      </select>
    </label>
    <label class="upload-box">
      <span>Upload packs (.json or .txt)</span>
      <input type="file" id="pack-upload" accept=".json,.txt" multiple />
    </label>
    <ul class="pack-list"></ul>
    <label class="field">
      <span>Testing mode</span>
      <span><input type="checkbox" id="testing-toggle" /> Simulate player TWO</span>
    </label>
    <button id="start-game">Start game</button>
  `;

  root.innerHTML = '';
  root.appendChild(section);

  section.querySelector('[data-nav="lobby"]').addEventListener('click', () => actions.navigate('lobby'));

  const packModeSelect = section.querySelector('#pack-mode');
  packModeSelect.value = state.packMode;
  packModeSelect.addEventListener('change', (event) => {
    actions.setPackMode(event.target.value);
  });

  const packList = section.querySelector('.pack-list');
  if (!state.uploadedPacks.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No uploaded packs yet.';
    empty.style.opacity = '0.6';
    packList.appendChild(empty);
  } else {
    state.uploadedPacks.forEach((pack) => {
      const li = document.createElement('li');
      li.textContent = pack.name;
      if (state.selectedPackId === pack.id) {
        li.classList.add('selected');
      }
      li.addEventListener('click', () => actions.selectPack(pack.id));
      packList.appendChild(li);
    });
  }

  const uploadInput = section.querySelector('#pack-upload');
  uploadInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      actions.uploadPacks(files);
    }
    event.target.value = '';
  });

  const toggle = section.querySelector('#testing-toggle');
  toggle.checked = state.testingMode;
  toggle.addEventListener('change', (event) => actions.toggleTesting(event.target.checked));

  section.querySelector('#start-game').addEventListener('click', () => actions.startGame(state.packMode));
}
