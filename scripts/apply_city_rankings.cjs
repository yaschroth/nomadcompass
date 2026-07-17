/**
 * Adds a "Featured in these rankings" line to each city page, linking to the /best
 * rankings the city appears in (with its rank where it is in the top 15) plus the
 * region/country ranking that covers it. Closes the city -> ranking internal-link gap.
 * Idempotent (re-run safe). Data comes from best-<key>.json.
 *   node scripts/apply_city_rankings.cjs --dry   (report coverage, write nothing)
 *   node scripts/apply_city_rankings.cjs         (inject into cities/*.html)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.DIR || ROOT;
const DRY = process.argv.includes('--dry');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Load every ranking's data
const rankFiles = fs.readdirSync(DIR).filter((f) => /^best-.+\.json$/.test(f));
const rankings = rankFiles.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));

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

// city id -> { featured: [{slug,label,rank}], part: [{slug,label}] }
const map = {};
for (const r of rankings) {
  r.cities.forEach((c) => {
    (map[c.id] = map[c.id] || { featured: [], part: [] }).featured.push({ slug: r.slug, label: labelOf(r), rank: c.rank, key: r.pagekey });
  });
}
// For geo rankings, also record every city of that region/country as "part" even if outside top 15
// (needs the full membership, which top-15 JSON does not have) -> we approximate by using city-regions + country.
// Load region map + city countries from cities-data.
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};
const citiesCode = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const cm = {}; new Function('module', citiesCode + ';module.exports=CITIES')(cm);
const COUNTRY = {}; cm.exports.forEach((c) => { COUNTRY[c.id] = c.country; });
// geo ranking lookup by region key / country name
const geoByRegion = {}, geoByCountry = {};
for (const r of rankings) {
  if (r.pagekey.startsWith('region_')) geoByRegion[r.pagekey.slice('region_'.length)] = r;
  if (r.pagekey.startsWith('country_')) geoByCountry[r.h1.replace(/^Best Digital Nomad Cities in /, '')] = r;
}

const cityFiles = fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html'));
let withFeatured = 0, withAny = 0, none = 0, injected = 0, nomatch = 0;

for (const file of cityFiles) {
  const id = file.replace(/\.html$/, '');
  const rec = map[id] || { featured: [], part: [] };
  // featured (top-15) sorted best rank first, non-geo first then geo
  const featured = rec.featured.slice().sort((a, b) => a.rank - b.rank);
  const featuredSlugs = new Set(featured.map((f) => f.slug));
  // "part": region + country ranking covering this city, if not already featured
  const part = [];
  const reg = REGION[id]; const regR = reg && geoByRegion[reg];
  if (regR && !featuredSlugs.has(regR.slug)) part.push({ slug: regR.slug, label: labelOf(regR) });
  const ctyR = geoByCountry[COUNTRY[id]];
  if (ctyR && !featuredSlugs.has(ctyR.slug)) part.push({ slug: ctyR.slug, label: labelOf(ctyR) });

  if (featured.length) withFeatured++;
  if (featured.length || part.length) withAny++; else { none++; continue; }

  const featHtml = featured.map((f) => `<a href="/best/${f.slug}">#${f.rank} ${esc(f.label)}</a>`).join(', ');
  const partHtml = part.map((p) => `<a href="/best/${p.slug}">${esc(p.label)}</a>`).join(', ');
  let inner = '';
  if (featured.length) inner += `<strong>Featured in these rankings:</strong> ${featHtml}. `;
  if (part.length) inner += `${featured.length ? 'Also part of' : '<strong>Part of these collections:</strong>'} ${partHtml}. `;
  inner += `<a href="/best">See all 32 rankings</a>.`;
  const block = `\n          <p class="city-seo-rankings">${inner}</p><!-- city-rankings-end -->`;

  if (DRY) continue;
  const abs = path.join(ROOT, 'cities', file);
  let html = fs.readFileSync(abs, 'utf8');
  html = html.replace(/\n\s*<p class="city-seo-rankings">[\s\S]*?<!-- city-rankings-end -->/g, ''); // idempotent: strip old
  // inject after the "Further reading" paragraph, else before the FAQ h2, else after nearby
  let done = false;
  const afterReading = /(<p class="city-seo-reading">[\s\S]*?<\/p>)/;
  const beforeFaq = /(\n\s*<h2 id="faq">)/;
  const afterNearby = /(<p class="city-seo-nearby">[\s\S]*?<\/p>)/;
  if (afterReading.test(html)) { html = html.replace(afterReading, `$1${block}`); done = true; }
  else if (beforeFaq.test(html)) { html = html.replace(beforeFaq, `${block}$1`); done = true; }
  else if (afterNearby.test(html)) { html = html.replace(afterNearby, `$1${block}`); done = true; }
  if (done) { fs.writeFileSync(abs, html); injected++; } else nomatch++;
}
console.log(`cities: ${cityFiles.length} | with featured (top-15): ${withFeatured} | with any ranking link: ${withAny} | no links: ${none}`);
if (!DRY) console.log(`injected: ${injected} | no anchor match: ${nomatch}`);
// sample
const sample = ['lisbon', 'aarhus', 'medellin', 'bali'].filter((i) => map[i] || REGION[i]);
for (const id of sample) {
  const rec = map[id] || { featured: [] };
  console.log(`  ${id}: featured=${rec.featured.length} [${rec.featured.slice(0,4).map((f)=>f.rank+' '+f.key).join(', ')}] region=${REGION[id]} country=${COUNTRY[id]}`);
}
