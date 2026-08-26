require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * The last of the currency wording, after the two sweeps and fix_currency_preambles.cjs.
 *
 * What the sweeps could not do is anything without a numeral in it. "a single bus ticket is a euro
 * or two" and "These are our editorial estimates in rupees" both name a currency and neither has a
 * figure to convert, so arithmetic slides straight past them.
 *
 * Three passes:
 *
 *   1. editorial-estimate lines   "estimates in rupees" -> "estimates in US dollars". The rest of
 *                                 the sentence, including the provenance the source rule needs,
 *                                 is untouched.
 *   2. vague euro amounts         "a few euros" -> "a few dollars". Only for the euro, and only
 *                                 because it sits at $1.15: swapping the word keeps the sentence
 *                                 as true as it was. For a currency far from parity the same swap
 *                                 would be a lie, so those are individual rewrites below.
 *   3. everything else            written out one at a time, with the arithmetic shown.
 *
 * Deliberately left alone, listed at the bottom, because they are not prices: Vienna's "365-euro
 * ticket" is the name of a famous product, Zadar's "euro economy" is about the currency zone, Byron
 * Bay's "euro-inspired menu" is a cuisine, and Havana's "peso street pizza" already prices in USD.
 *
 * Usage: node scripts/fix_currency_wording.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const files = new Map();
const read = (id) => {
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!files.has(p)) files.set(p, fs.readFileSync(p, 'utf8'));
  return files.get(p);
};
const write = (id, s) => files.set(path.join(ROOT, 'cities', id + '.html'), s);

let n1 = 0;
let n2 = 0;
const missed = [];

// --- 1. "These are our editorial estimates in <currency>"
// Only "estimates in <currency>", the "These are our editorial estimates in rupees" line that
// repeats across the guides. Widening it to prices/figures/costs made it reach inside the sentences
// the one-off table below rewrites in full, and the two passes fought over the same words.
const ESTIMATES = /\b(estimates)\s+in\s+(?:euros|rupees|rupiah|pesos|soles|baht|dinars|dirhams|lei|leu|koruna|zloty|forints?|krone[rn]?|kuna|leva|shillings|ringgit|birr|cedis|tenge|denar|riel)\b/gi;

// --- 2. vague euro amounts, safe only because the euro is near parity with the dollar
const EUROISH = [
  [/\ba(\s+)few(\s+)euros\b/gi, 'a$1few$2dollars'],
  [/\ba(\s+)couple(\s+)of(\s+)euros\b/gi, 'a$1couple$2of$3dollars'],
  [/\bseveral(\s+)euros\b/gi, 'several$1dollars'],
  [/\ba(\s+)euro(\s+)or(\s+)two\b/gi, 'a$1dollar$2or$3two'],
  [/\bunder(\s+)a(\s+)euro\b/gi, 'under$1a$2dollar'],
  [/\ba(\s+)few(\s+)francs\b/gi, 'a$1few$2dollars'],    // the franc is $1.24, same argument
];

