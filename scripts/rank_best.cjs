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
};

// Region display names + slugs
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'the Middle East', northamerica: 'North America', oceania: 'Oceania' };
const REGION_SLUG = { europe: 'europe', asia: 'asia', latam: 'latin-america', africa: 'africa', middleeast: 'the-middle-east', northamerica: 'north-america', oceania: 'oceania' };
for (const rk in REGION_NAMES) {
  PAGES['region_' + rk] = { slug: 'best-digital-nomad-cities-in-' + REGION_SLUG[rk], h1: 'Best Digital Nomad Cities in ' + REGION_NAMES[rk], dimension: 'the best bases across ' + REGION_NAMES[rk], metric: 'overall', region: rk };
}
// Top nomad countries (>= 8 cities each)
const COUNTRIES = { Spain: 'spain', Mexico: 'mexico', Thailand: 'thailand', Portugal: 'portugal', Indonesia: 'indonesia', Vietnam: 'vietnam', Colombia: 'colombia', Italy: 'italy' };
for (const cn in COUNTRIES) {
  PAGES['country_' + COUNTRIES[cn]] = { slug: 'best-digital-nomad-cities-in-' + COUNTRIES[cn], h1: 'Best Digital Nomad Cities in ' + cn, dimension: 'the best bases in ' + cn, metric: 'overall', country: cn };
}

function rankFor(cfg) {
  const key = cfg.metric;
  // Optional filter for geographic pages (by region map or by country field).
  let pool = CITIES.slice();
  if (cfg.region) pool = pool.filter((c) => REGION[c.id] === cfg.region);
  if (cfg.country) pool = pool.filter((c) => c.country === cfg.country);
  // 'priceAsc' -> lowest monthly cost; 'match' -> weighted composite; 'value' -> Nomad Score per $;
  // 'overall' -> Nomad Score; otherwise the named category score. All tie-break on Nomad Score.
  const cmp = cfg.sort === 'priceAsc'
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
    : c.scores[key];
  return pool
    .sort(cmp)
    .slice(0, N)
    .map((c, i) => ({
      rank: i + 1, id: c.id, name: c.name, country: c.country, flag: c.flag || '', iso: iso(c),
      metricScore: metricScoreOf(c), nomadScore: nomadScore(c), costPerMonth: c.costPerMonth, tagline: c.tagline,
      scores: c.scores,
    }));
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
for (const k of keys) {
  const cfg = PAGES[k];
  if (!cfg) { console.error('unknown page:', k); continue; }
  const data = { pagekey: k, slug: cfg.slug, h1: cfg.h1, dimension: cfg.dimension, metric: cfg.metric, cities: rankFor(cfg) };
  fs.writeFileSync(path.join(OUT, 'best-' + k + '.json'), JSON.stringify(data, null, 2));
  console.log(`best-${k}.json  ->  #1 ${data.cities[0].name} (${cfg.metric}=${data.cities[0].metricScore})`);
}
