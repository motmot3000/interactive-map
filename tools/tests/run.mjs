// Tests de bout en bout : accueil, trois cartes, exploration, recherche, zoom, quiz, clavier, téléphone.
//   cd tools/tests && npm install && npm test
// Utilise le Google Chrome installé (CHROME_PATH pour un autre exécutable) ; sert le site lui-même.
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain',
};

function serve() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    if (file.endsWith('/')) file += 'index.html';
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('introuvable');
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

const results = [];
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const { server, base } = await serve();
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });

async function test(name, fn, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const started = Date.now();
  try {
    await fn(page);
    assert(!errors.length, `erreurs dans la console : ${errors.join(' | ')}`);
    results.push(['ok', name, Date.now() - started]);
  } catch (e) {
    results.push(['ÉCHEC', name, Date.now() - started, e.message.split('\n')[0]]);
  } finally {
    await context.close();
  }
}

const settle = (page) => page.waitForFunction(() => !window.Atlas.app.map.motion && !window.Atlas.app.map.dirty, null, { timeout: 8000 });
async function open(page, map) {
  await page.goto(`${base}/maps/${map}/index.html`);
  await page.waitForFunction(() => window.Atlas && window.Atlas.app);
  await settle(page);
}
async function clickRegion(page, code) {
  await settle(page);
  const pt = await page.evaluate((c) => {
    const m = window.Atlas.app.map;
    const s = m.screenPointOf(c);
    const r = m.root.getBoundingClientRect();
    return { x: r.left + s.x, y: r.top + s.y };
  }, code);
  await page.mouse.click(pt.x, pt.y);
}
const press = (page, selector) => page.evaluate((s) => document.querySelector(s).click(), selector);

// ---------------------------------------------------------------- Accueil
await test('Accueil : chargement et planche jouable', async (page) => {
  await page.goto(`${base}/index.html`);
  await page.waitForSelector('[data-teaser-target]');
  const h1 = await page.textContent('h1');
  assert(h1.includes('Cartes interactives'), `titre inattendu : ${h1}`);
  const name = (await page.textContent('[data-teaser-target]')).trim();
  const code = await page.evaluate((n) => Object.keys(window.ATLAS_MAP.regions).find((c) => window.ATLAS_MAP.regions[c].name === n), name);
  assert(code, `pays introuvable pour « ${name} »`);
  // Un point vraiment dans le pays : le centre du rectangle tombe hors de la Norvège, de la Grèce ou du Danemark.
  const pt = await page.evaluate((c) => {
    const path = document.querySelector(`.teaser [data-code="${c}"]`);
    const bb = path.getBBox();
    const m = path.getScreenCTM();
    const inside = [];
    for (let i = 1; i < 24; i++) {
      for (let j = 1; j < 24; j++) {
        const p = new DOMPoint(bb.x + (bb.width * i) / 24, bb.y + (bb.height * j) / 24);
        if (!path.isPointInFill(p)) continue;
        const s = p.matrixTransform(m);
        const hit = document.elementFromPoint(s.x, s.y);
        if (hit && hit.closest('[data-code]') === path) inside.push({ x: s.x, y: s.y, d: Math.hypot(i - 12, j - 12) });
      }
    }
    inside.sort((a, b) => a.d - b.d);
    return inside[0] || null;
  }, code);
  assert(pt, `aucun point cliquable dans « ${name} »`);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForFunction(() => document.querySelector('[data-teaser-count]').textContent.trim().startsWith('1'), null, { timeout: 4000 });
  const images = await page.evaluate(async () => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const res = await fetch(img.getAttribute('src'));
      out.push([img.getAttribute('src'), res.status]);
    }
    return out;
  });
  const broken = images.filter(([, s]) => s !== 200);
  assert(!broken.length, `images absentes : ${broken.map(([s]) => s).join(', ')}`);
});

