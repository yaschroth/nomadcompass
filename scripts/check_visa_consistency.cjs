/**
 * Reports where the site contradicts itself about a national digital nomad visa.
 *
 * A nomad visa is a national rule, so every city page in that country should state the same income
 * floor, and it should match /nomad-visas. Neither holds. Twenty Spanish city pages carry fourteen
 * different figures for one scheme, from EUR 2,160 to EUR 2,850, because each note was written at a
 * different time and most thresholds are pegged to a minimum wage that rises every year.
 *
 * This is a REPORT, not a fix, and it does not fail a build. Correcting a threshold means finding
 * the current primary source per country, and the site rule is that we cite a primary source or
 * triangulate two, or we do not state the number. Rewriting 36 pages to agree with each other would
 * make the site consistent and not necessarily correct.
 *
 * It also checks the other direction. In several countries the CITY PAGES look newer than the tool:
 * Mexico, Romania, Croatia and Colombia all index their thresholds to local wages that have risen,
 * and /nomad-visas has not moved. Do not "fix" a city page by copying the tool without checking
 * which one is stale.
 *
 * What it deliberately does not flag: a page quoting a savings or bank-balance threshold as well as
 * a monthly income one. Several schemes test both, and those are different numbers on purpose. The
 * first version of this script missed that and reported San Miguel de Allende as requiring $50,000
 * a month, which is its savings alternative sitting one clause away from the word "monthly".
 *
 * Usage: node scripts/check_visa_consistency.cjs [--all]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EUR_USD = 1.09;
const GBP_USD = 1.27;
const TOLERANCE = 0.12;   // below this it is rounding and exchange-rate drift, not a contradiction

const visaHtml = fs.readFileSync(path.join(ROOT, 'nomad-visas.html'), 'utf8');
const authority = new Map();
for (const m of visaHtml.matchAll(/'([^']{2,40})','([a-z]{2})','([^']{3,60})',(\d+),'([^']*)','([a-z-]+)','([^']*)'/g)) {
  authority.set(m[1], { usd: Number(m[4]), scheme: m[3] });
}

const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const start = src.indexOf('const CITIES = [');
const body = src.slice(start + 'const CITIES = '.length);
let depth = 0, end = -1;
for (let i = 0; i < body.length; i++) {
  if (body[i] === '[') depth++;
  else if (body[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITIES = eval(body.slice(0, end));
const byId = new Map(CITIES.map((c) => [c.id, c]));

const AMOUNT = /(?:(EUR|USD|GBP|\$|€|£)\s?([\d][\d,.]{2,})|([\d][\d,.]{2,})\s?(EUR|USD|GBP|euros?))/g;
const toUsd = (unit, v) => (unit === 'EUR' ? v * EUR_USD : unit === 'GBP' ? v * GBP_USD : v);

const perCountry = new Map();

for (const f of fs.readdirSync(path.join(ROOT, 'cities')).sort()) {
  if (!f.endsWith('.html')) continue;
  const c = byId.get(f.replace('.html', ''));
  if (!c) continue;
  const html = fs.readFileSync(path.join(ROOT, 'cities', f), 'utf8');
  const i = html.lastIndexOf('{"climate"');
  if (i < 0) continue;
  const j = html.indexOf('};', i);
  let notes;
  try { notes = JSON.parse(html.slice(i, j + 1)); } catch (e) { continue; }
  const visa = String(notes.visa || '');
  if (!visa) continue;

  AMOUNT.lastIndex = 0;
  let m;
  while ((m = AMOUNT.exec(visa)) !== null) {
    const around = visa.slice(Math.max(0, m.index - 80), m.index + m[0].length + 50);
    if (!/(income|earn|salary|threshold)/i.test(around)) continue;
    if (/(annual|per year|a year|\/year|yearly)/i.test(around)) continue;
    if (!/(per month|monthly|a month|\/month)/i.test(around)) continue;
    // "income around $3,000-4,000 monthly OR SAVINGS around $50,000-60,000" is two tests, and the
    // second one is not a monthly figure however close it sits to the word "monthly". Reading it as
    // one made San Miguel de Allende look like it demanded $50,000 a month.
    const before = visa.slice(Math.max(0, m.index - 45), m.index);
    if (/(savings|in the bank|bank balance|in savings|assets)[^.]{0,25}$/i.test(before)) continue;
    const unit = (m[1] || m[4] || '').toUpperCase().replace(/EUROS?/, 'EUR')
      .replace('€', 'EUR').replace('$', 'USD').replace('£', 'GBP');
    const value = Number((m[2] || m[3]).replace(/,/g, ''));
    if (!value || value < 300) continue;
    if (!perCountry.has(c.country)) perCountry.set(c.country, []);
    perCountry.get(c.country).push({ city: c.name, text: m[0], usd: toUsd(unit || 'USD', value) });
    break;   // one monthly income figure per page is enough to compare
  }
}

const disagree = [];
for (const [country, rows] of perCountry) {
  if (rows.length < 2) continue;
  const lo = Math.min(...rows.map((r) => r.usd));
  const hi = Math.max(...rows.map((r) => r.usd));
  if ((hi - lo) / lo <= TOLERANCE) continue;
  const a = authority.get(country);
  disagree.push({ country, rows, lo: Math.round(lo), hi: Math.round(hi), spread: Math.round(((hi - lo) / lo) * 100), tool: a ? a.usd : null });
}
disagree.sort((x, y) => y.spread - x.spread);

console.log('VISA CONSISTENCY REPORT  (one national rule should be one number)\n');
console.log(perCountry.size + ' countries state a monthly visa income figure on at least one city page');
console.log(disagree.length + ' of them disagree across their own city pages by more than ' + TOLERANCE * 100 + '%\n');

const show = process.argv.includes('--all') ? disagree : disagree.slice(0, 10);
for (const d of show) {
  const distinct = [...new Set(d.rows.map((r) => r.text))];
  console.log('  ' + d.country + '  ' + d.rows.length + ' pages, ' + distinct.length
    + ' distinct figures, spread ' + d.spread + '%'
    + (d.tool ? '   /nomad-visas says $' + d.tool : '   (not in /nomad-visas)'));
  console.log('     ' + distinct.slice(0, 8).join('  ') + (distinct.length > 8 ? '  ...' : ''));
}
if (!process.argv.includes('--all') && disagree.length > show.length) {
  console.log('\n  ... and ' + (disagree.length - show.length) + ' more countries (--all)');
}

console.log('\n  This does not fail the build. Fixing a threshold needs the current primary source');
console.log('  per country, and in several of these the CITY PAGES are newer than the tool.');
