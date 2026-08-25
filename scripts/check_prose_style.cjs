/**
 * Gate: two standing style rules, checked where they can actually be broken.
 *
 *   1. No em-dashes anywhere.
 *   2. Every price is in USD. Not a local amount with a dollar gloss beside it, and not a local
 *      amount at all, just the dollar figure.
 *
 * Both had drifted back in without anything noticing. scripts/strip_emdashes.cjs sweeps the HTML
 * but not data/, so 495 em-dashes had accumulated in data/category-descriptions.json, which
 * generate_city_pages.js reads and writes the score tiles FROM. Six live pages were quoting rents
 * and the Japanese nomad-visa income threshold in yen, four of them with a parenthesised dollar
 * gloss, and the three glosses disagreed with each other about the exchange rate.
 *
 * An entry in the data file for a city with no page and no cities-data.js record cannot reach a
 * reader, so it is reported as a warning rather than an error. It still has to be fixed before
 * that city ships.
 *
 * Usage: node scripts/check_prose_style.cjs
 * Exit 1 if anything a reader can see breaks either rule.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];

const EM = /—|&mdash;|&#8212;/g;
// A symbol against a digit, or a number against a currency name. "$" is the one that is allowed.
const CCY = new RegExp(
  '[£€¥₹฿₩₽₤]\\s?\\d'
  + '|\\b\\d[\\d,.]*(?:\\s?-\\s?\\d[\\d,.]*)?\\s(?:million\\s)?'
  + '(?:RMB|yuan|reais|rupees|rupiah|dong|pesos|yen|won|dinars|dirhams|tugrik|som|baht|taka'
  + '|shillings|kyat|zloty|forint|koruna|lira|rand|ringgit|kwanza|CFA francs?|euros?|pounds sterling)\\b',
  'g');

const notesOf = (html) => {
  const i = html.lastIndexOf('{"climate"');
  if (i < 0) return null;
  const j = html.indexOf('};', i);
  if (j < 0) return null;
  try { return JSON.parse(html.slice(i, j + 1)); } catch (e) { return null; }
};

const around = (s, m) => {
  const i = s.indexOf(m);
  return s.slice(Math.max(0, i - 32), i + m.length + 24).replace(/\s+/g, ' ').trim();
};

// "appears on the 20 yuan note" is not a price, it is a description of the banknote itself.
const isBanknote = (s, m) => new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  + '\\s(?:note|banknote|bill|coin)\\b').test(s);
const prices = (s) => (s.match(CCY) || []).filter((m) => !isBanknote(s, m));

const errors = [];
const warnings = [];

// --- 1. What the city pages actually render.
const cityDir = path.join(ROOT, 'cities');
const pages = fs.readdirSync(cityDir).filter((f) => f.endsWith('.html'));
let noObject = 0;
for (const f of pages) {
  const html = fs.readFileSync(path.join(cityDir, f), 'utf8');
  const id = f.replace('.html', '');
  for (const m of html.match(EM) || []) errors.push('cities/' + f + ': em-dash  ' + around(html, m));
  const n = notesOf(html);
  if (!n) { noObject += 1; continue; }
  for (const k of KEYS) {
    const v = String(n[k] || '');
    for (const m of prices(v)) errors.push(id + '.' + k + ': not USD  "' + around(v, m) + '"');
  }
}

// --- 2. The file the generator writes those tiles from.
const DATA = path.join(ROOT, 'data', 'category-descriptions.json');
if (fs.existsSync(DATA)) {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const hasPage = (id) => fs.existsSync(path.join(cityDir, id + '.html'));
  const dataset = fs.existsSync(path.join(ROOT, 'cities-data.js'))
    ? fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') : '';
  for (const [id, o] of Object.entries(data)) {
    const reachable = hasPage(id) || new RegExp('["\']' + id + '["\']').test(dataset);
    const bucket = reachable ? errors : warnings;
    for (const [k, raw] of Object.entries(o)) {
      const v = String(raw || '');
      for (const m of v.match(EM) || []) bucket.push('data ' + id + '.' + k + ': em-dash  "' + around(v, m) + '"');
      for (const m of prices(v)) bucket.push('data ' + id + '.' + k + ': not USD  "' + around(v, m) + '"');
    }
  }
}

console.log('PROSE STYLE GATE  (no em-dashes, every price in USD)');
console.log('  ' + pages.length + ' city pages' + (noObject ? ', ' + noObject + ' without a score object' : '') + '\n');

if (warnings.length) {
  console.log('  warnings (' + warnings.length + ') in entries no reader can reach, fix before those cities ship:');
  warnings.slice(0, 12).forEach((w) => console.log('    ' + w));
  if (warnings.length > 12) console.log('    ... and ' + (warnings.length - 12) + ' more');
  console.log('');
}

if (errors.length) {
  console.log('  ERRORS (' + errors.length + '):');
  errors.slice(0, 40).forEach((e) => console.log('    ' + e));
  if (errors.length > 40) console.log('    ... and ' + (errors.length - 40) + ' more');
  process.exit(1);
}

console.log('  clean: nothing a reader can see breaks either rule.');
