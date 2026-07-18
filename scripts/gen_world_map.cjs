/**
 * Builds /map (map.html): an interactive world map of every rated city, plotted by
 * lat/lng on an equirectangular world background (assets/world-map.webp, true 2:1 so
 * left=(lng+180)/360, top=(90-lat)/180). Each dot is a real <a href="/cities/<slug>">
 * (crawlable + clickable) with a hover/tap popover (score, cost, country). Region +
 * min-score filters dim non-matching dots. Nav/footer match the sitewide 7-item set;
 * run the head/body sweeps (entity, analytics, nav search) afterwards.
 * Usage: node scripts/gen_world_map.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
function nomadScore(c) { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); }
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America & Caribbean', oceania: 'Oceania' };
const money = (v) => typeof v === 'number' ? '$' + v.toLocaleString('en-US') + '/mo' : 'n/a';
const dotColor = (s) => s >= 8 ? '#C0392B' : s >= 7 ? '#C4622E' : s >= 6 ? '#9E7B1E' : '#5C6672';

const cities = m.exports.filter((c) => c && c.id && typeof c.lat === 'number' && typeof c.lng === 'number');
const dots = cities.map((c) => {
  const s = nomadScore(c);
  const left = ((c.lng + 180) / 360 * 100).toFixed(3);
  const top = ((90 - c.lat) / 180 * 100).toFixed(3);
  const region = REGION[c.id] || '';
  return `<a class="wm-dot" href="/cities/${c.id}" style="left:${left}%;top:${top}%;--dc:${dotColor(s)}" data-n="${esc(c.name)}" data-c="${esc(c.country)}" data-s="${s}" data-cost="${esc(money(c.costPerMonth))}" data-r="${region}" aria-label="${esc(c.name)}, ${esc(c.country)} (Nomad Score ${s})"></a>`;
}).join('\n      ');

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}">${t}</a></li>`).join('');
  return `<nav class="nav" id="mainNav"><div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">${li('nav-link')}</ul>
      <div class="nav-actions"><a href="/login" class="nav-login">Login</a><a href="/signup" class="btn btn-primary nav-signup">Sign Up</a></div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div><div class="nav-mobile" id="navMobile"><ul class="nav-mobile-links">${li('nav-mobile-link')}</ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div></div></nav>
  <script>(function(){var n=document.getElementById('mainNav'),t=document.getElementById('navToggle'),mm=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');mm.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});window.addEventListener('scroll',function(){n.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}
function footerHtml() {
  return `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li><li><a href="/activities" class="footer-link">By Activity</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
}

const regionBtns = ['all', ...Object.keys(REGION_NAMES)].map((r) => `<button class="wm-chip${r === 'all' ? ' active' : ''}" data-region="${r}">${r === 'all' ? 'All regions' : REGION_NAMES[r]}</button>`).join('');

const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Digital Nomad World Map', url: BASE + '/map', description: `An interactive map of ${cities.length} digital nomad cities worldwide, plotted by location and scored across 13 categories.` };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Nomad World Map: ${cities.length} Cities Mapped | The Nomad HQ</title>
  <meta name="description" content="Explore ${cities.length} digital nomad cities on an interactive world map. Filter by region and Nomad Score, then open any city's full guide.">
  <link rel="canonical" href="${BASE}/map">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Digital Nomad World Map | The Nomad HQ">
  <meta property="og:description" content="An interactive world map of ${cities.length} nomad cities, filterable by region and Nomad Score.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/map">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    .wm-wrap{max-width:1280px;margin:0 auto;padding:calc(var(--nav-height,64px) + 2rem) var(--space-4,1rem) 1rem;}
    .wm-eyebrow{display:inline-block;font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:var(--color-terracotta);margin:0 0 .6rem;}
    .wm-wrap h1{font-family:'DM Serif Display',serif;font-size:clamp(2rem,5vw,3rem);line-height:1.08;color:var(--color-ink);margin:0 0 .6rem;}
    .wm-wrap .sub{font-size:var(--text-lg);color:var(--color-stone);line-height:1.6;margin:0 0 1.5rem;max-width:66ch;}
    .wm-controls{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:0 0 1rem;}
    .wm-chip{cursor:pointer;border:1px solid var(--color-sand-dark,#e3d9c6);background:#fff;color:var(--color-charcoal);border-radius:999px;padding:.4rem .9rem;font-size:.9rem;font-weight:600;font-family:inherit;transition:all .15s;}
    .wm-chip:hover{border-color:var(--color-terracotta);color:var(--color-terracotta);}
    .wm-chip.active{background:var(--color-ink,#0f172a);color:#fff;border-color:var(--color-ink,#0f172a);}
    .wm-score{margin-left:auto;display:flex;align-items:center;gap:.5rem;font-size:.9rem;color:var(--color-stone);}
    .wm-score select{font-family:inherit;font-size:.9rem;padding:.35rem .5rem;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:8px;background:#fff;color:var(--color-ink);}
    .wm-count{font-size:.9rem;color:var(--color-stone);margin:0 0 .6rem;}
    .wm-map{position:relative;width:100%;aspect-ratio:2/1;background:#eef1f4 url('/assets/world-map.webp') center/contain no-repeat;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:12px;overflow:hidden;}
    .wm-dot{position:absolute;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:var(--dc);box-shadow:0 0 0 1.5px rgba(255,255,255,.85);transition:transform .1s,opacity .15s;cursor:pointer;z-index:2;}
    .wm-dot:hover,.wm-dot:focus{transform:scale(1.9);z-index:5;outline:none;box-shadow:0 0 0 2px #fff,0 2px 8px rgba(0,0,0,.35);}
    .wm-dot.dim{opacity:.12;pointer-events:none;}
    .wm-legend{display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0 0;font-size:.82rem;color:var(--color-stone);}
    .wm-legend span{display:inline-flex;align-items:center;gap:.4rem;}
    .wm-legend i{width:11px;height:11px;border-radius:50%;display:inline-block;}
    .wm-pop{position:fixed;z-index:50;pointer-events:none;background:#0f172a;color:#fff;border-radius:10px;padding:.7rem .85rem;box-shadow:0 12px 30px rgba(15,23,42,.3);width:210px;opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s;}
    .wm-pop.show{opacity:1;transform:translateY(0);}
    .wm-pop b{font-family:'DM Serif Display',serif;font-size:1.1rem;display:block;}
    .wm-pop .wm-pop-c{color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:.4rem;}
    .wm-pop .wm-pop-row{display:flex;justify-content:space-between;font-size:.85rem;margin-top:.15rem;}
    .wm-pop .wm-pop-go{color:#ff8863;font-size:.8rem;font-weight:600;margin-top:.5rem;}
    @media (max-width:640px){.wm-dot{width:9px;height:9px;margin:-4.5px 0 0 -4.5px;}}
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <div class="wm-wrap">
      <span class="wm-eyebrow">The Nomad HQ World Map</span>
      <h1>The Digital Nomad World Map</h1>
      <p class="sub">Every one of our ${cities.length} rated cities, plotted where it actually is. Filter by region and Nomad Score, hover a dot for the numbers, and open the full guide.</p>
      <div class="wm-controls">
        ${regionBtns}
        <span class="wm-score"><label for="wmMin">Min Score</label><select id="wmMin"><option value="0">Any</option><option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select></span>
      </div>
      <p class="wm-count" id="wmCount"></p>
      <div class="wm-map" id="wmMap">
      ${dots}
      </div>
      <div class="wm-legend">
        <span><i style="background:#C0392B"></i> 8.0+</span>
        <span><i style="background:#C4622E"></i> 7.0 to 7.9</span>
        <span><i style="background:#9E7B1E"></i> 6.0 to 6.9</span>
        <span><i style="background:#5C6672"></i> below 6.0</span>
      </div>
    </div>
  </main>
  <div class="wm-pop" id="wmPop" role="tooltip"></div>
  ${footerHtml()}
  <script>
    (function(){
      var map=document.getElementById('wmMap'),dots=[].slice.call(map.querySelectorAll('.wm-dot')),pop=document.getElementById('wmPop'),count=document.getElementById('wmCount'),minSel=document.getElementById('wmMin');
      var region='all',min=0;
      function apply(){var n=0;dots.forEach(function(d){var okR=region==='all'||d.dataset.r===region,okS=parseFloat(d.dataset.s)>=min;var ok=okR&&okS;d.classList.toggle('dim',!ok);if(ok)n++;});count.textContent=n+' of '+dots.length+' cities shown';}
      document.querySelectorAll('.wm-chip').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.wm-chip').forEach(function(x){x.classList.remove('active');});b.classList.add('active');region=b.dataset.region;apply();});});
      minSel.addEventListener('change',function(){min=parseFloat(minSel.value)||0;apply();});
      function show(d){pop.innerHTML='<b>'+d.dataset.n+'</b><span class="wm-pop-c">'+d.dataset.c+'</span><div class="wm-pop-row"><span>Nomad Score</span><span>'+d.dataset.s+'</span></div><div class="wm-pop-row"><span>Cost</span><span>'+d.dataset.cost+'</span></div><div class="wm-pop-go">View guide &rarr;</div>';var r=d.getBoundingClientRect();var x=r.left+r.width/2,y=r.top;pop.style.left=Math.min(Math.max(x-105,8),window.innerWidth-218)+'px';pop.style.top=Math.max(y-pop.offsetHeight-10,8)+'px';pop.classList.add('show');}
      function hide(){pop.classList.remove('show');}
      dots.forEach(function(d){d.addEventListener('mouseenter',function(){show(d);});d.addEventListener('mouseleave',hide);d.addEventListener('focus',function(){show(d);});d.addEventListener('blur',hide);d.addEventListener('touchstart',function(e){show(d);},{passive:true});});
      apply();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'map.html'), html);
console.log(`Wrote map.html with ${cities.length} city dots (of ${m.exports.length} cities; ${m.exports.length - cities.length} lack lat/lng).`);
