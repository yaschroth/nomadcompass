/**
 * DATA SANITY GATE
 *
 * STANDING RULE: a source is not enough. Every dataset must also be checked for
 * PLAUSIBILITY before it ships. A correct source answers the question you asked, which
 * is worthless if you asked the wrong question. Open-Meteo returned perfectly good
 * climate normals for Tenerife; we had asked about a point 2,502m up Mount Teide, so
 * the site published minus 2 degrees in January for a beach destination.
 *
 * Every check here exists because something actually went wrong. Add a check whenever a
 * new class of error is found, so it can never return silently.
 *
 * Usage:
 *   node scripts/check_data_sanity.cjs           report, exit 1 on any ERROR
 *   node scripts/check_data_sanity.cjs --warn    also exit 1 on warnings
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const WARN_FATAL = process.argv.includes('--warn');

const load = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const ctx = { window: {}, document: { addEventListener() {} }, console };
vm.createContext(ctx);
vm.runInContext(load('cities-data.js') + '\n;globalThis.__C=CITIES;', ctx);
const CITIES = ctx.__C;
const climate = require(path.join(ROOT, 'assets/city-climate.js'));
const tz = require(path.join(ROOT, 'assets/city-tz.js'));
const regions = require(path.join(ROOT, 'city-regions.js'));
const elevFile = path.join(ROOT, 'data/city-elevations.json');
const ELEV = fs.existsSync(elevFile) ? JSON.parse(fs.readFileSync(elevFile, 'utf8')).elevations : {};

/**
 * Confirmed exceptions. A gate without an allowlist gets ignored, and an allowlist
 * without reasons is the same as no gate. Every entry states why it is genuinely fine.
 */
const ALLOW_HIGH = {
  leh: 'Ladakh at 3,400m, genuinely a high-altitude desert town',
  uyuni: 'Bolivian altiplano at 3,600m, correct',
  isfahan: 'Iranian plateau at 1,580m, correct',
  yazd: 'Iranian plateau at 1,215m, correct',
  ouarzazate: 'south of the Atlas at 1,110m, correct',
  aitbenhaddou: 'Ounila valley at 1,270m, correct',
  wadimusa: 'Petra approach at 1,090m, correct',
  petra: 'same site as Wadi Musa, correct',
  wadirum: 'Jordanian desert plateau at 950m, correct',
  ramallah: 'West Bank highlands at 880m, correct',
};
// A neighbourhood entry may deliberately point somewhere further out, an excursion base
// or the nearest real town. That is allowed only when the name SAYS SO, either by naming
// itself a base or by stating the distance, so the reader is never misled about how far
// "Dong Van Old Town" actually is from Ha Giang.
const NEARBY_BASE = /\([^)]*(?:nearby|regional|lower-altitude|larger-services|base|gateway|\d+\s*km)[^)]*\)/i;

const errors = [], warns = [];
const err = (check, msg) => errors.push([check, msg]);
const warn = (check, msg) => warns.push([check, msg]);

const km = (a, b, c, d) => {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(c - a), dLng = r(d - b);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

// 1. Identity: no duplicate ids, and no two records for the same real place.
{
  const ids = CITIES.map(c => c.id);
  const dupId = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupId.length) err('identity', 'duplicate ids: ' + [...new Set(dupId)].join(', '));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const seen = {};
  for (const c of CITIES) {
    const k = norm(c.name) + '|' + norm(c.country);
    if (seen[k]) err('identity', `same place twice: ${seen[k]} and ${c.id} are both ${c.name}, ${c.country}`);
    else seen[k] = c.id;
  }
}

// 2. Coordinates land where the city actually is.
//    An island or region centroid on a mountain is the failure this catches.
for (const c of CITIES) {
  if (typeof c.lat !== 'number' || typeof c.lng !== 'number') { err('coords', `${c.id}: missing coordinates`); continue; }
  if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) err('coords', `${c.id}: coordinates out of range`);
  const e = ELEV[c.id];
  if (typeof e !== 'number') { warn('coords', `${c.id}: no elevation reference`); continue; }
  const cl = climate[c.id];
  if (!cl) continue;
  const coldest = Math.min(...cl.h.map((h, m) => (h + cl.l[m]) / 2));
  // Below 35 degrees latitude a near-freezing month means the point is up a mountain.
  // Genuine highland cities exist (La Paz, Cusco), so the test is elevation AND climate
  // AND the city not being described as highland.
  const highland = /Highland|Alpine|Subarctic|Continental/i.test(c.climateType || '');
  if (Math.abs(c.lat) < 35 && e > 800 && coldest < 10 && !highland && !ALLOW_HIGH[c.id]) {
    err('coords', `${c.id} (${c.name}): coordinate sits at ${Math.round(e)}m with a ${coldest.toFixed(1)}C coldest month at latitude ${c.lat.toFixed(1)}, climateType "${c.climateType}". Likely an island or region centroid on high ground.`);
  } else if (Math.abs(c.lat) < 35 && e > 300 && /Tropical|Mediterranean|Desert|Savanna/i.test(c.climateType || '')) {
    warn('coords', `${c.id} (${c.name}): ${Math.round(e)}m for a ${c.climateType} destination, roughly ${(e * 0.0065).toFixed(1)}C cooler than the coast.`);
  }
}

