/**
 * Home differentiation: the homepage no longer hosts the full city explorer
 * (that now lives on /cities). This:
 *   0. Extracts the inline CITY_REGIONS map into a shared city-regions.js.
 *   1. Replaces the #cities <section> with a lean "two ways to find your city"
 *      teaser (2 CTAs -> /wheel and /cities + a top-rated top-8 grid).
 *   2. Replaces the ~755-line explorer <script> with a small teaser renderer.
 * One-shot (guarded). Usage: node scripts/home_teaser.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const idx = path.join(ROOT, 'index.html');
let html = fs.readFileSync(idx, 'utf8');

if (/id="citiesGrid"[\s\S]{0,400}?top 8 cities rendered by JS/.test(html)) {
  console.log('Already applied — skipping.');
  process.exit(0);
}

// 0. Extract CITY_REGIONS -> city-regions.js -----------------------------------
const crMatch = html.match(/const CITY_REGIONS = \{[\s\S]*?\n\s*\};/);
if (!crMatch) { console.error('CITY_REGIONS block not found'); process.exit(1); }
const regionsFile = `// Region mapping (city.id -> region slug). Single source of truth shared by the
// homepage and the /cities browse filters. Extracted from the old homepage explorer.
${crMatch[0].replace(/^\s+/gm, (s) => s.replace(/^ {6}/, ''))}

if (typeof module !== 'undefined' && module.exports) module.exports = CITY_REGIONS;
`;
fs.writeFileSync(path.join(ROOT, 'city-regions.js'), regionsFile);

// 1. Replace the #cities section ----------------------------------------------
const NEW_SECTION = `<section class="section" id="cities">
      <div class="container">
        <div style="text-align:center; max-width:820px; margin:0 auto;">
          <h2 style="font-family:'DM Serif Display',serif; font-size:clamp(1.9rem,4.5vw,2.7rem); color:var(--color-ink); line-height:1.15; margin:0 0 .85rem;">Two ways to find your city</h2>
          <p style="color:var(--color-charcoal); font-size:1.12rem; line-height:1.7; margin:0 auto; max-width:660px;">We rate 410 cities on the 13 things that matter most to digital nomads &mdash; cost of living, WiFi, safety, climate, visas and more. Match your priorities to a city with the Nomad Wheel, or browse and compare them all yourself.</p>
          <div style="display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center; margin-top:1.6rem;">
            <a href="wheel" class="btn btn-primary btn-lg">Find your match on the Wheel &rarr;</a>
            <a href="cities" class="btn btn-secondary btn-lg">Browse &amp; compare all cities</a>
          </div>
        </div>

        <h3 style="text-align:center; font-family:'DM Serif Display',serif; color:var(--color-ink); font-size:1.5rem; margin:3.5rem 0 1.75rem;">Top-rated cities right now</h3>
        <div class="cities-grid" id="citiesGrid">
          <!-- top 8 cities rendered by JS; the static links above keep /cities crawlable -->
        </div>
      </div>
    </section>`;

const secRe = /<section class="section" id="cities">[\s\S]*?<\/section>(?=\s*<\/main>)/;
if (!secRe.test(html)) { console.error('#cities section not matched'); process.exit(1); }
// NOTE: replacement FUNCTIONS so '$' in the markup/JS (e.g. cost '$'+...) is inserted
// literally and never interpreted as a $'/$& replacement pattern.
html = html.replace(secRe, () => NEW_SECTION);

// 2. Replace the explorer <script> with the teaser renderer -------------------
const NEW_SCRIPT = `<script>
    // Home city teaser: top-rated cities (static baseline score, links into /cities).
    // The full filter/sort explorer now lives on /cities; home just funnels there + to /wheel.
    (function () {
      var grid = document.getElementById('citiesGrid');
      if (!grid || typeof CITIES === 'undefined') return;
      var CATS = [['climate','Climate'],['cost','Cost'],['wifi','WiFi'],['nightlife','Nightlife'],['nature','Nature'],['safety','Safety'],['food','Food'],['community','Community'],['english','English'],['visa','Visa'],['culture','Culture'],['cleanliness','Clean'],['airquality','Air']];
      function overall(c){ var s=c.scores||{},t=0,n=0; CATS.forEach(function(k){ if(typeof s[k[0]]==='number'){t+=s[k[0]];n++;} }); return n? t/n : 0; }
      function cls(v){ return v>=8?'excellent':v>=6?'good':v>=4?'average':'below'; }
      function nscore(c){ var r=overall(c); return Math.max(2.5, Math.min(9.9, 6.9 + (r - 6.47) / 0.44 * 1.05)); }
      var flag = (typeof flagSvg==='function') ? flagSvg : function(e){return e;};
      var featured = CITIES.slice().sort(function(a,b){ return overall(b)-overall(a); }).slice(0,8);
      grid.innerHTML = featured.map(function(city,index){
        var sc = nscore(city).toFixed(1);
        var cost = city.costPerMonth ? '$'+city.costPerMonth.toLocaleString() : 'N/A';
        var stats = CATS.map(function(k){
          var v = (city.scores && typeof city.scores[k[0]]==='number') ? city.scores[k[0]] : 0;
          return '<div class="overlay-stat"><div class="overlay-stat-header"><span class="overlay-stat-label">'+k[1]+'</span><span class="overlay-stat-value">'+v+'</span></div><div class="overlay-stat-bar"><div class="overlay-stat-fill '+cls(v)+'" style="width:'+(v*10)+'%"></div></div></div>';
        }).join('');
        return '<article class="city-card fade-in" data-city-id="'+city.id+'" style="animation-delay:'+(index*50)+'ms">'
          + '<div class="city-card-image-container">'
          + '<img src="'+city.image+'" alt="'+city.name+', '+city.country+'" class="city-card-image" loading="lazy">'
          + '<div class="city-card-overlay"><div class="overlay-stats">'+stats+'</div></div>'
          + '</div>'
          + '<div class="city-card-body">'
          + '<div class="city-card-header"><div class="city-card-location"><span class="city-card-flag">'+flag(city.flag)+'</span><div><h2 class="city-card-name">'+city.name+'</h2><span class="city-card-country">'+city.country+'</span></div></div>'
          + '<div class="nomad-score '+cls(nscore(city))+'"><span class="nomad-score-value">'+sc+'</span><span class="nomad-score-label">Score</span></div></div>'
          + '<div class="city-card-info"><div class="city-card-climate-type">'+(city.climateType||'N/A')+'</div><div class="city-card-cost"><span class="cost-label">~'+cost+'</span><span class="cost-period">/month</span></div></div>'
          + '<a href="cities/'+city.id+'" class="btn btn-primary city-card-action">View City &rarr;</a>'
          + '</div></article>';
      }).join('');
    })();
  </script>`;

const scrRe = /<script>\s*(?:(?!<\/script>)[\s\S])*?const CITY_REGIONS(?:(?!<\/script>)[\s\S])*?<\/script>/;
if (!scrRe.test(html)) { console.error('explorer script not matched'); process.exit(1); }
html = html.replace(scrRe, () => NEW_SCRIPT);

fs.writeFileSync(idx, html);
console.log('Home teaser applied. city-regions.js written (' + (crMatch[0].match(/:/g) || []).length + ' entries).');
