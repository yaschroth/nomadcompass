/**
 * Builds /best-weather: a "where's warm in <month>?" finder. Pick a month (and optionally a
 * region / beach-only), and it ranks the cities with the most comfortable weather then, from
 * the precomputed Open-Meteo normals in assets/city-climate.js. Shareable via
 * ?month=jul&region=asia. Only cities with climate data are included. Run the head/body sweeps
 * (finish with apply_tools_nav.cjs) + sitemap afterwards. Usage: node scripts/build_best_weather.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

// [id, name, country, iso, region, score] for cities that have climate normals
const DATA = m.exports.filter((c) => c && c.id && CLIMATE[c.id]).map((c) => [c.id, c.name, c.country, iso(c.flag), REGION[c.id] || '', nomadScore(c)]);
const CLIM = {}; DATA.forEach((d) => { CLIM[d[0]] = CLIMATE[d[0]]; });

const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America', oceania: 'Oceania' };
const regionOptions = Object.keys(REGION_NAMES).map((r) => `<option value="${r}">${REGION_NAMES[r]}</option>`).join('');

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
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
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/best-weather" class="footer-link">Best Weather by Month</a></li><li><a href="/route" class="footer-link">Route Planner</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Best Weather by Month Finder', url: BASE + '/best-weather', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Find the digital nomad cities with the best weather in any month of the year.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Best Weather by Month', BASE + '/best-weather']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Weather by Month: Where to Go for Digital Nomads | The Nomad HQ</title>
  <meta name="description" content="Where is it warm and dry this month? Pick any month and see the digital nomad cities with the best weather, from 5-year climate averages. Filter by region.">
  <link rel="canonical" href="${BASE}/best-weather">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Best Weather by Month | The Nomad HQ">
  <meta property="og:description" content="Pick a month and find the nomad cities with the best weather then.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/best-weather">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600;700&display=swap">
  <link rel="preload" as="image" href="/assets/best-weather-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    .hub-hero { position: relative; width: 100%; min-height: 100vh; display: flex; align-items: flex-end; overflow: hidden; }
    .hub-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .hub-hero-overlay { position: relative; z-index: 1; width: 100%; padding: calc(var(--nav-height,64px) + 3rem) 0 3rem; background: linear-gradient(to top, rgba(15,23,42,.94), rgba(15,23,42,.66) 55%, rgba(15,23,42,.15) 88%, transparent); color:#fff; }
    .hub-hero::before { content:''; position:absolute; top:0;left:0;right:0; height:calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
    .hub-hero .container { max-width: 1040px; }
    .hub-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
    .hub-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.5rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
    .hub-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0; max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
    .bw-wrap { max-width:1180px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3.5rem; }
    .bw-controls { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.1rem 1.2rem; box-shadow:0 8px 24px rgba(15,23,42,.05); margin-bottom:1.6rem; }
    .bw-months { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:1rem; }
    .bw-mo { font-family:inherit; font-size:.9rem; font-weight:600; padding:.45rem .85rem; border-radius:999px; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); cursor:pointer; }
    .bw-mo:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .bw-mo.active { background:var(--color-terracotta); color:#fff; border-color:var(--color-terracotta); }
    .bw-filters { display:flex; flex-wrap:wrap; gap:.7rem 1.1rem; align-items:center; }
    .bw-filters label { font-size:.8rem; font-weight:600; color:var(--color-stone); }
    .bw-filters select { font-family:inherit; font-size:.92rem; padding:.45rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .bw-toggle { display:inline-flex; align-items:center; gap:.4rem; font-size:.9rem; color:var(--color-charcoal); cursor:pointer; }
    .bw-count { font-size:1rem; color:var(--color-charcoal); margin:0 0 1rem; } .bw-count b { color:var(--color-ink); }
    .bw-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1rem; }
    .bw-card { display:block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.1rem; text-decoration:none; box-shadow:0 6px 16px rgba(15,23,42,.05); transition:transform .15s, box-shadow .15s, border-color .15s; }
    .bw-card:hover { transform:translateY(-3px); box-shadow:0 14px 30px rgba(15,23,42,.1); border-color:var(--color-terracotta); }
    .bw-card-top { display:flex; align-items:center; gap:.5rem; }
    .bw-flag img { border-radius:3px; vertical-align:middle; }
    .bw-name { font-weight:700; color:var(--color-ink); font-size:1.05rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bw-score { flex:0 0 auto; font-size:.78rem; font-weight:800; color:#fff; background:var(--color-terracotta); border-radius:7px; padding:.1rem .4rem; }
    .bw-country { font-size:.8rem; color:var(--color-stone); margin:.15rem 0 .7rem; }
    .bw-wx { font-size:.95rem; color:var(--color-ink); font-weight:600; } .bw-wx .mut { color:var(--color-stone); font-weight:400; }
    .bw-verdict { display:inline-block; margin-top:.6rem; font-size:.74rem; font-weight:700; padding:.2rem .6rem; border-radius:999px; }
    .bw-v-ideal { background:#e6f0ea; color:#2f7d5a; } .bw-v-great { background:#fbf1e0; color:#b6821e; } .bw-v-good { background:var(--color-sand,#f4efe4); color:#8a7a55; } .bw-v-mild { background:#eef1f4; color:#64748b; }
    .bw-empty { color:var(--color-stone); padding:2rem 0; text-align:center; }
    .bw-share { margin-top:1.6rem; } .bw-share button { font-family:inherit; font-size:.85rem; font-weight:600; padding:.55rem 1.1rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); } .bw-share button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .bw-disclaim { font-size:.78rem; color:var(--color-stone); margin-top:1rem; }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/best-weather-hero.webp" alt="A leaning palm tree over the white sand of a tropical Seychelles beach" fetchpriority="high" width="1920" height="1440">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Trip tool</span>
        <h1>Where's warm this month?</h1>
        <p class="sub">Pick any month and see the nomad cities with the best weather then, ranked from five years of climate data. Plan your winter escape or chase an endless summer.</p>
      </div></div>
    </header>
    <div class="bw-wrap">
      <div class="bw-controls">
        <div class="bw-months" id="bwMonths"></div>
        <div class="bw-filters">
          <label for="bwRegion">Region</label>
          <select id="bwRegion"><option value="">Anywhere</option>${regionOptions}</select>
          <label class="bw-toggle"><input type="checkbox" id="bwBeach"> Beach weather only (25&deg;+, drier)</label>
        </div>
      </div>
      <p class="bw-count" id="bwCount"></p>
      <div class="bw-grid" id="bwGrid"></div>
      <div class="bw-share"><button type="button" id="bwShare">Copy share link</button></div>
      <p class="bw-disclaim">Rankings use 2019-2023 monthly climate averages (Open-Meteo), scored for warmth and dryness. Historical averages, not a forecast. ${DATA.length} cities with climate data are included.</p>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var CLIMATE=${JSON.stringify(CLIM)};
      var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
      var SH=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var SLUG=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      var grid=document.getElementById('bwGrid'),count=document.getElementById('bwCount'),monthsEl=document.getElementById('bwMonths'),regionSel=document.getElementById('bwRegion'),beachChk=document.getElementById('bwBeach');
      var cur=(new Date()).getMonth();
      function comfort(hi,lo,r){var avg=(hi+lo)/2;var tS=Math.max(0,100-Math.abs(avg-24)*5);var rS=Math.max(0,100-(r==null?40:r)*0.5);return 0.65*tS+0.35*rS;}
      function verdict(cf){if(cf>=80)return ['Ideal','bw-v-ideal'];if(cf>=64)return ['Great','bw-v-great'];if(cf>=48)return ['Good','bw-v-good'];return ['Mild','bw-v-mild'];}
      function emo(hi,r){if(hi<12)return '\\u2744\\uFE0F';if(r>=90)return '\\uD83C\\uDF27\\uFE0F';if(r<40&&hi>=24)return '\\u2600\\uFE0F';return '\\uD83C\\uDF24\\uFE0F';}
      // month tabs
      SH.forEach(function(s,i){var btn=document.createElement('button');btn.className='bw-mo'+(i===cur?' active':'');btn.textContent=s;btn.dataset.mo=i;btn.addEventListener('click',function(){cur=i;[].forEach.call(monthsEl.children,function(b){b.classList.toggle('active',+b.dataset.mo===cur);});render();});monthsEl.appendChild(btn);});
      function render(){
        var region=regionSel.value, beach=beachChk.checked;
        var rows=[];
        CITIES.forEach(function(c){var cl=CLIMATE[c[0]];if(!cl)return;var hi=cl.h[cur],lo=cl.l[cur],r=cl.r[cur];if(hi==null||lo==null)return;
          if(region&&c[4]!==region)return; if(beach&&(hi<25||r>=110))return;
          rows.push({c:c,hi:hi,lo:lo,r:r==null?0:r,cf:comfort(hi,lo,r)});});
        rows.sort(function(a,b){return b.cf-a.cf||b.c[5]-a.c[5];});
        var top=rows.slice(0,36);
        count.innerHTML=rows.length?('The best <b>'+top.length+'</b> '+(beach?'beach ':'')+'cities for <b>'+MON[cur]+'</b> weather'+(region?' in '+regionSel.options[regionSel.selectedIndex].text:'')+(rows.length>top.length?' (ranked from '+rows.length+' with climate data)':'')):'';
        if(!rows.length){grid.innerHTML='<p class="bw-empty">No cities match. Try another month or turn off the beach filter.</p>';}
        else{grid.innerHTML=top.map(function(x){var c=x.c;var v=verdict(x.cf);var flag=c[3]?'<span class="bw-flag"><img src="/assets/flags/'+c[3]+'.svg" alt="" width="22" height="16"></span>':'';
          return '<a class="bw-card" href="/cities/'+c[0]+'#weather">'
            +'<div class="bw-card-top">'+flag+'<span class="bw-name">'+c[1]+'</span><span class="bw-score">'+c[5].toFixed(1)+'</span></div>'
            +'<div class="bw-country">'+c[2]+'</div>'
            +'<div class="bw-wx">'+emo(x.hi,x.r)+' '+x.hi+'&deg; / '+x.lo+'&deg;C <span class="mut">&middot; '+x.r+'mm rain</span></div>'
            +'<span class="bw-verdict '+v[1]+'">'+v[0]+' weather</span></a>';}).join('');}
        try{var u=new URL(window.location);u.searchParams.set('month',SLUG[cur]);if(region)u.searchParams.set('region',region);else u.searchParams.delete('region');if(beach)u.searchParams.set('beach','1');else u.searchParams.delete('beach');history.replaceState(null,'',u);}catch(e){}
      }
      regionSel.addEventListener('change',render); beachChk.addEventListener('change',render);
      document.getElementById('bwShare').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText(window.location.href);b.textContent='Copied!';setTimeout(function(){b.textContent='Copy share link';},1500);}catch(e){}});
      // init from URL
      (function(){var sp=new URLSearchParams(window.location.search);var mp=sp.get('month');if(mp){var i=SLUG.indexOf(mp.toLowerCase());if(i>=0){cur=i;[].forEach.call(monthsEl.children,function(b){b.classList.toggle('active',+b.dataset.mo===cur);});}}
        var rp=sp.get('region');if(rp)regionSel.value=rp; if(sp.get('beach')==='1')beachChk.checked=true; render();})();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'best-weather.html'), html);
console.log(`Wrote best-weather.html (${DATA.length} cities with climate).`);
