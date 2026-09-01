require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Recomputes the coverage figure for every dataset in data/provenance.json from the data itself.
 *
 * These strings are published: scripts/build_methodology.cjs renders them onto /methodology, which
 * is the page telling readers how far each dataset actually reaches. Every one of them was written
 * when the site had 710 cities and none was updated as it grew, so the page has been claiming
 * "710 of 710 cities" while the site carried 771, and "713 venue cards" after 279 unverifiable
 * ones were stripped. A provenance file that is itself out of date is worse than no provenance
 * file, because it is read as a measurement.
 *
 * Only the derived fields move: coverage, plus the counts embedded in a few source and method
 * lines. Tier, method, sourceUrl and knownLimits are editorial and are left alone except where a
 * count is quoted inside them, which is handled explicitly below rather than by pattern.
 *
 * Usage:
 *   node scripts/refresh_provenance_coverage.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const R = (p) => path.join(ROOT, p);
const APPLY = process.argv.includes('--apply');

const m = {};
new Function('m', fs.readFileSync(R('cities-data.js'), 'utf8') + ';m.d=CITIES')(m);
const cities = m.d;
const N = cities.length;
const ids = new Set(cities.map((c) => c.id));

const js = (file, name) => {
  const o = {};
  new Function('o', fs.readFileSync(R(file), 'utf8') + ';o.d=' + name)(o);
  return o.d;
};
const mine = (obj) => Object.keys(obj).filter((k) => ids.has(k)).length;

const climate = js('assets/city-climate.js', 'CITY_CLIMATE');
const tz = js('assets/city-tz.js', 'CITY_TZ');
const elev = JSON.parse(fs.readFileSync(R('data/city-elevations.json'), 'utf8')).elevations;
const numbeo = JSON.parse(fs.readFileSync(R('data/numbeo-costs.json'), 'utf8'));
const guide = JSON.parse(fs.readFileSync(R('data/guide-content.json'), 'utf8'));
const svc = JSON.parse(fs.readFileSync(R('data/service-languages.json'), 'utf8'));

const nSourced = Object.keys(numbeo).filter((k) => !k.startsWith('_') && ids.has(k)).length;
const nEstimated = N - nSourced;
const heroes = fs.readdirSync(R('images/cities'))
  .filter((f) => /\.webp$/.test(f) && !/-(m|t|card)\.webp$/.test(f)).length;

// Rendered, not stored: count what a reader actually sees on the pages.
// The venues total splits three ways on purpose. "713 venue cards" understated the real figure
// eightfold, but simply replacing it with 5661 would overstate what the 4.0-rating gate and the
// OpenStreetMap check actually cover: only a minority of cards quote a published rating at all,
// and that is the subset the triangulated method applies to. State both.
const QUOTES_RATING = /rate[sd]?\s+\d\.\d|\d\.\d\s*\/\s*5|\b\d[\d,]*\s+reviews?\b/i;
let venueCards = 0, venueCities = 0, ratingPages = 0, nbCities = 0, nbCards = 0;
for (const c of cities) {
  const h = fs.readFileSync(R('cities/' + c.id + '.html'), 'utf8');
  const v = (h.match(/<article class="(?:stay|cowork)-card"/g) || []).length;
  if (v) { venueCards += v; venueCities++; }
  if (QUOTES_RATING.test(h)) ratingPages++;
  const nb = (h.match(/<article class="neighborhood-card"/g) || []).length;
  if (nb) { nbCities++; nbCards += nb; }
}

const P = svc.providers;
const svcCities = new Set(P.map((r) => r.city).filter((c) => ids.has(c))).size;
const svcLangs = new Set(P.flatMap((r) => r.languages || [])).size;
const svcCats = new Set(P.map((r) => r.category)).size;
const ev = (t) => P.filter((r) => r.evidence === t).length;
const topCities = [...P.reduce((mm, r) => mm.set(r.city, (mm.get(r.city) || 0) + 1), new Map())]
  .sort((a, b) => b[1] - a[1]).slice(0, 6)
  .map(([id, n]) => (cities.find((c) => c.id === id) || { name: id }).name + ' ' + n).join(', ');

