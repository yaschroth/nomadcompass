/**
 * Splits the pages whose prose contradicts their cost table into the two faults that need
 * different remedies.
 *
 * 172 measured cities state a total in prose that disagrees with the Numbeo table printed above
 * it. Treating that as one problem would be wrong, because it is two:
 *
 *   CATCHMENT  The measured figure describes a wider or cheaper area than the reader would live in,
 *              so the sort key ranks the city cheaper than anyone can actually live there. It
 *              arrives two ways. Either every rent the page quotes sits above the measured rent,
 *              which means Numbeo is measuring somewhere else (Zanzibar: prose from $225, measured
 *              $100). Or the page names a premium district and the measurement averages across it
 *              (Goa: $155-295 inland, which matches Numbeo almost exactly, AND $365-575 for the
 *              Anjuna belt where visitors go).
 *
 *              Goa is worth stating carefully, because I got it wrong first. The page does not
 *              contradict itself and the table is not incorrect: it reports the district honestly.
 *              What it does is headline a district average for readers who will all live in one
 *              expensive corner of that district. Rent alone in the belt exceeds the entire
 *              headline budget of $350.
 *
 *   BASKET     The rents agree and only the totals differ, because the prose is describing a more
 *              generous life than our one-person basket prices. Bangkok: table $700 central rent,
 *              prose $540-1,050, so the rent is fine, and the totals differ only because the prose
 *              assumes eating out and a coworking desk. Nothing is wrong with either number. What
 *              is wrong is that the page never says they measure different things.
 *
 * The test is the RENT, not the total, because rent is the component both sources state and the
 * only one where a catchment error can show up. A prose rent far above the measured rent means the
 * two are describing different places. A prose rent that matches means they are describing the
 * same place and differing about lifestyle.
 *
 * Usage: node scripts/classify_cost_conflicts.cjs [--list catchment|basket|unclear] [--json FILE]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RANGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cost-ranges.json'), 'utf8'));
const numbeo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'numbeo-costs.json'), 'utf8'));
const FX = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'fx-usd.json'), 'utf8'));
const CITIES = (new Function(fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';return CITIES;'))();
const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const LIST = arg('list');
const JSON_OUT = arg('json');

const num = (s) => Number(String(s).replace(/,/g, ''));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// The labelled total bullet, which is a real field rather than a guess at a paragraph.
const TOTAL_LI = /<strong>\s*(?:Total|Realistic|Monthly total)[^<:]{0,40}:?\s*<\/strong>([^<]{0,240})/i;
// The rent bullet. Local-currency bullets are excluded: comparing a peso to a dollar invents an
// error that is not there, and several pages quote rent in local currency on purpose.
const RENT_LI = /<li>\s*<strong>\s*Rent[^<]{0,80}<\/strong>([^<]{0,220})/gi;
const LOCAL = /\b(?:MXN|THB|VND|IDR|PHP|INR|COP|ARS|BRL|TRY|EGP|ZAR|KES|LKR|PEN|CLP|UAH|GEL|RSD|HUF|CZK|PLN|RON|BGN|MAD|KRW|JPY|TWD|MYR|NPR|KHR|LAK|MMK|NGN|GHS|TZS|UGX|XOF|XAF)\b/i;
const RANGE = /\$?\s?([\d,]+)\s*(?:to|-|–|and)\s*\$?([\d,]+)/;

const out = { catchment: [], basket: [], unclear: [] };

for (const id of Object.keys(RANGES)) {
  if (id.startsWith('_')) continue;
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(p)) continue;
  const sec = fs.readFileSync(p, 'utf8').match(/<h2 id="cost-of-living">[\s\S]{0,6000}?<h2/);
  if (!sec) continue;
  const html = sec[0];

  const tm = html.match(TOTAL_LI);
  if (!tm) continue;
  const tr = tm[1].match(RANGE);
  if (!tr) continue;
  const proseLo = num(tr[1]), proseHi = num(tr[2]);
  if (!(proseHi > proseLo && proseLo > 30)) continue;

  const R = RANGES[id];
  const c = byId[id] || {};
  // Only conflicts: the prose total sits clear of the measured range.
  const worst = Math.max(Math.abs(proseLo - R.low) / R.low, Math.abs(proseHi - R.high) / R.high);
  if (worst <= 0.15) continue;

  // Now the deciding comparison: prose rent against measured rent.
  const v = numbeo[id];
  const rate = v && FX.rates[v.cur];
  const bullets = [...html.matchAll(RENT_LI)].map((m) => m[1]).filter((t) => !LOCAL.test(t));
  const pairs = bullets.map((t) => t.match(RANGE)).filter(Boolean)
    .map((m) => [num(m[1]), num(m[2])]).filter(([a, b]) => b > a && a > 40);

  const row = { id, name: c.name, country: c.country, cpm: c.costPerMonth,
    table: { low: R.low, high: R.high }, prose: { low: proseLo, high: proseHi } };

  if (!pairs.length || !rate) { out.unclear.push({ ...row, why: 'no comparable USD rent bullet' }); continue; }

  const proseRentLo = Math.min(...pairs.map((x) => x[0]));
  const trueRentLo = v.rent1o / rate, trueRentHi = v.rent1c / rate;
  const lowGap = (proseRentLo - trueRentLo) / trueRentLo;

  // The deciding figure is the DEAREST rent bullet, not the cheapest. Goa taught me that: its page
  // quotes $155-295 for inland Mapusa, which matches Numbeo almost exactly, AND $365-575 for the
  // Anjuna belt where visitors actually go. Comparing the cheapest bullet said the page agreed
  // with itself and cleared Goa entirely. It does agree with itself. What it does not do is
  // headline a figure that describes the reader, because the district average and the nomad
  // district are different places and only one of them is in the sort key.
  const nomadRentLo = Math.max(...pairs.map((x) => x[0]));
  const premium = (nomadRentLo - trueRentHi) / trueRentHi;

  row.rent = { cheapestProse: proseRentLo, dearestProse: nomadRentLo,
    trueLo: Math.round(trueRentLo), trueHi: Math.round(trueRentHi), lowGap, premium };

  // Every quoted rent sits above the measured ceiling: the measurement is of a different place.
  if (lowGap > 0.4) out.catchment.push({ ...row, kind: 'measurement is of a wider area' });
  // The page names a nomad district costing far more than the measured centre.
  else if (premium > 0.4) out.catchment.push({ ...row, kind: 'headline averages across a premium district' });
  else out.basket.push(row);
}

const show = (label, rows, n) => {
  console.log('  ' + label + ': ' + rows.length);
  for (const r of rows.slice(0, n)) {
    const extra = r.rent
      ? '   rent quoted ' + money(r.rent.cheapestProse) + '-' + money(r.rent.dearestProse)
        + ' vs measured ' + money(r.rent.trueLo) + '-' + money(r.rent.trueHi)
        + (r.kind ? '   [' + r.kind + ']' : '')
      : '   ' + r.why;
    console.log('    ' + r.id.padEnd(16) + 'table ' + money(r.table.low) + '-' + money(r.table.high)
      + '  prose ' + money(r.prose.low) + '-' + money(r.prose.high) + extra);
  }
  console.log('');
};

console.log('COST CONFLICTS, CLASSIFIED\n');
if (LIST) {
  console.log((out[LIST] || []).map((r) => r.id).join('\n'));
  process.exit(0);
}
out.catchment.sort((a, b) => Math.max(b.rent.lowGap, b.rent.premium) - Math.max(a.rent.lowGap, a.rent.premium));
show('CATCHMENT  (Numbeo measures a wider area than the reader would live in; the sort key is too low)', out.catchment, 20);
show('BASKET     (rents agree; the totals differ because they price different lifestyles)', out.basket, 8);
show('UNCLEAR    (needs a human)', out.unclear, 6);

console.log('  total conflicting: ' + (out.catchment.length + out.basket.length + out.unclear.length));
if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 2));
  console.log('  written to ' + JSON_OUT);
}