// ---------------------------------------------------------------- Cohérence des cartes
for (const [map, expected] of [['europe', 47], ['suisse', 26], ['france', 96]]) {
  await test(`Carte ${map} : ${expected} régions, données et drapeaux cohérents`, async (page) => {
    await open(page, map);
    const report = await page.evaluate(async () => {
      const data = window.ATLAS_MAP;
      const svg = Array.from(document.querySelectorAll('.map-svg .region')).map((el) => el.getAttribute('data-code'));
      const missingSvg = Object.keys(data.regions).filter((c) => !svg.includes(c));
      const missingData = svg.filter((c) => !data.regions[c]);
      const flags = [];
      for (const [code, r] of Object.entries(data.regions)) {
        if (!r.flag) continue;
        const res = await fetch(data.flags + r.flag);
        if (res.status !== 200) flags.push(code);
      }
      const noName = Object.entries(data.regions).filter(([, r]) => !r.name || !r.capital || !r.population || !r.area).map(([c]) => c);
      return { count: svg.length, missingSvg, missingData, flags, noName };
    });
    assert(report.count === expected, `${report.count} régions dans le SVG`);
    assert(!report.missingSvg.length, `sans tracé : ${report.missingSvg}`);
    assert(!report.missingData.length, `sans fiche : ${report.missingData}`);
    assert(!report.flags.length, `drapeaux absents : ${report.flags}`);
    assert(!report.noName.length, `fiches incomplètes : ${report.noName}`);
  });
}

// ---------------------------------------------------------------- Plein cadre
// Sur chaque écran courant, le fond dessiné couvre toute la scène (aucun bord de planche) et le pays de départ
// tient entier dans la zone libre, en exploration comme en quiz.
const frameReport = (page) => page.evaluate(() => {
  const m = window.Atlas.app.map;
  const c = m._content();
  const h = m._homeBox();
  const box = { x1: h.x * m.k + m.x, y1: h.y * m.k + m.y, x2: (h.x + h.w) * m.k + m.x, y2: (h.y + h.h) * m.k + m.y };
  return {
    covers: m.x <= 0.5 && m.y <= 0.5 && m.x + m.W * m.k >= m.vw - 0.5 && m.y + m.H * m.k >= m.vh - m.hiddenBottom - 0.5,
    inside: box.x1 >= c.L - 2 && box.y1 >= c.T - 2 && box.x2 <= c.R + 2 && box.y2 <= c.B + 2,
    forced: m.k / (Math.min(c.w / h.w, c.h / h.h) * 0.94),
  };
});
for (const [w, h] of [[1440, 900], [1920, 1080], [1366, 768], [1024, 768], [768, 1024], [390, 844]]) {
  await test(`Plein cadre ${w}x${h} : fond sans bord, pays entier (3 cartes, exploration et quiz)`, async (page) => {
    const problems = [];
    for (const map of ['europe', 'suisse', 'france']) {
      await open(page, map);
      let r = await frameReport(page);
      if (!r.covers || !r.inside || r.forced > 1.08) problems.push(`${map} exploration ${JSON.stringify(r)}`);
      await press(page, 'button[data-mode="quiz"]');
      await press(page, '[data-start]');
      await settle(page);
      r = await frameReport(page);
      if (!r.covers || !r.inside || r.forced > 1.08) problems.push(`${map} quiz ${JSON.stringify(r)}`);
      for (let i = 0; i < 4; i++) await press(page, '[data-action="zoom-out"]');
      await settle(page);
      r = await frameReport(page);
      if (!r.covers) problems.push(`${map} dézoom maximal : bord visible`);
    }
    assert(!problems.length, problems.join(' | '));
    const scale = await page.textContent('.scalebar');
    assert(/\d km$/.test(scale.trim()), `échelle : « ${scale} »`);
  }, { width: w, height: h });
}

// ---------------------------------------------------------------- Explorer
await test('Explorer : clic sur une région, fiche, voisin', async (page) => {
  await open(page, 'france');
  await clickRegion(page, '69');
  await page.waitForSelector('.fiche h2');
  assert((await page.textContent('.fiche h2')) === 'Rhône', 'la fiche du Rhône ne s’ouvre pas');
  const chips = await page.locator('.fiche [data-goto]').allTextContents();
  assert(['Ain', 'Isère', 'Loire', 'Saône-et-Loire'].every((n) => chips.includes(n)), `voisins : ${chips}`);
  await press(page, '.fiche [data-goto="38"]');
  await page.waitForFunction(() => document.querySelector('.fiche h2').textContent === 'Isère');
  assert(page.url().endsWith('#38'), 'le lien de la fiche n’est pas mis à jour');
});

