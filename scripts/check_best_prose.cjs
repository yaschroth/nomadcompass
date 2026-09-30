/**
 * Gate: the prose on a ranking page against the ranking underneath it.
 *
 * Two things drift, and both did. rank_best.cjs recomputes the top fifteen from current city data;
 * the intro, FAQ, considerations and closing around it are hand-written and never regenerate. When
 * the Numbeo pipeline reset costPerMonth, the figures went stale and the membership moved out from
 * under the sentences at the same time: the cheapest-cities FAQ was answering about Ninh Binh and
 * Yazd on a page that now lists Jodhpur and Mysore.
 *
 *   1. A price written with no "$". 188 of these were live, which is also a breach of the site's
 *      USD rule. The first version of this gate only knew one spelling, "3,400 a month", and
 *      called the pages clean while about 150 more were written the other ways a sentence can
 *      carry a price: "roughly 3,800 dollars a month", "2,000 USD a month", "a 2,400-a-month
 *      budget", "a 5,100 monthly figure", "Barcelona (3,800)", "Wellington at 3,200", "from
 *      $1,500 to 4,000 in Ibiza", and in words, "roughly five thousand a month". Nearly all of them were also stale (Barcelona 3,800 beside a
 *      $2,440 card, Tokyo 4,000 beside $1,920), because a figure with no "$" was invisible to
 *      fix_best_blurb_costs.cjs as well. Every one of those spellings is an error here.
 *   2. A "$" figure pinned to a city on the page ("Kuching ($1,300)", "Tulum at $2,800") that is
 *      not the price that city's own card prints.
 *   3. A city named in the prose that the ranking no longer contains.
 *
 * (1) and (2) are checked twice: in content-<key>.json, which is where the prose is written, and in
 * the published best/<slug>.html, which is what a reader sees and what the other sweeps have been
 * through. The published page's card is the price the prose has to agree with.
 *
 * (3) is a WARNING, not an error: a blurb may legitimately compare against a city that is not on
 * the list ("cheaper than Lisbon"). Word boundaries matter for it: a substring match claimed "Lima"
 * appears on all 32 pages, because "climate" contains it. Same for Solo, Split, York, Pula, Berat.
 *
 * Numbers that are not money are left alone by construction: a bare-figure rule fires only when
 * the number is tied to money by a unit ("dollars", "USD", "a month", "/mo", "monthly") or to a
 * city by position ("Barcelona (3,800)", "Split at 2,300"), and the city-position rules skip a
 * number followed by a unit of something else (Mbps, %, C, km, metres, days, a hyphen as in
 * "365-day"). Years, scores ("Barcelona (9.1)"), temperatures and speeds therefore never match.
 *
 * Usage: node scripts/check_best_prose.cjs
 *        node scripts/check_best_prose.cjs --page <copy.html> --key <key>   (test one page file)
 * Exit 1 on any error.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const PAGE_OVERRIDE = arg('--page');
const KEY_ONLY = arg('--key');

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
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NAMES = CITIES.map((c) => ({ n: norm(c.name), id: c.id })).filter((x) => x.n.length > 3);
const RE = new Map(NAMES.map((x) => [x.id, new RegExp('(?<![A-Za-z])' + esc(x.n) + '(?![A-Za-z])')]));
// Every city name, longest first so "San Miguel de Allende" wins over "Allende".
const CITY_ALT = [...new Set(CITIES.map((c) => norm(c.name)).filter((n) => n.length > 2))]
  .sort((a, b) => b.length - a.length).map(esc).join('|');

// --- (1) bare figures -----------------------------------------------------------------------
const N = '(\\d{1,3}(?:,\\d{3})+|\\d{2,6})';
// Not already money: no "$" or other symbol, no "USD ", and not the tail of a longer number.
const NOT_MONEY_YET = '(?<!USD )(?<!US\\$)(?<![$€£¥\\d,.\\-–\\w])';
// After a number tied to a city by position, these mean it counts something other than money.
const OTHER_UNIT = '(?![\\d,]*\\d)(?!\\.\\d)(?!\\s?(?:%|°|-|–|/10|C\\b|F\\b|[Mm]bps|km|m\\b|metres|meters|ft|feet|mm|people|residents|inhabitants|years?|hours?|days?|nights?|weeks?|months|miles|steps|islands|temples|beaches|rooms|cities|guides|square|sq\\b|kilomet|out of|points?|metre|meter|elevation))';
const BARE_FORMS = [
  // "3,800 dollars", "1,200 US dollars", "a 3,500 dollar monthly cost"
  ['dollars', new RegExp(NOT_MONEY_YET + N + '\\s?(?:US\\s)?dollars?\\b', 'g')],
  // "2,000 USD"
  ['USD after', new RegExp(NOT_MONEY_YET + N + '\\s?USD\\b', 'g')],
  // "3,400 a month", "2,400-a-month", "900 per month"
  ['a month', new RegExp(NOT_MONEY_YET + '(\\d{1,3}(?:,\\d{3})+|\\d{3,6})[\\s-](?:a|per)[\\s-]month', 'g')],
  // "1,400/mo", "1,400 / month"
  ['/mo', new RegExp(NOT_MONEY_YET + '(\\d{1,3}(?:,\\d{3})+|\\d{3,6})\\s?/\\s?mo(?:nth)?\\b', 'g')],
  // "a 5,100 monthly figure", "4,500 monthly"
  ['monthly', new RegExp(NOT_MONEY_YET + '(\\d{1,3}(?:,\\d{3})+|\\d{3,6})\\s(?:monthly|a year|per year)\\b', 'g')],
  // "Barcelona (3,800)"
  ['City (N)', new RegExp('(?<![A-Za-z])(?:' + CITY_ALT + ')\\s\\((\\d{1,3}(?:,\\d{3})+|\\d{3,6})' + OTHER_UNIT + '\\)', 'g')],
  // "Wellington at 3,200", "Split at 2,300", "Tulum at 2,800"
  ['City at N', new RegExp('(?<![A-Za-z])(?:' + CITY_ALT + ')(?:\'s)?,?\\s(?:at|near|for|costs?|runs?)\\s(?:(?:roughly|about|around|just|only|under|over|near)\\s)?(\\d{1,3}(?:,\\d{3})+|\\d{3,6})' + OTHER_UNIT, 'g')],
  // "... to 4,000 in Ibiza"
  ['N in City', new RegExp(NOT_MONEY_YET + '(\\d{1,3}(?:,\\d{3})+|\\d{3,6})' + OTHER_UNIT + '\\s(?:in|for)\\s(?:' + CITY_ALT + ')(?![A-Za-z])', 'g')],
  // "around four thousand a month", "fifteen hundred a month", "a couple of hundred dollars": the
  // nature page carried five of these and no digit-based rule could see one.
  ['in words', new RegExp('(?<![A-Za-z])((?:(?:a\\s)?(?:couple|few)\\sof\\s|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)[\\s-])(?:(?:hundred|thousand|and|one|two|three|four|five|six|seven|eight|nine|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\\s-])*(?:hundred|thousand))(?:\\s(?:US\\s)?dollars?\\b|[\\s-](?:a|per)[\\s-]month|\\s(?:monthly|a year|per year)\\b)', 'gi')],
  // "$1,000 to 2,000", "$830 and 860": the second half of a money range
  ['range tail', new RegExp('\\$[\\d,]+\\s?(?:to|-|–|and|or)\\s?' + NOT_MONEY_YET + '(\\d{1,3}(?:,\\d{3})+|\\d{3,6})' + OTHER_UNIT, 'g')],
];
// The same span can match two forms; report it once.
const bareFigures = (text) => {
  const t = norm(text);
  const hits = [];
  const seen = new Set();
  for (const [form, re] of BARE_FORMS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const numAt = m.index + m[0].indexOf(m[1]);
      if (seen.has(numAt)) continue;
      seen.add(numAt);
      hits.push({ form, at: numAt, ctx: t.slice(Math.max(0, m.index - 55), m.index + m[0].length + 15).replace(/\s+/g, ' ').trim() });
    }
  }
  return hits;
};

// --- (2) "$" figures pinned to a card city ----------------------------------------------------
const pinnedFigures = (text, cards) => {
  const t = norm(text);
  const out = [];
  for (const c of cards) {
    // "cheaper than Sydney at $2,740" is the subject's price, not Sydney's; "Iloilo and Yogyakarta
    // cost $550 and $490" pairs two lists, so the first figure is not Yogyakarta's.
    // "Tokyo ($4,000)" is unambiguous wherever it stands.
    const name = '(?<![A-Za-z])' + esc(c.name) + '(?![A-Za-z])';
    const re = new RegExp('(?:(?<!than )' + name + '\\s\\(|(?<!than |and |or )' + name + ',?\\s(?:at|costs?|runs?)\\s(?:(?:roughly|about|around|just)\\s)?)\\$(\\d{1,3}(?:,\\d{3})+|\\d{2,6})(?![\\d,]*\\d)(?!\\s?(?:to|-|–|and|or|,)\\s?\\$)', 'g');
    let m;
    while ((m = re.exec(t))) {
      const said = Number(m[1].replace(/,/g, ''));
      if (said !== c.cost) out.push({ city: c.name, said, card: c.cost, ctx: t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 25).replace(/\s+/g, ' ').trim() });
    }
  }
  return out;
};

// --- the published page -----------------------------------------------------------------------
const decode = (s) => String(s)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&rarr;|&darr;/g, ' ')
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));
const cardsOf = (html) => {
  const cards = [];
  const re = /<h2 class="best-name"><a href="\/cities\/([^"]+)">([^<]+)<\/a>[\s\S]*?<div class="best-stats">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const p = m[3].match(/\$([\d,]+)\/mo/);
    cards.push({ id: m[1], name: norm(decode(m[2]).trim()), cost: p ? Number(p[1].replace(/,/g, '')) : null });
  }
  return cards;
};
// Every block of prose the page renders, labelled, plus the FAQ as the JSON-LD states it.
const proseOf = (html) => {
  const out = [];
  const grab = (label, re) => { let m; while ((m = re.exec(html))) out.push([label, decode(m[1])]); };
  grab('hero', /<p class="sub">([\s\S]*?)<\/p>/g);
  grab('intro', /<section class="best-intro">([\s\S]*?)<p class="best-method">/g);
  grab('pick', /<p class="best-pick-note">([\s\S]*?)<\/p>/g);
  grab('weigh', /<section class="best-weigh">([\s\S]*?)<\/section>/g);
  grab('blurb', /<p class="best-blurb">([\s\S]*?)<\/p>/g);
  grab('closing', /<section class="best-closing">([\s\S]*?)<\/section>/g);
  grab('faq', /<section class="best-faq">([\s\S]*?)<\/section>/g);
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ld.exec(html))) {
    if (!/"FAQPage"/.test(m[1])) continue;
    try {
      const j = JSON.parse(m[1]);
      (j.mainEntity || []).forEach((q) => out.push(['faq json-ld', q.name + ' ' + (q.acceptedAnswer && q.acceptedAnswer.text)]));
    } catch (e) { out.push(['faq json-ld', 'UNPARSEABLE']); }
  }
  return out;
};

let pages = 0, ghosts = 0;
const per = [];
const errors = [];
const keys = fs.readdirSync(ROOT).filter((x) => /^content-.*\.json$/.test(x) && !/activity/.test(x))
  .map((f) => f.replace(/^content-|\.json$/g, ''))
  .filter((k) => fs.existsSync(path.join(ROOT, 'best-' + k + '.json')))
  .filter((k) => !KEY_ONLY || k === KEY_ONLY);
if (PAGE_OVERRIDE && !KEY_ONLY) { console.error('--page needs --key <key>'); process.exit(2); }

for (const key of keys) {
  pages++;
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'best-' + key + '.json'), 'utf8'));
  const onPage = new Set(data.cities.map((c) => c.id));
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'content-' + key + '.json'), 'utf8').replace(/^﻿/, ''));

  // The source. Blurbs and picks for a city the ranking no longer holds never render, so only the
  // rendered ones are held to the rule; the rest are checked again the day that city returns.
  const strs = [];
  const walk = (v, where) => {
    if (typeof v === 'string') strs.push([where, v]);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, where));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, where));
  };
  for (const k of Object.keys(json)) {
    if (k === 'entries' || k === 'quickPicks') {
      (json[k] || []).filter((e) => onPage.has(e.id)).forEach((e) => walk(e.blurb || e.note || '', k + ' ' + e.id));
    } else walk(json[k], k);
  }
  for (const [where, s] of strs) {
    for (const h of bareFigures(s)) errors.push(key + '  content-' + key + '.json ' + where + '  [' + h.form + ']  "' + h.ctx + '"');
  }

  // The page.
  const pagePath = PAGE_OVERRIDE || path.join(ROOT, 'best', data.slug + '.html');
  const rel = path.relative(ROOT, pagePath).replace(/\\/g, '/');
  if (fs.existsSync(pagePath)) {
    const html = fs.readFileSync(pagePath, 'utf8');
    const cards = cardsOf(html).filter((c) => c.cost != null);
    for (const [where, s] of proseOf(html)) {
      for (const h of bareFigures(s)) errors.push(key + '  ' + rel + ' ' + where + '  [' + h.form + ']  "' + h.ctx + '"');
      for (const p of pinnedFigures(s, cards)) errors.push(key + '  ' + rel + ' ' + where + '  [card says $' + p.card.toLocaleString('en-US') + ']  "' + p.ctx + '"');
    }
  } else errors.push(key + '  ' + rel + ' is missing');

  // Ghosts, from the prose that renders.
  const t = norm(strs.map((x) => x[1]).join(' '));
  const named = NAMES.filter((x) => RE.get(x.id).test(t));
  const off = named.filter((x) => !onPage.has(x.id));
  if (off.length) { ghosts += off.length; per.push(key + ': ' + off.length + ' of ' + named.length + '  (' + off.map((x) => x.n).join(', ') + ')'); }
}
console.log('BEST-PAGE PROSE GATE  (every price carries a "$" and agrees with its card; the prose knows its own list)\n');
console.log('  ' + pages + ' ranking page' + (pages === 1 ? '' : 's') + ' checked' + (PAGE_OVERRIDE ? '  (page file: ' + PAGE_OVERRIDE + ')' : '') + '\n');

if (ghosts) {
  console.log('  warnings: ' + ghosts + ' mentions of cities the ranking no longer contains.');
  console.log('  Some are deliberate comparisons to a city that is not on the list; some are prose');
  console.log('  left behind when rank_best recomputed the fifteen. Read them, do not sweep them.');
  per.sort().forEach((x) => console.log('    ' + x));
  console.log('');
}

if (errors.length) {
  console.log('  ERRORS (' + errors.length + '): a price with no "$", or a "$" price that is not the one its city\'s card prints');
  const show = process.argv.includes('--all') ? errors : errors.slice(0, 40);
  show.forEach((x) => console.log('    ' + x));
  if (errors.length > show.length) console.log('    ... and ' + (errors.length - show.length) + ' more (--all lists them)');
  process.exit(1);
}
console.log('  clean: every price in the ranking prose has its "$", and every one pinned to a city matches that city\'s card.');
