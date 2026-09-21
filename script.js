const form = document.querySelector('#survey-form');
const status = document.querySelector('#form-status');
const themeToggle = document.querySelector('.theme-toggle');
const themeStorageKey = 'domingots-theme';
const houseSelect = document.querySelector('#house');
const surveySection = document.querySelector('.survey-section');
const valarModal = document.querySelector('#valar-modal');
const valarForm = document.querySelector('#valar-form');
const valarComment = document.querySelector('#valar-comment');
const valarCommentHidden = document.querySelector('#valar-comment-hidden');

const houseMeta = {
  'Casa Stark': ['stark', 'S', '#6c8d9a'], 'Casa Targaryen': ['targaryen', 'T', '#ae352d'],
  'Casa Lannister': ['lannister', 'L', '#ad8725'], 'Casa Baratheon': ['baratheon', 'B', '#8e691d'],
  'Casa Greyjoy': ['greyjoy', 'G', '#466a70'], 'Casa Martell': ['martell', 'M', '#c05b2b'],
  'Casa Tyrell': ['tyrell', 'T', '#668641'], 'Casa Arryn': ['arryn', 'A', '#4b7193'],
  'Casa Tully': ['tully', 'T', '#4d7193'], 'Casa Velaryon': ['velaryon', 'V', '#2b7488'],
  'Casa Hightower': ['hightower', 'H', '#8f7630'], 'Casa Strong': ['strong', 'S', '#7c5c48'],
  'Casa Cole': ['cole', 'C', '#7c5c48'], 'Casa Beesbury': ['beesbury', 'B', '#7c5c48'],
  'Casa Celtigar': ['celtigar', 'C', '#7c5c48'], 'Casa Fossoway': ['fossoway', 'F', '#668641'],
  'Casa Dondarrion': ['dondarrion', 'D', '#657582'], 'Casa Osgrey': ['osgrey', 'O', '#5b7446'],
  'Casa Ashford': ['ashford', 'A', '#657582'], 'Casa Tarth': ['tarth', 'T', '#657582'],
  'Casa Mormont': ['mormont', 'M', '#5b7446'], 'Casa Bolton': ['bolton', 'B', '#8a3939'],
  'Casa Frey': ['frey', 'F', '#8a3939'], 'Casa Karstark': ['karstark', 'K', '#8a3939'],
  'Casa Reed': ['reed', 'R', '#5b7446'], 'La Guardia de la Noche': ['night-watch', 'N', '#7899a2'],
  'Los Caminantes Blancos': ['white-walkers', 'W', '#7899a2'],
};

const crestFor = (house) => {
  const [, symbol, color] = houseMeta[house] || ['unknown', '?', '#c9974b'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 145"><path d="M10 10h100v70c0 30-23 48-50 58C33 128 10 110 10 80V10Z" fill="${color}" stroke="#11110f" stroke-width="7"/><path d="M22 22h76v56c0 21-15 34-38 44-23-10-38-23-38-44V22Z" fill="none" stroke="#11110f" stroke-width="2"/><text x="60" y="83" text-anchor="middle" font-family="Georgia,serif" font-size="50" font-weight="700" fill="#11110f">${symbol}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const renderHouse = (house) => {
  const meta = houseMeta[house];
  if (!meta) return;
  surveySection?.setAttribute('data-house', meta[0]);
  surveySection?.style.setProperty('--house-color', meta[2]);
  document.body.dataset.house = meta[0];
  themeToggle?.classList.add('house-selected');
  document.querySelector('.house-preview')?.remove();
  const preview = document.createElement('div');
  preview.className = 'house-preview';
  preview.innerHTML = `<img src="${crestFor(house)}" alt="Escudo estilizado de ${house}" /><span>${house}</span>`;
  houseSelect?.closest('.question-block')?.append(preview);
};

const setTheme = (theme) => {
  const isIce = theme === 'ice';
  document.body.dataset.theme = isIce ? 'ice' : 'fire';
  themeToggle?.setAttribute('aria-pressed', String(isIce));
  themeToggle?.setAttribute('aria-label', isIce ? 'Cambiar a tema de Daenerys y Drogon' : 'Cambiar a tema de Jon Snow y Ghost');
};

setTheme(localStorage.getItem(themeStorageKey) || 'fire');
themeToggle?.addEventListener('click', () => {
  const nextTheme = document.body.dataset.theme === 'ice' ? 'fire' : 'ice';
  localStorage.setItem(themeStorageKey, nextTheme);
  setTheme(nextTheme);
});

houseSelect?.addEventListener('change', () => renderHouse(houseSelect.value));

document.querySelectorAll('input[name="attendance"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.value === 'valar') {
      valarModal?.showModal();
      window.setTimeout(() => valarComment?.focus(), 50);
    }
  });
});

valarForm?.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  if (!valarComment?.value.trim()) {
    event.preventDefault();
    valarComment?.reportValidity();
    return;
  }
  if (valarCommentHidden) valarCommentHidden.value = valarComment.value.trim();
  status.textContent = 'Recomendación guardada.';
});

// Keep analytics calls optional so the page works before an ID is configured.
window.dataLayer = window.dataLayer || [];
const track = (eventName, parameters = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, parameters);
  window.dataLayer.push({ event: eventName, ...parameters });
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  if (payload.attendance === 'valar' && !payload.valarComment) {
    valarModal?.showModal();
    return;
  }
  track('survey_started', { house: payload.house });
  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  status.textContent = 'Consultando al consejo...';

  try {
    const response = await fetch('/.netlify/functions/submit-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('submission_failed');
    form.reset();
    status.textContent = 'Tu respuesta ha llegado al consejo. Nos vemos el domingo.';
    track('survey_submitted', { house: payload.house, attendance: payload.attendance });
  } catch {
    status.textContent = 'No pudimos enviar la respuesta. Inténtalo de nuevo en un momento.';
    track('survey_error');
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
  }
});
