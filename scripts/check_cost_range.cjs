/**
 * Gate: the hero budget range says the same thing as the cost table under it.
 *
 * Written against the failure that actually happened here rather than an imagined one. The
 * cost-basis gate passed for weeks while 350 pages had lost their provenance note, because it
 * checked that a marker existed instead of checking what the marker contained. So this does not
 * ask "is there a range". It asks whether the two numbers in the hero are the same two numbers the
 * Numbeo table renders four screens below, which is the only way the page can contradict itself.
 *
 * Four things, each of which is a real way this can break:
 *
 *   1. Every city in data/cost-ranges.json shows exactly "$low-high" in its hero. Catches a
 *      regenerated page silently reverting to the single figure.
 *   2. The range high equals costPerMonth. That identity is what makes the sort key and the hero
 *      agree, and reconcile_cost_per_month.cjs can move costPerMonth without touching pages.
 *   3. The range low equals the "Lean / local" figure in the cost box. Both are rent1o +
 *      singleNoRent, so if they ever differ, one of the two generators is working from stale FX or
 *      stale Numbeo and the page is arguing with itself in public.
 *   4. A city NOT in cost-ranges.json must NOT show a range. Those 671 have no measured second
 *      end; a range appearing on one means somebody invented a spread, which is the fabrication
 *      rule, and it would look identical to a real one.
 *
 * Usage: node scripts/check_cost_range.cjs
 * Exit 1 on any disagreement.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RANGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cost-ranges.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();

const money = (n) => '$' + Number(n).toLocaleString('en-US');
const plain = (n) => Number(n).toLocaleString('en-US');
const STAT = /<div class="quick-stat-value">([^<]+)<\/div>\s*<div class="quick-stat-label">Monthly Budget/;
// The third persona in the cost box. Its value is rent outside the centre plus the same basket.
const LEAN = /<span class="cost-persona-val">\$([\d,]+)<span class="cost-per">\/mo<\/span><\/span><span class="cost-persona-label">Lean/;

const errors = [];
let ranged = 0, single = 0, leanChecked = 0;

for (const c of CITIES) {
  const p = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const m = html.match(STAT);
  if (!m) continue;
  const shown = m[1].trim();
  const r = RANGES[c.id];

  if (!r) {
    // 4. no measured second end, so there must be no range
    if (/^\$[\d,]+-[\d,]+$/.test(shown)) {
      errors.push(c.id + ': shows a range "' + shown + '" but has no measured components. '
        + 'A spread that was never measured must not be published as one.');
    }
    single++;
    continue;
  }

  ranged++;
  const want = money(r.low) + '-' + plain(r.high);
  // 1. the hero renders the range
  if (shown !== want) {
    errors.push(c.id + ': hero says "' + shown + '", data/cost-ranges.json says "' + want + '"');
    continue;
  }
  // 2. the high end is the sort key
  if (c.costPerMonth !== r.high) {
    errors.push(c.id + ': range high is ' + money(r.high) + ' but costPerMonth is '
      + money(c.costPerMonth) + '. Re-run build_cost_range.cjs --write then apply_cost_range.cjs --apply.');
  }
  // 3. the low end is the figure the cost box already publishes
  const lean = html.match(LEAN);
  if (lean) {
    leanChecked++;
    const leanVal = Number(lean[1].replace(/,/g, ''));
    // Both are rounded independently, so allow the rounding step but nothing beyond it.
    if (Math.abs(leanVal - r.low) > 10) {
      errors.push(c.id + ': hero low ' + money(r.low) + ' but the cost box "Lean / local" says '
        + money(leanVal) + '. The page contradicts itself.');
    }
  }
}

console.log('COST RANGE GATE  (the hero range agrees with the table below it)\n');
console.log('  ' + ranged + ' cities show a measured range, ' + single + ' show a single figure');
console.log('  ' + leanChecked + ' cross-checked against the cost box "Lean / local" value\n');

if (!errors.length) {
  console.log('  clean: every range matches its data, its sort key and its own cost table.');
  process.exit(0);
}
console.log('  FAILING: ' + errors.length + '\n');
errors.slice(0, 25).forEach((e) => console.log('    ' + e));
if (errors.length > 25) console.log('    ... and ' + (errors.length - 25) + ' more');
process.exit(1);
