/* =========================================================
   Portefølje — Kristoffer Holmsen
   All tekst og alle prosjekter kommer fra data/projects.json.
   ========================================================= */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/* Enkel `kode`-markering i beskrivelsestekst */
const inlineCode = (str) => esc(str).replace(/`([^`]+)`/g, '<code>$1</code>');

const gradient = (accent = []) => {
  const [a = '#0a84ff', b = '#5e5ce6'] = accent;
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

/* ---------------------------------------------------------
   Fargetema — auto (følger systemet) → lyst → mørkt
   --------------------------------------------------------- */
const THEME_KEY = 'kh-theme';

function readTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'auto'; }
  catch { return 'auto'; }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* privat modus */ }
}

function initTheme() {
  applyTheme(readTheme());

  $('#themeToggle')?.addEventListener('click', () => {
    const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const current = document.documentElement.dataset.theme;
    // Fra "auto" hopper vi til motsatt av det systemet viser nå.
    const effective = current === 'auto' ? (systemDark ? 'dark' : 'light') : current;
    applyTheme(effective === 'dark' ? 'light' : 'dark');
  });
}

/* ---------------------------------------------------------
   Innfelling ved scroll
   --------------------------------------------------------- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-in');
    obs.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

function observeReveals(root = document) {
  $$('.reveal:not(.is-in)', root).forEach((el) => revealObserver.observe(el));
}

/* Trapp opp forsinkelsen litt for kort i samme rad */
function staggerReveals(elements) {
  elements.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, 6) * 55}ms`;
  });
}

/* ---------------------------------------------------------
   Kort
   --------------------------------------------------------- */
function cardHTML(project) {
  const poster = project.image
    ? `<img class="card__img" src="${esc(project.image)}" alt="" loading="lazy">`
    : `<span class="card__glyph" aria-hidden="true">${esc(project.glyph || '◆')}</span>`;

  const badge = project.private
    ? '<span class="card__badge">Privat repo</span>'
    : '';

  const tags = (project.tech || [])
    .slice(0, 4)
    .map((t) => `<li>${esc(t)}</li>`)
    .join('');

  return `
    <button class="card reveal ${project.featured ? 'card--featured' : ''}"
            type="button" data-id="${esc(project.id)}"
            aria-label="Les mer om ${esc(project.title)}">
      <div class="card__poster" style="background:${gradient(project.accent)}">
        ${poster}${badge}
      </div>
      <div class="card__body">
        <p class="card__kicker">${esc(project.year)} · ${esc(project.tagline)}</p>
        <h3 class="card__title">${esc(project.title)}</h3>
        <p class="card__text">${esc(project.summary)}</p>
        <ul class="tags">${tags}</ul>
      </div>
    </button>`;
}

function renderGrid(projects) {
  const grid = $('#grid');
  const empty = $('#gridEmpty');

  grid.innerHTML = projects.map(cardHTML).join('');
  empty.hidden = projects.length > 0;

  const cards = $$('.card', grid);
  staggerReveals(cards);
  observeReveals(grid);
}

/* ---------------------------------------------------------
   Filtre (segmentert kontroll)
   --------------------------------------------------------- */
function moveThumb(container, button) {
  const thumb = $('.segmented__thumb', container);
  if (!thumb || !button) return;
  thumb.style.width = `${button.offsetWidth}px`;
  thumb.style.transform = `translateX(${button.offsetLeft - 2}px)`;
}

function initFilters(data, state) {
  const container = $('#filters');

  container.insertAdjacentHTML('beforeend', data.categories.map((cat, i) => `
    <button type="button" role="tab" data-cat="${esc(cat.id)}"
            aria-selected="${i === 0}">${esc(cat.label)}</button>
  `).join(''));

  const buttons = $$('button', container);

  const select = (button) => {
    buttons.forEach((b) => b.setAttribute('aria-selected', String(b === button)));
    moveThumb(container, button);
    state.category = button.dataset.cat;
    renderGrid(filterProjects(data.projects, state.category));
  };

  container.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-cat]');
    if (button) select(button);
  });

  // Thumben må plasseres etter at fontene har lagt seg, ellers bommer den.
  const reposition = () => moveThumb(container, $('[aria-selected="true"]', container));
  requestAnimationFrame(reposition);
  document.fonts?.ready.then(reposition);
  addEventListener('resize', reposition);
}

function filterProjects(projects, category) {
  return category === 'alle'
    ? projects
    : projects.filter((p) => p.category === category);
}

/* ---------------------------------------------------------
   Detaljvisning (iOS-ark)
   --------------------------------------------------------- */
const sheet = {
  el: null,
  backdrop: null,
  scroll: null,
  lastFocus: null,
  openId: null,
};

