/**
 * Gate: the prose on a ranking page against the ranking underneath it.
 *
 * Two things drift, and both did. rank_best.cjs recomputes the top fifteen from current city data;
 * the intro, FAQ, considerations and closing around it are hand-written and never regenerate. When
 * the Numbeo pipeline reset costPerMonth, the figures went stale and the membership moved out from
 * under the sentences at the same time: the cheapest-cities FAQ was answering about Ninh Binh and
 * Yazd on a page that now lists Jodhpur and Mysore.
 *
 *   1. A monthly figure written with no currency mark at all ("at 3,400 a month"). 188 of these
 *      were live, which is also a breach of the site's USD rule.
 *   2. A city named in the prose that the ranking no longer contains.
 *
 * (2) is a WARNING, not an error: a blurb may legitimately compare against a city that is not on
 * the list ("cheaper than Lisbon"). (1) is an error.
 *
 * Word boundaries matter for (2): a substring match claimed "Lima" appears on all 32 pages, because
 * "climate" contains it. Same for Solo, Split, York, Pula and Berat.
 *
 * Usage: node scripts/check_best_prose.cjs
 * Exit 1 if any figure is missing its currency.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

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
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NAMES = CITIES.map((c) => ({ n: norm(c.name), id: c.id })).filter((x) => x.n.length > 3);
const RE = new Map(NAMES.map((x) => [x.id, new RegExp('(?<![A-Za-z])' + esc(x.n) + '(?![A-Za-z])')]));

// "USD 1,400 per month" names its currency; "$1,400" does; "1,400 a month" does not.
const BARE = /(?<!USD )(?<![$€£¥\d,.\-–\w])(\d{1,3}(?:,\d{3})+|\d{3,6})\s(?:a|per)\smonth/g;

let pages = 0, ghosts = 0;
const per = [];
const bare = [];
for (const f of fs.readdirSync(ROOT).filter((x) => /^content-.*\.json$/.test(x) && !/activity/.test(x))) {
  const key = f.replace(/^content-|\.json$/g, '');
  if (!fs.existsSync(path.join(ROOT, 'best-' + key + '.json'))) continue;
  pages++;
  const onPage = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'best-' + key + '.json'), 'utf8')).cities.map((c) => c.id));
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^\ufeff/, ''));
  let text = '';
  for (const k of Object.keys(json)) {
    if (k === 'entries' || k === 'quickPicks') continue;
    const walk = (v) => {
      if (typeof v === 'string') text += ' ' + v;
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(json[k]);
  }
  let m;
  BARE.lastIndex = 0;
  while ((m = BARE.exec(text))) {
    bare.push(key + ': "' + text.slice(Math.max(0, m.index - 55), m.index + m[0].length + 12).replace(/\s+/g, ' ').trim() + '"');
  }

  const t = norm(text);
  const named = NAMES.filter((x) => RE.get(x.id).test(t));
  const off = named.filter((x) => !onPage.has(x.id));
  if (off.length) { ghosts += off.length; per.push(key + ': ' + off.length + ' of ' + named.length + '  (' + off.map((x) => x.n).join(', ') + ')'); }
}
console.log('BEST-PAGE PROSE GATE  (every figure carries a currency; the prose knows its own list)\n');
console.log('  ' + pages + ' ranking pages checked\n');

if (ghosts) {
  console.log('  warnings: ' + ghosts + ' mentions of cities the ranking no longer contains.');
  console.log('  Some are deliberate comparisons to a city that is not on the list; some are prose');
  console.log('  left behind when rank_best recomputed the fifteen. Read them, do not sweep them.');
  per.sort().forEach((x) => console.log('    ' + x));
  console.log('');
}

if (bare.length) {
  console.log('  ERRORS (' + bare.length + '): a monthly figure with no currency mark');
  bare.slice(0, 30).forEach((x) => console.log('    ' + x));
  if (bare.length > 30) console.log('    ... and ' + (bare.length - 30) + ' more');
  process.exit(1);
}
console.log('  clean: every monthly figure in the ranking prose names its currency.');
