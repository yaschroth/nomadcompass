/**
 * Renders the homepage "Top-rated cities right now" grid as STATIC, crawlable city cards
 * (the grid was JS-only, so the homepage passed 0 static link equity to city pages). Injects
 * the top 9 cities by Nomad Score into #citiesGrid and guards the existing JS so it no longer
 * overwrites them. Idempotent. Usage: node scripts/apply_home_city_cards.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const LBL = { climate: 'Climate', cost: 'Cost', wifi: 'WiFi', nightlife: 'Nightlife', nature: 'Nature', safety: 'Safety', food: 'Food', community: 'Community', english: 'English', visa: 'Visa', culture: 'Culture', cleanliness: 'Clean', airquality: 'Air' };
const overall = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); return n ? t / n : 0; };
const nscore = (c) => Math.max(2.5, Math.min(9.9, 6.9 + (overall(c) - 6.47) / 0.44 * 1.05));
const cls = (v) => v >= 8 ? 'excellent' : v >= 6 ? 'good' : v >= 4 ? 'average' : 'below';

const featured = m.exports.slice().sort((a, b) => overall(b) - overall(a)).slice(0, 9);

const cards = featured.map((city, index) => {
  const sc = nscore(city).toFixed(1);
  const cost = typeof city.costPerMonth === 'number' ? '$' + city.costPerMonth.toLocaleString('en-US') : 'N/A';
  const code = iso(city.flag);
  const flag = code ? `<img class="flag-img" src="/assets/flags/${code}.svg" alt="" width="24" height="18" loading="lazy">` : esc(city.flag || '');
  const stats = CK.map((k) => {
    const v = typeof city.scores[k] === 'number' ? city.scores[k] : 0;
    return `<div class="overlay-stat"><div class="overlay-stat-header"><span class="overlay-stat-label">${LBL[k]}</span><span class="overlay-stat-value">${v}</span></div><div class="overlay-stat-bar"><div class="overlay-stat-fill ${cls(v)}" style="width:${v * 10}%"></div></div></div>`;
  }).join('');
  return `          <article class="city-card fade-in" data-city-id="${city.id}" style="animation-delay:${index * 50}ms"><div class="city-card-image-container"><img src="${esc(city.image)}" alt="${esc(city.name)}, ${esc(city.country)}" class="city-card-image" loading="lazy"><div class="city-card-overlay"><div class="overlay-stats">${stats}</div></div></div><div class="city-card-body"><div class="city-card-header"><div class="city-card-location"><span class="city-card-flag">${flag}</span><div><h2 class="city-card-name">${esc(city.name)}</h2><span class="city-card-country">${esc(city.country)}</span></div></div><div class="nomad-score ${cls(nscore(city))}"><span class="nomad-score-value">${sc}</span><span class="nomad-score-label">Score</span></div></div><div class="city-card-info"><div class="city-card-climate-type">${esc(city.climateType || 'N/A')}</div><div class="city-card-cost"><span class="cost-label">~${cost}</span><span class="cost-period">/month</span></div></div><a href="/cities/${city.id}" class="btn btn-primary city-card-action">View City &rarr;</a></div></article>`;
}).join('\n');

const abs = path.join(ROOT, 'index.html');
let html = fs.readFileSync(abs, 'utf8');
const before = html;

// 1) Fill #citiesGrid with the static cards (idempotent: matches either the original JS
//    placeholder comment or a previously-injected marked block, then the grid's own close).
const inner = `\n          <!-- home-cards-start -->\n${cards}\n          <!-- home-cards-end -->\n        `;
// Replacement MUST be a function: the card cost strings contain "$1"/"$2" which
// String.replace would otherwise interpret as capture-group references.
html = html.replace(
  /(<div class="cities-grid" id="citiesGrid">)(?:\s*<!-- top 9[\s\S]*?-->|\s*<!-- home-cards-start -->[\s\S]*?<!-- home-cards-end -->)\s*(<\/div>)/,
  (m, p1, p2) => p1 + inner + p2);

// 2) Guard the JS render so it doesn't overwrite the static cards.
if (!/if \(grid\.children\.length\) return; \/\/ static cards present/.test(html)) {
  html = html.replace("var grid = document.getElementById('citiesGrid');\n      if (!grid || typeof CITIES === 'undefined') return;",
    "var grid = document.getElementById('citiesGrid');\n      if (!grid || typeof CITIES === 'undefined') return;\n      if (grid.children.length) return; // static cards present (apply_home_city_cards.cjs)");
}

if (html === before) { console.log('NO CHANGE (anchors not found?)'); process.exit(1); }
fs.writeFileSync(abs, html);
console.log(`Homepage: injected ${featured.length} static city cards + guarded the JS.`);
