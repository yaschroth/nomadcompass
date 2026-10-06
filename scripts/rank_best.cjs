/**
 * Produces the accurate ranked data for each "Best cities for X" landing page from
 * cities-data.js (rankings are data-driven; agents only write the prose on top).
 * Writes best-<pagekey>.json to env DIR (or ./). Usage:
 *   DIR=... node scripts/rank_best.cjs [pagekey ...]   (no args = all configured pages)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.DIR || ROOT;
const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const mm = {}; new Function('module', code + ';module.exports=CITIES')(mm);
const CITIES = mm.exports;
const CK = ['climate','cost','wifi','nightlife','nature','safety','food','community','english','visa','culture','cleanliness','airquality'];

// city id -> region (europe|asia|latam|africa|middleeast|northamerica|oceania), from the shared map
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

// Cheapness factor in [0,1] (1 = cheapest) from monthly cost, used by budget composites
const _costs = CITIES.map((c) => c.costPerMonth).filter((v) => typeof v === 'number');
const _cMin = Math.min(..._costs), _cMax = Math.max(..._costs);
const cheapness = (c) => typeof c.costPerMonth === 'number' ? 1 - (c.costPerMonth - _cMin) / (_cMax - _cMin || 1) : 0;
// Weighted composite match score in 0..10 from category scores (/10) + optional cheapness weight
function composite(c, weights, cheapWeight) {
  let s = 0;
  for (const k in weights) { const v = c.scores[k]; if (typeof v === 'number') s += weights[k] * (v / 10); }
  if (cheapWeight) s += cheapWeight * cheapness(c);
  return +Math.max(0, Math.min(10, s * 10)).toFixed(1);
}
// Value index: overall quality per $1k/month (higher = more Nomad Score per dollar)
const valueIndex = (c) => typeof c.costPerMonth === 'number' && c.costPerMonth > 0
  ? +(nomadScore(c) / (c.costPerMonth / 1000)).toFixed(2) : 0;
function nomadScore(c) {
  let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } });
  const raw = n ? t / n : 0;
  return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
}
function iso(c) {
  if (!c.flag) return null;
  const cps = Array.from(c.flag).map((ch) => ch.codePointAt(0)).filter((cp) => cp >= 0x1F1E6 && cp <= 0x1F1FF);
  return cps.length === 2 ? cps.map((cp) => String.fromCharCode(cp - 0x1F1E6 + 97)).join('') : null;
}

// --- Climate (assets/city-climate.js: station normals or ERA5, monthly h/l/r) and comfort ---
// The month-comfort formula already lives in eight places that must agree (memory: weather comfort
// model). This does not add a ninth copy: it evaluates the function straight out of
// build_comfort_index.cjs, so a season ranking can never score a month differently from /comfort-index.
const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const comfort = (() => {
  const src = fs.readFileSync(path.join(__dirname, 'build_comfort_index.cjs'), 'utf8');
  const i = src.indexOf('function comfort(');
  let d = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; }
  return new Function(src.slice(i, j + 1) + '; return comfort;')();
})();
const seasonComfort = (c, months) => {
  const cl = CLIMATE[c.id];
  if (!cl) return 0;
  return +(months.reduce((s, m) => s + comfort(cl.h[m], cl.l[m], cl.r[m]), 0) / months.length).toFixed(1);
};
// "Eternal spring": every month's mean temperature inside a spring band, ranked by the smallest gap
// between the coolest and warmest month, then by yearly comfort. Cities outside the band score 0.
// maxGap: San Diego and Agadir sit inside the band but swing 8-9C over the year, which is four
// seasons in miniature rather than spring; 5C is about what the highland towns that define the term show.
const SPRING = { lo: 14, hi: 24, maxGap: 5 };
const monthlyMeans = (c) => { const cl = CLIMATE[c.id]; return cl ? cl.h.map((h, i) => (h + cl.l[i]) / 2) : null; };
const springSpread = (c) => {
  const m = monthlyMeans(c);
  if (!m || Math.min(...m) < SPRING.lo || Math.max(...m) > SPRING.hi || Math.max(...m) - Math.min(...m) > SPRING.maxGap) return null;
  return +(Math.max(...m) - Math.min(...m)).toFixed(1);
};
// --- Providers who work in English, from the services directory (official lists mostly) ---
const SERVICE_ROWS = (() => { try { return require(path.join(ROOT, 'data', 'service-languages.json')).providers; } catch (e) { return []; } })();
const englishCare = {};
for (const r of SERVICE_ROWS) if ((r.category === 'doctor' || r.category === 'dentist') && (r.languages || []).includes('en')) englishCare[r.city] = (englishCare[r.city] || 0) + 1;

// N per page
const N = 15;
// Each page: key = category to rank by (desc). tie-break by overall Nomad Score.
const PAGES = {
  cost:    { slug: 'cheapest-cities-for-digital-nomads', h1: 'The Cheapest Cities for Digital Nomads', dimension: 'low cost of living', metric: 'cost', sort: 'priceAsc' },
  wifi:    { slug: 'best-cities-for-fast-wifi',           h1: 'Best Cities for Fast, Reliable WiFi',     dimension: 'fast and reliable internet', metric: 'wifi' },
  safety:  { slug: 'safest-cities-for-digital-nomads',    h1: 'The Safest Cities for Digital Nomads',    dimension: 'personal safety', metric: 'safety' },
  climate: { slug: 'best-cities-for-year-round-weather',  h1: 'Best Cities for Year-Round Good Weather', dimension: 'climate', metric: 'climate' },
  visa:    { slug: 'best-cities-for-digital-nomad-visas', h1: 'Best Cities for Digital Nomad Visas',     dimension: 'visa access for remote workers', metric: 'visa' },
  food:    { slug: 'best-cities-for-food',                h1: 'Best Cities for Food Lovers',             dimension: 'food and dining', metric: 'food' },
  nature:  { slug: 'best-cities-for-nature-and-outdoors', h1: 'Best Cities for Nature and the Outdoors', dimension: 'nature and outdoor access', metric: 'nature' },
  community:{ slug: 'best-cities-for-nomad-community',    h1: 'Best Cities for Meeting Other Nomads',    dimension: 'nomad community', metric: 'community' },
  nightlife:{ slug: 'best-cities-for-nightlife',          h1: 'Best Cities for Nightlife',               dimension: 'nightlife', metric: 'nightlife' },
  english: { slug: 'best-cities-for-english-speakers',    h1: 'Best Cities for English Speakers',        dimension: 'getting by in English', metric: 'english' },
  overall: { slug: 'best-all-round-cities-for-digital-nomads', h1: 'The Best All-Round Cities for Digital Nomads', dimension: 'all-around quality as a base', metric: 'overall' },

  // --- Persona composites (transparent blends of existing categories; no persona-specific data) ---
  female:   { slug: 'best-cities-for-female-digital-nomads',    h1: 'Best Cities for Female Digital Nomads',            dimension: 'safety and comfort for women traveling solo', metric: 'match', cheapWeight: .20, weights: { safety: .30, cleanliness: .15, airquality: .10, community: .10, english: .15 } },
  broke:    { slug: 'best-cities-for-broke-digital-nomads',     h1: 'Best Cities for Digital Nomads on a Tight Budget',  dimension: 'living cheaply without losing the essentials', metric: 'match', cheapWeight: .55, weights: { wifi: .25, safety: .20 } },
  beginner: { slug: 'best-cities-for-first-time-digital-nomads',h1: 'Best Cities for First-Time Digital Nomads',        dimension: 'an easy first base for new nomads', metric: 'match', weights: { english: .30, community: .25, safety: .25, wifi: .20 } },
  families: { slug: 'best-cities-for-digital-nomad-families',   h1: 'Best Cities for Digital Nomads with Families',     dimension: 'raising or traveling with kids', metric: 'match', weights: { safety: .30, cleanliness: .20, airquality: .20, nature: .15, community: .15 } },
  party:    { slug: 'best-cities-for-party-loving-nomads',      h1: 'Best Cities for Party-Loving Nomads',              dimension: 'nightlife and a social scene', metric: 'match', weights: { nightlife: .60, community: .40 } },
  value:    { slug: 'best-value-cities-for-digital-nomads',     h1: 'Best Value Cities for Digital Nomads',             dimension: 'the most quality of life per dollar', metric: 'value' },

  // --- Wave 4 (2026-10-06): the three categories without a page, plus pages built on data the site
  // has and its rivals do not: station climate normals and the language-indexed services directory ---
  culture:     { slug: 'best-cities-for-culture',                   h1: 'Best Cities for Culture and History',             dimension: 'culture, history and the arts', metric: 'culture' },
  cleanliness: { slug: 'cleanest-cities-for-digital-nomads',        h1: 'The Cleanest Cities for Digital Nomads',          dimension: 'clean streets and well-kept public space', metric: 'cleanliness' },
  airquality:  { slug: 'best-cities-for-clean-air',                 h1: 'Best Cities for Clean Air',                       dimension: 'air quality', metric: 'airquality' },
  cheapwifi:   { slug: 'cheap-cities-with-fast-wifi',               h1: 'Cheap Cities with Fast WiFi',                     dimension: 'fast internet on a small budget', metric: 'match', cheapWeight: .5, weights: { wifi: .5 }, minNomad: 6.0 },
  wintersun:   { slug: 'best-cities-for-winter-sun',                h1: 'Best Cities for Winter Sun',                      dimension: 'warm, dry weather from December to February', metric: 'season', months: [11, 0, 1], minNomad: 6.5 },
  summercool:  { slug: 'best-cities-to-escape-the-summer-heat',     h1: 'Best Cities to Escape the Summer Heat',           dimension: 'mild, comfortable weather from June to August', metric: 'season', months: [5, 6, 7], minNomad: 6.5 },
  // Ordered by the spring gap alone, Colombia's highland towns took ten of fifteen places. Ordered by
  // Nomad Score inside the band (the final rule) Colombia holds four, so the six-per-country cap does
  // not bind today; it stays as a guard if the climate data or the scores move.
  spring:      { slug: 'eternal-spring-cities-for-digital-nomads',  h1: 'Eternal Spring Cities for Digital Nomads',        dimension: 'spring-like temperatures in every month of the year', metric: 'spring', minNomad: 6.0, perCountry: 6 },
  // Not built: "best cities for English-speaking doctors" by directory count. The count measures which
  // cities have an official register that records languages (Hamburg 3,580, Berlin none), not where
  // care in English is easier, so the ranking would mislead.
};

// Region display names + slugs
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'the Middle East', northamerica: 'North America & the Caribbean', oceania: 'Oceania' };
const REGION_SLUG = { europe: 'europe', asia: 'asia', latam: 'latin-america', africa: 'africa', middleeast: 'the-middle-east', northamerica: 'north-america', oceania: 'oceania' };
for (const rk in REGION_NAMES) {
  PAGES['region_' + rk] = { slug: 'best-digital-nomad-cities-in-' + REGION_SLUG[rk], h1: 'Best Digital Nomad Cities in ' + REGION_NAMES[rk], dimension: 'the best bases across ' + REGION_NAMES[rk], metric: 'overall', region: rk };
}
// Top nomad countries (>= 8 cities each). Wave 4 adds twelve with 10 or more cities each.
const COUNTRIES = { Spain: 'spain', Mexico: 'mexico', Thailand: 'thailand', Portugal: 'portugal', Indonesia: 'indonesia', Vietnam: 'vietnam', Colombia: 'colombia', Italy: 'italy',
  Japan: 'japan', Turkey: 'turkey', Brazil: 'brazil', Greece: 'greece', Philippines: 'the-philippines', Croatia: 'croatia', Morocco: 'morocco', Peru: 'peru', Argentina: 'argentina', Malaysia: 'malaysia', India: 'india', 'South Korea': 'south-korea' };
// How the name reads in a heading; the data's country field stays the key.
const COUNTRY_LABEL = { Philippines: 'the Philippines' };
for (const cn in COUNTRIES) {
  const label = COUNTRY_LABEL[cn] || cn;
  PAGES['country_' + COUNTRIES[cn].replace(/^the-/, '').replace(/-/g, '')] = { slug: 'best-digital-nomad-cities-in-' + COUNTRIES[cn], h1: 'Best Digital Nomad Cities in ' + label, dimension: 'the best bases in ' + label, metric: 'overall', country: cn };
}

function rankFor(cfg) {
  const key = cfg.metric;
  // Optional filter for geographic pages (by region map or by country field).
  let pool = CITIES.slice();
  if (cfg.region) pool = pool.filter((c) => REGION[c.id] === cfg.region);
  if (cfg.country) pool = pool.filter((c) => c.country === cfg.country);
  // A weather ranking is a list of places to live, so a speck with perfect weather and nothing else
  // (no WiFi, no rentals) is held back by a Nomad Score floor; the page says so.
  if (cfg.minNomad) pool = pool.filter((c) => nomadScore(c) >= cfg.minNomad);
  if (cfg.metric === 'spring') pool = pool.filter((c) => springSpread(c) != null);
  if (cfg.metric === 'count') pool = pool.filter((c) => englishCare[c.id]);
  // 'priceAsc' -> lowest monthly cost; 'match' -> weighted composite; 'value' -> Nomad Score per $;
  // 'overall' -> Nomad Score; 'season' -> mean month comfort over cfg.months; 'spring' -> Nomad Score among
  // cities inside the spring band; 'count' -> English-speaking doctors and dentists listed (no page uses it);
  // otherwise the named category score. All tie-break on Nomad Score.
  const yearComfort = (c) => seasonComfort(c, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const cmp = cfg.metric === 'season'
    ? (a, b) => (seasonComfort(b, cfg.months) - seasonComfort(a, cfg.months)) || (nomadScore(b) - nomadScore(a))
    // The spring band decides who is on the list; among those, how livable the city is decides the
    // order. Ranking by the gap itself put towns 0.5C "springier" than Medellin above it, a difference
    // no one would feel. The gap is shown on every card.
    : cfg.metric === 'spring'
    ? (a, b) => (nomadScore(b) - nomadScore(a)) || (springSpread(a) - springSpread(b)) || (yearComfort(b) - yearComfort(a))
    : cfg.metric === 'count'
    ? (a, b) => (englishCare[b.id] - englishCare[a.id]) || (nomadScore(b) - nomadScore(a))
    : cfg.sort === 'priceAsc'
    ? (a, b) => ((a.costPerMonth || 1e9) - (b.costPerMonth || 1e9)) || (nomadScore(b) - nomadScore(a))
    : cfg.metric === 'match'
    ? (a, b) => (composite(b, cfg.weights, cfg.cheapWeight) - composite(a, cfg.weights, cfg.cheapWeight)) || (nomadScore(b) - nomadScore(a))
    : cfg.metric === 'value'
    ? (a, b) => (valueIndex(b) - valueIndex(a)) || (nomadScore(b) - nomadScore(a))
    : cfg.metric === 'overall'
    ? (a, b) => nomadScore(b) - nomadScore(a)
    : (a, b) => ((b.scores[key] || 0) - (a.scores[key] || 0)) || (nomadScore(b) - nomadScore(a));
  const metricScoreOf = (c) => cfg.metric === 'overall' ? nomadScore(c)
    : cfg.metric === 'match' ? composite(c, cfg.weights, cfg.cheapWeight)
    : cfg.metric === 'value' ? valueIndex(c)
    : cfg.metric === 'season' ? seasonComfort(c, cfg.months)
    : cfg.metric === 'spring' ? springSpread(c)
    : cfg.metric === 'count' ? englishCare[c.id]
    : c.scores[key];
  const perCountry = {};
  return pool
    .sort(cmp)
    .filter((c) => !cfg.perCountry || (perCountry[c.country] = (perCountry[c.country] || 0) + 1) <= cfg.perCountry)
    .slice(0, N)
    .map((c, i) => ({
      rank: i + 1, id: c.id, name: c.name, country: c.country, flag: c.flag || '', iso: iso(c),
      metricScore: metricScoreOf(c), nomadScore: nomadScore(c), costPerMonth: c.costPerMonth, tagline: c.tagline,
      scores: c.scores,
      // The monthly normals the page's prose must quote, so a blurb and the city's own weather chart
      // can never disagree. Rounded means for the spring band, for the card.
      climate: CLIMATE[c.id] || null,
      ...(cfg.metric === 'spring' ? { monthMeans: monthlyMeans(c).map((v) => Math.round(v)) } : {}),
    }));
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
for (const k of keys) {
  const cfg = PAGES[k];
  if (!cfg) { console.error('unknown page:', k); continue; }
  const data = { pagekey: k, slug: cfg.slug, h1: cfg.h1, dimension: cfg.dimension, metric: cfg.metric,
    ...(cfg.months ? { months: cfg.months } : {}), ...(cfg.minNomad ? { minNomad: cfg.minNomad } : {}), cities: rankFor(cfg) };
  fs.writeFileSync(path.join(OUT, 'best-' + k + '.json'), JSON.stringify(data, null, 2));
  console.log(`best-${k}.json  ->  #1 ${data.cities[0].name} (${cfg.metric}=${data.cities[0].metricScore})`);
}
