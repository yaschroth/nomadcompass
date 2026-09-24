/**
 * Reads three German statutory registers that publish, per named member, the foreign languages that
 * member works in, and whose terms do not forbid reuse. Everything else checked in Germany (about 60
 * chambers and associations of doctors, dentists, psychotherapists, vets, tax advisers and lawyers)
 * either has no language field, could not be reached, or forbids reuse; the list and the quotes are
 * in the research folder's REPORT.md, not here.
 *
 * THE THREE SOURCES
 *
 *   kvhh    Kassenärztliche Vereinigung Hamburg, "Arzt- und Psychotherapeutensuche".
 *           A statutory body (Körperschaft des öffentlichen Rechts) listing every doctor and
 *           psychotherapist in Hamburg who treats statutory patients. Each entry has "Fremdsprachen:",
 *           which the practice reports to the KV. Cities: hamburg.
 *           Query: plain GET, JSON, the same endpoint the page's own script calls:
 *             /medical-staff/physician-finder/query?query[name]=&query[location]=
 *               &query[knowsLanguage]=Englisch&offset=0&limit=200
 *           The response carries the full option list (61 languages) and HTML cards; the language list
 *           of one doctor is not in the card, only on the detail page. So we ask once per language and
 *           a doctor's languages are the languages whose answer contained them. That is the register's
 *           own filter, so it is the same claim the detail page prints (checked on 20 by hand).
 *           Terms: kvhh.net/de/impressum.html and /de/haftungsausschluss.html (read 2026-09-24) say
 *           nothing about reuse, copying or databases. robots.txt disallows only /neos/.
 *
 *   ptknrw  Psychotherapeutenkammer Nordrhein-Westfalen, "Psychotherapeutensuche". The statutory
 *           chamber of every psychotherapist in NRW. A member asks to be listed and fills in "Die
 *           Therapie kann in folgenden Fremdsprachen erfolgen" (therapy can be given in these foreign
 *           languages). The chamber "behält sich das Recht zur Prüfung, redaktionellen Korrektur oder
 *           Kürzung der Selbstauskünfte vor". Cities: cologne, dusseldorf, munster.
 *           Query: the search form is a POST, but stateless: the hidden fields (__trustedProperties,
 *           __referrer) come from the page itself and need no cookie. Every hit comes back on one page.
 *           The detail page is a plain GET and is where the sentence above is printed, so `fetch` reads
 *           it and `propose` takes the languages from it, not from the filter.
 *           Terms: ptk-nrw.de/impressum has no copyright or reuse clause at all (read 2026-09-24);
 *           robots.txt "Allow: /". The Datenschutz page says a member can withdraw the entry by e-mail,
 *           which is a reason to re-read before every refresh (a withdrawn member must disappear).
 *
 *   rakfr   Rechtsanwaltskammer Freiburg, "Anwaltssuche". The statutory bar of the Freiburg district.
 *           Each member page has "Fremdsprachen". Cities: freiburg, konstanz.
 *           Query: POST to the site's own wp-admin/admin-ajax.php (action=get_ajax_posts,
 *           type=getMap, fremdsprache=<term id>, anzeigen=300, page=N), JSON. Every record carries its
 *           taxonomy classes, and tax-mitglied-fremdsprache-* lists ALL of that member's languages,
 *           so one language query returns the complete language list of each hit.
 *           TRAP: anzeigen=5000 (to get everything at once) crashes WordPress ("kritischer Fehler");
 *           300 per page works. TRAP: the default sort is random, so paging needs sort=nameasc.
 *           Terms: rak-freiburg.de/impressum: "Sie können die hier veröffentlichten Informationen
 *           speichern und Verknüpfungen zu unseren Seiten herstellen. ... Die Informationen dürfen nicht
 *           verändert oder verfälscht werden." So: store, link, credit, and do not alter.
 *
 * THE RULE
 *
 * A language is published only where the register names it for that member. German is never added
 * (these are German registers; it is the local language). "Gebärdensprache" (sign language) and
 * "Latein" are not working languages for our purpose and are dropped. A member with more than six
 * named foreign languages is refused whole, like everywhere else in the directory. A language name
 * we cannot map to one ISO 639-1 code ("Serbokroatisch", "Kurdisch", "Aramäisch") is dropped and
 * listed in refused.json; it never becomes a guess.
 *
 * Only rows whose address is in one of our cities count; the registers cover whole states/districts.
 *
 * STAGES
 *
 *   list     node scripts/read_de_chambers.cjs list --source kvhh|ptknrw|rakfr --cache <dir>
 *   fetch    node scripts/read_de_chambers.cjs fetch --source ptknrw --cache <dir>   (detail pages)
 *   propose  node scripts/read_de_chambers.cjs propose --source kvhh|ptknrw|rakfr --cache <dir>
 *              writes <dir>/<source>/proposals.json and refused.json
 *
 * There is no ingest stage on purpose: the owner decides per source (see the research REPORT).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const SOURCE = val('--source');
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'de-chambers')));
const DIR = path.join(CACHE, SOURCE || '_');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;

// German language names as the three registers print them, to ISO 639-1. Parentheses are cut first
// ("Hindi (Indien)", "Tamilisch (Singapur, Sri Lanka)"), then the part before " / " is tried as well
// ("Persisch / Farsi", "Aserbaidschanisch / Azeri").
const LANG = {
  englisch: 'en', französisch: 'fr', spanisch: 'es', italienisch: 'it', russisch: 'ru', türkisch: 'tr',
  polnisch: 'pl', arabisch: 'ar', persisch: 'fa', farsi: 'fa', portugiesisch: 'pt', griechisch: 'el',
  neugriechisch: 'el', chinesisch: 'zh', japanisch: 'ja', koreanisch: 'ko', niederländisch: 'nl',
  ukrainisch: 'uk', rumänisch: 'ro', ungarisch: 'hu', tschechisch: 'cs', kroatisch: 'hr', serbisch: 'sr',
  bulgarisch: 'bg', vietnamesisch: 'vi', hindi: 'hi', urdu: 'ur', tamilisch: 'ta', bengali: 'bn',
  thai: 'th', indonesisch: 'id', malaiisch: 'ms', dänisch: 'da', schwedisch: 'sv', norwegisch: 'no',
  finnisch: 'fi', estnisch: 'et', lettisch: 'lv', litauisch: 'lt', slowakisch: 'sk', slowenisch: 'sl',
  albanisch: 'sq', hebräisch: 'he', georgisch: 'ka', grusinisch: 'ka', afrikaans: 'af', kisuaheli: 'sw',
  suaheli: 'sw', nepali: 'ne', panjabi: 'pa', katalanisch: 'ca', tagalog: 'tl', khmer: 'km', birmanisch: 'my',
  singhalesisch: 'si', tadschikisch: 'tg', kannada: 'kn', telugu: 'te', malayalam: 'ml',
};
// Not a working language here, and not counted towards the six.
const IGNORE = /^(deutsch|gebärdensprache|latein)$/;
function langCode(name) {
  const base = String(name).toLowerCase().replace(/\s*\(.*$/, '').trim();
  if (IGNORE.test(base)) return { ignore: true };
  for (const part of [base, ...base.split(/\s*\/\s*/)]) if (LANG[part]) return { code: LANG[part] };
  return { unknown: base };
}
function codesOf(names) {
  const named = names.map((n) => ({ n, ...langCode(n) })).filter((x) => !x.ignore);
  return {
    named: named.map((x) => x.n),
    codes: [...new Set(named.filter((x) => x.code).map((x) => x.code))],
    unknown: named.filter((x) => x.unknown).map((x) => x.n),
  };
}

