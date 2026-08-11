require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds /tier-list/maker: an interactive tier-list maker. Drag city chips into S..F tiers
 * (desktop drag-and-drop; tap-to-select then tap-a-tier on touch). Add any city from search,
 * share your ranking via ?tl=. City data (id,name,iso) is baked in; pool seeds with the top
 * cities by Nomad Score. Run the head/body sweeps + sitemap afterwards.
 * Usage: node scripts/build_tier_maker.cjs
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
const ALL = m.exports.filter((c) => c && c.id).map((c) => [c.id, c.name, iso(c.flag), nomadScore(c)]).sort((a, b) => b[3] - a[3]);
const POOL = ALL.slice(0, 36).map((c) => c[0]); // seed the pool with the top 36 by score

const TIERS = [['S', '#C0392B'], ['A', '#C4622E'], ['B', '#9E7B1E'], ['C', '#2F7D5A'], ['D', '#3D6493'], ['F', '#5C6672']];

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}${t === 'Tier List' ? ' active' : ''}">${t}</a></li>`).join('');
  return `<nav class="nav" id="mainNav"><div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">${li('nav-link')}</ul>
      
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div><div class="nav-mobile" id="navMobile"><ul class="nav-mobile-links">${li('nav-mobile-link')}</ul>
      </div></nav>
  <script>(function(){var n=document.getElementById('mainNav'),t=document.getElementById('navToggle'),mm=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');mm.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});window.addEventListener('scroll',function(){n.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/tier-list" class="footer-link">Tier List</a></li><li><a href="/tier-list/maker" class="footer-link">Tier List Maker</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Tier List Maker', url: BASE + '/tier-list/maker', applicationCategory: 'GameApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Make and share your own S to F tier list of digital nomad cities.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Tier lists', BASE + '/tier-lists'], ['Tier List Maker', BASE + '/tier-list/maker']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const tierRows = TIERS.map(([k, c]) => `        <div class="tm-row"><div class="tm-label" style="background:${c}" data-tier="${k}">${k}</div><div class="tm-zone" data-tier="${k}" aria-label="Tier ${k}"></div></div>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Nomad Tier List Maker: Rank & Share | The Nomad HQ</title>
  <meta name="description" content="Make your own digital nomad cities tier list. Drag cities into S to F tiers, add any city, and share your ranking with a link. Free and interactive.">
  <link rel="canonical" href="${BASE}/tier-list/maker">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Digital Nomad Tier List Maker | The Nomad HQ">
  <meta property="og:description" content="Drag cities into S to F tiers and share your ranking.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/tier-list/maker">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/tier-maker-hero.webp" fetchpriority="high">
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
    .hero-credit { position:absolute; bottom:8px; right:12px; z-index:3; font-size:10px; line-height:1.35; color:rgba(255,255,255,.8); background:rgba(0,0,0,.32); padding:2px 6px; border-radius:4px; text-decoration:none; backdrop-filter:blur(2px); } .hero-credit:hover { color:#fff; background:rgba(0,0,0,.55); }
    .hero-credit { position:absolute; bottom:8px; right:12px; z-index:3; font-size:10px; line-height:1.35; color:rgba(255,255,255,.8); background:rgba(0,0,0,.32); padding:2px 6px; border-radius:4px; text-decoration:none; backdrop-filter:blur(2px); } .hero-credit:hover { color:#fff; background:rgba(0,0,0,.55); }
    .tm-wrap { max-width:1080px; margin:0 auto; padding:1rem var(--space-4,1rem) 3.5rem; }
    .tm-board { border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; overflow:hidden; background:#fff; }
    .tm-row { display:flex; align-items:stretch; border-bottom:1px solid var(--color-sand,#f0e9dc); }
    .tm-row:last-child { border-bottom:none; }
    .tm-label { flex:0 0 62px; display:flex; align-items:center; justify-content:center; color:#fff; font-family:'DM Serif Display',serif; font-size:1.7rem; }
    .tm-zone { flex:1; min-height:64px; display:flex; flex-wrap:wrap; gap:.4rem; padding:.5rem; align-content:flex-start; }
    .tm-zone.tm-over { background:rgba(192,57,43,.06); }
    .tm-poolwrap { margin-top:1.5rem; }
    .tm-poolhead { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; margin:0 0 .7rem; }
    .tm-poolhead h2 { font-family:'DM Serif Display',serif; font-size:1.3rem; color:var(--color-ink); margin:0; }
    .tm-add { flex:1; min-width:200px; }
    .tm-add input { width:100%; box-sizing:border-box; font-family:inherit; font-size:.92rem; padding:.5rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .tm-pool { display:flex; flex-wrap:wrap; gap:.4rem; min-height:56px; padding:.6rem; background:var(--color-sand,#f6f1e7); border:1px dashed var(--color-sand-dark,#e3d9c6); border-radius:12px; align-content:flex-start; }
    .tm-pool.tm-over { border-color:var(--color-terracotta); background:rgba(192,57,43,.05); }
    .tm-chip { display:inline-flex; align-items:center; gap:.35rem; padding:.32rem .6rem; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:999px; font-size:.85rem; font-weight:600; color:var(--color-ink); cursor:grab; user-select:none; touch-action:manipulation; }
    .tm-chip img { border-radius:2px; }
    .tm-chip:hover { border-color:var(--color-terracotta); }
    .tm-chip.tm-sel { border-color:var(--color-terracotta); box-shadow:0 0 0 2px rgba(192,57,43,.25); }
    .tm-chip.tm-drag { opacity:.4; }
    .tm-actions { display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1.5rem; align-items:center; }
    .tm-actions button { font-family:inherit; font-size:.9rem; font-weight:600; padding:.55rem 1.1rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); }
    .tm-actions button.primary { background:var(--color-terracotta); color:#fff; border-color:var(--color-terracotta); }
    .tm-actions button:hover { border-color:var(--color-terracotta); }
    .tm-copied { color:#2f7d5a; font-weight:600; font-size:.9rem; }
    .tm-hint { font-size:.85rem; color:var(--color-stone); margin:1rem 0 0; line-height:1.6; }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/tier-maker-hero.webp" alt="The tiered green rice terraces of Tegallalang in Ubud, Bali, stepping down the hillside" fetchpriority="high" width="1920" height="1277">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Make your own</span>
        <h1>Tier List Maker</h1>
        <p class="sub">Drag cities into S through F to build your own nomad tier list, add any city you like, then share your ranking with a link. On a phone, tap a city then tap a tier.</p>
      </div></div>
      <a class="hero-credit" href="https://commons.wikimedia.org/wiki/File:Tegallalang_Rice_Terraces_Bali_1.jpg" target="_blank" rel="nofollow noopener">Photo: Philip Nalangan / Wikimedia Commons (CC BY 4.0)</a>
    </header>
    <div class="tm-wrap">
      <div class="tm-board" id="tmBoard">
${tierRows}
      </div>
      <div class="tm-poolwrap">
        <div class="tm-poolhead">
          <h2>Cities</h2>
          <div class="tm-add"><input type="search" id="tmAdd" list="tmCityList" placeholder="Add any city to the pool&hellip;" aria-label="Add a city"><datalist id="tmCityList"></datalist></div>
        </div>
        <div class="tm-pool tm-zone" data-tier="pool" id="tmPool" aria-label="Unranked cities"></div>
      </div>
      <div class="tm-actions">
        <button type="button" class="primary" id="tmShare">Copy share link</button>
        <button type="button" id="tmReset">Reset</button>
        <span id="tmMsg" class="tm-copied" hidden>Copied!</span>
      </div>
      <p class="tm-hint">This is your personal ranking, not our data-driven one. Want ours? See the <a href="/tier-list">official Nomad Cities Tier List</a>.</p>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(ALL)};
      var byId={}; CITIES.forEach(function(c){byId[c[0]]=c;});
      var SEED=${JSON.stringify(POOL)};
      var board=document.getElementById('tmBoard'),pool=document.getElementById('tmPool');
      var zones=[].slice.call(document.querySelectorAll('.tm-zone'));
      var dl=document.getElementById('tmCityList');
      CITIES.forEach(function(c){var o=document.createElement('option');o.value=c[1];dl.appendChild(o);});
      function chip(id){var c=byId[id];var el=document.createElement('div');el.className='tm-chip';el.draggable=true;el.dataset.id=id;
        el.innerHTML=(c[2]?'<img src="/assets/flags/'+c[2]+'.svg" alt="" width="16" height="12">':'')+c[1];
        el.addEventListener('dragstart',function(e){el.classList.add('tm-drag');try{e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move';}catch(_){}sel(null);});
        el.addEventListener('dragend',function(){el.classList.remove('tm-drag');});
        el.addEventListener('click',function(e){e.stopPropagation();sel(selected===el?null:el);});
        return el;}
      var selected=null;
      function sel(el){if(selected)selected.classList.remove('tm-sel');selected=el;if(el)el.classList.add('tm-sel');}
      function zoneFor(t){return t==='pool'?pool:document.querySelector('.tm-zone[data-tier="'+t+'"]');}
      function place(id,tier){var z=zoneFor(tier)||pool;var ex=board.parentNode.querySelector('.tm-chip[data-id="'+id+'"]');var el=ex||chip(id);z.appendChild(el);serialize();}
      zones.forEach(function(z){
        z.addEventListener('dragover',function(e){e.preventDefault();z.classList.add('tm-over');});
        z.addEventListener('dragleave',function(){z.classList.remove('tm-over');});
        z.addEventListener('drop',function(e){e.preventDefault();z.classList.remove('tm-over');var id;try{id=e.dataTransfer.getData('text/plain');}catch(_){}if(id&&byId[id]){var el=document.querySelector('.tm-chip[data-id="'+id+'"]');z.appendChild(el||chip(id));serialize();}});
        z.addEventListener('click',function(){if(selected){z.appendChild(selected);sel(null);serialize();}});
      });
      function serialize(){
        var parts=[];zones.forEach(function(z){var t=z.dataset.tier;if(t==='pool')return;var ids=[].map.call(z.querySelectorAll('.tm-chip'),function(e){return e.dataset.id;});if(ids.length)parts.push(t+'-'+ids.join('.'));});
        try{var u=new URL(window.location);if(parts.length)u.searchParams.set('tl',parts.join('_'));else u.searchParams.delete('tl');history.replaceState(null,'',u);}catch(e){}
      }
      // add city
      document.getElementById('tmAdd').addEventListener('change',function(){var v=this.value.trim().toLowerCase();var hit=CITIES.find(function(c){return c[1].toLowerCase()===v;})||CITIES.find(function(c){return c[1].toLowerCase().indexOf(v)===0;});if(hit){if(!document.querySelector('.tm-chip[data-id="'+hit[0]+'"]'))pool.appendChild(chip(hit[0]));this.value='';serialize();}});
      document.getElementById('tmShare').addEventListener('click',function(){try{navigator.clipboard.writeText(window.location.href);var mtag=document.getElementById('tmMsg');mtag.hidden=false;setTimeout(function(){mtag.hidden=true;},1600);}catch(e){}});
      document.getElementById('tmReset').addEventListener('click',function(){init(true);});
      document.body.addEventListener('click',function(){sel(null);});
      function init(reset){
        zones.forEach(function(z){z.innerHTML='';});
        var placed={};
        if(!reset){try{var p=new URLSearchParams(window.location.search).get('tl');if(p){p.split('_').forEach(function(seg){var i=seg.indexOf('-');if(i<0)return;var t=seg.slice(0,i);seg.slice(i+1).split('.').forEach(function(id){if(byId[id]){var z=zoneFor(t);if(z){z.appendChild(chip(id));placed[id]=1;}}});});}}catch(e){}}
        SEED.forEach(function(id){if(!placed[id])pool.appendChild(chip(id));});
        serialize();
      }
      init(false);
    })();
  </script>
</body>
</html>`;

fs.mkdirSync(path.join(ROOT, 'tier-list'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tier-list', 'maker.html'), html);
console.log(`Wrote tier-list/maker.html (pool seeded with ${POOL.length} cities, ${ALL.length} addable).`);
