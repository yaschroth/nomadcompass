/**
 * Improves internal linking across city pages. Idempotent. Two passes:
 *  1) ORPHAN FIX: any city never linked from another city's static "Nearby:" strip
 *     is injected into the Nearby strip of its 3 nearest same-region neighbours
 *     (fallback: 3 nearest overall), so every city earns inbound city-to-city links.
 *  2) CITY -> BLOG: adds a "Further reading" line (city-seo-reading) to every city,
 *     linking 1-3 relevant blog posts (city-specific, then country/region, then an
 *     evergreen), giving 410 high-traffic pages a path into the blog.
 * Usage: node scripts/fix_internal_links.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CITIES_DIR = path.join(ROOT, 'cities');

// ---- load data ----
const cdCode = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const CITIES = new Function(cdCode + ';return CITIES;')();
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const REGIONS = new Function(regCode + ';return CITY_REGIONS;')();

const byId = {};
for (const c of CITIES) byId[c.id] = c;
const pageExists = (slug) => fs.existsSync(path.join(CITIES_DIR, slug + '.html'));
const slugs = CITIES.map((c) => c.id).filter(pageExists);

function haversine(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
const coord = (slug) => { const c = byId[slug]; return c ? { lat: c.lat, lng: c.lng } : null; };
const nameOf = (slug) => (byId[slug] && byId[slug].name) || slug;

const NEARBY_RE = /(<p class="city-seo-nearby"><strong>Nearby:<\/strong> )/;

// ---- current inbound counts from static Nearby strips ----
const inbound = {}; slugs.forEach((s) => (inbound[s] = 0));
const pageText = {};
for (const s of slugs) {
  const t = fs.readFileSync(path.join(CITIES_DIR, s + '.html'), 'utf8');
  pageText[s] = t;
  const m = t.match(/<p class="city-seo-nearby">[\s\S]*?<\/p>/);
  if (m) [...m[0].matchAll(/\/cities\/([a-z0-9]+)"/g)].forEach((x) => { if (x[1] !== s && inbound[x[1]] != null) inbound[x[1]]++; });
}
const orphans = slugs.filter((s) => inbound[s] === 0);
console.log('Orphans (0 inbound):', orphans.length, '->', orphans.join(', ') || '(none)');

// ---- PASS 1: inject each orphan into 3 nearest neighbours ----
let injected = 0;
for (const o of orphans) {
  const oc = coord(o);
  const region = REGIONS[o];
  let peers = slugs.filter((s) => s !== o);
  if (region) {
    const same = peers.filter((s) => REGIONS[s] === region);
    if (same.length >= 3) peers = same; // prefer same-region when possible
  }
  peers = peers.map((s) => ({ s, d: haversine(oc, coord(s)) })).sort((a, b) => a.d - b.d).slice(0, 3).map((x) => x.s);
  const link = `<a href="/cities/${o}">${nameOf(o)}</a>, `;
  for (const p of peers) {
    let t = fs.readFileSync(path.join(CITIES_DIR, p + '.html'), 'utf8');
    if (new RegExp('/cities/' + o + '"').test(t.match(/<p class="city-seo-nearby">[\s\S]*?<\/p>/)?.[0] || '')) continue; // already linked
    if (!NEARBY_RE.test(t)) continue;
    t = t.replace(NEARBY_RE, (m) => m + link);
    fs.writeFileSync(path.join(CITIES_DIR, p + '.html'), t);
    injected++;
  }
}
console.log('Orphan links injected:', injected);

// ---- PASS 2: city -> blog "Further reading" ----
const TITLE = {
  'digital-nomad-guide-lisbon': 'Nomad guide to Lisbon',
  'portugal-digital-nomad-visa': 'Portugal nomad visa',
  'bangkok-budget-guide': 'Bangkok on a budget',
  'best-coworking-spaces-bali': 'Best coworking in Bali',
  'budapest-nomad-guide': 'Budapest nomad guide',
  'cape-town-nomad-guide': 'Cape Town nomad guide',
  'digital-nomads-tbilisi-georgia': 'Nomads in Tbilisi',
  'dubai-digital-nomad-guide': 'Dubai for nomads',
  'medellin-vs-chiang-mai': 'Medellin vs Chiang Mai',
  'mexico-city-nomad-guide': 'Mexico City nomad guide',
  'best-european-cities-nomads': 'Best European nomad cities',
  'remote-work-routine-guide': 'Build a remote-work routine',
  'digital-nomad-tax-guide': 'Nomad tax guide',
};
const CITY_SPECIFIC = {
  lisbon: ['digital-nomad-guide-lisbon'], bangkok: ['bangkok-budget-guide'], bali: ['best-coworking-spaces-bali'],
  budapest: ['budapest-nomad-guide'], capetown: ['cape-town-nomad-guide'], tbilisi: ['digital-nomads-tbilisi-georgia'],
  dubai: ['dubai-digital-nomad-guide'], medellin: ['medellin-vs-chiang-mai'], chiangmai: ['medellin-vs-chiang-mai'],
  mexicocity: ['mexico-city-nomad-guide'],
};
const blogExists = (s) => fs.existsSync(path.join(ROOT, 'blog', s + '.html'));
function postsFor(slug) {
  const out = [];
  (CITY_SPECIFIC[slug] || []).forEach((p) => out.push(p));
  const c = byId[slug];
  if (c && /portugal/i.test(c.country || '')) out.push('portugal-digital-nomad-visa');
  if (REGIONS[slug] === 'europe') out.push('best-european-cities-nomads');
  out.push('remote-work-routine-guide'); // evergreen for everyone
  out.push('digital-nomad-tax-guide');
  const seen = new Set(); const final = [];
  for (const p of out) { if (!seen.has(p) && blogExists(p) && TITLE[p]) { seen.add(p); final.push(p); } if (final.length >= 3) break; }
  return final;
}

let reading = 0, noNearby = 0;
for (const s of slugs) {
  let t = fs.readFileSync(path.join(CITIES_DIR, s + '.html'), 'utf8');
  if (/class="city-seo-reading"/.test(t)) continue; // idempotent
  const nearbyM = t.match(/<p class="city-seo-nearby">[\s\S]*?<\/p>/);
  if (!nearbyM) { noNearby++; continue; }
  const posts = postsFor(s);
  if (!posts.length) continue;
  const links = posts.map((p) => `<a href="/blog/${p}">${TITLE[p]}</a>`).join(', ');
  const block = `\n          <p class="city-seo-reading"><strong>Further reading:</strong> ${links}.</p>`;
  t = t.replace(nearbyM[0], nearbyM[0] + block);
  fs.writeFileSync(path.join(CITIES_DIR, s + '.html'), t);
  reading++;
}
console.log('Further-reading blocks added:', reading, '| pages without Nearby strip:', noNearby);
