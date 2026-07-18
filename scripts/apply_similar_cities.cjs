/**
 * Adds a static, crawlable "Cities with a Similar Vibe" section to every city page.
 * Similarity is by SCORE PROFILE (Euclidean distance across the 13 category scores),
 * not geography, so it complements the existing JS "You Might Also Like" carousel
 * (which is nearby-by-region and client-rendered, i.e. not crawlable). Each card is a
 * real <a href="/cities/<slug>"> link, so this also spreads internal-link equity by
 * lifestyle relevance (~6 links x 410 pages).
 *
 * Also fixes the misleading subtitle on the existing carousel ("Cities with similar
 * vibes to X" -> "Popular nearby cities"), since that block is actually geographic.
 *
 * Idempotent (marker <!-- similar-cities -->). Inserts before the city-seo-explore
 * section. Run after generate_city_pages / apply_city_rankings.
 * Usage: node scripts/apply_similar_cities.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITIES = m.exports.filter((c) => c && c.id && c.scores);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const LABEL = { climate: 'Climate', cost: 'Affordability', wifi: 'WiFi', nightlife: 'Nightlife', nature: 'Nature', safety: 'Safety', food: 'Food', community: 'Community', english: 'English', visa: 'Visa access', culture: 'Culture', cleanliness: 'Cleanliness', airquality: 'Air quality' };

function nomadScore(c) {
  let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } });
  const raw = n ? t / n : 0;
  return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
}
function dist(a, b) {
  let s = 0; for (const k of CK) { const d = ((a.scores[k] || 0) - (b.scores[k] || 0)) / 10; s += d * d; } return Math.sqrt(s);
}
function sharedStrengths(a, b) {
  return CK.filter((k) => (a.scores[k] || 0) >= 7 && (b.scores[k] || 0) >= 7)
    .sort((x, y) => (b.scores[y] + a.scores[y]) - (b.scores[x] + a.scores[x]))
    .slice(0, 2).map((k) => LABEL[k]);
}
function similarTo(city) {
  const ranked = CITIES.filter((c) => c.id !== city.id).map((c) => ({ c, d: dist(city, c) })).sort((a, b) => a.d - b.d);
  const out = [], perCountry = {};
  for (const { c } of ranked) {
    const cnt = perCountry[c.country] || 0;
    if (cnt >= 2) continue; // variety: max 2 per country
    perCountry[c.country] = cnt + 1;
    out.push(c);
    if (out.length === 6) break;
  }
  return out;
}

function sectionHtml(city) {
  const cards = similarTo(city).map((c) => {
    const sc = nomadScore(c);
    const shared = sharedStrengths(city, c);
    const why = shared.length ? `Both strong in ${esc(shared.join(' & '))}` : `Nomad Score ${sc}`;
    return `        <a class="sim-card" href="/cities/${c.id}">
          <span class="sim-card-img"><img src="/images/cities/${c.id}-card.webp" alt="${esc(c.name)}, ${esc(c.country)}" loading="lazy" onerror="this.closest('.sim-card-img').style.background='var(--color-sand,#f6f1e7)';this.remove();"><span class="sim-card-score">${sc}</span></span>
          <span class="sim-card-body"><span class="sim-card-name">${esc(c.name)}</span><span class="sim-card-country">${esc(c.country)}</span><span class="sim-card-why">${why}</span></span>
        </a>`;
  }).join('\n');
  return `    <!-- similar-cities -->
    <section class="container sim-cities" aria-label="Cities with a similar vibe">
      <div class="sim-head">
        <h2>Cities with a Similar Vibe to ${esc(city.name)}</h2>
        <p>Different places that score alike across our 13 categories, if you like ${esc(city.name)}, these tend to feel similar.</p>
      </div>
      <div class="sim-grid">
${cards}
      </div>
    </section>
`;
}

let added = 0, refreshed = 0, subFix = 0, skipped = 0;
for (const c of CITIES) {
  const abs = path.join(ROOT, 'cities', c.id + '.html');
  if (!fs.existsSync(abs)) { skipped++; continue; }
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  // 1) similar-cities section (update-in-place else insert before city-seo-explore)
  const secRe = /    <!-- similar-cities -->[\s\S]*?<\/section>\n/;
  const block = sectionHtml(c);
  if (secRe.test(html)) { html = html.replace(secRe, block); refreshed++; }
  else if (/<section class="container city-seo-explore"/.test(html)) {
    html = html.replace(/(\s*)<section class="container city-seo-explore"/, `\n${block}$1<section class="container city-seo-explore"`);
    added++;
  } else skipped++;

  // 2) disambiguate the geographic carousel's subtitle
  if (html.includes('Cities with similar vibes to ')) {
    html = html.replace(/Cities with similar vibes to [^<]*/g, 'Popular nearby cities');
    subFix++;
  }

  if (html !== before) fs.writeFileSync(abs, html);
}
console.log(`Similar cities: added ${added}, refreshed ${refreshed}, subtitle fixed ${subFix}, skipped ${skipped} of ${CITIES.length}`);
