// Génère les fonds de carte SVG (Europe, Suisse, France) à partir de données ouvertes,
// les injecte dans maps/<carte>/index.html entre <!-- carte:debut --> et <!-- carte:fin -->,
// puis écrit les vignettes de la page d'accueil dans assets/img/.
//
//   npm install && npm run sources && npm run build        (ou : node build.mjs europe)
//
// Sources : Natural Earth 1:10m (domaine public, point de vue de la France), swiss-maps
// (OFS/swisstopo, limites généralisées 2026), france-geojson (IGN Admin Express COG, Licence Ouverte).
import mapshaper from 'mapshaper';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const SRC = path.join(here, '.sources');
const require = createRequire(import.meta.url);
const SWISS = path.join(path.dirname(require.resolve('swiss-maps/package.json')), '2026');

const NE_COUNTRIES = path.join(SRC, 'ne_countries_fra/ne_10m_admin_0_countries_fra.shp');
const NE_LAKES = path.join(SRC, 'ne_lakes/ne_10m_lakes.shp');
const DEPARTEMENTS = path.join(SRC, 'departements.geojson');

const PROJ = {
  europe: '+proj=laea +lat_0=52 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  france: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  suisse: '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs',
  monde: '+proj=eqearth +lon_0=0 +datum=WGS84 +units=m +no_defs',
};

// Taux de simplification (Visvalingam pondéré) : netteté au zoom contre poids de la page.
const SIMPLIFY = { europe: 7, france: 8, franceContext: 16, suisse: 35, suisseContext: 25 };
const WIDTH = 1000;

const ms = (commands, inputs) => mapshaper.applyCommands(commands, inputs);
const toText = (value) => (typeof value === 'string' ? value : Buffer.from(value).toString('utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const round = (n) => Math.round(Number(n) * 10) / 10;
const list = (codes) => JSON.stringify(codes).replace(/"/g, "'");

// Simplification « cuite » dans chaque passe : chaque source garde son propre taux.
// (Plusieurs -simplify sur un même jeu de données partagent les arcs et se cumulent.)
const simplifyCmd = (pct, islands = 0) => [
  pct ? `-simplify ${pct}% weighted keep-shapes` : '',
  islands ? `-filter-islands min-area=${islands} remove-empty` : '',
].join(' ');

function frameGeoJSON([x1, y1, x2, y2]) {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { kind: 'frame' },
      geometry: { type: 'Polygon', coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] },
    }],
  });
}

function pointsGeoJSON(points) {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: points.map(([text, lon, lat, kind, rank]) => ({
      type: 'Feature',
      properties: { text, kind, rank },
      geometry: { type: 'Point', coordinates: [lon, lat] },
    })),
  });
}

// Projette des points lon/lat dans le système de la carte.
async function projectPoints(points, proj) {
  const out = await ms(`-i points.json -proj ${JSON.stringify(proj)} -o format=geojson projected.json`, {
    'points.json': pointsGeoJSON(points),
  });
  return toText(out['projected.json']);
}

// Lit un SVG produit par mapshaper et renvoie ses couches.
function parseSvg(svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const layers = {};
  const groupRe = /<g id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
  let g;
  while ((g = groupRe.exec(svg))) {
    const items = [];
    const elRe = /<(path|circle)\s([^>]*?)\/>/g;
    let el;
    while ((el = elRe.exec(g[2]))) {
      const attrs = {};
      el[2].replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => { attrs[k] = v; return ''; });
      items.push({ tag: el[1], ...attrs });
    }
    layers[g[1]] = items;
  }
  return { width: viewBox[2], height: viewBox[3], layers };
}

// Voisins : deux entités qui partagent au moins deux sommets (arcs communs après simplification).
function computeNeighbors(...collections) {
  const owners = new Map();
  const names = {};
  for (const text of collections) {
    if (!text) continue;
    for (const f of JSON.parse(text).features) {
      const { code, name } = f.properties;
      if (!f.geometry) continue;
      names[code] = name;
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
        const key = `${Math.round(x)}:${Math.round(y)}`;
        let set = owners.get(key);
        if (!set) owners.set(key, (set = new Set()));
        set.add(code);
      }
    }
  }
  const counts = new Map();
  for (const set of owners.values()) {
    if (set.size < 2) continue;
    const codes = [...set];
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const key = [codes[i], codes[j]].sort().join('|');
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }
  const neighbors = {};
  for (const [key, n] of counts) {
    if (n < 2) continue;
    const [a, b] = key.split('|');
    (neighbors[a] ||= []).push(b);
    (neighbors[b] ||= []).push(a);
  }
  return { neighbors, names };
}

