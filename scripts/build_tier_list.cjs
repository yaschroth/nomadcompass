/**
 * Builds the master "Digital Nomad Cities Tier List" page (tier-list.html, clean URL
 * /tier-list): all rated cities bucketed S..F by Nomad Score, shown as compact photo
 * tiles per tier. Data-driven from cities-data.js. Usage: node scripts/build_tier_list.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const mm = {}; new Function('module', code + ';module.exports=CITIES')(mm);
const CITIES = mm.exports;
const CK = ['climate','cost','wifi','nightlife','nature','safety','food','community','english','visa','culture','cleanliness','airquality'];
function nomadScore(c) {
  let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } });
  const raw = n ? t / n : 0;
  return +Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)).toFixed(1);
}

// Tiers, highest first. min is inclusive.
const TIERS = [
  { key: 'S', min: 9.0, color: '#C0392B', range: '9.0 and up', blurb: 'The rare best. Cities that hit almost everything a nomad needs.' },
  { key: 'A', min: 8.0, color: '#C4622E', range: '8.0 to 8.9', blurb: 'Excellent all-round bases with only minor tradeoffs.' },
  { key: 'B', min: 7.0, color: '#9E7B1E', range: '7.0 to 7.9', blurb: 'Strong, dependable choices that get most things right.' },
  { key: 'C', min: 6.0, color: '#2F7D5A', range: '6.0 to 6.9', blurb: 'Solid if a few specific strengths match your priorities.' },
  { key: 'D', min: 5.0, color: '#3D6493', range: '5.0 to 5.9', blurb: 'Workable for a niche, but expect real compromises.' },
  { key: 'F', min: 0,   color: '#5C6672', range: 'below 5.0', blurb: 'Only for a very specific reason. Weak across the board for nomads.' },
];

const ranked = CITIES.map((c) => ({ c, s: nomadScore(c) })).sort((a, b) => b.s - a.s);
const tierOf = (s) => TIERS.find((t) => s >= t.min);
const groups = {}; TIERS.forEach((t) => (groups[t.key] = []));
ranked.forEach(({ c, s }) => groups[tierOf(s).key].push({ c, s }));

const tile = ({ c, s }) => `<a class="tl-tile" href="/cities/${c.id}" title="${esc(c.name)} &middot; Nomad Score ${s}">`
  + `<img class="tl-img" src="/images/cities/${c.id}-card.webp" alt="" loading="lazy" onerror="this.style.display='none'">`
  + `<span class="tl-scrim"></span><span class="tl-name">${esc(c.name)}</span></a>`;

const rows = TIERS.map((t) => {
  const items = groups[t.key];
  return `      <div class="tl-row">
        <div class="tl-label" style="background:${t.color}">
          <span class="tl-letter">${t.key}</span>
          <span class="tl-range">${t.range}</span>
          <span class="tl-count">${items.length} ${items.length === 1 ? 'city' : 'cities'}</span>
        </div>
        <div class="tl-tiles">${items.map(tile).join('')}</div>
      </div>`;
}).join('\n');

const legendRow = TIERS.map((t) => `<span class="tl-leg"><span class="tl-leg-dot" style="background:${t.color}"></span>${t.key} &middot; ${esc(t.range)} &middot; ${groups[t.key].length}</span>`).join('');

const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Digital Nomad Cities Tier List',
  description: 'All rated digital nomad cities bucketed into S to F tiers by Nomad Score.', numberOfItems: ranked.length,
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  itemListElement: ranked.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + '/cities/' + r.c.id, name: r.c.name })) };
const faq = [
  { q: 'What is a digital nomad cities tier list?', a: 'It is a ranking that sorts every city we rate into tiers, from S (the best) down to F, based on its overall Nomad Score. Instead of a single ordered list, it groups cities of similar quality together so you can see the whole landscape at a glance.' },
  { q: 'How are the tiers decided?', a: 'Purely by each city’s Nomad Score, our calibrated composite of 13 categories like cost, WiFi, safety, climate and visas. S tier is 9.0 and up, A is 8.0 to 8.9, B is 7.0 to 7.9, C is 6.0 to 6.9, D is 5.0 to 5.9, and F is below 5.0.' },
  { q: 'Which cities are S tier?', a: `Only ${groups.S.length} of our ${ranked.length} cities reach S tier: ${groups.S.map((x) => x.c.name).join(' and ')}. S tier is deliberately rare, reserved for cities that score highly across almost every category.` },
  { q: 'Is a lower-tier city a bad place to live?', a: 'Not necessarily. The tiers rank all-round suitability for remote work, so a C or D city can still be a great fit if it is strong in the one or two things you care about most, such as cost or nature. Open any city to see its full breakdown.' },
  { q: 'How often is the tier list updated?', a: 'It is generated directly from our city data, so it updates whenever scores change or new cities are added. Every tile links to that city’s full guide with the latest numbers.' },
];
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

const NAV = `  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
        <li><a href="/best" class="nav-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-link active">Tier List</a></li>
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
        <li><a href="/cities" class="nav-mobile-link">Cities</a></li>
        <li><a href="/best" class="nav-mobile-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-mobile-link active">Tier List</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div>
    </div>
  </nav>`;
const FOOTER = `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
const NAVJS = `<script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;

const title = 'Digital Nomad Cities Tier List: All 410 Cities Ranked S to F';
const desc = 'The definitive digital nomad cities tier list. All 410 rated cities bucketed from S tier to F by Nomad Score, cost, WiFi, safety, climate and more.';
const CSS = `
  .tl-hero { position:relative; width:100%; min-height:100vh; display:flex; align-items:flex-end; overflow:hidden; }
  .tl-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .tl-hero-overlay { position:relative; z-index:1; width:100%; padding: calc(var(--nav-height,64px) + 2.5rem) 0 2.75rem; background:linear-gradient(to top, rgba(15,23,42,.95) 0%, rgba(15,23,42,.7) 55%, rgba(15,23,42,.2) 85%, transparent); color:#fff; }
  .tl-hero::before { content:''; position:absolute; top:0;left:0;right:0; height:calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
  .tl-hero .container { max-width:1080px; }
  .tl-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
  .tl-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.4rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
  .tl-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.92); line-height:1.6; margin:0 0 1.25rem; max-width:60ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
  .tl-legend { display:flex; flex-wrap:wrap; gap:.4rem .9rem; }
  .tl-leg { display:inline-flex; align-items:center; gap:.4rem; font-size:.85rem; color:rgba(255,255,255,.9); font-variant-numeric:tabular-nums; }
  .tl-leg-dot { width:11px; height:11px; border-radius:3px; display:inline-block; }
  .tl-wrap { max-width:1180px; margin:0 auto; padding:2.75rem var(--space-4,1rem) 1rem; }
  .tl-intro { font-size:var(--text-lg); line-height:1.75; color:var(--color-charcoal); max-width:70ch; margin:0 0 .8rem; }
  .tl-method { font-size:var(--text-sm); color:var(--color-stone); line-height:1.6; border-left:3px solid var(--color-terracotta); padding:.4rem 0 .4rem 1rem; margin:1.2rem 0 2.25rem; background:linear-gradient(90deg, rgba(192,57,43,.05), transparent); }
  .tl-method a { color:var(--color-terracotta); font-weight:600; }
  .tl-board { display:flex; flex-direction:column; gap:.7rem; }
  .tl-row { display:grid; grid-template-columns:96px 1fr; gap:.7rem; align-items:stretch; }
  .tl-label { display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:12px; color:#fff; padding:.6rem .4rem; text-align:center; }
  .tl-letter { font-family:'DM Serif Display',serif; font-size:2.1rem; line-height:1; }
  .tl-range { font-size:.66rem; font-weight:600; opacity:.92; margin-top:.3rem; letter-spacing:.02em; }
  .tl-count { font-size:.66rem; opacity:.8; margin-top:.15rem; }
  .tl-tiles { display:flex; flex-wrap:wrap; gap:.55rem; align-content:flex-start; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:14px; padding:.6rem; }
  .tl-tile { position:relative; display:block; width:132px; height:92px; border-radius:10px; overflow:hidden; text-decoration:none; background:#0f172a; box-shadow:0 1px 3px rgba(15,23,42,.12); transition:transform .14s ease, box-shadow .14s ease; }
  .tl-tile:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 10px 22px rgba(15,23,42,.28); z-index:2; }
  .tl-tile:focus-visible { outline:2px solid #fff; outline-offset:1px; }
  .tl-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .tl-scrim { position:absolute; inset:0; background:linear-gradient(to top, rgba(15,23,42,.85) 0%, rgba(15,23,42,.05) 62%); }
  .tl-name { position:absolute; left:7px; right:7px; bottom:6px; z-index:2; color:#fff; font-size:13px; font-weight:700; line-height:1.12; text-shadow:0 1px 4px rgba(0,0,0,.75); }
  .tl-faq { max-width:820px; margin:2.5rem auto 0; }
  .tl-faq h2 { font-family:'DM Serif Display',serif; font-size:1.85rem; color:var(--color-ink); margin:0 0 1.2rem; }
  .tl-faq-q { font-size:var(--text-lg); font-weight:600; color:var(--color-ink); margin:1.4rem 0 .4rem; }
  .tl-faq-a { font-size:var(--text-base); line-height:1.72; color:var(--color-charcoal); margin:0; }
  .tl-cta { text-align:center; padding:2.5rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
  @media (max-width:640px){ .tl-row{ grid-template-columns:64px 1fr; } .tl-letter{ font-size:1.6rem; } .tl-tile{ width:104px; height:74px; } .tl-name{ font-size:11.5px; } }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | The Nomad HQ</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${BASE}/tier-list">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(title)} | The Nomad HQ">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/tier-list">
  <meta property="og:image" content="${BASE}/images/og/${ranked[0].c.id}.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:image" content="${BASE}/images/og/${ranked[0].c.id}.jpg">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/nav.css">
  <link rel="stylesheet" href="styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(itemList)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <style>${CSS}</style>
</head>
<body>
${NAV}
  <main>
    <header class="tl-hero">
      <img class="tl-hero-img" src="/images/cities/${ranked[0].c.id}.webp" alt="${esc(ranked[0].c.name)}" fetchpriority="high">
      <div class="tl-hero-overlay"><div class="container">
        <span class="tl-eyebrow">The Nomad HQ City Index</span>
        <h1>The Digital Nomad Cities Tier List</h1>
        <p class="sub">All ${ranked.length} cities we rate, sorted into tiers from S to F by their Nomad Score. Only ${groups.S.length} reach S tier.</p>
        <div class="tl-legend">${legendRow}</div>
      </div></div>
    </header>
    <div class="tl-wrap">
      <p class="tl-intro">A tier list is the fastest way to see the whole landscape at once. Every city below is placed by its <strong>Nomad Score</strong>, our calibrated composite of the 13 things that matter most to remote workers. S tier is the rare best; F tier is for cities that only make sense for one very specific reason.</p>
      <p class="tl-method">Tiers follow the Nomad Score directly: S is 9.0+, A is 8.0 to 8.9, B is 7.0 to 7.9, C is 6.0 to 6.9, D is 5.0 to 5.9, F is below 5.0. Tap any city for its full breakdown, or <a href="/best">browse the ranked lists</a> and <a href="/compare">compare cities head to head</a>.</p>
      <div class="tl-board">
${rows}
      </div>
      <section class="tl-faq"><h2>Frequently asked questions</h2>
${faq.map((f) => `        <div><h3 class="tl-faq-q">${esc(f.q)}</h3><p class="tl-faq-a">${esc(f.a)}</p></div>`).join('\n')}
      </section>
      <div class="tl-cta">
        <a href="/best" class="btn btn-primary btn-lg">See the ranked lists &rarr;</a>
        <a href="/wheel" class="btn btn-secondary btn-lg">Find your match on the Wheel</a>
      </div>
    </div>
  </main>
  ${FOOTER}
  ${NAVJS}
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'tier-list.html'), html);
console.log(`tier-list.html built. Tiers: ${TIERS.map((t) => t.key + '=' + groups[t.key].length).join(' ')}  (#1 ${ranked[0].c.name} ${ranked[0].s})`);