function detailHTML(project) {
  const poster = project.image
    ? `<img class="card__img" src="${esc(project.image)}" alt="">`
    : `<span class="card__glyph" aria-hidden="true">${esc(project.glyph || '◆')}</span>`;

  const meta = [
    ['År', project.year],
    ['Rolle', project.role],
    ['Teknologi', (project.tech || []).join(', ')],
  ].filter(([, value]) => value)
   .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
   .join('');

  const body = (project.description || [])
    .map((p) => `<p>${inlineCode(p)}</p>`)
    .join('');

  const highlights = (project.highlights || []).length
    ? `<h3>Høydepunkter</h3>
       <ul class="detail__list">
         ${project.highlights.map((h) => `<li>${inlineCode(h)}</li>`).join('')}
       </ul>`
    : '';

  const links = project.links || {};
  const actions = [
    links.demo && `<a class="btn btn--primary" href="${esc(links.demo)}" target="_blank" rel="noopener">Se live <span aria-hidden="true">↗</span></a>`,
    links.repo && `<a class="btn btn--ghost" href="${esc(links.repo)}" target="_blank" rel="noopener">Kildekode <span aria-hidden="true">↗</span></a>`,
  ].filter(Boolean).join('');

  const note = project.private
    ? '<p class="detail__note">Dette repoet er privat. Ta kontakt hvis du vil se koden eller en demo.</p>'
    : '';

  return `
    <div class="detail__poster" style="background:${gradient(project.accent)}">${poster}</div>
    <div class="detail__body">
      <p class="detail__kicker">${esc(project.tagline)}</p>
      <h2 class="detail__title" id="sheetTitle">${esc(project.title)}</h2>
      <p class="detail__lede">${esc(project.summary)}</p>
      <dl class="detail__meta">${meta}</dl>
      ${body}
      ${highlights}
      ${actions ? `<div class="detail__actions">${actions}</div>` : ''}
      ${note}
    </div>`;
}

function openSheet(project) {
  sheet.lastFocus = document.activeElement;
  sheet.openId = project.id;

  sheet.scroll.innerHTML = detailHTML(project);
  sheet.scroll.scrollTop = 0;

  sheet.el.hidden = false;
  sheet.backdrop.hidden = false;
  document.body.classList.add('is-locked');

  requestAnimationFrame(() => {
    sheet.el.classList.add('is-open');
    sheet.backdrop.classList.add('is-open');
    $('#sheetClose').focus({ preventScroll: true });
  });

  history.replaceState(null, '', `#prosjekt/${project.id}`);
}

function closeSheet() {
  if (sheet.el.hidden) return;

  sheet.el.classList.remove('is-open');
  sheet.backdrop.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  sheet.openId = null;

  const finish = () => {
    sheet.el.hidden = true;
    sheet.backdrop.hidden = true;
    sheet.scroll.innerHTML = '';
  };
  sheet.el.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 500); // fallback hvis transitionend ikke fyrer

  sheet.lastFocus?.focus({ preventScroll: true });
  history.replaceState(null, '', location.pathname + location.search);
}

function initSheet(projects) {
  sheet.el = $('#sheet');
  sheet.backdrop = $('#sheetBackdrop');
  sheet.scroll = $('#sheetScroll');

  const byId = new Map(projects.map((p) => [p.id, p]));

  $('#grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    const project = card && byId.get(card.dataset.id);
    if (project) openSheet(project);
  });

  $('#sheetClose').addEventListener('click', closeSheet);
  sheet.backdrop.addEventListener('click', closeSheet);

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.el.hidden) closeSheet();
  });

  // Hold tabbing inne i arket så lenge det er åpent
  sheet.el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = $$('a[href], button:not([disabled])', sheet.el);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Direktelenke: #prosjekt/<id>
  const openFromHash = () => {
    const match = location.hash.match(/^#prosjekt\/(.+)$/);
    const project = match && byId.get(decodeURIComponent(match[1]));
    if (project && project.id !== sheet.openId) openSheet(project);
  };
  openFromHash();
  addEventListener('hashchange', openFromHash);
}

/* ---------------------------------------------------------
   Statisk innhold fra profilen
   --------------------------------------------------------- */
function renderProfile(profile) {
  document.title = `${profile.name} — Portefølje`;
  $('#year').textContent = new Date().getFullYear();
  $('.nav__name').textContent = profile.name;
  $('.nav__mark').textContent = profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  $('#heroTitle').textContent = profile.headline;
  $('#heroLede').textContent = profile.intro;
  $('#heroGithub').href = profile.github;

  $('#aboutText').innerHTML = (profile.about || [])
    .map((p) => `<p>${esc(p)}</p>`).join('');

  $('#facts').innerHTML = [
    ['Sted', esc(profile.location)],
    ['E-post', `<a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>`],
    ['GitHub', `<a href="${esc(profile.github)}" target="_blank" rel="noopener">@${esc(profile.github.split('/').pop())}</a>`],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');

  $('#contactActions').innerHTML = `
    <a class="btn btn--primary" href="mailto:${esc(profile.email)}">Send e-post</a>
    <a class="btn btn--ghost" href="${esc(profile.github)}" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>`;
}

/* ---------------------------------------------------------
   Oppstart
   --------------------------------------------------------- */
function initNavShadow() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

async function init() {
  initTheme();
  initNavShadow();
  observeReveals();

  let data;
  try {
    const res = await fetch('data/projects.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Klarte ikke å laste prosjektdata:', err);
    $('#grid').innerHTML =
      '<p class="grid__empty">Klarte ikke å laste prosjektene. Siden må kjøres via en webserver – prøv <code>node server.mjs</code>.</p>';
    return;
  }

  renderProfile(data.profile);
  initFilters(data, { category: 'alle' });
  renderGrid(data.projects);
  initSheet(data.projects);
}

init();
