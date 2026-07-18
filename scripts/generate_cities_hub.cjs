/**
 * Generates cities.html  ->  served at /cities  (a crawlable, on-brand directory
 * of every city guide). Googlebot discovers the city pages by following the real
 * <a href> links here, not only via the sitemap. Re-run when the city set changes.
 * Uses the site's real nav (with mobile menu) + footer + brand color tokens.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://thenomadhq.com';

function loadCities() {
  try {
    const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
    const fn = new Function('module', 'exports', code + '\n;module.exports = CITIES;');
    const m = { exports: {} };
    fn(m, m.exports);
    return Array.isArray(m.exports) ? m.exports : [];
  } catch (e) {
    console.warn('Could not eval cities-data.js:', e.message);
    return [];
  }
}

const titleCase = (slug) => slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// flag emoji -> self-hosted SVG <img> (emoji fall back to letters like "BE" on Windows)
const flagImg = (emoji) => {
  const pts = [...(emoji || '')];
  if (pts.length !== 2) return '';
  const code = pts.map((p) => String.fromCharCode(p.codePointAt(0) - 0x1f1e6 + 97)).join('');
  return `<img class="flag-img" src="/assets/flags/${code}.svg" alt="" loading="lazy">`;
};

const fileSlugs = fs.readdirSync(path.join(ROOT, 'cities')).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
const meta = new Map(loadCities().map((c) => [c.id, c]));

const CITY_REGIONS = require('../city-regions.js');
const SCORE_KEYS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
const avgScore = (c) => {
  const s = c.scores || {}; let t = 0, n = 0;
  for (const k of SCORE_KEYS) { if (typeof s[k] === 'number') { t += s[k]; n++; } }
  return n ? t / n : null;
};
// The raw 13-category average compresses to ~5.0-7.6. Rescale (z-score to mean 6.9,
// sd 1.05, clamped 2.5-9.9) so top/bottom cities stand out. Monotonic -> rankings unchanged.
const nomadScore = (raw) => (raw == null ? null : Math.max(2.5, Math.min(9.9, 6.9 + (raw - 6.47) / 0.44 * 1.05)));

const cities = fileSlugs
  .map((slug) => {
    const c = meta.get(slug) || {};
    return {
      slug, name: c.name || titleCase(slug), country: c.country || '', flag: c.flag || '',
      cost: c.costPerMonth || null, region: CITY_REGIONS[slug] || '', climate: c.climateType || '',
      score: nomadScore(avgScore(c)), image: c.image || '', scores: c.scores || {},
      tz: (typeof c.timezone === 'number' ? c.timezone : null),
    };
  })
  // default view: highest-rated first (reinforces the "rated & ranked" positioning)
  .sort((a, b) => (b.score || 0) - (a.score || 0) || a.name.localeCompare(b.name));

const REGION_LABELS = { europe: 'Europe', asia: 'Asia', latam: 'Latin America', northamerica: 'North America & the Caribbean', africa: 'Africa', middleeast: 'Middle East', oceania: 'Oceania' };
const regionOptions = [...new Set(cities.map((c) => c.region).filter(Boolean))].sort()
  .map((r) => `<option value="${r}">${REGION_LABELS[r] || r}</option>`).join('\n          ');
const climateOptions = [...new Set(cities.map((c) => c.climate).filter(Boolean))].sort()
  .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('\n          ');

// --- full filter controls (ported from the old homepage explorer) ---
const SORT_OPTIONS = [['score', 'Nomad Score'], ['cost', 'Cost (Cheapest)'], ['safety', 'Safety'], ['wifi', 'WiFi'], ['community', 'Community'], ['climate', 'Climate'], ['nightlife', 'Nightlife'], ['nature', 'Nature'], ['food', 'Food'], ['english', 'English'], ['visa', 'Visa']];
const sortOptions = SORT_OPTIONS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('\n                ');

const SLIDER_CATS = [['climate', 'Climate'], ['cost', 'Cost'], ['wifi', 'WiFi'], ['nightlife', 'Nightlife'], ['nature', 'Nature'], ['safety', 'Safety'], ['food', 'Food'], ['community', 'Community'], ['english', 'English'], ['visa', 'Visa']];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slidersMarkup = SLIDER_CATS.map(([cat, label]) => {
  const C = cap(cat);
  return `              <div class="slider-group" data-category="${cat}">
                <div class="slider-header">
                  <label class="slider-label">${label}</label>
                  <span class="slider-value" id="${cat}Value">1 - 10</span>
                </div>
                <div class="dual-range">
                  <input type="range" class="filter-slider filter-slider-min" id="filter${C}Min" min="1" max="10" value="1" aria-label="${label} minimum score">
                  <input type="range" class="filter-slider filter-slider-max" id="filter${C}Max" min="1" max="10" value="10" aria-label="${label} maximum score">
                  <div class="slider-track"></div>
                  <div class="slider-range" id="${cat}Range"></div>
                </div>
              </div>`;
}).join('\n');

// data for the dependent Country/City dropdowns (built from the same city set)
const _seenCountry = new Map();
for (const c of cities) { const lc = (c.country || '').toLowerCase(); if (lc && !_seenCountry.has(lc)) _seenCountry.set(lc, { v: lc, t: c.country, r: c.region }); }
const COUNTRY_DATA = [..._seenCountry.values()].sort((a, b) => a.t.localeCompare(b.t));
const CITY_DATA = cities.map((c) => ({ v: c.slug, t: c.name, c: (c.country || '').toLowerCase() })).sort((a, b) => a.t.localeCompare(b.t));

// ratings legend (13 categories)
const LEGEND = [
  ['Climate', 'Temperature, humidity, rain days, and seasonal extremes. Optimized for remote work comfort (15-28&deg;C ideal).'],
  ['Cost', 'Monthly living expenses including rent, food, transport, and entertainment. Based on cost-of-living indices.'],
  ['WiFi', 'Average internet speed and reliability. Based on global speed indices and coworking infrastructure.'],
  ['Nightlife', 'Bars, clubs, live music, and social scene vibrancy. Based on venue density and reputation.'],
  ['Nature', 'Access to parks, beaches, mountains, and outdoor activities. Based on proximity and diversity of nature.'],
  ['Safety', 'Personal safety and crime rates. Based on crime indices and government travel advisories.'],
  ['Food', 'Culinary scene quality and diversity. Based on cuisine reputation, recognition, and street food culture.'],
  ['Community', 'Digital nomad presence and networking. Based on coworking spaces, meetups, and expat communities.'],
  ['English', 'English proficiency among locals. Based on proficiency indices and tourism infrastructure.'],
  ['Visa', 'Ease of obtaining a visa or staying long-term. Considers nomad visas, visa-free stays, and extensions.'],
  ['Culture', 'Museums, galleries, historical sites, and cultural events. Based on heritage sites and cultural vibrancy.'],
  ['Cleanliness', 'Street cleanliness, waste management, and overall city hygiene standards.'],
  ['Air Quality', 'Air pollution levels and AQI. Based on global air-quality reports and health standards.'],
];
const legendItems = LEGEND.map(([t, d], i) => `<div class="legend-item"><div class="legend-item-icon">${i + 1}</div><div class="legend-item-content"><div class="legend-item-title">${t}</div><div class="legend-item-desc">${d}</div></div></div>`).join('\n              ');

// beautiful image cards (same component as the homepage), rendered statically for all
// 410 cities so they stay crawlable; the toolbar below filters/sorts them client-side.
const CAT_LABELS = [['climate', 'Climate'], ['cost', 'Cost'], ['wifi', 'WiFi'], ['nightlife', 'Nightlife'], ['nature', 'Nature'], ['safety', 'Safety'], ['food', 'Food'], ['community', 'Community'], ['english', 'English'], ['visa', 'Visa'], ['culture', 'Culture'], ['cleanliness', 'Clean'], ['airquality', 'Air']];
const barCls = (v) => (v >= 8 ? 'excellent' : v >= 6 ? 'good' : v >= 4 ? 'average' : 'below');
const badgeCls = (v) => (v == null ? 'below' : v >= 8 ? 'excellent' : v >= 6.5 ? 'good' : v >= 5 ? 'average' : 'below');
const cards = cities.map((c) => {
  // Hover stats overlay is built lazily client-side from data-scores (keeps the
  // static DOM ~20k nodes lighter across 410 cards). See buildOverlay() below.
  const cost = c.cost != null ? `$${c.cost.toLocaleString('en-US')}` : 'N/A';
  const scoresCsv = SCORE_KEYS.map((k) => (typeof c.scores[k] === 'number' ? c.scores[k] : '')).join(',');
  return `      <article class="city-card fade-in"` +
    ` data-name="${escapeHtml((c.name || '').toLowerCase())}"` +
    ` data-country="${escapeHtml((c.country || '').toLowerCase())}"` +
    ` data-slug="${c.slug}"` +
    ` data-region="${c.region}"` +
    ` data-climate="${escapeHtml(c.climate)}"` +
    ` data-cost="${c.cost != null ? c.cost : ''}"` +
    ` data-score="${c.score != null ? c.score.toFixed(2) : ''}"` +
    ` data-scores="${scoresCsv}"` +
    ` data-tz="${c.tz != null ? c.tz : ''}">
        <div class="city-card-image-container">
          <img src="${c.image}" alt="${escapeHtml(c.name)}, ${escapeHtml(c.country)}" class="city-card-image" width="800" height="500" loading="lazy" decoding="async">
          <div class="city-card-overlay"></div>
        </div>
        <div class="city-card-body">
          <div class="city-card-header">
            <div class="city-card-location"><span class="city-card-flag">${flagImg(c.flag)}</span><div><h2 class="city-card-name">${escapeHtml(c.name)}</h2><span class="city-card-country">${escapeHtml(c.country)}</span></div></div>
            <div class="nomad-score ${badgeCls(c.score)}"><span class="nomad-score-value">${c.score != null ? c.score.toFixed(1) : 'N/A'}</span><span class="nomad-score-label">Score</span></div>
          </div>
          <div class="city-card-info">
            <div class="city-card-climate-type">${escapeHtml(c.climate || 'N/A')}</div>
            <div class="city-card-cost"><span class="cost-label">~${cost}</span><span class="cost-period">/month</span></div>
          </div>
          <a href="/cities/${c.slug}" class="btn btn-primary city-card-action">View City &rarr;</a>
        </div>
      </article>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>All Digital Nomad City Guides (${cities.length}) | The Nomad HQ</title>
  <meta name="description" content="Browse all ${cities.length} digital nomad city guides: cost of living, WiFi speeds, coworking, safety and visa info for the best remote-work destinations worldwide.">
  <link rel="canonical" href="${SITE}/cities">
  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <meta property="og:title" content="All Digital Nomad City Guides | The Nomad HQ">
  <meta property="og:description" content="Browse all ${cities.length} digital nomad city guides with cost of living, WiFi, coworking, safety and visa info.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/cities">
  <meta property="og:image" content="${SITE}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="All Digital Nomad City Guides | The Nomad HQ">
  <meta name="twitter:image" content="${SITE}/assets/og-image.png">

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap" as="style">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">

  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/nav.css">
  <link rel="stylesheet" href="styles/footer.css">
  <link rel="stylesheet" href="styles/city-cards.css">
  <link rel="stylesheet" href="styles/city-filters.css">

  <style>
    /* Hero, same magazine style as the blog hero: full-bleed photo, bottom-anchored dark gradient, serif H1 */
    .cities-hero { position: relative; width: 100%; min-height: 100vh; display: flex; align-items: flex-end; overflow: hidden; }
    .cities-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: linear-gradient(135deg, var(--color-sand) 0%, var(--color-sand-dark) 100%); }
    .cities-hero-overlay { position: relative; z-index: 1; width: 100%; padding: calc(var(--nav-height, 64px) + 2rem) 0 3.5rem; background: linear-gradient(to top, rgba(15,23,42,.95) 0%, rgba(15,23,42,.75) 50%, rgba(15,23,42,.2) 80%, transparent 100%); color: #fff; }
    /* light gradient at the very top so the transparent nav stays readable over the photo */
    .cities-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: calc(var(--nav-height, 64px) + 44px); z-index: 1; pointer-events: none; background: linear-gradient(to bottom, rgba(255,255,255,.82) 0%, rgba(255,255,255,.45) 55%, transparent 100%); }
    .cities-hero-label { display: inline-block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.65); margin-bottom: .75rem; }
    .cities-hero .category-tag { display: inline-block; margin-left: .6rem; padding: .25rem .7rem; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; background: var(--color-terracotta); color: #fff; border-radius: var(--radius-sm, 6px); }
    .cities-hero h1 { font-family: 'DM Serif Display', serif; color: #fff; font-size: clamp(2.2rem, 6vw, 3.75rem); line-height: 1.1; margin: 0 0 1.1rem; max-width: 820px; text-shadow: 0 2px 24px rgba(0,0,0,.35); }
    .cities-hero .excerpt { font-size: var(--text-lg); color: rgba(255,255,255,.88); line-height: 1.7; margin: 0 0 1.6rem; max-width: 680px; text-shadow: 0 1px 12px rgba(0,0,0,.3); }
    .cities-hero .hero-ctas { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
    .cities-hero .btn-ghost { color: #fff; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.06); }
    .cities-hero .btn-ghost:hover { background: rgba(255,255,255,.16); border-color: #fff; }
    /* animated scroll cue (same as blog hero) */ 50% { transform: translateX(-50%) translateY(8px); } } 50% { transform: translateY(4px); opacity: 1; } }

    /* card grid + card component live in styles/city-cards.css (shared with the homepage) */
    .city-card-flag .flag-img { width: 1.5rem; box-shadow: 0 0 0 .5px rgba(0,0,0,.12); }

    /* full filter bar + sliders + legend live in styles/city-filters.css */
  </style>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Digital Nomad City Guides",
    "description": "Browse all ${cities.length} digital nomad city guides with cost of living, WiFi, coworking, safety and visa info.",
    "url": "${SITE}/cities",
    "isPartOf": { "@type": "WebSite", "url": "${SITE}/" }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
      { "@type": "ListItem", "position": 2, "name": "Cities", "item": "${SITE}/cities" }
    ]
  }
  </script>
</head>
<body>

  <nav class="nav" id="mainNav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/assets/logo.svg" alt="" class="nav-logo-icon">
        <span class="nav-logo-nomad">The Nomad</span><span class="nav-logo-accent">HQ</span>
      </a>
      <ul class="nav-links">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/wheel" class="nav-link">Wheel</a></li>
        <li><a href="/cities" class="nav-link active">Cities</a></li>
        <li><a href="/best" class="nav-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-link">Tier List</a></li>
        <li><a href="/compare" class="nav-link">Compare</a></li>
        <li><a href="/blog" class="nav-link">Blog</a></li>
      </ul>
      <div class="nav-actions">
        <a href="/login" class="nav-login">Login</a>
        <a href="/signup" class="btn btn-primary nav-signup">Sign Up</a>
      </div>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
        <span class="nav-toggle-line"></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">
      <ul class="nav-mobile-links">
        <li><a href="/" class="nav-mobile-link">Home</a></li>
        <li><a href="/wheel" class="nav-mobile-link">Wheel</a></li>
        <li><a href="/cities" class="nav-mobile-link active">Cities</a></li>
        <li><a href="/best" class="nav-mobile-link">Rankings</a></li>
        <li><a href="/tier-list" class="nav-mobile-link">Tier List</a></li>
        <li><a href="/compare" class="nav-mobile-link">Compare</a></li>
        <li><a href="/blog" class="nav-mobile-link">Blog</a></li>
      </ul>
      <div class="nav-mobile-actions">
        <a href="/login" class="btn btn-secondary">Login</a>
        <a href="/signup" class="btn btn-primary">Sign Up</a>
      </div>
    </div>
  </nav>

  <script>
    (function() {
      const nav = document.getElementById('mainNav');
      const navToggle = document.getElementById('navToggle');
      const navMobile = document.getElementById('navMobile');
      const body = document.body;
      navToggle.addEventListener('click', function() {
        const isOpen = navToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        body.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
      });
      navMobile.querySelectorAll('.nav-mobile-link, .nav-mobile-actions .btn').forEach(function(link) {
        link.addEventListener('click', function() {
          navToggle.classList.remove('active');
          navMobile.classList.remove('active');
          body.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
      window.addEventListener('scroll', function() { nav.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
    })();
  </script>

  <main>
    <header class="cities-hero">
      <img class="cities-hero-img" src="/assets/cities-hero.webp" alt="A world city skyline at dusk" fetchpriority="high">
      <div class="cities-hero-overlay">
        <div class="container">
          <span class="cities-hero-label">The Digital Nomad City Index</span>
          <span class="category-tag">${cities.length} cities rated</span>
          <h1>Find the Best City to Live and Work Remotely</h1>
          <p class="excerpt">We rate and rank every destination on the 13 things that actually matter to digital nomads, like cost of living, WiFi, safety, climate, visas and more, so you can compare cities side by side and find where you&rsquo;ll thrive.</p>
          <div class="hero-ctas">
            <a href="/wheel" class="btn btn-primary btn-lg">Find your match on the Wheel &rarr;</a>
            <a href="#directory" class="btn btn-lg btn-ghost">Browse all cities</a>
          </div>
        </div>
      </div>
    </header>

    <div class="city-browse" id="directory">
      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label" for="citySearch">Search</label>
            <input type="search" class="filter-input" id="citySearch" placeholder="City or country&hellip;" aria-label="Search cities">
          </div>
          <div class="filter-group">
            <label class="filter-label" for="filterRegion">Region</label>
            <select class="filter-select" id="filterRegion"><option value="all">All Regions</option>${regionOptions}</select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="filterCountry">Country</label>
            <select class="filter-select" id="filterCountry"><option value="all">All Countries</option></select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="filterCity">City</label>
            <select class="filter-select" id="filterCity"><option value="all">All Cities</option></select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="filterClimateType">Climate</label>
            <select class="filter-select" id="filterClimateType"><option value="all">All Climates</option>${climateOptions}</select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="filterSort">Sort By</label>
            <select class="filter-select" id="filterSort">${sortOptions}</select>
          </div>
          <button type="button" class="advanced-filters-btn" id="advancedFiltersBtn" aria-expanded="false" aria-controls="slidersPanel">
            <svg class="filter-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Advanced Filters
            <span class="filter-badge" id="filterBadge"></span>
            <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <div class="sliders-panel" id="slidersPanel">
          <div class="sliders-grid">
${slidersMarkup}
            <div class="slider-group slider-group-timezone" id="timezoneFilterGroup" data-category="timezone">
              <div class="slider-header">
                <label class="slider-label">Time Difference</label>
                <span class="slider-value" id="timezoneValue">-12 to +12 hrs</span>
              </div>
              <div class="timezone-filter-content" id="timezoneFilterContent">
                <div class="dual-range">
                  <input type="range" class="filter-slider filter-slider-min" id="filterTimezoneMin" min="-12" max="12" value="-12" step="1" aria-label="Minimum time difference (hours)">
                  <input type="range" class="filter-slider filter-slider-max" id="filterTimezoneMax" min="-12" max="12" value="12" step="1" aria-label="Maximum time difference (hours)">
                  <div class="slider-track"></div>
                  <div class="slider-range" id="timezoneRange"></div>
                </div>
              </div>
              <div class="timezone-filter-locked" id="timezoneFilterLocked">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <a href="/signup">Sign up</a> to filter by time difference
              </div>
            </div>
          </div>
          <button type="button" class="reset-filters-btn" id="resetFiltersBtn">Reset All Filters</button>
        </div>
      </div>

      <div class="ratings-legend">
        <button type="button" class="legend-toggle" id="legendToggle" aria-expanded="false" aria-controls="legendContent">
          <span class="legend-toggle-text">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            How are ratings compiled?
          </span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="legend-content" id="legendContent">
          <p class="legend-intro">Each city is rated on 13 categories using official data, global indices, and expert assessments. The <strong>Nomad Score</strong> is a calibrated composite of all 13 category scores (1-10 scale).</p>
          <div class="legend-grid">
              ${legendItems}
          </div>
          <div class="legend-score-scale">
            <div class="legend-scale-title">Score Scale</div>
            <div class="legend-scale-items">
              <div class="legend-scale-item"><span class="legend-scale-dot excellent"></span><span>8-10: Excellent</span></div>
              <div class="legend-scale-item"><span class="legend-scale-dot good"></span><span>6-7: Good</span></div>
              <div class="legend-scale-item"><span class="legend-scale-dot average"></span><span>4-5: Average</span></div>
              <div class="legend-scale-item"><span class="legend-scale-dot below"></span><span>1-3: Below Average</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="results-info"><p class="results-count">Showing <strong id="cityCount">${cities.length}</strong> cities</p></div>
    </div>

    <div class="city-card-grid" id="cityGrid">
${cards}
    </div>
    <p class="city-dir-empty" id="cityEmpty" hidden>No cities match those filters. <button type="button" class="linklike" id="cityReset">Reset all filters</button></p>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-column footer-about">
          <a href="/" class="footer-logo"><img src="/assets/logo.svg" alt="" class="footer-logo-icon"><span class="footer-logo-nomad">The Nomad</span><span class="footer-logo-accent">HQ</span></a>
          <p class="footer-description">Your trusted guide for finding the perfect city to work and live remotely.</p>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Explore</h4>
          <ul class="footer-links">
            <li><a href="/cities" class="footer-link">All Cities</a></li><li><a href="/map" class="footer-link">World Map</a></li>
            <li><a href="/wheel" class="footer-link">Decision Wheel</a></li>
            <li><a href="/activities" class="footer-link">By Activity</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4 class="footer-heading">Resources</h4>
          <ul class="footer-links">
            <li><a href="/blog" class="footer-link">Blog</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <nav class="footer-legal" aria-label="Legal and company">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/disclosure">Affiliate Disclosure</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/legal-notice">Legal Notice</a>
        </nav>
        <p class="footer-disclosure">Some links on this site are affiliate links; we may earn a commission at no extra cost to you.</p>
        <p class="footer-copyright">&copy; 2026 The Nomad HQ. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    // Full browse-and-compare filter/sort over the static (crawlable) city grid.
    (function () {
      'use strict';
      var grid = document.getElementById('cityGrid');
      if (!grid) return;
      var COUNTRY_DATA = ${JSON.stringify(COUNTRY_DATA)};
      var CITY_DATA = ${JSON.stringify(CITY_DATA)};
      var SK = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa', 'culture', 'cleanliness', 'airquality'];
      var SLIDER_CATS = ['climate', 'cost', 'wifi', 'nightlife', 'nature', 'safety', 'food', 'community', 'english', 'visa'];
      var $ = function (id) { return document.getElementById(id); };
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.city-card'));
      cards.forEach(function (card) {
        var d = card.dataset;
        card._scores = (d.scores || '').split(',').map(function (x) { return x === '' ? null : parseFloat(x); });
        card._tz = (d.tz === '' || d.tz == null) ? null : parseFloat(d.tz);
        card._cost = d.cost === '' ? null : parseFloat(d.cost);
        card._score = d.score === '' ? null : parseFloat(d.score);
      });
      // Build the hover stats overlay lazily (first hover) to keep the initial DOM light.
      var OV_LABELS = ['Climate', 'Cost', 'WiFi', 'Nightlife', 'Nature', 'Safety', 'Food', 'Community', 'English', 'Visa', 'Culture', 'Clean', 'Air'];
      function ovCls(v) { return v >= 8 ? 'excellent' : v >= 6 ? 'good' : v >= 4 ? 'average' : 'below'; }
      function buildOverlay(card) {
        if (card._ov) return; card._ov = true;
        var box = card.querySelector('.city-card-overlay'); if (!box) return;
        var h = '<div class="overlay-stats">';
        for (var i = 0; i < OV_LABELS.length; i++) {
          var v = card._scores[i] == null ? 0 : card._scores[i];
          h += '<div class="overlay-stat"><div class="overlay-stat-header"><span class="overlay-stat-label">' + OV_LABELS[i] + '</span><span class="overlay-stat-value">' + v + '</span></div><div class="overlay-stat-bar"><div class="overlay-stat-fill ' + ovCls(v) + '" style="width:' + (v * 10) + '%"></div></div></div>';
        }
        box.innerHTML = h + '</div>';
      }
      cards.forEach(function (card) { card.addEventListener('mouseenter', function () { buildOverlay(card); }); });
      var search = $('citySearch'), region = $('filterRegion'), country = $('filterCountry'), city = $('filterCity'),
          climate = $('filterClimateType'), sortSel = $('filterSort'), count = $('cityCount'), empty = $('cityEmpty'),
          advBtn = $('advancedFiltersBtn'), panel = $('slidersPanel'), badge = $('filterBadge'),
          resetBtn = $('resetFiltersBtn'), cityReset = $('cityReset'),
          legendToggle = $('legendToggle'), legendContent = $('legendContent');

      var sliders = {};
      SLIDER_CATS.forEach(function (cat) {
        var C = cat.charAt(0).toUpperCase() + cat.slice(1);
        sliders[cat] = { idx: SK.indexOf(cat), min: $('filter' + C + 'Min'), max: $('filter' + C + 'Max'), value: $(cat + 'Value'), range: $(cat + 'Range') };
      });
      var tz = { min: $('filterTimezoneMin'), max: $('filterTimezoneMax'), value: $('timezoneValue'), range: $('timezoneRange'), content: $('timezoneFilterContent'), locked: $('timezoneFilterLocked') };
      var userTimezone = null;

      function updateTzRange() {
        var mn = parseInt(tz.min.value, 10), mx = parseInt(tz.max.value, 10);
        var f = function (h) { return (h >= 0 ? '+' + h : h) + ' hr' + (Math.abs(h) !== 1 ? 's' : ''); };
        tz.value.textContent = f(mn) + ' to ' + f(mx);
        var a = ((mn + 12) / 24) * 100, b = ((mx + 12) / 24) * 100;
        tz.range.style.left = a + '%'; tz.range.style.width = (b - a) + '%';
      }
      function initUserTimezone() {
        try {
          var auth = JSON.parse(localStorage.getItem('nomadcompass_auth'));
          if (auth && auth.loggedIn && auth.timezone !== undefined && auth.timezone !== null) {
            userTimezone = auth.timezone;
            tz.content.classList.add('active');
            tz.locked.classList.add('hidden');
            updateTzRange();
          }
        } catch (e) {}
      }
      function updateSliderRange(el) {
        var mn = parseInt(el.min.value, 10), mx = parseInt(el.max.value, 10);
        el.value.textContent = mn + ' - ' + mx;
        var a = ((mn - 1) / 9) * 100, b = ((mx - 1) / 9) * 100;
        el.range.style.left = a + '%'; el.range.style.width = (b - a) + '%';
      }
      function activeCount() {
        var n = 0;
        SLIDER_CATS.forEach(function (c) { if (parseInt(sliders[c].min.value, 10) > 1 || parseInt(sliders[c].max.value, 10) < 10) n++; });
        if (userTimezone !== null && (parseInt(tz.min.value, 10) > -12 || parseInt(tz.max.value, 10) < 12)) n++;
        return n;
      }
      function updateBadge() { var n = activeCount(); if (n > 0) { badge.textContent = n; badge.classList.add('visible'); } else { badge.classList.remove('visible'); } }

      function fill(sel, items, allLabel) {
        var v = sel.value, html = '<option value="all">' + allLabel + '</option>';
        items.forEach(function (o) { html += '<option value="' + o.v + '">' + o.t + '</option>'; });
        sel.innerHTML = html;
        for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === v) { sel.value = v; break; } }
      }
      function regionCountries(r) { return COUNTRY_DATA.filter(function (o) { return r === 'all' || o.r === r; }); }
      function populateCountry() { fill(country, regionCountries(region.value), 'All Countries'); }
      function populateCity() {
        var r = region.value, ct = country.value, items;
        if (ct !== 'all') { items = CITY_DATA.filter(function (o) { return o.c === ct; }); }
        else if (r !== 'all') { var cc = regionCountries(r).map(function (x) { return x.v; }); items = CITY_DATA.filter(function (o) { return cc.indexOf(o.c) >= 0; }); }
        else { items = CITY_DATA; }
        fill(city, items, 'All Cities');
      }

      function apply() {
        var q = (search.value || '').trim().toLowerCase(), r = region.value, ct = country.value, ci = city.value, cl = climate.value, shown = 0;
        var mins = {}, maxs = {};
        SLIDER_CATS.forEach(function (c) { mins[c] = parseInt(sliders[c].min.value, 10); maxs[c] = parseInt(sliders[c].max.value, 10); });
        var tzMin = parseInt(tz.min.value, 10), tzMax = parseInt(tz.max.value, 10), tzActive = userTimezone !== null && (tzMin > -12 || tzMax < 12);
        cards.forEach(function (card) {
          var d = card.dataset, ok = true;
          if (q && d.name.indexOf(q) < 0 && d.country.indexOf(q) < 0) ok = false;
          if (ok && r !== 'all' && d.region !== r) ok = false;
          if (ok && ct !== 'all' && d.country !== ct) ok = false;
          if (ok && ci !== 'all' && d.slug !== ci) ok = false;
          if (ok && cl !== 'all' && d.climate !== cl) ok = false;
          if (ok) {
            for (var i = 0; i < SLIDER_CATS.length; i++) {
              var cat = SLIDER_CATS[i], mn = mins[cat], mx = maxs[cat];
              if (mn > 1 || mx < 10) { var sv = card._scores[sliders[cat].idx]; if (sv == null || sv < mn || sv > mx) { ok = false; break; } }
            }
          }
          if (ok && tzActive) { if (card._tz == null) { ok = false; } else { var diff = card._tz - userTimezone; if (diff < tzMin || diff > tzMax) ok = false; } }
          card.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        var s = sortSel.value;
        var vis = cards.filter(function (c) { return c.style.display !== 'none'; });
        vis.sort(function (a, b) {
          if (s === 'score') { var xa = a._score, xb = b._score; return (xb == null ? -1 : xb) - (xa == null ? -1 : xa) || a.dataset.name.localeCompare(b.dataset.name); }
          if (s === 'cost') { var ca = a._cost, cb = b._cost; if (ca == null && cb == null) return a.dataset.name.localeCompare(b.dataset.name); if (ca == null) return 1; if (cb == null) return -1; return ca - cb; }
          var ix = SK.indexOf(s), va = a._scores[ix], vb = b._scores[ix];
          return (vb == null ? -1 : vb) - (va == null ? -1 : va) || a.dataset.name.localeCompare(b.dataset.name);
        });
        vis.forEach(function (c) { grid.appendChild(c); });
        count.textContent = shown;
        empty.hidden = shown > 0;
      }

      region.addEventListener('change', function () { populateCountry(); populateCity(); apply(); });
      country.addEventListener('change', function () { populateCity(); apply(); });
      city.addEventListener('change', apply);
      climate.addEventListener('change', apply);
      sortSel.addEventListener('change', apply);
      var _searchT; search.addEventListener('input', function () { clearTimeout(_searchT); _searchT = setTimeout(apply, 160); });
      SLIDER_CATS.forEach(function (cat) {
        var el = sliders[cat];
        el.min.addEventListener('input', function () { var mn = parseInt(el.min.value, 10), mx = parseInt(el.max.value, 10); if (mn > mx) el.min.value = mx; updateSliderRange(el); updateBadge(); apply(); });
        el.max.addEventListener('input', function () { var mn = parseInt(el.min.value, 10), mx = parseInt(el.max.value, 10); if (mx < mn) el.max.value = mn; updateSliderRange(el); updateBadge(); apply(); });
      });
      tz.min.addEventListener('input', function () { var mn = parseInt(tz.min.value, 10), mx = parseInt(tz.max.value, 10); if (mn > mx) tz.min.value = mx; updateTzRange(); updateBadge(); apply(); });
      tz.max.addEventListener('input', function () { var mn = parseInt(tz.min.value, 10), mx = parseInt(tz.max.value, 10); if (mx < mn) tz.max.value = mn; updateTzRange(); updateBadge(); apply(); });
      advBtn.addEventListener('click', function () { var open = panel.classList.toggle('open'); advBtn.classList.toggle('active'); advBtn.setAttribute('aria-expanded', open); });
      if (legendToggle) legendToggle.addEventListener('click', function () { var open = legendContent.classList.toggle('open'); legendToggle.classList.toggle('active'); legendToggle.setAttribute('aria-expanded', open); });
      function resetAll() {
        search.value = ''; region.value = 'all'; climate.value = 'all'; sortSel.value = 'score';
        populateCountry(); populateCity();
        SLIDER_CATS.forEach(function (cat) { sliders[cat].min.value = 1; sliders[cat].max.value = 10; updateSliderRange(sliders[cat]); });
        if (userTimezone !== null) { tz.min.value = -12; tz.max.value = 12; updateTzRange(); }
        updateBadge(); apply();
      }
      if (resetBtn) resetBtn.addEventListener('click', resetAll);
      if (cityReset) cityReset.addEventListener('click', resetAll);

      initUserTimezone();
      SLIDER_CATS.forEach(function (cat) { updateSliderRange(sliders[cat]); });
      populateCountry(); populateCity();
      // Deep-link support: /cities?q=lisbon prefills the search box and filters on load.
      // This makes the URL a real search endpoint (used by the site nav search + the
      // WebSite SearchAction / sitelinks searchbox in structured data).
      try {
        var _q = new URLSearchParams(window.location.search).get('q');
        if (_q) { search.value = _q; }
      } catch (e) {}
      apply();
    })();
  </script>

</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'cities.html'), html);
console.log(`Wrote cities.html with ${cities.length} city links (filterable/sortable grid).`);
