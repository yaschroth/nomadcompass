/**
 * Fills data/city-elevations.json for any city that has coordinates but no elevation yet.
 *
 * Elevation is not published anywhere. It exists so scripts/check_data_sanity.cjs can catch the
 * one coordinate error that looks fine in a table and is obvious on a map: an island or a region
 * whose stored point is the centroid of the whole shape rather than the town, which on somewhere
 * like Paros or Coorg lands halfway up a mountain. A city with no elevation is simply skipped by
 * that check, so the 61 cities added in the last two batches were never tested for it.
 *
 * Source is the Open-Meteo Elevation API (Copernicus DEM GLO-90), the same one the existing 710
 * rows came from, so the new rows are comparable with the old. Batched 100 coordinates per call,
 * which is the documented maximum.
 *
 * Usage:
 *   node scripts/fetch_city_elevations.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'city-elevations.json');
const APPLY = process.argv.includes('--apply');
const BATCH = 100;

const m = {};
new Function('m', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';m.d=CITIES')(m);

const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const have = db.elevations;

const missing = m.d.filter((c) => have[c.id] == null
  && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)));
const noCoords = m.d.filter((c) => !Number.isFinite(Number(c.lat)) || !Number.isFinite(Number(c.lng)));

console.log(Object.keys(have).length + ' city/cities already have an elevation');
if (noCoords.length) console.log('no coordinates, cannot sample: ' + noCoords.map((c) => c.id).join(', '));
console.log(missing.length + ' to fetch');
if (!missing.length) process.exit(0);
if (!APPLY) {
  console.log('  ' + missing.map((c) => c.id).join(', '));
  console.log('\nDry run. Re-run with --apply to fetch and write.');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const out = {};
  for (let i = 0; i < missing.length; i += BATCH) {
    const slice = missing.slice(i, i + BATCH);
    const url = 'https://api.open-meteo.com/v1/elevation?latitude='
      + slice.map((c) => Number(c.lat).toFixed(4)).join(',')
      + '&longitude=' + slice.map((c) => Number(c.lng).toFixed(4)).join(',');
    let res;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        res = await fetch(url);
        if (res.ok) break;
        console.log('  HTTP ' + res.status + ', retry ' + attempt);
      } catch (e) {
        console.log('  ' + e.message + ', retry ' + attempt);
      }
      await sleep(attempt * 3000);
      res = null;
    }
    if (!res || !res.ok) { console.error('batch at ' + i + ' failed, nothing written'); process.exit(1); }
    const json = await res.json();
    const vals = json.elevation;
    if (!Array.isArray(vals) || vals.length !== slice.length) {
      console.error('batch at ' + i + ': expected ' + slice.length + ' values, got '
        + (Array.isArray(vals) ? vals.length : typeof vals));
      process.exit(1);
    }
    slice.forEach((c, k) => { out[c.id] = Math.round(vals[k]); });
    console.log('  fetched ' + Object.keys(out).length + '/' + missing.length);
    if (i + BATCH < missing.length) await sleep(1500);
  }

  for (const [id, v] of Object.entries(out)) have[id] = v;
  db._meta.retrieved = new Date().toISOString().slice(0, 10);
  db._meta.coverage = Object.keys(have).length + ' of ' + m.d.length + ' cities';
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');

  const high = Object.entries(out).filter(([, v]) => v > 1200).sort((a, b) => b[1] - a[1]);
  console.log('\nwrote ' + Object.keys(out).length + ' elevation(s), '
    + Object.keys(have).length + ' of ' + m.d.length + ' covered');
  if (high.length) {
    console.log('above 1200m, worth an eye in case the point is a centroid:');
    high.forEach(([id, v]) => console.log('  ' + id.padEnd(20) + v + 'm'));
  }
})();
