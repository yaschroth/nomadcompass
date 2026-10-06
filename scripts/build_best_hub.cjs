require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds the /best hub (root best.html) listing every "Best cities for X" ranking page
 * found as best-<key>.json in env DIR. Card per page: title, teaser, #1 city.
 * Usage: DIR=... node scripts/build_best_hub.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const shell = require(path.join(__dirname, 'lib', 'page_shell.cjs'));
const { stats, INDEX_PHRASES } = require('./lib/site-stats.cjs');
const S = stats();
// Same correction apply_best_page.cjs makes: a teaser written when the index was another size says
// the true size on the way out.
const trueCounts = (str) => INDEX_PHRASES.reduce((acc, re) => acc.replace(new RegExp(re.source, 'g'), '$1' + S.cities + '$3'), String(str || ''));
// S tier is a Nomad Score of 9.0 or more (build_tier_list.cjs). The count was hard-coded as "2" and
// had become 4 by 2026-10-06; it is counted from the data now.
const S_TIER = (() => {
  const m = {}; new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(m);
  const CK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
  const ns = (c) => { let t = 0, n = 0; CK.forEach((k) => { const v = c.scores[k]; if (typeof v === 'number') { t += v; n++; } }); return +Math.max(2.5, Math.min(9.9, 6.9 + (t / n - 6.47) / 0.44 * 1.05)).toFixed(1); };
  return m.exports.filter((c) => c && c.id && ns(c) >= 9.0).length;
})();
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
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
  return { key: k, slug: d.slug, h1: d.h1, top: d.cities[0], teaser: trueCounts(teaser) };
}).sort((a, b) => a.h1.localeCompare(b.h1));

const card = (p) => `        <a class="hub-card" href="/best/${p.slug}">
          <img class="hub-card-img" src="/images/cities/${p.top.id}-card.webp" alt="${esc(p.top.name)}" loading="lazy" onerror="this.style.display='none'">
          <div class="hub-card-body">
            <h3 class="hub-card-title">${esc(p.h1)}</h3>
            <p class="hub-card-teaser">${esc(p.teaser)}</p>
            <p class="hub-card-top"><img class="hub-flag" src="${flag(p.top.iso)}" alt="" width="20" height="15"> #1 ${esc(p.top.name)}, ${esc(p.top.country)}</p>
          </div>
        </a>`;
// Places get a compact tile: twenty country pages as full cards turned the hub into a wall of photos.
const tile = (p) => `        <a class="hub-tile" href="/best/${p.slug}">
          <img class="hub-tile-img" src="/images/cities/${p.top.id}-card.webp" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="hub-tile-body"><span class="hub-tile-name">${esc(p.h1.replace(/^Best Digital Nomad Cities in (the )?/, ''))}</span><span class="hub-tile-top">#1 ${esc(p.top.name)}</span></span>
        </a>`;
// Grouped by what a reader is optimising for (2026-10-06, at 51 pages). A key not listed lands in
// "More rankings" rather than disappearing, so a new page can never be missing from the hub.
// Four per group on purpose: the grid is 4 / 2 / 1 columns, so every row closes without an orphan card.
const GROUPS = [
  { title: 'Cost and value', keys: ['cost', 'value', 'broke', 'cheapwifi'] },
  { title: 'Weather and climate', keys: ['climate', 'wintersun', 'summercool', 'spring'] },
  { title: 'Settling in', keys: ['overall', 'visa', 'english', 'community'] },
  { title: 'Safety, health and comfort', keys: ['safety', 'cleanliness', 'airquality', 'wifi'] },
  { title: 'How you like to live', keys: ['food', 'culture', 'nature', 'nightlife'] },
  { title: 'Who you are', keys: ['beginner', 'female', 'families', 'party'] },
];
const byKey = Object.fromEntries(pages.map((p) => [p.key, p]));
const used = new Set();
const section = (title, inner, cls) => `      <section class="hub-group">
        <h2 class="hub-group-title">${esc(title)}</h2>
        <div class="${cls}">
${inner}
        </div>
      </section>`;
const groupsHtml = GROUPS.map((g) => {
  const ps = g.keys.map((k) => byKey[k]).filter(Boolean);
  ps.forEach((p) => used.add(p.key));
  return ps.length ? section(g.title, ps.map(card).join('\n'), 'hub-grid') : '';
}).join('\n');
const regions = pages.filter((p) => p.key.startsWith('region_'));
const countries = pages.filter((p) => p.key.startsWith('country_'));
[...regions, ...countries].forEach((p) => used.add(p.key));
const rest = pages.filter((p) => !used.has(p.key));
const cards = [groupsHtml,
  rest.length ? section('More rankings', rest.map(card).join('\n'), 'hub-grid') : '',
  section('By region', regions.map(tile).join('\n'), 'hub-tiles'),
  section('By country', countries.map(tile).join('\n'), 'hub-tiles'),
].filter(Boolean).join('\n');

