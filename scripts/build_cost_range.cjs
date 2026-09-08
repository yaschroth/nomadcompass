/**
 * Derives a monthly budget RANGE for the cities where one can be measured rather than guessed.
 *
 * The owner's point (2026-09-08): a monthly budget should be a range, not a fixed number. It is
 * correct, and the single figure was misleading in a specific way. costPerMonth is city-centre
 * rent plus a one-person basket, which is the TOP of a range we already hold and already print.
 * apply_city_costs.cjs line 52 computes "lean" as rent1o + singleNoRent and renders it as
 * "Lean / local" further down the same page. So every sourced page has been showing both ends of
 * the range for months while labelling only the expensive one as the city's cost.
 *
 *   low  = rent1o + singleNoRent      rent outside the centre
 *   high = rent1c + singleNoRent      rent in the centre
 *
 * Vary the rent, hold the basket: groceries and transport do not halve because somebody moved two
 * stops out, and Numbeo's singleNoRent is not split by neighbourhood anyway.
 *
 * THE 670 ESTIMATE CITIES GET NO RANGE, and that was not the original plan. Those pages carry no
 * component data, only one editorial number and editorial prose, so the only available method was
 * to read a rent range out of the prose and derive a basket from it. That method is testable on
 * the 330 sourced cities, where Numbeo gives the true rent1o and rent1c to check it against, and
 * it fails: median error 23%, p90 61%, and 72 of 488 endpoints more than 50% out (goa, medellin
 * and zanzibar are each over 200% out at the top end). Prose that wrong cannot become a headline
 * figure. Those cities keep their single estimate and the cost-basis note that already says it is
 * an estimate. Half the corpus with an honest single number beats all of it with an invented band.
 *
 * Numbeo has genuine inverted markets where rent outside the centre exceeds rent in it (leon,
 * noumea). Those get no range rather than a backwards one.
 *
 * Writes data/cost-ranges.json. Does NOT touch costPerMonth, which is the sort and filter key for
 * the wheel, compare, geoarbitrage, the tier list and every ranking page; moving it reshuffles
 * published output and is the owner's call, not this script's.
 *
 * Usage: node scripts/build_cost_range.cjs [--write]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const OUT = path.join(ROOT, 'data', 'cost-ranges.json');

const numbeo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'numbeo-costs.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'fx-usd.json'), 'utf8'));

// FX.rates is units-of-local-per-USD, so USD is local / rate. Same conversion as
// apply_city_costs.cjs, which is what already prints the figure this range's low end reproduces.
const round10 = (n) => Math.round(n / 10) * 10;

const out = {};
const skipped = { noRate: [], inverted: [], noComponents: [] };
const drift = [];

for (const c of CITIES) {
  const v = numbeo[c.id];
  if (!v || v.rent1c == null || v.rent1o == null || v.singleNoRent == null) {
    skipped.noComponents.push(c.id);
    continue;
  }
  const r = FX.rates[v.cur];
  if (!r) { skipped.noRate.push(c.id + ' (' + v.cur + ')'); continue; }

  const low = round10((v.rent1o + v.singleNoRent) / r);
  const high = round10((v.rent1c + v.singleNoRent) / r);
  if (low >= high) { skipped.inverted.push(c.id + ' ($' + low + ' >= $' + high + ')'); continue; }

  out[c.id] = { low, high, cur: v.cur, date: v.date };

  // costPerMonth should already BE the high end. Where it is not, something downstream has
  // overwritten it and the page's hero disagrees with its own cost table.
  if (c.costPerMonth != null && Math.abs(c.costPerMonth - high) / high > 0.06) {
    drift.push({ id: c.id, cpm: c.costPerMonth, high, off: (c.costPerMonth - high) / high });
  }
}

const ids = Object.keys(out);
const spreads = ids.map((k) => (out[k].high - out[k].low) / out[k].high).sort((a, b) => a - b);
const pct = (q) => (spreads[Math.floor(spreads.length * q)] * 100).toFixed(0) + '%';

console.log('COST RANGES  (measured components only)\n');
console.log('  derived: ' + ids.length + ' of ' + CITIES.length + ' cities');
console.log('  spread, low to high as a share of high:  p10 ' + pct(0.1)
  + '   median ' + pct(0.5) + '   p90 ' + pct(0.9) + '   max ' + pct(0.999) + '\n');

console.log('  no components (keep the single estimate): ' + skipped.noComponents.length);
for (const k of ['noRate', 'inverted']) {
  if (skipped[k].length) console.log('  ' + k + ': ' + skipped[k].length + '  ' + skipped[k].join(', '));
}

if (drift.length) {
  console.log('\n  costPerMonth no longer equals rent1c + singleNoRent on ' + drift.length + ' cities:');
  for (const d of drift.sort((a, b) => Math.abs(b.off) - Math.abs(a.off)).slice(0, 10)) {
    console.log('    ' + d.id.padEnd(16) + 'stored $' + d.cpm + '  vs  computed $' + d.high
      + '   (' + (d.off * 100).toFixed(0) + '%)');
  }
}

console.log('\n  samples:');
for (const id of ['lisbon', 'chiangmai', 'medellin', 'buenosaires', 'porto', 'bangkok']) {
  if (!out[id]) continue;
  const c = CITIES.find((x) => x.id === id);
  console.log('    ' + id.padEnd(14) + '$' + out[id].low + ' to $' + out[id].high
    + '   (headline today: $' + (c && c.costPerMonth) + ')');
}

if (WRITE) {
  fs.writeFileSync(OUT, JSON.stringify({
    _meta: {
      description: 'Monthly budget range per city, in USD. low = 1-bed rent outside the centre plus '
        + 'the one-person no-rent basket; high = the same basket with 1-bed rent in the centre. '
        + 'Both ends are Numbeo components converted at assets/fx-usd.json. Only cities with those '
        + 'components appear here: the rest carry a single editorial estimate instead, because a '
        + 'range derived from their page prose tested 23% off at the median against cities where '
        + 'the truth is known.',
      source: 'data/numbeo-costs.json + assets/fx-usd.json',
      generator: 'scripts/build_cost_range.cjs',
      cities: ids.length,
    },
    ...out,
  }, null, 2));
  console.log('\n  written to data/cost-ranges.json');
} else {
  console.log('\n  [dry run] pass --write to save');
}
