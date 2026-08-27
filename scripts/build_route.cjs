require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Builds /route: a dated Nomad Route Planner. Add cities in order, set a trip start date and
 * nights per stop, and the tool computes arrival/departure dates, a month-by-month prorated
 * budget (with real-climate season adjustment), per-stop weather from precomputed climate
 * normals, a packing list, a Schengen 90/180 tracker, per-hop jet-lag + flight distance/time/
 * CO2, a trip weather-comfort score, a visual timeline, and .ics / print export. Shareable via
 * ?route=id:nights,id:nights&start=YYYY-MM-DD. Data (cities, climate normals, country plug +
 * Schengen) is baked in. Run the head/body sweeps + sitemap afterwards.
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
const CLIMATE = require(path.join(ROOT, 'assets', 'city-climate.js'));
const META = require(path.join(ROOT, 'scripts', 'lib', 'country-meta.cjs'));
const CITY_TZ = require(path.join(ROOT, 'assets', 'city-tz.js'));

// [id, name, country, iso, lat, lng, cost, score, ianaZone, flightCode, airportKm]
// Airports, so a leg can name the route it actually is. Before this the planner drew a great-circle
// line between two city centroids and could say how far it was, but not what you would search for.
// searchCode is the IATA metropolitan code where one exists, because a New York leg wants NYC (JFK,
// Newark and LaGuardia together) rather than whichever field is nearest the city hall.
const AIR = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'city-airports.json'), 'utf8')).airports;
const DATA = m.exports.filter((c) => c && c.id && typeof c.lat === 'number' && typeof c.lng === 'number').map((c) => {
  const a = AIR[c.id] || null;
  return [
    c.id, c.name, c.country, iso(c.flag), c.lat, c.lng, typeof c.costPerMonth === 'number' ? c.costPerMonth : 0, nomadScore(c),
    CITY_TZ[c.id] || 'UTC',
    a ? (a.searchCode || a.iata) : '',
    a ? a.km : 0,
  ];
});
const missingAir = DATA.filter((d) => !d[9]).length;
if (missingAir) console.log('  note: ' + missingAir + ' cities have no airport, so their legs show no fare row');
const DEFAULT_ROUTE = ['lisbon', 'barcelona', 'medellin', 'bali'].filter((id) => DATA.some((d) => d[0] === id));
// country -> [plugTypes, schengen]; only ship entries for countries we actually use
const USED_META = {};
new Set(DATA.map((d) => d[2])).forEach((ctry) => { if (META[ctry]) USED_META[ctry] = META[ctry]; });