const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Best Cities for Digital Nomads', url: BASE + '/best',
  hasPart: pages.map((p) => ({ '@type': 'WebPage', name: p.h1, url: BASE + '/best/' + p.slug })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${shell.headTop}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Best Cities for Digital Nomads: Cost, WiFi and Safety | The Nomad HQ</title>
  <meta name="description" content="Data-driven rankings of the best digital nomad cities for cost of living, fast WiFi, safety and more, drawn from our index of ${S.cities} destinations.">
  <link rel="canonical" href="${BASE}/best">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Best Cities for Digital Nomads: The Rankings | The Nomad HQ">
  <meta property="og:description" content="Rankings of the best nomad cities for cost, WiFi, safety and more, from our ${S.cities}-city index.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/best">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Best Cities for Digital Nomads: The Rankings">
  <meta name="twitter:image" content="${BASE}/assets/og-image.png">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
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
    .hub-group { margin: 0 0 3rem; }
    .hub-group .hub-grid { grid-template-columns: 1fr; }
    @media (min-width: 600px) { .hub-group .hub-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1000px) { .hub-group .hub-grid { grid-template-columns: repeat(4, 1fr); } .hub-group .hub-card-img { height: 130px; } .hub-group .hub-card-title { font-size: 1.2rem; } }
    .hub-group-title { font-family:'DM Serif Display',serif; font-size:clamp(1.5rem,3vw,1.9rem); color:var(--color-ink); margin:0 0 1.1rem; padding-bottom:.55rem; border-bottom:1px solid var(--color-sand-dark); }
    .hub-tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:.8rem; }
    .hub-tile { display:flex; align-items:center; gap:.8rem; background:#fff; border:1px solid var(--color-sand-dark); border-radius:12px; padding:.55rem; text-decoration:none; transition:border-color .15s, transform .15s, box-shadow .15s; }
    .hub-tile:hover { border-color:var(--color-terracotta); transform:translateY(-1px); box-shadow:0 8px 20px rgba(15,23,42,.08); }
    .hub-tile-img { width:64px; height:64px; flex:0 0 64px; border-radius:8px; object-fit:cover; background:var(--color-sand); }
    .hub-tile-body { display:flex; flex-direction:column; gap:.15rem; min-width:0; }
    .hub-tile-name { font-family:'DM Serif Display',serif; font-size:1.12rem; line-height:1.2; color:var(--color-ink); }
    .hub-tile-top { font-size:var(--text-sm); color:var(--color-terracotta); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hub-cta { text-align:center; padding:3rem 1rem 4rem; display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
    .hub-tier { display:flex; align-items:center; gap:1.1rem; flex-wrap:wrap; justify-content:space-between; background:linear-gradient(120deg, #1b2a44, #0f172a); color:#fff; border-radius:16px; padding:1.4rem 1.6rem; margin:0 0 2.5rem; text-decoration:none; transition:transform .15s, box-shadow .15s; }
    .hub-tier:hover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(15,23,42,.22); }
    .hub-tier-txt h2 { font-family:'DM Serif Display',serif; font-size:1.5rem; margin:0 0 .25rem; color:#fff; }
    .hub-tier-txt p { margin:0; color:rgba(255,255,255,.85); font-size:.98rem; }
    .hub-tier-badges { display:flex; gap:.35rem; flex:0 0 auto; }
    .hub-tier-badge { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'DM Serif Display',serif; font-size:1.1rem; color:#fff; }
    .hub-tier-go { flex:0 0 auto; font-weight:700; color:#ff8863; }
  </style>
  ${shell.headEnd}
</head>
<body>
  ${shell.bodyStart}
  ${shell.navFor('Rankings')}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/best-hero.webp" alt="A city skyline lit up at dusk" fetchpriority="high">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">The Nomad HQ City Index</span>
        <h1>The Best Cities for Digital Nomads</h1>
        <p class="sub">Every ranking below is drawn from the same index of ${S.cities} destinations, scored on the 13 factors that shape life as a remote worker. Pick the one that matches what you are optimizing for.</p>
      </div></div>
    </header>
    <div class="hub-wrap">
      <p class="hub-lead">There is no single best city for remote work, only the best city for your priorities. These rankings break the question down one factor at a time, from the cheapest bases to the safest streets and the fastest internet, so you can start from what matters most to you and drill into the full guide from there.</p>
      <a class="hub-tier" href="/tier-list">
        <div class="hub-tier-txt"><h2>The Digital Nomad Cities Tier List</h2><p>All ${S.cities} cities ranked S to F at a glance. Only ${NUMW[S_TIER] || S_TIER} make S tier.</p></div>
        <div class="hub-tier-badges"><span class="hub-tier-badge" style="background:#C0392B">S</span><span class="hub-tier-badge" style="background:#C4622E">A</span><span class="hub-tier-badge" style="background:#9E7B1E">B</span><span class="hub-tier-badge" style="background:#2F7D5A">C</span></div>
        <span class="hub-tier-go">View the tier list &rarr;</span>
      </a>
      <p style="margin:-1.5rem 0 2.2rem; font-size:.98rem;">Prefer to pick by what you do off the clock? Browse our editorial picks for the <a href="/activities" style="color:var(--color-terracotta); font-weight:600;">best cities by activity</a> (surfing, diving, watersports, shopping).</p>
${cards}
      <div class="hub-cta">
        <a href="/compare" class="btn btn-primary btn-lg">Compare cities head to head &rarr;</a>
        <a href="/cities" class="btn btn-secondary btn-lg">Browse all ${S.cities} guides</a>
      </div>
    </div>
  </main>
${shell.liftPhotoCredit('best.html')}  ${shell.footer}
${shell.bodyEnd}
</body>
</html>
`;
shell.assertComplete(html, 'best.html');
fs.writeFileSync(path.join(ROOT, 'best.html'), html);
console.log(`best.html hub built with ${pages.length} ranking pages.`);