// --- 3. one at a time. The conversion behind each is in the comment.
const ONE_OFFS = [
  // ARS is 1,488 to the dollar: a few hundred pesos is about 20 cents.
  ['bariloche', 'A single ride costs a few hundred pesos and requires a SUBE card (rechargeable).',
    'A single ride costs well under a dollar and requires a SUBE card (rechargeable).'],
  // COP is 3,203 to the dollar: a few thousand pesos is about a dollar.
  ['cali', 'A rechargeable card costs a few thousand pesos and each trip is about $0.50.',
    'A rechargeable card costs about a dollar and each trip is about $0.50.'],
  ['jardin', 'tuk-tuks zip around town for a few thousand pesos',
    'tuk-tuks zip around town for about a dollar'],
  ['mompox', 'typically costing a few thousand pesos', 'typically costing about a dollar'],
  // UYU is 40 to the dollar: a few hundred pesos is about $7.50.
  ['montevideo', 'A rechargeable STM card costs a few hundred pesos to buy at kiosks',
    'A rechargeable STM card costs a few dollars to buy at kiosks'],
  // MXN is 17.3 to the dollar: a few thousand pesos a month is $175-290.
  ['sanmigueldeallende', 'or a few thousand pesos monthly for a dedicated plan',
    'or a couple of hundred dollars a month for a dedicated plan'],
  // PEN is 3.39 to the dollar: a few soles is about a dollar.
  ['chachapoyas', 'mototaxis handle short local hops for a few soles',
    'mototaxis handle short local hops for about a dollar'],
  ['puno', 'cover longer hops within town for a few soles',
    'cover longer hops within town for about a dollar'],
  ['tarapoto', 'for a few soles per person', 'for about a dollar per person'],
  // INR is 95.5 to the dollar: a few rupees is a few cents, which is true of chai and false of a
  // thali, so Hampi's loses the figure instead of restating one that was already wrong.
  ['gokarna', 'a bottle of water or chai is a few rupees', 'a bottle of water or chai is a few cents'],
  ['hampi', 'vegetarian thalis cost only a few rupees', 'vegetarian thalis cost very little'],
  // ETB is 161 to the dollar.
  ['gondar', 'run fixed routes across town for a few birr', 'run fixed routes across town for a few cents'],
  // MYR is 4.09 to the dollar: a few ringgit is about 70 cents.
  ['kuching', 'most trips across town cost a few ringgit', 'most trips across town cost under a dollar'],
  // MAD is 9.36 to the dollar: a few dirhams is about 30 cents, a few hundred about $32.
  ['ouarzazate', 'covering produce, bread, and spices for a few hundred dirhams a week',
    'covering produce, bread, and spices for about $30 a week'],
  ['ouarzazate', 'usually just a few dirhams for a hop across town',
    'usually well under a dollar for a hop across town'],
  ['tetouan', 'run fixed routes for a few dirhams per seat',
    'run fixed routes for well under a dollar per seat'],

  // preambles the earlier pass did not reach
  ['antigua', 'Here is a realistic monthly breakdown for 2025-2026, in Guatemalan Quetzales (Q) and US dollars (exchange rate: approximately $1 per USD).',
    'Here is a realistic monthly breakdown for 2025-2026, in US dollars.'],
  ['arequipa', 'Costs in Peruvian soles (S/) and US dollars (USD) as of 2025-2026:',
    'Costs in US dollars as of 2025-2026:'],
  ['bilbao', 'A realistic monthly budget in euros and approximate USD (at roughly $1 = $1.08):',
    'A realistic monthly budget in US dollars:'],
  ['capetown', 'A rough monthly budget in mid-2025 looks like this (rand figures with USD in brackets, at roughly $1 to the dollar).',
    'A rough monthly budget in mid-2025 looks like this, in US dollars.'],
  ['battambang', 'buying fresh produce, eggs, and staples in Khmer riel ($1 = ~$1)',
    'buying fresh produce, eggs, and staples at local markets'],
  ['dubrovnik', 'Croatia adopted the euro in 2023, so everything below is in euros with rough US dollar equivalents (about $1.08 per euro in 2025 and 2026).',
    'Croatia adopted the euro in 2023, and everything below is in US dollars, converted from euro prices.'],
  ['ericeira', 'Expect prices in euros, with approximate US dollar figures shown at roughly $1 to 1.08.',
    'Local prices are set in euros; the figures below are in US dollars.'],
  ['hiroshima', 'Prices below are approximate 2025-2026 figures, and the USD equivalents assume roughly 150 yen to the dollar, so they shift with the exchange rate.',
    'Prices below are approximate 2025-2026 figures in US dollars, converted from yen prices, so they shift with the exchange rate.'],
  ['johorbahru', 'Here is a realistic monthly breakdown in Malaysian Ringgit (MYR) and US dollars (approximate at 4.45 MYR per USD):',
    'Here is a realistic monthly breakdown in US dollars:'],
  ['kohphangan', 'A realistic monthly breakdown in Thai baht and USD:', 'A realistic monthly breakdown in US dollars:'],
  ['laspalmas', 'USD figures use roughly 1.08 to the euro; expect movement with the exchange rate.',
    'Figures are in US dollars, converted from euro prices, so expect movement with the exchange rate.'],
  ['leuven', 'Budget in euros and expect prices to feel closer to a mid-size Western European city than a budget destination.',
    'Expect prices to feel closer to a mid-size Western European city than a budget destination.'],
  ['lisbon', 'Here is a realistic monthly picture for one remote worker (prices in euros with rough USD equivalents at about 1.15).',
    'Here is a realistic monthly picture for one remote worker, in US dollars.'],
  ['sanmigueldeallende', 'Here is a rough monthly breakdown for one person, with local prices in Mexican pesos (MXN) and rough US dollar equivalents.',
    'Here is a rough monthly breakdown for one person, in US dollars.'],
];

let n3 = 0;
for (const [id, from, to] of ONE_OFFS) {
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(p)) { missed.push(id + ': no page'); continue; }
  const html = read(id);
  if (!html.includes(from)) { missed.push(id + ': not found, "' + from.slice(0, 58) + '"'); continue; }
  write(id, html.split(from).join(to));
  n3 += 1;
}

for (const f of fs.readdirSync(path.join(ROOT, 'cities'))) {
  if (!f.endsWith('.html')) continue;
  const id = f.replace('.html', '');
  let html = read(id);
  const before = html;
  html = html.replace(ESTIMATES, (m, word) => { n1 += 1; return word + ' in US dollars'; });
  for (const [re, to] of EUROISH) {
    html = html.replace(re, (...a) => {
      n2 += 1;
      // put the captured whitespace back so a line break inside the phrase survives
      return to.replace(/\$(\d)/g, (x, i) => a[Number(i)]);
    });
  }
  if (html !== before) write(id, html);
}

const LEAVE = [
  ['vienna', '"the iconic 365-euro ticket" is the name of the product, not a price quote'],
  ['zadar', '"a euro economy" is about the currency zone'],
  ['byronbay', '"a euro-inspired menu" is a cuisine'],
  ['havana', '"a peso street pizza" is a kind of pizza, and it is already priced at under $1'],
];

if (APPLY) for (const [p, html] of files) fs.writeFileSync(p, html);

console.log(n1 + ' editorial-estimate lines moved to US dollars');
console.log(n2 + ' vague euro/franc amounts reworded');
console.log(n3 + ' of ' + ONE_OFFS.length + ' one-off rewrites applied');
if (missed.length) {
  console.log('\n  NOT APPLIED:');
  missed.forEach((m) => console.log('    ' + m));
}
console.log('\n  left alone on purpose:');
LEAVE.forEach(([id, why]) => console.log('    ' + id + ': ' + why));
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');
