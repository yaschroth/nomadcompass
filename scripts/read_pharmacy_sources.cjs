/**
 * Reads the official lists that name a pharmacy together with a language its staff serve in, for
 * the site's cities outside Japan and Korea (those two have their own readers: the MHLW register
 * and the Seoul / district open-data files, already ingested).
 *
 * WHY SO FEW SOURCES
 *
 * The obvious place to look was the statutory pharmacy finders, and none of them records a language
 * (checked 2026-09-24): the Austrian Apothekerkammer's Apothekensuche (services and hours, no
 * languages), the German Landesapothekerkammern (BLAK, Berlin, BW, Hamburg, Hessen, Bremen) and
 * aponet.de, the Spanish colegios (COFIB Baleares filters by programme and municipality only;
 * Alicante and Sevilla have no language field; COF Madrid and Cadiz answer 403, COF Barcelona
 * refuses the connection, COF Tenerife's finder link now redirects to YouTube), the Czech, French
 * and Portuguese orders, and the Canadian colleges (BC, Alberta, Quebec). What does record one:
 *   - healthdirect's NHSD (Australia) has a languages field, but its terms forbid reproducing it
 *     "on any other website" and any use "generating revenue". Not used.
 *   - The Dubai Health Authority's Sheryan registry filters pharmacists by language, but its terms
 *     say users will not "Collect or store personal information about others", and every record
 *     is a named person. ASK PERMISSION; not read here.
 *   - Taipei's Department of Health published a "臺北市英語友善藥局" list in 2021. The Chinese
 *     announcement now answers 404, but the English one still carries the PDF, under an open
 *     licence. Seven pharmacies (TAIPEI below).
 * Beyond that, what is left are the consular lists: the FCDO's "Doctors and medical facilities: worldwide
 * list" (Open Government Licence v3.0), where a pharmacy table carries the same "English speaking
 * staff" column as the clinics, and a handful of embassy pages that name one pharmacy with its
 * language in words.
 *
 * THE RULE
 *
 *   - FCDO: English only where the row's own English column says Yes, which is the rule of
 *     scripts/parse_fcdo_lists.cjs, and this script runs that parser rather than copying it. A list
 *     with no English column is not read as a roster.
 *   - ENTRIES: each one is read by hand and carries the source's own words for the language
 *     (QUOTE). propose re-fetches the page and refuses the entry if the quote or the name is no
 *     longer on it, so a list that has dropped the pharmacy drops it here too.
 *   - The country's local language (service_data LOCAL) is never published. Nigeria's local
 *     language is English, so its FCDO pharmacies give nothing.
 *
 * TRAPS
 *
 *   - The parser's pharmacy test is /pharmac|drugstore|chemist|apotek|farmacia|pharmacie/, which
 *     misses the local words: Tartu's "Apotheka apteek Raekoja Apteek" went into the directory as a
 *     doctor. propose therefore runs the parser twice, once with --pharmacies and once without, and
 *     also takes any non-pharmacy row whose NAME is a pharmacy in a local word (LOCAL_WORD below).
 *     Those rows are reported, because the same row may already sit in the directory as a doctor.
 *   - An FCDO publication is a landing page; the lists are its HTML attachments, one per region in
 *     some countries (Greece has five). The gov.uk content API names them: /api/content/<path>
 *     gives details.attachments[].url.
 *   - The gov.uk country in a title is not always our spelling ("The Netherlands", "Czechia",
 *     "United Arab Emirates"). COUNTRY_ALIAS maps them; anything unmatched is listed by `list`.
 *   - FCDO Tanzania prints "The staff speak Swahili, Russian, French, Spanish and English" under
 *     Premier Care's pharmacies, but the sentence opens "This hospital has told us", so it is the
 *     clinic's claim, not the pharmacies'. Not taken.
 *   - The US Embassy Ljubljana page is titled "English-Speaking Doctors, Dentists & Pharmacies",
 *     but its 24-hour pharmacy page itself says nothing about language. A title on another page is
 *     not a claim about these rows. Not taken.
 *
 * STAGES
 *
 *   list     node scripts/read_pharmacy_sources.cjs list --cache <dir>
 *              reads the FCDO collection and each publication's attachments into <dir>/fcdo-index.json
 *   fetch    node scripts/read_pharmacy_sources.cjs fetch --cache <dir>
 *              fetches every FCDO attachment and every ENTRIES page once (one request a second).
 *   propose  node scripts/read_pharmacy_sources.cjs propose --cache <dir> [--out <file>]
 *              writes proposals.json ({ sources: [...], rows: [...] }), one proposals-<source>.json
 *              per source in the { pageNote, source, rows } shape ingest_register_proposals.cjs
 *              reads, and refused.json. It spawns the FCDO parser twice per attachment, so a full
 *              run takes about eight minutes.
 *
 * Then, per source file: node scripts/ingest_register_proposals.cjs <proposals-x.json> --publisher "..."
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(__dirname, 'lib', 'service_data.cjs'));
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const GOVUK = 'https://www.gov.uk';
const COLLECTION = '/government/collections/doctors-and-medical-facilities-worldwide-list';

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'pharmacy')));
const TODAY = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COUNTRY_ALIAS = {
  'The Netherlands': 'Netherlands', Netherlands: 'Netherlands', Czechia: 'Czech Republic',
  'Czech Republic': 'Czech Republic', 'United Arab Emirates': 'UAE', UAE: 'UAE',
  'South Korea': 'South Korea', 'Republic of Korea': 'South Korea', USA: 'United States',
  'The Gambia': 'Gambia', 'Bosnia and Herzegovina': 'Bosnia and Herzegovina', Türkiye: 'Turkey',
};
const OUR_COUNTRIES = new Set(Object.values(M.CITY).map((c) => c.country));
// Titles come in three shapes: "Greece: medical facilities", "Macao - List of Medical Facilities"
// and "List of medical facilities in Turkey". So the country is looked for anywhere in the title,
// longest name first ("South Africa" before "Africa"), aliases included. Hong Kong's list files
// under China because that is the country our hongkong city carries. The Jerusalem and West Bank
// list is left out on purpose: which country its addresses belong to is not ours to decide here.
const TITLE_ALIAS = { ...COUNTRY_ALIAS, 'Hong Kong': 'China', Macao: 'Macau', 'Myanmar (Burma)': 'Myanmar', Burma: 'Myanmar' };
const ourCountry = (title) => {
  const t = String(title || '');
  if (/Jerusalem|West Bank/i.test(t)) return null;
  const names = [...new Set([...OUR_COUNTRIES, ...Object.keys(TITLE_ALIAS)])].sort((a, b) => b.length - a.length);
  for (const n of names) {
    if (!new RegExp('(^|[^A-Za-z])' + n.replace(/[()]/g, '\\$&') + '($|[^A-Za-z])').test(t)) continue;
    const a = TITLE_ALIAS[n] || n;
    if (OUR_COUNTRIES.has(a)) return a;
  }
  return null;
};
// Japan and Korea have their own pharmacy readers.
const SKIP_COUNTRIES = new Set(['Japan', 'South Korea']);

// A pharmacy named in the local word. The parser's own test covers "pharmac", "farmacia",
// "pharmacie", "apotek", "chemist" and "drugstore".
const LOCAL_WORD = /\b(apteek|apotheka|apotheke|apteka|apteki|lekarna|ljekarna|lékárna|lekáreň|eczane(si)?|gyógyszertár|patika|farmacie|farmácia|φαρμακείο|nhà thuốc)\b/i;

// Embassy pages that name one pharmacy with a language in words. Read by hand 2026-09-24.
const ENTRIES = [
  {
    source: 'fr-embassy-greece',
    publisher: 'Ambassade de France en Grèce',
    url: 'https://gr.diplomatie.gouv.fr/fr/professions-medicales-et-paramedicales',
    terms: 'Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence etalab-2.0',
    pageNote: 'The French Embassy in Greece lists French-speaking doctors and health professionals, with a heading for French-speaking pharmacies.',
    rows: [
      { city: 'thessaloniki', name: 'Pharmacie Alexandra Christodoulou', languages: ['fr'], area: 'Rue D. Gounari 20, Place Navarinou, Thessaloniki', quote: 'Pharmacies francophones', must: 'CHRISTODOULOU' },
    ],
  },
  {
    source: 'fr-embassy-vietnam',
    publisher: 'Ambassade de France au Vietnam',
    url: 'https://vn.diplomatie.gouv.fr/fr/liste-de-notoriete',
    terms: 'Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence etalab-2.0',
    pageNote: 'The French Embassy in Vietnam publishes a list of doctors, clinics and pharmacies known to it, and marks the ones that serve patients in French.',
    rows: [
      { city: 'hanoi', name: 'Pharmacie Nguyen Luan', languages: ['fr'], area: '3 Trang Thi, Hoan Kiem, Hanoi', quote: 'Pharmacie Nguyen Luan (Francophone)', must: 'Nguyen Luan' },
    ],
  },
  {
    source: 'us-embassy-rwanda',
    publisher: 'U.S. Embassy in Rwanda',
    url: 'https://rw.usembassy.gov/medical-assistance/',
    terms: 'U.S. government work, not subject to copyright in the United States (17 U.S.C. 105).',
    pageNote: 'The U.S. Embassy in Kigali lists hospitals, clinics and pharmacies with the languages each one serves in.',
    rows: [
      { city: 'kigali', name: 'Kipharma', languages: ['en', 'fr'], area: 'Near La Galette, Kigali (several branches)', quote: 'Languages: English, French, Kinyarwanda', must: 'Kipharma' },
      { city: 'kigali', name: 'Pharmacie Conseil', url: 'http://www.pharmacieconseil.org/', languages: ['en', 'fr'], area: 'Kacyiru, Downtown and Gacuriro, Kigali', quote: 'Languages: English, French, Kinyarwanda', must: 'Pharmacie Conseil' },
    ],
  },
];

// Taipei City Department of Health, "English-Friendly Pharmacy in Taipei City": a PDF of the
// pharmacies that told the city, through the Taipei Pharmacists Association, that they serve in
// English and asked to be listed. Tabulated 2021-09-29 and not updated since (the English page
// was last reviewed 2022-11-29), so the note says how old it is. The Chinese announcement at
// health.gov.taipei now answers 404; the English one still holds the file.
// Licence: "Government Open Data License, Version 1.0" (english.doh.gov.taipei, Government
// Website Open Data Statement). pdftotext without -layout prints one field per line.
const TAIPEI = {
  source: 'taipei-doh-english-friendly-pharmacies',
  publisher: 'Department of Health, Taipei City Government',
  page: 'https://english.doh.gov.taipei/News_Content.aspx?n=F5BA5E70C0846DE7&sms=DFFA119D1FD5602C&s=515A0A19538D84EF',
  pdf: 'https://www-ws.gov.taipei/Download.ashx?u=LzAwMS9VcGxvYWQvMzYyL3JlbGZpbGUvMzEwMTEvODQ2MTg0Ny9lN2IwNWRjZC1hMTA5LTQ2YjItOGNlMi0wN2EyMTE2N2UwODgucGRm&n=MTEwMDkyOExpc3Qgb2YgRW5nbGlzaC1GcmllbmRseSBQaGFybWFjaWVzLnBkZg%3d%3d&icon=..pdf',
  terms: 'all data and materials published on the Taipei City Government Department of Health website that are eligible for copyright protection are provided for public use under the Government Open Data License, Version 1.0',
  pageNote: "Taipei City's Department of Health lists the pharmacies that told it, through the Taipei Pharmacists Association, that they serve customers in English. The list was drawn up in September 2021.",
  quote: 'Taipei City Government has cooperated with the Taipei Pharmacists Association to investigate the pharmacies that can provide English-language services',
};

function taipeiRows() {
  const pdf = path.join(CACHE, 'pages', 'taipei-english-friendly-pharmacies.pdf');
  if (!fs.existsSync(pdf)) return [];
  const txt = execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, '-'], { encoding: 'utf8' }).split('\r').join('');
  const out = [];
  let cur = null;
  for (const l of txt.split('\n').map((s) => s.trim())) {
    let m;
    if ((m = l.match(/^Pharmacy (.+)$/))) { cur = { name: m[1].trim() }; out.push(cur); continue; }
    if (!cur) continue;
    if ((m = l.match(/^District (.+?) District$/))) cur.district = m[1];
    // A URL that pdftotext wrapped onto the next line is incomplete, so only a whole one is kept.
    else if ((m = l.match(/^Address (.+?)(\s+https?:\/\/\S+)?$/))) cur.address = m[1].trim();
    else if ((m = l.match(/^Facebook (https?:\/\/\S+\/)$/))) cur.url = m[1];
  }
  return out;
}

// usembassy.gov sends more response headers than Node's fetch accepts (UND_ERR_HEADERS_OVERFLOW),
// so a fetch that fails outright is retried once with curl. An HTTP error is not retried.
// diplomatie.gouv.fr answers 403 to both; those two pages can be seeded into <cache>/pages by hand
// (a browser save, under the name cacheName() gives), and propose still checks the quote in them.
async function get(url) {
  let r;
  try { r = await fetch(url, { headers: { 'User-Agent': UA } }); } catch (e) {
    return execFileSync('curl', ['-s', '-L', '--fail', '--max-time', '40', '-A', UA, url], { encoding: 'utf8', maxBuffer: 64 << 20 });
  }
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.text();
}
const cacheName = (url) => url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 180) + '.html';

async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const col = JSON.parse(await get(GOVUK + '/api/content' + COLLECTION));
  const docs = col.links.documents || [];
  const index = [];
  const unmatched = [];
  for (const d of docs) {
    const country = ourCountry(d.title);
    if (!country) { unmatched.push(d.title); continue; }
    if (SKIP_COUNTRIES.has(country)) continue;
    await sleep(1000);
    let pub;
    try { pub = JSON.parse(await get(GOVUK + '/api/content' + d.base_path)); } catch (e) { console.error('  ', e.message); continue; }
    const att = (pub.details.attachments || []).filter((a) => a.attachment_type === 'html' || /^\/government\/publications\//.test(a.url || ''));
    // A /guidance/ page carries the list in its own body.
    const urls = att.length ? att.map((a) => GOVUK + a.url) : [GOVUK + d.base_path];
    for (const u of urls) index.push({ country, publication: GOVUK + d.base_path, title: d.title, url: u, updated: pub.public_updated_at });
    console.log(country.padEnd(22), urls.length, d.title);
  }
  fs.writeFileSync(path.join(CACHE, 'fcdo-index.json'), JSON.stringify(index, null, 1));
  console.log(index.length, 'attachments;', unmatched.length, 'publications for countries we do not cover (or spell differently):');
  console.log('  ' + unmatched.join(' | '));
}

async function fetchAll() {
  const index = JSON.parse(fs.readFileSync(path.join(CACHE, 'fcdo-index.json'), 'utf8'));
  const urls = [...index.map((x) => x.url), ...ENTRIES.map((e) => e.url), TAIPEI.page];
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const pdf = path.join(CACHE, 'pages', 'taipei-english-friendly-pharmacies.pdf');
  if (!fs.existsSync(pdf)) {
    const r = await fetch(TAIPEI.pdf, { headers: { 'User-Agent': UA } });
    if (r.ok) fs.writeFileSync(pdf, Buffer.from(await r.arrayBuffer())); else console.error('  taipei pdf', r.status);
  }
  let n = 0;
  for (const u of urls) {
    const f = path.join(CACHE, 'pages', cacheName(u));
    if (fs.existsSync(f)) continue;
    try { fs.writeFileSync(f, await get(u)); n++; } catch (e) { console.error('  ', e.message); }
    await sleep(1000);
  }
  console.log('fetched', n, 'of', urls.length);
}

const textOf = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, ' ');

function parse(file, country, pharmacies) {
  const a = [file, '--country', country, '--json'];
  if (pharmacies) a.push('--pharmacies');
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'parse_fcdo_lists.cjs'), ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 });
    return JSON.parse(out).rows || [];
  } catch { return []; }
}

// FCDO Slovenia's website column has slipped by a row in places: the Maribor pharmacy carries
// lekarne-ptuj.si and the Ptuj one (Toplek) lekarnaljubljana.si. A wrong link is worse than none,
// so an FCDO link is kept only when its host names the town or a word of the pharmacy's name.
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function plausibleUrl(url, name, town) {
  if (!url) return undefined;
  let host;
  try { host = fold(new URL(url).hostname).replace(/^www\./, '').replace(/[^a-z]/g, ''); } catch { return undefined; }
  const words = [fold(town), ...fold(name).split(/[^a-z]+/)].filter((w) => w.length >= 5 && !/pharmacy|hour/.test(w));
  return words.some((w) => host.includes(w)) ? url : undefined;
}

function propose() {
  const index = JSON.parse(fs.readFileSync(path.join(CACHE, 'fcdo-index.json'), 'utf8'));
  const rows = [];
  const refused = [];
  const sources = [];
  const local = (country) => M.LOCAL[country];
  const keep = (country, langs) => [...new Set(langs)].filter((l) => l !== local(country) && M.LANGS[l]);

  // --- FCDO ---
  const fcdoPubs = new Map();
  for (const it of index) {
    const f = path.join(CACHE, 'pages', cacheName(it.url));
    if (!fs.existsSync(f)) continue;
    const found = [
      ...parse(f, it.country, true).map((r) => ({ ...r, via: 'pharmacy table' })),
      ...parse(f, it.country, false).filter((r) => LOCAL_WORD.test(r.name)).map((r) => ({ ...r, via: 'local word in name' })),
    ];
    for (const r of found) {
      const city = r.town;
      if (!city || city === 'ambiguous' || !M.CITY[city]) { refused.push({ why: 'no single city of ours in the address', name: r.name, area: r.area, sourceUrl: it.url }); continue; }
      const langs = keep(it.country, r.languages || []);
      if (!langs.length) { refused.push({ why: `only the local language (${local(it.country)}) or no claim`, name: r.name, city, sourceUrl: it.url }); continue; }
      if (r.languages.length > 6) { refused.push({ why: 'more than 6 languages', name: r.name, city, sourceUrl: it.url }); continue; }
      rows.push({
        city, name: r.name, category: 'pharmacy', languages: langs, url: plausibleUrl(r.url, r.name, M.CITY[city].name), sourceUrl: it.url,
        evidence: 'official', checked: TODAY, area: r.area, quote: r.englishCell ? `English speaking staff: ${r.englishCell}` : undefined,
        sourceKey: 'fcdo', via: r.via,
      });
      fcdoPubs.set(it.publication, it.title);
    }
  }
  sources.push({
    key: 'fcdo', publisher: 'Foreign, Commonwealth & Development Office (UK)',
    url: GOVUK + COLLECTION,
    licenceOrTermsQuote: 'All content is available under the Open Government Licence v3.0, except where otherwise stated',
    pageNote: "The UK Foreign Office's list of medical facilities for this country includes pharmacies, with a column saying whether the staff speak English.",
    publications: [...fcdoPubs.keys()],
  });

  // --- ENTRIES ---
  for (const e of ENTRIES) {
    const f = path.join(CACHE, 'pages', cacheName(e.url));
    const t = fs.existsSync(f) ? textOf(fs.readFileSync(f, 'utf8')) : '';
    sources.push({ key: e.source, publisher: e.publisher, url: e.url, licenceOrTermsQuote: e.terms, pageNote: e.pageNote });
    for (const r of e.rows) {
      const country = M.CITY[r.city] && M.CITY[r.city].country;
      if (!t) { refused.push({ why: 'page not fetched', name: r.name, sourceUrl: e.url }); continue; }
      if (!t.includes(r.quote) || !t.toLowerCase().includes(r.must.toLowerCase())) { refused.push({ why: 'quote or name no longer on the page', name: r.name, sourceUrl: e.url }); continue; }
      const langs = keep(country, r.languages);
      if (!langs.length) { refused.push({ why: 'only the local language', name: r.name, sourceUrl: e.url }); continue; }
      rows.push({ city: r.city, name: r.name, category: 'pharmacy', languages: langs, url: r.url, sourceUrl: e.url, evidence: 'official', checked: TODAY, area: r.area, quote: r.quote, sourceKey: e.source });
    }
  }

  // --- Taipei ---
  {
    const f = path.join(CACHE, 'pages', cacheName(TAIPEI.page));
    const t = fs.existsSync(f) ? textOf(fs.readFileSync(f, 'utf8')) : '';
    sources.push({ key: TAIPEI.source, publisher: TAIPEI.publisher, url: TAIPEI.page, file: TAIPEI.pdf, licenceOrTermsQuote: TAIPEI.terms, pageNote: TAIPEI.pageNote });
    if (!t.includes(TAIPEI.quote)) refused.push({ why: 'the announcement no longer says what the list is', sourceUrl: TAIPEI.page });
    else for (const r of taipeiRows()) {
      if (!r.district || !r.address) { refused.push({ why: 'no district or address', name: r.name, sourceUrl: TAIPEI.pdf }); continue; }
      rows.push({
        city: 'taipei', name: r.name, category: 'pharmacy', languages: ['en'], url: r.url, sourceUrl: TAIPEI.pdf,
        evidence: 'official', checked: TODAY, area: `${r.address}, ${r.district} District`,
        quote: 'List of English-Friendly Pharmacies', sourceKey: TAIPEI.source,
      });
    }
  }

  // Same pharmacy twice (a list printed in two attachments, or both parser passes).
  const seen = new Set();
  const out = rows.filter((r) => { const k = r.city + '|' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, ''); if (seen.has(k)) return false; seen.add(k); return true; });

  // Already in the directory under another category?
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8')).providers;
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  for (const r of out) {
    const hit = db.find((p) => p.city === r.city && norm(p.name) === norm(r.name));
    if (hit) r.alreadyListedAs = hit.category;
  }
  const file = val('--out', path.join(CACHE, 'proposals.json'));
  fs.writeFileSync(file, JSON.stringify({ sources, rows: out }, null, 1));
  // And one file per source in the { source, rows } shape the register ingest reads.
  for (const s of sources) {
    const mine = out.filter((r) => r.sourceKey === s.key);
    if (!mine.length) continue;
    const { key, publications, ...source } = s;
    fs.writeFileSync(path.join(path.dirname(file), `proposals-${key}.json`), JSON.stringify({ pageNote: source.pageNote, source: { ...source, publications }, rows: mine }, null, 1));
  }
  fs.writeFileSync(path.join(path.dirname(file), 'refused.json'), JSON.stringify(refused, null, 1));
  const by = {};
  for (const r of out) by[r.city] = (by[r.city] || 0) + 1;
  console.log(out.length, 'rows,', refused.length, 'refused.', JSON.stringify(by));
}

(async () => {
  if (cmd === 'list') await list();
  else if (cmd === 'fetch') await fetchAll();
  else if (cmd === 'propose') propose();
  else { console.error('usage: node scripts/read_pharmacy_sources.cjs list|fetch|propose --cache <dir>'); process.exit(2); }
})();
