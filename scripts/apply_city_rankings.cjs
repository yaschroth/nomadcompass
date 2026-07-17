/**
 * Owns the styled "Explore" card on each city page (the block between the
 * city-seo-explore <section> and its FAQ <h2 id="faq">). Rebuilds it, idempotently,
 * as three chip groups: Explore nearby (nearest cities), Featured in these rankings
 * (rank-badged links to the /best rankings the city appears in, plus the region/
 * country ranking covering it) and Further reading (blog links carried over from the
 * existing markup). Closes the city -> ranking internal-link gap and makes the block
 * match the site's chip/tile styling.
 *   node scripts/apply_city_rankings.cjs --dry   (report, write nothing)
 *   node scripts/apply_city_rankings.cjs
 * Data: best-<key>.json, city-regions.js, cities-data.js. Run after regenerating city
 * pages; wired into rebuild_rankings.cjs.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.DIR || ROOT;
const DRY = process.argv.includes('--dry');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// --- data ---
const rankings = fs.readdirSync(DIR).filter((f) => /^best-.+\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const citiesCode = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const cm = {}; new Function('module', citiesCode + ';module.exports=CITIES')(cm);
const CITIES = cm.exports;
const byId = {}; CITIES.forEach((c) => { byId[c.id] = c; });
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

const rad = (d) => (d * Math.PI) / 180;
function dist(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(x));
}
const nearest = (c, n) => CITIES.filter((o) => o.id !== c.id).map((o) => ({ o, d: dist(c, o) })).sort((p, q) => p.d - q.d).slice(0, n).map((p) => p.o);

const PLBL = {
  overall: 'Best all-round cities', value: 'Best value cities', cost: 'Cheapest cities',
  wifi: 'Best cities for WiFi', safety: 'Safest cities', climate: 'Best year-round weather',
  visa: 'Best for nomad visas', food: 'Best cities for food', nature: 'Best for nature',
  community: 'Best for nomad community', nightlife: 'Best for nightlife', english: 'Best for English speakers',
  female: 'Best for female nomads', broke: 'Best on a tight budget', beginner: 'Best for first-timers',
  families: 'Best for families', party: 'Best for parties',
};
const isGeo = (k) => k.startsWith('region_') || k.startsWith('country_');
const labelOf = (r) => isGeo(r.pagekey) ? r.h1.replace(/^Best Digital Nomad Cities in (the )?/, 'Best cities in ') : (PLBL[r.pagekey] || r.h1);

// city id -> featured rankings (top-15 memberships)
const featMap = {};
for (const r of rankings) r.cities.forEach((c) => { (featMap[c.id] = featMap[c.id] || []).push({ slug: r.slug, label: labelOf(r), rank: c.rank }); });
const geoByRegion = {}, geoByCountry = {};
for (const r of rankings) {
  if (r.pagekey.startsWith('region_')) geoByRegion[r.pagekey.slice(7)] = r;
  if (r.pagekey.startsWith('country_')) geoByCountry[r.h1.replace(/^Best Digital Nomad Cities in /, '')] = r;
}

const cityFiles = fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html'));
let injected = 0, nomatch = 0, featCount = 0;

for (const file of cityFiles) {
  const id = file.replace(/\.html$/, '');
  const c = byId[id];
  if (!c) { nomatch++; continue; }
  const abs = path.join(ROOT, 'cities', file);
  let html = fs.readFileSync(abs, 'utf8');
  const re = /(<section class="container city-seo-explore"[^>]*>)([\s\S]*?)(\s*<h2 id="faq">)/;
  const m = html.match(re);
  if (!m) { nomatch++; continue; }
  const oldInner = m[2];

  // Nearby cities (from data) -> quiet crawlable line
  const near = nearest(c, 6);
  const nearbyLine = near.map((n) => `<a href="/cities/${n.id}">${esc(n.name)}</a>`).join(' &middot; ');

  // Featured rankings (top-15, ranked) + region/country "part of" (no rank)
  const featured = (featMap[id] || []).slice().sort((a, b) => a.rank - b.rank);
  const featSlugs = new Set(featured.map((f) => f.slug));
  const part = [];
  const regR = REGION[id] && geoByRegion[REGION[id]];
  if (regR && !featSlugs.has(regR.slug)) part.push({ slug: regR.slug, label: labelOf(regR) });
  const ctyR = geoByCountry[c.country];
  if (ctyR && !featSlugs.has(ctyR.slug)) part.push({ slug: ctyR.slug, label: labelOf(ctyR) });
  if (featured.length) featCount++;

  const head = featured.length ? `Where ${esc(c.name)} ranks` : `${esc(c.name)} in our rankings`;
  const rowF = (f) => `            <li class="city-rank-row"><span class="city-rank-num">${f.rank}</span><a class="city-rank-name" href="/best/${f.slug}">${esc(f.label)}</a><span class="city-rank-arrow">&rarr;</span></li>`;
  const rowP = (p) => `            <li class="city-rank-row is-part"><span class="city-rank-num" aria-hidden="true"></span><a class="city-rank-name" href="/best/${p.slug}">${esc(p.label)}</a><span class="city-rank-arrow">&rarr;</span></li>`;
  const rows = featured.map(rowF).concat(part.map(rowP)).join('\n');

  // Further reading (carry over blog links already on the page) -> quiet line
  const seen = new Set();
  const reading = [...oldInner.matchAll(/<a\b[^>]*href="(\/blog\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((x) => ({ href: x[1], label: strip(x[2]) }))
    .filter((l) => l.label && !seen.has(l.href) && seen.add(l.href))
    .slice(0, 4);
  const readingLine = reading.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join(' &middot; ');

  const footer = [
    nearbyLine ? `<p class="city-explore-links"><strong>Nearby:</strong> ${nearbyLine}</p>` : '',
    readingLine ? `<p class="city-explore-links"><strong>Further reading:</strong> ${readingLine}</p>` : '',
    `<p class="city-explore-links"><a href="/cities">Browse all city guides</a> &middot; <a href="/wheel">Find your match on the Nomad Wheel</a> &middot; <a href="/best">See all 32 rankings</a></p>`,
  ].filter(Boolean).join('\n          ');
  const card = `\n          <div class="city-explore" data-explore="v3">\n          <h3 class="city-rank-head">${head}</h3>\n          <ol class="city-rank-list">\n${rows}\n          </ol>\n          ${footer}\n          </div>\n`;

  if (DRY) continue;
  html = html.replace(re, `$1${card}$3`);
  fs.writeFileSync(abs, html);
  injected++;
}
console.log(`cities: ${cityFiles.length} | rebuilt: ${injected} | featured (top-15): ${featCount} | no match: ${nomatch}`);
