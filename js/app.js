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
   Forhåndsvisninger
   Web-prosjekter viser ekte skjermbilder. Spillene viser en levende
   scene bygget av spillenes egne grafikkressurser — bakgrunn, sprite-
   striper animert med steps(), og ekte tall fra spilldataene.
   --------------------------------------------------------- */
const DEMOS = {
  /* SpireSlayer — kampscene: The Ronin (75 HP) mot bossen NightBorne (300 HP),
     med startkortstokkens faktiske kort. */
  spire: () => `
    <div class="demo demo--spire">
      <img class="demo__bg" src="bilder/spire-arena.webp" alt="Kamparenaen i SpireSlayer" loading="lazy">
      <div class="demo__vignette"></div>
      <div class="spr spr--ronin" style="--f:6;--d:1.1s"></div>
      <div class="spr spr--nb" style="--f:6;--d:.95s"></div>
      <div class="hpbar hpbar--left">
        <span class="hpbar__name">The Ronin</span>
        <span class="hpbar__track"><i style="--p:72%"></i></span>
        <span class="hpbar__num">54/75</span>
      </div>
      <div class="hpbar hpbar--right">
        <span class="hpbar__name">NightBorne</span>
        <span class="hpbar__track hpbar__track--foe"><i style="--p:61%"></i></span>
        <span class="hpbar__num">183/300</span>
      </div>
      <div class="energy"><b>3</b><span>/3</span></div>
      <div class="hand">
        <div class="gcard gcard--atk"><i class="gcard__cost">1</i><b>Strike</b><em>Deal 6 damage.</em></div>
        <div class="gcard gcard--def"><i class="gcard__cost">1</i><b>Defend</b><em>Gain 5 Block.</em></div>
        <div class="gcard gcard--atk"><i class="gcard__cost">2</i><b>Bash</b><em>Deal 8 damage. Apply 2 Vulnerable.</em></div>
      </div>
    </div>`,

  /* SpireSlayer — klassevalget. Navn, HP og tagline er hentet fra
     CLASSES i spillets game_manager.gd. */
  spireSelect: () => `
    <div class="demo demo--pick">
      <img class="demo__bg" src="bilder/spire-shrine.webp" alt="Menyskjermen i SpireSlayer" loading="lazy">
      <div class="demo__vignette"></div>
      <p class="pick__heading">Velg din klasse</p>
      <div class="picker">
        ${[
          ['spire-ronin.webp',  'The Ronin',   75, 'Disiplinert sverdmann.<br>Høy skade mot ett mål.'],
          ['spire-yumi.webp',   'The Yumi',    65, 'Jeger på avstand.<br>Flere treff og korttrekk.'],
          ['spire-reaper.webp', 'Soul Reaper', 90, 'Tunge slag<br>og hardt forsvar.'],
        ].map(([img, name, hp, text], i) => `
          <div class="pick ${i === 1 ? 'pick--on' : ''}">
            <img class="pick__art" src="bilder/${img}" alt="${esc(name)}" loading="lazy">
            <b class="pick__name">${esc(name)}</b>
            <span class="pick__hp">${hp} HP</span>
            <em class="pick__text">${text}</em>
          </div>`).join('')}
      </div>
    </div>`,

  /* MonGame — startervalget. Navn, type, HP og beskrivelse kommer fra
     spillets data/creatures.json. */
  monStarters: () => `
    <div class="demo demo--pick demo--pick-mon">
      <img class="demo__bg" src="bilder/mon-forest.webp" alt="Skogbakgrunn fra MonGame" loading="lazy">
      <div class="demo__vignette"></div>
      <p class="pick__heading">Velg din første skapning</p>
      <div class="picker">
        ${[
          ['mon-sprigle.webp',  'Sprigle', 'Grass', 'grass', 51, 'Et rolig gressfawn.<br>Trygt og lojalt.'],
          ['mon-cindcub.webp',  'Cindcub', 'Fire',  'fire',  41, 'En liten ildunge.<br>Modig og rask.'],
          ['mon-bublet.webp',   'Bublet',  'Water', 'water', 55, 'En boblete rumpetroll.<br>Stø og seig.'],
        ].map(([img, name, type, cls, hp, text]) => `
          <div class="pick">
            <img class="pick__art pick__art--px" src="bilder/${img}" alt="${esc(name)}" loading="lazy">
            <b class="pick__name">${esc(name)}</b>
            <span class="type type--${cls}">${esc(type)}</span>
            <span class="pick__hp">${hp} HP</span>
            <em class="pick__text">${text}</em>
          </div>`).join('')}
      </div>
    </div>`,

  /* MonGame — kampscene med to av spillets egne skapninger. */
  mon: () => `
    <div class="demo demo--mon">
      <img class="demo__bg" src="bilder/mon-meadow.webp" alt="Kampbakgrunn fra MonGame" loading="lazy">
      <img class="mon mon--foe" src="bilder/mon-embercat.webp" alt="Skapningen Embercat" loading="lazy">
      <img class="mon mon--own" src="bilder/mon-bublet.webp" alt="Skapningen Bublet" loading="lazy">
      <div class="monhp monhp--foe">
        <span class="monhp__row"><b>Embercat</b><span>Lv 12</span></span>
        <span class="monhp__track"><i style="--p:46%"></i></span>
      </div>
      <div class="monhp monhp--own">
        <span class="monhp__row"><b>Bublet</b><span>Lv 14</span></span>
        <span class="monhp__track"><i style="--p:78%"></i></span>
        <span class="monhp__num">39/50</span>
      </div>
      <div class="monbox">Hva skal <b>Bublet</b> gjøre?</div>
    </div>`,
};