const coverage = {
  climate: mine(climate) + ' of ' + N + ' cities',
  timezones: mine(tz) + ' of ' + N + ' cities',
  'hero-images': heroes + ' images',
  'numbeo-costs': nSourced + ' of ' + N + ' cities',
  'city-elevations': mine(elev) + ' of ' + N + ' cities',
  'city-scores': N + ' of ' + N + ' cities',
  'cost-per-month': nSourced + ' of ' + N + ' sourced, ' + nEstimated
    + ' estimated, each labelled on its own page',
  'guide-prose': mine(guide) + ' cities have researched long-form sections; the remainder use the older generated text',
  neighborhoods: nbCities + ' of ' + N + ' cities have a section, ' + nbCards + ' entries in total',
  venues: venueCards + ' venue cards across ' + venueCities + ' cities. ' + ratingPages
    + ' pages quote a published rating, which is the subset the 4.0 gate and the OpenStreetMap'
    + ' check apply to; the rest describe a venue without claiming a score',
  'service-languages': P.length + ' providers across ' + svcCities + ' of ' + N + ' cities, '
    + svcCats + ' service types and ' + svcLangs + ' languages. ' + ev('official') + ' official, '
    + ev('self-declared') + ' self-declared, ' + ev('directory') + ' directory. ' + topCities,
};

// Counts quoted inside prose fields, rewritten explicitly rather than by pattern.
const prose = {
  'cost-per-month': {
    source: 'Numbeo for ' + nSourced + ' cities, our own estimate for the other ' + nEstimated,
    knownLimits: (s) => s.replace(/The \d+ estimated figures carry more uncertainty than the \d+ sourced ones\./,
      'The ' + nEstimated + ' estimated figures carry more uncertainty than the ' + nSourced + ' sourced ones.'),
  },
  neighborhoods: {
    // Matches both the original wording and the one this script writes, so a second run
    // updates the line rather than skipping it. The first version only matched the original
    // and silently left the count stale the moment it had rewritten it once.
    method: (s) => s.replace(/^\d+ entries across \d+ cities(?: researched in [\d-]+)?\./,
      nbCards + ' entries across ' + nbCities + ' cities.'),
  },
};

const file = R('data/provenance.json');
const prov = JSON.parse(fs.readFileSync(file, 'utf8'));
const changes = [];

for (const [key, value] of Object.entries(coverage)) {
  const entry = prov[key];
  if (!entry) { changes.push('!! provenance has no entry "' + key + '"'); continue; }
  if (entry.coverage !== value) {
    changes.push(key + '.coverage\n    was:  ' + String(entry.coverage).slice(0, 120)
      + '\n    now:  ' + value.slice(0, 120));
    entry.coverage = value;
  }
}
for (const [key, fields] of Object.entries(prose)) {
  const entry = prov[key];
  if (!entry) continue;
  for (const [f, rule] of Object.entries(fields)) {
    const next = typeof rule === 'function' ? rule(entry[f] || '') : rule;
    if (entry[f] !== next) {
      changes.push(key + '.' + f + '\n    was:  ' + String(entry[f]).slice(0, 120)
        + '\n    now:  ' + String(next).slice(0, 120));
      entry[f] = next;
    }
  }
}

if (!changes.length) { console.log('provenance coverage already matches the data'); process.exit(0); }
console.log(changes.length + ' field(s) stale:\n');
changes.forEach((c) => console.log('  ' + c + '\n'));

if (!APPLY) { console.log('Dry run. Re-run with --apply to write.'); process.exit(0); }
fs.writeFileSync(file, JSON.stringify(prov, null, 2) + '\n');
console.log('wrote data/provenance.json. Re-run build_methodology.cjs to publish it.');
