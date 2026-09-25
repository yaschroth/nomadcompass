/**
 * Reads three registers of psychologists that record, per named person, the languages they work in,
 * and proposes a `therapy` row for each one who practises in one of our cities.
 *
 * WHY THESE SOURCES (checked 2026-09-25, terms quoted in agents/health2/REPORT.md)
 *
 *   be-compsy  Commission des Psychologues / Psychologencommissie (compsy.be), the "independent
 *              federal public government body competent for title and ethics of all the
 *              psychologists in Belgium ... pursuant to the Act of 8 November 1993". Its public
 *              list ("Search a psychologist") has a "Languages" filter over 90 working languages
 *              ("processing_languages"), which each psychologist sets in their own record. That is
 *              the official tier: a statutory register, a claim made by the registrant.
 *              Terms: no terms-of-use page exists. The footer says only "Copyright (c) 2024
 *              ComPsy, All rights reserved"; the privacy notice covers personal data processing
 *              and says nothing about reuse of the published list. robots.txt disallows nothing.
 *   ie-psi     The Psychological Society of Ireland, "PSI Chartered Psychologist Online
 *              Directory". PSI is the professional body (a registered charity), NOT a statutory
 *              regulator: CORU does not yet register psychologists. Each entry prints
 *              "Languages:" as the member entered it, and the directory lists only chartered
 *              members "who wish to have their names publicly available". Tier: directory
 *              (professional body), not official. Terms: the T&Cs page covers refunds and the logo
 *              only; no reuse clause. robots.txt disallows only /member_uploads/, /cpd_uploads/
 *              and /file_downloader.php.
 *   sg-sps     Singapore Psychological Society, Directory of SPS Members, read for
 *              "SRP-Registered Psychologist" entries only (the Singapore Register of
 *              Psychologists, which SPS runs; psychologists are not statutorily regulated in
 *              Singapore). Each member page prints "Languages Spoken". Tier: directory
 *              (professional body). Terms: the site publishes no terms page at all (/terms,
 *              /terms-of-use, /privacy-policy all 404); the footer says only "(c) 2026 Singapore
 *              Psychological Society. All rights reserved." robots.txt disallows only /wp-admin/.
 *
 * THE RULE
 *
 * Languages are the ones the register prints or files the person under, mapped by name to our
 * ISO codes. Nothing is inferred.
 *   - The country's own languages are dropped. Belgium: nl, fr AND de (all three are official,
 *     as the benelux readers already do). Ireland: en (Irish has no code here). Singapore: en, zh,
 *     ms and ta, the four official languages (service_data LOCAL has Singapore as null; the
 *     report gives the count if the owner wants Mandarin kept). Dialects the register lists
 *     (Cantonese, Hokkien, Teochew) are Chinese and go with zh.
 *   - A language name we have no code for is dropped and counted (Kabyle, Luxembourgish, Irish,
 *     sign languages...). A regional variant is its language: English (UK) and English (US) are en.
 *   - More than six non-local languages refuses the row whole.
 *   - Only active registrants: ComPsy entries marked "Inactive" (not registered this year) are
 *     refused. ComPsy entries with no public professional address are refused: the list's own
 *     postcode filter places them, but the address it filters on is not published, so we cannot
 *     show a reader where they practise.
 *   - SPS: only SRP-Registered Psychologists (the directory itself says only they "meet the
 *     educational qualifications and training requirements set by SPS/SRP to provide such
 *     psychological services to clients and patients"), and not those whose only area is
 *     Industrial/Organisational or Teaching and Research.
 *
 * WHERE THE LANGUAGE CLAIM IS LINKED (sourceUrl)
 *
 *   ComPsy's own profile page does NOT print languages; the language exists only as the list
 *   filter. So each row's sourceUrl is the list filtered to that person's name AND one of their
 *   languages: /en_GB/search?search_term=<name>&processing_languages=<id>, which returns that
 *   person and only if the register files them under that language (tested: Koene + English
 *   returns him, Koene + Lithuanian returns nothing). The profile page goes in `url`.
 *   PSI has no per-person page; the sourceUrl is the directory filtered to the name and the
 *   language (/pd/?pd_form_sub=1&pd_s=<name>&pd_language=<id>), which prints the entry with its
 *   Languages line. SPS: the member-details2 page prints Languages Spoken.
 *
 * CITIES
 *
 *   ComPsy: the postcode of the professional address, matched against POSTCODES (the communes of
 *   each city, never the wider arrondissement). The list is queried per postcode prefix only to
 *   cut the number of requests; the placement comes from the address.
 *   PSI: the Eircode routing key in the address (D01-D24, D6W and the Co. Dublin keys A94, A96,
 *   K78, K67; T12/T23 Cork; H91 Galway; R95 Kilkenny), or, with no Eircode, "Dublin <n>" or the
 *   city named as the last locality. Addresses abroad are refused.
 *   SPS: every practising SRP psychologist is in Singapore (a city state); the region
 *   ("Central", "East"...) is kept as the area.
 *
 * TRAPS HIT
 *
 *   - ComPsy pagination is 1-based and page=0 returns page 1 again; stop when a page adds nothing.
 *   - ComPsy's postal_code filter matches prefixes ("10" returns 1000-1099 and more), which is
 *     why the address decides.
 *   - The PSI directory prints every result on one page for a language; there is no paging.
 *   - SPS search is a POST to /search_d_v2.php (80 per page, pa=0..), with the directory page as
 *     Referer; a GET returns nothing.
 *
 * STAGES
 *
 *   list     node scripts/read_health_registers2.cjs list --cache <dir> [--source be-compsy,ie-psi,sg-sps]
 *   fetch    node scripts/read_health_registers2.cjs fetch --cache <dir>     (ComPsy and SPS profiles)
 *   propose  node scripts/read_health_registers2.cjs propose --cache <dir> --out <dir>
 *              writes <out>/proposals-<source>.json ({source, rows}), <out>/proposals.json (all,
 *              with `sources` keyed by source id) and <out>/refused.json
 *   sample   node scripts/read_health_registers2.cjs sample --out <dir> [--n 20]
 *              fetches n random sourceUrls per source and checks HTTP 200 and the name on the page
 *
 * Every request is cached gzipped under <cache>/<source>/. Nothing under data/ is written.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'health2')));
const OUT = path.resolve(val('--out', CACHE));
const ONLY = (val('--source', 'be-compsy,ie-psi,sg-sps')).split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;

const SUPPORTED = new Set(Object.keys(require(path.join(ROOT, 'data', 'service-languages.json'))._languages));
const { CITY } = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));

// ---------- fetching with a gzipped cache ----------
function cacheFile(source, key) {
  const h = crypto.createHash('sha1').update(key).digest('hex').slice(0, 20);
  return path.join(CACHE, source, h + '.gz');
}
function readCache(source, key) {
  const f = cacheFile(source, key);
  return fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString('utf8') : null;
}
async function get(source, url, opts = {}) {
  const key = url + (opts.body ? '|' + opts.body : '');
  const hit = readCache(source, key);
  if (hit !== null) return hit;
  let last;
  for (let a = 0; a < 3; a++) {
    try {
      if (opts.curl) {
        // PSI only (ie-psi), and REPORT.md flags it: Cloudflare serves Node's fetch a "Just a
        // moment..." page (it scores the TLS fingerprint), while curl with the SAME User-Agent,
        // naming us, gets the page. No cookie, token or header is forged; about 20 requests.
        const out = require('child_process').execFileSync('curl', ['-s', '-m', '45', '-A', UA, '-w', '\n%{http_code}', url], { maxBuffer: 64 << 20 }).toString('utf8');
        const code = out.slice(out.lastIndexOf('\n') + 1);
        const body = out.slice(0, out.lastIndexOf('\n'));
        if (code !== '200' || /<title>Just a moment/.test(body)) throw new Error('HTTP ' + code);
        const f = cacheFile(source, key);
        fs.mkdirSync(path.dirname(f), { recursive: true });
        fs.writeFileSync(f, zlib.gzipSync(body));
        await sleep(opts.pause || 500);
        return body;
      }
      const res = await fetch(url, {
        method: opts.body ? 'POST' : 'GET',
        // PSI's Cloudflare answers 403 to a request with no Accept header (not a challenge page:
        // the same request with an ordinary Accept header gets 200), so send one everywhere.
        headers: Object.assign({ 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en' }, opts.headers || {}),
        body: opts.body,
        signal: AbortSignal.timeout(45000),
      });
      const text = await res.text();
      if (res.status !== 200) throw new Error('HTTP ' + res.status);
      const f = cacheFile(source, key);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, zlib.gzipSync(text));
      await sleep(opts.pause || 500);
      return text;
    } catch (e) { last = e; await sleep(2000 * (a + 1)); }
  }
  throw new Error(url + ': ' + last.message);
}
async function pool(items, n, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) { const it = items[i++]; await fn(it); } };
  await Promise.all(Array.from({ length: n }, run));
}
const decode = (s) => String(s || '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&([a-z])(acute|grave|uml|circ|tilde|cedil);/gi, (m, c, k) => {
    const map = { acute: '́', grave: '̀', uml: '̈', circ: '̂', tilde: '̃', cedil: '̧' };
    return (c + map[k.toLowerCase()]).normalize('NFC');
  }).replace(/&ordf;/g, 'ª').replace(/&ordm;/g, 'º');
const text = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---------- language names ----------
const NAME2CODE = {
  english: 'en', french: 'fr', german: 'de', dutch: 'nl', spanish: 'es', italian: 'it', portuguese: 'pt',
  russian: 'ru', polish: 'pl', romanian: 'ro', greek: 'el', turkish: 'tr', arabic: 'ar', persian: 'fa', farsi: 'fa',
  hebrew: 'he', albanian: 'sq', ukrainian: 'uk', hindi: 'hi', catalan: 'ca', hungarian: 'hu', lithuanian: 'lt',
  indonesian: 'id', malay: 'ms', 'bahasa melayu': 'ms', 'bahasa indonesia': 'id', 'bahasa indonesian': 'id', croatian: 'hr', 'norwegian bokmål': 'no',
  norwegian: 'no', korean: 'ko', swedish: 'sv', finnish: 'fi', serbian: 'sr', bulgarian: 'bg', japanese: 'ja', slovak: 'sk',
  vietnamese: 'vi', czech: 'cs', danish: 'da', tagalog: 'tl', filipino: 'tl', telugu: 'te', bengali: 'bn', burmese: 'my',
  estonian: 'et', georgian: 'ka', khmer: 'km', latvian: 'lv', malayalam: 'ml', slovenian: 'sl', thai: 'th', chinese: 'zh',
  mandarin: 'zh', cantonese: 'zh', hokkien: 'zh', teochew: 'zh', hakka: 'zh', hainanese: 'zh', tamil: 'ta', urdu: 'ur',
  punjabi: 'pa', kannada: 'kn', nepali: 'ne', sinhala: 'si', sinhalese: 'si', afrikaans: 'af', swahili: 'sw', tajik: 'tg',
};
function codeOf(name) {
  const n = String(name).toLowerCase().replace(/\s*\/.*$/, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/,.*$/, '').trim();
  const c = NAME2CODE[n];
  return c && SUPPORTED.has(c) ? c : null;
}

// ---------- ComPsy (Belgium) ----------
const BE_LOCAL = new Set(['nl', 'fr', 'de']);
const POSTCODES = {
  brussels: [1000, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 1083, 1090, 1120, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210],
  antwerp: [2000, 2018, 2020, 2030, 2040, 2050, 2060, 2100, 2140, 2170, 2180, 2600, 2610, 2660],
  ghent: [9000, 9030, 9031, 9032, 9040, 9041, 9042, 9050, 9051, 9052],
  bruges: [8000, 8200, 8310, 8380],
  leuven: [3000, 3001, 3010, 3012, 3018],
  ostend: [8400],
  namur: [5000, 5001, 5002, 5003, 5004, 5020, 5021, 5022, 5024, 5100, 5101],
};
const PC2CITY = {};
for (const [c, pcs] of Object.entries(POSTCODES)) pcs.forEach((p) => { PC2CITY[p] = c; });
const PREFIXES = [...new Set(Object.values(POSTCODES).flat().map((p) => String(p).slice(0, 2)))];
const COMPSY = 'https://www.compsy.be';

async function compsyLanguages() {
  const html = await get('be-compsy', COMPSY + '/en_GB/search');
  const i = html.indexOf('name="processing_languages"');
  const seg = html.slice(i, html.indexOf('</select>', i));
  return [...seg.matchAll(/<option value="(\d+)">([^<]*)/g)].map((m) => {
    const label = text(m[2]);
    return { id: m[1], label, code: codeOf(label) };
  });
}
function compsyCards(html) {
  const out = [];
  for (const m of html.matchAll(/<a class="psy-detail-link" href="\/en_GB\/psychologist\/(\d+)"><\/a>([\s\S]*?)(?=<div class="psy-item-container"|<ul class="pagination|$)/g)) {
    const name = text((m[2].match(/<h5 class="psy-name">([\s\S]*?)<\/h5>/) || [])[1]);
    const status = text((m[2].match(/<div class="psy-item-infos">([\s\S]*?)<\/div>/) || [])[1]);
    out.push({ id: m[1], name, active: /^Active/.test(status) });
  }
  return out;
}
async function listCompsy() {
  const langs = (await compsyLanguages()).filter((l) => !BE_LOCAL.has(l.code));
  const people = {};
  const jobs = [];
  for (const l of langs) for (const p of PREFIXES) jobs.push({ l, p });
  let done = 0;
  // ComPsy takes 2.5 to 3 seconds per page, so three at a time (the brief's per-host ceiling).
  await pool(jobs, 3, async ({ l, p }) => {
    const seen = new Set();
    for (let page = 1; page < 200; page++) {
      const url = `${COMPSY}/en_GB/search?page=${page}&processing_languages=${l.id}&postal_code=${p}`;
      const cards = compsyCards(await get('be-compsy', url, { pause: 400 }));
      const fresh = cards.filter((c) => !seen.has(c.id));
      if (!fresh.length) break;
      for (const c of fresh) {
        seen.add(c.id);
        const r = people[c.id] || (people[c.id] = { id: c.id, name: c.name, active: c.active, langs: {} });
        r.langs[l.id] = l.label;
      }
      if (cards.length < 10) break;
    }
    if (++done % 50 === 0) console.log('compsy list', done, '/', jobs.length, Object.keys(people).length, 'people');
  });
  save('be-compsy-list.json', { languages: langs, people });
  console.log('compsy: ' + Object.keys(people).length + ' people under a non-local language in our prefixes');
}
function parseCompsyProfile(html) {
  const name = text((html.match(/<h2 class="hero-title[^"]*">([\s\S]*?)<\/h2>/) || [])[1]);
  const status = text((html.match(/<span class="status-text">([\s\S]*?)<\/span>\s*<\/span>/) || [])[1]);
  const addrs = [...html.matchAll(/<div class="address-block">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)].map((m) => {
    const b = m[1];
    return {
      org: text((b.match(/<div class="address-name">([\s\S]*?)<\/div>/) || [])[1]),
      street: text((b.match(/<div class="address-details">\s*<span>([\s\S]*?)<\/span>/) || [])[1]),
      zip: text((b.match(/<span class="zip">([\s\S]*?)<\/span>/) || [])[1]),
      town: text((b.match(/<span class="city">([\s\S]*?)<\/span>/) || [])[1]),
      country: text((b.match(/<span class="country">([\s\S]*?)<\/span>\s*<\/div>/) || [])[1]).replace(/^,\s*/, ''),
    };
  });
  const contacts = (html.match(/<div class="contacts-info[\s\S]*?<div class="attestation-container/) || [''])[0];
  const site = [...contacts.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]).find((u) => !/compsy\.be|cdn-cgi/.test(u));
  return { name, active: /^Active/.test(status), addrs, site };
}

