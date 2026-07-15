/**
 * Adds a "Compare {City} vs {Nearest}" CTA under the Nomad Score on every city page,
 * linking into /compare?a=<slug>&b=<nearest>. Nearest = closest city by great-circle
 * distance; for the few cities without coordinates, falls back to the first city in
 * their existing "Nearby" strip. Idempotent (skips pages already stamped).
 * Usage: node scripts/add_compare_ctas.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'cities');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const mm = {}; new Function('module', code + ';module.exports=CITIES')(mm);
const CITIES = mm.exports;
const byId = {}; CITIES.forEach((c) => { byId[c.id] = c; });
const withGeo = CITIES.filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number');

function hav(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function nearestGeo(c) {
  if (typeof c.lat !== 'number') return null;
  let best = null, bd = Infinity;
  for (const o of withGeo) { if (o.id === c.id) continue; const d = hav(c, o); if (d < bd) { bd = d; best = o; } }
  return best;
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let done = 0, skip = 0, noanchor = 0;
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html') && f !== 'index.html')) {
  const slug = file.replace(/\.html$/, '');
  const city = byId[slug];
  if (!city) { continue; }
  let s = fs.readFileSync(path.join(DIR, file), 'utf8');
  if (/score-compare/.test(s)) { skip++; continue; }

  // pick neighbor
  let nb = nearestGeo(city);
  if (!nb) {
    const m = s.match(/city-seo-nearby[\s\S]*?<a href="\/cities\/([a-z0-9-]+)"/);
    if (m && byId[m[1]] && m[1] !== slug) nb = byId[m[1]];
  }
  const href = nb ? `/compare?a=${slug}&amp;b=${nb.id}` : `/compare?a=${slug}`;
  const label = nb ? `Compare ${esc(city.name)} vs ${esc(nb.name)} &rarr;` : `Compare ${esc(city.name)} side by side &rarr;`;
  const cta = `\n            <a href="${href}" class="btn btn-secondary score-compare">${label}</a>`;

  // insert after the score-description paragraph
  const re = /(<div class="score-description">[\s\S]*?<\/p>)/;
  if (!re.test(s)) { noanchor++; continue; }
  s = s.replace(re, (m) => m + cta);
  fs.writeFileSync(path.join(DIR, file), s);
  done++;
}
console.log(`Compare CTAs: ${done} added, ${skip} already had one, ${noanchor} missing score-description anchor.`);
