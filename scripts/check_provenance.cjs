/**
 * PROVENANCE GATE
 *
 * STANDING RULE: every factual claim we publish must trace to a PRIMARY source and be
 * citable. Where no primary source exists, the claim must be TRIANGULATED across at
 * least two independent sources, both recorded. Anything else is tier "editorial",
 * which means it is our judgement, not a fact, and must be presented as such.
 *
 * This gate checks data/provenance.json: every claim class the site publishes must have
 * an entry, the entry must declare a valid tier, sourced tiers must carry a resolvable
 * source, and triangulated ones must list at least two corroborating sources.
 *
 * Exit codes: 0 all claim classes declared and well formed; 1 something is undeclared
 * or malformed. Editorial entries pass the gate but are reported, because the point is
 * to keep unsourced claims visible rather than to pretend they do not exist.
 *
 * Usage:
 *   node scripts/check_provenance.cjs            human readable
 *   node scripts/check_provenance.cjs --json     machine readable
 *   node scripts/check_provenance.cjs --strict   also fail on any editorial tier
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');

// Every class of factual claim the site publishes, and the file that backs it.
// Adding a new dataset without adding it here is itself a gate failure.
const CLAIMS = [
  ['climate', 'Monthly temperature and precipitation normals', 'assets/city-climate.js'],
  ['timezones', 'City time zones and DST behaviour', 'assets/city-tz.js'],
  ['hero-images', 'Hero photograph, photographer and licence', 'images/cities/attribution.json'],
  ['numbeo-costs', 'Cost-of-living component breakdown', 'data/numbeo-costs.json'],
  ['visa', 'Visa status per passport and destination', 'assets/visa-data.js'],
  ['city-scores', '13 category scores, the Nomad Score, and every ranking derived from them', 'cities-data.js'],
  ['cost-per-month', 'Headline monthly cost figure per city', 'cities-data.js'],
  ['guide-prose', 'Seven long-form guide sections per city, including price figures', 'data/guide-content.json'],
  ['neighborhoods', 'Neighbourhood descriptions, price levels and map coordinates', 'data/neighborhoods'],
  ['venues', 'Named coworking, cafe and restaurant recommendations', 'cities/*.html'],
  ['service-languages', 'Local service providers and the languages they work in', 'data/service-languages.json'],
  ['country-facts', 'Currency, voltage, tap water, tipping, ride-hailing, emergency numbers', 'scripts/lib/country-facts.cjs'],
  ['country-meta', 'Plug types per country', 'scripts/lib/country-meta.cjs'],
  ['city-elevations', 'Elevation reference used by the sanity gate', 'data/city-elevations.json'],
];

const TIERS = ['primary', 'triangulated', 'editorial'];
const MANIFEST = path.join(ROOT, 'data', 'provenance.json');

if (!fs.existsSync(MANIFEST)) {
  console.error('FAIL: data/provenance.json is missing. Every dataset must declare its source.');
  process.exit(1);
}
let man;
try { man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
catch (e) { console.error('FAIL: data/provenance.json does not parse: ' + e.message); process.exit(1); }

const rows = [];
for (const [id, claim, file] of CLAIMS) {
  const m = man[id];
  const exists = file.includes('*') || fs.existsSync(path.join(ROOT, file));
  let status, detail;
  if (!exists) { status = 'NO DATA FILE'; detail = file; }
  else if (!m) { status = 'UNDECLARED'; detail = 'no entry in data/provenance.json'; }
  else if (!TIERS.includes(m.tier)) { status = 'BAD TIER'; detail = `"${m.tier}" not one of ${TIERS.join('/')}`; }
  else if (m.tier !== 'editorial' && !m.sourceUrl) { status = 'NO SOURCE URL'; detail = m.source || ''; }
  else if (m.tier === 'triangulated' && (!Array.isArray(m.corroboration) || m.corroboration.length < 2)) {
    status = 'THIN TRIANGULATION'; detail = 'needs >=2 independent corroborating sources';
  } else {
    status = m.tier.toUpperCase();
    detail = (m.source || '') + (m.coverage ? ' | ' + m.coverage : '');
  }
  rows.push({ id, claim, file, status, detail, knownLimits: m && m.knownLimits });
}

const broken = rows.filter(r => !TIERS.map(t => t.toUpperCase()).includes(r.status));
const editorial = rows.filter(r => r.status === 'EDITORIAL');
const sourced = rows.filter(r => r.status === 'PRIMARY' || r.status === 'TRIANGULATED');

if (JSON_OUT) {
  console.log(JSON.stringify({ sourced: sourced.length, editorial: editorial.length, broken: broken.length, rows }, null, 2));
} else {
  const w = Math.max(...rows.map(r => r.id.length)) + 2;
  console.log('PROVENANCE GATE\n');
  for (const r of rows) console.log('  ' + r.status.padEnd(20) + r.id.padEnd(w) + r.detail);
  console.log(`\n  sourced ${sourced.length}/${rows.length} | editorial ${editorial.length} | broken ${broken.length}`);
  if (editorial.length) {
    console.log('\n  EDITORIAL, i.e. our judgement rather than fact. Each must read as opinion on the page:');
    for (const r of editorial) {
      console.log(`    - ${r.id}: ${r.claim}`);
      if (r.knownLimits) console.log(`        ${r.knownLimits}`);
    }
  }
  if (broken.length) {
    console.log('\n  FAILING:');
    for (const r of broken) console.log(`    - ${r.id}: ${r.status}, ${r.detail}`);
  }
}

process.exit(broken.length || (STRICT && editorial.length) ? 1 : 0);
