const candidateAssets = [
  { path: 'timeline-live.svg', label: 'Timeline SVG (live text)' },
  { path: 'timeline-curves.svg', label: 'Timeline SVG (curves)' },
  { path: 'timeline.svg', label: 'Timeline SVG' },
  { path: 'phases.svg', label: 'Phases SVG' },
  { path: 'page-1.svg', label: 'Page 1 SVG' },
  { path: 'page-2.svg', label: 'Page 2 SVG' },
  { path: 'page-3.svg', label: 'Page 3 SVG' },
  { path: 'timeline@2x.png', label: 'Timeline PNG' },
  { path: 'timeline.png', label: 'Timeline PNG' },
  { path: 'page-1.png', label: 'Page 1 PNG' },
  { path: 'page-2.png', label: 'Page 2 PNG' },
  { path: 'page-3.png', label: 'Page 3 PNG' }
];

const assetTrack = document.getElementById('timelineAssetTrack');
const viewerStatus = document.getElementById('viewerStatus');

function assetUrl(path) {
  return `./${path}`;
}

function createAssetFigure(asset) {
  const figure = document.createElement('figure');
  figure.className = 'timeline-figure';

  const isSvg = asset.path.toLowerCase().endsWith('.svg');
  if (isSvg) {
    const object = document.createElement('object');
    object.type = 'image/svg+xml';
    object.data = assetUrl(asset.path);
    object.setAttribute('aria-label', asset.label);
    figure.appendChild(object);
  } else {
    const img = document.createElement('img');
    img.src = assetUrl(asset.path);
    img.alt = asset.label;
    figure.appendChild(img);
  }

  const caption = document.createElement('figcaption');
  caption.className = 'timeline-caption';
  caption.textContent = asset.label;
  figure.appendChild(caption);
  return figure;
}

async function exists(path) {
  try {
    const response = await fetch(assetUrl(path), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadAssets() {
  const found = [];
  for (const asset of candidateAssets) {
    // eslint-disable-next-line no-await-in-loop
    if (await exists(asset.path)) found.push(asset);
  }

  if (!found.length) {
    viewerStatus.textContent = 'No matching SVG or PNG assets were found in the repository root.';
    assetTrack.innerHTML = '<div class="timeline-empty">Add exported SVG or PNG assets to the repository root using one of the expected names, then reload this page.</div>';
    return;
  }

  viewerStatus.textContent = `Loaded ${found.length} exported asset${found.length === 1 ? '' : 's'} from the repository root.`;
  assetTrack.replaceChildren(...found.map(createAssetFigure));
}

loadAssets();