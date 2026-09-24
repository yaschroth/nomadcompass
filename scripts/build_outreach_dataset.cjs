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
  translator: 'translators', pharmacy: 'pharmacies',
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

// Which city+service pages were actually built. Same question the search's "see all" button
// asks before it names a page.
const PAIR = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-pair-pages.json'), 'utf8'))
  .filter((p) => p.city && p.service).map((p) => p.city + '|' + p.service));

const byDomain = new Map();
let skippedNoUrl = 0;

for (const r of providers) {
  if (!r.url) { skippedNoUrl += 1; continue; }
  const domain = domainOf(r.url);
  if (!domain) { skippedNoUrl += 1; continue; }

  const cityMeta = CITY.get(r.city) || {};
  const catSlug = slug(CAT_PLURAL[r.category] || r.category);
  // The page, not the page we would have liked to build. /services/<city>/<service> exists
  // only where the pair cleared the similarity cap, and a letter that links to one that did
  // not sends the provider to a 404. It happened: the therapist in Tbilisi was written to on
  // 14 September at /services/tbilisi/therapists, and that page was not built until three
  // days later. The manifest says which exist, so ask it.
  const listing = PAIR.has(`${r.city}|${r.category}`)
    ? `https://thenomadhq.com/services/${r.city}/${catSlug}`
    : `https://thenomadhq.com/services/${r.city}`;

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

// Addresses are harvested separately and kept separately, because this file is rewritten from
// scratch on every run and anything written onto a target here would not survive the next one.
// scripts/harvest_outreach_emails.cjs owns data/outreach-emails.json; this only reads it.
const MAILS = path.join(ROOT, 'data', 'outreach-emails.json');
let withEmail = 0;
let withChannel = 0;
if (fs.existsSync(MAILS)) {
  const { domains } = JSON.parse(fs.readFileSync(MAILS, 'utf8'));
  for (const t of targets) {
    const m = domains[t.domain];
    if (!m) continue;
    t.contactCheckedOn = m.checkedOn;
    // The channel comes first and is set even where no address was found, because a firm reachable
    // on WhatsApp and nowhere else is still reachable. Skipping on a missing e-mail, which is what
    // this did, hid every one of them.
    if (m.channel) { t.channel = m.channel; withChannel += 1; }
    if (m.whatsapp) t.whatsapp = m.whatsapp;
    if (m.social) t.social = m.social;
    if (m.socialDm) t.socialDm = true;
    if (!m.picked) continue;
    t.email = m.picked;
    t.emailKind = m.kind;            // role-same-domain is the only one safe to send unattended
    t.emails = m.emails;             // every address found, so a human can overrule the pick
    if (m.ambiguous) t.emailAmbiguous = true;
    withEmail += 1;
  }
}

const out = {
  _meta: {
    description: 'Private backlink-outreach catalogue. Not published, not linked from the site.',
    built: new Date().toISOString().slice(0, 10),
    from: 'data/service-languages.json',
    rowsConsidered: providers.length,
    rowsWithWebsite: providers.length - skippedNoUrl,
    firms: targets.length,
    aggregatorFirms: targets.filter((t) => t.aggregator).length,
    firmsWithEmail: withEmail,
    firmsReachable: withChannel,
  },
  targets,
};
fs.writeFileSync(path.join(ROOT, 'data', 'outreach-targets.json'), JSON.stringify(out, null, 2));
console.log(`${targets.length} firms from ${providers.length - skippedNoUrl} rows with a website`);
console.log(`  ${targets.filter((t) => !t.aggregator).length} contactable, ${targets.filter((t) => t.aggregator).length} aggregator/profile pages flagged`);
console.log(`  ${targets.filter((t) => t.evidence === 'official').length} official-evidence firms`);
console.log(`  ${withChannel} reachable, ${withEmail} of them by e-mail (data/outreach-emails.json)`);
console.log('wrote data/outreach-targets.json');