await test('Recherche : un numéro trouve le département', async (page) => {
  await open(page, 'france');
  await page.fill('.search input', '2A');
  const first = (await page.locator('.index__item .index__name').first().textContent()).trim();
  assert(first === 'Corse-du-Sud', `premier résultat : ${first}`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('.fiche h2') && document.querySelector('.fiche h2').textContent === 'Corse-du-Sud');
});

await test('Navigation : zoom aux boutons, molette, recadrage', async (page) => {
  await open(page, 'europe');
  await press(page, '[data-action="zoom-in"]');
  await settle(page);
  await press(page, '[data-action="zoom-in"]');
  await settle(page);
  const z1 = await page.evaluate(() => window.Atlas.app.map.k / window.Atlas.app.map.k0);
  assert(z1 > 3, `zoom après deux clics : ${z1.toFixed(2)}`);
  assert(await page.evaluate(() => document.querySelector('.minimap').classList.contains('is-on')), 'la mini-carte reste cachée');
  await press(page, '[data-action="fit"]');
  await settle(page);
  const z2 = await page.evaluate(() => window.Atlas.app.map.k / window.Atlas.app.map.k0);
  assert(Math.abs(z2 - 1) < 0.01, `recadrage : ${z2.toFixed(2)}`);
  await page.mouse.move(500, 450);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -200);
  await settle(page);
  const z3 = await page.evaluate(() => window.Atlas.app.map.k / window.Atlas.app.map.k0);
  assert(z3 > 1.5, `molette : ${z3.toFixed(2)}`);
});

// ---------------------------------------------------------------- Quiz
await test('Quiz : partie, erreurs corrigées sur la carte, révision des erreurs', async (page) => {
  await open(page, 'suisse');
  await page.evaluate(() => localStorage.clear());
  await press(page, 'button[data-mode="quiz"]');
  await press(page, '[data-start]');
  await settle(page);
  const state = () => page.evaluate(() => {
    const q = window.Atlas.app.quiz;
    return { status: q.status, index: q.index, target: q.queue[q.index], tries: q.tries, length: q.queue.length };
  });
  let s = await state();
  assert(s.status === 'play' && s.length === 10, `partie non lancée : ${JSON.stringify(s)}`);
  await clickRegion(page, s.target);
  await page.waitForFunction(() => window.Atlas.app.quiz.index === 1);
  s = await state();
  const wrong = await page.evaluate((t) => Object.keys(window.ATLAS_MAP.regions).filter((c) => c !== t).slice(0, 3), s.target);
  for (const code of wrong) await clickRegion(page, code);
  await page.waitForSelector('.hud__next');
  assert(await page.evaluate((t) => document.getElementById(`r-${t}`).classList.contains('is-miss'), s.target), 'la bonne réponse n’est pas montrée');
  await press(page, '.hud__next');
  for (let i = 0; i < 12; i++) {
    s = await state();
    if (s.status !== 'play') break;
    await clickRegion(page, s.target);
    await page.waitForFunction((n) => window.Atlas.app.quiz.index > n || window.Atlas.app.quiz.status !== 'play', s.index);
  }
  await page.waitForSelector('.sheet .result');
  const score = await page.textContent('.result__score strong');
  assert(score === '9', `score affiché : ${score}`);
  const docked = await page.evaluate(() => ({
    sheet: !document.querySelector('.sheet').classList.contains('is-hidden'),
    overlay: !!document.querySelector('.result-layer, [aria-modal="true"]'),
    miss: document.querySelectorAll('.region.is-miss').length,
    count: document.querySelector('.legend--counts li:last-child strong').textContent,
  }));
  assert(docked.sheet && !docked.overlay, `bilan : ${JSON.stringify(docked)}`);
  assert(docked.miss === 1 && docked.count === '1', `correction sur la carte : ${JSON.stringify(docked)}`);
  assert(await page.isVisible('[data-errors]'), 'pas de bouton de révision');
  await press(page, '[data-errors]');
  await settle(page);
  s = await state();
  assert(s.status === 'play' && s.length === 1, `révision : ${JSON.stringify(s)}`);
});

