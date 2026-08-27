require(require('path').join(__dirname,'_safe_write.cjs'));
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
add('/map', '0.7', 'monthly');
add('/timezones', '0.6', 'monthly');
add('/route', '0.6', 'monthly');
add('/best-weather', '0.7', 'monthly');
add('/visa', '0.7', 'monthly');
add('/nomad-visas', '0.7', 'monthly');
add('/services', '0.7', 'monthly');
add('/geoarbitrage', '0.7', 'monthly');
add('/salary', '0.7', 'monthly');
add('/cost-of-living-index', '0.8', 'weekly');
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

// One page per city in the services directory. Only the ones worth landing on: pages for cities
// with fewer than three providers are built for readers and internal linking but carry noindex,
// and build_service_city_pages.cjs records which is which.
{
  const manifest = path.join(ROOT, 'data', 'service-city-pages.json');
  if (fs.existsSync(manifest)) {
    const pages = JSON.parse(fs.readFileSync(manifest, 'utf8')).filter((p) => p.indexable);
    for (const p of pages.sort((a, b) => a.slug.localeCompare(b.slug))) {
      add('/services/' + p.slug, '0.7', 'monthly');
    }
    console.log('  services: ' + pages.length + ' city pages added (' +
      (JSON.parse(fs.readFileSync(manifest, 'utf8')).length - pages.length) + ' noindex, left out)');
  }
  // The city-and-service pages, which are the ones shaped like what people actually search for.
  // They live in a nested directory, and nothing in this file reads directories recursively, so the
  // manifest their generator writes is the only way in. A page that failed the word floor is not in
  // it, because it was never written.
  const pairManifest = path.join(ROOT, 'data', 'service-pair-pages.json');
  if (fs.existsSync(pairManifest)) {
    const pairs = JSON.parse(fs.readFileSync(pairManifest, 'utf8')).filter((p) => p.indexable);
    for (const p of pairs.sort((a, b) => a.url.localeCompare(b.url))) add(p.url, '0.6', 'monthly');
    console.log('  services: ' + pairs.length + ' city-and-service pages added');
  }
  // The service hubs, the third way in: one page per service across every city that has it.
  const hubManifest = path.join(ROOT, 'data', 'service-hub-pages.json');
  if (fs.existsSync(hubManifest)) {
    const hubs = JSON.parse(fs.readFileSync(hubManifest, 'utf8')).filter((p) => p.indexable);
    for (const p of hubs.sort((a, b) => a.url.localeCompare(b.url))) add(p.url, '0.7', 'monthly');
    console.log('  services: ' + hubs.length + ' service hubs added');
  }
  // A service in one language across cities: the answer to "German-speaking doctors", which no
  // other page in the family is shaped like.
  // One language of one service in one city: where a section held more than a page can show, the
  // overflow has its own URL, and it is the URL somebody types.
  const cityLangManifest = path.join(ROOT, 'data', 'service-city-lang-pages.json');
  if (fs.existsSync(cityLangManifest)) {
    const kids = JSON.parse(fs.readFileSync(cityLangManifest, 'utf8')).filter((p) => p.indexable);
    for (const p of kids.sort((a, b) => a.url.localeCompare(b.url))) add(p.url, '0.6', 'monthly');
    console.log('  services: ' + kids.length + ' city-service-language pages added');
  }
  const langManifest = path.join(ROOT, 'data', 'service-lang-pages.json');
  if (fs.existsSync(langManifest)) {
    const langs = JSON.parse(fs.readFileSync(langManifest, 'utf8')).filter((p) => p.indexable);
    for (const p of langs.sort((a, b) => a.url.localeCompare(b.url))) add(p.url, '0.7', 'monthly');
    console.log('  services: ' + langs.length + ' service-and-language pages added');
  }
  // A language on its own, the axis a reader usually arrives with. Ranked above the crossings
  // because it is the entry point the directory links to from its own index.
  const languageManifest = path.join(ROOT, 'data', 'service-language-pages.json');
  if (fs.existsSync(languageManifest)) {
    const ls = JSON.parse(fs.readFileSync(languageManifest, 'utf8')).filter((p) => p.indexable);
    for (const p of ls.sort((a, b) => a.url.localeCompare(b.url))) add(p.url, '0.8', 'monthly');
    console.log('  services: ' + ls.length + ' language pages added');
  }
}

for (const f of fs.readdirSync(path.join(ROOT, 'blog')).filter((x) => x.endsWith('.html') && x !== 'index.html').sort()) {
  add('/blog/' + f.replace(/\.html$/, ''), '0.7', 'monthly');
}
const blogCatDir = path.join(ROOT, 'blog', 'category');
if (fs.existsSync(blogCatDir)) for (const f of fs.readdirSync(blogCatDir).filter((x) => x.endsWith('.html')).sort()) {
  add('/blog/category/' + f.replace(/\.html$/, ''), '0.6', 'monthly');
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
if (fs.existsSync(path.join(ROOT, 'vs'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'vs')).filter((x) => x.endsWith('.html')).sort()) {
    add('/vs/' + f.replace(/\.html$/, ''), '0.7', 'monthly');
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
