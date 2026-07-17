/**
 * Regenerates sitemap.xml from the current live pages with a fresh lastmod.
 * Includes: home, /cities, /wheel, /blog + posts, all city pages, and the core
 * trust pages. Excludes noindex/hidden surfaces (accommodations, rentals, auth,
 * index-shell). Usage: node scripts/generate_sitemap.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://thenomadhq.com';
const today = new Date().toISOString().slice(0, 10);

const urls = [];
const add = (loc, priority, changefreq) => urls.push({ loc, priority, changefreq });

add('/', '1.0', 'weekly');
add('/cities', '0.9', 'weekly');
add('/compare', '0.7', 'monthly');
add('/best', '0.8', 'weekly');
add('/tier-list', '0.7', 'monthly');
add('/tier-lists', '0.6', 'monthly');
add('/wheel', '0.8', 'monthly');
add('/blog', '0.7', 'weekly');
add('/about', '0.4', 'yearly');
add('/contact', '0.3', 'yearly');
add('/disclosure', '0.3', 'yearly');
add('/privacy', '0.2', 'yearly');
add('/terms', '0.2', 'yearly');
add('/legal-notice', '0.2', 'yearly');

for (const f of fs.readdirSync(path.join(ROOT, 'blog')).filter((x) => x.endsWith('.html') && x !== 'index.html').sort()) {
  add('/blog/' + f.replace(/\.html$/, ''), '0.7', 'monthly');
}
for (const f of fs.readdirSync(path.join(ROOT, 'cities')).filter((x) => x.endsWith('.html') && x !== 'index.html').sort()) {
  add('/cities/' + f.replace(/\.html$/, ''), '0.8', 'monthly');
}
if (fs.existsSync(path.join(ROOT, 'best'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'best')).filter((x) => x.endsWith('.html') && x !== 'index.html').sort()) {
    add('/best/' + f.replace(/\.html$/, ''), '0.7', 'monthly');
  }
}
if (fs.existsSync(path.join(ROOT, 'tier-list'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'tier-list')).filter((x) => x.endsWith('.html')).sort()) {
    add('/tier-list/' + f.replace(/\.html$/, ''), '0.6', 'monthly');
  }
}
if (fs.existsSync(path.join(ROOT, 'activities.html'))) add('/activities', '0.6', 'monthly');
if (fs.existsSync(path.join(ROOT, 'activities'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'activities')).filter((x) => x.endsWith('.html')).sort()) {
    add('/activities/' + f.replace(/\.html$/, ''), '0.6', 'monthly');
  }
}

const body = urls.map((u) =>
  `  <url>\n    <loc>${BASE}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
).join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Wrote sitemap.xml with ${urls.length} URLs (lastmod ${today}).`);
