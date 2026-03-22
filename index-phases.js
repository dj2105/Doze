const phaseButtons = document.querySelectorAll('.phase-button');
const phaseAsset = document.getElementById('phaseAsset');
const phaseTitle = document.getElementById('phaseTitle');
const phaseStatus = document.getElementById('phaseStatus');

const phaseLabels = {
  'Phases1.svg': 'Phase 1',
  'Phases2.svg': 'Phase 2',
  'Phases3.svg': 'Phase 3'
};

function setActivePhase(assetName) {
  phaseButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.phaseAsset === assetName);
  });

  phaseTitle.textContent = phaseLabels[assetName] || 'Phase viewer';
  phaseStatus.textContent = `Loading ${assetName}…`;
  phaseAsset.data = `./${assetName}`;
}

phaseAsset.addEventListener('load', () => {
  phaseStatus.textContent = `${phaseTitle.textContent} loaded from repository root.`;
});

phaseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActivePhase(button.dataset.phaseAsset);
  });
});

setActivePhase('Phases1.svg');