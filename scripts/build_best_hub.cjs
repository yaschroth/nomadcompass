/**
 * Builds the /best hub (root best.html) listing every "Best cities for X" ranking page
 * found as best-<key>.json in env DIR. Card per page: title, teaser, #1 city.
 * Usage: DIR=... node scripts/build_best_hub.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.DIR || ROOT;
const BASE = 'https://thenomadhq.com';
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const flag = (iso) => iso ? '/assets/flags/' + iso + '.svg' : '';

const keys = fs.readdirSync(DIR).filter((f) => /^best-.+\.json$/.test(f)).map((f) => f.replace(/^best-|\.json$/g, ''));
const pages = keys.map((k) => {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, 'best-' + k + '.json'), 'utf8'));
  let teaser = '';
  const cf = path.join(DIR, 'content-' + k + '.json');
  if (fs.existsSync(cf)) { try { teaser = JSON.parse(fs.readFileSync(cf, 'utf8').replace(/^﻿/, '')).metaDescription || ''; } catch (e) {} }
  // Robustness: if no content JSON (e.g. an older page whose source wasn't kept), reuse the
  // page's own meta description so the hub card keeps its teaser.
  if (!teaser) { try { const hp = path.join(ROOT, 'best', d.slug + '.html'); if (fs.existsSync(hp)) { const m = fs.readFileSync(hp, 'utf8').match(/name="description" content="([^"]+)"/); if (m) teaser = m[1]; } } catch (e) {} }
  return { key: k, slug: d.slug, h1: d.h1, top: d.cities[0], teaser };
}).sort((a, b) => a.h1.localeCompare(b.h1));

const cards = pages.map((p) => `        <a class="hub-card" href="/best/${p.slug}">
          <img class="hub-card-img" src="/images/cities/${p.top.id}-card.webp" alt="${esc(p.top.name)}" loading="lazy" onerror="this.style.display='none'">
          <div class="hub-card-body">
            <h2 class="hub-card-title">${esc(p.h1)}</h2>
            <p class="hub-card-teaser">${esc(p.teaser)}</p>
            <p class="hub-card-top"><img class="hub-flag" src="${flag(p.top.iso)}" alt="" width="20" height="15"> #1 ${esc(p.top.name)}, ${esc(p.top.country)}</p>
          </div>
        </a>`).join('\n');

const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Best Cities for Digital Nomads', url: BASE + '/best',
  hasPart: pages.map((p) => ({ '@type': 'WebPage', name: p.h1, url: BASE + '/best/' + p.slug })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Cities for Digital Nomads: Rankings by Cost, WiFi, Safety and More | The Nomad HQ</title>
  <meta name="description" content="Data-driven rankings of the best digital nomad cities for cost of living, fast WiFi, safety and more, drawn from our index of 410 destinations.">
  <link rel="canonical" href="${BASE}/best">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Best Cities for Digital Nomads: The Rankings | The Nomad HQ">
  <meta property="og:description" content="Rankings of the best nomad cities for cost, WiFi, safety and more, from our 410-city index.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/best">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Best Cities for Digital Nomads: The Rankings">
  <meta name="twitter:image" content="${BASE}/assets/og-image.png">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/nav.css">
  <link rel="stylesheet" href="styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    .hub-hero { position: relative; width: 100%; min-height: 100vh; display: flex; align-items: flex-end; overflow: hidden; }
    .hub-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .hub-hero-overlay { position: relative; z-index: 1; width: 100%; padding: calc(var(--nav-height,64px) + 3rem) 0 3rem; background: linear-gradient(to top, rgba(15,23,42,.94), rgba(15,23,42,.66) 55%, rgba(15,23,42,.15) 88%, transparent); color:#fff; }
    .hub-hero::before { content:''; position:absolute; top:0;left:0;right:0; height:calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background:linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
    .hub-hero .container { max-width: 1040px; }
    .hub-eyebrow { display:inline-block; font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
    .hub-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.5rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
    .hub-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0; max-width:56ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
    .hub-wrap { max-width: 1040px; margin: 0 auto; padding: 3rem var(--space-4,1rem) 1rem; }
    .hub-lead { font-size:var(--text-lg); line-height:1.7; color:var(--color-charcoal); max-width:70ch; margin:0 0 2.5rem; }
    .hub-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.2rem; }
    .hub-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--color-sand-dark); border-radius:var(--radius-lg,14px); overflow:hidden; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .hub-card:hover { border-color:var(--color-terracotta); transform:translateY(-2px); box-shadow:0 10px 26px rgba(15,23,42,.1); }
    .hub-card-img { width:100%; height:150px; object-fit:cover; background:var(--color-sand); }
    .hub-card-body { padding:1.1rem 1.2rem 1.3rem; display:flex; flex-direction:column; gap:.5rem; }
    .hub-card-title { font-family:'DM Serif Display',serif; font-size:1.35rem; line-height:1.15; color:var(--color-ink); margin:0; }
    .hub-card-teaser { font-size:var(--text-sm); line-height:1.55; color:var(--color-stone); margin:0; }
    .hub-card-top { display:flex; align-items:center; gap:.45rem; font-size:var(--text-sm); font-weight:600; color:var(--color-terracotta); margin:.2rem 0 0; }
    .hub-flag { border-radius:2px; object-fit:cover; box-shadow:0 0 0 1px rgba(0,0,0,.1); }
    .hub-cta { text-align:center; padding:3rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
    .hub-tier { display:flex; align-items:center; gap:1.1rem; flex-wrap:wrap; justify-content:space-between; background:linear-gradient(120deg, #1b2a44, #0f172a); color:#fff; border-radius:16px; padding:1.4rem 1.6rem; margin:0 0 2.5rem; text-decoration:none; transition:transform .15s, box-shadow .15s; }
    .hub-tier:hover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(15,23,42,.22); }
    .hub-tier-txt h2 { font-family:'DM Serif Display',serif; font-size:1.5rem; margin:0 0 .25rem; color:#fff; }
    .hub-tier-txt p { margin:0; color:rgba(255,255,255,.85); font-size:.98rem; }
    .hub-tier-badges { display:flex; gap:.35rem; flex:0 0 auto; }
    .hub-tier-badge { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'DM Serif Display',serif; font-size:1.1rem; color:#fff; }
    .hub-tier-go { flex:0 0 auto; font-weight:700; color:#ff8863; }
  </style>
</head>
<body>
  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
        <li><a href="/best" class="nav-link active">Rankings</a></li>
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
        <li><a href="/best" class="nav-mobile-link active">Rankings</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div>
    </div>
  </nav>
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/cities-hero.webp" alt="A world city skyline at dusk" fetchpriority="high">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">The Nomad HQ City Index</span>
        <h1>The Best Cities for Digital Nomads</h1>
        <p class="sub">Every ranking below is drawn from the same index of 410 destinations, scored on the 13 factors that shape life as a remote worker. Pick the one that matches what you are optimizing for.</p>
      </div></div>
    </header>
    <div class="hub-wrap">
      <p class="hub-lead">There is no single best city for remote work, only the best city for your priorities. These rankings break the question down one factor at a time, from the cheapest bases to the safest streets and the fastest internet, so you can start from what matters most to you and drill into the full guide from there.</p>
      <a class="hub-tier" href="/tier-list">
        <div class="hub-tier-txt"><h2>The Digital Nomad Cities Tier List</h2><p>All 410 cities ranked S to F at a glance. Only 2 make S tier.</p></div>
        <div class="hub-tier-badges"><span class="hub-tier-badge" style="background:#C0392B">S</span><span class="hub-tier-badge" style="background:#C4622E">A</span><span class="hub-tier-badge" style="background:#9E7B1E">B</span><span class="hub-tier-badge" style="background:#2F7D5A">C</span></div>
        <span class="hub-tier-go">View the tier list &rarr;</span>
      </a>
      <div class="hub-grid">
${cards}
      </div>
      <div class="hub-cta">
        <a href="/compare" class="btn btn-primary btn-lg">Compare cities head to head &rarr;</a>
        <a href="/cities" class="btn btn-secondary btn-lg">Browse all 410 guides</a>
      </div>
    </div>
  </main>
  <footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>
  <script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'best.html'), html);
console.log(`best.html hub built with ${pages.length} ranking pages.`);