const decode = (s) => String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const flat = (h) => decode(String(h).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ');

async function http(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 50000);
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) }, signal: c.signal });
      clearTimeout(t);
      if (r.status === 200) return await r.text();
      console.log(`  HTTP ${r.status} ${url}`);
    } catch (e) { console.log(`  ${e.name} ${url}`); }
    await sleep(4000 * (a + 1));
  }
  return null;
}
const save = (f, o) => { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1)); };
const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

// ============================================================================ kvhh
const KVHH = 'https://www.kvhh.net';
const kvhhQuery = (lang, offset) => `${KVHH}/medical-staff/physician-finder/query?query%5Bname%5D=&query%5Blocation%5D=` +
  `&query%5BknowsLanguage%5D=${encodeURIComponent(lang)}&offset=${offset}&limit=200`;

async function kvhhList() {
  const first = JSON.parse(await http(kvhhQuery('Englisch', 0)));
  const langs = first.options.knownLanguages;
  const out = fs.existsSync(path.join(DIR, 'list.json')) ? load('list.json') : { langs: {}, cards: {} };
  for (const lang of langs) {
    if (out.langs[lang]) continue;
    if (langCode(lang).ignore) continue;
    const ids = [];
    for (let off = 0; ; off += 200) {
      const j = JSON.parse(await http(kvhhQuery(lang, off)));
      for (const r of j.results.results) {
        const href = (r.content.match(/href="(\/de\/medicalregister\/[^"]+)"/) || [])[1];
        if (!href) continue;
        ids.push(href);
        out.cards[href] = r.content.replace(/<svg[\s\S]*?<\/svg>/g, '');
      }
      if (off + 200 >= j.results.totalNumberOfResults) break;
      await sleep(1500);
    }
    out.langs[lang] = ids;
    console.log(`  ${lang}: ${ids.length}`);
    save('list.json', out);
    await sleep(1500);
  }
  console.log(`${Object.keys(out.cards).length} distinct entries`);
}

