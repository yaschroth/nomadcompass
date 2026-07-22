/**
 * Applies CITY_PAGE_STYLE_GUIDE.md to cities/*.html:
 *   - title (drop em-dash, keyword form, <=60), og:type=website, og:url, Twitter card, robots
 *   - JSON-LD: BreadcrumbList + City (name/country/geo/image) + FAQPage
 *   - a static, crawlable "Explore" block (nearest cities + matching blog guide +
 *     this city's accommodations + /wheel + /cities) before </main>
 *   - a compact data-driven FAQ (real cost + scores) feeding the FAQPage
 * Idempotent (guards each insertion). Usage: node scripts/apply_city_seo.cjs [slug]
 */
const fs = require('fs');
const path = require('path');
const SITE = 'https://thenomadhq.com';
const ROOT = path.resolve(__dirname, '..');
const CITY_DIR = path.join(ROOT, 'cities');

// --- load city data ---
const code = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const fn = new Function('module', code + '\n;module.exports = CITIES;');
const m = {}; fn(m);
const CITIES = m.exports;
const byId = new Map(CITIES.map((c) => [c.id, c]));

// blog guides that map to a city
const BLOG = {
  lisbon: 'digital-nomad-guide-lisbon', bangkok: 'bangkok-budget-guide',
  budapest: 'budapest-nomad-guide', capetown: 'cape-town-nomad-guide',
  dubai: 'dubai-digital-nomad-guide', mexicocity: 'mexico-city-nomad-guide',
  tbilisi: 'digital-nomads-tbilisi-georgia', medellin: 'medellin-vs-chiang-mai',
  chiangmai: 'medellin-vs-chiang-mai',
};
// accommodations grouped by city id prefix
const accomByCity = {};
for (const f of fs.readdirSync(path.join(ROOT, 'accommodations')).filter((x) => x.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  const city = CITIES.find((c) => slug.startsWith(c.id + '-'));
  if (city) (accomByCity[city.id] = accomByCity[city.id] || []).push(slug);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rad = (d) => (d * Math.PI) / 180;
function dist(a, b) {
  if (a.lat == null || b.lat == null) return Infinity;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(x));
}
function nearest(city, n) {
  return CITIES.filter((c) => c.id !== city.id)
    .map((c) => ({ c, d: dist(city, c) }))
    .sort((p, q) => p.d - q.d).slice(0, n).map((p) => p.c);
}

const CAT = { climate: 'great weather', cost: 'affordability', wifi: 'fast internet', nightlife: 'nightlife', nature: 'nature and the outdoors', safety: 'safety', food: 'its food scene', community: 'a large nomad community', english: 'widely spoken English', visa: 'easy visas', culture: 'culture', cleanliness: 'cleanliness', airquality: 'clean air' };
const qual = (s) => (s >= 8 ? 'excellent' : s >= 6.5 ? 'good' : s >= 5 ? 'average' : 'on the limited side');

function faqFor(c) {
  const cost = c.costPerMonth ? `$${c.costPerMonth.toLocaleString('en-US')}` : 'a moderate amount';
  const sc = c.scores || {};
  const wifi = sc.wifi ?? 6, safety = sc.safety ?? 6;
  const top = Object.entries(sc).filter(([k]) => CAT[k]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => CAT[k]);
  const topTxt = top.length ? top.join(' and ') : 'remote-work value';
  return [
    { q: `How much does it cost to live in ${c.name} as a digital nomad?`,
      a: `A comfortable nomad budget in ${c.name} is around ${cost} a month, covering a furnished rental, food, coworking, and getting around. You can spend less by living outside the center and eating local, or more in the most popular neighborhoods.` },
    { q: `Is the internet fast enough for remote work in ${c.name}?`,
      a: `${c.name} rates ${wifi} out of 10 for WiFi in our scoring, so connectivity is ${qual(wifi)} for video calls and everyday remote work. A local SIM with a data plan is a smart backup for cafes, coworking, and travel days.` },
    { q: `Is ${c.name} safe for digital nomads?`,
      a: `${c.name} scores ${safety} out of 10 for safety in our ratings, which is ${qual(safety)} for solo travelers and long stays. Use the usual precautions with valuables and at night, and favor well-reviewed neighborhoods when you choose where to stay.` },
    { q: `Is ${c.name} a good city for digital nomads overall?`,
      a: `${c.name} stands out for ${topTxt} among remote workers. With a typical budget near ${cost} a month and a growing nomad scene, it is worth a look if those priorities match what you want from a base.` },
  ];
}

function adaptiveTitle(name) {
  const base = `${name} Digital Nomad Guide`;
  const full = `${base}: Cost of Living, WiFi & Visa`;
  return full.length <= 60 ? full : base;
}

const only = process.argv[2];
const files = fs.readdirSync(CITY_DIR).filter((f) => f.endsWith('.html')).filter((f) => !only || f === only || f === only + '.html');

let changed = 0, skipped = [];
for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const c = byId.get(slug);
  if (!c) { skipped.push(slug); continue; }
  const abs = path.join(CITY_DIR, file);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;
  const canonical = `${SITE}/cities/${slug}`;
  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/) || [, c.image || ''])[1];
  const metaDesc = (html.match(/<meta name="description" content="([^"]+)"/) || [, ''])[1];

  // title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(adaptiveTitle(c.name))}</title>`);
  // og:type article -> website
  html = html.replace(/<meta property="og:type" content="article">/, '<meta property="og:type" content="website">');
  // robots
  if (!/name="robots"/i.test(html))
    html = html.replace(/(<meta name="viewport"[^>]*>\n)/i, `$1  <meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1">\n`);
  // og:url + twitter (after og:image)
  if (!/property="og:url"/.test(html))
    html = html.replace(/(<meta property="og:image"[^>]*>)/,
      `$1\n  <meta property="og:url" content="${canonical}">\n` +
      `  <meta name="twitter:card" content="summary_large_image">\n` +
      `  <meta name="twitter:title" content="${esc(c.name)} Digital Nomad Guide">\n` +
      `  <meta name="twitter:description" content="${esc(metaDesc)}">\n` +
      `  <meta name="twitter:image" content="${esc(ogImage)}">`);

  // JSON-LD (before </head>)
  const faq = faqFor(c);
  if (!/"@type": "BreadcrumbList"/.test(html)) {
    const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Cities', item: `${SITE}/cities` },
      { '@type': 'ListItem', position: 3, name: c.name, item: canonical } ] };
    const city = { '@context': 'https://schema.org', '@type': 'City', name: c.name, description: c.tagline || `${c.name} digital nomad guide`, url: canonical, image: ogImage,
      containedInPlace: { '@type': 'Country', name: c.country } };
    if (c.lat != null) city.geo = { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng };
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
    const blocks = [breadcrumb, city, faqLd].map((b) => `  <script type="application/ld+json">\n  ${JSON.stringify(b, null, 2).replace(/\n/g, '\n  ')}\n  </script>`).join('\n');
    html = html.replace(/<\/head>/i, `${blocks}\n</head>`);
  }

  // body: crawlable Explore + FAQ before </main>
  if (!/city-seo-start/.test(html)) {
    const near = nearest(c, 6);
    const cityLinks = near.map((n) => `<a href="/cities/${n.id}">${esc(n.name)}</a>`).join(', ');
    const blogLink = BLOG[slug] ? ` Read the <a href="/blog/${BLOG[slug]}">full ${esc(c.name)} guide</a>.` : '';
    const faqHtml = faq.map((x) => `          <details class="city-faq">\n            <summary>${esc(x.q)}</summary>\n            <p>${esc(x.a)}</p>\n          </details>`).join('\n');
    const block = `
        <!-- city-seo-start -->
        <section class="container city-seo-explore" style="padding:2rem 1.25rem; max-width:1100px; margin:0 auto;">
          <p class="city-seo-nearby"><strong>Nearby:</strong> ${cityLinks}. <a href="/cities">Browse all city guides</a> or <a href="/wheel">find your match with the Nomad Wheel</a>.${blogLink}</p>

          <h2 id="faq">Frequently Asked Questions About ${esc(c.name)}</h2>
${faqHtml}
        </section>
        <!-- city-seo-end -->
`;
    html = html.replace(/(\n\s*<\/main>)/i, `${block}$1`);
  }

  if (html !== before) { fs.writeFileSync(abs, html); changed++; }
}
console.log(`Cities changed: ${changed}/${files.length}`);
if (skipped.length) console.log(`No data (skipped): ${skipped.length} ${skipped.slice(0, 5).join(',')}${skipped.length > 5 ? '...' : ''}`);
