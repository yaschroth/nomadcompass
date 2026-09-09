require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Puts the low end of the measured budget range into cities-data.js, so the tiles can show what
 * the city pages already show.
 *
 * The hero on 327 city pages reads "$1,810-2,140". Every browse surface that links to it reads
 * "$2,140": the featured grid on the home page, the /compare columns, the wheel match cards. A
 * reader crossing from one to the other sees the number change and has no way to know that both
 * are the same figure seen from different ends.
 *
 * Adding costLow beside costPerMonth is the smallest change that fixes it, because every one of
 * those surfaces already loads cities-data.js and none of them needs a second request or a new
 * script tag. It is additive: nothing that reads costPerMonth today behaves differently tomorrow.
 *
 * IT DOES NOT TOUCH costPerMonth, which stays the sort and filter key. That was the open question
 * and this is the answer to it: the display becomes a range everywhere, and the ranking keeps
 * sorting on the top of that range, so no published order moves. Moving the key to a midpoint
 * would reshuffle every ranking page, the wheel budget filter, /compare, /geoarbitrage and the
 * tier list in exchange for a number that is no more true than the one it replaced.
 *
 * Idempotent: rewrites any costLow already present rather than appending a second one.
 *
 * Usage: node scripts/apply_cost_low_field.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const FILE = path.join(ROOT, 'cities-data.js');
const RANGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cost-ranges.json'), 'utf8'));

let src = fs.readFileSync(FILE, 'utf8');

// Work entry by entry from the id, because costPerMonth alone is not unique to a city and a
// global replace would be a lottery. Each object opens with `id: "slug"`.
let added = 0, updated = 0, missing = [];
for (const id of Object.keys(RANGES)) {
  if (id.startsWith('_')) continue;
  const low = RANGES[id].low;

  // THREE formattings live in this file and each one defeated a pattern written for the last:
  //   id: "lisbon",   ... newline + indent before every field
  //   id: "copenhagen", ... `airquality: 8},    costPerMonth: 2960,` on one line
  //   {id:"almaty",climateType:"Continental", ... fully minified, no spaces anywhere
  // Assuming any one of them silently skipped a third of the file while reporting a different
  // reason, so nothing here assumes spacing that has not been matched.
  const idRe = new RegExp('id:\\s*"' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"');
  const idM = src.match(idRe);
  if (!idM) { missing.push(id + ' (id not found)'); continue; }
  const idAt = idM.index;
  // The entry ends at the next id, or at the end of the array.
  const nextId = src.slice(idAt + 4).search(/id:\s*"/);
  const end = nextId < 0 ? src.length : idAt + 4 + nextId;
  const entry = src.slice(idAt, end);

  // Two formattings exist in this file and only one puts a newline before the field. 100 entries
  // read `airquality: 8},    costPerMonth: 2960,` on a single line, and a pattern anchored on a
  // newline skipped every one of them while reporting they had no costPerMonth at all. Match
  // whatever whitespace is actually there rather than assuming which kind it is.
  const existing = entry.match(/(\s*)costLow:\s*\d+,/);
  if (existing) {
    const next = entry.replace(/(\s*)costLow:\s*\d+,/, '$1costLow:' + low + ',');
    if (next !== entry) updated++;
    src = src.slice(0, idAt) + next + src.slice(end);
    continue;
  }

  const cpm = entry.match(/(\s*)costPerMonth:\s*(\d+),/);
  if (!cpm) { missing.push(id + ' (no costPerMonth)'); continue; }
  const sep = cpm[1] || '';
  const next = entry.replace(/(\s*)costPerMonth:\s*(\d+),/,
    sep + 'costLow:' + (sep ? ' ' : '') + low + ',' + sep + 'costPerMonth:' + (sep ? ' ' : '') + '$2,');
  src = src.slice(0, idAt) + next + src.slice(end);
  added++;
}

console.log('costLow in cities-data.js\n');
console.log('  ranges available: ' + Object.keys(RANGES).filter((k) => !k.startsWith('_')).length);
console.log('  added: ' + added + '   updated: ' + updated + (APPLY ? '' : '   [dry run]'));
if (missing.length) console.log('  MISSING: ' + missing.length + '  ' + missing.slice(0, 8).join(', '));

// The file is executed by every page on the site. Parse it before writing rather than after.
try {
  const CITIES = (new Function(src + ';return CITIES;'))();
  const withLow = CITIES.filter((c) => typeof c.costLow === 'number');
  const bad = withLow.filter((c) => !(c.costLow < c.costPerMonth));
  console.log('  parses: yes, ' + CITIES.length + ' cities, ' + withLow.length + ' carrying costLow');
  if (bad.length) {
    console.error('  REFUSING: costLow is not below costPerMonth on ' + bad.length
      + ': ' + bad.slice(0, 5).map((c) => c.id).join(', '));
    process.exit(1);
  }
} catch (e) {
  console.error('  REFUSING: the rewritten file does not parse: ' + e.message);
  process.exit(1);
}

if (APPLY) {
  fs.writeFileSync(FILE, src);
  console.log('\n  cities-data.js written');
} else {
  console.log('\n  [dry run] pass --apply to save');
}
