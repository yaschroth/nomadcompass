require(require('path').join(__dirname,'_safe_write.cjs'));
/**
 * Applies CORE_PAGES_STYLE_GUIDE.md to the homepage, hubs, tools, and utility pages:
 *   - homepage: Organization + WebSite JSON-LD (sitewide, declared once), robots
 *   - blog/rentals hubs: CollectionPage + BreadcrumbList, robots
 *   - wheel: WebApplication + BreadcrumbList, robots
 *   - login/signup/profile/index-shell: robots noindex
 *   - all: fix em-dash in <title> (-> ": ") and any remaining em-dashes (-> ", ")
 * (cities.html is handled by generate_cities_hub.cjs.) Idempotent.
 */
const fs = require('fs');
const path = require('path');
const { SITE, AUTHOR } = require('./lib/author.cjs');
const ROOT = path.resolve(__dirname, '..');

const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'The Nomad HQ', url: `${SITE}/` };
const org = { '@context': 'https://schema.org', '@type': 'Organization', name: 'The Nomad HQ', url: `${SITE}/`,
  logo: `${SITE}/assets/logo-256.svg`, sameAs: AUTHOR.sameAs };
const crumb = (name, p) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
  { '@type': 'ListItem', position: 2, name, item: `${SITE}${p}` } ] });
const collection = (name, p, desc) => ({ '@context': 'https://schema.org', '@type': 'CollectionPage',
  name, description: desc, url: `${SITE}${p}`, isPartOf: { '@type': 'WebSite', url: `${SITE}/` } });
const webapp = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Nomad Taste Wheel',
  url: `${SITE}/wheel`, applicationCategory: 'TravelApplication', operatingSystem: 'Web',
  description: 'Interactive tool that matches digital nomads to cities based on the priorities that matter most to them.' };

const cfg = {
  'index.html': { robots: 'index', ld: [org, website] },
  'blog.html': { robots: 'index', ld: [collection('Digital Nomad Blog', '/blog', 'City guides, remote-work tips, and visa information for digital nomads.'), crumb('Blog', '/blog')] },
  'wheel.html': { robots: 'index', ld: [webapp, crumb('Wheel', '/wheel')] },
  'rentals.html': { robots: 'noindex' }, // hidden for now (see hide_rentals.cjs / TODO.md)
  'login.html': { robots: 'noindex' },
  'signup.html': { robots: 'noindex' },
  'profile.html': { robots: 'noindex' },
  'index-shell.html': { robots: 'noindex' },
};

let changed = 0;
for (const [file, c] of Object.entries(cfg)) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) continue;
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  // em-dash: title -> ": ", rest -> ", "
  html = html.replace(/(<title>)([^<]*)(<\/title>)/i, (m, a, t, b) => a + t.replace(/\s*—\s*/g, ': ') + b);
  html = html.replace(/\s*—\s*/g, ', ');

  // robots
  if (c.robots === 'noindex') {
    if (/name="robots"/i.test(html)) html = html.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow">');
    else html = html.replace(/(<meta name="viewport"[^>]*>\n)/i, `$1  <meta name="robots" content="noindex, follow">\n`);
  } else if (!/name="robots"/i.test(html)) {
    html = html.replace(/(<meta name="viewport"[^>]*>\n)/i, `$1  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">\n`);
  }

  // JSON-LD (only if none present)
  if (c.ld && !/application\/ld\+json/.test(html)) {
    const blocks = c.ld.map((b) => `  <script type="application/ld+json">\n  ${JSON.stringify(b, null, 2).replace(/\n/g, '\n  ')}\n  </script>`).join('\n');
    html = html.replace(/<\/head>/i, `${blocks}\n</head>`);
  }

  if (html !== before) { fs.writeFileSync(abs, html); changed++; console.log(`  ${file}: robots=${c.robots}${c.ld ? ' +' + c.ld.map((x) => x['@type']).join('+') : ''}`); }
}
console.log(`Core pages changed: ${changed}`);
