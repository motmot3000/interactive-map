// Télécharge les données sources dans tools/cartes/.sources/ (ignoré par git).
import { mkdir, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '.sources');

const files = [
  {
    // Natural Earth 1:10m, pays vus par la France (Crimée ukrainienne, Chypre unifiée, Kosovo).
    name: 'ne_10m_admin_0_countries_fra.zip',
    url: 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries_fra.zip',
    unzip: 'ne_countries_fra',
  },
  {
    name: 'ne_10m_lakes.zip',
    url: 'https://naciscdn.org/naturalearth/10m/physical/ne_10m_lakes.zip',
    unzip: 'ne_lakes',
  },
  {
    // Départements : IGN Admin Express COG, via github.com/gregoiredavid/france-geojson.
    name: 'departements.geojson',
    url: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson',
  },
];

await mkdir(dir, { recursive: true });
for (const file of files) {
  const target = path.join(dir, file.name);
  try {
    await access(target);
    console.log(`déjà présent : ${file.name}`);
  } catch {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`${res.status} ${file.url}`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log(`téléchargé : ${file.name}`);
  }
  if (file.unzip) {
    execFileSync('unzip', ['-o', '-q', target, '-d', path.join(dir, file.unzip)]);
  }
}
console.log('Sources prêtes dans', dir);
