/**
 * The one derived model of the services directory. Every generator and every gate reads it.
 *
 * Why one module: the heading, the card list, the counts and the sitemap each used to work the data
 * out for themselves, which is how a page came to announce "English and German-speaking doctors and
 * lawyers" over a list of five hairdressers. If they all read the same model they cannot disagree.
 *
 * The shape of the family is decided here too, and it is not "a page per city and service". Two
 * measurements decide it:
 *   - 157 of 287 cities hold exactly one service category. A child page there would list the same
 *     providers as its parent, so for those cities the city page IS the service page.
 *   - In 484 of 540 pairs the top non-local language covers 90% or more of the rows, so a language
 *     URL would be its own parent with a different title. Language is a section, not a page.
 *
 * Usage: const M = require('./lib/service_data.cjs');
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
// The rows name their source by id and the sentence they share is stored once on that source.
// lib/service_db.cjs puts the two back together, so everything below sees whole rows as before.
const { db: DB, sources: SOURCES } = require(path.join(ROOT, 'scripts', 'lib', 'service_db.cjs'));
const { CAT_PLURAL, EV_RANK } = require(path.join(ROOT, 'scripts', 'lib', 'service_labels.cjs'));

const CATS = DB._categories;
const LANGS = DB._languages;
const EVIDENCE = DB._evidence;

const iso = (flag) => {
  const p = [...(flag || '')];
  return p.length === 2 ? p.map((x) => String.fromCharCode(x.codePointAt(0) - 0x1F1E6 + 97)).join('') : '';
};

const mod = {};
new Function('module', fs.readFileSync(path.join(ROOT, 'cities-data.js'), 'utf8') + ';module.exports=CITIES')(mod);
const CITY = {};
mod.exports.forEach((c) => {
  if (c && c.id) CITY[c.id] = { id: c.id, name: c.name, country: c.country, iso: iso(c.flag), lat: c.lat, lng: c.lng };
});

// Which country speaks what. Written out rather than inferred: two attempts to derive it failed and
// the second is the instructive one. Taking each country's most common language picks English,
// because English is the thing these lists set out to record. Thailand's rows carry English 84
// times and Thai 50, so Bangkok came out billed as "Thai and German-speaking". A country's own
// language is a plain fact and belongs in a table. null means "no single local language to drop".
const LOCAL = {
  Thailand: 'th', Spain: 'es', India: null, Italy: 'it', Vietnam: 'vi', Georgia: 'ka',
  Lithuania: 'lt', Indonesia: 'id', France: 'fr', UAE: 'ar', Portugal: 'pt', Mexico: 'es',
  Poland: 'pl', Colombia: 'es', Egypt: 'ar', 'South Africa': 'af', Serbia: 'sr',
  Philippines: 'tl', Argentina: 'es', Cambodia: 'km', Slovenia: 'sl', 'Czech Republic': 'cs',
  Morocco: 'ar', Latvia: 'lv', Estonia: 'et', Croatia: 'hr', Kenya: 'sw', Hungary: 'hu',
  Japan: 'ja', Taiwan: 'zh', Singapore: null, Brazil: 'pt', Chile: 'es', Netherlands: 'nl',
  Malaysia: 'ms', Germany: 'de', Greece: 'el', Belgium: 'nl', 'Sri Lanka': 'si', Bulgaria: 'bg',
  Turkey: 'tr', Romania: 'ro', 'South Korea': 'ko', Peru: 'es', Austria: 'de',
  // English is the local language here, so the pages lead on the foreign one the lists record.
  'United States': 'en', China: 'zh',
  Albania: 'sq', Bolivia: 'es', Ecuador: 'es', Jordan: 'ar', Norway: 'no', Switzerland: 'de',
  'Costa Rica': 'es', Ethiopia: null, Guatemala: 'es', Israel: 'he', Laos: null,
  Montenegro: null, Myanmar: 'my', Nepal: 'ne', 'North Macedonia': null, Oman: 'ar',
  Sweden: 'sv', Tanzania: 'sw', Tunisia: 'ar', Uruguay: 'es', Uzbekistan: null,
};

// A country with no entry would silently keep its own language in every heading it drives, and this
// table now drives hundreds of them. Fail loudly instead. Same for an entry naming a language the
// dataset does not know: that would be a heading built on a typo.
{
  const countries = [...new Set(DB.providers.map((p) => CITY[p.city] && CITY[p.city].country).filter(Boolean))];
  const missing = countries.filter((c) => !(c in LOCAL));
  if (missing.length) {
    console.error('service_data: add these countries to LOCAL: ' + missing.join(', '));
    process.exit(1);
  }
  const bogus = Object.entries(LOCAL).filter(([, l]) => l !== null && !LANGS[l]);
  if (bogus.length) {
    console.error('service_data: LOCAL names languages the dataset does not have: ' +
      bogus.map(([c, l]) => c + '=' + l).join(', '));
    process.exit(1);
  }
}

const serviceSlug = (cat) => (CAT_PLURAL[cat] || cat).replace(/\s+/g, '-');
const SERVICE_SLUGS = Object.fromEntries(Object.keys(CATS).map((c) => [c, serviceSlug(c)]));
{
  const slugs = Object.values(SERVICE_SLUGS);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) { console.error('service_data: two categories share a slug: ' + dupes.join(', ')); process.exit(1); }
  // A city id equal to a service slug would make /services/<x> ambiguous between the two families.
  const clash = slugs.filter((s) => CITY[s]);
  if (clash.length) { console.error('service_data: a city id collides with a service slug: ' + clash.join(', ')); process.exit(1); }
}

// --- the model ---------------------------------------------------------------------------------
const byCity = {};
const byPair = {};
const byService = {};
DB.providers.forEach((p) => {
  if (!CITY[p.city] || !CATS[p.category]) return;
  (byCity[p.city] = byCity[p.city] || []).push(p);
  (byPair[p.city + '|' + p.category] = byPair[p.city + '|' + p.category] || []).push(p);
  (byService[p.category] = byService[p.category] || []).push(p);
});

const bestFirst = (a, b) => (EV_RANK[a.evidence] - EV_RANK[b.evidence]) || a.name.localeCompare(b.name);
Object.values(byCity).forEach((r) => r.sort(bestFirst));
Object.values(byPair).forEach((r) => r.sort(bestFirst));

const cities = {};
Object.keys(byCity).forEach((slug) => {
  const rows = byCity[slug];
  const services = [...new Set(rows.map((p) => p.category))]
    .sort((a, b) => byPair[slug + '|' + b].length - byPair[slug + '|' + a].length || CATS[a].localeCompare(CATS[b]));
  cities[slug] = Object.assign({}, CITY[slug], { rows, services, single: services.length === 1 });
});

const tally = (rows, pick) => {
  const n = {};
  rows.forEach((r) => [].concat(pick(r)).forEach((k) => { if (k) n[k] = (n[k] || 0) + 1; }));
  return n;
};

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; }
};

// A postcode, which is the only part of these free-text addresses that can be trusted. Taking the
// last comma-separated token instead produced "districts" like "Francesc Perez Cabrero 19-21 -
// 08021 Barcelone", because the sources punctuate addresses however they like. A postcode is
// either there and unambiguous or absent, and grouping by it is a real fact about where a source
// looked.
const districtOf = (area) => {
  const m = /(?:^|[^0-9])([0-9]{4,6})(?:[^0-9]|$)/.exec(String(area || ''));
  return m ? m[1] : '';
};

const pairs = {};
Object.keys(byPair).forEach((key) => {
  const [slug, cat] = key.split('|');
  const rows = byPair[key];
  const country = cities[slug].country;
  const langCounts = tally(rows, (r) => r.languages);
  const nonLocal = Object.entries(langCounts)
    .filter(([l]) => l !== LOCAL[country])
    .sort((a, b) => b[1] - a[1]);
  pairs[key] = {
    key,
    city: slug,
    category: cat,
    rows,
    n: rows.length,
    country,
    langCounts,
    nonLocal,
    evCounts: tally(rows, (r) => r.evidence),
    areas: tally(rows, (r) => districtOf(r.area)),
    sources: Object.entries(tally(rows, (r) => hostOf(r.sourceUrl)))
      .sort((a, b) => b[1] - a[1])
      .map(([host, n]) => ({ host, n, url: (rows.find((r) => hostOf(r.sourceUrl) === host) || {}).sourceUrl })),
    checked: rows.map((r) => r.checked).filter(Boolean).sort(),
    withSite: rows.filter((r) => r.url).length,
  };
});

Object.keys(byService).forEach((cat) => {
  const rows = byService[cat];
  const inCities = [...new Set(rows.map((p) => p.city))]
    .sort((a, b) => byPair[b + '|' + cat].length - byPair[a + '|' + cat].length || cities[a].name.localeCompare(cities[b].name));
  byService[cat] = { category: cat, rows, cities: inCities, n: rows.length };
});

/**
 * The two or three languages a heading may name: the most common non-local ones carried by at least
 * a fifth of the rows. A single provider's Japanese does not belong in the title of a page about
 * seventeen, and the country's own language is the one thing nobody searches for.
 */