async function composeSvg({ frame, layers, width = WIDTH, simplify = 0, svgData = 'name,text,kind,rank', precision = 0.1 }) {
  const inputs = { 'frame.json': frameGeoJSON(frame) };
  const names = ['frame'];
  for (const [name, geojson] of Object.entries(layers)) {
    if (!geojson) continue;
    inputs[`${name}.json`] = geojson;
    names.push(name);
  }
  const steps = [`-i ${names.map((n) => `${n}.json`).join(' ')} combine-files`];
  if (simplify) steps.push(`-simplify ${simplify}% weighted keep-shapes`);
  const out = [...names];
  if (names.includes('regions')) {
    steps.push('-points target=regions inner + name=labels');
    out.push('labels');
  }
  const points = out.filter((n) => n === 'labels' || n === 'annotations');
  if (points.length) steps.push(`-style target=${points.join(',')} r=1`);
  steps.push(`-o target=${out.join(',')} format=svg width=${width} fit-extent=frame precision=${precision} id-field=code${svgData ? ` svg-data=${svgData}` : ''} map.svg`);
  const res = await ms(steps.join(' '), inputs);
  return parseSvg(toText(res['map.svg']));
}

function renderMap(id, parsed, { seaClass = 'map-sea', underlayClass = 'land-underlay', neighbors = {}, names = {}, playable = null } = {}) {
  const { width, height, layers } = parsed;
  const labels = Object.fromEntries((layers.labels || []).map((c) => [c.id, [round(c.cx), round(c.cy)]]));
  const isPlayable = (code) => !playable || playable.includes(code);
  const lines = [];
  lines.push(`<svg class="map-svg" xmlns="http://www.w3.org/2000/svg" data-map="${id}" data-width="${width}" data-height="${height}" aria-hidden="true" focusable="false">`);
  lines.push('<defs>'
    + `<pattern id="hatch-map" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="pattern-bg" width="7" height="7"/><rect class="pattern-ink" width="2.6" height="7"/></pattern>`
    + `<pattern id="dots-map" width="6" height="6" patternUnits="userSpaceOnUse"><rect class="pattern-bg" width="6" height="6"/><circle class="pattern-ink" cx="3" cy="3" r="1.15"/></pattern>`
    + '</defs>');
  lines.push(`<g class="map-camera"><g class="map-content" id="map-content-${id}">`);
  lines.push(`<rect class="${seaClass}" x="0" y="0" width="${width}" height="${height}"/>`);
  if (layers.context?.length) {
    lines.push('<g class="map-context">');
    for (const p of layers.context) lines.push(`<path class="ctx"${p['data-name'] ? ` data-name="${esc(p['data-name'])}"` : ''} d="${p.d}"/>`);
    lines.push('</g>');
  }
  if (layers.underlay?.length) {
    lines.push('<g class="map-underlay">');
    for (const p of layers.underlay) lines.push(`<path class="${underlayClass}" d="${p.d}"/>`);
    lines.push('</g>');
  }
  if (layers.waterUnder?.length) {
    lines.push('<g class="map-water">');
    for (const p of layers.waterUnder) lines.push(`<path class="lake lake--context" d="${p.d}"/>`);
    lines.push('</g>');
  }
  lines.push('<g class="map-regions">');
  for (const p of layers.regions) {
    const [lx, ly] = labels[p.id] || [];
    const near = (neighbors[p.id] || []).filter(isPlayable).sort();
    const nearCtx = (neighbors[p.id] || []).filter((c) => !isPlayable(c)).map((c) => names[c]).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
    lines.push(`<path class="region" id="r-${p.id}" data-code="${p.id}"`
      + (lx !== undefined ? ` data-lx="${lx}" data-ly="${ly}"` : '')
      + (near.length ? ` data-neighbors="${near.join(' ')}"` : '')
      + (nearCtx.length ? ` data-neighbors-ctx="${esc(nearCtx.join('|'))}"` : '')
      + ` d="${p.d}"/>`);
  }
  lines.push('</g>');
  if (layers.lakes?.length) {
    lines.push('<g class="map-lakes">');
    for (const p of layers.lakes) lines.push(`<path class="lake"${p['data-name'] ? ` data-name="${esc(p['data-name'])}"` : ''} d="${p.d}"/>`);
    lines.push('</g>');
  }
  lines.push('</g>');
  lines.push(`<rect class="map-neatline" x="0" y="0" width="${width}" height="${height}"/>`);
  lines.push('</g>');
  lines.push('</svg>');
  const annotations = (layers.annotations || []).map((c) => ({
    text: c['data-text'],
    kind: c['data-kind'],
    rank: Number(c['data-rank'] || 1),
    x: round(c.cx),
    y: round(c.cy),
  }));
  lines.push(`<script type="application/json" class="map-annotations">${JSON.stringify(annotations)}</script>`);
  return lines.join('\n');
}

