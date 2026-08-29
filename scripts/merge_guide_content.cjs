/**
 * Validates a batch of long-form guide sections and merges it into data/guide-content.json.
 *
 * The seven sections are the difference between a new city page and an established one, so they
 * are the part most worth checking before it reaches 30 pages at once. Every batch is refused
 * whole rather than partially applied, because a half-merged batch leaves some pages at full depth
 * and some at skeleton depth with nothing recording which is which.
 *
 * What it checks, and why each one is here:
 *   - all seven fields present, since apply_city_guide_sections emits a heading per field and a
 *     missing one produces a heading with no text under it
 *   - 90 to 220 words per field, the band the existing 60 cities sit in
 *   - no em or en dashes, which check_prose_style fails sitewide
 *   - no currency other than USD, which is a standing rule
 *   - the slug exists in cities-data.js, so a typo cannot create an orphan entry
 *   - the cost figure in costOfLiving matches costPerMonth, since the two appear within a screen
 *     of each other on the page and a mismatch is the first thing a reader notices
 *
 * Usage: node scripts/merge_guide_content.cjs <batch.json> [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const file = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!file) { console.error('usage: node scripts/merge_guide_content.cjs <batch.json> [--dry]'); process.exit(1); }

const FIELDS = ['costOfLiving', 'whereToWork', 'gettingAround', 'visas', 'bestTime', 'prosCons', 'whoFor'];
const MIN_WORDS = 90;
const MAX_WORDS = 220;

const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
const target = path.join(ROOT, 'data', 'guide-content.json');
const current = JSON.parse(fs.readFileSync(target, 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));

const money = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const problems = [];

for (const [slug, entry] of Object.entries(batch)) {
  if (slug.startsWith('_') || slug === 'note') continue;
  const city = byId[slug];
  if (!city) { problems.push(slug + ': not a city in cities-data.js'); continue; }
  for (const f of FIELDS) {
    const v = entry[f];
    if (typeof v !== 'string' || !v.trim()) { problems.push(slug + '.' + f + ': missing'); continue; }
    const w = v.trim().split(/\s+/).length;
    if (w < MIN_WORDS || w > MAX_WORDS) problems.push(slug + '.' + f + ': ' + w + ' words');
    if (/[—–]/.test(v)) problems.push(slug + '.' + f + ': em or en dash');
    // Money in a currency other than USD. A currency NAME only counts when it sits against a
    // number, which is what check_prose_style enforces sitewide: "Montenegro uses the euro" is a
    // fact about a country and "400 euros" is a price in the wrong currency. Checking the bare word
    // rejected the first correct sentence it saw.
    const cur = v.match(/[€£¥₹₺₽]\s?\d|\d[\d,.]*\s?(?:EUR|GBP|THB|euros?|pounds sterling)\b/i);
    if (cur) problems.push(slug + '.' + f + ': non-USD price "' + cur[0] + '"');
  }
  const extra = Object.keys(entry).filter((k) => !FIELDS.includes(k));
  if (extra.length) problems.push(slug + ': unexpected field(s) ' + extra.join(', '));
  // The headline figure has to be the one the rest of the site uses.
  if (typeof entry.costOfLiving === 'string' && !entry.costOfLiving.includes(money(city.costPerMonth))) {
    problems.push(slug + '.costOfLiving: does not state ' + money(city.costPerMonth)
      + ', the costPerMonth in cities-data.js');
  }
}

if (problems.length) {
  console.error('Refusing the batch, ' + problems.length + ' problem(s):');
  problems.slice(0, 30).forEach((p) => console.error('  ' + p));
  if (problems.length > 30) console.error('  ... and ' + (problems.length - 30) + ' more');
  process.exit(1);
}

const added = Object.keys(batch).filter((k) => !k.startsWith('_') && k !== 'note' && !current[k]);
const replaced = Object.keys(batch).filter((k) => !k.startsWith('_') && k !== 'note' && current[k]);
const next = { ...current, ...batch };
if (!DRY) fs.writeFileSync(target, JSON.stringify(next, null, 1) + '\n');

const n = Object.keys(next).filter((k) => !k.startsWith('_') && k !== 'note').length;
console.log('guide-content.json: ' + added.length + ' added, ' + replaced.length + ' replaced, '
  + n + ' cities total' + (DRY ? '  [dry run]' : ''));
if (added.length) console.log('  added: ' + added.join(', '));
