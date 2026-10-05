/**
 * Gate: three shapes a price takes when a sweep has mangled it. Each was on live pages on 2026-09-29
 * and none of the other gates could see it, because every one of them is a valid dollar amount.
 *
 *   1. INVERTED RANGE   "$22,000 to $2,020 a month", "$1,000 to $820". A currency sweep converted
 *      only the upper bound of a peso range, or a cost reconcile replaced only one end. The Mexico City
 *      post priced street tacos at "$15 to $1.50".
 *   2. DOUBLED GLOSS    "$455-905/mo ($400-800)". A sweep converted "NAD 7,500-15,000 (USD 400-800)"
 *      at the current rate and kept the old gloss, so 26 city pages quoted two different dollar ranges
 *      for the same thing, 104 times.
 *   3. EATEN "$1"       "around </main>,600 a month". A String.replace() with a replacement STRING
 *      reads "$1" in "$1,600" as the first capture group; apply_city_seo.cjs inserted its FAQ that way
 *      and 247 pages printed a closing tag where the price should be. Also caught: a line break and
 *      indent directly before ",600" (a whitespace group) and </main>, </body>, </head> appearing twice.
 *      The fix is always a function replacement: .replace(re, (m, g) => block + g).
 *
 * Reads published HTML everywhere except scripts/, data/ and vendored folders.
 * Usage: node scripts/check_price_shapes.cjs [--all]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALL = process.argv.includes('--all');
const SKIP = new Set(['node_modules', '.git', 'scripts', 'data', 'ui-ux-pro-max-skill', '.vercel', 'assets', 'images', 'styles']);

const num = (s) => parseFloat(s.replace(/,/g, ''));
const RANGE = /\$\s?([\d,]+(?:\.\d+)?)\s*(k|K)?\s*(?:to|-|–)\s*\$\s?([\d,]+(?:\.\d+)?)\s*(k|K)?/g;
// "(~$27)" is the same doubled gloss with a tilde, which this pattern missed until 2026-10-05 (37 on 24 pages).
const GLOSS = /\$[\d,.]+(?:\s*(?:-|to)\s*\$?[\d,.]+)?(?:\s*(?:\/|per |a )(?:mo|month|day|night|meal|week|year)\b)?\s*\(~?\$[\d,.]+(?:\s*(?:-|to)\s*\$?[\d,.]+)?\)/g;
const TAG_THEN_DIGITS = /<\/?[a-zA-Z][^<>]{0,200}>[,.]\d{2}/g;
const WS_THEN_DIGITS = /\n[ \t]*,\d{3}\b/g;

const found = { inverted: [], gloss: [], eaten: [] };
const ctx = (s, i, len) => s.slice(Math.max(0, i - 50), i + len + 25).replace(/\s+/g, ' ');

function scan(rel, s) {
  let m;
  while ((m = RANGE.exec(s))) {
    const a = num(m[1]) * (m[2] ? 1000 : 1), b = num(m[3]) * (m[4] ? 1000 : 1);
    // "from $200 to $65" describes a change, not a range
    const before = s.slice(Math.max(0, m.index - 6), m.index).toLowerCase();
    if (a > b * 1.05 && !/from\s*$/.test(before)) found.inverted.push(rel + ': ' + ctx(s, m.index, m[0].length));
  }
  // "$1-1": a converted range whose ends rounded to the same dollar, so it says nothing (Gdansk, 2026-10-05).
  // RANGE above needs a "$" on both ends and so never saw it.
  const DEGEN = /\$\s?(\d[\d,]*(?:\.\d+)?)\s*(?:-|–|to)\s*\$?\s?(\d[\d,]*(?:\.\d+)?)(?![\d.,]*\d)/g;
  while ((m = DEGEN.exec(s))) if (m[1] === m[2]) found.inverted.push(rel + ': (same both ends) ' + ctx(s, m.index, m[0].length));
  while ((m = GLOSS.exec(s))) found.gloss.push(rel + ': ' + ctx(s, m.index, m[0].length));
  while ((m = TAG_THEN_DIGITS.exec(s))) {
    // a real tag followed by ".50" can be legitimate only inside scripts/styles, which are not prose
    found.eaten.push(rel + ': ' + ctx(s, m.index, m[0].length));
  }
  while ((m = WS_THEN_DIGITS.exec(s))) found.eaten.push(rel + ': ' + ctx(s, m.index, m[0].length));
  for (const t of ['</main>', '</body>', '</head>']) {
    const n = s.split(t).length - 1;
    if (n > 1) found.eaten.push(rel + ': ' + t + ' appears ' + n + ' times');
  }
}

function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || (!rel && SKIP.has(e.name))) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(p, r);
    else if (e.name.endsWith('.html')) scan(r, fs.readFileSync(p, 'utf8'));
  }
}
walk(ROOT, '');

const total = found.inverted.length + found.gloss.length + found.eaten.length;
console.log('PRICE SHAPES GATE  (inverted ranges, doubled dollar glosses, "$1" read as a capture group)');
for (const [k, label] of [['inverted', 'INVERTED RANGE'], ['gloss', 'DOUBLED GLOSS'], ['eaten', 'EATEN "$1"']]) {
  if (!found[k].length) continue;
  console.log('\n  ' + label + ' (' + found[k].length + '):');
  for (const line of (ALL ? found[k] : found[k].slice(0, 15))) console.log('    ' + line);
  if (!ALL && found[k].length > 15) console.log('    ... and ' + (found[k].length - 15) + ' more (--all)');
}
console.log(total ? '\n  FAIL: ' + total + ' mangled prices.' : '\n  clean: no mangled prices on any published page.');
process.exit(total ? 1 : 0);
