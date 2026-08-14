require(require('path').join(__dirname, '_safe_write.cjs'));
/**
 * Injects the three city cards that sit in the homepage hero, as STATIC crawlable markup.
 *
 * Selection: the highest-scoring city in each of europe, asia and latam. Deliberately a spread
 * rather than the raw top three, which would be Lisbon, Barcelona and Porto: three European
 * cities, two of which repeat the grid one screen below, and nothing about the range of the
 * index. The spread shows three continents and a real cost range.
 *
 * Idempotent, writes only between the markers. Usage: node scripts/apply_home_hero_cards.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const rm = {};
new Function('module', 'window', fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8') + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports;

// Same formula as apply_home_city_cards.cjs and the three other places that carry it. If this
// ever diverges, the hero and the grid below it will disagree about the same city.
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const overall = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); return n ? t / n : 0; };
const nscore = (c) => Math.max(2.5, Math.min(9.9, 6.9 + (overall(c) - 6.47) / 0.44 * 1.05));

const PICK_REGIONS = ['europe', 'asia', 'latam'];
const sorted = m.exports.slice().sort((a, b) => overall(b) - overall(a));
const picks = PICK_REGIONS.map((r) => sorted.find((c) => REGION[c.id] === r));

const missing = PICK_REGIONS.filter((r, i) => !picks[i]);
if (missing.length) { console.error('No city found for region(s): ' + missing.join(', ')); process.exit(1); }

const noImage = picks.filter((c) => !c.image || !fs.existsSync(path.join(ROOT, c.image.replace(/^\//, ''))));
if (noImage.length) { console.error('Missing card image for: ' + noImage.map((c) => c.id).join(', ')); process.exit(1); }

const cards = picks.map((c) => {
  const code = iso(c.flag);
  const flag = code ? `<img src="/assets/flags/${code}.svg" alt="" width="16" height="12" loading="lazy">` : '';
  const cost = typeof c.costPerMonth === 'number' ? '$' + c.costPerMonth.toLocaleString('en-US') : 'n/a';
  return `          <li><a class="hero-pick" href="/cities/${c.id}">
            <img class="hero-pick-photo" src="${esc(c.image)}" alt="${esc(c.name)}, ${esc(c.country)}" width="104" height="104" loading="eager" decoding="async">
            <span class="hero-pick-body">
              <span>
                <span class="hero-pick-name">${esc(c.name)}</span>
                <span class="hero-pick-country">${flag}${esc(c.country)}</span>
              </span>
              <span class="hero-pick-meta">
                <span class="hero-pick-score">${nscore(c).toFixed(1)}</span>
                <span class="hero-pick-cost">${cost}<small> /mo</small></span>
              </span>
            </span>
          </a></li>`;
}).join('\n');

const abs = path.join(ROOT, 'index.html');
const html = fs.readFileSync(abs, 'utf8');
const re = /(<!-- hero-cards-start -->)[\s\S]*?(<!-- hero-cards-end -->)/;
if (!re.test(html)) { console.error('hero-cards markers not found in index.html'); process.exit(1); }

// Replacement MUST be a function: the cost strings contain "$1"/"$2", which String.replace
// would otherwise read as capture-group references. apply_home_city_cards.cjs hit this already.
const out = html.replace(re, (mm, a, b) => `${a}\n${cards}\n          ${b}`);

if (out === html) { console.log('Hero picks: no change.'); process.exit(0); }
fs.writeFileSync(abs, out);
console.log('Hero picks: ' + picks.map((c) => `${c.name} ${nscore(c).toFixed(1)}`).join(', '));
