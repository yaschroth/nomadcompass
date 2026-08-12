require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds /services: a directory of local service providers indexed by the language they work in.
 *
 * The premise: finding a dentist is easy, finding a dentist who can understand what hurts is not.
 * You pick a city, a service and a language, and get providers whose language claim we can point
 * at a source for.
 *
 * Every card is rendered into the static HTML rather than injected by JS, so crawlers and answer
 * engines see the listings; the filters only show and hide what is already on the page. Every row
 * carries an evidence tier (official / self-declared / directory / visited) and a link to where the
 * language claim was read, because "they speak English" is exactly the kind of claim that rots.
 *
 * Data: data/service-languages.json. Declared in data/provenance.json as "service-languages".
 * Run the head/body sweeps (finish with apply_tools_nav.cjs) + sitemap after.
 * Usage: node scripts/build_services.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (flag) => { const p = [...(flag || '')]; if (p.length !== 2) return ''; return p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join(''); };

const m = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
const CITY = {};
m.exports.forEach((c) => { if (c && c.id) CITY[c.id] = { name: c.name, country: c.country, iso: iso(c.flag) }; });

const DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
const CATS = DB._categories;
const LANGS = DB._languages;
const EVIDENCE = DB._evidence;

// Strongest evidence first, so the best-sourced row in a city leads.
const EV_RANK = { official: 0, visited: 1, 'self-declared': 2, directory: 3 };
const EV_LABEL = { official: 'Official list', visited: 'We confirmed', 'self-declared': 'Says so itself', directory: 'Directory only' };

const providers = DB.providers.slice();
const bad = providers.filter((p) => !CITY[p.city] || !CATS[p.category] || !p.sourceUrl || !EVIDENCE[p.evidence] || !p.languages || !p.languages.length || p.languages.some((l) => !LANGS[l]));
if (bad.length) {
  console.error('REFUSED: ' + bad.length + ' row(s) in data/service-languages.json are unusable:');
  bad.forEach((p) => console.error('  - ' + (p.name || '(unnamed)') + ' [' + p.city + '/' + p.category + '] missing a known city, category, language or sourceUrl/evidence'));
  process.exit(1);
}

providers.sort((a, b) =>
  CITY[a.city].name.localeCompare(CITY[b.city].name) ||
  CATS[a.category].localeCompare(CATS[b.category]) ||
  (EV_RANK[a.evidence] - EV_RANK[b.evidence]) ||
  a.name.localeCompare(b.name));

// Only offer filter options that actually return something.
const usedCities = [...new Set(providers.map((p) => p.city))].sort((a, b) => CITY[a].name.localeCompare(CITY[b].name));
const usedCats = [...new Set(providers.map((p) => p.category))].sort((a, b) => CATS[a].localeCompare(CATS[b]));
const usedLangs = [...new Set(providers.flatMap((p) => p.languages))].sort((a, b) => LANGS[a].localeCompare(LANGS[b]));

const cityOptions = usedCities.map((c) => `<option value="${c}">${esc(CITY[c].name)}, ${esc(CITY[c].country)}</option>`).join('');
const catOptions = usedCats.map((c) => `<option value="${c}">${esc(CATS[c])}</option>`).join('');
const langOptions = usedLangs.map((l) => `<option value="${l}">${esc(LANGS[l])}</option>`).join('');