function navHtml() {
  const items = [['/', 'Home'], ['/wheel', 'Wheel'], ['/cities', 'Cities'], ['/map', 'Map'], ['/best', 'Rankings'], ['/tier-list', 'Tier List'], ['/compare', 'Compare'], ['/blog', 'Blog']];
  const li = (cls) => items.map(([h, t]) => `<li><a href="${h}" class="${cls}">${t}</a></li>`).join('');
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
        <div class="footer-column"><h4 class="footer-heading">Explore</h4><ul class="footer-links"><li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li><li><a href="/route" class="footer-link">Route Planner</a></li><li><a href="/timezones" class="footer-link">Time Zone Finder</a></li><li><a href="/compare" class="footer-link">Compare Cities</a></li><li><a href="/wheel" class="footer-link">Decision Wheel</a></li></ul></div>
        <div class="footer-column"><h4 class="footer-heading">Resources</h4><ul class="footer-links"><li><a href="/blog" class="footer-link">Blog</a></li></ul></div>
      </div>
      <div class="footer-bottom"><nav class="footer-legal" aria-label="Legal and company"><a href="/about">About</a><a href="/contact">Contact</a><a href="/disclosure">Affiliate Disclosure</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/legal-notice">Legal Notice</a></nav>
      <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
      <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p></div>
    </div></footer>`;

const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Digital Nomad Route Planner', url: BASE + '/route', applicationCategory: 'TravelApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Plan a dated multi-city nomad trip: month-by-month budget, weather, packing list, Schengen tracker, jet-lag and flights.' };
const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', BASE + '/'], ['Route Planner', BASE + '/route']].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nomad Route Planner: Dates, Budget, Weather & Packing | The Nomad HQ</title>
  <meta name="description" content="Plan a dated multi-city nomad trip: set your dates and get a month-by-month budget, per-stop weather, a packing list, a Schengen 90/180 tracker, jet-lag and flight info. Free.">
  <link rel="canonical" href="${BASE}/route">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta property="og:title" content="Nomad Route Planner | The Nomad HQ">
  <meta property="og:description" content="Plan a dated nomad trip with budget, weather, packing and a Schengen tracker.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/route">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/styles/fonts.css">
  <link rel="preload" as="image" href="/assets/route-hero.webp" fetchpriority="high">
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
    .rt-wrap { max-width:1280px; margin:0 auto; padding:1.5rem var(--space-4,1rem) 3.5rem; display:grid; grid-template-columns:1fr 350px; gap:1.5rem; align-items:start; }
    @media (max-width:980px){ .rt-wrap{ grid-template-columns:1fr; } }
    .rt-main { min-width:0; display:flex; flex-direction:column; gap:1.25rem; }
    .rt-card { background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.15rem 1.3rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .rt-card h2 { font-family:'DM Serif Display',serif; font-size:1.3rem; color:var(--color-ink); margin:0 0 .2rem; }
    .rt-card .rt-card-note { font-size:.8rem; color:var(--color-stone); margin:0 0 1rem; }
    .rt-map { position:relative; width:100%; aspect-ratio:2/1; background:#eef1f4 url('/assets/world-map.webp') center/100% 100% no-repeat; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; overflow:hidden; }
    .rt-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .rt-dot { position:absolute; width:7px; height:7px; margin:-3.5px 0 0 -3.5px; border-radius:50%; background:#8a8175; opacity:.45; cursor:pointer; z-index:2; transition:transform .1s; }
    .rt-dot:hover { transform:scale(1.8); opacity:1; background:var(--color-terracotta); z-index:6; }
    .rt-stop { position:absolute; width:24px; height:24px; margin:-12px 0 0 -12px; border-radius:50%; background:var(--color-terracotta); color:#fff; font-size:.75rem; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(15,23,42,.35); z-index:5; }
    /* summary stat tiles */
    .rt-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.8rem; }
    .rt-stat { position:relative; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; padding:.85rem .95rem; overflow:hidden; }
    .rt-stat::before { content:''; position:absolute; top:0; left:0; width:100%; height:3px; background:var(--color-sand-dark,#e3d9c6); }
    .rt-stat.is-hl::before { background:var(--color-terracotta); }
    .rt-stat .k { font-size:.68rem; font-weight:600; text-transform:uppercase; letter-spacing:.07em; color:var(--color-stone); margin:0 0 .3rem; }
    .rt-stat .v { font-size:1.6rem; font-weight:700; color:var(--color-ink); line-height:1; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
    .rt-stat .v small { font-size:.78rem; font-weight:600; color:var(--color-stone); }
    .rt-stat.is-hl .v, .rt-stat .v.big { color:var(--color-terracotta); }
    /* timeline */
    .rt-timeline { display:flex; width:100%; height:15px; border-radius:6px; overflow:hidden; margin:.2rem 0 .35rem; }
    .rt-timeline span { display:block; height:100%; border-right:1px solid #fff; }
    .rt-tl-months { display:flex; width:100%; font-size:.66rem; color:var(--color-stone); }
    .rt-tl-months span { text-align:center; overflow:hidden; white-space:nowrap; border-left:1px solid var(--color-sand,#f0e9dc); padding-left:2px; }
    .rt-tl-legend { display:flex; flex-wrap:wrap; gap:.5rem 1rem; margin-top:.7rem; font-size:.78rem; color:var(--color-charcoal); }
    .rt-tl-legend .sw { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:.35rem; vertical-align:middle; }
    /* budget table */
    .rt-budget-mo { border-top:1px solid var(--color-sand,#f0e9dc); padding:.7rem 0; }
    .rt-budget-mo:first-of-type { border-top:none; }
    .rt-budget-head { display:flex; justify-content:space-between; align-items:baseline; }
    .rt-budget-head b { font-size:.98rem; color:var(--color-ink); }
    .rt-budget-head .mt { font-weight:700; color:var(--color-ink); }
    .rt-budget-line { display:flex; justify-content:space-between; font-size:.85rem; color:var(--color-charcoal); margin:.25rem 0 0; }
    .rt-budget-line .seas { font-size:.72rem; padding:0 .35rem; border-radius:5px; margin-left:.35rem; }
    .rt-seas-peak { background:#fbe9e6; color:#b23; } .rt-seas-low { background:#e6f0ea; color:#2f7d5a; } .rt-seas-shoulder { background:var(--color-sand,#f4efe4); color:#8a7a55; }
    .rt-budget-total { display:flex; justify-content:space-between; align-items:baseline; border-top:2px solid var(--color-sand-dark,#e3d9c6); margin-top:.7rem; padding-top:.7rem; }
    .rt-budget-total .rt-total-big { font-family:'DM Serif Display',serif; font-size:1.6rem; color:var(--color-terracotta); }
    /* stop detail */
    .rt-stopcard { display:flex; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:14px; box-shadow:0 6px 18px rgba(15,23,42,.05); overflow:hidden; margin:0 0 .9rem; }
    .rt-sc-accent { flex:0 0 5px; background:var(--acc,var(--color-terracotta)); }
    .rt-sc-body { flex:1; min-width:0; padding:1rem 1.15rem; }
    .rt-stopcard-h { display:flex; align-items:center; gap:.6rem; }
    .rt-sc-num { flex:0 0 auto; width:28px; height:28px; border-radius:9px; background:var(--acc,var(--color-terracotta)); color:#fff; font-size:.8rem; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .rt-sc-name { font-weight:700; color:var(--color-ink); font-size:1.05rem; }
    .rt-sc-name small { font-weight:400; color:var(--color-stone); }
    .rt-sc-dates { margin-left:auto; font-size:.8rem; color:var(--color-charcoal); text-align:right; white-space:nowrap; } .rt-sc-dates b { color:var(--color-ink); }
    .rt-wx { display:flex; align-items:center; gap:.7rem; margin:.85rem 0 0; padding:.7rem .8rem; background:var(--color-sand,#f6f1e7); border-radius:11px; }
    .rt-wx-ico { flex:0 0 auto; width:40px; height:40px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; font-size:1.35rem; box-shadow:0 2px 6px rgba(0,0,0,.06); }
    .rt-wx-main { flex:1; min-width:0; } .rt-wx-main .t { font-weight:600; color:var(--color-ink); font-size:.9rem; } .rt-wx-main .s { font-size:.76rem; color:var(--color-stone); margin:.05rem 0 .4rem; }
    .rt-tbar { position:relative; height:8px; border-radius:4px; background:linear-gradient(90deg,#5b8fc9,#56b6a6 30%,#e9c94a 62%,#e8804d 82%,#d1503a); }
    .rt-tbar-win { position:absolute; top:-2px; height:12px; border:2px solid #fff; border-radius:5px; background:rgba(255,255,255,.12); box-shadow:0 0 0 1px rgba(15,23,42,.18); box-sizing:border-box; }
    .rt-wx-nodata { margin:.85rem 0 0; font-size:.82rem; color:var(--color-stone); }
    .rt-sc-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:.6rem .9rem; margin:.85rem 0 0; }
    .rt-fact { font-size:.82rem; color:var(--color-charcoal); line-height:1.3; }
    .rt-fare { display:flex; align-items:center; flex-wrap:wrap; gap:.4rem; }
    .rt-fare-in { display:inline-flex; align-items:center; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:8px; background:#fff; padding:0 .1rem 0 .45rem; }
    .rt-fare-in:focus-within { border-color:var(--color-terracotta,#c0392b); }
    .rt-fare-cur { font-size:.82rem; color:var(--color-stone,#64748b); }
    .rt-fare-in input { width:5.2rem; border:0; padding:.28rem .35rem; font:inherit; font-size:.85rem; color:var(--color-ink,#0f172a); background:transparent; -moz-appearance:textfield; appearance:textfield; }
    .rt-fare-in input:focus { outline:none; }
    .rt-fare-in input::-webkit-outer-spin-button, .rt-fare-in input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
    .rt-fare-find { font-size:.78rem; font-weight:600; color:var(--color-terracotta,#c0392b); text-decoration:none; white-space:nowrap; }
    .rt-fare-find:hover { text-decoration:underline; }
    .rt-fare-none { color:var(--color-stone,#64748b); font-style:italic; }
    .rt-budget-note { font-size:.78rem; color:var(--color-stone,#64748b); line-height:1.5; margin:.45rem 0 0; }
    .rt-fact .fk { display:block; font-size:.66rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .18rem; }
    .rt-fact .rt-fv { color:var(--color-ink); font-weight:600; } .rt-fact .rt-fmuted { color:var(--color-stone); font-weight:400; }
    .rt-chip { display:inline-flex; align-items:center; gap:5px; font-size:.72rem; font-weight:700; padding:2px 9px; border-radius:999px; }
    .rt-chip .dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .rt-warn { margin:.7rem 0 0; font-size:.8rem; color:#a4442f; background:#fbe9e6; border-radius:8px; padding:.45rem .65rem; }
    /* schengen */
    .rt-sch-bar { height:12px; border-radius:6px; background:var(--color-sand,#f0e9dc); overflow:hidden; margin:.5rem 0; }
    .rt-sch-bar span { display:block; height:100%; background:#2f7d5a; }
    .rt-sch-bar span.over { background:#c0392b; }
    /* packing */
    .rt-pack-group { margin:.6rem 0 0; }
    .rt-pack-group h3 { font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .35rem; }
    .rt-pack-group ul { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:.4rem; }
    .rt-pack-group li { font-size:.83rem; background:var(--color-sand,#f6f1e7); border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:999px; padding:.28rem .7rem; color:var(--color-charcoal); }
    /* right editor panel */
    .rt-panel { position:sticky; top:84px; background:#fff; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:16px; padding:1.2rem 1.3rem; box-shadow:0 8px 24px rgba(15,23,42,.05); }
    .rt-field { margin:0 0 1rem; } .rt-field label { display:block; font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; color:var(--color-stone); margin:0 0 .3rem; }
    .rt-field input { width:100%; box-sizing:border-box; font-family:inherit; font-size:.95rem; padding:.55rem .7rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:10px; }
    .rt-list { list-style:none; margin:0 0 1rem; padding:0; }
    .rt-item { display:grid; grid-template-columns:24px 1fr auto; gap:.5rem; align-items:center; padding:.55rem 0; border-bottom:1px solid var(--color-sand,#f0e9dc); }
    .rt-item:last-child { border-bottom:none; }
    .rt-num { width:22px; height:22px; border-radius:50%; background:var(--color-terracotta); color:#fff; font-size:.72rem; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .rt-item-body { min-width:0; } .rt-item-name { display:block; font-weight:700; color:var(--color-ink); font-size:.92rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .rt-item-sub { display:flex; align-items:center; gap:.35rem; font-size:.74rem; color:var(--color-stone); margin-top:.15rem; }
    .rt-item-sub input { width:44px; box-sizing:border-box; font-family:inherit; font-size:.76rem; padding:.12rem .3rem; border:1px solid var(--color-sand-dark,#e3d9c6); border-radius:6px; text-align:center; }
    .rt-item-btns { display:flex; gap:.15rem; }
    .rt-item-btns button { width:24px; height:24px; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; border-radius:6px; cursor:pointer; color:var(--color-stone); font-size:.8rem; line-height:1; }
    .rt-item-btns button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .rt-empty { color:var(--color-stone); font-size:.9rem; padding:1rem 0; text-align:center; }
    .rt-actions { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-top:.3rem; }
    .rt-actions button { font-family:inherit; font-size:.83rem; font-weight:600; padding:.55rem; border-radius:9px; cursor:pointer; border:1px solid var(--color-sand-dark,#e3d9c6); background:#fff; color:var(--color-charcoal); }
    .rt-actions button:hover { border-color:var(--color-terracotta); color:var(--color-terracotta); }
    .rt-actions button.rt-primary { grid-column:1 / -1; background:var(--color-terracotta); color:#fff; border-color:var(--color-terracotta); }
    .rt-hint { font-size:.78rem; color:var(--color-stone); margin:.9rem 0 0; line-height:1.5; }
    .rt-copied { color:#2f7d5a !important; border-color:#2f7d5a !important; }
    .rt-disclaim { font-size:.75rem; color:var(--color-stone); line-height:1.5; margin:1.2rem 0 0; }
    @media print {
      .nav, .footer, .hub-hero, .rt-panel, .rt-map, #rtMapCard { display:none !important; }
      .rt-wrap { display:block; padding:0; } .rt-card { box-shadow:none; border:none; padding:.3rem 0; break-inside:avoid; }
      body { background:#fff; }
    }
  </style>
</head>
<body>
  ${navHtml()}
  <main>
    <header class="hub-hero">
      <img class="hub-hero-img" src="/assets/route-hero.webp" alt="The winding hairpin bends of the Transfagarasan mountain road through green Romanian peaks" fetchpriority="high" width="1920" height="1275">
      <div class="hub-hero-overlay"><div class="container">
        <span class="hub-eyebrow">Trip tool</span>
        <h1>Nomad Route Planner</h1>
        <p class="sub">Chain cities into a dated trip and get a month-by-month budget, the weather you will actually get, a packing list, a Schengen day tracker, and jet-lag and flight info for every hop.</p>
      </div></div>
    </header>
    <div class="rt-wrap">
      <div class="rt-main">
        <div class="rt-card" id="rtMapCard" style="padding:0;border:none;box-shadow:none;">
          <div class="rt-map" id="rtMap">
            <svg class="rt-svg" viewBox="0 0 360 180" preserveAspectRatio="none"><polyline id="rtLine" fill="none" stroke="#c0392b" stroke-width="1.1" stroke-dasharray="2.4 1.8" stroke-linejoin="round" stroke-linecap="round" points=""></polyline></svg>
          </div>
        </div>
        <div class="rt-card" id="rtSummaryCard">
          <h2>Trip at a glance</h2>
          <p class="rt-card-note" id="rtSpan"></p>
          <div class="rt-timeline" id="rtTimeline"></div>
          <div class="rt-tl-months" id="rtTlMonths"></div>
          <div class="rt-tl-legend" id="rtTlLegend"></div>
          <div class="rt-stats" id="rtStats" style="margin-top:1.1rem;"></div>
        </div>
        <div class="rt-card" id="rtSchCard" hidden>
          <h2>Schengen 90/180 tracker</h2>
          <p class="rt-card-note">Most nationalities may spend at most 90 days in any rolling 180-day window in the Schengen area. This counts the nights your route spends in Schengen countries.</p>
          <div id="rtSchBody"></div>
        </div>
        <div class="rt-card" id="rtBudgetCard">
          <h2>Month-by-month budget</h2>
          <p class="rt-card-note">Each city's monthly cost is split across the nights you are there, then adjusted up or down for local high and low season (estimated from the climate). Accommodation-led estimate in USD, not a quote.</p>
          <div id="rtBudget"></div>
        </div>
        <div class="rt-card" id="rtStopsCard">
          <h2>Your stops, month by month</h2>
          <p class="rt-card-note">Weather is the 2019-2023 average for the month you arrive, from Open-Meteo. Season, daylight, jet-lag and the flight in are computed for your dates.</p>
          <div id="rtStopDetails"></div>
        </div>
        <div class="rt-card" id="rtPackCard">
          <h2>Packing list</h2>
          <p class="rt-card-note" id="rtPackNote"></p>
          <div id="rtPack"></div>
        </div>
      </div>
      <aside class="rt-panel">
        <div class="rt-field"><label for="rtStart">Trip start date</label><input type="date" id="rtStart"></div>
        <div class="rt-field"><label for="rtAdd">Add a city</label><input type="search" id="rtAdd" list="rtCityList" placeholder="Search 405 cities&hellip;"><datalist id="rtCityList"></datalist></div>
        <ol class="rt-list" id="rtList"></ol>
        <div class="rt-actions">
          <button type="button" class="rt-primary" id="rtShare">Copy share link</button>
          <button type="button" id="rtIcs">Export .ics</button>
          <button type="button" id="rtPrint">Print</button>
          <button type="button" id="rtClear" style="grid-column:1 / -1;">Clear all</button>
        </div>
        <p class="rt-hint">Set nights per stop in the list. Dates chain automatically. Click a faint dot on the map to add a city.</p>
        <p class="rt-disclaim">Budgets and season adjustments are editorial estimates in USD, not quotes. Weather is a historical average, not a forecast. Always confirm your own visa and stay limits.</p>
      </aside>
    </div>
  </main>
  ${FOOTER}
  <script src="/assets/city-search-index.js" defer></script>
  <script>
    (function(){
      var CITIES=${JSON.stringify(DATA)};
      var CLIMATE=${JSON.stringify(CLIMATE)};
      var META=${JSON.stringify(USED_META)};
      var DEFAULT_ROUTE=${JSON.stringify(DEFAULT_ROUTE)};
      var byId={}; CITIES.forEach(function(c){byId[c[0]]=c;});
      var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var DAY=86400000;
      var map=document.getElementById('rtMap'),line=document.getElementById('rtLine'),list=document.getElementById('rtList');
      var addInput=document.getElementById('rtAdd'),dl=document.getElementById('rtCityList'),startInput=document.getElementById('rtStart');
      var route=[]; // array of {id, nights}
      var money=function(v){return '$'+Math.round(v).toLocaleString('en-US');};

      // faint dots + datalist
      var frag=document.createDocumentFragment();
      CITIES.forEach(function(c){
        var d=document.createElement('a');d.className='rt-dot';d.href='#';d.title=c[1];
        d.style.left=((c[5]+180)/360*100).toFixed(3)+'%';d.style.top=((90-c[4])/180*100).toFixed(3)+'%';
        d.addEventListener('click',function(e){e.preventDefault();add(c[0]);});
        map.appendChild(d);
        var o=document.createElement('option');o.value=c[1];dl.appendChild(o);
      });

      function haversine(a,b){var R=6371,dLat=(b[4]-a[4])*Math.PI/180,dLng=(b[5]-a[5])*Math.PI/180;var s=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[4]*Math.PI/180)*Math.cos(b[4]*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);return 2*R*Math.asin(Math.sqrt(s));}
      function offOf(zone,t){try{var p=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset',hour:'numeric'}).formatToParts(new Date(t));var o=(p.find(function(x){return x.type==='timeZoneName';})||{}).value||'GMT+0';var mm=o.match(/GMT([+-])(\\d{1,2})(?::(\\d{2}))?/);if(!mm)return 0;var h=(+mm[2])+(mm[3]?(+mm[3])/60:0);return mm[1]==='-'?-h:h;}catch(e){return 0;}}
      function daysInMonth(y,mo){return new Date(Date.UTC(y,mo+1,0)).getUTCDate();}
      function addDaysUTC(t,n){return t+n*DAY;}
      function ymd(t){var d=new Date(t);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
      function fmt(t){var d=new Date(t);return MON[d.getUTCMonth()]+' '+d.getUTCDate();}
      function fmtY(t){var d=new Date(t);return MON[d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear();}
      function parseStart(){var v=startInput.value;if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v)){var p=v.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2]);}
        var n=new Date();return Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+1,1);} // default: first of next month

      // ---- climate helpers ----
      function comfort(id,mo){var cl=CLIMATE[id];if(!cl||cl.h[mo]==null||cl.l[mo]==null)return null;var avg=(cl.h[mo]+cl.l[mo])/2;var r=cl.r[mo]==null?40:cl.r[mo];var tS=Math.max(0,100-Math.abs(avg-24)*5);var rS=Math.max(0,100-r*0.5);return Math.round(0.65*tS+0.35*rS);}
      var seasonCache={};
      function seasonInfo(id){if(seasonCache[id])return seasonCache[id];var cl=CLIMATE[id];var mult=[],lab=[];if(!cl){for(var i=0;i<12;i++){mult.push(0);lab.push('');}return seasonCache[id]={mult:mult,lab:lab};}
        var cs=[];for(var mo=0;mo<12;mo++)cs.push({mo:mo,c:comfort(id,mo)});
        var ranked=cs.filter(function(x){return x.c!=null;}).sort(function(a,b){return b.c-a.c;});
        var peak={},low={};ranked.slice(0,4).forEach(function(x){peak[x.mo]=1;});ranked.slice(-4).forEach(function(x){low[x.mo]=1;});
        for(var mo=0;mo<12;mo++){if(peak[mo]){mult.push(0.15);lab.push('Peak');}else if(low[mo]){mult.push(-0.10);lab.push('Low');}else{mult.push(0);lab.push('Shoulder');}}
        return seasonCache[id]={mult:mult,lab:lab};}
      function adjCost(id,mo){var c=byId[id][6];return c*(1+seasonInfo(id).mult[mo]);}

      // Aviasales search deep link: ORIGIN + DDMM + DESTINATION + passengers, so LIS1403BCN1 is
      // Lisbon to Barcelona on 14 March for one. marker is our Travelpayouts partner id, the same
      // one every other travel link on the site carries.
      function flightSearchUrl(from,to,when){var d=new Date(when);
        var dd=String(d.getUTCDate()).padStart(2,'0'),mm=String(d.getUTCMonth()+1).padStart(2,'0');
        return 'https://www.aviasales.com/search/'+from+dd+mm+to+'1?marker=557916';}
      function weatherVerdict(id,mo){var cl=CLIMATE[id];if(!cl||cl.h[mo]==null)return {txt:'No climate data',emo:''};
        var hi=cl.h[mo],lo=cl.l[mo],r=cl.r[mo]==null?40:cl.r[mo];var temp;
        if(hi>=32)temp='Hot';else if(hi>=25)temp='Warm';else if(hi>=18)temp='Mild';else if(hi>=10)temp='Cool';else temp='Cold';
        var wet;if(r>=150)wet='very wet';else if(r>=80)wet='wet';else if(r>=30)wet='some rain';else wet='dry';
        var emo;if(temp==='Cold')emo='\\u2744\\uFE0F';else if(r>=80)emo='\\uD83C\\uDF27\\uFE0F';else if(wet==='dry'&&(temp==='Warm'||temp==='Hot'))emo='\\u2600\\uFE0F';else emo='\\uD83C\\uDF24\\uFE0F';
        return {txt:temp+' &amp; '+wet,emo:emo,hi:hi,lo:lo,r:r};}
      function daylight(lat,t){var d=new Date(t);var start=Date.UTC(d.getUTCFullYear(),0,0);var N=Math.floor((t-start)/DAY);
        var P=Math.asin(0.39795*Math.cos(0.2163108+2*Math.atan(0.9671396*Math.tan(0.00860*(N-186)))));
        var phi=lat*Math.PI/180;var arg=(Math.sin(0.8333*Math.PI/180)+Math.sin(phi)*Math.sin(P))/(Math.cos(phi)*Math.cos(P));
        arg=Math.max(-1,Math.min(1,arg));return 24-(24/Math.PI)*Math.acos(arg);}

      // ---- build the computed itinerary ----
      function build(){
        var start=parseStart();var cur=start;var stops=[];
        route.forEach(function(r,i){var c=byId[r.id];var nights=Math.max(1,r.nights||1);var arr=cur,dep=addDaysUTC(cur,nights);
          var midMo=new Date(arr+(dep-arr)/2).getUTCMonth();
          stops.push({id:r.id,c:c,nights:nights,arr:arr,dep:dep,mo:midMo,fare:r.fare});cur=dep;});
        return {start:start,end:cur,stops:stops};}

      function render(){
        // markers + line
        [].slice.call(map.querySelectorAll('.rt-stop')).forEach(function(e){e.remove();});
        var pts=[];
        route.forEach(function(r,i){var c=byId[r.id];pts.push((c[5]+180)+','+(90-c[4]));
          var mk=document.createElement('div');mk.className='rt-stop';mk.textContent=i+1;mk.style.left=((c[5]+180)/360*100).toFixed(3)+'%';mk.style.top=((90-c[4])/180*100).toFixed(3)+'%';mk.title=c[1];map.appendChild(mk);});
        line.setAttribute('points',pts.join(' '));

        // editor list
        if(!route.length){list.innerHTML='<li class="rt-empty">No stops yet. Search a city or click a dot on the map.</li>';}
        else{var t=build();list.innerHTML=route.map(function(r,i){var c=byId[r.id];var s=t.stops[i];
          var flag=c[3]?'<img src="/assets/flags/'+c[3]+'.svg" alt="" width="16" height="12" style="border-radius:2px;vertical-align:-1px;margin-right:.25rem;">':'';
          return '<li class="rt-item"><span class="rt-num">'+(i+1)+'</span>'
            +'<span class="rt-item-body"><span class="rt-item-name">'+flag+c[1]+'</span>'
            +'<span class="rt-item-sub"><input type="number" min="1" max="365" value="'+r.nights+'" data-nights="'+i+'" aria-label="Nights in '+c[1]+'"> nights &middot; '+fmt(s.arr)+'&ndash;'+fmt(s.dep)+'</span></span>'
            +'<span class="rt-item-btns"><button data-up="'+i+'" title="Move up" aria-label="Move up">&uarr;</button><button data-down="'+i+'" title="Move down" aria-label="Move down">&darr;</button><button data-rm="'+i+'" title="Remove" aria-label="Remove">&times;</button></span></li>';
        }).join('');}

        renderResults();
        syncUrl();
      }

      function refreshTotals(){renderResults(true);}

      function syncUrl(){
        try{var u=new URL(window.location);if(route.length)u.searchParams.set('route',route.map(function(r){return r.id+':'+r.nights+(r.fare!=null?':'+r.fare:'');}).join(','));else u.searchParams.delete('route');u.searchParams.set('start',ymd(parseStart()));if(!route.length)u.searchParams.delete('start');history.replaceState(null,'',u);}catch(e){}
      }

      var PAL=['#c0392b','#c4622e','#9e7b1e','#2f7d5a','#3d6493','#7d5ba6','#b23c6e','#2f7d7d'];
      function tbar(lo,hi){var min=-5,max=40,sp=max-min;var l=Math.max(0,Math.min(100,(lo-min)/sp*100));var r=Math.max(0,Math.min(100,(hi-min)/sp*100));var w=Math.max(8,r-l);if(l+w>100)l=100-w;return '<div class="rt-tbar"><span class="rt-tbar-win" style="left:'+l.toFixed(0)+'%;width:'+w.toFixed(0)+'%"></span></div>';}
      // keepStops leaves the stop cards alone. They hold the fare inputs, and replacing their HTML
      // while someone is typing in one drops the focus after the first digit.
      function renderResults(keepStops){
        var showEls=['rtSummaryCard','rtBudgetCard','rtStopsCard','rtPackCard'];
        var t=build();
        if(!t.stops.length){showEls.forEach(function(id){document.getElementById(id).hidden=true;});document.getElementById('rtSchCard').hidden=true;return;}
        showEls.forEach(function(id){document.getElementById(id).hidden=false;});
        var totalNights=t.stops.reduce(function(a,s){return a+s.nights;},0);

        // ---- summary: span, timeline, stats ----
        document.getElementById('rtSpan').textContent=fmtY(t.start)+'  \\u2192  '+fmtY(t.end)+'  ('+totalNights+' nights, '+t.stops.length+' '+(t.stops.length===1?'stop':'stops')+')';
        var tl='',leg='';
        t.stops.forEach(function(s,i){var w=(s.nights/totalNights*100).toFixed(2);var col=PAL[i%PAL.length];
          tl+='<span style="width:'+w+'%;background:'+col+'" title="'+s.c[1]+': '+s.nights+' nights"></span>';
          leg+='<span><span class="sw" style="background:'+col+'"></span>'+s.c[1]+' ('+s.nights+'n)</span>';});
        document.getElementById('rtTimeline').innerHTML=tl;
        document.getElementById('rtTlLegend').innerHTML=leg;
        // month scale
        var mo='',cur=t.start;while(cur<t.end){var d=new Date(cur);var y=d.getUTCFullYear(),M=d.getUTCMonth();var mEnd=Date.UTC(y,M+1,1);var chunkEnd=Math.min(mEnd,t.end);var days=(chunkEnd-cur)/DAY;var w=(days/totalNights*100).toFixed(2);
          mo+='<span style="width:'+w+'%">'+MON[M]+(M===0?" '"+String(y).slice(2):'')+'</span>';cur=chunkEnd;}
        document.getElementById('rtTlMonths').innerHTML=mo;

        // ---- budget (prorated by calendar month, season-adjusted) ----
        var months={};var order=[];var grand=0;
        t.stops.forEach(function(s){var cur=s.arr;while(cur<s.dep){var d=new Date(cur);var y=d.getUTCFullYear(),M=d.getUTCMonth();var mEnd=Date.UTC(y,M+1,1);var chunkEnd=Math.min(mEnd,s.dep);var nights=Math.round((chunkEnd-cur)/DAY);
          var daily=adjCost(s.id,M)/30;var cost=daily*nights;grand+=cost;var key=y+'-'+M;if(!months[key]){months[key]={y:y,M:M,lines:[],tot:0};order.push(key);}
          months[key].lines.push({id:s.id,name:s.c[1],nights:nights,cost:cost,seas:seasonInfo(s.id).lab[M]});months[key].tot+=cost;cur=chunkEnd;}});
        var bh='';order.forEach(function(k){var mm=months[k];bh+='<div class="rt-budget-mo"><div class="rt-budget-head"><b>'+MON[mm.M]+' '+mm.y+'</b><span class="mt">'+money(mm.tot)+'</span></div>';
          mm.lines.forEach(function(l){var sc=l.seas==='Peak'?'rt-seas-peak':l.seas==='Low'?'rt-seas-low':'rt-seas-shoulder';var sb=l.seas?'<span class="seas '+sc+'">'+l.seas+'</span>':'';
            bh+='<div class="rt-budget-line"><span>'+l.name+' &middot; '+l.nights+'n'+sb+'</span><span>'+money(l.cost)+'</span></div>';});bh+='</div>';});
        // Flights sit outside the month-by-month living costs: a fare is paid once, usually well
        // before the month it belongs to, so folding it into a monthly column would misrepresent both.
        var fares=0,fareN=0,legs=0;
        t.stops.forEach(function(s,i){if(i===0)return;legs++;if(s.fare!=null){fares+=s.fare;fareN++;}});
        if(legs){
          bh+='<div class="rt-budget-mo rt-budget-flights"><div class="rt-budget-head"><b>Flights</b><span class="mt">'+(fareN?money(fares):'not added yet')+'</span></div>';
          t.stops.forEach(function(s,i){if(i===0)return;var p=t.stops[i-1];
            bh+='<div class="rt-budget-line"><span>'+p.c[1]+' &rarr; '+s.c[1]+'</span><span>'+(s.fare!=null?money(s.fare):'<span class="rt-fare-none">add below</span>')+'</span></div>';});
          if(fareN<legs)bh+='<div class="rt-budget-note">'+(legs-fareN)+' of '+legs+' legs have no fare yet, so the total is short by whatever those tickets cost. Each stop card has a field and a link to search that exact route.</div>';
          bh+='</div>';
        }
        var grandAll=grand+fares;
        bh+='<div class="rt-budget-total"><span><b>Total trip cost</b><br><small style="color:var(--color-stone)">'+money(grandAll/totalNights)+'/day average'+(fareN?', flights included':'')+'</small></span><span class="rt-total-big">'+money(grandAll)+'</span></div>';
        document.getElementById('rtBudget').innerHTML=bh;

        // ---- stats grid (comfort, distance, flights, co2) ----
        var dist=0,co2=0;for(var i=1;i<t.stops.length;i++){var dd=haversine(t.stops[i-1].c,t.stops[i].c);dist+=dd;co2+=dd*0.15;}
        var cw=0,cwN=0;t.stops.forEach(function(s){var c=comfort(s.id,s.mo);if(c!=null){cw+=c*s.nights;cwN+=s.nights;}});
        var comfortPct=cwN?Math.round(cw/cwN):null;
        var stats=[['Total budget',money(grandAll),'is-hl'],['Avg / day',money(grandAll/totalNights),''],['Total nights',totalNights,''],
          ['Flights',fareN?money(fares)+' <small>('+fareN+'/'+legs+')</small>':(legs+' legs'),''],['Flight distance',Math.round(dist).toLocaleString('en-US')+' <small>km</small>',''],
          ['Flight CO2','~'+Math.round(co2).toLocaleString('en-US')+' <small>kg</small>',''],
          ['Weather comfort',comfortPct==null?'n/a':comfortPct+'<small>/100</small>','']];
        document.getElementById('rtStats').innerHTML=stats.map(function(s){return '<div class="rt-stat '+s[2]+'"><p class="k">'+s[0]+'</p><div class="v">'+s[1]+'</div></div>';}).join('');

        // ---- Schengen tracker ----
        renderSchengen(t);

        // ---- per-stop detail ----
        var sd='';t.stops.forEach(function(s,i){var c=s.c;var w=weatherVerdict(s.id,s.mo);var si=seasonInfo(s.id);var seas=si.lab[s.mo];var mult=si.mult[s.mo];
          var dl=daylight(c[4],s.arr+(s.dep-s.arr)/2);var acc=PAL[i%PAL.length];
          var flag=c[3]?'<img src="/assets/flags/'+c[3]+'.svg" alt="" width="20" height="15" style="border-radius:2px;vertical-align:-2px;margin-right:.3rem;">':'';
          var wx;
          if(w.hi!=null){wx='<div class="rt-wx"><div class="rt-wx-ico">'+w.emo+'</div><div class="rt-wx-main">'
            +'<div class="t">'+w.txt+' &middot; '+w.hi+'&deg; / '+w.lo+'&deg;C</div>'
            +'<div class="s">'+MON[s.mo]+' average'+(w.r!=null?' &middot; '+w.r+'mm rain':'')+'</div>'+tbar(w.lo,w.hi)+'</div></div>';}
          else{wx='<div class="rt-wx-nodata">Weather data for '+c[1]+' is still loading in.</div>';}
          var facts=[];
          if(seas){var sc=seas==='Peak'?'rt-seas-peak':seas==='Low'?'rt-seas-low':'rt-seas-shoulder';
            facts.push('<div class="rt-fact"><span class="fk">Season</span><span class="rt-chip '+sc+'"><span class="dot"></span>'+seas+(mult?' '+(mult>0?'+':'')+Math.round(mult*100)+'%':'')+'</span></div>');}
          facts.push('<div class="rt-fact"><span class="fk">Daylight</span><span class="rt-fv">'+dl.toFixed(1)+' h</span></div>');
          facts.push('<div class="rt-fact"><span class="fk">Est. cost</span><span class="rt-fv">'+money(adjCost(s.id,s.mo))+'<span class="rt-fmuted">/mo</span></span></div>');
          if(i>0){var p=t.stops[i-1];var dd=haversine(p.c,c);var ft=dd/750+1;var tzd=Math.round((offOf(c[8],s.arr)-offOf(p.c[8],s.arr))*10)/10;
            var fromA=p.c[9],toA=c[9];var routeLbl=(fromA&&toA)?(fromA+' &rarr; '+toA+' &middot; '):'';
            facts.push('<div class="rt-fact"><span class="fk">Flight in</span><span class="rt-fv">'+routeLbl+Math.round(dd).toLocaleString('en-US')+' km</span>, ~'+ft.toFixed(1)+'h from '+p.c[1]+'</div>');
            var jl=tzd===0?'Same time zone':(Math.abs(tzd)+'h '+(tzd>0?'ahead':'behind')+', ~'+Math.max(1,Math.ceil(Math.abs(tzd)/1.5))+'d jet-lag');
            facts.push('<div class="rt-fact"><span class="fk">Time shift</span><span class="rt-fv">'+jl+'</span></div>');
            // The fare is typed in, never estimated. A ticket price turns on the date, the airline
            // and when you look, so a guessed figure would be worse than an empty field. The link
            // carries the real airports and the real arrival date, so the number is one click away.
            facts.push('<div class="rt-fact rt-fare"><span class="fk">Flight cost</span>'
              +'<span class="rt-fare-in"><span class="rt-fare-cur">$</span>'
              +'<input type="number" min="0" max="100000" step="1" inputmode="numeric" data-fare="'+i+'"'
              +' value="'+(s.fare!=null?s.fare:'')+'" placeholder="add" aria-label="Flight cost into '+c[1]+' in US dollars"></span>'
              +(fromA&&toA?' <a class="rt-fare-find" target="_blank" rel="sponsored nofollow noopener" href="'+flightSearchUrl(fromA,toA,s.arr)+'">Find fares &rarr;</a>':'')
              +'</div>');}
          var warn='';var badMo=bestMonths(s.id);
          if(badMo && badMo.worst.indexOf(s.mo)>=0 && badMo.best.length)warn='<div class="rt-warn">'+MON[s.mo]+' is one of '+c[1]+"'s tougher months for weather. Better: "+badMo.best.map(function(x){return MON[x];}).join(', ')+'.</div>';
          sd+='<div class="rt-stopcard" style="--acc:'+acc+'"><div class="rt-sc-accent"></div><div class="rt-sc-body">'
            +'<div class="rt-stopcard-h"><span class="rt-sc-num">'+(i+1)+'</span>'
            +'<span class="rt-sc-name">'+flag+'<a href="/cities/'+s.id+'" style="color:inherit;text-decoration:none;">'+c[1]+'</a> <small>&middot; '+c[2]+'</small></span>'
            +'<span class="rt-sc-dates"><b>'+fmt(s.arr)+' &ndash; '+fmt(s.dep)+'</b><br>'+s.nights+' nights</span></div>'
            +wx+'<div class="rt-sc-facts">'+facts.join('')+'</div>'+warn+'</div></div>';});
        if(!keepStops)document.getElementById('rtStopDetails').innerHTML=sd;

        // ---- packing ----
        renderPacking(t);
      }

      function bestMonths(id){var cl=CLIMATE[id];if(!cl)return null;var cs=[];for(var mo=0;mo<12;mo++){var c=comfort(id,mo);if(c!=null)cs.push({mo:mo,c:c});}if(cs.length<6)return null;
        cs.sort(function(a,b){return b.c-a.c;});return {best:cs.slice(0,3).map(function(x){return x.mo;}),worst:cs.slice(-3).map(function(x){return x.mo;})};}

      function renderSchengen(t){
        var card=document.getElementById('rtSchCard'),body=document.getElementById('rtSchBody');
        // build day array
        var days=[];t.stops.forEach(function(s){var mt=META[s.c[2]];var sch=mt?mt[1]===1:false;for(var d=s.arr;d<s.dep;d+=DAY)days.push({t:d,sch:sch,name:s.c[1]});});
        var schDays=days.filter(function(d){return d.sch;});
        if(!schDays.length){card.hidden=true;return;}
        card.hidden=false;
        // rolling 180-day max
        var maxUse=0,maxAt=null;
        for(var i=0;i<days.length;i++){if(!days[i].sch)continue;var winStart=days[i].t-179*DAY;var cnt=0;for(var j=0;j<=i;j++){if(days[j].sch&&days[j].t>=winStart)cnt++;}if(cnt>maxUse){maxUse=cnt;maxAt=days[i].t;}}
        var over=maxUse>90;var pct=Math.min(100,maxUse/90*100);
        var html='<div class="rt-stats" style="margin-bottom:.3rem;"><div class="rt-stat"><p class="k">Schengen nights</p><div class="v">'+schDays.length+'</div></div>'
          +'<div class="rt-stat"><p class="k">Peak in any 180 days</p><div class="v '+(over?'big':'')+'">'+maxUse+'<small>/90</small></div></div></div>';
        html+='<div class="rt-sch-bar"><span class="'+(over?'over':'')+'" style="width:'+pct+'%"></span></div>';
        if(over)html+='<div class="rt-warn">This route would put you at '+maxUse+' Schengen days within a 180-day window (limit 90), around '+fmtY(maxAt)+'. Trim Schengen nights or add a non-Schengen stint.</div>';
        else html+='<p class="rt-card-note" style="margin:.2rem 0 0;">Within the 90-day limit, with '+(90-maxUse)+' days to spare at the tightest point.</p>';
        body.innerHTML=html;
      }

      function renderPacking(t){
        var minLo=99,maxHi=-99,maxRain=0,plugs={};
        t.stops.forEach(function(s){var cl=CLIMATE[s.id];if(cl){if(cl.l[s.mo]!=null&&cl.l[s.mo]<minLo)minLo=cl.l[s.mo];if(cl.h[s.mo]!=null&&cl.h[s.mo]>maxHi)maxHi=cl.h[s.mo];if(cl.r[s.mo]!=null&&cl.r[s.mo]>maxRain)maxRain=cl.r[s.mo];}
          var mt=META[s.c[2]];if(mt)mt[0].split('/').forEach(function(p){plugs[p]=1;});});
        var essentials=['Passport + copies','Phone + chargers','Laptop + charger','Universal travel adapter','Basic meds + toiletries','Debit/credit cards'];
        var clothes=[];
        if(maxHi>=28){clothes.push('Lightweight breathable clothes','Sunglasses','Sunscreen (SPF 30+)','Swimwear','Sandals');}
        if(maxHi>=18&&maxHi<28)clothes.push('T-shirts + a light layer');
        if(minLo<=10)clothes.push('Warm layers / fleece','Long trousers');
        if(minLo<=3)clothes.push('Insulated jacket','Hat + gloves');
        if(minLo<=-2)clothes.push('Heavy winter coat','Thermal base layers');
        if((maxHi-minLo)>=16)clothes.push('Layering system (temps swing a lot)');
        var wet=[];if(maxRain>=120)wet.push('Packable rain jacket','Quick-dry clothing','Waterproof phone pouch');else if(maxRain>=60)wet.push('Compact umbrella');
        var plugList=Object.keys(plugs).sort();
        var tech=['Power bank','Type '+plugList.join('/')+' plug(s) needed'];
        var groups=[['Essentials',essentials],['Clothing',clothes],['Weather',wet],['Tech + power',tech]].filter(function(g){return g[1].length;});
        document.getElementById('rtPackNote').innerHTML='Built from your dates: temperatures across the trip run roughly <b>'+(minLo===99?'?':minLo)+'&deg; to '+(maxHi===-99?'?':maxHi)+'&deg;C</b>, wettest stop about <b>'+maxRain+'mm</b>/month.';
        document.getElementById('rtPack').innerHTML=groups.map(function(g){return '<div class="rt-pack-group"><h3>'+g[0]+'</h3><ul>'+g[1].map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>';}).join('');
      }

      // ---- interactions ----
      function add(id){if(!byId[id]||route.some(function(r){return r.id===id;}))return;route.push({id:id,nights:14});render();}
      list.addEventListener('click',function(e){var t=e.target;if(t.dataset.rm!=null){route.splice(+t.dataset.rm,1);render();}
        else if(t.dataset.up!=null){var i=+t.dataset.up;if(i>0){var s=route.splice(i,1)[0];route.splice(i-1,0,s);render();}}
        else if(t.dataset.down!=null){var i=+t.dataset.down;if(i<route.length-1){var s=route.splice(i,1)[0];route.splice(i+1,0,s);render();}}});
      list.addEventListener('input',function(e){var t=e.target;if(t.dataset.nights!=null){var v=parseInt(t.value,10);if(v>=1&&v<=365){route[+t.dataset.nights].nights=v;render();}}});
      // Fares live in the stop cards, which a full render rebuilds, so re-rendering here would pull
      // the focus out of the field after the first digit. Update the totals in place instead.
      document.getElementById('rtStopDetails').addEventListener('input',function(e){
        var t=e.target;if(t.dataset.fare==null)return;
        var i=+t.dataset.fare,raw=t.value.trim();
        var v=raw===''?null:parseInt(raw,10);
        route[i].fare=(v!=null&&v>=0&&v<=100000)?v:null;
        refreshTotals();syncUrl();});
      addInput.addEventListener('change',function(){var v=addInput.value.trim().toLowerCase();if(!v)return;var hit=CITIES.find(function(c){return c[1].toLowerCase()===v;})||CITIES.find(function(c){return c[1].toLowerCase().indexOf(v)===0;});if(hit){add(hit[0]);addInput.value='';}});
      startInput.addEventListener('change',render);
      document.getElementById('rtClear').addEventListener('click',function(){route=[];render();});
      document.getElementById('rtShare').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText(window.location.href);b.textContent='Copied!';b.classList.add('rt-copied');setTimeout(function(){b.textContent='Copy share link';b.classList.remove('rt-copied');},1600);}catch(e){}});
      document.getElementById('rtPrint').addEventListener('click',function(){window.print();});
      document.getElementById('rtIcs').addEventListener('click',function(){exportIcs();});

      function exportIcs(){var t=build();if(!t.stops.length)return;
        var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//The Nomad HQ//Route Planner//EN','CALSCALE:GREGORIAN'];
        t.stops.forEach(function(s,i){var ds=ymd(s.arr).replace(/-/g,''),de=ymd(s.dep).replace(/-/g,'');
          L.push('BEGIN:VEVENT');L.push('UID:nomadhq-'+s.id+'-'+ds+'@thenomadhq.com');L.push('DTSTART;VALUE=DATE:'+ds);L.push('DTEND;VALUE=DATE:'+de);
          L.push('SUMMARY:Stop '+(i+1)+': '+s.c[1]+', '+s.c[2]);L.push('DESCRIPTION:'+s.nights+' nights. Est. '+money(adjCost(s.id,s.mo))+'/mo. Planned with The Nomad HQ.');L.push('END:VEVENT');});
        L.push('END:VCALENDAR');
        var blob=new Blob([L.join('\\r\\n')],{type:'text/calendar'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nomad-route.ics';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},100);}

      // ---- init from URL ----
      (function init(){
        var sp=new URLSearchParams(window.location.search);
        var startP=sp.get('start');if(startP&&/^\\d{4}-\\d{2}-\\d{2}$/.test(startP))startInput.value=startP;else{var d=new Date(parseStart());startInput.value=ymd(parseStart());}
        var p=sp.get('route');
        // "id:nights" gained an optional third part, "id:nights:fare", for the flight INTO that stop.
        // Older share links have two parts and still parse, so every link anyone has already sent
        // keeps working and simply carries no fares.
        if(p){p.split(',').forEach(function(tok){var parts=tok.split(':');var id=parts[0];var n=parseInt(parts[1],10);var f=parseInt(parts[2],10);
          if(byId[id]&&!route.some(function(r){return r.id===id;}))route.push({id:id,nights:(n>=1&&n<=365)?n:14,fare:(f>=0&&f<=100000)?f:null});});}
        if(!route.length)route=DEFAULT_ROUTE.map(function(id){return {id:id,nights:14};});
        render();
      })();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'route.html'), html);
console.log(`Wrote route.html (${DATA.length} cities, ${Object.keys(CLIMATE).length} with climate; default: ${DEFAULT_ROUTE.join(' -> ')}).`);
