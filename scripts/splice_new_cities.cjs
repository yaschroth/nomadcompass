/**
 * Splices a batch of authored city objects into cities-data.js, before the `];` that closes CITIES.
 *
 * Written as a script rather than done by hand because the file has three properties that break a
 * naive edit, all of them recorded the hard way in earlier batches:
 *
 *   - It is CRLF. Matching on a line equal to '];' means matching '];\r', and re-appending the \r
 *     when writing the line back, or the splice silently produces a file that no longer parses.
 *   - There is more than one '];' in the file. Only the one closing CITIES may be used, so the
 *     match is on a line whose trimmed value is exactly '];' AND whose previous non-empty line ends
 *     a city object.
 *   - Duplicates are the recurring failure. Batch 2 lost 3 of 30 to name and slug clashes found
 *     after authoring. This checks normalised name+country AND slug, against the parsed array
 *     rather than against a grep, and refuses the whole batch if any row collides.
 *
 * The batch file is a JSON array of city objects, written in the compact one-line form the newer
 * half of cities-data.js uses.
 *
 * Usage: node scripts/splice_new_cities.cjs <batch.json> [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const file = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!file) { console.error('usage: node scripts/splice_new_cities.cjs <batch.json> [--dry]'); process.exit(1); }

const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
const target = path.join(ROOT, 'cities-data.js');
const src = fs.readFileSync(target, 'utf8');
const CITIES = (new Function(src + ';return CITIES;'))();

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const haveKey = new Set(CITIES.map((c) => norm(c.name) + '|' + norm(c.country)));
const haveSlug = new Set(CITIES.map((c) => c.id));

const REQUIRED = ['id', 'climateType', 'name', 'country', 'flag', 'tagline', 'scores', 'costPerMonth', 'lat', 'lng', 'timezone'];
const SCORES = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];

const problems = [];
const seenHere = new Set();
for (const c of batch) {
  const where = c.id || c.name || '(unnamed)';
  for (const f of REQUIRED) if (c[f] == null) problems.push(where + ': missing ' + f);
  for (const s of SCORES) {
    const v = c.scores && c.scores[s];
    if (typeof v !== 'number' || v < 1 || v > 10) problems.push(where + ': score ' + s + ' is ' + v);
  }
  if (c.id && !/^[a-z0-9]+$/.test(c.id)) problems.push(where + ': slug must be lowercase ASCII');
  if (haveSlug.has(c.id)) problems.push(where + ': slug already exists');
  const k = norm(c.name) + '|' + norm(c.country);
  if (haveKey.has(k)) problems.push(where + ': name+country already exists');
  if (seenHere.has(k)) problems.push(where + ': duplicated inside this batch');
  seenHere.add(k);
  if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) problems.push(where + ': coordinates out of range');
  // An em-dash in a tagline reaches the page and the prose gate. Cheaper to catch here.
  if (/[—–]/.test(c.tagline || '')) problems.push(where + ': tagline contains an em or en dash');
}
if (problems.length) {
  console.error('Refusing the batch, ' + problems.length + ' problem(s):');
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}

const num = (n) => (Number.isInteger(n) ? String(n) : String(n));
const one = (c) => '  {id:"' + c.id + '",climateType:"' + c.climateType + '",name:"' + c.name
  + '",country:"' + c.country + '",flag:"' + c.flag + '",tagline:"' + c.tagline.replace(/"/g, '\\"')
  + '",image:"/images/cities/' + c.id + '-card.webp",scores:{'
  + SCORES.map((s) => s + ':' + c.scores[s]).join(',') + '},costPerMonth:' + c.costPerMonth
  + ',lat:' + num(c.lat) + ',lng:' + num(c.lng) + ',timezone:' + num(c.timezone) + '},';

const lines = src.split('\n');
// The line closing CITIES: exactly '];' once the \r is trimmed, and preceded by a city object.
let at = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() !== '];') continue;
  const prev = lines[i - 1] || '';
  if (!/costPerMonth/.test(prev) && !/\}\s*,?\s*$/.test(prev.trim())) continue;
  at = i;
  break;
}
if (at === -1) { console.error('Could not find the line closing CITIES.'); process.exit(1); }

// The file is CRLF, so every line written back needs its \r.
const insert = batch.map((c) => one(c) + '\r');
const next = [...lines.slice(0, at), ...insert, ...lines.slice(at)].join('\n');

// It has to still parse, and still be the array we think it is.
let after;
try { after = (new Function(next + ';return CITIES;'))(); } catch (e) {
  console.error('The spliced file does not parse: ' + e.message);
  process.exit(1);
}
if (after.length !== CITIES.length + batch.length) {
  console.error('Expected ' + (CITIES.length + batch.length) + ' cities, got ' + after.length);
  process.exit(1);
}

if (!DRY) fs.writeFileSync(target, next);
console.log('Spliced ' + batch.length + ' cities: ' + CITIES.length + ' -> ' + after.length
  + (DRY ? '  [dry run, nothing written]' : ''));
console.log('  ' + batch.map((c) => c.name).join(', '));
