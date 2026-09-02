require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds /visa: a visa finder by passport. Pick your passport and see, for every nomad city,
 * whether your destination country is visa-free / visa-on-arrival / e-visa / visa-required, with
 * visa-free day counts and a "digital nomad visa" badge. Data from assets/visa-data.js (derived
 * from the passport-index-dataset via build_visa_data.cjs). Shareable via ?passport=Germany.
 * Run the head/body sweeps (finish with apply_tools_nav.cjs) + sitemap after. Usage: node scripts/build_visa_finder.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));
const BASE = 'https://thenomadhq.com';
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };
const VISA = require(path.join(ROOT, 'assets', 'visa-data.js'));
const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const nomadScore = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); const raw = n ? t / n : 0; return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1); };
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};
const NAMEFIX = { UAE: 'United Arab Emirates', 'Puerto Rico': 'United States', UK: 'United Kingdom', Bosnia: 'Bosnia and Herzegovina', 'New Caledonia': 'France' };
const destIdx = {}; VISA.D.forEach((d, i) => { destIdx[d] = i; });

// countries (canonical) that offer a digital nomad / remote-work visa (editorial, 2025)
const NV = ['Portugal', 'Spain', 'Greece', 'Italy', 'Croatia', 'Malta', 'Estonia', 'Latvia', 'Hungary', 'Czech Republic', 'Romania', 'Cyprus', 'Iceland', 'Norway', 'Germany', 'Georgia', 'Armenia', 'United Arab Emirates', 'Bahrain', 'Costa Rica', 'Mexico', 'Panama', 'Colombia', 'Brazil', 'Argentina', 'Ecuador', 'Uruguay', 'Cape Verde', 'Mauritius', 'Namibia', 'Seychelles', 'South Africa', 'Thailand', 'Indonesia', 'Malaysia', 'Sri Lanka', 'Japan', 'South Korea', 'Taiwan', 'Montenegro', 'Albania', 'Serbia', 'Dominican Republic', 'Israel', 'Turkey'];
const nvIdx = new Set(NV.map((n) => destIdx[n]).filter((i) => i !== undefined));

// [id, name, displayCountry, destIdx, iso, region, score]
const DATA = m.exports.filter((c) => c && c.id && c.country).map((c) => {
  const canon = NAMEFIX[c.country] || c.country;
  return [c.id, c.name, c.country, destIdx[canon] === undefined ? -1 : destIdx[canon], iso(c.flag), REGION[c.id] || '', nomadScore(c)];
}).filter((d) => d[3] >= 0);

const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'Middle East', northamerica: 'North America', oceania: 'Oceania' };
const regionOptions = Object.keys(REGION_NAMES).map((r) => `<option value="${r}">${REGION_NAMES[r]}</option>`).join('');


