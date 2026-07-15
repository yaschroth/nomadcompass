/**
 * Builds a "Best cities for X" landing page at best/<slug>.html from:
 *   - best-<key>.json     (accurate ranked data, from rank_best.cjs)
 *   - content-<key>.json  (unique prose written by an agent)
 * Matches the site design, self-hosted flags + city thumbnails, links to each city
 * guide + /compare, and emits ItemList + FAQPage JSON-LD. Usage:
 *   DIR=... node scripts/apply_best_page.cjs <key> [<key> ...]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.DIR || ROOT;
const OUTDIR = path.join(ROOT, 'best');
const BASE = 'https://thenomadhq.com';

const CHIP = { cost: 'Affordability', wifi: 'WiFi', safety: 'Safety', climate: 'Climate', visa: 'Visa access', food: 'Food', nature: 'Nature', community: 'Community', nightlife: 'Nightlife', english: 'English' };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const txt = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (v) => typeof v === 'number' ? '$' + v.toLocaleString('en-US') + '/mo' : '';
const flag = (iso) => iso ? '/assets/flags/' + iso + '.svg' : '';

function navHtml() {
  return `<nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="" class="nav-logo-icon"><span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span></a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link">Cities</a></li>
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
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions"><a href="/login" class="btn btn-secondary">Login</a><a href="/signup" class="btn btn-primary">Sign Up</a></div>
    </div>
  </nav>`;
}
function footerHtml() {
  return `<footer class="footer"><div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about"><a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a><p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p></div>
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
}
function navScript() {
  return `<script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;
}

const CSS = `
  .best-hero { position: relative; width: 100%; min-height: 62vh; display: flex; align-items: flex-end; overflow: hidden; }
  .best-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .best-hero-overlay { position: relative; z-index: 1; width: 100%; padding: calc(var(--nav-height,64px) + 3rem) 0 3rem; background: linear-gradient(to top, rgba(15,23,42,.94) 0%, rgba(15,23,42,.7) 55%, rgba(15,23,42,.2) 85%, transparent 100%); color: #fff; }
  .best-hero::before { content:''; position:absolute; top:0; left:0; right:0; height: calc(var(--nav-height,64px)+44px); z-index:1; pointer-events:none; background: linear-gradient(to bottom, rgba(255,255,255,.8), rgba(255,255,255,.4) 55%, transparent); }
  .best-hero .container { max-width: 900px; }
  .best-eyebrow { display:inline-block; font-size: var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#ff8863; margin:0 0 .8rem; text-shadow:0 1px 10px rgba(0,0,0,.3); }
  .best-hero h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.1rem,5.5vw,3.5rem); line-height:1.08; margin:0 0 1rem; color:#fff; text-shadow:0 2px 24px rgba(0,0,0,.35); text-wrap:balance; }
  .best-hero .sub { font-size:var(--text-lg); color:rgba(255,255,255,.9); line-height:1.6; margin:0; max-width:44ch; text-shadow:0 1px 12px rgba(0,0,0,.3); }
  .best-body { max-width: 900px; margin: 0 auto; padding: 0 var(--space-4,1rem); }
  .best-intro { padding: 3rem 0 .5rem; }
  .best-intro p { font-size:var(--text-lg); line-height:1.75; color:var(--color-charcoal); margin:0 0 1.1rem; }
  .best-method { font-size:var(--text-sm); color:var(--color-stone); line-height:1.6; border-left:3px solid var(--color-sand-dark); padding:.3rem 0 .3rem 1rem; margin:1.4rem 0 0; }
  .best-method a { color:var(--color-terracotta); }
  .best-list { list-style:none; margin:2.5rem 0 0; padding:0; display:flex; flex-direction:column; gap:1.1rem; }
  .best-item { display:grid; grid-template-columns:auto 132px 1fr; gap:1.1rem; align-items:stretch; background:#fff; border:1px solid var(--color-sand-dark); border-radius:var(--radius-lg,14px); overflow:hidden; }
  .best-rank { display:flex; align-items:center; justify-content:center; width:54px; font-family:'DM Serif Display',serif; font-size:1.7rem; color:var(--color-terracotta); background:var(--color-sand); }
  .best-thumb { width:132px; height:100%; min-height:120px; object-fit:cover; background:var(--color-sand); }
  .best-main { padding:1rem 1.2rem 1.1rem 0; display:flex; flex-direction:column; gap:.5rem; }
  .best-head { display:flex; align-items:center; gap:.55rem; flex-wrap:wrap; }
  .best-flag { width:26px; height:19px; border-radius:3px; object-fit:cover; box-shadow:0 0 0 1px rgba(0,0,0,.1); }
  .best-name { font-family:'DM Serif Display',serif; font-size:1.4rem; line-height:1.1; margin:0; }
  .best-name a { color:var(--color-ink); text-decoration:none; }
  .best-name a:hover { color:var(--color-terracotta); }
  .best-country { color:var(--color-stone); font-size:var(--text-sm); }
  .best-chips { display:flex; flex-wrap:wrap; gap:.4rem; }
  .best-chip { font-size:12px; font-weight:600; color:var(--color-charcoal); background:var(--color-sand); border-radius:999px; padding:3px 10px; font-variant-numeric:tabular-nums; }
  .best-chip.hi { background:rgba(192,57,43,.1); color:var(--color-terracotta); }
  .best-blurb { font-size:var(--text-base); line-height:1.65; color:var(--color-charcoal); margin:.1rem 0 0; }
  .best-links { display:flex; gap:1rem; margin-top:.2rem; }
  .best-links a { font-size:var(--text-sm); font-weight:600; color:var(--color-terracotta); text-decoration:none; }
  .best-links a:hover { text-decoration:underline; }
  .best-faq { padding: 3rem 0 1rem; }
  .best-faq h2, .best-related h2 { font-family:'DM Serif Display',serif; font-size:1.9rem; color:var(--color-ink); margin:0 0 1.4rem; }
  .best-faq-q { font-size:var(--text-lg); font-weight:600; color:var(--color-ink); margin:1.4rem 0 .4rem; }
  .best-faq-a { font-size:var(--text-base); line-height:1.7; color:var(--color-charcoal); margin:0; }
  .best-related { padding: 2rem 0 1rem; }
  .best-related-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:.8rem; }
  .best-related-grid a { display:block; padding:.9rem 1.1rem; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:var(--radius-md); color:var(--color-ink); text-decoration:none; font-weight:600; font-size:var(--text-base); }
  .best-related-grid a:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
  .best-cta { text-align:center; padding: 2.5rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
  @media (max-width:600px){ .best-item{ grid-template-columns:auto 1fr; } .best-thumb{ display:none; } .best-main{ padding:1rem 1.1rem; } }
`;

function build(key, related) {
  const data = JSON.parse(fs.readFileSync(path.join(DIR, 'best-' + key + '.json'), 'utf8'));
  const content = JSON.parse(fs.readFileSync(path.join(DIR, 'content-' + key + '.json'), 'utf8').replace(/^﻿/, ''));
  const blurbById = {}; (content.entries || []).forEach((e) => { blurbById[e.id] = e.blurb; });
  const top = data.cities[0];
  const url = BASE + '/best/' + data.slug;
  const chipLabel = CHIP[data.metric] || 'Score';

  const items = data.cities.map((c) => {
    const blurb = blurbById[c.id];
    const metricChip = data.metric === 'cost'
      ? `<span class="best-chip hi">${esc(money(c.costPerMonth))}</span>`
      : `<span class="best-chip hi">${esc(chipLabel)} ${c.metricScore}/10</span>`;
    return `      <li class="best-item">
        <div class="best-rank">${c.rank}</div>
        <img class="best-thumb" src="/images/cities/${c.id}-card.webp" alt="${esc(c.name)}" loading="lazy" onerror="this.style.display='none'">
        <div class="best-main">
          <div class="best-head">
            <img class="best-flag" src="${flag(c.iso)}" alt="" width="26" height="19">
            <h2 class="best-name"><a href="/cities/${c.id}">${esc(c.name)}</a></h2>
            <span class="best-country">${esc(c.country)}</span>
          </div>
          <div class="best-chips">${metricChip}<span class="best-chip">Nomad Score ${c.nomadScore}</span>${data.metric !== 'cost' ? `<span class="best-chip">${esc(money(c.costPerMonth))}</span>` : ''}</div>
          ${blurb ? `<p class="best-blurb">${txt(blurb)}</p>` : ''}
          <div class="best-links"><a href="/cities/${c.id}">Full guide &rarr;</a><a href="/compare?a=${c.id}">Compare &rarr;</a></div>
        </div>
      </li>`;
  }).join('\n');

  const introHtml = String(content.intro || '').split(/\n\n+/).map((p) => `<p>${txt(p.trim())}</p>`).join('\n          ');
  const faqHtml = (content.faq || []).map((f) => `        <div><h3 class="best-faq-q">${txt(f.q)}</h3><p class="best-faq-a">${txt(f.a)}</p></div>`).join('\n');
  const relatedHtml = related.filter((r) => r.key !== key).map((r) => `<a href="/best/${r.slug}">${esc(r.h1)}</a>`).join('\n          ');

  const itemListLd = { '@context': 'https://schema.org', '@type': 'ItemList', name: esc(data.h1), itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: data.cities.length,
    itemListElement: data.cities.map((c) => ({ '@type': 'ListItem', position: c.rank, url: BASE + '/cities/' + c.id, name: c.name })) };
  const faqLd = (content.faq && content.faq.length) ? { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: content.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(content.metaTitle || data.h1)} | The Nomad HQ</title>
  <meta name="description" content="${esc(content.metaDescription || '')}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(content.metaTitle || data.h1)} | The Nomad HQ">
  <meta property="og:description" content="${esc(content.metaDescription || '')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/images/og/${top.id}.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(content.metaTitle || data.h1)}">
  <meta name="twitter:image" content="${BASE}/images/og/${top.id}.jpg">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="../styles/base.css">
  <link rel="stylesheet" href="../styles/nav.css">
  <link rel="stylesheet" href="../styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
  ${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : ''}
  <style>${CSS}</style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="best-hero">
      <img class="best-hero-img" src="/images/cities/${top.id}.webp" alt="${esc(top.name)}, ${esc(top.country)}" fetchpriority="high">
      <div class="best-hero-overlay"><div class="container">
        <span class="best-eyebrow">The Nomad HQ City Index</span>
        <h1>${esc(data.h1)}</h1>
        <p class="sub">${esc(content.heroSubtitle || '')}</p>
      </div></div>
    </header>
    <div class="best-body">
      <section class="best-intro">
          ${introHtml}
        <p class="best-method">${txt(content.methodology || '')} Explore the data yourself on the <a href="/compare">comparison tool</a> or <a href="/cities">browse all 410 city guides</a>.</p>
      </section>

      <ol class="best-list">
${items}
      </ol>

      ${(content.faq && content.faq.length) ? `<section class="best-faq"><h2>Frequently asked questions</h2>\n${faqHtml}\n      </section>` : ''}

      <section class="best-related"><h2>More nomad city rankings</h2>
        <div class="best-related-grid">
          ${relatedHtml}
        </div>
      </section>

      <div class="best-cta">
        <a href="/compare" class="btn btn-primary btn-lg">Compare these cities &rarr;</a>
        <a href="/cities" class="btn btn-secondary btn-lg">Browse all city guides</a>
      </div>
    </div>
  </main>
  ${footerHtml()}
  ${navScript()}
</body>
</html>
`;
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(path.join(OUTDIR, data.slug + '.html'), html);
  console.log(`best/${data.slug}.html  (${data.cities.length} cities, ${content.entries ? content.entries.length : 0} blurbs, ${content.faq ? content.faq.length : 0} FAQ)`);
}

// related = all pages we know about (for cross-links); read from any best-*.json present
const allKeys = fs.readdirSync(DIR).filter((f) => /^best-.+\.json$/.test(f)).map((f) => f.replace(/^best-|\.json$/g, ''));
const related = allKeys.map((k) => { const d = JSON.parse(fs.readFileSync(path.join(DIR, 'best-' + k + '.json'), 'utf8')); return { key: k, slug: d.slug, h1: d.h1 }; });

const keys = process.argv.slice(2);
for (const k of keys) build(k, related);
