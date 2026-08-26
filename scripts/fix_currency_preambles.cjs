require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Rewrites the sentences that introduce a cost breakdown by naming the wrong currency.
 *
 * The two currency sweeps put every price on the city pages into USD. That left 34 sentences saying
 * things like "All prices below are in euros (EUR); 1 EUR is roughly 1.08 USD" directly above a
 * list of dollar figures. Those sentences were skipped on purpose, because converting the number
 * inside an exchange-rate sentence destroys it, but leaving them is worse than the problem the
 * sweep fixed: the page now misdescribes its own numbers.
 *
 * Each rewrite is written out in full rather than generated, because the useful half of these
 * sentences differs every time and a pattern would flatten it. Pátzcuaro's says card acceptance is
 * patchy and to carry cash, Marvão's carries the editorial-estimate provenance the source rule
 * requires, Rosario's is about Argentine inflation and the blue-dollar rate. Those clauses survive;
 * only the claim about which currency the figures are in changes.
 *
 * Two of the 34 flagged sentences are not rewritten at all and are listed at the bottom: they were
 * already correct and only matched the detector.
 *
 * Usage: node scripts/fix_currency_preambles.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

// Rendered inside the euro pages, whose only real content was the rate itself.
const EUR = 'All prices below are in US dollars, converted from euro prices.';

const FIXES = [
  ['accra', 'Prices are quoted in Ghanaian Cedis (GHS); 1 USD buys roughly 15-16 GHS in 2025-2026.',
    'All prices below are in US dollars. Local prices are set in Ghanaian cedis, so what you actually pay moves with the exchange rate.'],
  ['alicante', 'Prices below are rough 2025-2026 figures in euros, with US dollar equivalents at roughly 1 EUR to 1.13 USD.',
    'All prices below are rough 2025-2026 figures in US dollars, converted from euro prices.'],
  ['cancun', 'Prices below are approximate and paid in Mexican pesos (MXN); USD figures use a rate near 18 to 19 pesos to the dollar, so treat them as a guide, not a quote.',
    'All prices below are in US dollars, converted from Mexican peso prices, so treat them as a guide rather than a quote.'],
  ['cascais', 'Prices below are approximate 2025-2026 figures in euros, with rough USD equivalents (about $1.08 per euro).',
    'All prices below are approximate 2025-2026 figures in US dollars, converted from euro prices.'],
  ['cordoba', 'Prices quoted in ARS shift regularly.',
    'Local prices are set in Argentine pesos and shift regularly, so the dollar figures move with them.'],
  ['cyprus', 'All prices below are in euros (EUR); 1 EUR is roughly 1.08 USD.', EUR],
  ['filandia', 'All prices are in Colombian pesos (COP), and a comfortable monthly budget including rent, food, and local transport lands somewhere between 2,000,000 and 3,500,000 COP for a single remote worker, noticeably less if you cook at home and stay outside peak holiday weeks.',
    'All prices are in US dollars, and a comfortable monthly budget including rent, food, and local transport lands somewhere between $625 and $1,090 for a single remote worker, noticeably less if you cook at home and stay outside peak holiday weeks.'],
  ['groningen', 'Rents are usually quoted in euros, so figures below list the local price with an approximate US dollar equivalent at roughly 1.08 dollars per euro (check the current rate, as it moves).',
    'All figures below are in US dollars. Rents themselves are advertised in euros, so what you pay moves with the exchange rate.'],
  ['kampala', 'Prices are in Ugandan Shillings (UGX) and US Dollars.',
    'All prices below are in US dollars, converted from Ugandan shilling prices.'],
  ['kuching', 'A single remote worker who cooks sometimes and eats local can live comfortably here, and most costs are quoted in Malaysian ringgit (MYR), with the ringgit sitting around $1 to the US dollar.',
    'A single remote worker who cooks sometimes and eats local can live comfortably here. Local costs are set in Malaysian ringgit; the figures below are in US dollars.'],
  ['kuwait', 'All prices below are in Kuwaiti Dinar (KWD); 1 KWD equals roughly 3.25 USD.',
    'All prices below are in US dollars, converted from Kuwaiti dinar prices.'],
  ['manama', 'All prices are in Bahraini Dinar (BHD); 1 BHD equals approximately $2.65 USD.',
    'All prices below are in US dollars, converted from Bahraini dinar prices.'],
  ['mauritius', 'All prices below are in Mauritian Rupees (MUR) and approximate USD at roughly MUR 46 to $1.',
    'All prices below are in US dollars, converted from Mauritian rupee prices.'],
  ['mostar', 'All prices below are in Bosnian Convertible Marks (BAM) alongside USD.',
    'All prices below are in US dollars, converted from convertible mark prices.'],
  ['ohrid', 'Prices are quoted in Macedonian Denar (MKD) and approximate USD equivalents at roughly 58 MKD to the dollar.',
    'All prices below are in US dollars, converted from Macedonian denar prices.'],
  ['oslo', 'All figures are in Norwegian krone (NOK) with approximate USD equivalents at roughly 10.5 NOK to 1 USD.',
    'All figures below are in US dollars, converted from Norwegian krone prices.'],
  ['prague', 'Prices are in Czech koruna (CZK) with rough US dollar figures at recent rates.',
    'All prices below are in US dollars, converted from Czech koruna prices.'],
  ['skopje', 'All prices below are in Macedonian Denar (MKD); the exchange rate is roughly 62 MKD to 1 USD.',
    'All prices below are in US dollars, converted from Macedonian denar prices.'],
  ['tenerife', 'Prices below are in euros with rough USD equivalents at about 1.15 to the euro.', EUR],
  ['thehague', 'Prices below are in euros with rough USD equivalents at about 1.08 dollars per euro (rates move, so treat conversions as ballpark).',
    'All prices below are in US dollars, converted from euro prices, so treat them as ballpark.'],
  ['timisoara', 'Prices are quoted in Romanian Leu (RON); roughly 4.6 RON equals 1 USD at mid-2025 rates.',
    'All prices below are in US dollars, converted from Romanian leu prices.'],
  ['tunis', 'Prices are quoted in Tunisian dinars (TND); 1 USD buys roughly 3.1 TND in mid-2026.',
    'All prices below are in US dollars, converted from Tunisian dinar prices.'],
  ['turku', 'Prices below are in euros with rough US dollar equivalents (1 EUR is about 1.08 USD in 2026), and they shift with the exchange rate.',
    'All prices below are in US dollars, converted from euro prices, and they shift with the exchange rate.'],
  ['valletta', 'Prices are in euros with rough US dollar equivalents at about 1.14 to the euro, so treat the conversions as approximate.',
    'All prices below are in US dollars, converted from euro prices, so treat them as approximate.'],
  ['varna', 'All figures below are monthly estimates in Bulgarian Lev (BGN) and US dollars (1 BGN is roughly $0.55).',
    'All figures below are monthly estimates in US dollars, converted from Bulgarian lev prices.'],
  ['vienna', 'Prices are in euros with rough US dollar equivalents at about 1.08 to the euro.', EUR],
  ['zanzibar', 'All prices below are in Tanzanian shillings (TZS) with USD equivalents.',
    'All prices below are in US dollars, converted from Tanzanian shilling prices.'],
  ['zurich', 'Prices are quoted in Swiss francs (CHF), and the franc trades very close to one to one with the US dollar, so the CHF figures below are roughly the USD figures too.',
    'Prices are set locally in Swiss francs, which trade very close to one to one with the US dollar, so the dollar figures below are close either way.'],

  // These keep a clause that is nothing to do with currency, and it has to survive the rewrite.
  ['marvao', 'All prices are in euros and these figures are editorial estimates rather than official statistics, since Marv',
    'All prices are in US dollars and these figures are editorial estimates rather than official statistics, since Marv', { prefix: true }],
  ['patzcuaro', 'All prices are in Mexican pesos (MXN), and card acceptance is inconsistent outside of restaurants and hotels, so carrying cash is essential.',
    'All prices are in US dollars, and card acceptance is inconsistent outside of restaurants and hotels, so carrying cash is essential.'],
  ['rocamadour', 'All prices are in euros, and cash is still useful for smaller family-run eateries.',
    'All prices are in US dollars, and cash is still useful for smaller family-run eateries.'],
  ['rosario', 'expect prices quoted in pesos to rise by several percent each month',
    'expect local peso prices to rise by several percent each month', { prefix: true }],
];