// Psychologists and child psychotherapists are "therapy"; physicians, including psychiatrists, are
// "doctor". The first line of the card is the title the KV prints ("Fachärztin für Urologie",
// "Psychologischer Psychotherapeut", "Kinder- und Jugendlichenpsychotherapeutin").
// Doctors whose title is psychotherapy itself ("Psychotherapeutisch tätige Ärztin", "Facharzt für
// Psychotherapeutische Medizin", "... Psychosomatische Medizin und Psychotherapie") are "therapy" too;
// psychiatrists stay "doctor".
const THERAPIST = /^(Psychologische[r]? Psychotherapeut|Kinder- und Jugendlichenpsychotherapeut|Psychotherapeut|Psychotherapeutisch tätige|Fach(arzt|ärztin) für (Psychotherapeutische Medizin|Psychosomatische Medizin))/;
// Specialties no patient walks in to: they work on samples or on referral from another doctor.
const NOT_WALK_IN = /Pathologie|Labormedizin|Laboratoriumsmedizin|Mikrobiologie|Transfusionsmedizin|Neuropathologie|Humangenetik/;

function kvhhPropose() {
  const L = load('list.json');
  const byId = {};
  for (const [lang, ids] of Object.entries(L.langs)) for (const id of ids) (byId[id] = byId[id] || []).push(lang);
  const rows = []; const refused = [];
  for (const [id, names] of Object.entries(byId)) {
    const card = L.cards[id];
    const name = decode((card.match(/<h2[^>]*>([^<]*)</) || [])[1] || '').trim();
    const c1 = flat((card.match(/content1___[^"]*">([\s\S]*?)<\/div>/) || [])[1] || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const addr = c1.find((l) => /^\d{5} /.test(l)) || '';
    const street = c1[c1.indexOf(addr) - 1] || '';
    const web = decode((card.match(/<a href="(https?:\/\/[^"]+)">Website besuchen/) || [])[1] || '') || undefined;
    const { named, codes, unknown } = codesOf(names);
    const base = { name, id };
    if (!/ Hamburg\b/.test(addr)) { refused.push({ ...base, why: 'not in Hamburg', addr }); continue; }
    if (NOT_WALK_IN.test(c1[0] || '')) { refused.push({ ...base, why: 'not a walk-in specialty', specialty: c1[0] }); continue; }
    if (named.length > MAX_LANGS) { refused.push({ ...base, why: `${named.length} languages`, named }); continue; }
    if (unknown.length) refused.push({ ...base, why: 'unmapped language dropped', unknown });
    if (!codes.length) continue;
    const district = (addr.match(/\(([^)]+)\)/) || [])[1];
    rows.push({
      city: 'hamburg', name, category: THERAPIST.test(c1[0] || '') ? 'therapy' : 'doctor', languages: codes,
      url: web, sourceUrl: KVHH + id, evidence: 'official', checked: TODAY,
      area: [street, district].filter(Boolean).join(', ') || undefined,
      specialty: c1[0], quote: 'Fremdsprachen: ' + named.join(', '),
    });
  }
  return { rows, refused };
}

// ============================================================================ ptknrw
const PTK = 'https://www.ptk-nrw.de';
const PTK_SEARCH = PTK + '/patientenschaft/psychotherapeutensuche';
const P = 'tx_lnstherapists_physicianslistplugin';
// The register's own city spelling for each of our cities.
const PTK_CITIES = { cologne: 'Köln', dusseldorf: 'Düsseldorf', munster: 'Münster' };

async function ptkList() {
  const page = await http(PTK_SEARCH);
  const form = page.match(/<form action="" method="post">[\s\S]*?<\/form>/)[0];
  const hidden = [...form.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]);
  const sel = form.slice(form.indexOf('id="foreign_languages"'));
  const opts = [...sel.slice(0, sel.indexOf('</select>')).matchAll(/value="([^"]+)"\s*>\s*([^<]+?)\s*</g)].map((m) => [m[1], m[2].trim()]);
  const out = fs.existsSync(path.join(DIR, 'list.json')) ? load('list.json') : { hits: {} };
  for (const [city, cityName] of Object.entries(PTK_CITIES)) {
    for (const [value, label] of opts) {
      const key = `${city}|${value}`;
      if (out.hits[key] || !langCode(label).code) continue;
      const body = new URLSearchParams();
      for (const [k, v] of hidden) if (!/\[demand\]/.test(k)) body.append(k, v);
      for (const k of ['zip', 'surname', 'focus', 'ver', 'therapy', 'admission', 'gender']) body.append(`${P}[demand][${k}]`, '');
      body.append(`${P}[demand][city]`, cityName);
      body.append(`${P}[demand][foreign_languages]`, value);
      const html = await http(PTK_SEARCH, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
      if (!html) continue;
      const n = Number((flat(html).match(/Ihre Suche ergab (\d+) Treffer/) || [])[1] || 0);
      const slugs = [...new Set([...html.matchAll(/href="\/patientenschaft\/psychotherapeutensuche\/detail\/([^"]+)"/g)].map((m) => m[1]))];
      if (slugs.length !== n) console.log(`  WARN ${key}: ${n} hits announced, ${slugs.length} links`);
      out.hits[key] = { label, slugs };
      if (slugs.length) console.log(`  ${cityName} ${label}: ${slugs.length}`);
      save('list.json', out);
      await sleep(2000);
    }
  }
}

async function ptkFetch() {
  const L = load('list.json');
  const pages = path.join(DIR, 'pages'); fs.mkdirSync(pages, { recursive: true });
  const slugs = [...new Set(Object.values(L.hits).flatMap((h) => h.slugs))];
  const todo = slugs.filter((s) => !fs.existsSync(path.join(pages, s + '.html')));
  console.log(`${slugs.length} members, ${todo.length} to fetch`);
  let i = 0; let n = 0;
  const worker = async () => {
    while (i < todo.length) {
      const s = todo[i++];
      const h = await http(`${PTK_SEARCH}/detail/${s}`);
      if (h) fs.writeFileSync(path.join(pages, s + '.html'), h);
      if (++n % 50 === 0) console.log(`  ${n}/${todo.length}`);
      await sleep(1000);
    }
  };
  await Promise.all(Array.from({ length: Number(val('--conc', '2')) }, worker));
}

function ptkPropose() {
  const L = load('list.json');
  const cityOf = {};
  for (const [key, h] of Object.entries(L.hits)) for (const s of h.slugs) cityOf[s] = key.split('|')[0];
  const rows = []; const refused = [];
  for (const [slug, city] of Object.entries(cityOf)) {
    const f = path.join(DIR, 'pages', slug + '.html');
    if (!fs.existsSync(f)) { refused.push({ slug, why: 'detail page not fetched' }); continue; }
    const html = fs.readFileSync(f, 'utf8');
    const m = html.match(/Die Therapie kann in folgenden Fremdsprachen erfolgen\s*:\s*<\/div>\s*<div>([^<]*)<\/div>/);
    const name = decode((html.match(/<title>([^<]*?)\s*-\s*PTK NRW<\/title>/) || [])[1] || '').trim();
    if (!m) { refused.push({ slug, name, why: 'no language sentence on the detail page' }); continue; }
    // The field is a space-separated list of single-word German names ("Englisch Spanisch").
    const names = decode(m[1]).trim().split(/\s+/).filter(Boolean);
    const { named, codes, unknown } = codesOf(names);
    // The detail page marks its fields: <div class="street">, <div class="city">, and the website as
    // plain text after <i class="icon-world"></i> (not a link, so no href to read).
    const field = (cls) => decode((html.match(new RegExp(`<div class="${cls}">([^<]*)</div>`)) || [])[1] || '').trim();
    const ort = field('city');
    const street = field('street');
    if (ort !== PTK_CITIES[city]) { refused.push({ slug, name, why: `address not in ${PTK_CITIES[city]}`, ort }); continue; }
    if (named.length > MAX_LANGS) { refused.push({ slug, name, why: `${named.length} languages`, named }); continue; }
    if (unknown.length) refused.push({ slug, name, why: 'unmapped language dropped', unknown });
    if (!codes.length) continue;
    const w = decode((html.match(/<i class="icon-world"><\/i>\s*([^<\s]+)/) || [])[1] || '');
    const web = w ? (/^https?:\/\//.test(w) ? w : 'https://' + w) : undefined;
    rows.push({
      city, name: name.replace(/^(Frau|Herr)\s+/, ''), category: 'therapy', languages: codes,
      url: web, sourceUrl: `${PTK_SEARCH}/detail/${slug}`, evidence: 'official', checked: TODAY,
      area: street || undefined, quote: 'Die Therapie kann in folgenden Fremdsprachen erfolgen: ' + named.join(' '),
    });
  }
  return { rows, refused };
}

// ============================================================================ rakfr
const RAK = 'https://www.rak-freiburg.de';
const RAK_CITIES = { freiburg: 'Freiburg im Breisgau', konstanz: 'Konstanz' };
const RAK_FIELDS = ['amtsgericht', 'landgericht', 'fachanwaltschaft', 'inlandsrecht', 'auslandsrecht', 'ort', 'praktika',
  'refa', 'refrendariat', 'studierende', 'teilzeit', 'pflichtverteidigung', 'beistand', 'beraterpool',
  'dozententaetigkeit', 'zertifikat', 'azubig', 'refag', 'betreuung', 'notanwalt', 'verfahrenskostenhilfe',
  'verfahrenspflegschaft', 'sort'];

async function rakList() {
  const page = await http(RAK + '/rechtsuchende/anwaltssuche/');
  const i = page.indexOf('name="fremdsprache"');
  const opts = [...page.slice(i, page.indexOf('</select>', i)).matchAll(/value="(\d+)">([^<]*)</g)].map((m) => [m[1], m[2].trim()]);
  const out = fs.existsSync(path.join(DIR, 'list.json')) ? load('list.json') : { done: {}, members: {} };
  for (const [id, label] of opts) {
    if (out.done[id] || !langCode(label).code) continue;
    const seen = new Set();
    for (let pg = 1; ; pg += 1) {
      const body = new URLSearchParams({ action: 'get_ajax_posts', type: 'getMap', fremdsprache: id, drop: '', page: String(pg), anzeigen: '300' });
      for (const f of RAK_FIELDS) body.set(f, '-1');
      // TRAP: sort=-1, the page's default, is "Zufällig" (random). Paging a random order returns
      // overlapping pages: the first run got 738 distinct English speakers out of 865 announced.
      body.set('sort', 'nameasc');
      const txt = await http(RAK + '/wp-admin/admin-ajax.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
      let j; try { j = JSON.parse(txt); } catch (e) { console.log(`  ${label} p${pg}: not JSON`); break; }
      for (const r of j[0]) { out.members[r[0]] = r; seen.add(r[0]); }
      if (pg >= Number(j[2] || 1)) {
        console.log(`  ${label}: ${j[1]} announced, ${seen.size} distinct${seen.size !== Number(j[1]) ? '  WARN' : ''}`);
        break;
      }
      await sleep(2000);
    }
    out.done[id] = label;
    save('list.json', out);
    await sleep(2000);
  }
  console.log(`${Object.keys(out.members).length} distinct members`);
}

// "tax-mitglied-fremdsprache-franzoesisch" -> "französisch"; the slugs are the labels with umlauts
// folded, so they are mapped back through this table.
const SLUG = { franzoesisch: 'französisch', niederlaendisch: 'niederländisch', rumaenisch: 'rumänisch', tuerkisch: 'türkisch', aramaeisch: 'aramäisch' };

function rakPropose() {
  const L = load('list.json');
  const rows = []; const refused = [];
  for (const r of Object.values(L.members)) {
    const [, rawName, , , , url, , , zip, kind, , , html] = r;
    const name0 = decode(rawName).trim();
    const t = flat(html);
    const ort = (t.match(/DE - \d{5} ([^\n]+)/) || [])[1];
    const city = Object.keys(RAK_CITIES).find((c) => (ort || '').trim() === RAK_CITIES[c]);
    if (!city) continue; // other towns of the district; not ours, not worth listing as refused
    const names = [...html.matchAll(/tax-mitglied-fremdsprache-([\w-]+)/g)].map((m) => SLUG[m[1]] || m[1]);
    const { named, codes, unknown } = codesOf([...new Set(names)]);
    if (named.length > MAX_LANGS) { refused.push({ name: name0, why: `${named.length} languages`, named }); continue; }
    if (unknown.length) refused.push({ name: name0, why: 'unmapped language dropped', unknown });
    if (!codes.length) continue;
    // A person is printed "Surname, Given"; the firm line follows in the list view.
    // "Adam, Simone, Dr." and "Clausnitzer, Martin, Dr. jur., LL.M." carry titles after the given
    // name: doctorates go in front ("Dr. Simone Adam"), degrees behind ("Daniel Beck, LL.M.").
    const parts = name0.split(', ');
    const person = kind !== 'Berufsausübungsgesellschaft' && parts.length >= 2 && !/Partner|mbB|GmbH|PartG/.test(name0);
    const pre = parts.slice(2).filter((p) => /^(Prof|Dr|JUDr)/.test(p)).map((p) => p.replace(/^Dr\. jur\.$/, 'Dr.'));
    const post = parts.slice(2).filter((p) => !/^(Prof|Dr|JUDr)/.test(p));
    const name = person ? [...pre, parts[1], parts[0]].join(' ') + (post.length ? ', ' + post.join(', ') : '') : name0;
    const firm = person ? decode((html.match(/<b>[^<]*<\/b><br \/>([^<]+)<\/td>/) || [])[1] || '').trim() || undefined : undefined;
    const web = decode((html.match(/class="linkHome" href="([^"]+)"/) || [])[1] || '') || undefined;
    const street = decode((html.match(/<td style="width: 33%;">([^<]+)<br \/>DE - /) || [])[1] || '').trim();
    rows.push({
      city, name, firm, category: 'legal', languages: codes, url: web, sourceUrl: url, evidence: 'official',
      checked: TODAY, area: street || undefined, quote: 'Fremdsprachen: ' + named.map((n) => n[0].toUpperCase() + n.slice(1)).join(', '),
    });
  }
  return { rows, refused };
}

// ============================================================================ main
const SOURCES = {
  kvhh: {
    list: kvhhList, propose: kvhhPropose,
    source: {
      publisher: 'Kassenärztliche Vereinigung Hamburg', url: 'https://www.kvhh.net/de/physicianfinder.html',
      licenceOrTermsQuote: 'No reuse, copying or database clause in kvhh.net/de/impressum.html or /de/haftungsausschluss.html (read 2026-09-24). The finder says: "Die Aktualisierung der Sprechzeiten und die Angaben zur Barrierefreiheit erfolgen durch die Praxen."',
      pageNote: 'The Hamburg association of statutory-insurance doctors lists every practice it registers, with the foreign languages each practice reports to it. We list the ones it names for each doctor or psychotherapist.',
    },
  },
  ptknrw: {
    list: ptkList, fetch: ptkFetch, propose: ptkPropose,
    source: {
      publisher: 'Psychotherapeutenkammer Nordrhein-Westfalen', url: PTK_SEARCH,
      licenceOrTermsQuote: 'ptk-nrw.de/impressum carries no copyright or reuse clause (read 2026-09-24); robots.txt "Allow: /". Entries are members\' own submissions: "Die Kammer behält sich das Recht zur Prüfung, redaktionellen Korrektur oder Kürzung der Selbstauskünfte vor."',
      pageNote: 'The statutory chamber of psychotherapists in North Rhine-Westphalia publishes a search of its members in which each one states the foreign languages therapy can be given in. We list what it prints for each therapist.',
    },
  },
  rakfr: {
    list: rakList, propose: rakPropose,
    source: {
      publisher: 'Rechtsanwaltskammer Freiburg', url: RAK + '/rechtsuchende/anwaltssuche/',
      licenceOrTermsQuote: 'rak-freiburg.de/impressum: "Sie können die hier veröffentlichten Informationen speichern und Verknüpfungen zu unseren Seiten herstellen. [...] Die Informationen dürfen nicht verändert oder verfälscht werden."',
      pageNote: 'The statutory bar of the Freiburg district publishes a search of its lawyers with the foreign languages each has registered. We list what it names for each lawyer.',
    },
  },
};

(async () => {
  const S = SOURCES[SOURCE];
  if (!S || !['list', 'fetch', 'propose'].includes(cmd)) {
    console.log('usage: node scripts/read_de_chambers.cjs list|fetch|propose --source kvhh|ptknrw|rakfr --cache <dir>');
    process.exit(1);
  }
  if (cmd === 'fetch' && !S.fetch) { console.log(`${SOURCE} needs no fetch stage`); return; }
  if (cmd !== 'propose') { await S[cmd](); return; }
  const { rows, refused } = S.propose();
  rows.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
  save('proposals.json', { source: S.source, written: TODAY, rows: rows.map((r) => JSON.parse(JSON.stringify(r))) });
  save('refused.json', refused);
  const by = {};
  for (const r of rows) { const k = `${r.city}/${r.category}`; by[k] = (by[k] || 0) + 1; }
  console.log(`${rows.length} rows`, by, `${refused.length} refused/notes`);
})();