await test('Quiz : le record est gardé dans le navigateur', async (page) => {
  await open(page, 'france');
  await page.evaluate(() => localStorage.clear());
  await press(page, 'button[data-mode="quiz"]');
  await press(page, '[data-type="numero"]');
  await press(page, '[data-start]');
  for (let i = 0; i < 12; i++) {
    const s = await page.evaluate(() => ({ status: window.Atlas.app.quiz.status, index: window.Atlas.app.quiz.index, target: window.Atlas.app.quiz.queue[window.Atlas.app.quiz.index] }));
    if (s.status !== 'play') break;
    await clickRegion(page, s.target);
    await page.waitForFunction((n) => window.Atlas.app.quiz.index > n || window.Atlas.app.quiz.status !== 'play', s.index);
  }
  await page.waitForSelector('.result__record');
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('cartes:record:france:numero')));
  assert(keys.length === 1, `record non enregistré : ${keys}`);
});

// ---------------------------------------------------------------- Clavier et téléphone
await test('Clavier : parcourir les régions et en choisir une', async (page) => {
  await open(page, 'europe');
  await page.focus('.map-view');
  await page.keyboard.press('Enter');
  await settle(page);
  const first = await page.evaluate(() => window.Atlas.app.map.focusCode);
  assert(first, 'aucune région sous le curseur clavier');
  await page.keyboard.press('ArrowRight');
  await settle(page);
  const second = await page.evaluate(() => window.Atlas.app.map.focusCode);
  assert(second && second !== first, 'la flèche ne déplace pas le curseur');
  await page.keyboard.press('Enter');
  await page.waitForFunction((c) => window.Atlas.app.state.selected === c, second);
});

await test('Téléphone : la fiche s’ouvre dans le panneau du bas', async (page) => {
  await open(page, 'france');
  await clickRegion(page, '33');
  await page.waitForSelector('.fiche h2');
  const box = await page.locator('.sheet').boundingBox();
  assert(box.y > 300 && box.width > 360, `panneau : ${JSON.stringify(box)}`);
  assert((await page.textContent('.fiche h2')) === 'Gironde', 'mauvaise fiche');
}, { width: 390, height: 844 });

await test('Téléphone : le retour de quiz montre le nom entier et le score', async (page) => {
  await open(page, 'france');
  await page.evaluate(() => localStorage.clear());
  await press(page, 'button[data-mode="quiz"]');
  await press(page, '[data-start]');
  await settle(page);
  await page.evaluate(() => { window.Atlas.app.quiz.queue[0] = '04'; });
  await clickRegion(page, '04');
  await page.waitForSelector('.hud.is-hit');
  const hit = await page.evaluate(() => {
    clearTimeout(window.Atlas.app.quiz.pending);
    const t = document.querySelector('.hud__target');
    const score = document.querySelector('.hud__stat--score');
    return { cut: t.scrollWidth > t.clientWidth + 1, text: t.textContent, score: getComputedStyle(score).display };
  });
  assert(!hit.cut && hit.text === 'Alpes-de-Haute-Provence', `nom coupé : ${JSON.stringify(hit)}`);
  assert(hit.score !== 'none', 'le score reste caché');
  const inHud = await page.evaluate(() => {
    const h = document.querySelector('.hud').getBoundingClientRect();
    return Array.from(document.querySelectorAll('.hud > *')).filter((el) => el.offsetWidth).every((el) => {
      const r = el.getBoundingClientRect();
      return r.right <= h.right + 1 && r.left >= h.left - 1 && (!el.matches('button') || r.width >= 44);
    });
  });
  assert(inHud, 'un élément du bandeau déborde ou un bouton fait moins de 44 px');
}, { width: 390, height: 844 });

await browser.close();
server.close();

const width = Math.max(...results.map((r) => r[1].length));
for (const [status, name, ms, detail] of results) {
  console.log(`${status.padEnd(5)} ${name.padEnd(width)} ${String(ms).padStart(5)} ms${detail ? `  → ${detail}` : ''}`);
}
const failed = results.filter((r) => r[0] !== 'ok').length;
console.log(`\n${results.length - failed}/${results.length} tests réussis`);
process.exit(failed ? 1 : 0);
