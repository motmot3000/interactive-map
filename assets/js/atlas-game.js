/*
 * Cartes interactives 2.0 — modes Explorer et Quiz, communs à toutes les cartes.
 * Lit la configuration de la carte dans window.ATLAS_MAP (fichier data.js de chaque carte).
 */
(function (global) {
  'use strict';

  const Atlas = global.Atlas;
  const cfg = global.ATLAS_MAP;
  const icon = Atlas.icon;
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/[-]/g, ' ');
  const reduced = () => global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => global.matchMedia('(max-width: 900px)').matches;
  const swatch = (kind) => `<svg class="swatch swatch--${kind}" viewBox="0 0 22 16" aria-hidden="true" focusable="false"><rect width="22" height="16" rx="3"/></svg>`;

  /* ------------------------------------------------------------------ Préférences */
  const store = {
    get(key, fallback) {
      try {
        const v = global.localStorage.getItem('cartes:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { global.localStorage.setItem('cartes:' + key, JSON.stringify(value)); } catch (e) { /* navigation privée */ }
    },
  };
  const prefs = Object.assign({ sound: false, labels: true }, store.get('prefs', {}));
  const savePrefs = () => store.set('prefs', prefs);

  /* ------------------------------------------------------------------ Sons (synthétisés, coupés par défaut) */
  const sound = {
    ctx: null,
    play(kind) {
      if (!prefs.sound) return;
      try {
        this.ctx = this.ctx || new (global.AudioContext || global.webkitAudioContext)();
        const ctx = this.ctx;
        const t0 = ctx.currentTime + 0.01;
        const tones = {
          hit: [[660, 0, 0.09, 'sine'], [990, 0.08, 0.14, 'sine']],
          retry: [[620, 0, 0.12, 'sine']],
          wrong: [[196, 0, 0.16, 'triangle']],
          miss: [[330, 0, 0.12, 'triangle'], [262, 0.12, 0.2, 'triangle']],
          done: [[523, 0, 0.12, 'sine'], [659, 0.1, 0.12, 'sine'], [784, 0.2, 0.12, 'sine'], [1047, 0.3, 0.3, 'sine']],
        }[kind] || [];
        tones.forEach(([freq, at, dur, type]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t0 + at);
          gain.gain.exponentialRampToValueAtTime(0.16, t0 + at + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t0 + at);
          osc.stop(t0 + at + dur + 0.02);
        });
      } catch (e) { /* audio indisponible */ }
    },
  };

  /* ------------------------------------------------------------------ Données */
  const R = cfg.regions;
  const names = {};
  Object.keys(R).forEach((c) => { names[c] = R[c].name; });
  const shortLabels = cfg.labels && cfg.labels.short === 'code'
    ? Object.fromEntries(Object.keys(R).map((c) => [c, c])) : null;

  const els = {
    body: document.body,
    stage: $('.stage'),
    view: $('.map-view'),
    sheet: $('.sheet'),
    sheetHead: $('.sheet__head'),
    sheetBody: $('.sheet__body'),
    sheetFoot: $('.sheet__foot'),
    hud: $('.hud'),
    live: $('.live'),
  };

  const map = new Atlas.MapView(els.view, {
    names,
    shortLabels,
    capsLabels: !!(cfg.labels && cfg.labels.caps),
    maxZoom: cfg.maxZoom || 12,
    home: cfg.home || null,
    small: cfg.small || [],
  });
  const codes = Object.keys(R).filter((c) => map.region(c));
  const flagOf = (code) => (R[code] && R[code].flag ? cfg.flags + R[code].flag : null);

  const sortKey = (code) => (cfg.sort === 'code' ? parseFloat(code.replace('2A', '20.1').replace('2B', '20.2')) : 0);
  const sorted = codes.slice().sort((a, b) => (cfg.sort === 'code'
    ? sortKey(a) - sortKey(b)
    : names[a].localeCompare(names[b], 'fr')));

  const fmt = {
    int: (n) => Number(n).toLocaleString('fr-FR'),
    population(n) {
      if (n == null) return '—';
      if (n >= 1e6) {
        const m = n / 1e6;
        return `${m.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} million${m >= 2 ? 's' : ''}`;
      }
      return `${Number(n).toLocaleString('fr-FR')} hab.`;
    },
    area: (n) => (n == null ? '—' : `${Number(n).toLocaleString('fr-FR')} km²`),
    time(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    },
  };

  const announce = (text) => {
    els.live.textContent = '';
    global.setTimeout(() => { els.live.textContent = text; }, 30);
  };

  /* ------------------------------------------------------------------ État */
  const state = {
    mode: 'explore',
    selected: null,
    query: '',
    sheetCollapsed: false,
  };

  const quiz = {
    status: 'setup',
    type: cfg.questions[0].id,
    length: 10,
    small: true,
    queue: [],
    index: 0,
    tries: 0,
    results: new Map(),
    streak: 0,
    best: 0,
    started: 0,
    elapsed: 0,
    timer: 0,
    locked: false,
    pending: 0,
    review: null,
  };
  Object.assign(quiz, store.get(`quiz:${cfg.id}`, {}), { status: 'setup' });
  if (!cfg.questions.some((q) => q.id === quiz.type)) quiz.type = cfg.questions[0].id;

  /* ------------------------------------------------------------------ Mise en page : feuillet et marges de la carte */
  function sheetVisible() {
    return !els.sheet.classList.contains('is-hidden');
  }

  // mode : true (en douceur), false (sans animation) ou 'measure' (sans bouger la caméra).
  function updateInsets(animate) {
    const hudOn = !els.hud.classList.contains('is-hidden');
    const insets = { top: 0, right: 0, bottom: 0, left: 0 };
    if (sheetVisible()) {
      if (narrow()) insets.bottom = els.sheet.offsetHeight + 12;
      else insets.right = els.sheet.offsetWidth + 24;
    }
    if (hudOn) insets.top = els.hud.offsetHeight + 20;
    const controls = $('.map-controls');
    if (controls) {
      controls.style.right = !narrow() && sheetVisible() ? `${els.sheet.offsetWidth + 32}px` : '';
      controls.style.bottom = narrow() && sheetVisible() ? `${els.sheet.offsetHeight + 16}px` : '';
    }
    map.setInsets(insets, animate === 'measure' ? 'measure' : animate ? 'animate' : 'jump');
  }

  function setSheet(visible) {
    els.sheet.classList.toggle('is-hidden', !visible);
    updateInsets(true);
  }

  /* ------------------------------------------------------------------ Explorer : index et fiche */
  function renderSearch() {
    const noun = cfg.noun;
    els.sheetHead.innerHTML = `
      <label class="search">
        <span class="sr-only">Rechercher : ${esc(noun.search)}</span>
        ${icon('search')}
        <input type="search" autocomplete="off" spellcheck="false" placeholder="${esc(noun.search)}" value="${esc(state.query)}">
        <button type="button" class="icon-btn search__clear" aria-label="Effacer la recherche"${state.query ? '' : ' hidden'}>${icon('close')}</button>
      </label>`;
    const input = $('input', els.sheetHead);
    const clear = $('.search__clear', els.sheetHead);
    input.addEventListener('input', () => {
      state.query = input.value;
      clear.hidden = !state.query;
      if (state.selected) deselect(false);
      renderIndex();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = $('.index__item', els.sheetBody);
        if (first) first.click();
      }
      if (e.key === 'ArrowDown') {
        const first = $('.index__item', els.sheetBody);
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    input.addEventListener('focus', () => expandSheet());
    clear.addEventListener('click', () => {
      state.query = '';
      input.value = '';
      clear.hidden = true;
      renderIndex();
      input.focus();
    });
  }

  function matches(code, q) {
    if (!q) return true;
    const r = R[code];
    const hay = fold([r.name, r.official, r.capital, code, r.region].filter(Boolean).join(' '));
    return fold(q).split(/\s+/).filter(Boolean).every((part) => hay.includes(part));
  }

  function leadOf(code) {
    if (cfg.index && cfg.index.lead === 'flag' && flagOf(code)) {
      return `<img class="index__flag${R[code].square ? ' index__flag--square' : ''}" src="${esc(flagOf(code))}" alt="" loading="lazy" width="42" height="28">`;
    }
    return `<span class="code">${esc(code)}</span>`;
  }

  function renderIndex() {
    const list = sorted.filter((c) => matches(c, state.query));
    const noun = cfg.noun;
    let html = `<div class="index__meta"><span>${state.query ? `${list.length} résultat${list.length > 1 ? 's' : ''}` : `${codes.length} ${esc(noun.many)}`}</span><span>${cfg.sort === 'code' ? 'Par numéro' : 'De A à Z'}</span></div>`;
    if (!list.length) {
      html += `<div class="index__empty"><strong>Aucun résultat pour « ${esc(state.query)} »</strong>Essaie un autre nom, une capitale ou un code.</div>`;
    } else {
      html += '<ul class="index__list" role="list">';
      list.forEach((code) => {
        const r = R[code];
        const sub = r[cfg.index.sub] || '';
        html += `<li><button type="button" class="index__item" data-code="${esc(code)}"${state.selected === code ? ' aria-current="true"' : ''}>
          ${leadOf(code)}
          <span class="index__text"><span class="index__name">${esc(r.name)}</span><span class="index__sub">${esc(sub)}</span></span>
          ${cfg.index.lead === 'flag' ? `<span class="code">${esc(code)}</span>` : ''}
        </button></li>`;
      });
      html += '</ul>';
    }
    html += `<p class="sources" style="padding: 0 16px 18px">${cfg.sources}</p>`;
    els.sheetBody.innerHTML = html;
    els.sheetBody.scrollTop = 0;
    $$('.index__item', els.sheetBody).forEach((btn) => {
      const code = btn.dataset.code;
      btn.addEventListener('click', () => select(code, { fly: true, from: 'index' }));
      btn.addEventListener('mouseenter', () => map.setState(code, 'hover', true));
      btn.addEventListener('mouseleave', () => map.setState(code, 'hover', false));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const items = $$('.index__item', els.sheetBody);
          const i = items.indexOf(btn) + (e.key === 'ArrowDown' ? 1 : -1);
          if (items[i]) items[i].focus();
          else if (i < 0) $('input', els.sheetHead).focus();
        }
      });
    });
  }

  function factValue(f, r) {
    const v = r[f.key];
    if (f.format === 'population') {
      return `${fmt.population(v)}${r.populationYear ? ` <small>(${r.populationYear})</small>` : ''}`;
    }
    if (f.format === 'area') return fmt.area(v);
    if (f.format === 'eu') return v ? `Membre depuis ${v}` : 'Non membre';
    if (f.format === 'year') return v ? String(v) : '—';
    return esc(v == null || v === '' ? '—' : v);
  }

  function renderFiche(code) {
    const r = R[code];
    const reg = map.region(code);
    const flag = flagOf(code);
    const head = flag
      ? `<img class="fiche__flag${r.square ? ' fiche__flag--square' : ''}" src="${esc(flag)}" alt="Drapeau : ${esc(r.name)}">`
      : `<span class="fiche__badge" aria-hidden="true">${esc(code)}</span>`;
    const facts = cfg.facts.map((f) => {
      if (f.key === 'capitalNote' && !r.capitalNote) return '';
      return `<div${f.wide ? ' class="is-wide"' : ''}><dt>${esc(f.label)}</dt><dd>${factValue(f, r)}</dd></div>`;
    }).join('');
    const near = reg.neighbors.filter((c) => R[c]).sort((a, b) => names[a].localeCompare(names[b], 'fr'));
    const outside = reg.neighborsOutside;
    const nearHtml = near.length || outside.length ? `
      <section class="fiche__section">
        <h3>${esc(cfg.noun.neighbors)}</h3>
        <div class="chips">
          ${near.map((c) => `<button type="button" class="chip" data-goto="${esc(c)}">${esc(names[c])}</button>`).join('')}
          ${outside.map((n) => `<span class="chip chip--static" title="Hors de cette carte">${esc(n)}</span>`).join('')}
        </div>
      </section>` : '';
    els.sheetBody.innerHTML = `
      <article class="fiche" aria-labelledby="fiche-title">
        <div class="fiche__nav">
          <button type="button" class="btn btn--quiet" data-act="index">${icon('list')}<span>Tous les ${esc(cfg.noun.many)}</span></button>
          ${flag ? `<span class="code">${esc(code)}</span>` : ''}
        </div>
        <div class="fiche__head">
          <div>
            <h2 id="fiche-title" tabindex="-1">${esc(r.name)}</h2>
            ${r.official ? `<p class="fiche__official">${esc(r.official)}</p>` : ''}
          </div>
          ${head}
        </div>
        <dl class="facts">${facts}</dl>
        ${r.note ? `<p class="fiche__note">${esc(r.note)}</p>` : ''}
        ${nearHtml}
        <div class="fiche__actions">
          <button type="button" class="btn" data-act="locate">${icon('locate')}<span>Centrer</span></button>
          <button type="button" class="btn btn--primary" data-act="quiz">${icon('quiz')}<span>Se tester</span></button>
        </div>
        <p class="sources">${cfg.sources}</p>
      </article>`;
    els.sheetBody.scrollTop = 0;
    $('[data-act="index"]', els.sheetBody).addEventListener('click', () => deselect(true));
    $('[data-act="locate"]', els.sheetBody).addEventListener('click', () => map.flyTo(code, { maxZoom: cfg.maxZoom }));
    $('[data-act="quiz"]', els.sheetBody).addEventListener('click', () => setMode('quiz'));
    $$('[data-goto]', els.sheetBody).forEach((b) => {
      b.addEventListener('click', () => select(b.dataset.goto, { fly: true, from: 'neighbor' }));
      b.addEventListener('mouseenter', () => map.setState(b.dataset.goto, 'hover', true));
      b.addEventListener('mouseleave', () => map.setState(b.dataset.goto, 'hover', false));
    });
  }

  function select(code, opts) {
    const o = opts || {};
    if (!R[code]) return;
    if (state.selected) {
      map.setState(state.selected, 'selected', false);
      const prev = map.region(state.selected);
      prev.neighbors.forEach((c) => map.setState(c, 'neighbor', false));
    }
    state.selected = code;
    map.setState(code, 'selected', true);
    map.region(code).neighbors.forEach((c) => map.setState(c, 'neighbor', true));
    renderFiche(code);
    expandSheet();
    if (o.fly) map.flyTo(code, { ifNeeded: o.from === 'map', maxZoom: Math.min(cfg.maxZoom, o.from === 'map' ? 4 : 6) });
    else map.flyTo(code, { ifNeeded: true, maxZoom: 4 });
    try { global.history.replaceState(null, '', `#${code}`); } catch (e) { /* fichier local */ }
    announce(`${R[code].name} sélectionné.`);
    if (o.focus !== false && o.from !== 'map') {
      const title = $('#fiche-title');
      if (title) title.focus({ preventScroll: true });
    }
  }

  function deselect(showIndex) {
    if (state.selected) {
      map.setState(state.selected, 'selected', false);
      map.region(state.selected).neighbors.forEach((c) => map.setState(c, 'neighbor', false));
    }
    state.selected = null;
    try { global.history.replaceState(null, '', global.location.pathname + global.location.search); } catch (e) { /* fichier local */ }
    if (showIndex) renderIndex();
  }

  function renderFoot() {
    els.sheetFoot.innerHTML = `
      <label class="switch">
        <span>Noms sur la carte</span>
        <input type="checkbox"${prefs.labels ? ' checked' : ''}>
        <span class="switch__track" aria-hidden="true"></span>
      </label>`;
    $('input', els.sheetFoot).addEventListener('change', (e) => {
      prefs.labels = e.target.checked;
      savePrefs();
      if (state.mode === 'explore') map.setLabelMode(prefs.labels ? 'names' : 'none');
    });
  }

  function expandSheet() {
    if (!state.sheetCollapsed) return;
    state.sheetCollapsed = false;
    els.sheet.classList.remove('is-collapsed');
    updateInsets(true);
  }

  /* ------------------------------------------------------------------ Modes */
  function setMode(mode) {
    if (mode === state.mode && mode !== 'quiz') return;
    if (state.mode === 'quiz') stopQuiz(true);
    state.mode = mode;
    els.body.dataset.mode = mode;
    $$('button[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    map.clearPins();
    if (mode === 'explore') {
      map.clearStates(['hit', 'retry', 'miss', 'wrong', 'target']);
      map.dblZoom = true;
      map.setLabelMode(prefs.labels ? 'names' : 'none');
      els.hud.classList.add('is-hidden');
      els.sheetFoot.hidden = false;
      renderSearch();
      renderFoot();
      if (state.selected) renderFiche(state.selected); else renderIndex();
      setSheet(true);
    } else {
      if (state.selected) deselect(false);
      map.dblZoom = false;
      map.setLabelMode('none');
      renderSetup();
      setSheet(true);
    }
  }

  /* ------------------------------------------------------------------ Quiz : réglages */
  const question = () => cfg.questions.find((q) => q.id === quiz.type);

  function pool(type, small) {
    const q = cfg.questions.find((x) => x.id === type);
    return codes.filter((c) => {
      if (!small && (cfg.small || []).includes(c)) return false;
      if (q.prompt === 'flag') return !!flagOf(c);
      if (q.prompt !== 'name' && q.prompt !== 'code') return !!R[c][q.prompt];
      return true;
    });
  }

  const recordKey = () => `record:${cfg.id}:${quiz.type}:${quiz.length}:${quiz.small ? 1 : 0}`;

  function renderSetup() {
    quiz.status = 'setup';
    els.hud.classList.add('is-hidden');
    els.sheetHead.innerHTML = '';
    els.sheetFoot.hidden = true;
    const total = pool(quiz.type, quiz.small).length;
    const record = store.get(recordKey(), null);
    const lengths = [10, 20, 'all'];
    els.sheetBody.innerHTML = `
      <section class="setup" aria-labelledby="setup-title">
        <h2 id="setup-title">Quiz</h2>
        <p class="setup__lead">${esc(cfg.quizLead)}</p>
        <fieldset>
          <legend>Je cherche…</legend>
          <div class="segmented segmented--block" role="group" aria-label="Type de question">
            ${cfg.questions.map((q) => `<button type="button" data-type="${q.id}" aria-pressed="${q.id === quiz.type}">${esc(q.label)}</button>`).join('')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Nombre de questions</legend>
          <div class="segmented segmented--block" role="group" aria-label="Nombre de questions">
            ${lengths.map((n) => `<button type="button" data-length="${n}" aria-pressed="${String(n) === String(quiz.length)}">${n === 'all' ? `Tous (${total})` : n}</button>`).join('')}
          </div>
        </fieldset>
        ${cfg.small && cfg.small.length ? `
        <label class="switch">
          <span class="switch__label">${esc(cfg.smallLabel)}<small>${esc(cfg.small.map((c) => names[c]).join(', '))}</small></span>
          <input type="checkbox" data-small${quiz.small ? ' checked' : ''}>
          <span class="switch__track" aria-hidden="true"></span>
        </label>` : ''}
        <div class="record">${record
          ? `<span>${icon('award')} Record</span><strong>${record.hits}/${record.total} · ${fmt.time(record.time)}</strong>`
          : '<span>Pas encore de record pour ce réglage.</span>'}</div>
        <button type="button" class="btn btn--primary btn--lg btn--block" data-start>${icon('quiz')}<span>Commencer</span></button>
        <ul class="legend" aria-label="Légende de la correction">
          <li>${swatch('hit')}Trouvé du premier coup</li>
          <li>${swatch('retry')}Trouvé au 2e ou 3e essai</li>
          <li>${swatch('miss')}Manqué : la carte montre la bonne réponse</li>
        </ul>
      </section>`;
    $$('[data-type]', els.sheetBody).forEach((b) => b.addEventListener('click', () => {
      quiz.type = b.dataset.type;
      saveQuizPrefs();
      renderSetup();
      const again = $(`[data-type="${quiz.type}"]`, els.sheetBody);
      if (again) again.focus();
    }));
    $$('[data-length]', els.sheetBody).forEach((b) => b.addEventListener('click', () => {
      quiz.length = b.dataset.length === 'all' ? 'all' : Number(b.dataset.length);
      saveQuizPrefs();
      renderSetup();
      const again = $(`[data-length="${quiz.length}"]`, els.sheetBody);
      if (again) again.focus();
    }));
    const small = $('[data-small]', els.sheetBody);
    if (small) small.addEventListener('change', () => { quiz.small = small.checked; saveQuizPrefs(); renderSetup(); });
    $('[data-start]', els.sheetBody).addEventListener('click', () => startQuiz());
  }

  function saveQuizPrefs() {
    store.set(`quiz:${cfg.id}`, { type: quiz.type, length: quiz.length, small: quiz.small });
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ------------------------------------------------------------------ Quiz : partie */
  function startQuiz(only) {
    const all = pool(quiz.type, quiz.small);
    let queue = only ? shuffle(only.filter((c) => all.includes(c))) : shuffle(all);
    if (!only && quiz.length !== 'all') queue = queue.slice(0, quiz.length);
    if (!queue.length) return;
    clearTimeout(quiz.pending);
    clearInterval(quiz.timer);
    Object.assign(quiz, {
      status: 'play',
      queue,
      index: 0,
      tries: 0,
      results: new Map(),
      streak: 0,
      best: 0,
      started: performance.now(),
      elapsed: 0,
      locked: false,
      review: only ? 'errors' : null,
    });
    map.clearPins();
    map.clearStates(['hit', 'retry', 'miss', 'wrong', 'target', 'selected', 'neighbor']);
    map.setLabelMode('answered');
    closeResult();
    els.sheet.classList.add('is-hidden');
    els.hud.classList.remove('is-hidden');
    renderHud();
    updateInsets('measure');
    map.home(true);
    quiz.timer = global.setInterval(tick, 250);
    announceQuestion();
  }

  function tick() {
    if (quiz.status !== 'play') return;
    quiz.elapsed = performance.now() - quiz.started;
    const t = $('[data-time]', els.hud);
    if (t) t.textContent = fmt.time(quiz.elapsed);
  }

  const target = () => quiz.queue[quiz.index];
  const hits = () => Array.from(quiz.results.values()).filter((v) => v === 'hit').length;

  function promptHtml(code) {
    const q = question();
    const r = R[code];
    if (q.prompt === 'flag') {
      return `<span class="hud__lead">${esc(q.lead)}</span><img class="hud__flag" src="${esc(flagOf(code))}" alt="Drapeau à retrouver">`;
    }
    const value = q.prompt === 'name' ? r.name : q.prompt === 'code' ? code : r[q.prompt];
    return `<span class="hud__lead">${esc(q.lead)}</span><strong class="hud__target${q.prompt === 'code' ? ' hud__target--code' : ''}">${esc(value)}</strong>`;
  }

  function renderHud(feedback) {
    const code = target();
    const total = quiz.queue.length;
    const tries = [0, 1, 2].map((i) => `<span class="${i < quiz.tries ? 'is-used' : ''}"></span>`).join('');
    let prompt = promptHtml(code);
    if (feedback) prompt = feedback;
    els.hud.className = 'hud';
    els.hud.innerHTML = `
      <div class="hud__progress" aria-label="Question ${quiz.index + 1} sur ${total}">${quiz.index + 1}<small>/${total}</small></div>
      <div class="hud__prompt" aria-live="off">${prompt}</div>
      <div class="hud__side">
        <div class="tries" aria-label="${3 - quiz.tries} essai${3 - quiz.tries > 1 ? 's' : ''} restant${3 - quiz.tries > 1 ? 's' : ''}">${tries}</div>
        <div class="hud__stat hud__stat--score"><strong data-score>${hits()}</strong><span>trouvés</span></div>
        <div class="hud__stat hud__stat--time"><strong data-time>${fmt.time(quiz.elapsed)}</strong><span>temps</span></div>
      </div>
      <button type="button" class="icon-btn" data-skip title="Je ne sais pas" aria-label="Je ne sais pas : montrer la réponse">${icon('question')}</button>
      <button type="button" class="icon-btn" data-stop title="Arrêter le quiz" aria-label="Arrêter le quiz">${icon('close')}</button>`;
    $('[data-skip]', els.hud).addEventListener('click', () => { if (!quiz.locked) reveal(true); });
    $('[data-stop]', els.hud).addEventListener('click', () => finish(true));
  }

  function announceQuestion() {
    const q = question();
    const code = target();
    const r = R[code];
    const what = q.prompt === 'flag' ? 'le drapeau affiché' : q.prompt === 'name' ? r.name : q.prompt === 'code' ? code : r[q.prompt];
    announce(`Question ${quiz.index + 1} sur ${quiz.queue.length}. ${q.lead} ${what}.`);
  }

  function answer(code, info) {
    if (quiz.status !== 'play' || quiz.locked) return;
    const goal = target();
    if (code === goal) {
      quiz.locked = true;
      const result = quiz.tries === 0 ? 'hit' : 'retry';
      quiz.results.set(goal, result);
      map.setState(goal, result, true);
      map.flash(goal);
      quiz.streak = result === 'hit' ? quiz.streak + 1 : 0;
      quiz.best = Math.max(quiz.best, quiz.streak);
      sound.play(result);
      if (result === 'hit') flyPoint(info);
      renderHud(`<span class="hud__lead">${quiz.streak >= 3 ? `${quiz.streak} d'affilée` : 'Bien vu'}</span><strong class="hud__target hud__feedback hud__feedback--hit">${icon('check')}${esc(R[goal].name)}</strong>`);
      els.hud.classList.add('is-hit');
      announce(`Correct : ${R[goal].name}.`);
      quiz.pending = global.setTimeout(nextQuestion, reduced() ? 900 : 750);
      return;
    }
    quiz.tries += 1;
    clearTimeout(quiz.wrongTimer);
    map.clearStates(['wrong']);
    map.clearPins();
    map.setState(code, 'wrong', true);
    map.pin(code, `${icon('cross')}<span>${esc(R[code] ? R[code].name : '')}</span>`, 'miss');
    quiz.wrongTimer = global.setTimeout(() => {
      map.setState(code, 'wrong', false);
      map.clearPins();
    }, 1400);
    quiz.streak = 0;
    if (quiz.tries >= 3) {
      sound.play('miss');
      reveal(false, code);
      return;
    }
    sound.play('wrong');
    renderHud();
    els.hud.classList.add('is-wrong');
    announce(`Non, c'est ${R[code] ? R[code].name : 'une autre région'}. Encore ${3 - quiz.tries} essai${3 - quiz.tries > 1 ? 's' : ''}.`);
  }

  function reveal(skipped, lastWrong) {
    const goal = target();
    quiz.locked = true;
    clearTimeout(quiz.wrongTimer);
    map.clearStates(['wrong']);
    map.clearPins();
    quiz.results.set(goal, 'miss');
    quiz.streak = 0;
    map.setState(goal, 'miss', true);
    map.setState(goal, 'target', true);
    map.pin(goal, `${icon('locate')}<span>${esc(R[goal].name)}</span>`, null, true);
    map.flyTo(lastWrong ? [goal, lastWrong] : goal, { ifNeeded: true, maxZoom: 5, padding: 0.45 });
    if (skipped) sound.play('miss');
    renderHud(`<span class="hud__lead">${skipped ? 'La réponse' : 'Raté, c’était ici'}</span><strong class="hud__target hud__feedback hud__feedback--miss">${esc(R[goal].name)}</strong>`);
    els.hud.classList.add('is-miss');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn--primary hud__next';
    next.innerHTML = `<span>Suivant</span>${icon('next')}`;
    next.addEventListener('click', () => nextQuestion());
    $('[data-skip]', els.hud).replaceWith(next);
    next.focus({ preventScroll: true });
    announce(`${skipped ? 'Réponse' : 'Raté'} : ${R[goal].name} est maintenant entouré sur la carte.`);
    quiz.pending = global.setTimeout(nextQuestion, 3600);
  }

  function nextQuestion() {
    clearTimeout(quiz.pending);
    if (quiz.status !== 'play') return;
    const goal = target();
    map.setState(goal, 'target', false);
    map.clearPins();
    quiz.index += 1;
    quiz.tries = 0;
    quiz.locked = false;
    if (quiz.index >= quiz.queue.length) {
      finish(false);
      return;
    }
    renderHud();
    announceQuestion();
  }

  function flyPoint(info) {
    if (reduced() || !info || info.clientX == null) return;
    const scoreEl = $('[data-score]', els.hud);
    if (!scoreEl) return;
    const stage = els.stage.getBoundingClientRect();
    const to = scoreEl.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly-point';
    dot.textContent = '+1';
    els.stage.appendChild(dot);
    const x0 = info.clientX - stage.left - 16;
    const y0 = info.clientY - stage.top - 28;
    const x1 = to.left - stage.left;
    const y1 = to.top - stage.top;
    const anim = dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0 - 18}px) scale(1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.7)`, opacity: 0.9 },
    ], { duration: 720, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    anim.onfinish = () => {
      dot.remove();
      if (scoreEl.isConnected && scoreEl.animate) {
        scoreEl.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
      }
    };
  }

  function stopQuiz(silent) {
    clearTimeout(quiz.pending);
    clearInterval(quiz.timer);
    quiz.status = 'setup';
    quiz.locked = false;
    els.hud.classList.add('is-hidden');
    closeResult();
    if (!silent) renderSetup();
  }

  function finish(stopped) {
    clearTimeout(quiz.pending);
    clearInterval(quiz.timer);
    quiz.elapsed = performance.now() - quiz.started;
    const goal = target();
    if (goal) map.setState(goal, 'target', false);
    map.clearPins();
    const answered = Array.from(quiz.results.keys());
    if (stopped && !answered.length) {
      stopQuiz();
      setSheet(true);
      return;
    }
    quiz.status = 'done';
    quiz.locked = true;
    els.hud.classList.add('is-hidden');
    sound.play('done');
    const total = answered.length;
    const h = hits();
    const complete = !stopped && total === quiz.queue.length;
    let record = null;
    let isRecord = false;
    if (complete && !quiz.review) {
      record = store.get(recordKey(), null);
      if (!record || h > record.hits || (h === record.hits && quiz.elapsed < record.time)) {
        isRecord = true;
        store.set(recordKey(), { hits: h, total, time: Math.round(quiz.elapsed) });
      }
    }
    showResult({ total, hits: h, stopped, isRecord, hadRecord: !!record });
    updateInsets(true);
  }

  /* ------------------------------------------------------------------ Bilan */
  function closeResult() {
    const layer = $('.result-layer');
    if (layer) layer.remove();
  }

  function showResult(r) {
    closeResult();
    const q = question();
    const errors = Array.from(quiz.results.entries()).filter(([, v]) => v !== 'hit').map(([c]) => c);
    const retry = errors.filter((c) => quiz.results.get(c) === 'retry').length;
    const misses = errors.length - retry;
    const pct = r.total ? Math.round(r.hits / r.total * 100) : 0;
    const layer = document.createElement('div');
    layer.className = 'result-layer';
    layer.innerHTML = `
      <section class="result" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <h2 id="result-title" tabindex="-1">${r.stopped ? 'Quiz arrêté' : pct === 100 ? 'Sans faute' : 'Quiz terminé'}</h2>
        <p class="result__context">${esc(cfg.title)} · ${esc(q.label)}${quiz.review ? ' · révision des erreurs' : ''}</p>
        <p class="result__score"><strong>${r.hits}</strong><span>/ ${r.total}</span>
          ${r.isRecord ? `<span class="result__record">${icon('award')}${r.hadRecord ? 'Nouveau record' : 'Premier record'}</span>` : ''}</p>
        <dl class="result__stats">
          <div><dt>Du 1er coup</dt><dd>${pct} %</dd></div>
          <div><dt>Temps</dt><dd>${fmt.time(quiz.elapsed)}</dd></div>
          <div><dt>Meilleure série</dt><dd>${quiz.best}</dd></div>
        </dl>
        ${errors.length ? `
        <section class="result__review">
          <h3>À revoir : ${[misses ? `${misses} manqué${misses > 1 ? 's' : ''}` : '', retry ? `${retry} trouvé${retry > 1 ? 's' : ''} après une erreur` : ''].filter(Boolean).join(', ')}</h3>
          <div class="chips">${errors.map((c) => `<button type="button" class="chip" data-show="${esc(c)}">${swatch(quiz.results.get(c))}${esc(R[c].name)}</button>`).join('')}</div>
        </section>` : `<p class="result__perfect">Tous trouvés du premier coup. Essaie une autre série ou un autre type de question.</p>`}
        <div class="result__actions">
          ${errors.length ? `<button type="button" class="btn btn--primary btn--lg" data-errors>${icon('replay')}<span>${errors.length > 1 ? `Revoir mes ${errors.length} erreurs` : 'Revoir mon erreur'}</span></button>` : ''}
          <div class="row">
            <button type="button" class="btn${errors.length ? '' : ' btn--primary'}" data-again>${icon('replay')}<span>Nouvelle partie</span></button>
            <button type="button" class="btn" data-map>${icon('map')}<span>Carte corrigée</span></button>
          </div>
          <button type="button" class="btn btn--quiet" data-setup>Changer de réglage</button>
        </div>
      </section>`;
    els.stage.appendChild(layer);
    const card = $('.result', layer);
    $('#result-title', layer).focus({ preventScroll: true });
    const errorsBtn = $('[data-errors]', layer);
    if (errorsBtn) errorsBtn.addEventListener('click', () => startQuiz(errors));
    $('[data-again]', layer).addEventListener('click', () => startQuiz());
    $('[data-setup]', layer).addEventListener('click', () => { closeResult(); map.clearStates(['hit', 'retry', 'miss']); renderSetup(); setSheet(true); });
    $('[data-map]', layer).addEventListener('click', () => showCorrected());
    $$('[data-show]', layer).forEach((b) => b.addEventListener('click', () => showCorrected(b.dataset.show)));
    layer.addEventListener('click', (e) => { if (e.target === layer) showCorrected(); });
    layer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); showCorrected(); }
      if (e.key === 'Tab') {
        const focusables = $$('button', card);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Carte corrigée : la partie reste affichée, noms visibles sur les régions jouées.
  function showCorrected(code) {
    closeResult();
    quiz.status = 'review';
    map.setLabelMode('answered');
    els.hud.className = 'hud';
    const h = hits();
    els.hud.innerHTML = `
      <div class="hud__prompt"><span class="hud__lead">Carte corrigée</span><strong class="hud__target">${h} / ${quiz.results.size}</strong></div>
      <div class="hud__side" style="border:0">
        <button type="button" class="btn" data-result>Bilan</button>
        <button type="button" class="btn btn--primary" data-again>${icon('replay')}<span>Rejouer</span></button>
      </div>
      <button type="button" class="icon-btn" data-stop title="Fermer" aria-label="Fermer la correction">${icon('close')}</button>`;
    $('[data-result]', els.hud).addEventListener('click', () => {
      quiz.status = 'done';
      els.hud.classList.add('is-hidden');
      showResult({ total: quiz.results.size, hits: h, stopped: false, isRecord: false });
    });
    $('[data-again]', els.hud).addEventListener('click', () => startQuiz());
    $('[data-stop]', els.hud).addEventListener('click', () => { map.clearStates(['hit', 'retry', 'miss']); stopQuiz(); setSheet(true); });
    updateInsets(true);
    if (code) {
      map.flyTo(code, { maxZoom: 5, padding: 0.6 });
      map.flash(code);
    }
  }

  /* ------------------------------------------------------------------ Carte : événements */
  map.tooltipFormatter = (code, contextName) => {
    if (state.mode !== 'explore') return null;
    if (!code) return `${esc(contextName)} <span class="code">hors carte</span>`;
    if (!R[code]) return null;
    return `${esc(R[code].name)}<span class="code">${esc(code)}</span>`;
  };

  map.on('activate', (code, info) => {
    if (!R[code]) return;
    if (state.mode === 'explore') {
      if (state.selected === code) map.flyTo(code, { maxZoom: 5 });
      else select(code, { from: 'map', focus: false });
    } else if (quiz.status === 'play') {
      answer(code, info);
    } else if (quiz.status === 'review') {
      map.flash(code);
    }
  });

  map.on('background', () => {
    if (state.mode === 'explore' && state.selected && narrow()) {
      deselect(true);
    }
  });

  const zoomIn = $('[data-action="zoom-in"]');
  const zoomOut = $('[data-action="zoom-out"]');
  const zoomLevel = $('.zoom-level');
  map.on('camera', (cam) => {
    if (zoomIn) zoomIn.disabled = cam.atMax;
    if (zoomOut) zoomOut.disabled = cam.atMin;
    if (zoomLevel) zoomLevel.textContent = `×${cam.zoom < 9.95 ? cam.zoom.toFixed(1).replace('.', ',') : Math.round(cam.zoom)}`;
  });

  /* ------------------------------------------------------------------ Barre et commandes */
  $$('button[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  if (zoomIn) zoomIn.addEventListener('click', () => map.zoomIn());
  if (zoomOut) zoomOut.addEventListener('click', () => map.zoomOut());
  const fit = $('[data-action="fit"]');
  if (fit) fit.addEventListener('click', () => map.home(true));

  const soundBtn = $('[data-action="sound"]');
  const paintSound = () => {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', String(prefs.sound));
    soundBtn.setAttribute('aria-label', prefs.sound ? 'Couper le son' : 'Activer le son');
    soundBtn.title = prefs.sound ? 'Son activé' : 'Son coupé';
    soundBtn.innerHTML = icon(prefs.sound ? 'soundOn' : 'soundOff');
  };
  if (soundBtn) {
    paintSound();
    soundBtn.addEventListener('click', () => {
      prefs.sound = !prefs.sound;
      savePrefs();
      paintSound();
      sound.play('hit');
    });
  }

  const fsBtn = $('[data-action="fullscreen"]');
  const paintFs = () => {
    if (!fsBtn) return;
    const on = !!document.fullscreenElement;
    fsBtn.setAttribute('aria-pressed', String(on));
    fsBtn.setAttribute('aria-label', on ? 'Quitter le plein écran' : 'Plein écran');
    fsBtn.title = on ? 'Quitter le plein écran' : 'Plein écran (TBI)';
    fsBtn.innerHTML = icon(on ? 'shrink' : 'expand');
    els.body.classList.toggle('is-fullscreen', on);
  };
  if (fsBtn) {
    if (!document.documentElement.requestFullscreen) fsBtn.hidden = true;
    paintFs();
    fsBtn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    });
    document.addEventListener('fullscreenchange', () => { paintFs(); global.setTimeout(() => updateInsets(false), 60); });
  }

  const handle = $('.sheet__handle');
  if (handle) {
    handle.addEventListener('click', () => {
      state.sheetCollapsed = !state.sheetCollapsed;
      els.sheet.classList.toggle('is-collapsed', state.sheetCollapsed);
      handle.setAttribute('aria-expanded', String(!state.sheetCollapsed));
      updateInsets(true);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.mode === 'explore' && state.selected && !e.target.closest('input')) {
      deselect(true);
    }
  });

  let resizeTimer = 0;
  global.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = global.setTimeout(() => updateInsets(false), 120);
  });

  /* ------------------------------------------------------------------ Démarrage */
  els.body.dataset.mode = 'explore';
  renderSearch();
  renderFoot();
  renderIndex();
  map.setLabelMode(prefs.labels ? 'names' : 'none');
  updateInsets(false);
  map.home(false);
  const hash = decodeURIComponent(global.location.hash.slice(1));
  if (hash === 'quiz') setMode('quiz');
  else if (R[hash] && map.region(hash)) select(hash, { fly: true, from: 'hash', focus: false });

  global.Atlas.app = { map, select, setMode, startQuiz, state, quiz };
})(window);
