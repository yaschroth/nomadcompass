/**
 * Precomputes monthly climate normals for every city with coordinates, from the keyless
 * Open-Meteo archive API (5-year daily normals, 2019-2023), and writes them to
 * assets/city-climate.js as a compact browser global + CommonJS export:
 *   CITY_CLIMATE = { <id>: { h:[12 avg highs], l:[12 avg lows], r:[12 monthly precip mm] } }
 * Temps are rounded °C; precip rounded mm/month. Resumable: results are cached to
 * c:/tmp/nomad-climate-cache.json so re-runs only fetch the cities still missing.
 * Usage: node scripts/build_city_climate.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CACHE = 'c:/tmp/nomad-climate-cache.json';
const YEARS = ['2019-01-01', '2023-12-31'];
const CONCURRENCY = 3;
const BATCH_DELAY = 500;

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITIES = m.exports.filter((c) => c && c.id && typeof c.lat === 'number' && typeof c.lng === 'number');

let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { cache = {}; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCity(c, attempt = 1) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lng}` +
    `&start_date=${YEARS[0]}&end_date=${YEARS[1]}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'NomadHQ/1.0 (yaschroth@gmail.com)' } });
    if (res.status === 429) { await sleep(1500 * attempt); if (attempt <= 2) return fetchCity(c, attempt + 1); throw new Error('429'); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    const t = d.daily.time, mx = d.daily.temperature_2m_max, mn = d.daily.temperature_2m_min, pr = d.daily.precipitation_sum;
    const acc = Array.from({ length: 12 }, () => ({ hi: 0, lo: 0, pr: 0, nHi: 0, nLo: 0, nPr: 0 }));
    const yrs = new Set();
    for (let i = 0; i < t.length; i++) {
      const mo = +t[i].slice(5, 7) - 1; yrs.add(t[i].slice(0, 4));
      if (mx[i] != null) { acc[mo].hi += mx[i]; acc[mo].nHi++; }
      if (mn[i] != null) { acc[mo].lo += mn[i]; acc[mo].nLo++; }
      if (pr[i] != null) { acc[mo].pr += pr[i]; acc[mo].nPr++; }
    }
    const nYears = Math.max(1, yrs.size);
    const h = [], l = [], r = [];
    for (let mo = 0; mo < 12; mo++) {
      const a = acc[mo];
      h.push(a.nHi ? Math.round(a.hi / a.nHi) : null);
      l.push(a.nLo ? Math.round(a.lo / a.nLo) : null);
      // precip: total over all years / number of years => avg mm for that calendar month
      r.push(a.nPr ? Math.round(a.pr / nYears) : null);
    }
    return { h, l, r };
  } catch (e) {
    if (attempt <= 3) { await sleep(800 * attempt); return fetchCity(c, attempt + 1); }
    return null;
  }
}

(async () => {
  const todo = CITIES.filter((c) => !cache[c.id]);
  console.log(`${CITIES.length} cities total, ${Object.keys(cache).length} cached, ${todo.length} to fetch.`);
  let done = 0, failed = 0, sinceSave = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((c) => fetchCity(c).then((r) => ({ id: c.id, r }))));
    for (const { id, r } of results) { if (r) { cache[id] = r; done++; } else { failed++; console.log('  FAILED', id); } sinceSave++; }
    if (sinceSave >= 24) { fs.writeFileSync(CACHE, JSON.stringify(cache)); sinceSave = 0; }
    if ((i / CONCURRENCY) % 5 === 0) console.log(`  ${i + batch.length}/${todo.length} (ok ${done}, failed ${failed})`);
    await sleep(BATCH_DELAY);
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache));

  // Emit only cities we have data for, in cities-data order
  const out = {};
  for (const c of CITIES) if (cache[c.id]) out[c.id] = cache[c.id];
  const js = 'const CITY_CLIMATE = ' + JSON.stringify(out) + ';\n' +
    "if (typeof module !== 'undefined' && module.exports) { module.exports = CITY_CLIMATE; }\n";
  fs.writeFileSync(path.join(ROOT, 'assets', 'city-climate.js'), js);
  console.log(`Wrote assets/city-climate.js with ${Object.keys(out).length} cities (${done} newly fetched, ${failed} failed this run).`);
})();
