require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Shows the hero "Monthly Budget" as the range it always was.
 *
 * The owner, 2026-09-08: a monthly budget should be a range rather than a fixed number. On the 327
 * cities with measured components the page was already carrying both ends and labelling one. The
 * cost box renders "Solo nomad $2,140 / Couple $2,800 / Lean / local $1,810" from rent in the
 * centre and rent outside it, and then the hero, four screens above it, says $2,140 and calls that
 * the Monthly Budget. A reader who never scrolls to the cost box sees the expensive end presented
 * as the number.
 *
 * So the hero stat becomes "$1,810-2,140": the same two figures the cost box below already
 * publishes, which is why this needs no new data and cannot disagree with the table. The hyphen
 * form matches the corpus, which uses it for 5,450 numeric ranges against 2 en dashes.
 *
 * ONLY the 327 cities in data/cost-ranges.json. The other 671 keep a single figure because there
 * is nothing to build a second end out of: see the header of build_cost_range.cjs for the test
 * that killed the alternative. Their cost-basis note already tells the reader the figure is an
 * estimate.
 *
 * NOT TOUCHED, deliberately:
 *   - <title> and meta description. Every snippet on the site was rewritten 2026-08-28 and the
 *     GSC re-measure against the 1.6% baseline is due ~2026-09-25. Editing them now would throw
 *     away the experiment for a cosmetic gain. Both still read "$2,140 a month", which remains
 *     true: it is the solo, centre figure.
 *   - the JSON-LD FAQ answers, same reason and same truth.
 *   - the browse tiles on /, /cities, /compare and /wheel, which render costPerMonth at runtime
 *     and sort on it. Those move only if the sort key moves, which is the owner's call.
 *
 * Idempotent: the value is rebuilt from data every run, so a later cost refresh flows through
 * rather than freezing. Runs AFTER sweep_city_budget.cjs.
 *
 * Usage: node scripts/apply_cost_range.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const RANGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cost-ranges.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = new Map(CITIES.map((c) => [c.id, c]));

const money = (n) => '$' + Number(n).toLocaleString('en-US');
const plain = (n) => Number(n).toLocaleString('en-US');

// Matches the stat whether it currently holds one figure or a range, so a re-run reads its own
// output. Anchored on the label, which is what makes it the budget stat rather than wifi or safety.
const STAT = /(<div class="quick-stat-value">)([^<]+)(<\/div>\s*<div class="quick-stat-label">Monthly Budget)/;

const changed = [];
const already = [];
const mismatch = [];
const noStat = [];

for (const id of Object.keys(RANGES)) {
  if (id.startsWith('_')) continue;
  const r = RANGES[id];
  const c = byId.get(id);
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!c || !fs.existsSync(p)) { noStat.push(id + ' (no page)'); continue; }

  const html = fs.readFileSync(p, 'utf8');
  const m = html.match(STAT);
  if (!m) { noStat.push(id); continue; }

  const want = money(r.low) + '-' + plain(r.high);
  const current = m[2].trim();
  if (current === want) { already.push(id); continue; }

  // The stat should currently hold the high end, because costPerMonth is rent1c + singleNoRent and
  // build_cost_range confirmed that identity on all 327. Anything else means something rewrote the
  // hero out from under the data, and overwriting it blindly would erase the evidence.
  const single = current.match(/^\$([\d,]+)$/);
  if (!single || Number(single[1].replace(/,/g, '')) !== r.high) {
    mismatch.push(id + ': hero says "' + current + '", range high is ' + money(r.high));
    continue;
  }

  const out = html.replace(STAT, (_, a, v, b) => a + want + b);
  changed.push({ id, from: current, to: want });
  if (APPLY) fs.writeFileSync(p, out);
}

console.log('Hero Monthly Budget as a range\n');
console.log('  cities with a measured range: ' + Object.keys(RANGES).filter((k) => !k.startsWith('_')).length);
console.log('  rewritten:      ' + changed.length + (APPLY ? '' : '   [dry run]'));
console.log('  already correct: ' + already.length);
if (noStat.length) console.log('  no Monthly Budget stat: ' + noStat.length + '  ' + noStat.slice(0, 6).join(', '));
if (mismatch.length) {
  console.log('\n  LEFT ALONE, the hero does not hold the range high end (' + mismatch.length + '):');
  mismatch.slice(0, 10).forEach((x) => console.log('    ' + x));
}

if (changed.length) {
  console.log('\n  samples:');
  changed.slice(0, 8).forEach((x) => console.log('    ' + x.id.padEnd(16) + x.from.padStart(8) + '  ->  ' + x.to));
}
