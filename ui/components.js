const overlayRoot = document.getElementById('overlay-root');
const resultLayer = document.getElementById('result-layer');
let resultTimer = null;

export function renderQuestionOverlay(data, onSelect) {
  if (!overlayRoot) return;
  if (!data) {
    overlayRoot.classList.add('hidden');
    overlayRoot.setAttribute('aria-hidden', 'true');
    overlayRoot.innerHTML = '';
    document.body.classList.remove('overlay-active');
    return;
  }
  document.body.classList.add('overlay-active');
  overlayRoot.classList.remove('hidden');
  overlayRoot.setAttribute('aria-hidden', 'false');
  overlayRoot.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'overlay-card';
  const heading = document.createElement('h3');
  heading.textContent = 'Choose your answer';
  const questionText = document.createElement('p');
  questionText.textContent = data.text;
  const options = document.createElement('div');
  options.className = 'overlay-options';
  data.options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = option;
    btn.addEventListener('click', () => {
      onSelect(option);
    }, { once: true });
    options.appendChild(btn);
  });
  card.append(heading, questionText, options);
  overlayRoot.appendChild(card);
}

export function showResultMessage(type, text) {
  if (!resultLayer) return;
  clearTimeout(resultTimer);
  resultLayer.innerHTML = '';
  const banner = document.createElement('div');
  banner.className = `result-banner ${type}`;
  banner.textContent = text;
  resultLayer.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));
  resultTimer = setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => {
      if (resultLayer.contains(banner)) {
        resultLayer.removeChild(banner);
      }
    }, 300);
  }, 1800);
}
