/**
 * Builds the curated "Best cities for <activity>" editorial pages + a /activities hub from
 * content-activity-<slug>.json (written by research agents). These are EDITORIAL, curated
 * picks (surf, diving, kayaking, shopping), clearly distinguished from the data-driven
 * rankings/tier lists. Matched cities link to their guide and show a thumbnail.
 * Usage: node scripts/build_activities.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const txt = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paras = (s) => String(s || '').split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const mm = {}; new Function('module', code + ';module.exports=CITIES')(mm);
const CITYBYID = {}; mm.exports.forEach((c) => { CITYBYID[c.id] = c; });

const SLUGS = ['surfing', 'diving', 'kayaking', 'shopping'];
const activities = SLUGS.map((s) => {
  const f = path.join(ROOT, 'content-activity-' + s + '.json');
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
}).filter(Boolean);

const NAV = `  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li><li><a href="/map" class="nav-link">Map</a></li>
        <li><a href="/best" class="nav-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-link">Tier List</a></li>
        <li><a href="/compare" class="nav-link">Compare</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions"><a href="/login" class="nav-login">Login</a><a href="/signup" class="btn btn-primary nav-signup">Sign Up</a></div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false"><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span><span class="nav-toggle-line"></span></button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="/" class="nav-mobile-link">Home</a></li>
        <li><a href="/wheel" class="nav-mobile-link">Wheel</a></li>
        <li><a href="/cities" class="nav-mobile-link">Cities</a></li><li><a href="/map" class="nav-mobile-link">Map</a></li>
        <li><a href="/best" class="nav-mobile-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-mobile-link">Tier List</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div>
    </div>
  </nav>`;
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/best" class="footer-link">Rankings</a></li><li><a href="/tier-list" class="footer-link">Tier List</a></li><li><a href="/activities" class="footer-link">By Activity</a></li><li><a href="/compare" class="footer-link">Compare</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
const NAVJS = `<script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;

const CSS = `
  .act-hero { position:relative; width:100%; min-height:70vh; display:flex; align-items:flex-end; overflow:hidden; }
  .act-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .act-hero-overlay { position:relative; z-index:1; width:100%; padding: calc(var(--nav-height,64px) + 2.5rem) 0 2.75rem; background:linear-gradient(to top, rgba(15,23,42,.95) 0%, rgba(15,23,42,.7) 55%, rgba(15,23,42,.2) 85%, transparent); color:#fff; }
  .act-hero::before { content:''; position:absolute; top:0;left:0;right:0; height:calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
  .act-hero .container { max-width:940px; }
  .act-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
  .act-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.4rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
  .act-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.92); line-height:1.6; margin:0; max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
  .act-body { max-width:860px; margin:0 auto; padding:0 var(--space-4,1rem); }
  .crumbs { display:flex; flex-wrap:wrap; align-items:center; gap:.4rem; font-size:.82rem; color:var(--color-stone); padding:1.1rem 0 0; }
  .crumbs a { color:var(--color-terracotta); text-decoration:none; font-weight:600; }
  .crumbs a:hover { text-decoration:underline; }
  .crumbs span { color:var(--color-sand-dark); }
  .crumbs span[aria-current] { color:var(--color-charcoal); font-weight:600; }
  .act-intro { padding:1.5rem 0 .5rem; }
  .act-intro p { font-size:var(--text-lg); line-height:1.78; color:var(--color-charcoal); margin:0 0 1.15rem; }
  .act-note { font-size:var(--text-sm); color:var(--color-stone); line-height:1.6; border-left:3px solid var(--color-terracotta); padding:.5rem 0 .5rem 1rem; margin:1.2rem 0 1rem; background:linear-gradient(90deg, rgba(192,57,43,.05), transparent); }
  .act-h2 { font-family:'DM Serif Display',serif; font-size:1.85rem; color:var(--color-ink); margin:2.5rem 0 1.3rem; }
  .act-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:1.1rem; }
  .act-item { display:grid; grid-template-columns:150px 1fr; gap:1.2rem; background:#fff; border:1px solid var(--color-sand-dark); border-radius:var(--radius-lg,14px); overflow:hidden; }
  .act-item.no-img { grid-template-columns:1fr; }
  .act-thumb { width:150px; height:100%; min-height:130px; object-fit:cover; background:var(--color-sand); }
  .act-main { padding:1.1rem 1.35rem 1.2rem; }
  .act-main.pad { padding:1.1rem 1.35rem 1.2rem; }
  .act-head { display:flex; align-items:baseline; gap:.55rem; flex-wrap:wrap; margin:0 0 .4rem; }
  .act-rank { font-family:'DM Serif Display',serif; color:var(--color-terracotta); font-size:1.3rem; }
  .act-name { font-family:'DM Serif Display',serif; font-size:1.4rem; color:var(--color-ink); margin:0; }
  .act-country { color:var(--color-stone); font-size:var(--text-sm); }
  .act-why { font-size:var(--text-base); line-height:1.68; color:var(--color-charcoal); margin:0 0 .4rem; }
  .act-guide { font-size:var(--text-sm); font-weight:700; color:var(--color-terracotta); text-decoration:none; }
  .act-guide:hover { text-decoration:underline; }
  .act-faq { padding:2.5rem 0 1rem; }
  .act-faq-q { font-size:var(--text-lg); font-weight:600; color:var(--color-ink); margin:1.4rem 0 .4rem; }
  .act-faq-a { font-size:var(--text-base); line-height:1.72; color:var(--color-charcoal); margin:0; }
  .act-more { padding:2rem 0 1rem; }
  .act-more-chips { display:flex; flex-wrap:wrap; gap:.5rem; }
  .act-more-chips a { display:inline-flex; align-items:center; padding:.5rem .95rem; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:999px; text-decoration:none; font-weight:600; font-size:.92rem; transition:border-color .15s, transform .15s; }
  .act-more-chips a:hover { border-color:var(--color-terracotta); transform:translateY(-1px); }
  .act-cta { text-align:center; padding:2.5rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
  @media (max-width:600px){ .act-item{ grid-template-columns:1fr; } .act-thumb{ width:100%; height:160px; } }
`;

function heroFor(a) {
  const first = (a.entries || []).find((e) => e.cityId && CITYBYID[e.cityId]);
  return first ? { id: first.cityId, name: CITYBYID[first.cityId].name } : { id: null, name: a.activity };
}
const otherActs = (cur) => activities.filter((a) => a.slug !== cur.slug);

function render(a) {
  const url = BASE + '/activities/' + a.slug;
  const hero = heroFor(a);
  const heroImg = hero.id ? `/images/cities/${hero.id}.webp` : '/assets/cities-hero.webp';
  const introHtml = paras(a.intro).map((p) => `<p>${txt(p)}</p>`).join('\n        ');
  const items = (a.entries || []).map((e, i) => {
    const c = e.cityId && CITYBYID[e.cityId] ? CITYBYID[e.cityId] : null;
    const thumb = c ? `<img class="act-thumb" src="/images/cities/${e.cityId}-card.webp" alt="${esc(e.place)}" loading="lazy" onerror="this.style.display='none'">` : '';
    const guide = c ? `<a class="act-guide" href="/cities/${e.cityId}">Read the ${esc(c.name)} city guide &rarr;</a>` : '';
    return `        <li class="act-item${c ? '' : ' no-img'}">
          ${thumb}
          <div class="act-main">
            <div class="act-head"><span class="act-rank">${i + 1}</span><h2 class="act-name">${esc(e.place)}</h2><span class="act-country">${esc(e.country || '')}</span></div>
            <p class="act-why">${txt(e.why || '')}</p>
            ${guide}
          </div>
        </li>`;
  }).join('\n');
  const faqHtml = (a.faq || []).map((f) => `        <div><h3 class="act-faq-q">${txt(f.q)}</h3><p class="act-faq-a">${txt(f.a)}</p></div>`).join('\n');
  const moreChips = otherActs(a).map((o) => `<a href="/activities/${o.slug}">Best cities for ${esc(o.activity.toLowerCase())}</a>`).join('') + `<a href="/tier-list">The tier list</a><a href="/best">All rankings</a>`;

  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: a.metaTitle, numberOfItems: (a.entries || []).length, itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: (a.entries || []).map((e, i) => { const it = { '@type': 'ListItem', position: i + 1, name: e.place }; if (e.cityId && CITYBYID[e.cityId]) it.url = BASE + '/cities/' + e.cityId; return it; }) };
  const faqLd = (a.faq && a.faq.length) ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const crumbs = [['Home', BASE + '/'], ['By activity', BASE + '/activities'], [a.metaTitle, url]];
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };
  const crumbHtml = `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1].replace(BASE, '')}">${esc(c[0])}</a><span>/</span>` : `<span aria-current="page">${esc(c[0])}</span>`).join('')}</nav>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(a.metaTitle)} | The Nomad HQ</title>
  <meta name="description" content="${esc(a.metaDescription)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(a.metaTitle)} | The Nomad HQ">
  <meta property="og:description" content="${esc(a.metaDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  ${hero.id ? `<meta property="og:image" content="${BASE}/images/og/${hero.id}.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}/images/og/${hero.id}.jpg">` : ''}
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(itemList)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
  ${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : ''}
  <style>${CSS}</style>
</head>
<body>
${NAV}
  <main>
    <header class="act-hero">
      <img class="act-hero-img" src="${heroImg}" alt="${esc(hero.name)}" fetchpriority="high">
      <div class="act-hero-overlay"><div class="container">
        <span class="act-eyebrow">Editorial pick</span>
        <h1>${esc(a.metaTitle)}</h1>
        <p class="sub">${esc(a.heroSubtitle || '')}</p>
      </div></div>
    </header>
    <div class="act-body">
      ${crumbHtml}
      <section class="act-intro">
        ${introHtml}
        <p class="act-note">This is a curated, editorial list based on each place's reputation for ${esc(a.activity.toLowerCase())} and how workable it is as a nomad base. Unlike our <a href="/best">rankings</a> and <a href="/tier-list">tier lists</a>, it is not generated from our 410-city Nomad Score, because we do not score cities on this activity.</p>
      </section>
      <h2 class="act-h2">The picks</h2>
      <ol class="act-list">
${items}
      </ol>
      ${faqHtml ? `<section class="act-faq"><h2 class="act-h2">Frequently asked questions</h2>\n${faqHtml}\n      </section>` : ''}
      <section class="act-more"><h2 class="act-h2">More ways to choose</h2><div class="act-more-chips">${moreChips}</div></section>
      <div class="act-cta">
        <a href="/cities" class="btn btn-primary btn-lg">Browse all 410 cities &rarr;</a>
        <a href="/wheel" class="btn btn-secondary btn-lg">Find your match on the Wheel</a>
      </div>
    </div>
  </main>
  ${FOOTER}
  ${NAVJS}
</body>
</html>
`;
}

function buildHub() {
  const cards = activities.map((a) => { const h = heroFor(a); const img = h.id ? `/images/cities/${h.id}-card.webp` : '/assets/cities-hero.webp'; return `        <a class="hub-card" href="/activities/${a.slug}">
          <img class="hub-card-img" src="${img}" alt="${esc(a.activity)}" loading="lazy" onerror="this.style.display='none'">
          <div class="hub-card-body"><h2 class="hub-card-title">Best for ${esc(a.activity.toLowerCase())}</h2><p class="hub-card-teaser">${esc(a.heroSubtitle || '')}</p></div>
        </a>`; }).join('\n');
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Best Cities for Activities', url: BASE + '/activities', hasPart: activities.map((a) => ({ '@type': 'WebPage', name: a.metaTitle, url: BASE + '/activities/' + a.slug })) };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Cities by Activity: Surf, Dive, Watersports and Shopping | The Nomad HQ</title>
  <meta name="description" content="Curated editorial picks of the best cities for surfing, diving, kayaking and shopping as a digital nomad, with links to the full city guides.">
  <link rel="canonical" href="${BASE}/activities">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Best Cities by Activity | The Nomad HQ">
  <meta property="og:description" content="Curated picks for surfing, diving, kayaking and shopping as a digital nomad.">
  <meta property="og:type" content="website"><meta property="og:url" content="${BASE}/activities">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/base.css"><link rel="stylesheet" href="/styles/nav.css"><link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    .hub-head { max-width:1040px; margin:0 auto; padding: calc(var(--nav-height,64px) + 3rem) var(--space-4,1rem) 0; }
    .hub-eyebrow { font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:var(--color-terracotta); margin:0 0 .6rem; }
    .hub-head h1 { font-family:'DM Serif Display',serif; font-size:clamp(2rem,5vw,3rem); color:var(--color-ink); line-height:1.1; margin:0 0 .8rem; }
    .hub-head p { font-size:var(--text-lg); line-height:1.7; color:var(--color-charcoal); max-width:70ch; margin:0; }
    .hub-wrap { max-width:1040px; margin:0 auto; padding:2rem var(--space-4,1rem) 1rem; }
    .hub-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; }
    .hub-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--color-sand-dark); border-radius:14px; overflow:hidden; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .hub-card:hover { border-color:var(--color-terracotta); transform:translateY(-2px); box-shadow:0 10px 26px rgba(15,23,42,.1); }
    .hub-card-img { width:100%; height:140px; object-fit:cover; background:var(--color-sand); }
    .hub-card-body { padding:.9rem 1rem 1.1rem; }
    .hub-card-title { font-family:'DM Serif Display',serif; font-size:1.2rem; color:var(--color-ink); margin:0 0 .25rem; }
    .hub-card-teaser { font-size:var(--text-sm); color:var(--color-stone); margin:0; line-height:1.5; }
    .hub-cta { text-align:center; padding:3rem 1rem 4rem; }
  </style>
</head>
<body>
${NAV}
  <main>
    <div class="hub-head">
      <p class="hub-eyebrow">Editorial picks</p>
      <h1>Best Cities by Activity</h1>
      <p>Curated picks for the things you want to do off the clock. These lists are editorial, chosen for each place's reputation for the activity and how workable it is as a nomad base, rather than generated from our Nomad Score. Every matched place links to its full city guide.</p>
    </div>
    <div class="hub-wrap">
      <div class="hub-grid">
${cards}
      </div>
      <div class="hub-cta"><a href="/cities" class="btn btn-primary btn-lg">Browse all 410 cities &rarr;</a></div>
    </div>
  </main>
  ${FOOTER}
  ${NAVJS}
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'activities.html'), html);
}

fs.mkdirSync(path.join(ROOT, 'activities'), { recursive: true });
for (const a of activities) fs.writeFileSync(path.join(ROOT, 'activities', a.slug + '.html'), render(a));
if (activities.length) buildHub();
console.log(`Built ${activities.length} activity pages + hub: ${activities.map((a) => a.slug + '(' + (a.entries || []).length + ')').join(', ')}`);
