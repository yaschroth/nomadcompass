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
  shiraz: 'Iranian plateau at 1,507m, correct. Same case as Isfahan and Yazd: the city really '
    + 'does sit high enough to have near-freezing January nights at latitude 29.6',
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

// 6a. A region mapping for a city that does not exist is a landmine, not just dead weight.
//     city-regions.js still carries entries from an older dataset, and a new city that happens
//     to take one of those slugs inherits its region silently. Batch 33 walked into exactly that:
//     Newcastle, Australia landed on `newcastle: 'europe'`, left over from Newcastle upon Tyne,
//     and would have shipped filed under Europe. Listing them here means the next batch sees the
//     collision before it authors the slug rather than after.
{
  const ids = new Set(CITIES.map((c) => c.id));
  const orphans = Object.keys(regions).filter((k) => !ids.has(k));
  if (orphans.length) {
    // Its own category on purpose: inside 'coverage' this line sat behind sixty OG-card
    // warnings and the printer truncates each category at twelve, so it was never shown.
    warn('region-orphans', orphans.length + ' mapping(s) for a city that does not exist. A new '
      + 'city taking one of these slugs inherits its region silently: ' + orphans.join(', '));
  }
}

// 6b. One country, one name. The site filed London, Manchester and Edinburgh under "UK" and the
//     other eleven British cities under "United Kingdom", and Sarajevo under "Bosnia" against
//     Mostar's "Bosnia and Herzegovina". The country string is a grouping key: it drives the
//     country filter on /cities and /map, the country ranking pages, the services country pages
//     and every "in <country>" heading. Two names for one country means each grouping shows a
//     partial list, and nothing looks broken, which is why it survived 831 cities. The flag emoji
//     is the tell: it is per-country, so two names sharing one flag is always this bug. An ERROR
//     rather than a warning, because the next batch to type "UK" should not be able to ship it.
{
  const byFlag = new Map();
  for (const c of CITIES) {
    if (!c.flag) continue;
    if (!byFlag.has(c.flag)) byFlag.set(c.flag, new Map());
    const names = byFlag.get(c.flag);
    names.set(c.country, (names.get(c.country) || 0) + 1);
  }
  for (const [flag, names] of byFlag) {
    if (names.size < 2) continue;
    const listed = [...names].map(([n, k]) => `"${n}" (${k})`).join(' and ');
    err('country-names', flag + ' is used for ' + names.size + ' different country names: ' + listed
      + '. Pick one and rewrite the others in cities-data.js and data/city_list.json.');
  }
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

// 8. National attributes must not disagree between cities of the same country.
//    Visa policy is set nationally, so a spread inside one country is a scoring error,
//    not a real difference. Genuine special zones exist and are allowlisted by name.
const VISA_ZONE_EXCEPTION = {
  phuquoc: 'Phu Quoc has a real visa exemption separate from the rest of Vietnam',
};
// KNOWN DEBT, not a pass. These five are genuinely inconsistent and the defect is real.
// A replacement score derived from assets/visa-data.js was modelled on 2026-08-10 and
// covers all 710 cities, making 67 countries consistent by construction. It is not applied
// yet because the passport weighting behind it is a product decision, and applying it moves
// the Nomad Score, every ranking and every share card. Remove entries here as they are fixed.
const VISA_SPREAD_DEBT = {
  Vietnam: 'spans 5-8; national 90-day e-visa, no per-city basis',
  Netherlands: 'spans 4-7; Schengen, identical for every city',
  'United States': 'spans 3-6; ESTA and B-1/B-2 are federal',
  Montenegro: 'spans 6-9; single national policy',
  Myanmar: 'spans 3-6; single national policy',
};
{
  const byCountry = {};
  for (const c of CITIES) (byCountry[c.country] = byCountry[c.country] || []).push(c);
  for (const [country, list] of Object.entries(byCountry)) {
    if (list.length < 3) continue;
    const considered = list.filter(c => !VISA_ZONE_EXCEPTION[c.id]);
    if (considered.length < 3) continue;
    const v = considered.map(c => c.scores.visa);
    const spread = Math.max(...v) - Math.min(...v);
    const msg = `${country}: visa score spans ${Math.min(...v)}-${Math.max(...v)} across ${considered.length} cities, but visa policy is national`;
    if (spread >= 3 && !VISA_SPREAD_DEBT[country]) err('national-attrs', msg);
    else if (spread >= 2) warn('national-attrs', msg + (VISA_SPREAD_DEBT[country] ? ' [KNOWN DEBT: ' + VISA_SPREAD_DEBT[country] + ']' : ''));
  }
}

// 9. Time zone should match the rest of the country, unless the country really spans zones.
const MULTI_ZONE = new Set(['United States', 'Canada', 'Brazil', 'Australia', 'Russia', 'Indonesia',
  'Mexico', 'Chile', 'Ecuador', 'Portugal', 'Spain', 'France', 'Kazakhstan', 'Micronesia', 'Kiribati']);
{
  const byCountry = {};
  for (const c of CITIES) (byCountry[c.country] = byCountry[c.country] || []).push(c);
  for (const [country, list] of Object.entries(byCountry)) {
    if (list.length < 3 || MULTI_ZONE.has(country)) continue;
    const counts = {};
    for (const c of list) { const z = tz[c.id]; if (z) counts[z] = (counts[z] || 0) + 1; }
    // Compare the CONTINENT prefix, not the full zone. Argentina legitimately uses several
    // America/Argentina/* zones; a Georgian town on Europe/Moscow is the actual error.
    const prefixCounts = {};
    for (const c of list) { const z = tz[c.id]; if (z) { const p = z.split('/')[0]; prefixCounts[p] = (prefixCounts[p] || 0) + 1; } }
    const modal = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1])[0];
    if (!modal) continue;
    for (const c of list) {
      const z = tz[c.id];
      if (z && z.split('/')[0] !== modal[0]) {
        err('tz', `${c.id} (${c.name}, ${country}) is on ${z} while the rest of ${country} is on ${modal[0]}/*`);
      }
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
