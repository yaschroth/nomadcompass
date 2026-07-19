/**
 * Builds /route: a Nomad Route Planner. Add cities to an ordered route; they plot on the
 * world map connected by a path, with total distance (haversine), total + average monthly
 * budget, and stop count. Shareable via ?route=id,id,id. City data (id,name,country,iso,
 * lat,lng,cost,score) is baked in. Run the head/body sweeps + sitemap afterwards.
 * Usage: node scripts/build_route.cjs
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
const DATA = m.exports.filter((c) => c && c.id && typeof c.lat === 'number' && typeof c.lng === 'number').map((c) => [
  c.id, c.name, c.country, iso(c.flag), c.lat, c.lng, typeof c.costPerMonth === 'number' ? c.costPerMonth : 0, nomadScore(c),
]);
const DEFAULT_ROUTE = ['lisbon', 'barcelona', 'medellin', 'bali'].filter((id) => DATA.some((d) => d[0] === id));

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
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/route" class="footer-link">Route Planner</a></li><li><a href="/timezones" class="footer-link">Time Zone Finder</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Route Planner', url: BASE + '/route', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Chain digital nomad cities into a route on the world map and see the total distance and monthly budget.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Route Planner', BASE + '/route']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nomad Route Planner: Map Your Trip & Budget | The Nomad HQ</title>
  <meta name="description" content="Chain digital nomad cities into a route on the world map, then see the total distance and total monthly budget for your trip. Shareable, free.">
  <link rel="canonical" href="${BASE}/route">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Nomad Route Planner | The Nomad HQ">
  <meta property="og:description" content="Map a multi-city nomad route and see the total budget.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/route">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="preload" as="image" href="/assets/route-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    .rt-hero { position:relative; min-height:clamp(360px,58vh,540px); display:flex; align-items:flex-end; overflow:hidden; }
    .rt-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .rt-hero-overlay { position:relative; z-index:2; width:100%; padding:calc(var(--nav-height,64px) + 2.75rem) 0 2.4rem; background:linear-gradient(to top, rgba(15,23,42,.92), rgba(15,23,42,.6) 55%, rgba(15,23,42,.12) 88%, transparent); color:#fff; }
    .rt-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:calc(var(--nav-height,64px) + 46px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.82), rgba(255,255,255,.34) 55%, transparent); }
    .rt-hero .container { max-width:1040px; }
    .rt-crumbs { font-size:.82rem; color:rgba(255,255,255,.82); margin:0 0 1rem; } .rt-crumbs a { color:#fff; text-decoration:none; } .rt-crumbs a:hover { text-decoration:underline; } .rt-crumbs span { margin:0 .4rem; color:rgba(255,255,255,.5); }
    .rt-eyebrow { display:inline-block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .7rem; text-shadow:0 1px 10px rgba(0,0,0,.4); }
    .rt-hero h1 { font-family:'DM Serif Display',serif; color:#fff; font-size:clamp(2.2rem,5.5vw,3.4rem); line-height:1.08; margin:0 0 .9rem; text-shadow:0 2px 24px rgba(0,0,0,.45); text-wrap:balance; }
    .rt-hero p.rt-sub { color:rgba(255,255,255,.92); font-size:1.12rem; line-height:1.6; margin:0; max-width:58ch; text-shadow:0 1px 12px rgba(0,0,0,.4); }
    .rt-wrap { max-width:1280px; margin:0 auto; padding:1rem var(--space-4,1rem) 3.5rem; display:grid; grid-template-columns:1fr 340px; gap:1.5rem; align-items:start; }
    @media (max-width:900px){ .rt-wrap{ grid-template-columns:1fr; } }
    .rt-map { position:relative; width:100%; aspect-ratio:2/1; background:#eef1f4 url('/assets/world-map.webp') center/100% 100% no-repeat; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; overflow:hidden; }
    .rt-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .rt-dot { position:absolute; width:7px; height:7px; margin:-3.5px 0 0 -3.5px; border-radius:50%; background:#8a8175; opacity:.45; cursor:pointer; z-index:2; transition:transform .1s; }
    .rt-dot:hover { transform:scale(1.8); opacity:1; background:var(--color-terracotta); z-index:6; }
    .rt-stop { position:absolute; width:24px; height:24px; margin:-12px 0 0 -12px; border-radius:50%; background:var(--color-terracotta); color:#fff; font-size:.75rem; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(15,23,42,.35); z-index:5; }
    .rt-panel { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.2rem 1.3rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .rt-add { position:relative; margin:0 0 1rem; }
    .rt-add input { width:100%; box-sizing:border-box; font-family:inherit; font-size:.95rem; padding:.6rem .8rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .rt-list { list-style:none; margin:0 0 1rem; padding:0; }
    .rt-item { display:flex; align-items:center; gap:.55rem; padding:.55rem 0; border-bottom:1px solid var(--color-sand,#f0e9dc); }
    .rt-item:last-child { border-bottom:none; }
    .rt-num { flex:0 0 auto; width:22px; height:22px; border-radius:50%; background:var(--color-terracotta); color:#fff; font-size:.72rem; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .rt-item-body { flex:1; min-width:0; } .rt-item-name { display:block; font-weight:700; color:var(--color-ink); font-size:.95rem; } .rt-item-sub { display:block; font-size:.75rem; color:var(--color-stone); margin-top:.1rem; }
    .rt-item-btns { display:flex; gap:.15rem; flex:0 0 auto; }
    .rt-item-btns button { width:24px; height:24px; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; border-radius:6px; cursor:pointer; color:var(--color-stone); font-size:.8rem; line-height:1; }
    .rt-item-btns button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .rt-empty { color:var(--color-stone); font-size:.9rem; padding:1rem 0; text-align:center; }
    .rt-totals { border-top:1px solid var(--color-sand-dark,#e3d9c6); padding-top:1rem; }
    .rt-total-row { display:flex; justify-content:space-between; font-size:.92rem; margin:.3rem 0; color:var(--color-charcoal); }
    .rt-total-row b { color:var(--color-ink); }
    .rt-total-big { font-family:'DM Serif Display',serif; font-size:1.5rem; color:var(--color-terracotta); }
    .rt-actions { display:flex; gap:.5rem; margin-top:1rem; }
    .rt-actions button { flex:1; font-family:inherit; font-size:.85rem; font-weight:600; padding:.55rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); }
    .rt-actions button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .rt-hint { font-size:.8rem; color:var(--color-stone); margin:.8rem 0 0; }
    .rt-copied { color:#2f7d5a; font-weight:600; }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="rt-hero">
      <img class="rt-hero-img" src="/assets/route-hero.webp" alt="The winding hairpin bends of the Transfagarasan mountain road through green Romanian peaks" fetchpriority="high" width="1920" height="1275">
      <div class="rt-hero-overlay"><div class="container">
      <nav class="rt-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Route Planner</nav>
      <span class="rt-eyebrow">Trip tool</span>
      <h1>Nomad Route Planner</h1>
      <p class="rt-sub">Sketch a multi-city run across a few months. Add cities in the order you would visit them, see the path on the map, and get the total distance and monthly budget at a glance.</p>
      </div></div>
    </header>
    <div class="rt-wrap">
      <div class="rt-map" id="rtMap">
        <svg class="rt-svg" viewBox="0 0 360 180" preserveAspectRatio="none"><polyline id="rtLine" fill="none" stroke="#c0392b" stroke-width="1.1" stroke-dasharray="2.4 1.8" stroke-linejoin="round" stroke-linecap="round" points=""></polyline></svg>
      </div>
      <aside class="rt-panel">
        <div class="rt-add"><input type="search" id="rtAdd" list="rtCityList" placeholder="Add a city to the route&hellip;" aria-label="Add a city"><datalist id="rtCityList"></datalist></div>
        <ol class="rt-list" id="rtList"></ol>
        <div class="rt-totals">
          <div class="rt-total-row"><span>Stops</span><b id="rtStops">0</b></div>
          <div class="rt-total-row"><span>Total distance</span><b id="rtDist">0 km</b></div>
          <div class="rt-total-row"><span>Avg monthly budget</span><b id="rtAvg">n/a</b></div>
          <div class="rt-total-row" style="margin-top:.6rem;align-items:baseline;"><span>Budget per month</span><span class="rt-total-big" id="rtBudget">$0</span></div>
        </div>
        <div class="rt-actions"><button type="button" id="rtShare">Copy share link</button><button type="button" id="rtClear">Clear</button></div>
        <p class="rt-hint" id="rtHint">Tip: click a faint dot on the map to add that city, or search above. "Budget per month" sums each stop's estimated monthly cost.</p>
      </aside>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var byId={}; CITIES.forEach(function(c){byId[c[0]]=c;});
      var map=document.getElementById('rtMap'),line=document.getElementById('rtLine'),list=document.getElementById('rtList');
      var addInput=document.getElementById('rtAdd'),dl=document.getElementById('rtCityList');
      var route=[];
      var money=function(v){return v?'$'+v.toLocaleString('en-US'):'$0';};
      // faint dots for all cities + datalist
      var frag=document.createDocumentFragment();
      CITIES.forEach(function(c){
        var d=document.createElement('a');d.className='rt-dot';d.href='#';d.title=c[1];
        d.style.left=((c[5]+180)/360*100).toFixed(3)+'%';d.style.top=((90-c[4])/180*100).toFixed(3)+'%';
        d.addEventListener('click',function(e){e.preventDefault();add(c[0]);});
        map.appendChild(d);
        var o=document.createElement('option');o.value=c[1];dl.appendChild(o);
      });
      function dist(a,b){var R=6371,dLat=(b[4]-a[4])*Math.PI/180,dLng=(b[5]-a[5])*Math.PI/180;var s=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[4]*Math.PI/180)*Math.cos(b[4]*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);return 2*R*Math.asin(Math.sqrt(s));}
      function add(id){if(!byId[id]||route.indexOf(id)>=0)return;route.push(id);render();}
      function render(){
        // clear stop markers
        [].slice.call(map.querySelectorAll('.rt-stop')).forEach(function(e){e.remove();});
        // markers + line
        var pts=[];
        route.forEach(function(id,i){var c=byId[id];var x=(c[5]+180),y=(90-c[4]);pts.push(x+','+y);
          var mk=document.createElement('div');mk.className='rt-stop';mk.textContent=i+1;mk.style.left=((c[5]+180)/360*100).toFixed(3)+'%';mk.style.top=((90-c[4])/180*100).toFixed(3)+'%';mk.title=c[1];map.appendChild(mk);});
        line.setAttribute('points',pts.join(' '));
        // list
        if(!route.length){list.innerHTML='<li class="rt-empty">No stops yet. Search a city or click a dot on the map.</li>';}
        else{list.innerHTML=route.map(function(id,i){var c=byId[id];var flag=c[3]?'<img src="/assets/flags/'+c[3]+'.svg" alt="" width="18" height="13" style="border-radius:2px;vertical-align:middle;margin-right:.3rem;">':'';
          return '<li class="rt-item"><span class="rt-num">'+(i+1)+'</span><span class="rt-item-body"><span class="rt-item-name">'+flag+c[1]+'</span><span class="rt-item-sub">'+c[2]+' &middot; '+money(c[6])+'/mo</span></span>'
            +'<span class="rt-item-btns"><button data-up="'+i+'" title="Move up" aria-label="Move up">&uarr;</button><button data-down="'+i+'" title="Move down" aria-label="Move down">&darr;</button><button data-rm="'+i+'" title="Remove" aria-label="Remove">&times;</button></span></li>';
        }).join('');}
        // totals
        var tot=0,budget=0,nb=0;for(var i=0;i<route.length;i++){var c=byId[route[i]];if(c[6]){budget+=c[6];nb++;}if(i>0)tot+=dist(byId[route[i-1]],c);}
        document.getElementById('rtStops').textContent=route.length;
        document.getElementById('rtDist').textContent=Math.round(tot).toLocaleString('en-US')+' km';
        document.getElementById('rtBudget').textContent=money(budget);
        document.getElementById('rtAvg').textContent=nb?money(Math.round(budget/nb))+'/mo':'n/a';
        try{var u=new URL(window.location);if(route.length)u.searchParams.set('route',route.join(','));else u.searchParams.delete('route');history.replaceState(null,'',u);}catch(e){}
      }
      list.addEventListener('click',function(e){var t=e.target;if(t.dataset.rm!=null){route.splice(+t.dataset.rm,1);render();}else if(t.dataset.up!=null){var i=+t.dataset.up;if(i>0){var s=route.splice(i,1)[0];route.splice(i-1,0,s);render();}}else if(t.dataset.down!=null){var i=+t.dataset.down;if(i<route.length-1){var s=route.splice(i,1)[0];route.splice(i+1,0,s);render();}}});
      addInput.addEventListener('change',function(){var v=addInput.value.trim().toLowerCase();var hit=CITIES.find(function(c){return c[1].toLowerCase()===v;})||CITIES.find(function(c){return c[1].toLowerCase().indexOf(v)===0;});if(hit){add(hit[0]);addInput.value='';}});
      document.getElementById('rtClear').addEventListener('click',function(){route=[];render();});
      document.getElementById('rtShare').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText(window.location.href);b.textContent='Copied!';b.classList.add('rt-copied');setTimeout(function(){b.textContent='Copy share link';b.classList.remove('rt-copied');},1600);}catch(e){}});
      // init from ?route= or default
      try{var p=new URLSearchParams(window.location.search).get('route');if(p){p.split(',').forEach(function(id){if(byId[id])route.push(id);});}}catch(e){}
      if(!route.length)route=${JSON.stringify(DEFAULT_ROUTE)}.slice();
      render();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'route.html'), html);
console.log(`Wrote route.html (${DATA.length} cities, default route: ${DEFAULT_ROUTE.join(' -> ')}).`);
