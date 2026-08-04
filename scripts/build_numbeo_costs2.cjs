/**
 * Parses a crawlerbros/numbeo-scraper dataset (mode=costOfLiving: one record per city with a
 * `prices` array) into the data/numbeo-costs.json schema, and MERGES it into the existing file.
 *
 * Unlike the old automation-lab actor (which forced US/imperial labels), this actor returns whatever
 * units Numbeo shows for the proxied locale: US cities use imperial ("1 lb", "50 oz", "Square Feet"),
 * everywhere else metric ("1 kg", "500 g", "1.5 Liter", "Square Meter"). We normalise every price to a
 * canonical base unit (per-kg / per-L) and apply metric monthly quantities that are the exact
 * unit-conversions of the old imperial basket, so `singleNoRent` totals stay consistent with the
 * first 100 cities regardless of locale.
 *
 * Country can't be read from this actor's output, so we verify with the scraped currency SYMBOL
 * (drop clear mismatches, e.g. expected EUR but Numbeo showed $ or £) plus the same plausibility
 * gate as before (final solo USD in [250, 9000]).
 *
 * Usage: SP=<scratch> node scripts/build_numbeo_costs2.cjs <dataset.json> [feed.json] [--dry]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json'));

const dsPath = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!dsPath) { console.error('need dataset path'); process.exit(1); }
const feedPath = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3]
  : path.join(process.env.SP || '.', 'feed_all.json');
const rows = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8')); // [{slug,name,country}]

const LB = 0.453592; // kg per lb
// canonical basket: matcher prefix -> monthly qty in BASE unit (kg for weight, L for volume, unit else)
// base-unit quantities = old imperial qty converted, so totals match the first 100 cities.
const KG = { // per-kg groceries, qty in kg (= old lb-qty * 0.453592)
  'White Rice': 3 * LB, 'Local Cheese': 1.5 * LB, 'Chicken Fillets': 5 * LB,
  'Beef Round': 2 * LB, 'Apples': 5 * LB, 'Bananas': 5 * LB, 'Oranges': 4 * LB,
  'Tomatoes': 5 * LB, 'Potatoes': 6 * LB, 'Onions': 3 * LB,
};
const OZ_L = 0.0295735; // L per US fl oz
// per-unit (qty as old; price used as-is): eggs(dozen), lettuce(head), wine(bottle), meal, services
const EACH = {
  'Eggs': 3, 'Lettuce': 4, 'Bottle of Wine (Mid-Range)': 2,
  'Meal at an Inexpensive Restaurant': 12,
  'Basic Utilities': 1, 'Mobile Phone Plan': 1, 'Broadband Internet': 1,
  'Monthly Public Transport Pass': 1, 'Monthly Fitness Club Membership': 1,
  'Cinema Ticket': 1 * 3,
};

// find a price line whose item starts with `prefix`; returns {item, price} or null
function find(prices, prefix) {
  for (const p of prices) if (typeof p.price === 'number' && p.item && p.item.indexOf(prefix) === 0) return p;
  return null;
}
// normalise a weight price to per-kg using the unit in its label
function perKg(line) {
  const l = line.item;
  if (/\(1 kg\)/.test(l)) return line.price;
  if (/\(1 lb\)/.test(l)) return line.price / LB;
  if (/\(500 g/.test(l)) return line.price / 0.5;            // 500 g loaf
  if (/\(1 lb Loaf\)/.test(l)) return line.price / LB;       // 1 lb loaf
  return null;
}

// ---- country -> ISO 4217 (Numbeo display currency; dollarised -> USD) ----
const CUR = {
  Albania:'ALL',Argentina:'ARS',Armenia:'AMD',Australia:'AUD',Austria:'EUR',Azerbaijan:'AZN',
  Bahrain:'BHD',Belgium:'EUR',Bolivia:'BOB',Bosnia:'BAM','Bosnia and Herzegovina':'BAM',Brazil:'BRL',
  Bulgaria:'EUR',Cambodia:'USD',Canada:'CAD','Cape Verde':'CVE',Chile:'CLP',China:'CNY',Colombia:'COP',
  'Costa Rica':'CRC',Croatia:'EUR',Cuba:'USD',Cyprus:'EUR','Czech Republic':'CZK',Denmark:'DKK',
  'Dominican Republic':'DOP',Ecuador:'USD',Egypt:'EGP','El Salvador':'USD',Estonia:'EUR',Ethiopia:'ETB',
  Fiji:'FJD',Finland:'EUR',France:'EUR',Georgia:'GEL',Germany:'EUR',Ghana:'GHS',Greece:'EUR',
  Guatemala:'GTQ',Hungary:'HUF',Iceland:'ISK',India:'INR',Indonesia:'IDR',Iran:'IRR',Ireland:'EUR',
  Israel:'ILS',Italy:'EUR',Japan:'JPY',Jordan:'JOD',Kazakhstan:'KZT',Kenya:'KES',Kosovo:'EUR',
  Kuwait:'KWD',Kyrgyzstan:'KGS',Laos:'LAK',Latvia:'EUR',Lebanon:'USD',Lithuania:'EUR',Luxembourg:'EUR',
  Malaysia:'MYR',Malta:'EUR',Mauritius:'MUR',Mexico:'MXN',Montenegro:'EUR',Morocco:'MAD',Mozambique:'MZN',
  Myanmar:'MMK',Namibia:'NAD',Nepal:'NPR',Netherlands:'EUR','New Caledonia':'XPF','New Zealand':'NZD',
  Nicaragua:'NIO',Nigeria:'NGN','North Macedonia':'MKD',Norway:'NOK',Oman:'OMR',Palestine:'ILS',
  Panama:'USD',Paraguay:'PYG',Peru:'PEN',Philippines:'PHP',Poland:'PLN',Portugal:'EUR','Puerto Rico':'USD',
  Qatar:'QAR',Romania:'RON',Rwanda:'RWF','Saudi Arabia':'SAR',Senegal:'XOF',Serbia:'RSD',Singapore:'SGD',
  Slovakia:'EUR',Slovenia:'EUR','South Africa':'ZAR','South Korea':'KRW',Spain:'EUR','Sri Lanka':'LKR',
  Sweden:'SEK',Switzerland:'CHF',Taiwan:'TWD',Tanzania:'TZS',Thailand:'THB',Tunisia:'TND',Turkey:'TRY',
  UAE:'AED',UK:'GBP',Uganda:'UGX','United Kingdom':'GBP','United States':'USD',Uruguay:'UYU',
  Uzbekistan:'UZS',Vietnam:'VND',Zambia:'ZMW',
};
// which currency a scraped symbol implies (only unambiguous ones; $ is deliberately omitted)
const SYM2CUR = { '€': 'EUR', '£': 'GBP', '₺': 'TRY', 'zł': 'PLN', '₹': 'INR', '₩': 'KRW',
  '฿': 'THB', '₫': 'VND', '₪': 'ILS', '₽': 'RUB', '₾': 'GEL', 'Rp': 'IDR', 'RM': 'MYR', '₱': 'PHP' };

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '');
const byNorm = new Map();
feed.forEach((f) => { byNorm.set(norm(f.name), f); byNorm.set(norm(f.slug), f); });
const round2 = (n) => Math.round(n * 100) / 100;

const out = {};
let matched = 0; const unmatched = [], incomplete = [], usdOverride = [], wrongCur = [], dropped = [];
for (const rec of rows) {
  if (rec.recordType === 'error' || !Array.isArray(rec.prices)) continue;
  const name = rec.city || (rec.title || '').replace(/^Cost of Living in /, '');
  const f = byNorm.get(norm(name));
  if (!f) { unmatched.push(name); continue; }
  const P = rec.prices;

  // currency verification via scraped symbol (skip $ and blanks; drop clear mismatches)
  const expected = CUR[f.country] || null;
  const sym = (P.find((p) => p.currency) || {}).currency;
  if (expected && sym && SYM2CUR[sym] && SYM2CUR[sym] !== expected) { wrongCur.push(f.slug + '(' + sym + '!=' + expected + ')'); continue; }

  const rent1cL = find(P, '1 Bedroom Apartment in City Centre');
  if (!rent1cL) { incomplete.push(f.slug + '(no rent)'); continue; }
  const rent1c = rent1cL.price;

  // basket
  let basket = 0, have = 0;
  for (const [prefix, qtyKg] of Object.entries(KG)) {
    const line = find(P, prefix); if (!line) continue;
    const pk = perKg(line); if (pk == null) continue;
    basket += pk * qtyKg; have++;
  }
  // milk (1 Liter, both locales)
  const milk = find(P, 'Milk (Regular, 1 Liter)'); if (milk) { basket += milk.price * 10; have++; }
  // large bottled water: 1.5 Liter (metric) or 50 oz (imperial) -> per L, qty = 12*1.47868 L
  const waterL = P.find((p) => /^Bottled Water \(1\.5 Liter\)/.test(p.item)) || P.find((p) => /^Bottled Water \(50 oz\)/.test(p.item));
  if (waterL && typeof waterL.price === 'number') {
    const perL = /1\.5 Liter/.test(waterL.item) ? waterL.price / 1.5 : waterL.price / (50 * OZ_L);
    basket += perL * (12 * 50 * OZ_L); have++;
  }
  // bread -> per kg, qty 8 lb-loaves worth
  const bread = find(P, 'Fresh White Bread'); if (bread) { const pk = perKg(bread); if (pk != null) { basket += pk * (8 * LB); have++; } }
  // domestic beer bottle 0.5L / 16.9 oz -> per L, qty 6*0.4997 L
  const beer = P.find((p) => /^Domestic Beer \(0\.5 Liter Bottle\)/.test(p.item)) || P.find((p) => /^Domestic Beer \(16\.9 oz Bottle\)/.test(p.item));
  if (beer && typeof beer.price === 'number') {
    const perL = /0\.5 Liter/.test(beer.item) ? beer.price / 0.5 : beer.price / (16.9 * OZ_L);
    basket += perL * (6 * 16.9 * OZ_L); have++;
  }
  // per-unit items (price as-is)
  for (const [prefix, qty] of Object.entries(EACH)) {
    const line = find(P, prefix); if (!line) continue;
    basket += line.price * qty; have++;
  }
  if (have < 15) { incomplete.push(f.slug + '(basket ' + have + ')'); continue; }

  // buy price per m2
  let buySqm = null;
  const buyM = P.find((p) => /^Price per Square Meters? to Buy Apartment in City Centre/.test(p.item));
  const buyF = P.find((p) => /^Price per Square Feet to Buy Apartment in City Centre/.test(p.item));
  if (buyM && typeof buyM.price === 'number') buySqm = buyM.price;
  else if (buyF && typeof buyF.price === 'number') buySqm = buyF.price * 10.7639;

  const rent1oL = find(P, '1 Bedroom Apartment Outside of City Centre');
  const mealL = find(P, 'Meal at an Inexpensive Restaurant');
  const transitL = find(P, 'Monthly Public Transport Pass');

  // currency + USD-override for dollarised economies
  let cur = expected;
  if (cur && FX.rates[cur]) {
    const testUsd = rent1c / FX.rates[cur];
    if (testUsd < 80 && rent1c >= 80 && rent1c <= 9000) { cur = 'USD'; usdOverride.push(f.slug); }
  }
  out[f.slug] = {
    found: true, numbeoSlug: name.replace(/\s+/g, '-'), cur, date: null,
    rent1c: round2(rent1c),
    rent1o: rent1oL ? round2(rent1oL.price) : null,
    singleNoRent: round2(basket),
    mealInexp: mealL ? round2(mealL.price) : null,
    transport: transitL ? round2(transitL.price) : null,
    buySqm: buySqm != null ? round2(buySqm) : null,
  };
  matched++;
}

const now = new Date();
const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
for (const k of Object.keys(out)) out[k].date = monthLabel;

// plausibility gate: drop implausible solo USD
for (const [k, v] of Object.entries(out)) {
  const rate = FX.rates[v.cur];
  const solo = rate ? (v.rent1c + v.singleNoRent) / rate : null;
  if (solo == null || solo < 250 || solo > 9000) { dropped.push(k + '=$' + (solo == null ? '?' : Math.round(solo)) + '(' + v.cur + ')'); delete out[k]; matched--; }
}
console.log('matched cities:', matched);
console.log('wrong-currency (dropped):', wrongCur.length, wrongCur.join(', '));
console.log('USD-override:', usdOverride.length, usdOverride.join(', '));
console.log('DROPPED (implausible):', dropped.length, dropped.join(', '));
console.log('unmatched dataset cities:', unmatched.length, unmatched.slice(0, 15).join(', '));
console.log('incomplete/skipped:', incomplete.length, incomplete.slice(0, 15).join(', '));
for (const s of ['stockholm', 'malaga', 'toronto', 'fukuoka']) if (out[s]) console.log('sample', s, JSON.stringify(out[s]));

if (!DRY) {
  const dst = path.join(ROOT, 'data', 'numbeo-costs.json');
  const existing = JSON.parse(fs.readFileSync(dst, 'utf8'));
  const meta = existing._meta || {};
  meta.updated = monthLabel;
  const merged = { _meta: meta };
  for (const [k, v] of Object.entries(existing)) if (k !== '_meta') merged[k] = v;
  let added = 0; for (const [k, v] of Object.entries(out)) { if (!existing[k]) added++; merged[k] = v; }
  fs.writeFileSync(dst, JSON.stringify(merged, null, 0));
  console.log('wrote', dst, '| total cities:', Object.keys(merged).length - 1, '| newly added:', added);
}
