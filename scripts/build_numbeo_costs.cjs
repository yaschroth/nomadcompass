/**
 * Parses an Apify Numbeo dataset (automation-lab/numbeo-scraper, city_prices mode) into the
 * data/numbeo-costs.json schema consumed by apply_city_costs.cjs.
 *
 * For each city it extracts the raw Numbeo line items (rent, meal, transit, buy price/m2) in
 * LOCAL currency, and computes `singleNoRent` = a TRANSPARENT, documented monthly basket for one
 * person (excluding rent): a defined grocery list + N meals out + utilities + phone + internet +
 * transit pass + gym + cinema. Numbeo supplies every price; the basket quantities are ours and are
 * published so the figure is reproducible. Currency is resolved by country (Numbeo displays each
 * city in its country's currency; dollarised economies are mapped to USD).
 *
 * Usage: node scripts/build_numbeo_costs.cjs <dataset.json> [--dry]
 *   Reads scratch feed.json (name->slug->country) written by the fetch step.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FX = require(path.join(ROOT, 'assets', 'fx-usd.json'));

const dsPath = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!dsPath) { console.error('need dataset path'); process.exit(1); }
const rows = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
const feedPath = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3]
  : path.join(process.env.SP || '.', 'feed.json');
const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8')); // [{slug,name,country}]

// ---- monthly basket (excl rent), one person. item name -> monthly quantity ----
const BASKET = {
  'Milk (Regular, 1 Liter)': 10,
  'Fresh White Bread (1 lb Loaf)': 8,
  'White Rice (1 lb)': 3,
  'Eggs (12, Large Size)': 3,
  'Local Cheese (1 lb)': 1.5,
  'Chicken Fillets (1 lb)': 5,
  'Beef Round or Equivalent Back Leg Red Meat (1 lb)': 2,
  'Apples (1 lb)': 5,
  'Bananas (1 lb)': 5,
  'Oranges (1 lb)': 4,
  'Tomatoes (1 lb)': 5,
  'Potatoes (1 lb)': 6,
  'Onions (1 lb)': 3,
  'Lettuce (1 Head)': 4,
  'Bottled Water (50 oz)': 12,
  'Bottle of Wine (Mid-Range)': 2,
  'Domestic Beer (16.9 oz Bottle)': 6,
  'Meal at an Inexpensive Restaurant': 12,
  'Basic Utilities for 915 Square Feet Apartment (Electricity, Heating, Cooling, Water, Garbage)': 1,
  'Mobile Phone Plan (Monthly, with Calls and 10GB+ Data)': 1,
  'Broadband Internet (Unlimited Data, 60 Mbps or Higher)': 1,
  'Monthly Public Transport Pass (Regular Price)': 1,
  'Monthly Fitness Club Membership': 1,
  'Cinema Ticket (International Release)': 3,
};
const RENT1C = '1 Bedroom Apartment in City Centre';
const RENT1O = '1 Bedroom Apartment Outside of City Centre';
const MEAL = 'Meal at an Inexpensive Restaurant';
const TRANSIT = 'Monthly Public Transport Pass (Regular Price)';
const BUY_RE = /Price per Square (Feet|Meters?) to Buy Apartment in City Centre/;

// ---- country -> ISO 4217 (Numbeo display currency; dollarised -> USD) ----
const CUR = {
  Albania:'ALL',Argentina:'ARS',Armenia:'AMD',Australia:'AUD',Austria:'EUR',Azerbaijan:'AZN',
  Bahrain:'BHD',Belgium:'EUR',Bolivia:'BOB',Bosnia:'BAM','Bosnia and Herzegovina':'BAM',Brazil:'BRL',
  Bulgaria:'BGN',Cambodia:'USD',Canada:'CAD','Cape Verde':'CVE',Chile:'CLP',China:'CNY',Colombia:'COP',
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

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '');
// fed name -> {slug, country}
const bySlug = new Map(feed.map((f) => [f.slug, f]));
const byNorm = new Map();
feed.forEach((f) => { byNorm.set(norm(f.name), f); byNorm.set(norm(f.slug), f); });

// group dataset rows by city string
const cities = new Map();
for (const r of rows) {
  if (!r.city) continue;
  if (!cities.has(r.city)) cities.set(r.city, { items: {}, country: r.country });
  const g = cities.get(r.city);
  if (r.item && typeof r.price === 'number') g.items[r.item] = r.price;
  if (r.country) g.country = r.country;
}

function round2(n) { return Math.round(n * 100) / 100; }
const US_STATES = new Set(('alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri montana nebraska nevada newhampshire newjersey newmexico newyork northcarolina northdakota ohio oklahoma oregon pennsylvania rhodeisland southcarolina southdakota tennessee texas utah vermont virginia washington westvirginia wisconsin wyoming districtofcolumbia').split(' '));
function canonCountry(c) {
  c = String(c || '').toLowerCase().replace(/[^a-z]/g, '');
  if (US_STATES.has(c)) return 'unitedstates';
  const A = { uk: 'unitedkingdom', greatbritain: 'unitedkingdom', england: 'unitedkingdom',
    uae: 'unitedarabemirates', usa: 'unitedstates', us: 'unitedstates', america: 'unitedstates',
    czechia: 'czechrepublic', bosnia: 'bosniaandherzegovina', southkorea: 'korea',
    republicofkorea: 'korea', koreasouth: 'korea', macedonia: 'northmacedonia', hongkongsar: 'hongkong' };
  return A[c] || c;
}
const KNOWN_COUNTRIES = new Set(Object.keys(CUR).map(canonCountry));
function countryOk(expected, got) {
  const e = canonCountry(expected), g = canonCountry(got);
  if (!e || !g) return true;
  if (!KNOWN_COUNTRIES.has(g)) return true; // a region/state we don't recognise -> can't disprove, allow
  return e === g || e.includes(g) || g.includes(e);
}

const out = {};
let matched = 0, unmatched = [], incomplete = [], usdOverride = [], wrongCountry = [];
for (const [cityName, g] of cities) {
  const f = byNorm.get(norm(cityName));
  if (!f) { unmatched.push(cityName); continue; }
  if (g.country && !countryOk(f.country, g.country)) { wrongCountry.push(f.slug + '(' + f.country + '!=' + g.country + ')'); continue; }
  const it = g.items;
  const rent1c = it[RENT1C] ?? null;
  if (rent1c == null) { incomplete.push(f.slug + '(no rent)'); continue; }
  // basket
  let basket = 0, have = 0;
  for (const [name, qty] of Object.entries(BASKET)) {
    if (typeof it[name] === 'number') { basket += it[name] * qty; have++; }
  }
  if (have < 15) { incomplete.push(f.slug + '(basket ' + have + ')'); continue; }
  // buy price -> per m2
  let buySqm = null;
  for (const [name, price] of Object.entries(it)) {
    const m = name.match(BUY_RE);
    if (m) { buySqm = m[1] === 'Feet' ? price * 10.7639 : price; break; }
  }
  let cur = CUR[f.country] || CUR[g.country] || null;
  // Currency sanity: Numbeo displays some hyperinflated/dollarised economies (Argentina,
  // Lebanon, Venezuela, Iran...) in USD. If the country's currency makes a central 1-bed rent
  // convert to an impossibly low USD figure, the prices are really USD -> treat them as such.
  if (cur && FX.rates[cur]) {
    const testUsd = rent1c / FX.rates[cur];
    if (testUsd < 80 && rent1c >= 80 && rent1c <= 9000) { cur = 'USD'; usdOverride.push(f.slug); }
  }
  out[f.slug] = {
    found: true,
    numbeoSlug: cityName.replace(/\s+/g, '-'),
    cur,
    date: null, // filled below with fetch month
    rent1c: round2(rent1c),
    rent1o: it[RENT1O] != null ? round2(it[RENT1O]) : null,
    singleNoRent: round2(basket),
    mealInexp: it[MEAL] != null ? round2(it[MEAL]) : null,
    transport: it[TRANSIT] != null ? round2(it[TRANSIT]) : null,
    buySqm: buySqm != null ? round2(buySqm) : null,
  };
  matched++;
}

// fetch-month date label
const now = new Date();
const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
for (const k of Object.keys(out)) out[k].date = monthLabel;

// drop cities with implausible solo USD (bad scrape / scale bug) so only clean data ships;
// they keep their editorial estimate and no cost box.
const dropped = [];
for (const [k, v] of Object.entries(out)) {
  const rate = FX.rates[v.cur];
  const solo = rate ? (v.rent1c + v.singleNoRent) / rate : null;
  if (solo == null || solo < 250 || solo > 9000) { dropped.push(k + '=$' + (solo == null ? '?' : Math.round(solo)) + '(' + v.cur + ')'); delete out[k]; matched--; }
}
console.log('matched cities:', matched);
console.log('wrong-country (dropped):', wrongCountry.length, wrongCountry.join(', '));
console.log('USD-override (dollarised):', usdOverride.length, usdOverride.join(', '));
console.log('DROPPED (implausible, kept editorial):', dropped.length, dropped.join(', '));
console.log('unmatched dataset cities:', unmatched.length, unmatched.slice(0, 12).join(', '));
console.log('incomplete/skipped:', incomplete.length, incomplete.slice(0, 12).join(', '));
// currency sanity: any with no FX-code
const noCur = Object.entries(out).filter(([, v]) => !v.cur).map(([k]) => k);
if (noCur.length) console.log('NO CURRENCY resolved:', noCur.join(', '));
// sample
for (const s of ['lisbon', 'medellin', 'bangkok']) if (out[s]) console.log('sample', s, JSON.stringify(out[s]));

if (!DRY) {
  const dst = path.join(ROOT, 'data', 'numbeo-costs.json');
  const existing = JSON.parse(fs.readFileSync(dst, 'utf8'));
  const meta = existing._meta || {};
  meta.updated = monthLabel;
  meta.source = 'Numbeo via Apify (automation-lab/numbeo-scraper); singleNoRent = Nomad HQ monthly basket';
  const merged = { _meta: meta };
  for (const [k, v] of Object.entries(existing)) if (k !== '_meta') merged[k] = v; // keep old
  for (const [k, v] of Object.entries(out)) merged[k] = v; // overwrite with fresh
  fs.writeFileSync(dst, JSON.stringify(merged, null, 0));
  console.log('wrote', dst, 'total cities:', Object.keys(merged).length - 1);
}
