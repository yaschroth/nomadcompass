require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Makes the monthly budget a city page states agree with the costPerMonth every tile is drawn from.
 *
 * The tiles on /cities, the home page, /compare, /wheel, /map and the "Similar Vibe" blocks all
 * render from CITIES in cities-data.js at runtime, so they always show the current costPerMonth.
 * A city page bakes the figure into its HTML when it is generated. When
 * reconcile_cost_per_month.cjs rewrote costPerMonth from Numbeo data (rent for a one-bedroom in
 * the centre plus a one-person basket), the pages were never regenerated, so 330 of them kept the
 * older editorial estimate. The editorial numbers ran high, so the page was the larger figure on
 * 307 of those 330, by $672 on average and by as much as $2,510.
 *
 * The pages were contradicting themselves, not just the tiles: Lisbon's hero said $3,500 while its
 * own cost section, built from the same Numbeo basket, said "a comfortable solo budget in Lisbon is
 * about $2,400/mo".
 *
 * WHAT IT REWRITES, and nothing else:
 *   - the hero quick-stat labelled Monthly Budget
 *   - "$X a month" / "$X per month"
 *   - "$X/mo"
 * All three were checked against every occurrence on every drifted page before this was written.
 *
 * WHAT IT LEAVES ALONE: 32 occurrences where the stale figure is one END of an independently
 * researched range, "$1,100-1,600", "$900 to $1,200 USD per month". Those numbers were not derived
 * from costPerMonth and only coincide with it; rewriting one end would corrupt real research.
 * They are reported so they can be looked at rather than assumed.
 *
 * Three sentences also judge the figure ("one of the cheaper nomad bases in Asia"). All three move
 * DOWN, so the judgement stays true. Re-check that if the direction ever reverses.
 *
 * Idempotent: a page already in agreement is skipped.
 *
 * Usage: node scripts/sweep_city_budget.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// cities-data.js is a browser file; read the array out of it without a DOM.
const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const start = src.indexOf('const CITIES = [');
if (start < 0) { console.error('cities-data.js: no CITIES array'); process.exit(1); }
const body = src.slice(start + 'const CITIES = '.length);
let depth = 0, end = -1;
for (let i = 0; i < body.length; i++) {
  if (body[i] === '[') depth++;
  else if (body[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITIES = eval(body.slice(0, end));
const byId = new Map(CITIES.map((c) => [c.id, c]));

const money = (n) => '$' + Number(n).toLocaleString('en-US');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The figure must never be matched as the PREFIX of a longer number. Bogota's page carries
// "$1,700,870", a purchase price per square metre, and its stale budget was "$1,700". Without this
// guard that is a match; it fell outside the three rewritten contexts anyway, but only by luck.
const NOT_A_PREFIX = '(?![\\d,])';

const changed = [];
const leftAlone = [];
const broken = [];
let scanned = 0, agreed = 0, noStat = 0;

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const id = f.replace('.html', '');
  const c = byId.get(id);
  if (!c || c.costPerMonth == null) continue;
  scanned += 1;
  const p = path.join(ROOT, 'cities', f);
  const html = fs.readFileSync(p, 'utf8');
  const m = html.match(/<div class="quick-stat-value">\$([\d,]+)<\/div>\s*<div class="quick-stat-label">Monthly Budget/);
  if (!m) { noStat += 1; continue; }
  const onPage = Number(m[1].replace(/,/g, ''));
  const want = Number(c.costPerMonth);
  if (onPage === want) { agreed += 1; continue; }

  const stale = money(onPage);
  const fresh = money(want);
  const S = esc(stale);
  let out = html;
  let hits = 0;

  // 1. the hero quick-stat
  out = out.replace(new RegExp('(<div class="quick-stat-value">)' + S + NOT_A_PREFIX + '(</div>\\s*<div class="quick-stat-label">Monthly Budget)', 'g'),
    (_, a, b) => { hits += 1; return a + fresh + b; });
  // 2. "$X a month" / "$X per month"
  out = out.replace(new RegExp(S + NOT_A_PREFIX + '(\\s*(?:a|per)\\s+month)', 'g'),
    (_, tail) => { hits += 1; return fresh + tail; });
  // 3. "$X/mo"
  out = out.replace(new RegExp(S + NOT_A_PREFIX + '(\\s*/\\s*mo)', 'g'),
    (_, tail) => { hits += 1; return fresh + tail; });

  // whatever is left is a range endpoint that merely coincides with the old figure
  const rest = (out.match(new RegExp(S, 'g')) || []).length;
  if (rest) {
    const re = new RegExp(S, 'g');
    let mm;
    while ((mm = re.exec(out)) !== null) {
      const ctx = out.slice(Math.max(0, mm.index - 55), mm.index + 55)
        .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      leftAlone.push(id + '  ' + ctx);
    }
  }

  // Every JSON-LD block must still parse: the FAQ answers carry the figure.
  const blocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const bad = blocks.find((b) => { try { JSON.parse(b[1]); return false; } catch (e) { return true; } });
  if (bad) { broken.push(id); continue; }

  changed.push({ id, from: stale, to: fresh, hits, rest });
  if (APPLY) fs.writeFileSync(p, out);
}

console.log('scanned ' + scanned + ' city pages with a costPerMonth'
  + (noStat ? ', ' + noStat + ' carry no Monthly Budget stat' : ''));
console.log('  already in agreement: ' + agreed);
console.log('  rewritten:            ' + changed.length
  + '  (' + changed.reduce((s, x) => s + x.hits, 0) + ' figures)');
console.log('  left alone as ranges: ' + leftAlone.length);
if (broken.length) console.log('  SKIPPED, JSON-LD would not parse: ' + broken.join(', '));

console.log('\n  biggest corrections:');
changed.slice().sort((a, b) => Math.abs(Number(b.from.replace(/[$,]/g, '')) - Number(b.to.replace(/[$,]/g, '')))
  - Math.abs(Number(a.from.replace(/[$,]/g, '')) - Number(a.to.replace(/[$,]/g, ''))))
  .slice(0, 8).forEach((x) => console.log('    ' + x.id.padEnd(20) + x.from.padStart(8) + ' -> ' + x.to.padStart(8)));

if (leftAlone.length) {
  console.log('\n  ranges left untouched (the old figure is one end of a researched range):');
  leftAlone.slice(0, 10).forEach((x) => console.log('    ' + x.slice(0, 130)));
  if (leftAlone.length > 10) console.log('    ... and ' + (leftAlone.length - 10) + ' more');
}

if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');
else console.log('\nwrote ' + changed.length + ' page(s)');
