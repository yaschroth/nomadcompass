/**
 * Builds /geoarbitrage: a salary / geoarbitrage calculator. Enter your monthly after-tax income
 * and see, for every city, your estimated monthly savings and savings rate on the local cost of
 * living. Sort by savings, cost or Nomad Score; filter by region. Shareable via ?income=4000.
 * City cost comes from costPerMonth in cities-data.js (editorial estimate). Run the head/body
 * sweeps (finish with apply_tools_nav.cjs) + sitemap after. Usage: node scripts/build_geoarbitrage.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

// [id, name, country, iso, region, score, cost]
const DATA = m.exports.filter((c) => c && c.id && typeof c.costPerMonth === 'number' && c.costPerMonth > 0).map((c) => [c.id, c.name, c.country, iso(c.flag), REGION[c.id] || '', nomadScore(c), c.costPerMonth]);

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
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/geoarbitrage" class="footer-link">Geoarbitrage Calculator</a></li><li><a href="/visa" class="footer-link">Visa Finder</a></li><li><a href="/best-weather" class="footer-link">Best Weather by Month</a></li><li><a href="/route" class="footer-link">Route Planner</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Geoarbitrage Calculator', url: BASE + '/geoarbitrage', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'See how much you could save each month by living in different digital nomad cities on your income.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Geoarbitrage Calculator', BASE + '/geoarbitrage']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Geoarbitrage Calculator: How Far Your Salary Goes | The Nomad HQ</title>
  <meta name="description" content="Enter your monthly income and see how much you could save living in each digital nomad city. Compare your savings rate across 400+ cities. Free calculator.">
  <link rel="canonical" href="${BASE}/geoarbitrage">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Geoarbitrage Calculator | The Nomad HQ">
  <meta property="og:description" content="See how far your salary goes in every nomad city.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/geoarbitrage">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/geo-hero.webp" fetchpriority="high">
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
    .ga-wrap { max-width:1180px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3.5rem; }
    .ga-controls { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.2rem 1.3rem; box-shadow:0 8px 24px rgba(15,23,42,.05); margin-bottom:1.4rem; }
    .ga-row { display:flex; flex-wrap:wrap; gap:.9rem 1.3rem; align-items:end; }
    .ga-field label { display:block; font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .3rem; font-weight:600; }
    .ga-income { position:relative; }
    .ga-income .cur { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--color-stone); font-weight:600; }
    .ga-income input { font-family:inherit; font-size:1.25rem; font-weight:700; padding:.5rem .7rem .5rem 1.5rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; width:170px; }
    .ga-field select { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .ga-headline { font-size:1.05rem; color:var(--color-charcoal); line-height:1.6; margin:0 0 1.3rem; } .ga-headline b { color:var(--color-ink); } .ga-headline .pos { color:#2f7d5a; font-weight:700; }
    .ga-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; }
    .ga-card { display:block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.1rem; text-decoration:none; box-shadow:0 6px 16px rgba(15,23,42,.05); transition:transform .15s, box-shadow .15s, border-color .15s; }
    .ga-card:hover { transform:translateY(-3px); box-shadow:0 14px 30px rgba(15,23,42,.1); border-color:var(--color-terracotta); }
    .ga-card-top { display:flex; align-items:center; gap:.5rem; }
    .ga-name { font-weight:700; color:var(--color-ink); font-size:1.05rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ga-score { font-size:.78rem; font-weight:800; color:#fff; background:var(--color-terracotta); border-radius:7px; padding:.1rem .4rem; }
    .ga-country { font-size:.8rem; color:var(--color-stone); margin:.15rem 0 .7rem; }
    .ga-cost { font-size:.85rem; color:var(--color-charcoal); } .ga-cost b { color:var(--color-ink); font-variant-numeric:tabular-nums; }
    .ga-save { font-size:1.15rem; font-weight:700; margin:.35rem 0 .5rem; font-variant-numeric:tabular-nums; } .ga-save.pos { color:#2f7d5a; } .ga-save.neg { color:#b23; }
    .ga-bar { height:8px; border-radius:4px; background:var(--color-sand,#f0e9dc); overflow:hidden; } .ga-bar span { display:block; height:100%; background:#2f7d5a; } .ga-bar span.neg { background:#c0392b; }
    .ga-rate { font-size:.76rem; color:var(--color-stone); margin-top:.35rem; }
    .ga-empty { color:var(--color-stone); padding:2rem 0; text-align:center; }
    .ga-share { margin-top:1.5rem; } .ga-share button { font-family:inherit; font-size:.85rem; font-weight:600; padding:.55rem 1.1rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); } .ga-share button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .ga-disclaim { font-size:.78rem; color:var(--color-stone); margin-top:1rem; line-height:1.6; }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/geo-hero.webp" alt="A white villa with a pool and palm trees under a bright sky" fetchpriority="high" width="1920" height="1267">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Money tool</span>
        <h1>How far does your salary go?</h1>
        <p class="sub">Enter what you earn and see how much you could save each month living in different nomad cities. The same paycheck buys a very different life depending on where you base yourself.</p>
      </div></div>
    </header>
    <div class="ga-wrap">
      <div class="ga-controls">
        <div class="ga-row">
          <div class="ga-field ga-income"><label for="gaIncome">Your monthly income (after tax)</label><span class="cur">$</span><input type="number" id="gaIncome" value="4000" min="0" step="100" inputmode="numeric"></div>
          <div class="ga-field"><label for="gaRegion">Region</label><select id="gaRegion"><option value="">Anywhere</option>${regionOptions}</select></div>
          <div class="ga-field"><label for="gaSort">Sort by</label><select id="gaSort"><option value="save">Most savings</option><option value="cost">Cheapest first</option><option value="score">Nomad Score</option></select></div>
        </div>
      </div>
      <p class="ga-headline" id="gaHeadline"></p>
      <div class="ga-grid" id="gaGrid"></div>
      <div class="ga-share"><button type="button" id="gaShare">Copy share link</button></div>
      <p class="ga-disclaim">Cost of living figures are The Nomad HQ's editorial estimates of a comfortable monthly budget for one person (rent, food, coworking, getting around and some fun), in USD, not official data. Your real spend depends on your lifestyle. Income is after tax; taxes are not modelled.</p>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var incomeEl=document.getElementById('gaIncome'),regionSel=document.getElementById('gaRegion'),sortSel=document.getElementById('gaSort');
      var grid=document.getElementById('gaGrid'),headline=document.getElementById('gaHeadline');
      var money=function(v){return '$'+Math.round(v).toLocaleString('en-US');};
      function render(){
        var income=Math.max(0,parseFloat(incomeEl.value)||0);
        var region=regionSel.value, sort=sortSel.value;
        var rows=CITIES.filter(function(c){return !region||c[4]===region;}).map(function(c){var cost=c[6];return {c:c,cost:cost,save:income-cost,rate:income>0?(income-cost)/income:0};});
        rows.sort(function(a,b){if(sort==='cost')return a.cost-b.cost;if(sort==='score')return b.c[5]-a.c[5];return b.save-a.save;});
        var pos=rows.filter(function(r){return r.save>0;}).length;
        var cheapest=rows.reduce(function(a,b){return b.cost<a.cost?b:a;},rows[0]);
        if(income>0&&rows.length){headline.innerHTML='On <b>'+money(income)+'/mo</b> you would have money left over in <span class="pos">'+pos+'</span> of '+rows.length+' cities. Cheapest is <b>'+cheapest.c[1]+'</b> at about <b>'+money(cheapest.cost)+'/mo</b>'+(cheapest.save>0?' \\u2014 a saving of <b>'+money(cheapest.save)+'/mo</b>':'')+'.';}
        else headline.innerHTML='Enter your monthly income to see where your money goes furthest.';
        grid.innerHTML=rows.map(function(r){var c=r.c;var flag=c[3]?'<img src="/assets/flags/'+c[3]+'.svg" alt="" width="22" height="16" style="border-radius:3px;vertical-align:middle;">':'';
          var pct=Math.max(0,Math.min(100,r.rate*100));var neg=r.save<0;
          return '<a class="ga-card" href="/cities/'+c[0]+'"><div class="ga-card-top">'+flag+'<span class="ga-name">'+c[1]+'</span><span class="ga-score">'+c[5].toFixed(1)+'</span></div>'
            +'<div class="ga-country">'+c[2]+'</div>'
            +'<div class="ga-cost">Cost of living <b>'+money(r.cost)+'</b>/mo</div>'
            +'<div class="ga-save '+(neg?'neg':'pos')+'">'+(neg?'Over budget by '+money(-r.save):'Save '+money(r.save))+'/mo</div>'
            +'<div class="ga-bar"><span class="'+(neg?'neg':'')+'" style="width:'+(neg?100:pct.toFixed(0))+'%"></span></div>'
            +'<div class="ga-rate">'+(income>0?(neg?'-':'')+Math.abs(Math.round(r.rate*100))+'% savings rate':'')+'</div></a>';}).join('');
        try{var u=new URL(window.location);if(income>0)u.searchParams.set('income',Math.round(income));else u.searchParams.delete('income');if(region)u.searchParams.set('region',region);else u.searchParams.delete('region');history.replaceState(null,'',u);}catch(e){}
      }
      incomeEl.addEventListener('input',render); regionSel.addEventListener('change',render); sortSel.addEventListener('change',render);
      document.getElementById('gaShare').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText(window.location.href);b.textContent='Copied!';setTimeout(function(){b.textContent='Copy share link';},1500);}catch(e){}});
      (function(){var sp=new URLSearchParams(window.location.search);var ip=sp.get('income');if(ip&&+ip>0)incomeEl.value=+ip;var rp=sp.get('region');if(rp)regionSel.value=rp;render();})();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'geoarbitrage.html'), html);
console.log(`Wrote geoarbitrage.html (${DATA.length} cities with cost).`);
