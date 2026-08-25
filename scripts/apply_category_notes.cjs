require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Writes the thirteen category notes onto a city page, and into the canonical data file with them.
 *
 * Each city page carries an inline CATEGORY_DESCRIPTIONS object that the score tiles are rendered
 * from. 60 of the 710 pages were still on the placeholder text that shipped with them, a single
 * generic line per tile: "Museums maintained. Suburban sprawl varies." next to a cleanliness score
 * of 6, which explains nothing about why the score is a 6.
 *
 * data/category-descriptions.json is NOT the source those pages are built from. It holds 413 cities
 * where the site has 710, and 269 of its entries are the thin text the pages have already moved
 * past, so writing only there would change nothing a reader sees. This writes the page, which is
 * what renders, and mirrors into the data file so the next tool has somewhere true to read from.
 *
 * Input is a JSON file of { "<cityId>": { climate: "...", cost: "...", ... } }, thirteen keys each.
 * A city whose notes are short is refused rather than written: the point of the exercise is length
 * and specificity, and a 12-word note passing through here silently would defeat it.
 *
 * Usage:
 *   node scripts/apply_category_notes.cjs <notes.json> [--min 40] [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/apply_category_notes.cjs <notes.json> [--min 40] [--apply]'); process.exit(2); }
const APPLY = process.argv.includes('--apply');
const minAt = process.argv.indexOf('--min');
const MIN = minAt > 0 ? Number(process.argv[minAt + 1]) : 40;

const notes = JSON.parse(fs.readFileSync(file, 'utf8'));
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const problems = [];
const ready = [];
for (const [id, o] of Object.entries(notes)) {
  const page = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(page)) { problems.push(id + ': no such city page'); continue; }
  const missing = KEYS.filter((k) => !o[k]);
  if (missing.length) { problems.push(id + ': missing ' + missing.join(', ')); continue; }
  const short = KEYS.filter((k) => words(o[k]) < MIN);
  if (short.length) { problems.push(id + ': under ' + MIN + ' words: ' + short.map((k) => k + '(' + words(o[k]) + ')').join(', ')); continue; }
  const extra = Object.keys(o).filter((k) => !KEYS.includes(k));
  if (extra.length) { problems.push(id + ': unknown key ' + extra.join(', ')); continue; }
  ready.push({ id, page, o, avg: KEYS.reduce((a, k) => a + words(o[k]), 0) / KEYS.length });
}

if (problems.length) {
  console.log('refused:');
  problems.forEach((p) => console.log('  ' + p));
  console.log('');
}
console.log(ready.length + ' city page(s) ready:');
ready.forEach((r) => console.log('  ' + r.id.padEnd(20) + r.avg.toFixed(1) + ' words per tile'));

if (!APPLY) { console.log('\nDry run. Re-run with --apply to write.'); process.exit(problems.length ? 1 : 0); }

const ANCHOR = 'const CATEGORY_DESCRIPTIONS = ';
let wrote = 0;
for (const r of ready) {
  const html = fs.readFileSync(r.page, 'utf8');
  const i = html.indexOf(ANCHOR);
  if (i < 0) { console.error('  SKIP ' + r.id + ': no CATEGORY_DESCRIPTIONS on the page'); continue; }
  const start = i + ANCHOR.length;
  // indexOf('};') lands on the brace that CLOSES the object, so the tail has to resume after it.
  // Resuming at it leaves the replacement reading "{...}};", which is a syntax error, and the whole
  // inline script stops running: the thirteen tiles render as nothing at all rather than as
  // something visibly wrong. Six pages were written that way before this was caught.
  const close = html.indexOf('};', start);
  if (close < 0) { console.error('  SKIP ' + r.id + ': object never closes'); continue; }
  // Ordered by KEYS so every page carries them in the same order as the tiles.
  const obj = {};
  KEYS.forEach((k) => { obj[k] = r.o[k].trim(); });
  const next = html.slice(0, start) + JSON.stringify(obj) + html.slice(close + 1);
  // Nothing is written until the page's own scripts have been parsed with the new object in them.
  const scripts = [...next.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const broken = scripts.find((s) => { try { new Function(s); return false; } catch (e) { return true; } });
  if (broken !== undefined) { console.error('  SKIP ' + r.id + ': the page would no longer parse as JavaScript'); continue; }
  fs.writeFileSync(r.page, next);
  wrote += 1;
}

// Mirror into the data file, so the notes exist somewhere other than inside 710 pages.
const DATA = path.join(ROOT, 'data', 'category-descriptions.json');
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
ready.forEach((r) => { data[r.id] = Object.fromEntries(KEYS.map((k) => [k, r.o[k].trim()])); });
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');

console.log('\nwrote ' + wrote + ' page(s) and mirrored them into data/category-descriptions.json');
