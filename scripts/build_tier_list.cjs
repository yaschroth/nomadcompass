/**
 * Builds the tier-list system, all data-driven from cities-data.js:
 *   - master  /tier-list            (all cities by Nomad Score)
 *   - regions /tier-list/<region>   (cities in a region by Nomad Score) x7
 *   - cats    /tier-list/<category> (cities by a category score) x13
 *   - hub     /tier-lists           (lists them all)
 * Cities are bucketed S..F and shown as compact photo tiles per tier.
 * Usage: node scripts/build_tier_list.cjs
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
const regCode = fs.readFileSync(path.join(ROOT, 'city-regions.js'), 'utf8');
const rm = {}; new Function('module', 'window', regCode + ';try{module.exports=CITY_REGIONS}catch(e){module.exports={}}')(rm, {});
const REGION = rm.exports || {};

const TIERS = [
  { key: 'S', min: 9.0, color: '#C0392B', range: '9.0 and up' },
  { key: 'A', min: 8.0, color: '#C4622E', range: '8.0 to 8.9' },
  { key: 'B', min: 7.0, color: '#9E7B1E', range: '7.0 to 7.9' },
  { key: 'C', min: 6.0, color: '#2F7D5A', range: '6.0 to 6.9' },
  { key: 'D', min: 5.0, color: '#3D6493', range: '5.0 to 5.9' },
  { key: 'F', min: 0,   color: '#5C6672', range: 'below 5.0' },
];
const REGION_NAMES = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', africa: 'Africa', middleeast: 'the Middle East', northamerica: 'North America', oceania: 'Oceania' };
const REGION_SLUG = { europe: 'europe', asia: 'asia', latam: 'latin-america', africa: 'africa', middleeast: 'middle-east', northamerica: 'north-america', oceania: 'oceania' };
const CATS = [
  { key: 'cost', slug: 'affordability', label: 'Affordability', lc: 'affordability' },
  { key: 'wifi', slug: 'wifi', label: 'WiFi', lc: 'WiFi' },
  { key: 'safety', slug: 'safety', label: 'Safety', lc: 'safety' },
  { key: 'climate', slug: 'climate', label: 'Climate', lc: 'climate' },
  { key: 'nightlife', slug: 'nightlife', label: 'Nightlife', lc: 'nightlife' },
  { key: 'nature', slug: 'nature', label: 'Nature', lc: 'nature and the outdoors' },
  { key: 'food', slug: 'food', label: 'Food', lc: 'food' },
  { key: 'community', slug: 'nomad-community', label: 'Nomad community', lc: 'nomad community' },
  { key: 'english', slug: 'english', label: 'English', lc: 'getting by in English' },
  { key: 'visa', slug: 'visa', label: 'Visa access', lc: 'visa access' },
  { key: 'culture', slug: 'culture', label: 'Culture', lc: 'culture' },
  { key: 'cleanliness', slug: 'cleanliness', label: 'Cleanliness', lc: 'cleanliness' },
  { key: 'airquality', slug: 'air-quality', label: 'Air quality', lc: 'air quality' },
];

// ---- build variant descriptors ----
const master = {
  type: 'master', slug: 'tier-list', file: 'tier-list.html', hubLabel: 'All cities',
  h1: 'The Digital Nomad Cities Tier List',
  metaTitle: 'Digital Nomad Cities Tier List: All Cities Ranked S to F',
  metaDesc: 'The definitive digital nomad cities tier list. Every rated city bucketed from S tier to F by Nomad Score, cost, WiFi, safety, climate and more.',
  kicker: 'The Nomad HQ City Index',
  pool: CITIES, score: nomadScore, mode: 'nomad',
};
const regionVariants = Object.keys(REGION_NAMES).map((rk) => ({
  type: 'region', slug: 'tier-list/' + REGION_SLUG[rk], file: path.join('tier-list', REGION_SLUG[rk] + '.html'), hubLabel: REGION_NAMES[rk].replace(/^the /, ''),
  h1: `Digital Nomad Cities in ${REGION_NAMES[rk]}: Tier List`,
  metaTitle: `Digital Nomad Cities in ${REGION_NAMES[rk].replace(/^the /, '')} Tier List: S to F`,
  metaDesc: `A tier list of the best digital nomad cities in ${REGION_NAMES[rk]}, every rated city bucketed from S to F by Nomad Score.`,
  kicker: 'Regional tier list',
  pool: CITIES.filter((c) => REGION[c.id] === rk), score: nomadScore, mode: 'nomad', region: rk,
}));
const catVariants = CATS.map((cat) => ({
  type: 'category', slug: 'tier-list/' + cat.slug, file: path.join('tier-list', cat.slug + '.html'), hubLabel: cat.label,
  h1: `Digital Nomad Cities by ${cat.label}: Tier List`,
  metaTitle: `${cat.label} Tier List: Digital Nomad Cities Ranked S to F`,
  metaDesc: `A tier list of digital nomad cities by ${cat.lc}, every rated city bucketed from S to F on its ${cat.label} score.`,
  kicker: 'Category tier list',
  pool: CITIES, score: (c) => (typeof c.scores[cat.key] === 'number' ? c.scores[cat.key] : 0), mode: 'category', cat,
}));
const ALL = [master, ...regionVariants, ...catVariants];

// ---- shared chrome ----
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
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/best" class="footer-link">Best Cities Rankings</a></li><li><a href="/tier-list" class="footer-link">Tier List</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;
const NAVJS = `<script>(function(){var nav=document.getElementById('mainNav'),t=document.getElementById('navToggle'),m=document.getElementById('navMobile'),b=document.body;t.addEventListener('click',function(){var o=t.classList.toggle('active');m.classList.toggle('active');b.classList.toggle('nav-open');t.setAttribute('aria-expanded',o);});m.querySelectorAll('.nav-mobile-link,.nav-mobile-actions .btn').forEach(function(l){l.addEventListener('click',function(){t.classList.remove('active');m.classList.remove('active');b.classList.remove('nav-open');t.setAttribute('aria-expanded','false');});});window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>10);},{passive:true});})();</script>`;

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
  .tl-tiles { display:flex; flex-wrap:wrap; gap:.55rem; align-content:flex-start; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:14px; padding:.6rem; min-height:60px; }
  .tl-empty { color:var(--color-stone); font-size:.85rem; padding:.9rem; }
  .tl-tile { position:relative; display:block; width:132px; height:92px; border-radius:10px; overflow:hidden; text-decoration:none; background:#0f172a; box-shadow:0 1px 3px rgba(15,23,42,.12); transition:transform .14s ease, box-shadow .14s ease; }
  .tl-tile:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 10px 22px rgba(15,23,42,.28); z-index:2; }
  .tl-tile:focus-visible { outline:2px solid #fff; outline-offset:1px; }
  .tl-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .tl-scrim { position:absolute; inset:0; background:linear-gradient(to top, rgba(15,23,42,.85) 0%, rgba(15,23,42,.05) 62%); }
  .tl-name { position:absolute; left:7px; right:7px; bottom:6px; z-index:2; color:#fff; font-size:13px; font-weight:700; line-height:1.12; text-shadow:0 1px 4px rgba(0,0,0,.75); }
  .tl-more { margin:2.75rem 0 0; }
  .tl-more h2 { font-family:'DM Serif Display',serif; font-size:1.6rem; color:var(--color-ink); margin:0 0 1rem; }
  .tl-more-group { margin-bottom:1.1rem; }
  .tl-more-group h3 { font-size:12px; text-transform:uppercase; letter-spacing:.09em; color:var(--color-stone); font-weight:700; margin:0 0 .6rem; }
  .tl-chips { display:flex; flex-wrap:wrap; gap:.5rem; }
  .tl-chips a { display:inline-flex; align-items:center; padding:.45rem .9rem; background:var(--color-sand); border:1px solid var(--color-sand-dark); border-radius:999px; text-decoration:none; font-weight:600; font-size:.9rem; transition:border-color .15s, background .15s, transform .15s; }
  .tl-chips a:hover { border-color:var(--color-terracotta); background:#fff; transform:translateY(-1px); }
  .tl-faq { max-width:820px; margin:2.5rem auto 0; }
  .tl-faq h2 { font-family:'DM Serif Display',serif; font-size:1.85rem; color:var(--color-ink); margin:0 0 1.2rem; }
  .tl-faq-q { font-size:var(--text-lg); font-weight:600; color:var(--color-ink); margin:1.4rem 0 .4rem; }
  .tl-faq-a { font-size:var(--text-base); line-height:1.72; color:var(--color-charcoal); margin:0; }
  .tl-cta { text-align:center; padding:2.5rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
  @media (max-width:640px){ .tl-row{ grid-template-columns:64px 1fr; } .tl-letter{ font-size:1.6rem; } .tl-tile{ width:104px; height:74px; } .tl-name{ font-size:11.5px; } }
`;

const tileHtml = (c, s, unit) => `<a class="tl-tile" href="/cities/${c.id}" title="${esc(c.name)} &middot; ${unit} ${s}">`
  + `<img class="tl-img" src="/images/cities/${c.id}-card.webp" alt="" loading="lazy" onerror="this.style.display='none'">`
  + `<span class="tl-scrim"></span><span class="tl-name">${esc(c.name)}</span></a>`;

function bucket(v) {
  const ranked = v.pool.map((c) => ({ c, s: v.score(c) })).sort((a, b) => b.s - a.s);
  const groups = {}; TIERS.forEach((t) => (groups[t.key] = []));
  ranked.forEach(({ c, s }) => { const t = TIERS.find((x) => s >= x.min); groups[t.key].push({ c, s }); });
  return { ranked, groups };
}

// grouped "more tier lists" links, excluding the current variant
function moreHtml(current) {
  const chip = (v) => `<a href="/${v.slug}">${esc(v.hubLabel)}</a>`;
  const regionChips = regionVariants.filter((v) => v.slug !== current.slug).map(chip).join('');
  const catChips = catVariants.filter((v) => v.slug !== current.slug).map(chip).join('');
  const masterChip = current.slug === master.slug ? '' : `<div class="tl-more-group"><h3>Overall</h3><div class="tl-chips"><a href="/tier-list">All cities tier list</a></div></div>`;
  return `      <section class="tl-more"><h2>More tier lists</h2>
        ${masterChip}
        <div class="tl-more-group"><h3>By region</h3><div class="tl-chips">${regionChips}</div></div>
        <div class="tl-more-group"><h3>By category</h3><div class="tl-chips">${catChips}</div></div>
        <p style="margin-top:1rem"><a href="/tier-lists" style="color:var(--color-terracotta);font-weight:600">See all tier lists &rarr;</a></p>
      </section>`;
}

function render(v) {
  const { ranked, groups } = bucket(v);
  const unit = v.mode === 'category' ? `${v.cat.label}` : 'Nomad Score';
  const heroId = ranked[0].c.id, heroName = ranked[0].c.name;
  const N = ranked.length;
  const legend = TIERS.map((t) => `<span class="tl-leg"><span class="tl-leg-dot" style="background:${t.color}"></span>${t.key} &middot; ${esc(t.range)} &middot; ${groups[t.key].length}</span>`).join('');
  const rows = TIERS.map((t) => {
    const items = groups[t.key];
    const tiles = items.length ? items.map((x) => tileHtml(x.c, x.s, unit)).join('') : '<span class="tl-empty">No cities in this tier.</span>';
    return `      <div class="tl-row">
        <div class="tl-label" style="background:${t.color}"><span class="tl-letter">${t.key}</span><span class="tl-range">${t.range}</span><span class="tl-count">${items.length} ${items.length === 1 ? 'city' : 'cities'}</span></div>
        <div class="tl-tiles">${tiles}</div>
      </div>`;
  }).join('\n');

  let sub, intro, method;
  if (v.mode === 'category') {
    const c = v.cat;
    sub = `All ${N} cities we rate, sorted into tiers from S to F by their ${c.label} score.`;
    intro = `This tier list places every city by its <strong>${c.label} score</strong> alone, our 1 to 10 rating for ${c.lc}. It is one of the 13 factors behind the overall Nomad Score, isolated here so you can see which cities lead on ${c.lc} and which lag.`;
    method = `Tiers follow the ${c.label} score: S is 9 to 10, A is 8, B is 7, C is 6, D is 5, F is below 5. Tap any city for its full breakdown, or see the <a href="/tier-list">all-round tier list</a> and the <a href="/best">ranked lists</a>.`;
  } else if (v.mode === 'nomad' && v.type === 'region') {
    sub = `The ${N} cities we rate in ${REGION_NAMES[v.region]}, sorted from S to F by their Nomad Score.`;
    intro = `A tier list of every digital nomad city we rate in ${REGION_NAMES[v.region]}, placed by its <strong>Nomad Score</strong>, our calibrated composite of the 13 things that matter most to remote workers.`;
    method = `Tiers follow the Nomad Score: S is 9.0+, A is 8.0 to 8.9, B is 7.0 to 7.9, C is 6.0 to 6.9, D is 5.0 to 5.9, F is below 5.0. Tap any city for its full breakdown, or see the <a href="/tier-list">worldwide tier list</a> and the <a href="/best/best-digital-nomad-cities-in-${REGION_SLUG[v.region]}">${REGION_NAMES[v.region].replace(/^the /, '')} ranking</a>.`;
  } else {
    sub = `All ${N} cities we rate, sorted into tiers from S to F by their Nomad Score. Only ${groups.S.length} reach S tier.`;
    intro = `A tier list is the fastest way to see the whole landscape at once. Every city below is placed by its <strong>Nomad Score</strong>, our calibrated composite of the 13 things that matter most to remote workers. S tier is the rare best; F tier is for cities that only make sense for one very specific reason.`;
    method = `Tiers follow the Nomad Score directly: S is 9.0+, A is 8.0 to 8.9, B is 7.0 to 7.9, C is 6.0 to 6.9, D is 5.0 to 5.9, F is below 5.0. Tap any city for its full breakdown, or <a href="/best">browse the ranked lists</a> and <a href="/tier-lists">see all tier lists</a>.`;
  }

  const faq = [
    { q: 'What is this tier list based on?', a: v.mode === 'category'
        ? `Each city is placed purely by its ${v.cat.label} score, our 1 to 10 rating for ${v.cat.lc}. S tier is 9 to 10, down to F for below 5.`
        : `Each city is placed by its Nomad Score, our calibrated composite of 13 categories like cost, WiFi, safety, climate and visas. S tier is 9.0 and up, down to F for below 5.0.` },
    { q: `Which cities are S tier?`, a: groups.S.length ? `${groups.S.map((x) => x.c.name).join(', ')}. S tier is deliberately rare.` : `No city reaches S tier here, the top cities sit in A tier: ${groups.A.slice(0, 3).map((x) => x.c.name).join(', ')} and more.` },
    { q: 'Is a lower-tier city a bad place to live?', a: 'Not necessarily. The tiers rank one dimension, so a lower-tier city can still be a great fit if it is strong in the things you care about most. Open any city to see its full breakdown.' },
    { q: 'How often is it updated?', a: 'It is generated directly from our city data, so it updates whenever scores change or new cities are added.' },
  ];
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: v.metaTitle, numberOfItems: N, itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: ranked.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + '/cities/' + r.c.id, name: r.c.name })) };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(v.metaTitle)} | The Nomad HQ</title>
  <meta name="description" content="${esc(v.metaDesc)}">
  <link rel="canonical" href="${BASE}/${v.slug}">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="${esc(v.metaTitle)} | The Nomad HQ">
  <meta property="og:description" content="${esc(v.metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/${v.slug}">
  <meta property="og:image" content="${BASE}/images/og/${heroId}.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(v.metaTitle)}">
  <meta name="twitter:image" content="${BASE}/images/og/${heroId}.jpg">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(itemList)}</script>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <style>${CSS}</style>
</head>
<body>
${NAV}
  <main>
    <header class="tl-hero">
      <img class="tl-hero-img" src="/images/cities/${heroId}.webp" alt="${esc(heroName)}" fetchpriority="high">
      <div class="tl-hero-overlay"><div class="container">
        <span class="tl-eyebrow">${esc(v.kicker)}</span>
        <h1>${esc(v.h1)}</h1>
        <p class="sub">${sub}</p>
        <div class="tl-legend">${legend}</div>
      </div></div>
    </header>
    <div class="tl-wrap">
      <p class="tl-intro">${intro}</p>
      <p class="tl-method">${method}</p>
      <div class="tl-board">
${rows}
      </div>
${moreHtml(v)}
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
}

// ---- hub ----
function buildHub() {
  const card = (v) => { const top = bucket(v).ranked[0].c; return `        <a class="hub-card" href="/${v.slug}">
          <img class="hub-card-img" src="/images/cities/${top.id}-card.webp" alt="${esc(top.name)}" loading="lazy" onerror="this.style.display='none'">
          <div class="hub-card-body"><h2 class="hub-card-title">${esc(v.hubLabel)}</h2><p class="hub-card-teaser">${esc(v.type === 'category' ? 'By ' + v.cat.lc + ' score' : v.type === 'region' ? 'Cities in ' + v.hubLabel + ' by Nomad Score' : 'Every rated city by Nomad Score')}</p></div>
        </a>`; };
  const section = (title, arr) => `      <h2 class="hub-sec">${title}</h2>\n      <div class="hub-grid">\n${arr.map(card).join('\n')}\n      </div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Digital Nomad City Tier Lists', url: BASE + '/tier-lists',
    hasPart: ALL.map((v) => ({ '@type': 'WebPage', name: v.hubLabel, url: BASE + '/' + v.slug })) };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Nomad City Tier Lists: Overall, by Region and Category | The Nomad HQ</title>
  <meta name="description" content="Every Nomad HQ tier list in one place, the all-cities tier list plus regional and category tier lists ranking digital nomad cities S to F.">
  <link rel="canonical" href="${BASE}/tier-lists">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Digital Nomad City Tier Lists | The Nomad HQ">
  <meta property="og:description" content="The all-cities tier list plus regional and category tier lists, cities ranked S to F.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/tier-lists">
  <meta property="og:image" content="${BASE}/images/og/${bucket(master).ranked[0].c.id}.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/styles/base.css">
  <link rel="stylesheet" href="/styles/nav.css">
  <link rel="stylesheet" href="/styles/footer.css">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    .hub-head { max-width:1040px; margin:0 auto; padding: calc(var(--nav-height,64px) + 3rem) var(--space-4,1rem) 0; }
    .hub-eyebrow { font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:var(--color-terracotta); margin:0 0 .6rem; }
    .hub-head h1 { font-family:'DM Serif Display',serif; font-size:clamp(2rem,5vw,3rem); color:var(--color-ink); line-height:1.1; margin:0 0 .8rem; }
    .hub-head p { font-size:var(--text-lg); line-height:1.7; color:var(--color-charcoal); max-width:70ch; margin:0; }
    .hub-wrap { max-width:1040px; margin:0 auto; padding:2rem var(--space-4,1rem) 1rem; }
    .hub-sec { font-family:'DM Serif Display',serif; font-size:1.5rem; color:var(--color-ink); margin:2.2rem 0 1rem; }
    .hub-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:1rem; }
    .hub-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--color-sand-dark); border-radius:14px; overflow:hidden; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .hub-card:hover { border-color:var(--color-terracotta); transform:translateY(-2px); box-shadow:0 10px 26px rgba(15,23,42,.1); }
    .hub-card-img { width:100%; height:120px; object-fit:cover; background:var(--color-sand); }
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
      <p class="hub-eyebrow">The Nomad HQ City Index</p>
      <h1>Digital Nomad City Tier Lists</h1>
      <p>Every tier list in one place. Start with the all-cities tier list, then drill into a region or a single factor. Every city is bucketed from S tier to F and links to its full guide.</p>
    </div>
    <div class="hub-wrap">
${section('The master tier list', [master])}
${section('By region', regionVariants)}
${section('By category', catVariants)}
      <div class="hub-cta"><a href="/tier-list" class="btn btn-primary btn-lg">Open the master tier list &rarr;</a></div>
    </div>
  </main>
  ${FOOTER}
  ${NAVJS}
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'tier-lists.html'), html);
}

// ---- write all ----
fs.mkdirSync(path.join(ROOT, 'tier-list'), { recursive: true });
for (const v of ALL) fs.writeFileSync(path.join(ROOT, v.file), render(v));
buildHub();
console.log(`Built ${ALL.length} tier lists + hub. master #1 ${bucket(master).ranked[0].c.name}; regions ${regionVariants.length}; categories ${catVariants.length}`);