function headlineLanguages(rows, country, max) {
  const counts = tally(rows, (r) => r.languages);
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  let pick = ranked.filter(([l, n]) => l !== LOCAL[country] && n / rows.length >= 0.2);
  if (!pick.length) pick = ranked.slice(0, 1);
  return pick.slice(0, max || 2).map(([l]) => l);
}

// Great-circle distance, for "if nobody here fits". 179 of the 250 one-and-two-provider pairs have
// a larger same-service city within 600 km, and naming it is what keeps those pages useful.
function km(a, b) {
  if (![a.lat, a.lng, b.lat, b.lng].every((x) => typeof x === 'number')) return Infinity;
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Nearest cities that actually hold this service, so a suggestion is never a dead link. */
function nearest(slug, cat, k) {
  const from = cities[slug];
  return (byService[cat] ? byService[cat].cities : [])
    .filter((other) => other !== slug)
    .map((other) => ({
      city: other,
      name: cities[other].name,
      country: cities[other].country,
      n: byPair[other + '|' + cat].length,
      km: km(from, cities[other]),
    }))
    .filter((x) => Number.isFinite(x.km))
    .sort((a, b) => a.km - b.km)
    .slice(0, k || 6);
}

/**
 * Which pages this family consists of. A child page exists only where the city holds more than one
 * service: otherwise it would be a copy of its parent.
 */
function pageList() {
  const out = [];
  Object.keys(cities).sort().forEach((slug) => {
    const c = cities[slug];
    out.push({ kind: 'city', url: '/services/' + slug, file: 'services/' + slug + '.html', city: slug, n: c.rows.length });
    if (c.single) return;
    c.services.forEach((cat) => {
      out.push({
        kind: 'pair',
        url: '/services/' + slug + '/' + SERVICE_SLUGS[cat],
        file: 'services/' + slug + '/' + SERVICE_SLUGS[cat] + '.html',
        city: slug,
        category: cat,
        n: byPair[slug + '|' + cat].length,
      });
    });
  });
  Object.keys(byService).sort().forEach((cat) => {
    out.push({
      kind: 'service',
      url: '/services/' + SERVICE_SLUGS[cat],
      file: 'services/' + SERVICE_SLUGS[cat] + '.html',
      category: cat,
      n: byService[cat].n,
    });
  });
  return out;
}

module.exports = {
  DB, CATS, LANGS, EVIDENCE, LOCAL, CITY,
  cities, pairs, services: byService,
  SERVICE_SLUGS, serviceSlug, districtOf, hostOf,
  headlineLanguages, nearest, km, pageList,
  pairOf: (slug, cat) => pairs[slug + '|' + cat],
};