/* Ett galleribilde — enten en levende scene eller et skjermbilde. */
function mediaHTML(item, project, { lazy = true } = {}) {
  if (!item) return `<span class="card__glyph" aria-hidden="true">${esc(project.glyph || '◆')}</span>`;
  if (item.type === 'demo') return DEMOS[item.id] ? DEMOS[item.id]() : '';

  return `<img class="card__img" src="${esc(item.src)}"
               alt="${esc(item.caption || `Skjermbilde fra ${project.title}`)}"
               ${lazy ? 'loading="lazy"' : ''}>`;
}

/* Kortet i rutenettet viser første element i galleriet. */
function posterHTML(project, opts) {
  return mediaHTML(project.gallery?.[0], project, opts);
}

/* ---------------------------------------------------------
   Kort
   --------------------------------------------------------- */
function cardHTML(project) {
  const poster = posterHTML(project);

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

/* ---------------------------------------------------------
   Galleri — vannrett karusell med snapping, piler og prikker
   --------------------------------------------------------- */
function galleryHTML(project) {
  const items = project.gallery || [];
  const isDemo = items[0]?.type === 'demo';

  // Første bilde lastes med én gang, resten når man blar dit
  const slides = items.map((item, i) => `
    <div class="gallery__slide" role="group" aria-roledescription="bilde"
         aria-label="${i + 1} av ${items.length}">
      ${mediaHTML(item, project, { lazy: i > 0 })}
    </div>`).join('');

  if (items.length < 2) {
    return `<div class="detail__poster ${isDemo ? 'detail__poster--demo' : ''}">
              ${mediaHTML(items[0], project, { lazy: false })}
            </div>`;
  }

  const dots = items.map((_, i) => `
    <button class="gallery__dot" type="button" data-go="${i}"
            aria-label="Gå til bilde ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('');

  const arrow = (dir, label, path) => `
    <button class="gallery__arrow gallery__arrow--${dir}" type="button" data-step="${dir === 'prev' ? -1 : 1}"
            aria-label="${label}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;

  return `
    <div class="gallery ${isDemo ? 'gallery--demo' : ''}" data-count="${items.length}">
      <div class="gallery__track" tabindex="0" aria-label="Bilder fra ${esc(project.title)}">${slides}</div>
      ${arrow('prev', 'Forrige bilde', 'M14.5 5.5 8 12l6.5 6.5')}
      ${arrow('next', 'Neste bilde', 'M9.5 5.5 16 12l-6.5 6.5')}
      <div class="gallery__counter"><span data-current>1</span>/${items.length}</div>
    </div>
    <div class="gallery__bar">
      <p class="gallery__caption" data-caption>${esc(items[0].caption || '')}</p>
      <div class="gallery__dots">${dots}</div>
    </div>`;
}

function initGallery(root) {
  const gallery = $('.gallery', root);
  if (!gallery) return;

  const track = $('.gallery__track', gallery);
  const dots = $$('.gallery__dot', root);
  const caption = $('[data-caption]', root);
  const counter = $('[data-current]', gallery);
  let index = 0;

  const sync = () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i === index || Number.isNaN(i)) return;
    index = i;

    dots.forEach((d, n) => d.toggleAttribute('aria-current', n === i));
    if (counter) counter.textContent = String(i + 1);
    if (caption) {
      caption.style.opacity = '0';
      setTimeout(() => {
        caption.textContent = galleryCaptions[i] || '';
        caption.style.opacity = '';
      }, 140);
    }
    gallery.classList.toggle('is-first', i === 0);
    gallery.classList.toggle('is-last', i === dots.length - 1);
  };

  const go = (i) => {
    const clamped = Math.max(0, Math.min(dots.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  track.addEventListener('scroll', () => {
    clearTimeout(track._t);
    track._t = setTimeout(sync, 60);
  }, { passive: true });

  gallery.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) go(index + Number(step.dataset.step));
  });

  root.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-go]');
    if (dot) go(Number(dot.dataset.go));
  });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(index - 1); }
  });

  gallery.classList.add('is-first');
  if (dots.length === 1) gallery.classList.add('is-last');
}

