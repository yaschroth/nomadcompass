require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Adds the city cards that cities.html is missing, in place, without regenerating the page.
 *
 * generate_cities_hub.cjs owns cities.html, but its template predates seven sitewide features
 * (GA4 and consent, the cookie banner, the brand-graph JSON-LD, the tools dropdown, the nav
 * search, the skip link and the consent script), so _safe_write refuses to let it run and has
 * done for some time. The consequence is that /cities has been silently stale: after batch 33
 * the browse page listed 771 cities while the site had 801, and /cities is the page Googlebot
 * follows to discover city guides at all. Forcing the generator would fix the count and strip
 * the seven features, which is a worse trade.
 *
 * So this does the narrow thing instead: build a card for each missing city using the same
 * score formula and the same markup the generator emits, insert it at the right position in the
 * score-sorted grid, top up the filter dropdowns if a card introduces a new country, region or
 * climate, and correct the visible count. Everything else in the file is left exactly as it is.
 *
 * The proper fix is to bring the generator's template up to date. Until someone does that, this
 * keeps the browse page honest.
 *
 * Usage: node scripts/apply_cities_hub_additions.cjs [--apply]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'cities.html');
const APPLY = process.argv.includes('--apply');

const m = {};
new Function('m', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';m.d=CITIES')(m);
const CITY_REGIONS = require(path.join(ROOT, 'city-regions.js'));

// Identical to generate_cities_hub.cjs. Duplicated deliberately: that file is not modular, and a
// divergence here would put a different score on the card than on the city page.
const SCORE_KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community',
  'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const avgScore = (c) => {
  const s = c.scores || {}; let t = 0, n = 0;
  for (const k of SCORE_KEYS) { if (typeof s[k] === 'number') { t += s[k]; n++; } }
  return n ? t / n : null;
};
const nomadScore = (raw) => (raw == null ? null
  : Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)));

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const flagImg = (emoji) => {
  const pts = [...(emoji || '')];
  if (pts.length !== 2) return '';
  const code = pts.map((p) => String.fromCharCode(p.codePointAt(0) - 0x1f1e6 + 97)).join('');
  return `<img class="flag-img" src="/assets/flags/${code}.svg" alt="" loading="lazy">`;
};
const scoreClass = (s) => (s >= 8.5 ? 'excellent' : s >= 7 ? 'good' : s >= 5.5 ? 'fair' : 'poor');

function card(c) {
  const score = nomadScore(avgScore(c));
  const scores = SCORE_KEYS.map((k) => (c.scores || {})[k] ?? '').join(',');
  const cost = c.costPerMonth || null;
  return `<article class="city-card fade-in" data-name="${escapeHtml(c.name.toLowerCase())}"`
    + ` data-country="${escapeHtml(String(c.country).toLowerCase())}" data-slug="${c.id}"`
    + ` data-region="${CITY_REGIONS[c.id] || ''}" data-climate="${escapeHtml(c.climateType || '')}"`
    + ` data-cost="${cost || ''}" data-score="${score ? score.toFixed(2) : ''}"`
    + ` data-scores="${scores}" data-tz="${typeof c.timezone === 'number' ? c.timezone : ''}">
        <div class="city-card-image-container">
          <img src="/images/cities/${c.id}-card.webp" alt="${escapeHtml(c.name)}, ${escapeHtml(c.country)}" class="city-card-image" width="800" height="500" loading="lazy" decoding="async">
          <div class="city-card-overlay"></div>
        </div>
        <div class="city-card-body">
          <div class="city-card-header">
            <div class="city-card-location"><span class="city-card-flag">${flagImg(c.flag)}</span><div><h2 class="city-card-name">${escapeHtml(c.name)}</h2><span class="city-card-country">${escapeHtml(c.country)}</span></div></div>
            <div class="nomad-score ${scoreClass(score)}"><span class="nomad-score-value">${score ? score.toFixed(1) : ''}</span><span class="nomad-score-label">Score</span></div>
          </div>
          <div class="city-card-info">
            <div class="city-card-climate-type">${escapeHtml(c.climateType || '')}</div>
            <div class="city-card-cost"><span class="cost-label">~$${cost ? cost.toLocaleString('en-US') : ''}</span><span class="cost-period">/month</span></div>
          </div>
          <a href="/cities/${c.id}" class="btn btn-primary city-card-action">View City &rarr;</a>
        </div>
      </article>`;
}

