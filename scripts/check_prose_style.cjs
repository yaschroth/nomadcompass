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

// The first version of this checked symbols and currency NAMES and stopped there, so it reported the
// site clean while 1,089 amounts on 276 city pages were written "800-1,200 EUR" and "80,000 THB".
// A rule enforced in two of the three notations a price can be written in is not enforced.
// Taken from the converter rather than copied, because a second hand-maintained list is how the
// gate and the sweep end up disagreeing about what counts as a currency. UYU was missing from one
// of them for exactly that reason.
const ISO = require(path.join(__dirname, 'lib', 'to_usd.cjs')).CODES.join('|');
const NAMES = 'RMB|yuan|reais|rupees|rupiah|dong|pesos|yen|won|dinars|dirhams|tugrik|som|baht|taka'
  + '|shillings|kyat|zloty|forint|koruna|lira|rand|ringgit|kwanza|CFA francs?|euros?|pounds sterling';
const NUM = '\\d[\\d,.]*(?:\\s?(?:-|–|to)\\s?\\d[\\d,.]*)?';

// A symbol against a digit, a number against a currency name, or a number either side of an ISO
// code. "$" and a bare "USD" are the allowed ways to write money.
const CCY = new RegExp(
  '[£€¥₹฿₩₽₤]\\s?\\d'
  + '|\\b' + NUM + '\\s(?:million\\s)?(?:' + NAMES + ')\\b'
  + '|\\b' + NUM + '\\s?(?:' + ISO + ')\\b'
  + '|\\b(?:' + ISO + ')\\s?' + NUM,
  'g');

const notesOf = (html) => {
  const i = html.lastIndexOf('{"climate"');
  if (i < 0) return null;
  const j = html.indexOf('};', i);
  if (j < 0) return null;
  try { return JSON.parse(html.slice(i, j + 1)); } catch (e) { return null; }
};

// A currency symbol written as an HTML entity is invisible to a regex looking for the character.
// Six live pages quoted the Portuguese and Spanish visa floors as "&euro;3,680 per month" and the
// gate called the site clean: "euro" only matches when the NAME follows the number, and the symbol
// class never sees a "€" because there is not one in the file. Decode first, then match.
const ENTITY = {
  '&euro;': '€', '&pound;': '£', '&yen;': '¥', '&cent;': '¢',
  '&#8364;': '€', '&#163;': '£', '&#165;': '¥', '&#x20AC;': '€',
};
const decodeCcy = (t) => t.replace(/&(?:euro|pound|yen|cent|#8364|#163|#165|#x20AC);/gi,
  (m) => ENTITY[m.toLowerCase()] || ENTITY[m] || m);

// Matches come from the decoded text, so the haystack has to be decoded too or indexOf misses and
// every report quotes the first 32 characters of the paragraph instead of the price.
const around = (s, m) => {
  const d = decodeCcy(s);
  const i = d.indexOf(m);
  return d.slice(Math.max(0, i - 32), i + m.length + 24).replace(/\s+/g, ' ').trim();
};

// "appears on the 20 yuan note" is not a price, it is a description of the banknote itself.
const isBanknote = (s, m) => new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  + '\\s(?:note|banknote|bill|coin)\\b').test(s);

// Neither is "the manat is pegged to the dollar at roughly 1.70 AZN per $1". That is a fact about a
// rate, and it is the one place a local currency legitimately appears. The same definition decides
// what scripts/sweep_city_currency.cjs leaves alone, so the gate cannot demand a rewrite that the
// sweep is deliberately declining to make.
const { RATE_TALK, mapTextNodes } = require(path.join(__dirname, 'lib', 'to_usd.cjs'));
const rateSentences = (s) => s.split(/(?<=[.!?])\s+/).filter((x) => RATE_TALK.test(x));


const prices = (s) => {
  const t = decodeCcy(s);
  const exempt = rateSentences(t);
  return (t.match(CCY) || [])
    .filter((m) => !isBanknote(t, m))
    .filter((m) => !exempt.some((x) => x.includes(m)));
};

const errors = [];
const warnings = [];
const bodyIssues = [];

// --- 1. What the city pages actually render.
const cityDir = path.join(ROOT, 'cities');
const pages = fs.readdirSync(cityDir).filter((f) => f.endsWith('.html'));
let noObject = 0;
for (const f of pages) {
  const html = fs.readFileSync(path.join(cityDir, f), 'utf8');
  const id = f.replace('.html', '');
  for (const m of html.match(EM) || []) errors.push('cities/' + f + ': em-dash  ' + around(html, m));
  const n = notesOf(html);
  if (n) {
    for (const k of KEYS) {
      const v = String(n[k] || '');
      for (const m of prices(v)) errors.push(id + '.' + k + ': not USD  "' + around(v, m) + '"');
    }
  } else {
    noObject += 1;
  }

  // The guide sections, venue blurbs and restaurant cards. Checking only the tiles is how 4,952
  // local-currency prices in the page body sat under a gate that printed "clean": the rule was
  // enforced in the two places this script happened to read.
  mapTextNodes(html, (text) => {
    if (!/\d/.test(text)) return text;
    for (const m of prices(text)) {
      bodyIssues.push(id + ': not USD in page body  "' + around(text, m) + '"');
    }
    return text;
  });
}

// --- 1b. Every other page. /nomad-visas.html is not a city page and not the data file, so nothing
// was reading it, and its Croatia row described the threshold as "About EUR 2,540 a month". Same
// for 657 accommodation pages and six blog guides. A rule checked on one directory is not enforced.
const SKIP_TOP = new Set(['cities', 'node_modules', 'scripts', 'data', 'assets', 'images', 'styles',
  'ui-ux-pro-max-skill']);
const walkHtml = (dir, rel) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if (!rel && SKIP_TOP.has(e.name)) continue;
      walkHtml(p, r);
      continue;
    }
    if (!e.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    for (const m of html.match(EM) || []) errors.push(r + ': em-dash  ' + around(html, m));
    mapTextNodes(html, (text) => {
      if (!/\d/.test(text)) return text;
      for (const m of prices(text)) bodyIssues.push(r + ': not USD  "' + around(text, m) + '"');
      return text;
    });
  }
};
walkHtml(ROOT, '');

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

const all = errors.concat(bodyIssues);
if (all.length) {
  console.log('  ERRORS (' + all.length + (bodyIssues.length ? ', ' + bodyIssues.length + ' in page bodies' : '') + '):');
  all.slice(0, 40).forEach((e) => console.log('    ' + e));
  if (all.length > 40) console.log('    ... and ' + (all.length - 40) + ' more');
  process.exit(1);
}

console.log('  clean: nothing a reader can see breaks either rule.');
