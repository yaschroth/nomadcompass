/**
 * Builds the private backlink-outreach catalogue from data/service-languages.json.
 *
 * Only providers with a website can give a backlink, which is 2,164 of the 7,003 rows. Those
 * collapse to fewer real firms, because a firm listed in two cities is one conversation, not two,
 * so rows are merged on the registrable domain and every listing that firm appears on is carried
 * along. The listing URLs matter more than anything else here: they are what the outreach mail
 * actually asks them to link to.
 *
 * Aggregator and profile hosts (LinkedIn, Facebook, Doctolib, mangled Outlook safelinks) are kept
 * but flagged, because a Facebook page cannot carry a followed link to you and is not worth a mail.
 *
 * Writes data/outreach-targets.json. Nothing here touches the public site.
 *
 * Usage: node scripts/build_outreach_dataset.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CAT_PLURAL = {
  doctor: 'doctors', dentist: 'dentists', vet: 'vets', therapy: 'therapists',
  physio: 'physiotherapists', optician: 'opticians', hair: 'hairdressers', legal: 'lawyers',
  tax: 'tax advisers', realestate: 'estate agents', mechanic: 'mechanics', fitness: 'gyms',
  translator: 'translators',
};
const slug = (s) => s.replace(/\s+/g, '-').toLowerCase();

// Hosts where a "listing" is somebody else's profile page: no link equity, no editorial contact.
const AGGREGATOR = /(^|\.)(linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|doctolib\.[a-z.]+|safelinks\.protection\.outlook\.com|google\.[a-z.]+|goo\.gl|bit\.ly|wa\.me|t\.me|yelp\.[a-z.]+|xing\.com)$/i;

const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
const providers = Array.isArray(rows) ? rows : rows.providers || [];

// city -> country, so the tool can group by market. cities-data.js is the only place that knows.
const src = fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8');
const arr = src.slice(src.indexOf('const CITIES = ') + 'const CITIES = '.length);
let depth = 0; let end = -1;
for (let i = 0; i < arr.length; i += 1) {
  if (arr[i] === '[') depth += 1;
  else if (arr[i] === ']') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-eval
const CITY = new Map(eval(arr.slice(0, end)).map((c) => [c.id, { name: c.name, country: c.country }]));

function domainOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.replace(/^www\./, '');
  } catch (e) { return ''; }
}

const byDomain = new Map();
let skippedNoUrl = 0;

for (const r of providers) {
  if (!r.url) { skippedNoUrl += 1; continue; }
  const domain = domainOf(r.url);
  if (!domain) { skippedNoUrl += 1; continue; }

  const cityMeta = CITY.get(r.city) || {};
  const catSlug = slug(CAT_PLURAL[r.category] || r.category);
  const listing = `https://thenomadhq.com/services/${r.city}/${catSlug}`;

  if (!byDomain.has(domain)) {
    byDomain.set(domain, {
      id: domain,
      name: r.name,
      website: r.url,
      domain,
      aggregator: AGGREGATOR.test(domain),
      categories: [],
      cities: [],
      countries: [],
      languages: [],
      evidence: r.evidence,
      listings: [],
      addresses: [],
      notes: [],
      sources: [],
      sourceUrls: [],
      checked: r.checked,
      listedCount: 0,
    });
  }
  const t = byDomain.get(domain);
  t.listedCount += 1;
  const push = (arrRef, v) => { if (v && !arrRef.includes(v)) arrRef.push(v); };
  push(t.categories, CAT_PLURAL[r.category] || r.category);
  push(t.cities, cityMeta.name || r.city);
  push(t.countries, cityMeta.country || '');
  for (const l of r.languages || []) push(t.languages, l);
  push(t.listings, listing);
  push(t.addresses, r.area);
  push(t.notes, r.note);
  push(t.sources, r.source);
  push(t.sourceUrls, r.sourceUrl);
  // strongest evidence wins the badge
  const rank = { official: 0, visited: 1, 'self-declared': 2, directory: 3 };
  if ((rank[r.evidence] ?? 9) < (rank[t.evidence] ?? 9)) t.evidence = r.evidence;
  if (r.checked > t.checked) t.checked = r.checked;
}

const targets = [...byDomain.values()].sort((a, b) => {
  // real sites before profile pages, then the best-sourced, then the most-listed, then by name
  if (a.aggregator !== b.aggregator) return a.aggregator ? 1 : -1;
  const rank = { official: 0, visited: 1, 'self-declared': 2, directory: 3 };
  const d = (rank[a.evidence] ?? 9) - (rank[b.evidence] ?? 9);
  if (d) return d;
  if (b.listedCount !== a.listedCount) return b.listedCount - a.listedCount;
  return a.name.localeCompare(b.name);
});

const out = {
  _meta: {
    description: 'Private backlink-outreach catalogue. Not published, not linked from the site.',
    built: new Date().toISOString().slice(0, 10),
    from: 'data/service-languages.json',
    rowsConsidered: providers.length,
    rowsWithWebsite: providers.length - skippedNoUrl,
    firms: targets.length,
    aggregatorFirms: targets.filter((t) => t.aggregator).length,
  },
  targets,
};
fs.writeFileSync(path.join(ROOT, 'data', 'outreach-targets.json'), JSON.stringify(out, null, 2));
console.log(`${targets.length} firms from ${providers.length - skippedNoUrl} rows with a website`);
console.log(`  ${targets.filter((t) => !t.aggregator).length} contactable, ${targets.filter((t) => t.aggregator).length} aggregator/profile pages flagged`);
console.log(`  ${targets.filter((t) => t.evidence === 'official').length} official-evidence firms`);
console.log('wrote data/outreach-targets.json');