// 3. Climate normals are internally consistent.
for (const c of CITIES) {
  const cl = climate[c.id];
  if (!cl) { err('climate', `${c.id}: no climate normals`); continue; }
  for (const k of ['h', 'l', 'r']) if (!Array.isArray(cl[k]) || cl[k].length !== 12) err('climate', `${c.id}: ${k} is not 12 months`);
  if (cl.h && cl.l) for (let m = 0; m < 12; m++) {
    if (cl.h[m] < cl.l[m]) err('climate', `${c.id}: month ${m + 1} high ${cl.h[m]} below low ${cl.l[m]}`);
    if (cl.h[m] > 55 || cl.l[m] < -50) err('climate', `${c.id}: month ${m + 1} temperature out of plausible range`);
  }
  if (cl.r && cl.r.some(v => v < 0 || v > 2000)) err('climate', `${c.id}: implausible monthly precipitation`);
}

// 4. Scores and money are in range.
const CATS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
for (const c of CITIES) {
  for (const k of CATS) {
    const v = c.scores && c.scores[k];
    if (typeof v !== 'number') err('scores', `${c.id}: missing ${k}`);
    else if (v < 0 || v > 10) err('scores', `${c.id}: ${k} = ${v} outside 0-10`);
  }
  if (typeof c.costPerMonth !== 'number' || c.costPerMonth < 150 || c.costPerMonth > 12000) {
    err('cost', `${c.id}: costPerMonth ${c.costPerMonth} outside a plausible 150-12000 USD`);
  }
}

// 5. Time zone agrees with longitude, allowing for real political offsets.
for (const c of CITIES) {
  const zone = tz[c.id];
  if (!zone) { err('tz', `${c.id}: no time zone`); continue; }
  try {
    const d = new Date('2026-01-15T12:00:00Z');
    const s = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).format(d);
    const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) continue;
    const offset = (m[1] === '-' ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0));
    const expected = c.lng / 15;
    // China runs one zone across five, Spain sits on the wrong side; 4h is the tolerance.
    if (Math.abs(offset - expected) > 4) warn('tz', `${c.id}: zone ${zone} is ${offset}h but longitude ${c.lng.toFixed(1)} suggests ${expected.toFixed(1)}h`);
  } catch (e) { err('tz', `${c.id}: invalid zone "${zone}"`); }
}

// 6. Every city is reachable through every surface that is supposed to list it.
for (const c of CITIES) {
  if (!regions[c.id]) err('coverage', `${c.id}: no region mapping, so every region filter drops it`);
  if (!fs.existsSync(path.join(ROOT, 'cities', c.id + '.html'))) err('coverage', `${c.id}: no page`);
  if (!fs.existsSync(path.join(ROOT, 'images/og', c.id + '.jpg'))) warn('coverage', `${c.id}: no OG card`);
  if (!fs.existsSync(path.join(ROOT, 'images/cities', c.id + '.webp'))) warn('coverage', `${c.id}: no self-hosted hero`);
}

// 7. Neighbourhood pins sit near their city.
const nbDir = path.join(ROOT, 'data/neighborhoods');
if (fs.existsSync(nbDir)) {
  const byId = Object.fromEntries(CITIES.map(c => [c.id, c]));
  for (const f of fs.readdirSync(nbDir).filter(f => /^neighborhoods-.+\.json$/.test(f))) {
    const slug = f.replace(/^neighborhoods-/, '').replace(/\.json$/, '');
    const c = byId[slug];
    if (!c) continue;
    let list;
    try { list = JSON.parse(fs.readFileSync(path.join(nbDir, f), 'utf8')); } catch (e) { err('neighborhoods', `${slug}: unparseable`); continue; }
    for (const n of list) {
      if (typeof n.lat !== 'number' || typeof n.lng !== 'number') { err('neighborhoods', `${slug}/${n.name}: no coordinates`); continue; }
      const d = km(c.lat, c.lng, n.lat, n.lng);
      const deliberate = NEARBY_BASE.test(n.name || '');
      if (d > 60 && !deliberate) err('neighborhoods', `${slug}/${n.name}: pin ${Math.round(d)}km from the city coordinate`);
      else if (d > 30 && !deliberate) warn('neighborhoods', `${slug}/${n.name}: pin ${Math.round(d)}km out`);
    }
  }
}

// --- report
const group = rows => {
  const by = {};
  for (const [k, m] of rows) (by[k] = by[k] || []).push(m);
  return by;
};
console.log('DATA SANITY GATE\n');
for (const [label, rows] of [['ERROR', errors], ['WARN', warns]]) {
  const by = group(rows);
  for (const [check, msgs] of Object.entries(by)) {
    console.log(`  ${label} ${check} (${msgs.length})`);
    for (const m of msgs.slice(0, 12)) console.log(`    ${m}`);
    if (msgs.length > 12) console.log(`    ... and ${msgs.length - 12} more`);
  }
}
console.log(`\n  ${CITIES.length} cities | errors ${errors.length} | warnings ${warns.length}`);
process.exit(errors.length || (WARN_FATAL && warns.length) ? 1 : 0);
