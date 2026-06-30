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
    .city-dir-hero {
      background: var(--color-sand);
      border-bottom: 1px solid var(--color-sand-dark);
      padding: calc(var(--nav-height, 64px) + 3rem) 1.25rem 2.5rem;
      text-align: center;
    }
    .city-dir-hero h1 { font-family: 'DM Serif Display', serif; color: var(--color-ink); font-size: clamp(2rem, 5vw, 2.85rem); margin: 0 0 .65rem; }
    .city-dir-hero p { max-width: 620px; margin: 0 auto; color: var(--color-charcoal); font-size: 1.05rem; line-height: 1.6; }
    .city-dir-hero .count { display: inline-block; margin-top: 1.1rem; color: var(--color-terracotta); font-weight: 600; font-size: .95rem; }

    .az-bar {
      position: sticky; top: var(--nav-height, 64px); z-index: 50;
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
    <header class="city-dir-hero">
      <div class="container">
        <h1>Digital Nomad City Guides</h1>
        <p>Every destination we cover, in one place. Browse by cost of living, WiFi, coworking, safety and visas, then open a full guide to dig in.</p>
        <span class="count">${cities.length} cities and counting</span>
      </div>
    </header>

    <nav class="az-bar" aria-label="Jump to letter">
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