const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Visa Finder', url: BASE + '/visa', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'See which nomad cities your passport can enter visa-free, on arrival, with an e-visa, and where a digital nomad visa exists.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Visa Finder', BASE + '/visa']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Finder by Passport for Digital Nomads | The Nomad HQ</title>
  <meta name="description" content="Pick your passport and see which nomad cities you can enter visa-free, on arrival or with an e-visa, plus which countries offer a digital nomad visa. Free.">
  <link rel="canonical" href="${BASE}/visa">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Visa Finder by Passport | The Nomad HQ">
  <meta property="og:description" content="Where can your passport go visa-free? Find out for every nomad city.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/visa">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/visa-hero.webp" fetchpriority="high">
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
    .vf-wrap { max-width:1180px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3.5rem; }
    .vf-controls { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.1rem 1.2rem; box-shadow:0 8px 24px rgba(15,23,42,.05); margin-bottom:1.4rem; }
    .vf-row { display:flex; flex-wrap:wrap; gap:.8rem 1.1rem; align-items:end; }
    .vf-field label { display:block; font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .3rem; font-weight:600; }
    .vf-field input, .vf-field select { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .vf-field input { min-width:230px; }
    .vf-toggle { display:inline-flex; align-items:center; gap:.4rem; font-size:.9rem; color:var(--color-charcoal); cursor:pointer; padding-bottom:.55rem; }
    .vf-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:.8rem; margin-bottom:1.4rem; }
    .vf-stat { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:13px; padding:.8rem .9rem; cursor:pointer; position:relative; }
    .vf-stat.sel { border-color:var(--color-terracotta); box-shadow:0 0 0 2px rgba(192,57,43,.15); }
    .vf-stat .n { font-size:1.7rem; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
    .vf-stat .k { font-size:.74rem; color:var(--color-stone); margin-top:.25rem; }
    .vf-stat.vf .n { color:#2f7d5a; } .vf-stat.voa .n { color:#1f8a8a; } .vf-stat.evisa .n { color:#3d6493; } .vf-stat.vr .n { color:#b23; }
    .vf-count { font-size:1rem; color:var(--color-charcoal); margin:0 0 1rem; } .vf-count b { color:var(--color-ink); }
    .vf-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; }
    .vf-card { display:block; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1rem 1.1rem; text-decoration:none; box-shadow:0 6px 16px rgba(15,23,42,.05); transition:transform .15s, box-shadow .15s, border-color .15s; }
    .vf-card:hover { transform:translateY(-3px); box-shadow:0 14px 30px rgba(15,23,42,.1); border-color:var(--color-terracotta); }
    .vf-card-top { display:flex; align-items:center; gap:.5rem; }
    .vf-name { font-weight:700; color:var(--color-ink); font-size:1.05rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .vf-score { font-size:.78rem; font-weight:800; color:#fff; background:var(--color-terracotta); border-radius:7px; padding:.1rem .4rem; }
    .vf-country { font-size:.8rem; color:var(--color-stone); margin:.15rem 0 .7rem; }
    .vf-status { display:inline-block; font-size:.78rem; font-weight:700; padding:.25rem .65rem; border-radius:999px; }
    .st-vf { background:#e6f0ea; color:#2f7d5a; } .st-voa { background:#e0f0f0; color:#1f8a8a; } .st-evisa { background:#e8eef6; color:#3d6493; } .st-vr { background:#fbe9e6; color:#b23; } .st-home { background:#eef1f4; color:#64748b; } .st-na { background:#3a3a3a; color:#fff; }
    .vf-nomad { display:inline-block; margin-top:.55rem; margin-left:.4rem; font-size:.72rem; font-weight:700; color:#8a5a00; background:#fbeecb; padding:.2rem .55rem; border-radius:999px; }
    .vf-empty { color:var(--color-stone); padding:2rem 0; text-align:center; }
    .vf-share { margin-top:1.5rem; } .vf-share button { font-family:inherit; font-size:.85rem; font-weight:600; padding:.55rem 1.1rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); } .vf-share button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .vf-disclaim { font-size:.78rem; color:var(--color-stone); margin-top:1rem; line-height:1.6; }
  </style>
  ${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.navFor('Visa Finder')}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/visa-hero.webp" alt="A passport resting on a world map" fetchpriority="high" width="1920" height="1280">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Trip tool</span>
        <h1>Where can your passport go?</h1>
        <p class="sub">Pick your passport and see which nomad cities are visa-free, visa-on-arrival or e-visa for you, and which countries offer a digital nomad visa for a longer stay.</p>
      </div></div>
    </header>
    <div class="vf-wrap">
      <div class="vf-controls">
        <div class="vf-row">
          <div class="vf-field"><label for="vfPass">Your passport</label><input type="search" id="vfPass" list="vfPassList" placeholder="Type your country&hellip;" autocomplete="off"><datalist id="vfPassList"></datalist></div>
          <div class="vf-field"><label for="vfRegion">Region</label><select id="vfRegion"><option value="">Anywhere</option>${regionOptions}</select></div>
          <label class="vf-toggle"><input type="checkbox" id="vfNomad"> Only countries with a nomad visa</label>
        </div>
      </div>
      <div class="vf-summary" id="vfSummary"></div>
      <p class="vf-count" id="vfCount"></p>
      <div class="vf-grid" id="vfGrid"></div>
      <div class="vf-share"><button type="button" id="vfShare">Copy share link</button></div>
      <p class="vf-disclaim">Visa data derived from the open <a href="https://github.com/ilyankou/passport-index-dataset" target="_blank" rel="nofollow noopener">Passport Index dataset</a> (CC BY-SA 4.0); "nomad visa" flags are our own editorial list. Rules change often and depend on your exact situation, so always confirm with the official embassy before you book. Tourist-entry status only, not work authorization.</p>
    </div>
  </main>
  ${shell.footer}
${shell.bodyEnd}
  <script>
    (function(){
      var VD=${JSON.stringify(VISA)};
      var CITIES=${JSON.stringify(DATA)};
      var NV=${JSON.stringify([...nvIdx])};
      var nvSet={}; NV.forEach(function(i){nvSet[i]=1;});
      var passInput=document.getElementById('vfPass'),dl=document.getElementById('vfPassList'),regionSel=document.getElementById('vfRegion'),nomadChk=document.getElementById('vfNomad');
      var grid=document.getElementById('vfGrid'),count=document.getElementById('vfCount'),summaryEl=document.getElementById('vfSummary');
      var passport='United States', filter='';
      VD.P.forEach(function(p){var o=document.createElement('option');o.value=p;dl.appendChild(o);});
      function parseV(p){var map={};var s=VD.V[p];if(s)s.split(',').forEach(function(tok){var i=tok.indexOf(':');map[+tok.slice(0,i)]=tok.slice(i+1);});return map;}
      function statusOf(map,idx,cityCanonIsHome){
        if(cityCanonIsHome)return ['Passport country','st-home','home'];
        var v=map[idx];
        if(v===undefined)return ['Visa required','st-vr','vr'];
        if(v==='X')return ['No entry','st-na','vr'];
        if(v==='O')return ['Visa on arrival','st-voa','voa'];
        if(v==='E')return ['e-Visa','st-evisa','evisa'];
        if(v==='A')return ['ETA','st-evisa','evisa'];
        if(v==='F')return ['Visa-free','st-vf','vf'];
        return ['Visa-free '+v+' days','st-vf','vf'];
      }
      function render(){
        var map=parseV(passport);var homeIdx=VD.D.indexOf(passport);
        var region=regionSel.value, nomadOnly=nomadChk.checked;
        var counts={vf:0,voa:0,evisa:0,vr:0};
        var cards=[];
        CITIES.forEach(function(c){
          if(region&&c[5]!==region)return;
          if(nomadOnly&&!nvSet[c[3]])return;
          var st=statusOf(map,c[3],c[3]===homeIdx);
          if(st[2]!=='home')counts[st[2]]++;
          if(filter&&st[2]!==filter)return;
          cards.push({c:c,st:st});
        });
        // order: visa-free (by days desc-ish) then voa, evisa, vr; within, by score
        var rank={vf:0,voa:1,evisa:2,home:3,vr:4};
        cards.sort(function(a,b){return (rank[a.st[2]]-rank[b.st[2]])||(b.c[6]-a.c[6]);});
        // summary tiles
        var sum=[['vf','Visa-free',counts.vf],['voa','On arrival',counts.voa],['evisa','e-Visa / ETA',counts.evisa],['vr','Visa required',counts.vr]];
        summaryEl.innerHTML=sum.map(function(s){return '<div class="vf-stat '+s[0]+(filter===s[0]?' sel':'')+'" data-f="'+s[0]+'"><div class="n">'+s[2]+'</div><div class="k">'+s[1]+'</div></div>';}).join('');
        [].forEach.call(summaryEl.children,function(el){el.addEventListener('click',function(){filter=(filter===el.dataset.f)?'':el.dataset.f;render();});});
        count.innerHTML='With a <b>'+passport+'</b> passport'+(region?' in '+regionSel.options[regionSel.selectedIndex].text:'')+(nomadOnly?' (nomad-visa countries)':'')+': showing <b>'+cards.length+'</b> cit'+(cards.length===1?'y':'ies')+(filter?' ('+({vf:'visa-free',voa:'visa on arrival',evisa:'e-visa/ETA',vr:'visa required'}[filter])+')':'')+'.';
        if(!cards.length){grid.innerHTML='<p class="vf-empty">No cities match. Clear the filters to see more.</p>';}
        else{grid.innerHTML=cards.map(function(o){var c=o.c;var flag=c[4]?'<img src="/assets/flags/'+c[4]+'.svg" alt="" width="22" height="16" style="border-radius:3px;vertical-align:middle;">':'';
          var nomad=nvSet[c[3]]?'<span class="vf-nomad">Nomad visa</span>':'';
          return '<a class="vf-card" href="/cities/'+c[0]+'"><div class="vf-card-top">'+flag+'<span class="vf-name">'+c[1]+'</span><span class="vf-score">'+c[6].toFixed(1)+'</span></div>'
            +'<div class="vf-country">'+c[2]+'</div>'
            +'<span class="vf-status '+o.st[1]+'">'+o.st[0]+'</span>'+nomad+'</a>';}).join('');}
        try{var u=new URL(window.location);u.searchParams.set('passport',passport);if(region)u.searchParams.set('region',region);else u.searchParams.delete('region');if(nomadOnly)u.searchParams.set('nomad','1');else u.searchParams.delete('nomad');history.replaceState(null,'',u);}catch(e){}
      }
      passInput.addEventListener('change',function(){var v=passInput.value.trim();var hit=VD.P.find(function(p){return p.toLowerCase()===v.toLowerCase();});if(hit){passport=hit;filter='';render();}});
      regionSel.addEventListener('change',render); nomadChk.addEventListener('change',render);
      document.getElementById('vfShare').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText(window.location.href);b.textContent='Copied!';setTimeout(function(){b.textContent='Copy share link';},1500);}catch(e){}});
      (function(){var sp=new URLSearchParams(window.location.search);var pp=sp.get('passport');if(pp){var hit=VD.P.find(function(p){return p.toLowerCase()===pp.toLowerCase();});if(hit)passport=hit;}
        passInput.value=passport; var rp=sp.get('region');if(rp)regionSel.value=rp; if(sp.get('nomad')==='1')nomadChk.checked=true; render();})();
    })();
  </script>
</body>
</html>`;

shell.assertComplete(html, 'visa.html');
shell.writePage('visa.html', html);
console.log(`Wrote visa.html (${DATA.length} cities, ${VISA.P.length} passports, ${nvIdx.size} nomad-visa countries).`);