/* ---------------------------------------------------------
   Levende innebygging — den ekte siden i en nettleserramme.
   Lastes først når man trykker, så en 21 MB spillbygg ikke drar
   ned detaljvisningen for alle som bare vil lese.
   --------------------------------------------------------- */
function liveHTML(project) {
  const live = project.live;
  if (!live) return '';

  const poster = live.poster
    ? `<img class="live__poster" src="${esc(live.poster)}" alt="" loading="lazy">`
    : '';

  return `
    <section class="live" data-src="${esc(live.src)}" data-title="${esc(project.title)}">
      <header class="live__head">
        <h3>${esc(live.heading || 'Prøv den selv')}</h3>
        <a class="live__out" href="${esc(live.src)}" target="_blank" rel="noopener">
          Åpne i egen fane <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div class="live__frame">
        <div class="live__bar">
          <span class="live__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="live__url">${esc(live.label || project.title)}</span>
        </div>

        <div class="live__stage">
          ${poster}
          <button class="live__start" type="button">
            <span class="live__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 5.5 18.5 12 8 18.5Z"/></svg>
            </span>
            <span class="live__label">${esc(live.cta || 'Start siden')}</span>
            <span class="live__hint">${esc(live.hint || '')}</span>
          </button>
        </div>
      </div>
    </section>`;
}

function initLive(root) {
  const live = $('.live', root);
  if (!live) return;

  $('.live__start', live)?.addEventListener('click', () => {
    const stage = $('.live__stage', live);
    const frame = document.createElement('iframe');
    frame.className = 'live__iframe';
    frame.src = live.dataset.src;
    frame.title = `${live.dataset.title} — kjørende`;
    // Nok rettigheter til at siden virker, men ingen tilgang til denne siden
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    stage.replaceChildren(frame);
    live.classList.add('is-running');
    frame.addEventListener('load', () => frame.focus(), { once: true });
  });
}

/* Bildetekstene for galleriet som er åpent nå */
let galleryCaptions = [];

function detailHTML(project) {
  galleryCaptions = (project.gallery || []).map((g) => g.caption || '');

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
    ${galleryHTML(project)}
    <div class="detail__body">
      <p class="detail__kicker">${esc(project.tagline)}</p>
      <h2 class="detail__title" id="sheetTitle">${esc(project.title)}</h2>
      <p class="detail__lede">${esc(project.summary)}</p>
      <dl class="detail__meta">${meta}</dl>
      ${body}
      ${highlights}
      ${liveHTML(project)}
      ${actions ? `<div class="detail__actions">${actions}</div>` : ''}
      ${note}
    </div>`;
}

function openSheet(project) {
  sheet.lastFocus = document.activeElement;
  sheet.openId = project.id;

  sheet.scroll.innerHTML = detailHTML(project);
  sheet.scroll.scrollTop = 0;
  initGallery(sheet.scroll);
  initLive(sheet.scroll);

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
