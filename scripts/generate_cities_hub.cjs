/**
 * Generates cities.html  ->  served at /cities  (a crawlable hub linking every
 * city guide). Googlebot discovers the 410 city pages by following real <a href>
 * links here, not only via the sitemap. Re-run whenever the city set changes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://thenomadhq.com';

// --- load city metadata (name/country/flag) from cities-data.js ---
function loadCities() {
  try {
    const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
    const fn = new Function('module', 'exports', code + '\n;module.exports = CITIES;');
    const m = { exports: {} };
    fn(m, m.exports);
    return Array.isArray(m.exports) ? m.exports : [];
  } catch (e) {
    console.warn('Could not eval cities-data.js, falling back to slug names:', e.message);
    return [];
  }
}

const titleCase = (slug) =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// only link cities that actually have a page (no 404s)
const fileSlugs = fs
  .readdirSync(path.join(ROOT, 'cities'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''));

const meta = new Map(loadCities().map((c) => [c.id, c]));

const cities = fileSlugs
  .map((slug) => {
    const c = meta.get(slug) || {};
    return {
      slug,
      name: c.name || titleCase(slug),
      country: c.country || '',
      flag: c.flag || '',
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// group by first letter for an A–Z directory
const groups = {};
for (const c of cities) {
  const letter = (c.name[0] || '#').toUpperCase();
  (groups[letter] = groups[letter] || []).push(c);
}
const letters = Object.keys(groups).sort();

const azNav = letters
  .map((l) => `<a href="#letter-${l}" class="az-link">${l}</a>`)
  .join('\n        ');

const sections = letters
  .map((l) => {
    const items = groups[l]
      .map(
        (c) =>
          `          <li><a href="/cities/${c.slug}" class="city-dir-link">` +
          `${c.flag ? escapeHtml(c.flag) + ' ' : ''}` +
          `<span class="city-dir-name">${escapeHtml(c.name)}</span>` +
          `${c.country ? `<span class="city-dir-country">${escapeHtml(c.country)}</span>` : ''}` +
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

  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap" as="style">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap">

  <link rel="stylesheet" href="styles/base.css">
  <link rel="stylesheet" href="styles/nav.css">
  <link rel="stylesheet" href="styles/footer.css">

  <style>
    .city-dir-hero { padding: 3rem 0 1.5rem; text-align: center; }
    .city-dir-hero h1 { font-family: 'DM Serif Display', serif; font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 .75rem; }
    .city-dir-hero p { max-width: 640px; margin: 0 auto; color: var(--color-text-muted, #555); font-size: 1.05rem; }
    .az-bar { position: sticky; top: 64px; z-index: 5; display: flex; flex-wrap: wrap; gap: .35rem; justify-content: center; padding: .75rem 1rem; background: var(--color-bg, #fff); border-bottom: 1px solid rgba(0,0,0,.08); }
    .az-link { display: inline-block; min-width: 1.6rem; text-align: center; padding: .2rem .4rem; border-radius: 6px; font-weight: 600; text-decoration: none; color: inherit; }
    .az-link:hover { background: rgba(0,0,0,.06); }
    .city-dir-wrap { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
    .city-dir-group { scroll-margin-top: 120px; margin-top: 2rem; }
    .city-dir-letter { font-family: 'DM Serif Display', serif; font-size: 1.6rem; margin: 0 0 .75rem; padding-bottom: .25rem; border-bottom: 2px solid rgba(0,0,0,.08); }
    .city-dir-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: .35rem .75rem; }
    .city-dir-link { display: flex; align-items: baseline; gap: .4rem; padding: .45rem .5rem; border-radius: 8px; text-decoration: none; color: inherit; }
    .city-dir-link:hover { background: rgba(0,0,0,.05); }
    .city-dir-name { font-weight: 600; }
    .city-dir-country { color: var(--color-text-muted, #777); font-size: .85rem; }
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
    </div>
  </nav>

  <main>
    <header class="city-dir-hero">
      <div class="container">
        <h1>Digital Nomad City Guides</h1>
        <p>Every destination we cover in one place. Browse all ${cities.length} cities for cost of living, WiFi speeds, coworking spaces, safety and visa details, then open a full guide to dig in.</p>
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
      <p style="text-align:center; padding:2rem 0; color:#777;">&copy; The Nomad HQ &middot; <a href="/">Home</a> &middot; <a href="/blog">Blog</a></p>
    </div>
  </footer>

</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'cities.html'), html);
console.log(`Wrote cities.html with ${cities.length} city links across ${letters.length} letter groups.`);
