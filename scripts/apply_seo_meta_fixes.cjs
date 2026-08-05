/**
 * Targeted SEO meta fixes from the sitewide audit (touches only <title> and <meta> lines):
 *   1. Rewrite 28 titles that exceeded ~65 chars (SERP truncation) + fix title-case bugs
 *      ("Air quality" -> "Air Quality", "Visa access" -> "Visa Access", "Nomad community").
 *   2. Add the default og:image (+ twitter card/image) to 7 utility/hub pages that lacked it.
 *   3. Trim 4 meta descriptions that ran past ~165 chars.
 * Idempotent (exact-match replacements only apply once), CRLF-safe. Usage: node scripts/apply_seo_meta_fixes.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OG = 'https://thenomadhq.com/assets/og-image.png';
const enc = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;');

const TITLES = {
  'activities.html': 'Best Cities by Activity: Surf, Dive & Shop | The Nomad HQ',
  'best/best-cities-for-nature-and-outdoors.html': 'Best Nomad Cities for Nature & the Outdoors | The Nomad HQ',
  'best/best-digital-nomad-cities-in-the-middle-east.html': 'Best Nomad Cities in the Middle East (2026) | The Nomad HQ',
  'best/safest-cities-for-digital-nomads.html': 'Safest Digital Nomad Cities: Low-Crime Ranking | The Nomad HQ',
  'best-weather.html': 'Best Weather by Month for Digital Nomads | The Nomad HQ',
  'best.html': 'Best Cities for Digital Nomads: Cost, WiFi, Safety | The Nomad HQ',
  'blog/category/visa-legal.html': 'Visas & Legal for Digital Nomads: Guides | The Nomad HQ',
  'blog.html': 'Digital Nomad Blog: City Guides & Remote Work Tips | The Nomad HQ',
  'cost-of-living-index.html': 'Digital Nomad Cost of Living Index 2026: Real Monthly Costs, 330 Cities | The Nomad HQ',
  'route.html': 'Nomad Route Planner: Dates, Budget & Weather | The Nomad HQ',
  'salary.html': 'Salary Calculator: What You Need in Any City | The Nomad HQ',
  'tier-list/affordability.html': 'Affordability Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/air-quality.html': 'Air Quality Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/cleanliness.html': 'Cleanliness Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/climate.html': 'Climate Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/culture.html': 'Culture Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/english.html': 'English Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/nature.html': 'Nature Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/nightlife.html': 'Nightlife Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/nomad-community.html': 'Nomad Community Tier List: Cities S to F | The Nomad HQ',
  'tier-list/safety.html': 'Safety Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/visa.html': 'Visa Access Tier List: Nomad Cities S to F | The Nomad HQ',
  'tier-list/indonesia.html': 'Nomad Cities in Indonesia Tier List: S to F | The Nomad HQ',
  'tier-list/latin-america.html': 'Nomad Cities in Latin America Tier List: S to F | The Nomad HQ',
  'tier-list/middle-east.html': 'Nomad Cities in the Middle East Tier List: S to F | The Nomad HQ',
  'tier-list/north-america.html': 'Nomad Cities in North America Tier List: S to F | The Nomad HQ',
  'tier-list.html': 'Nomad Cities Tier List: All Ranked S to F | The Nomad HQ',
  'tier-lists.html': 'Nomad City Tier Lists: Region & Category | The Nomad HQ',
};

const OG_PAGES = ['about.html', 'activities.html', 'contact.html', 'disclosure.html', 'legal-notice.html', 'privacy.html', 'terms.html'];

const DESCS = {
  'cost-of-living-index.html': 'A transparent, sourced cost-of-living index for digital nomads: the real monthly budget for 330 cities, ranked, from central rent plus a one-person basket priced from Numbeo. Sort and filter by region.',
  'route.html': 'Plan a dated multi-city nomad trip: month-by-month budget, per-stop weather, a packing list, a Schengen 90/180 tracker, and flight info. Free planner.',
  'salary.html': 'Pick a city and see the monthly income you need to live there as a digital nomad, at a lean, comfortable or premium lifestyle. Free calculator.',
  'cities/sancristobal.html': 'Is San Cristobal de las Casas good for digital nomads? Nomad Score 6.9/10, cost of living in USD, WiFi, safety, visas, neighborhoods and coworking.',
};

let titleN = 0, ogN = 0, descN = 0, warn = [];

// 1. titles
for (const [rel, t] of Object.entries(TITLES)) {
  const abs = path.join(ROOT, rel);
  let s = fs.readFileSync(abs, 'utf8');
  const nt = `<title>${enc(t)}</title>`;
  const cur = (s.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
  if (cur === nt) continue;
  s = s.replace(/<title>[\s\S]*?<\/title>/, nt);
  fs.writeFileSync(abs, s); titleN++;
  const plain = t.replace(/&amp;/g, '&');
  if (plain.length > 65) warn.push(`STILL LONG (${plain.length}): ${rel}`);
}

// 2. og:image + twitter card/image on utility pages (insert after og:title)
for (const rel of OG_PAGES) {
  const abs = path.join(ROOT, rel);
  let s = fs.readFileSync(abs, 'utf8');
  if (/property="og:image"/.test(s)) continue;
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const add = [`  <meta property="og:image" content="${OG}">`];
  if (!/name="twitter:card"/.test(s)) add.push(`  <meta name="twitter:card" content="summary_large_image">`);
  if (!/name="twitter:image"/.test(s)) add.push(`  <meta name="twitter:image" content="${OG}">`);
  const block = add.join(eol);
  if (/<meta property="og:title"[^>]*>/.test(s)) {
    s = s.replace(/(<meta property="og:title"[^>]*>)/, `$1${eol}${block}`);
  } else {
    s = s.replace(/<\/head>/i, `${block}${eol}</head>`);
  }
  fs.writeFileSync(abs, s); ogN++;
}

// 3. descriptions
for (const [rel, d] of Object.entries(DESCS)) {
  const abs = path.join(ROOT, rel);
  let s = fs.readFileSync(abs, 'utf8');
  const nd = `<meta name="description" content="${enc(d)}">`;
  if (s.includes(nd)) continue;
  s = s.replace(/<meta name="description" content="[^"]*">/, nd);
  fs.writeFileSync(abs, s); descN++;
  if (d.length > 165) warn.push(`DESC STILL LONG (${d.length}): ${rel}`);
}

console.log(`titles: ${titleN} | og:image added: ${ogN} | descriptions: ${descN}`);
if (warn.length) console.log('WARN:\n' + warn.join('\n')); else console.log('all within limits');