function card(p) {
  const c = CITY[p.city];
  const flag = c.iso ? `<img class="sv-flag" src="/assets/flags/${c.iso}.svg" alt="" width="20" height="15" loading="lazy">` : '';
  const chips = p.languages.map((l) => `<span class="sv-lang">${esc(LANGS[l])}</span>`).join('');
  const host = (() => { try { return new URL(p.sourceUrl).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } })();
  const title = p.url
    ? `<a class="sv-name" href="${esc(p.url)}" target="_blank" rel="nofollow noopener">${esc(p.name)}</a>`
    : `<span class="sv-name">${esc(p.name)}</span>`;
  // Separators are glued to the preceding part with a non-breaking space, so a wrapped
  // location line never starts with a stray middot.
  const parts = [
    `${flag}<a href="/cities/${p.city}">${esc(c.name)}</a>`,
    p.area ? esc(p.area) : null,
    esc(CATS[p.category]),
  ].filter(Boolean);
  const where = parts.map((s, i) => s + (i < parts.length - 1 ? '&nbsp;&middot;' : '')).join(' ');
  return `<article class="sv-card" data-city="${p.city}" data-cat="${p.category}" data-lang="${p.languages.join(' ')}" data-name="${esc(p.name.toLowerCase())}">
        <div class="sv-top">${title}<span class="sv-ev sv-ev-${p.evidence}">${EV_LABEL[p.evidence]}</span></div>
        <p class="sv-where">${where}</p>
        <p class="sv-langs">Works in ${chips}</p>
        ${p.note ? `<p class="sv-note">${esc(p.note)}</p>` : ''}
        <p class="sv-src">Language claim read on <a href="${esc(p.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(host)}</a>, ${esc(p.checked || 'undated')}</p>
      </article>`;
}
const cards = providers.map(card).join('\n      ');

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}">${t}</a></li>`).join('');
  return `<nav class="nav" id="mainNav"><div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">${li('nav-link')}</ul>
      <form class="nav-search" action="/cities" method="get" role="search"><input type="search" name="q" placeholder="Jump to a city&hellip;" aria-label="Search a city" autocomplete="off" list="navCityList"><datalist id="navCityList"></datalist></form>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div><div class="nav-mobile" id="navMobile"><ul class="nav-mobile-links">${li('nav-mobile-link')}</ul>
      </div></nav>
  <script>(function(){var n=document.getElementById('mainNav'),t=document.getElementById('navToggle'),mm=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');mm.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});window.addEventListener('scroll',function(){n.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/services" class="footer-link">Services by Language</a></li><li><a href="/timezones" class="footer-link">Time Zone Finder</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Find Local Services by Language', url: BASE + '/services', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Find dentists, doctors, hairdressers, lawyers and mechanics abroad who work in a language you speak, with the source for every language claim.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Services by Language', BASE + '/services']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const nCities = usedCities.length, nCats = usedCats.length, nLangs = usedLangs.length;
const evCounts = Object.keys(EV_RANK).map((k) => [k, providers.filter((p) => p.evidence === k).length]).filter(([, n]) => n);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Find Local Services in Your Language | The Nomad HQ</title>
  <meta name="description" content="Dentists, doctors, hairdressers, lawyers and mechanics abroad who work in a language you actually speak. Every language claim links to its source.">
  <link rel="canonical" href="${BASE}/services">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Find Local Services in Your Language | The Nomad HQ">
  <meta property="og:description" content="Find a dentist, doctor or hairdresser abroad who speaks your language, with a source for every claim.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/services">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/services-hero.webp" fetchpriority="high">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  <style>
    /* Same photo-hero pattern as the other tool pages (see build_timezones.cjs). */
    .hub-hero { position:relative; width:100%; min-height:100vh; display:flex; align-items:flex-end; overflow:hidden; }
    .hub-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .hub-hero-overlay { position:relative; z-index:1; width:100%; padding:calc(var(--nav-height,64px) + 3rem) 0 3rem; background:linear-gradient(to top, rgba(15,23,42,.94), rgba(15,23,42,.66) 55%, rgba(15,23,42,.15) 88%, transparent); color:#fff; }
    /* The nav is transparent with dark text until it scrolls, so a dark hero swallows the logo.
       Same light band every photo hero on the site uses, so the nav stays readable at scroll 0. */
    .hub-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:calc(var(--nav-height,64px) + 44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
    .hub-hero .container { max-width:1040px; }
    .sv-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
    .hub-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.5rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
    .hub-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0; max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
    .hero-credit { position:absolute; right:.8rem; bottom:.55rem; z-index:2; font-size:.66rem; color:rgba(255,255,255,.6); text-decoration:none; }
    .hero-credit:hover { color:rgba(255,255,255,.92); text-decoration:underline; }
    .sv-wrap { max-width:1080px; margin:0 auto; padding:2rem var(--space-4,1rem) 3.5rem; }
    .sv-controls { display:flex; flex-wrap:wrap; gap:.8rem 1rem; align-items:flex-end; justify-content:center; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.25rem 1.4rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .sv-field { display:flex; flex-direction:column; gap:.35rem; }
    .sv-field label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); }
    .sv-field select, .sv-field input { font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; background:#fff; color:var(--color-ink); min-width:180px; }
    .sv-reset { font-family:inherit; font-size:.85rem; font-weight:600; color:var(--color-terracotta); background:none; border:none; cursor:pointer; text-decoration:underline; padding:.5rem 0; }
    .sv-count { text-align:center; font-size:.92rem; color:var(--color-stone); margin:1.5rem 0 .8rem; } .sv-count b { color:var(--color-ink); }
    .sv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1rem; }
    .sv-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:1.1rem 1.2rem; transition:border-color .15s, box-shadow .15s; }
    .sv-card:hover { border-color:var(--color-terracotta); box-shadow:0 10px 24px rgba(15,23,42,.08); }
    .sv-card.is-hidden { display:none; }
    .sv-top { display:flex; align-items:flex-start; gap:.6rem; margin-bottom:.45rem; }
    .sv-name { font-family:'DM Serif Display',serif; font-size:1.16rem; color:var(--color-ink); line-height:1.2; text-decoration:none; }
    a.sv-name:hover { color:var(--color-terracotta); text-decoration:underline; }
    .sv-ev { margin-left:auto; flex:0 0 auto; font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; border-radius:5px; padding:.2rem .4rem; white-space:nowrap; }
    .sv-ev-official { color:#1c5c3c; background:#dff2e5; }
    .sv-ev-visited { color:#1c5c3c; background:#bfe8cf; }
    .sv-ev-self-declared { color:#8a5a00; background:#fbeecb; }
    .sv-ev-directory { color:#5c6672; background:#eceff3; }
    .sv-where { font-size:.8rem; color:var(--color-stone); margin:0 0 .5rem; line-height:1.5; }
    .sv-where a { color:var(--color-stone); text-decoration:underline; }
    .sv-where a:hover { color:var(--color-terracotta); }
    /* base.css sets img{display:block}, which would drop the flag onto its own line. */
    .sv-flag { display:inline-block; border-radius:2px; box-shadow:0 0 0 1px rgba(0,0,0,.08); vertical-align:-2px; margin-right:.3rem; }
    .sv-langs { font-size:.8rem; color:var(--color-stone); margin:0 0 .55rem; }
    .sv-lang { display:inline-block; background:var(--color-sand,#f6f1e7); color:var(--color-charcoal); border-radius:5px; padding:.1rem .4rem; margin:0 .25rem .2rem 0; font-size:.76rem; font-weight:600; }
    .sv-note { font-size:.86rem; line-height:1.55; color:var(--color-charcoal); margin:0 0 .55rem; }
    .sv-src { font-size:.74rem; color:var(--color-stone); margin:auto 0 0; padding-top:.4rem; }
    .sv-src a { color:var(--color-stone); }
    .sv-empty { text-align:center; padding:2.5rem 1rem; color:var(--color-stone); }
    .sv-empty.is-hidden { display:none; }
    .sv-method { max-width:760px; margin:3rem auto 0; padding-top:1.75rem; border-top:1px solid var(--color-sand-dark,#e3d9c6); }
    .sv-method h2 { font-family:'DM Serif Display',serif; font-size:1.5rem; color:var(--color-ink); margin:0 0 .8rem; }
    .sv-method p { font-size:.92rem; line-height:1.7; color:var(--color-charcoal); margin:0 0 .9rem; }
    .sv-tiers { list-style:none; padding:0; margin:0 0 1rem; }
    .sv-tiers li { font-size:.9rem; line-height:1.6; color:var(--color-charcoal); padding:.5rem 0; border-bottom:1px solid var(--color-sand,#f6f1e7); }
    .sv-tiers .sv-ev { margin:0 .5rem 0 0; }
    @media (max-width:640px) { .sv-field select, .sv-field input { min-width:0; width:100%; } .sv-field { width:100%; } }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/services-hero.webp" alt="Shop signs and street lamps lighting Shavteli Street in the old town of Tbilisi at night" fetchpriority="high" width="1920" height="1090">
      <div class="hub-hero-overlay"><div class="container">
        <span class="sv-eyebrow">Living-abroad tool</span>
        <h1>Find services in a language you speak</h1>
        <p class="sub">Finding a dentist is easy. Finding one who understands what hurts is not. This is a directory of local providers indexed by the language they work in, and every language claim links to the source we read it on.</p>
      </div></div>
      <a class="hero-credit" href="https://commons.wikimedia.org/wiki/File:Shavteli_Street_at_Night_,_Tbilisi_Georgia.jpg" target="_blank" rel="nofollow noopener">Photo: Shalika Malintha / Wikimedia Commons (CC BY 2.0), cropped</a>
    </header>
    <div class="sv-wrap">
      <div class="sv-controls">
        <div class="sv-field"><label for="svCity">City</label><select id="svCity"><option value="all">Any city</option>${cityOptions}</select></div>
        <div class="sv-field"><label for="svCat">Service</label><select id="svCat"><option value="all">Any service</option>${catOptions}</select></div>
        <div class="sv-field"><label for="svLang">Language</label><select id="svLang"><option value="all">Any language</option>${langOptions}</select></div>
        <div class="sv-field"><label for="svQ">Search</label><input type="search" id="svQ" placeholder="Name contains..." autocomplete="off"></div>
        <button type="button" class="sv-reset" id="svReset">Reset</button>
      </div>
      <p class="sv-count" id="svCount">Showing all <b>${providers.length}</b> providers across <b>${nCities}</b> cities.</p>
      <div class="sv-grid" id="svGrid">
      ${cards}
      </div>
      <div class="sv-empty is-hidden" id="svEmpty">
        <p>Nothing matches that combination yet.</p>
        <p>This directory is early and deliberately small: a provider only appears once we can point at a source for the language it works in. If you know one that belongs here, <a href="/contact">tell us</a> and include where the language is stated.</p>
      </div>

      <section class="sv-method">
        <h2>How to read this</h2>
        <p>Currently ${providers.length} providers across ${nCities} cities, ${nCats} service types and ${nLangs} languages. It is small on purpose. Nothing goes in without a source, which rules out most of what a scraper would give us.</p>
        <p>Each card carries a tier saying <em>how</em> we know, because that matters more than the claim itself:</p>
        <ul class="sv-tiers">
          ${Object.keys(EV_RANK).map((k) => `<li><span class="sv-ev sv-ev-${k}">${EV_LABEL[k]}</span>${esc(EVIDENCE[k])}</li>`).join('\n          ')}
        </ul>
        <p><strong>We have not visited or called any of these providers.</strong> Nothing here carries the "we confirmed" tier yet, so treat every entry as a claim someone else made, not a recommendation from us. A hospital advertising interpretation services is not the same as a doctor who speaks your language, and a directory listing may be paid placement on the directory's side.</p>
        <p>Where the German Embassy in Bangkok is the source, note their own wording: the list is published without guarantee of accuracy or service quality, and naming a doctor or hospital does not constitute an endorsement. The same caution applies to everything else on this page.</p>
        <p>No provider has paid to appear here, and there are no affiliate links in these listings. If that ever changes, paid placement will be labelled as paid.</p>
      </section>
    </div>
  </main>
  ${FOOTER}
  <script>
    (function(){
      var grid=document.getElementById('svGrid'),count=document.getElementById('svCount'),empty=document.getElementById('svEmpty');
      var citySel=document.getElementById('svCity'),catSel=document.getElementById('svCat'),langSel=document.getElementById('svLang'),q=document.getElementById('svQ');
      var cards=[].slice.call(grid.querySelectorAll('.sv-card'));
      var CITY_LABEL=${JSON.stringify(Object.fromEntries(usedCities.map((c) => [c, CITY[c].name])))};
      var CAT_LABEL=${JSON.stringify(Object.fromEntries(usedCats.map((c) => [c, CATS[c]])))};
      var LANG_LABEL=${JSON.stringify(Object.fromEntries(usedLangs.map((l) => [l, LANGS[l]])))};
      function render(){
        var city=citySel.value,cat=catSel.value,lang=langSel.value,term=(q.value||'').trim().toLowerCase();
        var shown=0;
        cards.forEach(function(el){
          var ok=(city==='all'||el.getAttribute('data-city')===city)
            &&(cat==='all'||el.getAttribute('data-cat')===cat)
            &&(lang==='all'||(' '+el.getAttribute('data-lang')+' ').indexOf(' '+lang+' ')>-1)
            &&(!term||el.getAttribute('data-name').indexOf(term)>-1);
          el.classList.toggle('is-hidden',!ok);
          if(ok)shown++;
        });
        var bits=[];
        if(cat!=='all')bits.push('under '+CAT_LABEL[cat]);
        if(lang!=='all')bits.push('working in '+LANG_LABEL[lang]);
        if(city!=='all')bits.push('in '+CITY_LABEL[city]);
        count.innerHTML='Showing <b>'+shown+'</b> '+(shown===1?'provider':'providers')+(bits.length?' '+bits.join(', '):'')+'.';
        empty.classList.toggle('is-hidden',shown>0);
        try{
          var u=new URL(window.location);
          [['city',city],['cat',cat],['lang',lang]].forEach(function(p){ if(p[1]==='all')u.searchParams.delete(p[0]); else u.searchParams.set(p[0],p[1]); });
          history.replaceState(null,'',u);
        }catch(e){}
      }
      [citySel,catSel,langSel].forEach(function(s){s.addEventListener('change',render);});
      q.addEventListener('input',render);
      document.getElementById('svReset').addEventListener('click',function(){citySel.value='all';catSel.value='all';langSel.value='all';q.value='';render();});
      (function(){
        var sp=new URLSearchParams(window.location.search);
        function set(sel,v){ if(!v)return; for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){sel.value=v;return;} } }
        set(citySel,sp.get('city'));set(catSel,sp.get('cat'));set(langSel,sp.get('lang'));
        if(sp.get('city')||sp.get('cat')||sp.get('lang'))render();
      })();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'services.html'), html);
console.log(`Wrote services.html: ${providers.length} providers, ${nCities} cities, ${nCats} services, ${nLangs} languages.`);
console.log('  evidence: ' + evCounts.map(([k, n]) => k + ' ' + n).join(', '));
