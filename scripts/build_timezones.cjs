/**
 * Builds /timezones: a Time Zone Overlap Finder. Pick your home/team UTC offset and the tool
 * ranks cities by how many working hours overlap (assuming a 9-17 day on both sides, overlap =
 * max(0, 8 - |cityTz - homeTz|)). Region + min-overlap filters, shareable via ?tz=. Data (id,
 * name, country, iso, tz, region, score, cost) is baked in. Run the head/body sweeps + sitemap
 * afterwards. Usage: node scripts/build_timezones.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

const DATA = m.exports.filter((c) => c && c.id && typeof c.timezone === 'number').map((c) => [
  c.id, c.name, c.country, iso(c.flag), c.timezone, REGION[c.id] || '', nomadScore(c), typeof c.costPerMonth === 'number' ? c.costPerMonth : 0,
]);

const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'the Middle East', northamerica: 'North America & the Caribbean', oceania: 'Oceania' };
const REGION_SLUG = { europe: 'europe', asia: 'asia', latam: 'latin-america', africa: 'africa', middleeast: 'middle-east', northamerica: 'north-america', oceania: 'oceania' };
const regionOptions = Object.keys(REGION_NAMES).map((r) => `<option value="${r}">${REGION_NAMES[r].replace(/^the /, '')}</option>`).join('');
// home-offset options: label each with example cities
const OFFSETS = [
  [-8, 'UTC-8 (Los Angeles, Vancouver)'], [-7, 'UTC-7 (Denver, Phoenix)'], [-6, 'UTC-6 (Chicago, Mexico City)'],
  [-5, 'UTC-5 (New York, Toronto, Bogota)'], [-4, 'UTC-4 (Santiago, Halifax)'], [-3, 'UTC-3 (Sao Paulo, Buenos Aires)'],
  [0, 'UTC+0 (London, Lisbon)'], [1, 'UTC+1 (Berlin, Paris, Madrid)'], [2, 'UTC+2 (Athens, Cairo, Cape Town)'],
  [3, 'UTC+3 (Istanbul, Moscow, Nairobi)'], [4, 'UTC+4 (Dubai, Tbilisi)'], [5, 'UTC+5 (Karachi, Tashkent)'],
  [5.5, 'UTC+5:30 (India)'], [7, 'UTC+7 (Bangkok, Jakarta, Hanoi)'], [8, 'UTC+8 (Singapore, Bali, Beijing)'],
  [9, 'UTC+9 (Tokyo, Seoul)'], [10, 'UTC+10 (Sydney, Melbourne)'], [12, 'UTC+12 (Auckland)'],
];
const offsetOptions = OFFSETS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

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
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/timezones" class="footer-link">Time Zone Finder</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Time Zone Overlap Finder', url: BASE + '/timezones', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Find digital nomad cities whose working hours overlap with your home or team time zone.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Time Zone Finder', BASE + '/timezones']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Zone Overlap Finder for Digital Nomads | The Nomad HQ</title>
  <meta name="description" content="Pick your home or team time zone and find digital nomad cities with the most overlapping working hours, so you can collaborate without living at 3am.">
  <link rel="canonical" href="${BASE}/timezones">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Time Zone Overlap Finder | The Nomad HQ">
  <meta property="og:description" content="Find nomad cities whose working hours overlap with yours.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/timezones">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="preload" as="image" href="/assets/timezones-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    .tz-hero { position:relative; min-height:clamp(360px,58vh,540px); display:flex; align-items:flex-end; overflow:hidden; }
    .tz-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .tz-hero-overlay { position:relative; z-index:2; width:100%; padding:calc(var(--nav-height,64px) + 2.75rem) 0 2.4rem; background:linear-gradient(to top, rgba(15,23,42,.92), rgba(15,23,42,.6) 55%, rgba(15,23,42,.12) 88%, transparent); color:#fff; }
    .tz-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:calc(var(--nav-height,64px) + 46px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.82), rgba(255,255,255,.34) 55%, transparent); }
    .tz-hero .container { max-width:1040px; }
    .tz-crumbs { font-size:.82rem; color:rgba(255,255,255,.82); margin:0 0 1rem; } .tz-crumbs a { color:#fff; text-decoration:none; } .tz-crumbs a:hover { text-decoration:underline; } .tz-crumbs span { margin:0 .4rem; color:rgba(255,255,255,.5); }
    .tz-eyebrow { display:inline-block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .7rem; text-shadow:0 1px 10px rgba(0,0,0,.4); }
    .tz-hero h1 { font-family:'DM Serif Display',serif; color:#fff; font-size:clamp(2.2rem,5.5vw,3.4rem); line-height:1.08; margin:0 0 .9rem; text-shadow:0 2px 24px rgba(0,0,0,.45); text-wrap:balance; }
    .tz-hero p.tz-sub { color:rgba(255,255,255,.92); font-size:1.12rem; line-height:1.6; margin:0; max-width:58ch; text-shadow:0 1px 12px rgba(0,0,0,.4); }
    .tz-wrap { max-width:1080px; margin:0 auto; padding:1rem var(--space-4,1rem) 3.5rem; }
    .tz-controls { display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; justify-content:center; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.25rem 1.4rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .tz-field { display:flex; flex-direction:column; gap:.35rem; }
    .tz-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); }
    .tz-field select { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff; color:var(--color-ink); min-width:240px; }
    .tz-field.small select { min-width:150px; }
    .tz-detect { font-family:inherit; font-size:.85rem; font-weight:600; color:var(--color-terracotta); background:none; border:none; cursor:pointer; text-decoration:underline; padding:.5rem 0; }
    .tz-count { text-align:center; font-size:.92rem; color:var(--color-stone); margin:1.5rem 0 .8rem; }
    .tz-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
    .tz-card { display:block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.1rem; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .tz-card:hover { border-color:var(--color-terracotta); transform:translateY(-2px); box-shadow:0 10px 24px rgba(15,23,42,.1); }
    .tz-card-top { display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem; }
    .tz-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(0,0,0,.08); flex:0 0 auto; }
    .tz-name { font-family:'DM Serif Display',serif; font-size:1.2rem; color:var(--color-ink); line-height:1.1; }
    .tz-country { font-size:.78rem; color:var(--color-stone); }
    .tz-badge { margin-left:auto; text-align:center; flex:0 0 auto; }
    .tz-badge b { display:block; font-size:1.15rem; font-weight:800; line-height:1; }
    .tz-badge span { font-size:.62rem; text-transform:uppercase; letter-spacing:.05em; color:var(--color-stone); }
    .tz-bar { position:relative; height:26px; background:var(--color-sand,#f6f1e7); border-radius:7px; overflow:hidden; margin:.2rem 0 .5rem; }
    .tz-bar-fill { position:absolute; top:0; bottom:0; background:rgba(47,125,90,.28); }
    .tz-bar-hours { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:.72rem; color:var(--color-charcoal); font-weight:600; }
    .tz-meta { display:flex; justify-content:space-between; font-size:.78rem; color:var(--color-stone); }
    .tz-lvl-6 b { color:#2f7d5a; } .tz-lvl-3 b { color:#9e7b1e; } .tz-lvl-1 b { color:#c0392b; } .tz-lvl-0 b { color:#5c6672; }
    .tz-note { max-width:720px; margin:2.5rem auto 0; padding-top:1.5rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); font-size:.9rem; line-height:1.7; color:var(--color-stone); }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="tz-hero">
      <img class="tz-hero-img" src="/assets/timezones-hero.webp" alt="Earth at night from the ISS, city lights glowing across Europe below the blue dawn line" fetchpriority="high" width="1920" height="1280">
      <div class="tz-hero-overlay"><div class="container">
      <nav class="tz-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Time Zone Finder</nav>
      <span class="tz-eyebrow">Remote-work tool</span>
      <h1>Time Zone Overlap Finder</h1>
      <p class="tz-sub">Working with a team back home? Pick your base time zone and see which nomad cities give you the most overlapping working hours, so calls happen at noon, not 3am.</p>
      </div></div>
    </header>
    <div class="tz-wrap">
      <div class="tz-controls">
        <div class="tz-field"><label for="tzHome">Your home / team time zone</label><select id="tzHome">${offsetOptions}</select></div>
        <div class="tz-field small"><label for="tzRegion">Region</label><select id="tzRegion"><option value="all">Anywhere</option>${regionOptions}</select></div>
        <div class="tz-field small"><label for="tzMin">Min overlap</label><select id="tzMin"><option value="0">Any</option><option value="2">2h+</option><option value="4">4h+</option><option value="6">6h+</option></select></div>
        <button type="button" class="tz-detect" id="tzDetect">Detect my time zone</button>
      </div>
      <p class="tz-count" id="tzCount"></p>
      <div class="tz-grid" id="tzGrid"></div>
      <p class="tz-note">Overlap assumes a standard 9-to-5 working day on both sides. A city that shares your exact offset gives the full 8 hours; every hour of time difference trims one hour of overlap. Great for staying in sync with a home team or clients; if you have gone fully async, ignore it and optimise for something else. Time zones here are standard offsets and do not track daylight-saving shifts.</p>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var REGN=${JSON.stringify(REGION_SLUG)};
      var grid=document.getElementById('tzGrid'),count=document.getElementById('tzCount');
      var homeSel=document.getElementById('tzHome'),regSel=document.getElementById('tzRegion'),minSel=document.getElementById('tzMin');
      function lvl(o){return o>=6?6:o>=3?3:o>=1?1:0;}
      function money(v){return v?'$'+v.toLocaleString('en-US')+'/mo':'n/a';}
      function offLabel(tz){var s=tz<0?'-':'+';var a=Math.abs(tz);var h=Math.floor(a);var mm=Math.round((a-h)*60);return 'UTC'+s+h+(mm?(':'+(mm<10?'0':'')+mm):'');}
      function render(){
        var home=parseFloat(homeSel.value),reg=regSel.value,min=parseFloat(minSel.value)||0;
        var rows=CITIES.map(function(c){var o=Math.max(0,8-Math.abs(c[4]-home));return {c:c,ov:o};})
          .filter(function(r){return r.ov>=min && (reg==='all'||r.c[5]===reg);})
          .sort(function(a,b){return b.ov-a.ov || b.c[6]-a.c[6];}).slice(0,60);
        count.textContent=rows.length+' cities with '+(min?('at least '+min+'h'):'any')+' overlap'+(reg!=='all'?' in this region':'');
        grid.innerHTML=rows.map(function(r){
          var c=r.c,ov=r.ov,pct=Math.round(ov/8*100);
          var flag=c[3]?'<img class="tz-flag" src="/assets/flags/'+c[3]+'.svg" alt="" width="24" height="18" loading="lazy">':'';
          return '<a class="tz-card tz-lvl-'+lvl(ov)+'" href="/cities/'+c[0]+'">'
            +'<div class="tz-card-top">'+flag+'<div><div class="tz-name">'+c[1]+'</div><div class="tz-country">'+c[2]+' &middot; '+offLabel(c[4])+'</div></div>'
            +'<div class="tz-badge"><b>'+ov.toFixed(ov%1?1:0)+'h</b><span>overlap</span></div></div>'
            +'<div class="tz-bar"><div class="tz-bar-fill" style="width:'+pct+'%"></div><div class="tz-bar-hours">'+ov.toFixed(ov%1?1:0)+' of 8 working hours shared</div></div>'
            +'<div class="tz-meta"><span>Nomad Score '+c[6]+'</span><span>'+money(c[7])+'</span></div></a>';
        }).join('');
      }
      [homeSel,regSel,minSel].forEach(function(s){s.addEventListener('change',function(){sync();render();});});
      document.getElementById('tzDetect').addEventListener('click',function(){
        try{var o=-new Date().getTimezoneOffset()/60;var best=homeSel.options[0].value,bd=99;for(var i=0;i<homeSel.options.length;i++){var v=parseFloat(homeSel.options[i].value);if(Math.abs(v-o)<bd){bd=Math.abs(v-o);best=homeSel.options[i].value;}}homeSel.value=best;sync();render();}catch(e){}
      });
      function sync(){try{var u=new URL(window.location);u.searchParams.set('tz',homeSel.value);history.replaceState(null,'',u);}catch(e){}}
      // init from ?tz= or detect
      try{var p=new URLSearchParams(window.location.search).get('tz');if(p!==null){for(var i=0;i<homeSel.options.length;i++){if(homeSel.options[i].value===p){homeSel.value=p;break;}}}else{document.getElementById('tzDetect').click();}}catch(e){}
      render();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'timezones.html'), html);
console.log(`Wrote timezones.html with ${DATA.length} cities.`);