// Vignette autonome (page d'accueil) : styles en ligne, sans interaction.
function renderPlate(id, parsed, { landSea = false, interactive = false } = {}) {
  const { width, height, layers } = parsed;
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" class="plate-svg" data-plate="${id}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Carte : ${id}">`);
  if (!interactive) {
    out.push('<style>.s{fill:#cfe1ea}.s--land{fill:#e7e5dd}.c{fill:#e7e5dd;stroke:#cfccc1;stroke-width:.6}.u{fill:#fbfbf8}.r{fill:#fbfbf8;stroke:#7d8992;stroke-width:.55;stroke-linejoin:round}.l{fill:#cfe1ea;stroke:#9cbccc;stroke-width:.4}</style>');
  }
  out.push(`<rect class="s${landSea ? ' s--land' : ''}" width="${width}" height="${height}"/>`);
  for (const p of layers.context || []) out.push(`<path class="c" d="${p.d}"/>`);
  for (const p of layers.underlay || []) out.push(`<path class="u" d="${p.d}"/>`);
  for (const p of layers.waterUnder || []) out.push(`<path class="l" d="${p.d}"/>`);
  for (const p of layers.regions || []) out.push(`<path class="r"${interactive ? ` data-code="${p.id}"` : ''} d="${p.d}"/>`);
  for (const p of layers.lakes || []) out.push(`<path class="l" d="${p.d}"/>`);
  out.push('</svg>');
  return out.join('');
}

const PREVIEW_CSS = `<style>.map-sea{fill:#cfe3ee}.map-sea--land{fill:#e6e4dc}.ctx{fill:#e6e4dc;stroke:#b9b6aa;stroke-width:.4}
.land-underlay{fill:#fbfaf6}.region{fill:#fbfaf6;stroke:#55606a;stroke-width:.5}.lake{fill:#cfe3ee;stroke:#7fa7bf;stroke-width:.3}</style>`;

async function replaceBetween(file, start, end, markup) {
  const html = await readFile(file, 'utf8');
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a === -1 || b === -1) throw new Error(`Marqueurs ${start} absents dans ${file}`);
  await writeFile(file, html.slice(0, a + start.length) + '\n' + markup + '\n' + html.slice(b));
}

async function inject(id, markup) {
  if (process.env.PREVIEW) {
    const w = markup.match(/data-width="([^"]+)"/)[1];
    const h = markup.match(/data-height="([^"]+)"/)[1];
    const svg = markup.replace(/<script[\s\S]*<\/script>/, '')
      .replace('<svg class="map-svg"', `<svg class="map-svg" viewBox="0 0 ${w} ${h}"`)
      .replace('<defs>', PREVIEW_CSS + '<defs>');
    await writeFile(path.join(process.env.PREVIEW, `${id}.svg`), svg);
    console.log(`${id} : aperçu ${(Buffer.byteLength(markup) / 1024).toFixed(0)} Ko`);
    return;
  }
  const file = path.join(root, 'maps', id, 'index.html');
  await replaceBetween(file, '<!-- carte:debut -->', '<!-- carte:fin -->', markup);
  console.log(`${id} : ${(Buffer.byteLength(markup) / 1024).toFixed(0)} Ko injectés dans ${path.relative(root, file)}`);
}

async function writePlate(id, svg) {
  const target = process.env.PREVIEW
    ? path.join(process.env.PREVIEW, `plaque-${id}.svg`)
    : path.join(root, 'assets', 'img', `plaque-${id}.svg`);
  await writeFile(target, svg);
  console.log(`vignette ${id} : ${(Buffer.byteLength(svg) / 1024).toFixed(0)} Ko`);
}

