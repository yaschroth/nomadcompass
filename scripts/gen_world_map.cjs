/**
 * Builds /map (map.html): an interactive, zoomable world map of every rated city, plotted
 * by lat/lng on an equirectangular world background (assets/world-map.webp, true 2:1 so
 * left=(lng+180)/360, top=(90-lat)/180). Each dot is a real <a href="/cities/<slug>">
 * (crawlable + clickable) with a hover/tap popover. Full filter bar (search, region,
 * country, climate, min-score, 10 category sliders, reset) reusing styles/city-filters.css,
 * plus pan + zoom (buttons, wheel, drag). Run the head/body sweeps afterwards.
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
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America & the Caribbean', oceania: 'Oceania' };
const money = (v) => typeof v === 'number' ? '$' + v.toLocaleString('en-US') + '/mo' : 'n/a';
const dotColor = (s) => s >= 8 ? '#C0392B' : s >= 7 ? '#C4622E' : s >= 6 ? '#9E7B1E' : '#5C6672';
const SLIDER_CATS = [['cost', 'Affordability'], ['wifi', 'WiFi'], ['safety', 'Safety'], ['climate', 'Climate'], ['nightlife', 'Nightlife'], ['nature', 'Nature'], ['food', 'Food'], ['community', 'Community'], ['english', 'English'], ['visa', 'Visa']];

const cities = m.exports.filter((c) => c && c.id && typeof c.lat === 'number' && typeof c.lng === 'number');
const dots = cities.map((c) => {
  const s = nomadScore(c);
  const left = ((c.lng + 180) / 360 * 100).toFixed(3);
  const top = ((90 - c.lat) / 180 * 100).toFixed(3);
  const sc = CK.map((k) => (typeof c.scores[k] === 'number' ? c.scores[k] : 0)).join(',');
  return `<a class="wm-dot" href="/cities/${c.id}" style="left:${left}%;top:${top}%;--dc:${dotColor(s)}" data-n="${esc(c.name)}" data-c="${esc(c.country)}" data-cl="${(c.country || '').toLowerCase()}" data-s="${s}" data-cost="${esc(money(c.costPerMonth))}" data-r="${REGION[c.id] || ''}" data-clim="${esc(c.climateType || '')}" data-sc="${sc}" aria-label="${esc(c.name)}, ${esc(c.country)} (Nomad Score ${s})"></a>`;
}).join('\n      ');

const regionOptions = Object.keys(REGION_NAMES).map((r) => `<option value="${r}">${REGION_NAMES[r]}</option>`).join('');
const countryOptions = [...new Set(cities.map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((c) => `<option value="${c.toLowerCase()}">${esc(c)}</option>`).join('');
const climateOptions = [...new Set(cities.map((c) => c.climateType).filter(Boolean))].sort().map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
const slidersMarkup = SLIDER_CATS.map(([cat, label]) => `              <div class="slider-group" data-category="${cat}">
                <div class="slider-header"><label class="slider-label">${label}</label><span class="slider-value" id="${cat}Value">1 - 10</span></div>
                <div class="dual-range">
                  <input type="range" class="filter-slider filter-slider-min" id="filter_${cat}_min" min="1" max="10" value="1" aria-label="${label} minimum">
                  <input type="range" class="filter-slider filter-slider-max" id="filter_${cat}_max" min="1" max="10" value="10" aria-label="${label} maximum">
                  <div class="slider-track"></div><div class="slider-range" id="${cat}Range"></div>
                </div>
              </div>`).join('\n');

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}${h === '/map' ? ' active' : ''}">${t}</a></li>`).join('');
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

const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Digital Nomad World Map', url: BASE + '/map', description: `An interactive map of ${cities.length} digital nomad cities worldwide, plotted by location and scored across 13 categories.` };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Nomad World Map: ${cities.length} Cities Mapped | The Nomad HQ</title>
  <meta name="description" content="Explore ${cities.length} digital nomad cities on an interactive, zoomable world map. Filter by region, country, climate and Nomad Score, then open any city's guide.">
  <link rel="canonical" href="${BASE}/map">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Digital Nomad World Map | The Nomad HQ">
  <meta property="og:description" content="An interactive, zoomable world map of ${cities.length} nomad cities, filterable by region, country, climate and Nomad Score.">
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
  <link rel="stylesheet" href="/styles/city-filters.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    .wm-wrap{max-width:1280px;margin:0 auto;padding:calc(var(--nav-height,64px) + 2rem) var(--space-4,1rem) 1rem;}
    .wm-eyebrow{display:inline-block;font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:var(--color-terracotta);margin:0 0 .6rem;}
    .wm-wrap h1{font-family:'DM Serif Display',serif;font-size:clamp(2rem,5vw,3rem);line-height:1.08;color:var(--color-ink);margin:0 0 .6rem;}
    .wm-wrap .sub{font-size:var(--text-lg);color:var(--color-stone);line-height:1.6;margin:0 0 1.5rem;max-width:66ch;}
    .wm-count{font-size:.9rem;color:var(--color-stone);margin:.8rem 0 .6rem;}
    .wm-map{position:relative;width:100%;aspect-ratio:2/1;background:#eef1f4;border:1px solid var(--color-sand-dark,#e3d9c6);border-radius:12px;overflow:hidden;touch-action:none;cursor:grab;}
    .wm-map.grabbing{cursor:grabbing;}
    .wm-inner{position:absolute;inset:0;transform-origin:0 0;background:url('/assets/world-map.webp') center/100% 100% no-repeat;--z:1;will-change:transform;}
    .wm-dot{position:absolute;width:calc(11px / var(--z));height:calc(11px / var(--z));margin:calc(-5.5px / var(--z)) 0 0 calc(-5.5px / var(--z));border-radius:50%;background:var(--dc);box-shadow:0 0 0 calc(1.5px / var(--z)) rgba(255,255,255,.85);transition:opacity .15s;cursor:pointer;z-index:2;}
    .wm-dot:hover,.wm-dot:focus{z-index:5;outline:none;box-shadow:0 0 0 calc(2px / var(--z)) #fff, 0 2px 8px rgba(0,0,0,.35);}
    .wm-dot.dim{opacity:.1;pointer-events:none;}
    .wm-zoom{position:absolute;top:.7rem;right:.7rem;z-index:8;display:flex;flex-direction:column;gap:.35rem;}
    .wm-zoom button{width:36px;height:36px;border:1px solid var(--color-sand-dark,#e3d9c6);background:rgba(255,255,255,.95);border-radius:9px;font-size:1.2rem;font-weight:700;color:var(--color-ink);cursor:pointer;line-height:1;box-shadow:0 2px 6px rgba(15,23,42,.12);}
    .wm-zoom button:hover{border-color:var(--color-terracotta);color:var(--color-terracotta);}
    .wm-zoom .wm-reset{font-size:.7rem;font-weight:600;}
    .wm-legend{display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0 0;font-size:.82rem;color:var(--color-stone);}
    .wm-legend span{display:inline-flex;align-items:center;gap:.4rem;}
    .wm-legend i{width:11px;height:11px;border-radius:50%;display:inline-block;}
    .wm-hint{font-size:.8rem;color:var(--color-stone);margin:.5rem 0 0;}
    .wm-pop{position:fixed;z-index:50;pointer-events:none;background:#0f172a;color:#fff;border-radius:10px;padding:.7rem .85rem;box-shadow:0 12px 30px rgba(15,23,42,.3);width:210px;opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s;}
    .wm-pop.show{opacity:1;transform:translateY(0);}
    .wm-pop b{font-family:'DM Serif Display',serif;font-size:1.1rem;display:block;}
    .wm-pop .wm-pop-c{color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:.4rem;}
    .wm-pop .wm-pop-row{display:flex;justify-content:space-between;font-size:.85rem;margin-top:.15rem;}
    .wm-pop .wm-pop-go{color:#ff8863;font-size:.8rem;font-weight:600;margin-top:.5rem;}
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <div class="wm-wrap">
      <span class="wm-eyebrow">The Nomad HQ World Map</span>
      <h1>The Digital Nomad World Map</h1>
      <p class="sub">Every one of our ${cities.length} rated cities, plotted where it actually is. Filter, zoom in, hover a dot for the numbers, and open the full guide.</p>

      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-group"><label class="filter-label" for="wmSearch">Search</label><input type="search" class="filter-input" id="wmSearch" placeholder="City or country&hellip;" aria-label="Search cities"></div>
          <div class="filter-group"><label class="filter-label" for="wmRegion">Region</label><select class="filter-select" id="wmRegion"><option value="all">All Regions</option>${regionOptions}</select></div>
          <div class="filter-group"><label class="filter-label" for="wmCountry">Country</label><select class="filter-select" id="wmCountry"><option value="all">All Countries</option>${countryOptions}</select></div>
          <div class="filter-group"><label class="filter-label" for="wmClimate">Climate</label><select class="filter-select" id="wmClimate"><option value="all">All Climates</option>${climateOptions}</select></div>
          <div class="filter-group"><label class="filter-label" for="wmMin">Min Score</label><select class="filter-select" id="wmMin"><option value="0">Any</option><option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select></div>
          <button type="button" class="advanced-filters-btn" id="wmAdvBtn" aria-expanded="false" aria-controls="wmSliders">
            <svg class="filter-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Advanced Filters <span class="filter-badge" id="wmBadge"></span>
            <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <div class="sliders-panel" id="wmSliders">
          <div class="sliders-grid">
${slidersMarkup}
          </div>
          <button type="button" class="reset-filters-btn" id="wmReset">Reset All Filters</button>
        </div>
      </div>

      <p class="wm-count" id="wmCount"></p>
      <div class="wm-map" id="wmMap">
        <div class="wm-inner" id="wmInner">
      ${dots}
        </div>
        <div class="wm-zoom">
          <button type="button" id="wmZoomIn" aria-label="Zoom in">+</button>
          <button type="button" id="wmZoomOut" aria-label="Zoom out">&minus;</button>
          <button type="button" class="wm-reset" id="wmZoomReset" aria-label="Reset view">Reset</button>
        </div>
      </div>
      <p class="wm-hint">Scroll or use + / &minus; to zoom, drag to pan. Click a dot to open the city guide.</p>
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
      var CK=${JSON.stringify(CK)};
      var map=document.getElementById('wmMap'),inner=document.getElementById('wmInner'),dots=[].slice.call(inner.querySelectorAll('.wm-dot'));
      var pop=document.getElementById('wmPop'),count=document.getElementById('wmCount');
      var els={search:'wmSearch',region:'wmRegion',country:'wmCountry',clim:'wmClimate',min:'wmMin'};
      for(var k in els)els[k]=document.getElementById(els[k]);
      var cats=${JSON.stringify(SLIDER_CATS.map((x) => x[0]))};
      var sliders={};cats.forEach(function(c){sliders[c]={min:document.getElementById('filter_'+c+'_min'),max:document.getElementById('filter_'+c+'_max'),val:document.getElementById(c+'Value'),range:document.getElementById(c+'Range')};});
      // pre-parse per-dot scores
      dots.forEach(function(d){d._sc=d.dataset.sc.split(',').map(Number);});

      function badge(){var n=0;cats.forEach(function(c){if(+sliders[c].min.value>1||+sliders[c].max.value<10)n++;});if(els.min.value!=='0')n++;var b=document.getElementById('wmBadge');b.textContent=n?n:'';b.style.display=n?'inline-flex':'none';}
      function updRange(c){var s=sliders[c],mn=+s.min.value,mx=+s.max.value;if(mn>mx){var t=mn;mn=mx;mx=t;}s.val.textContent=mn+' - '+mx;s.range.style.left=((mn-1)/9*100)+'%';s.range.style.right=(100-(mx-1)/9*100)+'%';}
      function apply(){
        var q=(els.search.value||'').trim().toLowerCase(),rg=els.region.value,co=els.country.value,cl=els.clim.value,ms=parseFloat(els.min.value)||0;
        var lo={},hi={};cats.forEach(function(c){lo[c]=Math.min(+sliders[c].min.value,+sliders[c].max.value);hi[c]=Math.max(+sliders[c].min.value,+sliders[c].max.value);});
        var n=0;
        dots.forEach(function(d){
          var ok=true;
          if(q&&(d.dataset.n.toLowerCase().indexOf(q)<0&&d.dataset.c.toLowerCase().indexOf(q)<0))ok=false;
          if(ok&&rg!=='all'&&d.dataset.r!==rg)ok=false;
          if(ok&&co!=='all'&&d.dataset.cl!==co)ok=false;
          if(ok&&cl!=='all'&&d.dataset.clim!==cl)ok=false;
          if(ok&&parseFloat(d.dataset.s)<ms)ok=false;
          if(ok){for(var i=0;i<cats.length;i++){var c=cats[i];var v=d._sc[CK.indexOf(c)];if(v<lo[c]||v>hi[c]){ok=false;break;}}}
          d.classList.toggle('dim',!ok);if(ok)n++;
        });
        count.textContent=n+' of '+dots.length+' cities shown';badge();
      }
      Object.keys(els).forEach(function(k){els[k].addEventListener('input',apply);els[k].addEventListener('change',apply);});
      cats.forEach(function(c){['min','max'].forEach(function(w){sliders[c][w].addEventListener('input',function(){updRange(c);apply();});});updRange(c);});
      document.getElementById('wmAdvBtn').addEventListener('click',function(){var open=document.getElementById('wmSliders').classList.toggle('open');this.classList.toggle('active');this.setAttribute('aria-expanded',open);});
      document.getElementById('wmReset').addEventListener('click',function(){els.search.value='';els.region.value='all';els.country.value='all';els.clim.value='all';els.min.value='0';cats.forEach(function(c){sliders[c].min.value=1;sliders[c].max.value=10;updRange(c);});apply();});

      // popover
      function show(d){pop.innerHTML='<b>'+d.dataset.n+'</b><span class="wm-pop-c">'+d.dataset.c+'</span><div class="wm-pop-row"><span>Nomad Score</span><span>'+d.dataset.s+'</span></div><div class="wm-pop-row"><span>Cost</span><span>'+d.dataset.cost+'</span></div><div class="wm-pop-go">View guide &rarr;</div>';var r=d.getBoundingClientRect();pop.style.left=Math.min(Math.max(r.left+r.width/2-105,8),window.innerWidth-218)+'px';pop.style.top=Math.max(r.top-pop.offsetHeight-10,8)+'px';pop.classList.add('show');}
      function hide(){pop.classList.remove('show');}
      dots.forEach(function(d){d.addEventListener('mouseenter',function(){show(d);});d.addEventListener('mouseleave',hide);d.addEventListener('focus',function(){show(d);});d.addEventListener('blur',hide);});

      // pan + zoom
      var z=1,tx=0,ty=0;
      function clamp(){var w=map.clientWidth,h=map.clientHeight;tx=Math.min(0,Math.max(w*(1-z),tx));ty=Math.min(0,Math.max(h*(1-z),ty));}
      function render(){clamp();inner.style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';inner.style.setProperty('--z',z);}
      function zoomAt(cx,cy,nz){nz=Math.min(8,Math.max(1,nz));var wx=(cx-tx)/z,wy=(cy-ty)/z;z=nz;tx=cx-wx*z;ty=cy-wy*z;render();}
      map.addEventListener('wheel',function(e){e.preventDefault();var r=map.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,z*(e.deltaY<0?1.2:1/1.2));},{passive:false});
      document.getElementById('wmZoomIn').addEventListener('click',function(){zoomAt(map.clientWidth/2,map.clientHeight/2,z*1.4);});
      document.getElementById('wmZoomOut').addEventListener('click',function(){zoomAt(map.clientWidth/2,map.clientHeight/2,z/1.4);});
      document.getElementById('wmZoomReset').addEventListener('click',function(){z=1;tx=0;ty=0;render();});
      // drag pan (mouse + touch); suppress the click-through navigation when dragging
      var dragging=false,moved=false,sx=0,sy=0,stx=0,sty=0;
      function down(x,y){dragging=true;moved=false;sx=x;sy=y;stx=tx;sty=ty;map.classList.add('grabbing');hide();}
      function move(x,y){if(!dragging)return;var dx=x-sx,dy=y-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;tx=stx+dx;ty=sty+dy;render();}
      function up(){dragging=false;map.classList.remove('grabbing');}
      map.addEventListener('mousedown',function(e){down(e.clientX,e.clientY);});
      window.addEventListener('mousemove',function(e){move(e.clientX,e.clientY);});
      window.addEventListener('mouseup',up);
      map.addEventListener('touchstart',function(e){if(e.touches.length===1)down(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
      map.addEventListener('touchmove',function(e){if(e.touches.length===1){move(e.touches[0].clientX,e.touches[0].clientY);}},{passive:true});
      map.addEventListener('touchend',up);
      dots.forEach(function(d){d.addEventListener('click',function(e){if(moved){e.preventDefault();}});});

      render();apply();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'map.html'), html);
console.log(`Wrote map.html with ${cities.length} city dots + full filters + zoom/pan.`);