let html = fs.readFileSync(FILE, 'utf8');
const present = new Set([...html.matchAll(/data-slug="([^"]+)"/g)].map((x) => x[1]));
const missing = m.d.filter((c) => !present.has(c.id));

console.log('cities.html lists ' + present.size + ' of ' + m.d.length);
if (missing.length) console.log('missing (' + missing.length + '): ' + missing.map((c) => c.id).join(', '));
else console.log('cards are complete; checking the filter data arrays anyway');

// Existing cards with their scores, so each new one can be slotted into the right place.
if (missing.length) {
const cardRe = /<article class="city-card fade-in"[\s\S]*?<\/article>/g;
const existing = [...html.matchAll(cardRe)].map((mm) => ({
  text: mm[0], at: mm.index,
  score: parseFloat((mm[0].match(/data-score="([\d.]*)"/) || [, '0'])[1]) || 0,
  name: (mm[0].match(/class="city-card-name">([^<]*)</) || [, ''])[1],
}));
if (!existing.length) { console.error('no existing cards found, refusing'); process.exit(1); }

// Insert highest score first, matching the generator's sort (score desc, then name).
const additions = missing
  .map((c) => ({ c, score: nomadScore(avgScore(c)) || 0, name: c.name }))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

// Build the full new grid rather than splicing one at a time, which keeps the ordering exact.
const merged = existing.map((e) => ({ text: e.text, score: e.score, name: e.name }))
  .concat(additions.map((a) => ({ text: card(a.c), score: a.score, name: a.name })))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

const first = existing[0].at;
const lastEnd = existing[existing.length - 1].at + existing[existing.length - 1].text.length;
  html = html.slice(0, first) + merged.map((x) => x.text).join('\n      ') + html.slice(lastEnd);
}

// Visible count, and the count the filter script resets to.
html = html.replace(/(<strong id="cityCount">)\d+(<\/strong>)/, `$1${m.d.length}$2`);

// The region and sort selects are left alone: they hold a fixed set of values. The country and
// city selects hold only an "all" option in the HTML and are filled at runtime, but NOT from the
// cards, which is the part that catches you out. They are filled from the two static arrays
// handled below.

// The two filter dropdowns that are NOT built from the cards. COUNTRY_DATA and CITY_DATA are
// static JSON arrays the generator bakes into the page, and the runtime script fills the country
// and city selects from them, not from the grid. Adding cards alone left Botswana out of the
// country filter and all thirty new cities out of the city filter, which is a filter that
// silently cannot reach them. Keep both in step with the cards.
{
  const cdRe = /(var CITY_DATA = )(\[[\s\S]*?\])(;)/;
  const coRe = /(var COUNTRY_DATA = )(\[[\s\S]*?\])(;)/;
  const cdM = html.match(cdRe), coM = html.match(coRe);
  if (!cdM || !coM) { console.error('CITY_DATA or COUNTRY_DATA not found, refusing'); process.exit(1); }

  const cityData = JSON.parse(cdM[2]);
  const haveCity = new Set(cityData.map((x) => x.v));
  const addCity = m.d.filter((c) => !haveCity.has(c.id))
    .map((c) => ({ v: c.id, t: c.name, c: String(c.country).toLowerCase() }));
  const nextCity = cityData.concat(addCity).sort((a, b) => a.t.localeCompare(b.t));

  const countryData = JSON.parse(coM[2]);
  const haveCountry = new Set(countryData.map((x) => x.t));
  const addCountry = [...new Map(m.d.filter((c) => !haveCountry.has(c.country))
    .map((c) => [c.country, { v: String(c.country).toLowerCase(), t: c.country, r: CITY_REGIONS[c.id] || '' }])).values()];
  const nextCountry = countryData.concat(addCountry).sort((a, b) => a.t.localeCompare(b.t));

  html = html.replace(cdRe, (x, a, b, cc) => a + JSON.stringify(nextCity) + cc)
             .replace(coRe, (x, a, b, cc) => a + JSON.stringify(nextCountry) + cc);
  console.log('  CITY_DATA: ' + cityData.length + ' -> ' + nextCity.length
    + (addCity.length ? ' (+' + addCity.map((x) => x.t).join(', ') + ')' : ''));
  console.log('  COUNTRY_DATA: ' + countryData.length + ' -> ' + nextCountry.length
    + (addCountry.length ? ' (+' + addCountry.map((x) => x.t).join(', ') + ')' : ''));
}

const after = [...html.matchAll(/data-slug="([^"]+)"/g)].length;
console.log('grid now holds ' + after + ' cards');
if (after !== m.d.length) { console.error('expected ' + m.d.length + ', refusing to write'); process.exit(1); }

if (!APPLY) { console.log('\nDry run. Re-run with --apply to write.'); process.exit(0); }
fs.writeFileSync(FILE, html);
console.log('wrote cities.html');