// Flagged by the detector, correct as written, deliberately untouched.
const LEAVE = [
  ['ouropreto', 'already says the estimates are in US dollars; the Brazilian real is named as what local prices are set in'],
  ['kuwait', '"earning in USD or EUR" is about the reader\'s income, not about the units on the page'],
];

let done = 0;
const missed = [];
const byFile = new Map();

for (const [id, from, to] of FIXES) {
  const p = path.join(ROOT, 'cities', id + '.html');
  if (!fs.existsSync(p)) { missed.push(id + ': no such page'); continue; }
  const html = byFile.has(p) ? byFile.get(p) : fs.readFileSync(p, 'utf8');
  if (!html.includes(from)) { missed.push(id + ': sentence not found, "' + from.slice(0, 60) + '..."'); continue; }
  byFile.set(p, html.split(from).join(to));
  done += 1;
}

if (APPLY) for (const [p, html] of byFile) fs.writeFileSync(p, html);

console.log(done + ' of ' + FIXES.length + ' preambles rewritten across ' + byFile.size + ' pages');
if (missed.length) {
  console.log('\n  NOT APPLIED:');
  missed.forEach((m) => console.log('    ' + m));
}
console.log('\n  left alone on purpose:');
LEAVE.forEach(([id, why]) => console.log('    ' + id + ': ' + why));
if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');
