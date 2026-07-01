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

const cities = fileSlugs
  .map((slug) => {
    const c = meta.get(slug) || {};
    return { slug, name: c.name || titleCase(slug), country: c.country || '', flag: c.flag || '', cost: c.costPerMonth || null };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const groups = {};
for (const c of cities) {
  const letter = (c.name[0] || '#').toUpperCase();
  (groups[letter] = groups[letter] || []).push(c);
}
const letters = Object.keys(groups).sort();

const azNav = letters.map((l) => `<a href="#letter-${l}" class="az-link">${l}</a>`).join('\n        ');

const sections = letters
  .map((l) => {
    const items = groups[l]
      .map((c) =>
        `          <li><a href="/cities/${c.slug}" class="city-dir-link">` +
        `${flagImg(c.flag)}` +
        `<span class="city-dir-text"><span class="city-dir-name">${escapeHtml(c.name)}</span>` +
        `${c.country ? `<span class="city-dir-country">${escapeHtml(c.country)}</span>` : ''}</span>` +
        `${c.cost ? `<span class="city-dir-cost">$${c.cost.toLocaleString('en-US')}/mo</span>` : ''}` +
        `</a></li>`
      )
      .join('\n');
    return `      <section class="city-dir-group" id="letter-${l}">
        <h2 class="city-dir-letter">${l}</h2>
        <ul class="city-dir-list">
${items}
        </ul>
      </section>`;
  })
  .join('\n');

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

  <style>
    /* Hero — same magazine style as the blog hero: full-bleed photo, bottom-anchored dark gradient, serif H1 */
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
    /* animated scroll cue (same as blog hero) */
    .hero-scroll-indicator { position: absolute; bottom: var(--space-8, 2rem); left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: var(--space-2, .5rem); color: rgba(255,255,255,.65); font-size: var(--text-sm, .85rem); text-decoration: none; z-index: 2; animation: heroScrollBounce 2s ease infinite; }
    .hero-scroll-indicator-icon { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,.5); border-radius: 999px; display: flex; align-items: center; justify-content: center; }
    .hero-scroll-indicator-icon::after { content: ''; width: 4px; height: 4px; background-color: rgba(255,255,255,.7); border-radius: 999px; animation: heroScrollDot 2s ease infinite; }
    @keyframes heroScrollBounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
    @keyframes heroScrollDot { 0%,100% { transform: translateY(-4px); opacity: 0; } 50% { transform: translateY(4px); opacity: 1; } }

    .az-bar {
      position: sticky; top: var(--nav-height, 64px); z-index: 50;
      scroll-margin-top: var(--nav-height, 64px);
      display: flex; flex-wrap: wrap; gap: .2rem; justify-content: center;
      padding: .55rem 1rem;
      background: rgba(255,255,255,.9); backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--color-sand-dark);
    }
    .az-link { display: inline-block; min-width: 1.7rem; text-align: center; padding: .25rem .45rem; border-radius: 6px; font-weight: 600; font-size: .9rem; text-decoration: none; color: var(--color-charcoal); }
    .az-link:hover { background: var(--color-sand); color: var(--color-terracotta); }

    .city-dir-wrap { max-width: 1120px; margin: 0 auto; padding: 2.25rem 1.25rem 4rem; }
    .city-dir-group { scroll-margin-top: calc(var(--nav-height, 64px) + 56px); margin-top: 2.5rem; }
    .city-dir-group:first-child { margin-top: .5rem; }
    .city-dir-letter { font-family: 'DM Serif Display', serif; color: var(--color-ink); font-size: 1.5rem; margin: 0 0 1rem; padding-bottom: .35rem; border-bottom: 2px solid var(--color-sand-dark); }
    .city-dir-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: .6rem; }
    .city-dir-link {
      display: flex; align-items: center; gap: .65rem;
      padding: .65rem .8rem; border: 1px solid var(--color-sand-dark);
      background: var(--color-white); border-radius: 10px;
      text-decoration: none; color: var(--color-ink);
      transition: border-color .15s ease, transform .15s ease, box-shadow .15s ease;
    }
    .city-dir-link:hover { border-color: var(--color-terracotta); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
    .city-dir-link .flag-img { width: 1.6rem; flex: 0 0 auto; box-shadow: 0 0 0 .5px rgba(0,0,0,.12); }
    .city-dir-text { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
    .city-dir-name { font-weight: 600; }
    .city-dir-country { color: var(--color-stone); font-size: .82rem; }
    .city-dir-cost { margin-left: auto; color: var(--color-terracotta); font-weight: 600; font-size: .85rem; white-space: nowrap; }
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
          <p class="excerpt">We rate and rank every destination on the 13 things that actually matter to digital nomads &mdash; cost of living, WiFi, safety, climate, visas and more &mdash; so you can compare cities side by side and find where you&rsquo;ll thrive.</p>
          <div class="hero-ctas">
            <a href="/wheel" class="btn btn-primary btn-lg">Take the 2-minute match quiz &rarr;</a>
            <a href="#directory" class="btn btn-lg btn-ghost">Browse all cities</a>
          </div>
        </div>
      </div>
      <a href="#directory" class="hero-scroll-indicator" aria-label="Scroll to city directory">
        <span>Browse all cities</span>
        <div class="hero-scroll-indicator-icon"></div>
      </a>
    </header>

    <nav class="az-bar" id="directory" aria-label="Jump to letter">
        ${azNav}
    </nav>

    <div class="city-dir-wrap">
${sections}
    </div>
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
            <li><a href="/cities" class="footer-link">All Cities</a></li>
            <li><a href="/wheel" class="footer-link">Decision Wheel</a></li>
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
        <p class="footer-copyright">&copy; 2025 The Nomad HQ. All rights reserved.</p>
      </div>
    </div>
  </footer>

</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'cities.html'), html);
console.log(`Wrote cities.html with ${cities.length} city links across ${letters.length} letter groups.`);
