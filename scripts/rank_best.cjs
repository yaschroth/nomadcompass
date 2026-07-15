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
};

function rankFor(cfg) {
  const key = cfg.metric;
  // 'priceAsc' ranks a "cheapest" page by actual monthly cost (lowest first); everything
  // else ranks by the category score (highest first). Both tie-break on overall Nomad Score.
  const cmp = cfg.sort === 'priceAsc'
    ? (a, b) => ((a.costPerMonth || 1e9) - (b.costPerMonth || 1e9)) || (nomadScore(b) - nomadScore(a))
    : cfg.metric === 'overall'
    ? (a, b) => nomadScore(b) - nomadScore(a)
    : (a, b) => ((b.scores[key] || 0) - (a.scores[key] || 0)) || (nomadScore(b) - nomadScore(a));
  return CITIES.slice()
    .sort(cmp)
    .slice(0, N)
    .map((c, i) => ({
      rank: i + 1, id: c.id, name: c.name, country: c.country, flag: c.flag || '', iso: iso(c),
      metricScore: cfg.metric === 'overall' ? nomadScore(c) : c.scores[key], nomadScore: nomadScore(c), costPerMonth: c.costPerMonth, tagline: c.tagline,
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