// ---------------------------------------------------------------- Europe
const EUROPE = ['AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM',
  'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'TR', 'UA', 'GB', 'VA'];

async function buildEurope() {
  const frame = [-1720000, -1960000, 2760000, 2330000];
  const base = await ms([
    `-i ${NE_COUNTRIES} name=countries`,
    '-clip bbox=-45,22,70,82',
    "-each \"code = ADM0_A3 == 'ALD' ? 'FI' : (ISO_A2_EH == '-99' ? ADM0_A3 : ISO_A2_EH); name = NAME_FR\"",
    '-dissolve code copy-fields=name',
    `-proj ${JSON.stringify(PROJ.europe)}`,
    `-clip bbox=${frame.join(',')}`,
    simplifyCmd(SIMPLIFY.europe, 60e6),
    `-filter target=countries "${list(EUROPE)}.indexOf(code) > -1" + name=regions`,
    `-filter target=countries "${list(EUROPE)}.indexOf(code) == -1" + name=context`,
    '-o target=regions format=geojson regions.json',
    '-o target=context format=geojson context.json',
  ].join(' '));
  const regions = toText(base['regions.json']);
  const context = toText(base['context.json']);
  const annotations = await projectPoints([
    ['Océan Atlantique', -13.5, 47.2, 'sea', 1],
    ['Mer de Norvège', 3, 67.5, 'sea', 1],
    ['Mer du Nord', 3.6, 56.3, 'sea', 1],
    ['Mer Baltique', 19.2, 57.6, 'sea', 1],
    ['Mer Méditerranée', 18.5, 34.6, 'sea', 1],
    ['Mer Noire', 34.2, 43.4, 'sea', 1],
    ['Manche', -2.2, 50.1, 'sea', 2],
    ['Golfe de Gascogne', -4.6, 45.4, 'sea', 2],
    ['Mer Adriatique', 15.6, 42.9, 'sea', 2],
    ['Mer Tyrrhénienne', 12.0, 39.9, 'sea', 2],
    ['Mer Ionienne', 18.6, 37.8, 'sea', 2],
    ['Mer Égée', 25.0, 38.9, 'sea', 2],
    ['Golfe de Botnie', 20.6, 62.6, 'sea', 2],
    ["Mer d'Irlande", -4.9, 53.9, 'sea', 2],
    ['Mer de Barents', 38, 71.2, 'sea', 2],
  ], PROJ.europe);
  const { neighbors, names } = computeNeighbors(regions, context);
  // Précision fine : le Vatican (0,44 km²) disparaîtrait à 0,1 unité.
  const parsed = await composeSvg({ frame, layers: { context, regions, annotations }, precision: 0.02 });
  await inject('europe', renderMap('europe', parsed, { neighbors, names, playable: EUROPE }));
  const plate = await composeSvg({ frame, layers: { context, regions }, width: 600, simplify: 18, svgData: '', precision: 0.5 });
  await writePlate('europe', renderPlate('europe', plate));
  return renderPlate('europe', plate, { interactive: true });
}

// ---------------------------------------------------------------- France
async function buildFrance() {
  const frame = [30000, 6000000, 1310000, 7150000];
  const deps = await ms([
    `-i ${DEPARTEMENTS}`,
    "-filter \"code.indexOf('97') != 0\"",
    '-each "name = nom"',
    `-proj ${JSON.stringify(PROJ.france)}`,
    simplifyCmd(SIMPLIFY.france, 6e6),
    '-o format=geojson regions.json',
  ].join(' '));
  const ne = await ms([
    `-i ${NE_COUNTRIES} name=countries`,
    '-clip bbox=-12,37,18,56',
    '-each "code = ISO_A2_EH; name = NAME_FR"',
    `-proj ${JSON.stringify(PROJ.france)}`,
    `-clip bbox=${frame.join(',')}`,
    simplifyCmd(SIMPLIFY.franceContext, 6e6),
    "-filter target=countries \"code == 'FR'\" + name=underlay",
    "-filter target=countries \"code != 'FR'\" + name=context",
    '-o target=underlay format=geojson underlay.json',
    '-o target=context format=geojson context.json',
  ].join(' '));
  const lakes = await ms([
    `-i ${NE_LAKES}`,
    '-clip bbox=-12,37,18,56',
    `-proj ${JSON.stringify(PROJ.france)}`,
    `-clip bbox=${frame.join(',')}`,
    simplifyCmd(SIMPLIFY.franceContext),
    '-o format=geojson lakes.json',
  ].join(' '));
  const annotations = await projectPoints([
    ['Manche', -1.2, 50.15, 'sea', 1],
    ['Océan Atlantique', -5.0, 46.2, 'sea', 1],
    ['Mer Méditerranée', 5.4, 42.35, 'sea', 1],
    ['Golfe de Gascogne', -3.2, 44.6, 'sea', 2],
    ['Mer du Nord', 2.2, 51.55, 'sea', 2],
    ['Golfe du Lion', 3.9, 43.05, 'sea', 2],
    ['ESPAGNE', -1.4, 42.25, 'country', 1],
    ['ITALIE', 8.2, 44.75, 'country', 1],
    ['SUISSE', 7.75, 46.85, 'country', 1],
    ['ALLEMAGNE', 8.7, 49.3, 'country', 1],
    ['BELGIQUE', 4.7, 50.55, 'country', 1],
    ['ROYAUME-UNI', -0.9, 51.25, 'country', 1],
    ['LUXEMBOURG', 6.1, 49.78, 'country', 2],
    ['ANDORRE', 1.55, 42.55, 'country', 2],
    ['MONACO', 7.42, 43.75, 'country', 2],
  ], PROJ.france);
  const regions = toText(deps['regions.json']);
  const { neighbors } = computeNeighbors(regions);
  const layers = {
    context: toText(ne['context.json']),
    underlay: toText(ne['underlay.json']),
    waterUnder: toText(lakes['lakes.json']),
    regions,
  };
  const parsed = await composeSvg({ frame, layers: { ...layers, annotations } });
  await inject('france', renderMap('france', parsed, { neighbors }));
  const plate = await composeSvg({ frame, layers, width: 600, simplify: 12, svgData: '', precision: 0.5 });
  await writePlate('france', renderPlate('france', plate));
}

// ---------------------------------------------------------------- Suisse
const CANTONS = ['', 'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG',
  'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU'];
const LAKES_FR = {
  'Greifensee': ['Lac de Greifen', 3],
  'Zürichsee': ['Lac de Zurich', 1],
  'Thunersee': ['Lac de Thoune', 2],
  'Brienzersee': ['Lac de Brienz', 2],
  'Bielersee / Lac de Bienne': ['Lac de Bienne', 2],
  'Lac de Neuchâtel': ['Lac de Neuchâtel', 1],
  'Baldeggersee': ['Lac de Baldegg', 3],
  'Sempachersee': ['Lac de Sempach', 3],
  'Hallwilersee': ['Lac de Hallwil', 3],
  'Zugersee': ['Lac de Zoug', 2],
  'Vierwaldstättersee': ['Lac des Quatre-Cantons', 1],
  'Sihlsee': ['Lac de Sihl', 3],
  'Sarnersee': ['Lac de Sarnen', 3],
  'Walensee': ['Lac de Walenstadt', 2],
  'Aegerisee': ["Lac d'Ägeri", 3],
  'Lac de la Gruyère / Greyerzersee': ['Lac de la Gruyère', 3],
  'Murtensee/Lac de Morat': ['Lac de Morat', 2],
  'Bodensee': ['Lac de Constance', 1],
  'Lago di Lugano': ['Lac de Lugano', 2],
  'Lago Maggiore': ['Lac Majeur', 1],
  'Lac de Joux': ['Lac de Joux', 3],
  'Lac Léman': ['Lac Léman', 1],
};

async function buildSuisse() {
  const frame = [2468000, 1058000, 2852000, 1312000];
  const cantons = await ms([
    `-i ${path.join(SWISS, 'cantons.shp')}`,
    `-each "code = ${list(CANTONS)}[id]; name = code"`,
    simplifyCmd(SIMPLIFY.suisse),
    '-o format=geojson regions.json',
  ].join(' '));
  const lakesRaw = await ms(`-i ${path.join(SWISS, 'lakes.shp')} ${simplifyCmd(SIMPLIFY.suisse)} -o format=geojson lakes.json`);
  const lakes = JSON.parse(toText(lakesRaw['lakes.json']));
  const ranks = {};
  for (const f of lakes.features) {
    const [fr, rank] = LAKES_FR[f.properties.name] || [f.properties.name, 3];
    f.properties.name = fr;
    ranks[fr] = rank;
  }
  const lakesText = JSON.stringify(lakes);
  const ne = await ms([
    `-i ${NE_COUNTRIES}`,
    '-clip bbox=3,44,13,49.5',
    '-each "code = ISO_A2_EH; name = NAME_FR"',
    `-proj ${JSON.stringify(PROJ.suisse)}`,
    `-clip bbox=${frame.join(',')}`,
    simplifyCmd(SIMPLIFY.suisseContext),
    "-filter \"code != 'CH'\"",
    '-o format=geojson context.json',
  ].join(' '));
  const neLakes = await ms([
    `-i ${NE_LAKES}`,
    '-clip bbox=3,44,13,49.5',
    `-proj ${JSON.stringify(PROJ.suisse)}`,
    `-clip bbox=${frame.join(',')}`,
    simplifyCmd(SIMPLIFY.suisseContext),
    '-o format=geojson ne-lakes.json',
  ].join(' '));
  const lakePoints = JSON.parse(toText((await ms(
    '-i lakes.json -points inner -each "text = name; kind = \'lake\'" -o format=geojson pts.json',
    { 'lakes.json': lakesText },
  ))['pts.json']));
  lakePoints.features.forEach((f) => { f.properties.rank = ranks[f.properties.text] || 3; });
  const countries = JSON.parse(await projectPoints([
    ['FRANCE', 6.3, 47.05, 'country', 1],
    ['ALLEMAGNE', 8.45, 47.86, 'country', 1],
    ['ITALIE', 8.75, 45.93, 'country', 1],
    ['AUTRICHE', 10.25, 47.3, 'country', 1],
    ['LIECHTENSTEIN', 9.55, 47.155, 'country', 2],
  ], PROJ.suisse));
  const annotations = JSON.stringify({ type: 'FeatureCollection', features: [...lakePoints.features, ...countries.features] });
  const regions = toText(cantons['regions.json']);
  const { neighbors } = computeNeighbors(regions);
  const layers = {
    context: toText(ne['context.json']),
    waterUnder: toText(neLakes['ne-lakes.json']),
    regions,
    lakes: lakesText,
  };
  const parsed = await composeSvg({ frame, layers: { ...layers, annotations } });
  await inject('suisse', renderMap('suisse', parsed, { seaClass: 'map-sea map-sea--land', neighbors }));
  const plate = await composeSvg({ frame, layers, width: 600, simplify: 18, svgData: '', precision: 0.5 });
  await writePlate('suisse', renderPlate('suisse', plate, { landSea: true }));
}

// ---------------------------------------------------------------- Monde (vignette « bientôt »)
async function buildMonde() {
  const out = await ms([
    `-i ${NE_COUNTRIES}`,
    "-filter \"CONTINENT != 'Antarctica'\"",
    "-each \"code = ADM0_A3\"",
    `-proj ${JSON.stringify(PROJ.monde)}`,
    '-simplify 0.45% weighted keep-shapes',
    '-filter-islands min-area=6e9 remove-empty',
    '-o format=geojson regions.json',
  ].join(' '));
  const text = toText(out['regions.json']);
  const xs = [];
  const ys = [];
  for (const f of JSON.parse(text).features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const [x, y] of poly[0]) { xs.push(x); ys.push(y); }
  }
  const pad = 250000;
  const frame = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  const plate = await composeSvg({ frame, layers: { regions: text }, width: 600, svgData: '', precision: 0.5 });
  await writePlate('monde', renderPlate('monde', plate));
}

const only = process.argv.slice(2);
const builds = { europe: buildEurope, france: buildFrance, suisse: buildSuisse, monde: buildMonde };
let teaser = null;
for (const [id, fn] of Object.entries(builds)) {
  if (only.length && !only.includes(id)) continue;
  const result = await fn();
  if (id === 'europe') teaser = result;
}
if (teaser && !process.env.PREVIEW) {
  await replaceBetween(path.join(root, 'index.html'), '<!-- vignette:debut -->', '<!-- vignette:fin -->', teaser);
  console.log('vignette interactive injectée dans index.html');
}