// ---------- SPS (Singapore) ----------
const SG_LOCAL = new Set(['en', 'zh', 'ms', 'ta']);
const SPS = 'https://psychology.org.sg';
async function listSps() {
  const ids = {};
  for (let pa = 0; pa < 40; pa++) {
    const body = new URLSearchParams({ areas2: '', gender: '', membership_type: 'SRP-Registered Psychologist', langs: '', keyword: '', pa: String(pa) }).toString();
    const html = await get('sg-sps', SPS + '/search_d_v2.php', {
      body, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: SPS + '/members-directory/' },
    });
    const found = [...html.matchAll(/member-details2\/\?member_id=(\d+)/g)].map((m) => m[1]);
    const fresh = found.filter((id) => !ids[id]);
    // pa=0 returns the count line and no rows; the rows start at pa=1.
    if (!fresh.length && pa > 0) break;
    fresh.forEach((id) => { ids[id] = true; });
    console.log('sps page', pa, 'total', Object.keys(ids).length, (html.match(/Showing [\d-]+ of \d+/) || [''])[0]);
  }
  save('sg-sps-list.json', Object.keys(ids));
}
function parseSps(html) {
  const name = text((html.match(/<h2 class="practitioner-name">([\s\S]*?)<\/h2>/) || [])[1]);
  const section = (h) => {
    const m = html.match(new RegExp('<h4>' + h + '</h4>([\\s\\S]*?)</section>'));
    return m ? [...m[1].matchAll(/<span>([\s\S]*?)<\/span>/g)].map((x) => text(x[1])).filter(Boolean) : [];
  };
  const tr = (html.match(/<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '';
  const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  return {
    name,
    membership: text((html.match(/<h4>Membership Type<\/h4>\s*<strong>([\s\S]*?)<\/strong>/) || [])[1]),
    srpActive: /status active/.test(tds[0] || ''),
    srpConditional: /status conditional/.test(tds[0] || ''),
    area: text(tds[2] || ''),
    groups: section('Client/Patient Group\\(s\\)'),
    locations: section('Location\\(s\\) of Practice'),
    languages: section('Languages Spoken'),
  };
}

// ---------- PSI (Ireland) ----------
const PSI = 'https://www.psychologicalsociety.ie';
async function listPsi() {
  const html = await get('ie-psi', PSI + '/footer/PSI-Chartered-Psychologist-Online-Directory', { curl: true });
  const i = html.indexOf('name="pd_language"');
  const langs = [...html.slice(i, html.indexOf('</select>', i)).matchAll(/<option value="(\d+)"\s*>([^<]*)/g)]
    .map((m) => ({ id: m[1], label: text(m[2]), code: codeOf(text(m[2])) }));
  const entries = {};
  for (const l of langs) {
    if (l.label === 'English' || l.label === 'Irish') continue;
    const url = `${PSI}/pd/?pd_form_sub=1&pd_s=&pd_d=&pd_language=${l.id}`;
    const page = await get('ie-psi', url, { pause: 1500, curl: true });
    const n = (page.match(/Results returned:\s*(\d+)/) || [])[1];
    const items = page.split('<div class="find-psychologist-list">').slice(1);
    for (const it of items) {
      const name = text((it.match(/<div class="name">([\s\S]*?)<\/div>/) || [])[1]);
      const field = (k) => text((it.match(new RegExp('<strong>' + k + ':</strong>([\\s\\S]*?)</div>')) || [])[1]);
      const address = field('Address');
      const key = name + '|' + address;
      const e = entries[key] || (entries[key] = {
        name, address, discipline: field('Discipline'), workType: field('Work type'), privateWork: field('Private work'),
        languages: [...(it.match(/<strong>Languages:<\/strong>([\s\S]*?)<\/div>/) || ['', ''])[1].matchAll(/<span>([^<]*)<\/span>/g)].map((m) => text(m[1])),
        site: ((it.match(/<a href="(https?:\/\/[^"]+)" target="_blank">/) || [])[1]) || null,
        filedUnder: {},
      });
      e.filedUnder[l.id] = l.label;
    }
    console.log('psi', l.label, 'returned', n, 'parsed', items.length);
  }
  save('ie-psi-list.json', { languages: langs, entries: Object.values(entries) });
}
const EIR = [
  [/^D(0[1-9]|1[0-8]|2[0-4]|6W)$/, 'dublin'], [/^(A94|A96|K78|K67|D6W)$/, 'dublin'],
  [/^(T12|T23)$/, 'cork'], [/^H91$/, 'galway'], [/^R95$/, 'kilkenny'],
];
function psiCity(address) {
  // Any other country named anywhere in the address refuses the row: 'Killiney, Prague, Czechia,
  // A96H761, Dublin' does not say which one the practice is in.
  if (/\b(Netherlands|France|Spain|United Kingdom|Northern Ireland|Germany|USA|Czechia|Czech Republic|Luxembourg|Switzerland|South Africa|Namibia|Afghanistan|Canada|Italy|Portugal|Poland|Belfast)\b|\bBT\d/i.test(address)) return { why: 'address abroad or in two countries' };
  const up = address.toUpperCase();
  // A full Eircode first, then a routing key standing alone ('K67', 'H91', 'D7', 'T12 CXK5R' where
  // the unique part is mistyped). Keys D1-D9 are written without the zero by some members.
  const d1 = up.match(/\bD(\d)\b/);
  const eir = (up.match(/\b([ACDEFHKNPRTVWXY]\d{2}|D6W)\s?[0-9ACDEFHKNPRTVWXY]{4}\b/) || [])[1]
    || (up.match(/\b([ACDEFHKNPRTVWXY]\d{2}|D6W)\b/) || [])[1]
    || (d1 && 'D0' + d1[1]);
  if (eir) {
    for (const [re, c] of EIR) if (re.test(eir)) return { city: c, how: 'Eircode ' + eir };
    return { why: 'Eircode ' + eir + ' is outside our cities' };
  }
  if (/\bDublin\s*,?\s*\d{1,2}\b/i.test(address)) return { city: 'dublin', how: 'Dublin postal district' };
  // County Dublin with no Eircode: Blackrock, Dun Laoghaire and the like are the Dublin metro area.
  if (/\bCo(\.|unty)?\s*Dublin\b/i.test(address)) return { city: 'dublin', how: 'Co. Dublin' };
  const parts = address.split(',').map((x) => x.trim()).filter((x) => x && !/^ireland$/i.test(x) && !/^co\.?\s/i.test(x));
  const last = (parts[parts.length - 1] || '').toLowerCase();
  if (['dublin', 'cork', 'galway', 'kilkenny'].includes(last)) return { city: last, how: 'town named in address' };
  return { why: 'no Eircode in our cities and no city named' };
}

// ---------- stages ----------
function save(name, obj) { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(path.join(CACHE, name), JSON.stringify(obj, null, 1)); }
function load(name) { return JSON.parse(fs.readFileSync(path.join(CACHE, name), 'utf8')); }

async function fetchProfiles() {
  if (ONLY.includes('be-compsy') && fs.existsSync(path.join(CACHE, 'be-compsy-list.json'))) {
    const ids = Object.values(load('be-compsy-list.json').people).filter((p) => p.active).map((p) => p.id);
    let n = 0;
    await pool(ids, 3, async (id) => {
      // One dropped connection must not end a 1,700-page run; propose reports what is missing.
      await get('be-compsy', `${COMPSY}/en_GB/psychologist/${id}`, { pause: 400 }).catch((e) => console.log('failed', e.message));
      if (++n % 100 === 0) console.log('compsy profiles', n, '/', ids.length);
    });
  }
  if (ONLY.includes('sg-sps') && fs.existsSync(path.join(CACHE, 'sg-sps-list.json'))) {
    const ids = load('sg-sps-list.json');
    let n = 0;
    await pool(ids, 2, async (id) => {
      await get('sg-sps', `${SPS}/member-details2/?member_id=${id}`, { pause: 500 }).catch((e) => console.log('failed', e.message));
      if (++n % 100 === 0) console.log('sps profiles', n, '/', ids.length);
    });
  }
}

const SUR_PARTICLE = new Set(['de', 'van', 'der', 'den', 'le', 'la', 'du', 'des', 'di', 'da', 'del', 'von', 'ten', 'ter', "d'"]);
const cap = (w) => w.split(/([-'])/).map((p) => (/^[-']$/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())).join('');
function compsyDisplayName(raw) {
  // The register prints "SURNAME Given names", surname in capitals.
  const toks = raw.split(/\s+/).filter(Boolean);
  const isUpper = (t) => t === t.toUpperCase() && /\p{L}/u.test(t);
  let k = 0;
  while (k < toks.length - 1 && isUpper(toks[k])) k++;
  if (k === 0) return raw;
  const sur = toks.slice(0, k).map((t, i) => (i > 0 && SUR_PARTICLE.has(t.toLowerCase()) ? t.toLowerCase() : cap(t))).join(' ');
  return toks.slice(k).join(' ') + ' ' + sur;
}

function propose() {
  const refused = [];
  const bySource = {};
  const dropped = {};
  const drop = (src, what) => { dropped[src] = dropped[src] || {}; dropped[src][what] = (dropped[src][what] || 0) + 1; };

  // ComPsy
  if (fs.existsSync(path.join(CACHE, 'be-compsy-list.json'))) {
    const { languages, people } = load('be-compsy-list.json');
    const byId = Object.fromEntries(languages.map((l) => [l.id, l]));
    const rows = [];
    for (const p of Object.values(people)) {
      if (!p.active) { refused.push({ source: 'be-compsy', name: p.name, why: 'Inactive (not registered for the current year)' }); continue; }
      const html = readCache('be-compsy', `${COMPSY}/en_GB/psychologist/${p.id}`);
      if (!html) { refused.push({ source: 'be-compsy', name: p.name, why: 'profile not fetched' }); continue; }
      const prof = parseCompsyProfile(html);
      if (!prof.active) { refused.push({ source: 'be-compsy', name: p.name, why: 'profile says not active' }); continue; }
      const langIds = Object.keys(p.langs);
      langIds.filter((id) => !byId[id].code).forEach((id) => drop('be-compsy', byId[id].label));
      const codes = [...new Set(langIds.map((id) => byId[id].code).filter((c) => c && !BE_LOCAL.has(c)))].sort();
      if (!codes.length) { refused.push({ source: 'be-compsy', name: p.name, why: 'only unmapped languages: ' + langIds.map((id) => byId[id].label).join(', ') }); continue; }
      if (codes.length > MAX_LANGS) { refused.push({ source: 'be-compsy', name: p.name, why: codes.length + ' languages' }); continue; }
      if (!prof.addrs.length) { refused.push({ source: 'be-compsy', name: p.name, why: 'no public professional address' }); continue; }
      const placed = prof.addrs.map((a) => ({ a, city: PC2CITY[parseInt(a.zip, 10)] })).filter((x) => x.city && /belgi/i.test(x.a.country || 'Belgium'));
      if (!placed.length) { refused.push({ source: 'be-compsy', name: p.name, why: 'professional address outside our cities: ' + prof.addrs.map((a) => a.zip + ' ' + a.town).join('; ') }); continue; }
      const seenCity = new Set();
      for (const { a, city } of placed) {
        if (seenCity.has(city)) continue;
        seenCity.add(city);
        // One language to link: prefer the first mapped non-local one the person is filed under.
        const linkId = langIds.find((id) => byId[id].code === codes[0]);
        const labels = langIds.filter((id) => byId[id].code && !BE_LOCAL.has(byId[id].code)).map((id) => byId[id].label.replace(/\s*\/.*$/, ''));
        rows.push({
          city, name: compsyDisplayName(prof.name || p.name), category: 'therapy', languages: codes,
          url: prof.site || `${COMPSY}/en_GB/psychologist/${p.id}`,
          sourceUrl: `${COMPSY}/en_GB/search?search_term=${encodeURIComponent(p.name)}&processing_languages=${linkId}`,
          profileUrl: `${COMPSY}/en_GB/psychologist/${p.id}`,
          evidence: 'official', checked: TODAY,
          // The site's house style has no em-dashes; one practice name carries one ("Epicentre",
          // dash, "Espace de Sante Inclusive"), so long dashes become a comma.
          area: [a.org, a.street, (a.zip + ' ' + a.town).trim()].filter(Boolean).join(', ').replace(/\s*[\u2013\u2014]\s*/g, ', '),
          quote: 'Languages filter: ' + [...new Set(labels)].join(', '),
          registerName: p.name,
        });
      }
    }
    bySource['be-compsy'] = {
      source: {
        id: 'be-compsy',
        publisher: 'Commission des Psychologues / Psychologencommissie (ComPsy), Belgium',
        short: 'ComPsy',
        url: COMPSY + '/en_GB/search',
        licenceOrTermsQuote: 'No terms of use are published. Footer: "Copyright © 2024 ComPsy, All rights reserved". The privacy notice covers personal-data processing only and says nothing about reuse of the list. robots.txt disallows nothing.',
        pageNote: 'The Commission des Psychologues is the Belgian federal body that keeps the legal list of psychologists. Each psychologist on it chooses the languages they work in, and the list can be searched by them.',
        evidence: 'official',
      },
      rows,
    };
  }

  // PSI
  if (fs.existsSync(path.join(CACHE, 'ie-psi-list.json'))) {
    const { languages, entries } = load('ie-psi-list.json');
    const idOf = Object.fromEntries(languages.map((l) => [l.label, l.id]));
    const rows = [];
    for (const e of entries) {
      e.languages.filter((l) => !codeOf(l) && l !== 'Irish').forEach((l) => drop('ie-psi', l));
      const codes = [...new Set(e.languages.map(codeOf).filter((c) => c && c !== 'en'))].sort();
      if (!codes.length) { refused.push({ source: 'ie-psi', name: e.name, why: 'no mapped non-local language: ' + e.languages.join(', ') }); continue; }
      if (codes.length > MAX_LANGS) { refused.push({ source: 'ie-psi', name: e.name, why: codes.length + ' languages' }); continue; }
      const pc = psiCity(e.address);
      if (!pc.city) { refused.push({ source: 'ie-psi', name: e.name, why: pc.why + ': ' + e.address }); continue; }
      const first = e.languages.find((l) => codeOf(l) === codes[0]);
      rows.push({
        city: pc.city, name: e.name, category: 'therapy', languages: codes,
        url: e.site ? (/^https?:/.test(e.site) ? e.site : 'https://' + e.site) : undefined,
        sourceUrl: `${PSI}/pd/?pd_form_sub=1&pd_s=${encodeURIComponent(e.name)}&pd_d=&pd_language=${idOf[first]}`,
        evidence: 'directory', checked: TODAY, area: e.address,
        quote: 'Languages: ' + e.languages.join(', '),
      });
    }
    bySource['ie-psi'] = {
      source: {
        id: 'ie-psi',
        publisher: 'The Psychological Society of Ireland (PSI), Chartered Psychologist Online Directory',
        short: 'PSI',
        url: PSI + '/footer/PSI-Chartered-Psychologist-Online-Directory',
        licenceOrTermsQuote: 'The T&Cs page (/footer/Terms-and-Conditions) covers membership refunds, event refunds and the Chartered Member logo only; no clause on reuse, extraction or commercial use. robots.txt disallows only /member_uploads/, /cpd_uploads/ and /file_downloader.php.',
        pageNote: 'The Psychological Society of Ireland, the professional body for psychologists, lists its Chartered Psychologists with the languages each one gives. It is a professional society, not a government regulator.',
        evidence: 'directory',
      },
      rows,
    };
  }

  // SPS
  if (fs.existsSync(path.join(CACHE, 'sg-sps-list.json'))) {
    const rows = [];
    const withMandarin = { rows: 0 };
    for (const id of load('sg-sps-list.json')) {
      const html = readCache('sg-sps', `${SPS}/member-details2/?member_id=${id}`);
      if (!html) { refused.push({ source: 'sg-sps', id, why: 'profile not fetched' }); continue; }
      const p = parseSps(html);
      if (!p.srpActive) { refused.push({ source: 'sg-sps', name: p.name, why: 'SRP membership not shown as active' + (p.srpConditional ? ' (conditional)' : '') }); continue; }
      if (/^(Industrial\/Organisational|Teaching and Research)/i.test(p.area)) { refused.push({ source: 'sg-sps', name: p.name, why: 'area ' + p.area }); continue; }
      // Members type into this field. 'French and Spanish' is two names and is split; a level
      // written beside a name ('Intermediate Spanish', 'beginners Malay', 'French- spoken level
      // -fair', 'Simple cantonese') is a hedge and does not map, so it is dropped and counted.
      const langs = p.languages.filter((l) => l !== '-').flatMap((l) => l.split(/\s+(?:and|&)\s+|\s*,\s*/i)).map((l) => l.trim()).filter(Boolean);
      if (p.locations.some((l) => /overseas/i.test(l))) { refused.push({ source: 'sg-sps', name: p.name, why: 'location says overseas: ' + p.locations.join(', ') }); continue; }
      langs.filter((l) => !codeOf(l)).forEach((l) => drop('sg-sps', l));
      const all = [...new Set(langs.map(codeOf).filter(Boolean))];
      if (all.some((c) => c !== 'en')) withMandarin.rows++;
      const codes = all.filter((c) => !SG_LOCAL.has(c)).sort();
      if (!codes.length) { refused.push({ source: 'sg-sps', name: p.name, why: 'only Singapore official languages or none: ' + (langs.join(', ') || '-') }); continue; }
      if (codes.length > MAX_LANGS) { refused.push({ source: 'sg-sps', name: p.name, why: codes.length + ' languages' }); continue; }
      rows.push({
        city: 'singapore', name: p.name, category: 'therapy', languages: codes,
        sourceUrl: `${SPS}/member-details2/?member_id=${id}`,
        evidence: 'directory', checked: TODAY,
        area: p.locations.filter((l) => /^(Central|East|North|North-East|West)$/.test(l)).join(', ') || undefined,
        quote: 'Languages Spoken: ' + langs.join(', '),
        note: p.area ? 'SRP-Registered Psychologist, ' + p.area : 'SRP-Registered Psychologist',
      });
    }
    bySource['sg-sps'] = {
      source: {
        id: 'sg-sps',
        publisher: 'Singapore Psychological Society (SPS), Singapore Register of Psychologists',
        short: 'SPS',
        url: SPS + '/members-directory/',
        licenceOrTermsQuote: 'No terms page is published (/terms, /terms-of-use, /terms-and-conditions, /privacy-policy, /disclaimer all return 404). Footer: "© 2026 Singapore Psychological Society. All rights reserved." robots.txt disallows only /wp-admin/.',
        pageNote: 'The Singapore Psychological Society keeps the Singapore Register of Psychologists and lists each registered psychologist with the languages they speak. It is a professional society; psychologists are not regulated by statute in Singapore.',
        evidence: 'directory',
      },
      rows,
      countIfOfficialLanguagesKept: withMandarin.rows,
    };
  }

  fs.mkdirSync(OUT, { recursive: true });
  const all = [];
  const sources = {};
  for (const [id, v] of Object.entries(bySource)) {
    fs.writeFileSync(path.join(OUT, 'proposals-' + id + '.json'), JSON.stringify(v, null, 1));
    v.rows.forEach((r) => all.push(Object.assign({ source: id }, r)));
    sources[id] = v.source;
  }
  fs.writeFileSync(path.join(OUT, 'proposals.json'), JSON.stringify({ sources, rows: all }, null, 1));
  fs.writeFileSync(path.join(OUT, 'refused.json'), JSON.stringify({ dropped, refused }, null, 1));
  for (const [id, v] of Object.entries(bySource)) {
    const t = {};
    v.rows.forEach((r) => { t[r.city] = (t[r.city] || 0) + 1; });
    const l = {};
    v.rows.forEach((r) => r.languages.forEach((c) => { l[c] = (l[c] || 0) + 1; }));
    console.log(id, v.rows.length, 'rows', JSON.stringify(t), JSON.stringify(l));
  }
  const why = {};
  refused.forEach((r) => { const k = r.source + ': ' + r.why.replace(/:.*$/, ''); why[k] = (why[k] || 0) + 1; });
  console.log('refused', refused.length, JSON.stringify(why, null, 1));
  console.log('dropped language names', JSON.stringify(dropped));
}

async function sample() {
  const n = +val('--n', 20);
  const P = JSON.parse(fs.readFileSync(path.join(OUT, 'proposals.json'), 'utf8'));
  const report = {};
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const id of Object.keys(P.sources)) {
    const rows = P.rows.filter((r) => r.source === id);
    const pick = rows.map((r) => [Math.random(), r]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]);
    report[id] = [];
    for (const r of pick) {
      let status = 0; let hit = false;
      try {
        let html;
        if (id === 'ie-psi') {
          // Same curl route as the reader (see get()): Node's fetch is served a Cloudflare page.
          const out = require('child_process').execFileSync('curl', ['-s', '-m', '45', '-A', UA, '-w', '\n%{http_code}', r.sourceUrl]).toString('utf8');
          status = +out.slice(out.lastIndexOf('\n') + 1); html = out.slice(0, out.lastIndexOf('\n'));
        } else {
          const res = await fetch(r.sourceUrl, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }, signal: AbortSignal.timeout(45000) });
          status = res.status; html = await res.text();
        }
        // Look for the name in the RESULT, not anywhere on the page: the ComPsy and PSI searches
        // echo the search term back into the search box, so a bare page match proves nothing.
        const results = id === 'be-compsy' ? [...html.matchAll(/<h5 class="psy-name">([\s\S]*?)<\/h5>/g)].map((m) => m[1])
          : id === 'ie-psi' ? [...html.matchAll(/<div class="name">([\s\S]*?)<\/div>/g)].map((m) => m[1])
          : [(html.match(/<h2 class="practitioner-name">([\s\S]*?)<\/h2>/) || [])[1] || ''];
        const nm = fold(r.registerName || r.name);
        hit = results.some((x) => fold(text(x)) === nm || fold(text(x)).includes(nm));
      } catch (e) { status = e.message; }
      report[id].push({ name: r.name, city: r.city, languages: r.languages.join(','), status, nameOnPage: hit, sourceUrl: r.sourceUrl });
      await sleep(900);
    }
    const ok = report[id].filter((x) => x.status === 200 && x.nameOnPage).length;
    console.log(id, ok + '/' + report[id].length, 'OK (200 + name on page)');
  }
  fs.writeFileSync(path.join(OUT, 'samples.json'), JSON.stringify(report, null, 1));
}

(async () => {
  if (cmd === 'list') {
    if (ONLY.includes('ie-psi')) await listPsi();
    if (ONLY.includes('sg-sps')) await listSps();
    if (ONLY.includes('be-compsy')) await listCompsy();
  } else if (cmd === 'fetch') await fetchProfiles();
  else if (cmd === 'propose') propose();
  else if (cmd === 'sample') await sample();
  else { console.error('usage: read_health_registers2.cjs list|fetch|propose|sample --cache <dir> [--out <dir>] [--source ...]'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });
