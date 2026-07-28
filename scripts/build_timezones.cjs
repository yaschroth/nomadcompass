/**
 * Builds /timezones: a DST-aware Time Zone Overlap Finder. Each city carries its IANA zone
 * (assets/city-tz.js); the browser computes the real UTC offset for a chosen date via Intl, so
 * daylight-saving shifts are included. Pick your home zone (auto-detected) and a date (now / July /
 * January) and it ranks cities by overlapping 9-to-5 working hours: overlap = max(0, 8 - |cityOff -
 * homeOff|). Region + min-overlap filters, shareable via ?tz=Zone&when=now. Run the head/body sweeps
 * (finish with apply_tools_nav.cjs) + sitemap after. Usage: node scripts/build_timezones.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITY_TZ = require(path.join(ROOT, 'assets', 'city-tz.js'));
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

// [id, name, country, iso, ianaZone, region, score, cost]
const DATA = m.exports.filter((c) => c && c.id && CITY_TZ[c.id]).map((c) => [
  c.id, c.name, c.country, iso(c.flag), CITY_TZ[c.id], REGION[c.id] || '', nomadScore(c), typeof c.costPerMonth === 'number' ? c.costPerMonth : 0,
]);

const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America', oceania: 'Oceania' };
const regionOptions = Object.keys(REGION_NAMES).map((r) => `<option value="${r}">${REGION_NAMES[r]}</option>`).join('');
// representative home zones (IANA) with example cities; offsets are shown live per selected date
const HOME = [
  ['America/Los_Angeles', 'Los Angeles / Vancouver'], ['America/Denver', 'Denver / Phoenix'], ['America/Chicago', 'Chicago / Mexico City'],
  ['America/New_York', 'New York / Toronto / Bogota'], ['America/Halifax', 'Halifax / Santiago'], ['America/Sao_Paulo', 'Sao Paulo / Buenos Aires'],
  ['Atlantic/Reykjavik', 'Reykjavik (no DST)'], ['Europe/London', 'London / Lisbon / Dublin'], ['Europe/Berlin', 'Berlin / Paris / Madrid'],
  ['Europe/Athens', 'Athens / Helsinki / Cairo'], ['Europe/Istanbul', 'Istanbul (no DST)'], ['Africa/Nairobi', 'Nairobi'],
  ['Africa/Johannesburg', 'Cape Town / Johannesburg'], ['Asia/Dubai', 'Dubai'], ['Asia/Karachi', 'Karachi'], ['Asia/Kolkata', 'India'],
  ['Asia/Bangkok', 'Bangkok / Jakarta / Hanoi'], ['Asia/Singapore', 'Singapore / Beijing / Bali'], ['Asia/Tokyo', 'Tokyo / Seoul'],
  ['Australia/Perth', 'Perth'], ['Australia/Sydney', 'Sydney / Melbourne'], ['Pacific/Auckland', 'Auckland'],
];

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

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Time Zone Overlap Finder', url: BASE + '/timezones', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Find digital nomad cities whose working hours overlap with your home or team time zone, with daylight-saving included.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Time Zone Finder', BASE + '/timezones']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Zone Overlap Finder for Digital Nomads | The Nomad HQ</title>
  <meta name="description" content="Pick your home time zone and find nomad cities with the most overlapping working hours, daylight-saving included. Collaborate without living at 3am.">
  <link rel="canonical" href="${BASE}/timezones">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Time Zone Overlap Finder | The Nomad HQ">
  <meta property="og:description" content="Find nomad cities whose working hours overlap with yours, DST included.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/timezones">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/timezones-hero.webp" fetchpriority="high">
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
    .tz-wrap { max-width:1080px; margin:0 auto; padding:1rem var(--space-4,1rem) 3.5rem; }
    .tz-controls { display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; justify-content:center; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.25rem 1.4rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .tz-field { display:flex; flex-direction:column; gap:.35rem; }
    .tz-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); }
    .tz-field select { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff; color:var(--color-ink); min-width:240px; }
    .tz-field.small select { min-width:140px; }
    .tz-detect { font-family:inherit; font-size:.85rem; font-weight:600; color:var(--color-terracotta); background:none; border:none; cursor:pointer; text-decoration:underline; padding:.5rem 0; }
    .tz-count { text-align:center; font-size:.92rem; color:var(--color-stone); margin:1.5rem 0 .8rem; } .tz-count b { color:var(--color-ink); }
    .tz-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
    .tz-card { display:block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.1rem; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .tz-card:hover { border-color:var(--color-terracotta); transform:translateY(-2px); box-shadow:0 10px 24px rgba(15,23,42,.1); }
    .tz-card-top { display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem; }
    .tz-flag { border-radius:3px; box-shadow:0 0 0 1px rgba(0,0,0,.08); flex:0 0 auto; }
    .tz-name { font-family:'DM Serif Display',serif; font-size:1.2rem; color:var(--color-ink); line-height:1.1; }
    .tz-country { font-size:.78rem; color:var(--color-stone); }
    .tz-dst { display:inline-block; font-size:.6rem; font-weight:700; color:#8a5a00; background:#fbeecb; border-radius:4px; padding:0 .3rem; margin-left:.3rem; vertical-align:middle; }
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
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/timezones-hero.webp" alt="A calm purple and gold sunset over a rocky sea at Flo, Norway" fetchpriority="high" width="1920" height="1090">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Remote-work tool</span>
        <h1>Time Zone Overlap Finder</h1>
        <p class="sub">Working with a team back home? Pick your base time zone and see which nomad cities give you the most overlapping working hours, so calls happen at noon, not 3am. Daylight-saving included.</p>
      </div></div>
    </header>
    <div class="tz-wrap">
      <div class="tz-controls">
        <div class="tz-field"><label for="tzHome">Your home / team time zone</label><select id="tzHome"></select></div>
        <div class="tz-field small"><label for="tzWhen">When</label><select id="tzWhen"><option value="now">Right now</option><option value="jul">In July (N. summer)</option><option value="jan">In January (N. winter)</option></select></div>
        <div class="tz-field small"><label for="tzRegion">Region</label><select id="tzRegion"><option value="all">Anywhere</option>${regionOptions}</select></div>
        <div class="tz-field small"><label for="tzMin">Min overlap</label><select id="tzMin"><option value="0">Any</option><option value="2">2h+</option><option value="4">4h+</option><option value="6">6h+</option></select></div>
        <button type="button" class="tz-detect" id="tzDetect">Detect my time zone</button>
      </div>
      <p class="tz-count" id="tzCount"></p>
      <div class="tz-grid" id="tzGrid"></div>
      <p class="tz-note">Overlap assumes a standard 9-to-5 working day on both sides. A city sharing your current offset gives the full 8 hours; every hour of difference trims one hour of overlap. Offsets are computed live for the date you choose, so daylight-saving shifts are included (a "DST" tag means that city is on summer time then). If you have gone fully async, ignore the overlap and optimise for something else.</p>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var HOME=${JSON.stringify(HOME)};
      var REGION_NAMES=${JSON.stringify(REGION_NAMES)};
      var grid=document.getElementById('tzGrid'),count=document.getElementById('tzCount');
      var homeSel=document.getElementById('tzHome'),whenSel=document.getElementById('tzWhen'),regSel=document.getElementById('tzRegion'),minSel=document.getElementById('tzMin');
      function lvl(o){return o>=6?6:o>=3?3:o>=1?1:0;}
      function money(v){return v?'$'+v.toLocaleString('en-US')+'/mo':'n/a';}
      function offOf(zone,date){try{var p=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset',hour:'numeric'}).formatToParts(date);var o=(p.find(function(x){return x.type==='timeZoneName';})||{}).value||'GMT+0';var mm=o.match(/GMT([+-])(\\d{1,2})(?::(\\d{2}))?/);if(!mm)return 0;var h=(+mm[2])+(mm[3]?(+mm[3])/60:0);return mm[1]==='-'?-h:h;}catch(e){return 0;}}
      var _std={};
      function stdOff(zone){if(_std[zone]!=null)return _std[zone];var y=(new Date()).getUTCFullYear();return _std[zone]=Math.min(offOf(zone,new Date(Date.UTC(y,0,15,12))),offOf(zone,new Date(Date.UTC(y,6,15,12))));}
      function offLabel(o){var s=o<0?'-':'+';var a=Math.abs(o);var h=Math.floor(a+1e-6);var mm=Math.round((a-h)*60);return 'UTC'+s+h+(mm?(':'+(mm<10?'0':'')+mm):'');}
      function refDate(){var w=whenSel.value;var y=(new Date()).getUTCFullYear();if(w==='jul')return new Date(Date.UTC(y,6,15,12));if(w==='jan')return new Date(Date.UTC(y,0,15,12));return new Date();}
      // build home options (auto-detected zone first if not already listed)
      var detected=''; try{detected=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
      var homeList=HOME.slice();
      if(detected && !homeList.some(function(h){return h[0]===detected;})) homeList.unshift([detected,'Your device zone']);
      homeList.forEach(function(h){var o=document.createElement('option');o.value=h[0];o.setAttribute('data-l',h[1]);o.textContent=h[1];homeSel.appendChild(o);});
      homeSel.value = (detected && homeList.some(function(h){return h[0]===detected;})) ? detected : 'Europe/London';
      function relabel(date){[].forEach.call(homeSel.options,function(op){op.textContent=op.getAttribute('data-l')+' ('+offLabel(offOf(op.value,date))+')';});}
      function render(){
        var date=refDate();relabel(date);
        var homeZone=homeSel.value,homeOff=offOf(homeZone,date),reg=regSel.value,min=parseFloat(minSel.value)||0;
        var rows=CITIES.map(function(c){var co=offOf(c[4],date);return {c:c,off:co,ov:Math.max(0,8-Math.abs(co-homeOff))};})
          .filter(function(r){return r.ov>=min && (reg==='all'||r.c[5]===reg);})
          .sort(function(a,b){return b.ov-a.ov || b.c[6]-a.c[6];}).slice(0,60);
        var homeLbl=(homeSel.options[homeSel.selectedIndex]||{}).getAttribute?homeSel.options[homeSel.selectedIndex].getAttribute('data-l'):homeZone;
        count.innerHTML='Your home <b>'+homeLbl+'</b> is <b>'+offLabel(homeOff)+'</b> then. Showing <b>'+rows.length+'</b> cities with '+(min?('at least '+min+'h'):'any')+' overlap'+(reg!=='all'?' in '+REGION_NAMES[reg]:'')+'.';
        grid.innerHTML=rows.map(function(r){
          var c=r.c,ov=r.ov,pct=Math.round(ov/8*100);var isDst=r.off>stdOff(c[4])+0.01;
          var flag=c[3]?'<img class="tz-flag" src="/assets/flags/'+c[3]+'.svg" alt="" width="24" height="18" loading="lazy">':'';
          return '<a class="tz-card tz-lvl-'+lvl(ov)+'" href="/cities/'+c[0]+'">'
            +'<div class="tz-card-top">'+flag+'<div><div class="tz-name">'+c[1]+'</div><div class="tz-country">'+c[2]+' &middot; '+offLabel(r.off)+(isDst?'<span class="tz-dst">DST</span>':'')+'</div></div>'
            +'<div class="tz-badge"><b>'+ov.toFixed(ov%1?1:0)+'h</b><span>overlap</span></div></div>'
            +'<div class="tz-bar"><div class="tz-bar-fill" style="width:'+pct+'%"></div><div class="tz-bar-hours">'+ov.toFixed(ov%1?1:0)+' of 8 working hours shared</div></div>'
            +'<div class="tz-meta"><span>Nomad Score '+c[6]+'</span><span>'+money(c[7])+'</span></div></a>';
        }).join('');
        try{var u=new URL(window.location);u.searchParams.set('tz',homeZone);if(whenSel.value!=='now')u.searchParams.set('when',whenSel.value);else u.searchParams.delete('when');history.replaceState(null,'',u);}catch(e){}
      }
      [homeSel,whenSel,regSel,minSel].forEach(function(s){s.addEventListener('change',render);});
      document.getElementById('tzDetect').addEventListener('click',function(){try{var d=Intl.DateTimeFormat().resolvedOptions().timeZone;if(d){var found=false;for(var i=0;i<homeSel.options.length;i++){if(homeSel.options[i].value===d){homeSel.selectedIndex=i;found=true;break;}}if(!found){var o=document.createElement('option');o.value=d;o.setAttribute('data-l','Your device zone');homeSel.insertBefore(o,homeSel.firstChild);homeSel.value=d;}render();}}catch(e){}});
      // init from ?tz=&when=
      (function(){var sp=new URLSearchParams(window.location.search);var tzp=sp.get('tz');if(tzp){var ok=false;for(var i=0;i<homeSel.options.length;i++){if(homeSel.options[i].value===tzp){homeSel.value=tzp;ok=true;break;}}if(!ok){var o=document.createElement('option');o.value=tzp;o.setAttribute('data-l','Shared zone');homeSel.insertBefore(o,homeSel.firstChild);homeSel.value=tzp;}}var wp=sp.get('when');if(wp&&(wp==='jul'||wp==='jan'))whenSel.value=wp;render();})();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'timezones.html'), html);
console.log(`Wrote timezones.html with ${DATA.length} cities (DST-aware via IANA zones).`);
