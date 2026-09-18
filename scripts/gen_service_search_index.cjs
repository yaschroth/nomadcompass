/**
 * Builds assets/service-search-index.js: every provider in the directory, in one array, for the
 * live search on /services.
 *
 * WHY THIS IS A SEPARATE FILE AND NOT PART OF services.html
 *
 * /services was doing two jobs badly at once. It is the crawlable hub, so it ships 329 static city
 * cards that a search engine reads; it is also the place a person goes to find a provider, and for
 * that it offered two dropdowns over city cards. A reader looking for an English-speaking dentist
 * got cities, never dentists, and could assemble 728 questions of which 478 had no answer.
 *
 * The two jobs are now separate. The static grid stays exactly as it is, which is what the crawler
 * sees and what the no-JS visitor gets. This index is fetched only when someone actually starts
 * searching, so the page costs nothing extra to load or to crawl, and the search is over PROVIDERS:
 * you type, you see the people.
 *
 * 7,003 providers is 795 KB raw and about 240 KB over the wire once Vercel gzips it. That is too
 * much to inline into every page load and perfectly reasonable as a deliberate fetch after the
 * first keystroke.
 *
 * SHAPE (positional, to keep it small — the reader is the search code in build_services.cjs):
 *   0 name  1 city slug  2 category  3 languages (concatenated 2-letter codes)
 *   4 evidence initial   5 area/address  6 website url
 *   7 what this row has and most do not: contact details the provider gave us {w,p,e,s},
 *     plus m=1 for a practice that travels to you and so has no address to map, and d, the day
 *     a checked provider answered us
 *
 * A precomputed folded haystack was the obvious eighth field and the wrong call: it repeated the
 * name, the city and the address and took the file from 795 KB to 2.9 MB. The browser folds the
 * seven thousand strings once on load instead, which is a few milliseconds.
 *
 * Usage: node scripts/gen_service_search_index.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const providers = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
const rows = Array.isArray(providers) ? providers : providers.providers || [];

// City display name and country, so a result can say "Madrid, Spain" without a second lookup.
const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const arr = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
let depth = 0; let end = -1;
for (let i = 0; i < arr.length; i += 1) {
  if (arr[i] === '[') depth += 1;
  else if (arr[i] === ']') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITIES = eval(arr.slice(0, end));
const cityMeta = {};
CITIES.forEach((c) => { cityMeta[c.id] = [c.name, c.country]; });

const EV = { official: 'o', visited: 'v', 'self-declared': 's', directory: 'd' };

const out = rows.map((r) => {
  const row = [
    r.name,
    r.city,
    r.category,
    (r.languages || []).slice().sort().join(''),
    EV[r.evidence] || '?',
    (r.area || '').slice(0, 90),
    r.url || '',
  ];
  // Field 7, present only on the rows that have it. Where a provider handed us its own contact
  // details the search shows all of them, the same rule the cards follow. An empty eighth string
  // on the 7,002 rows that have none would cost 14 KB to say nothing, so the field is absent.
  const c = {};
  if (r.whatsapp) c.w = String(r.whatsapp).replace(/[^0-9]/g, '');
  if (r.phone) c.p = r.phone;
  if (r.email) c.e = r.email;
  if (r.social && r.social.length) c.s = r.social;
  if (r.mobile) c.m = 1;
  if (r.confirmedOn) c.d = r.confirmedOn;
  if (Object.keys(c).length) row.push(c);
  return row;
});

// Which city+service pages actually exist, so the "see all" button can name the page it opens
// instead of promising one that was never written. Same fallback the generators do, made visible.
const pairs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-pair-pages.json'), 'utf8'));
const built = {};
pairs.forEach((p) => { if (p.city && p.service) built[p.city + '|' + p.service] = 1; });

const body = 'window.NOMAD_SERVICES=' + JSON.stringify(out)
  + ';\nwindow.NOMAD_SERVICE_CITIES=' + JSON.stringify(cityMeta)
  + ';\nwindow.NOMAD_SERVICE_PAGES=' + JSON.stringify(built) + ';\n';

const dest = path.join(ROOT, 'assets', 'service-search-index.js');
fs.writeFileSync(dest, body);
console.log(`Wrote assets/service-search-index.js: ${out.length} providers, `
  + `${out.filter((r) => r[7]).length} with contact details, `
  + `${Object.keys(built).length} city+service pages, ${(body.length / 1024).toFixed(0)} KB raw`);
