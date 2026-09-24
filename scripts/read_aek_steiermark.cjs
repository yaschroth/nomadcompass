/**
 * Reads the doctor search of the Ärztekammer für Steiermark for the doctors in Graz who list a
 * foreign language.
 *
 * WHY THIS SOURCE
 *
 * The Ärztekammer für Steiermark is the statutory doctors' chamber of Styria, a public-law body
 * every doctor practising in the state must belong to. Its Ordinationssuche
 * (www.aekstmk.or.at/46) lists every practice with a field "Fremdsprachen", and the search form
 * says what that field means: "Gesucht wird nach Ärztinnen und Ärzten, die die von Ihnen
 * gewünschte Fremdsprache beherrschen" (it finds the doctors who have command of the foreign
 * language you ask for). That is a claim per named doctor, published by a statutory body, which is
 * the official tier.
 *
 * WHO ENTERED THE LANGUAGES
 *
 * Neither the detail page nor the search form says. The detail page prints the heading
 * "Fremdsprachen" and the language names, nothing else: no date, no "self-reported", no level. The
 * chamber's list of what doctors must report to it (www.aekstmk.or.at/700, "Informationen zur
 * Meldepflicht") names name, address, contact details, practices and employment, and not
 * languages, so the field is not one the law makes them report. The only wording the chamber puts
 * beside it is the "beherrschen" sentence above, which is the chamber's own reading of the field,
 * and it is what the page note says.
 *
 * TERMS
 *
 * robots.txt: "Allow: /cms/cms.php?pageName=46" and "Allow: /cms/cms.php?arztname=", and the
 * chamber publishes every detail page in its own sitemap (sitemap-aerzteDE.xml). It disallows only
 * GPTBot, FacebookBot and meta-externalagent by name, which this is not.
 * Impressum (www.aekstmk.or.at/aerztekammer-683/ihre-kammer-356/impressum-163): "Der Inhalt der
 * Ärztekammer für Steiermark Portalseiten ist urheberrechtlich geschützt." Nutzungsbestimmungen
 * (same page, ?articleId=188) cover liability, currency and links only: "Trotz sorgfältiger
 * Bearbeitung kann keine Gewähr für die Richtigkeit und Vollständigkeit der in dieser Homepage
 * enthaltenen Daten übernommen werden." No reuse or extraction ban. The page note names the
 * chamber.
 *
 * WHY NOT SALZBURG AND TIROL (checked 2026-09-24)
 *
 * Ärztekammer für Salzburg: the Arztsuche (arztsuche.aeksbg.at, shared with Upper Austria) has a
 * Fremdsprachen filter, but it is an Angular app over a JSON POST backend
 * (backend/nextdoor/getNextdoorResults) that answers {"message":"Unauthorized"} to a request that
 * does not carry the app's own Origin. Getting past that is getting past an access control. And
 * the Impressum (www.aeksbg.at/impressum) forbids it anyway: "jede Weiterverwendung von Inhalten
 * und Programmen, Texten, Grafiken und Bildern unserer Website [ist] ausnahmslos nur mit
 * vorheriger schriftlicher Genehmigung zulässig". A source to ask, not to read.
 * Ärztekammer für Tirol: the Arztsuche (apps.aektirol.at/GlobalSearch/Arztsuche) is the right
 * shape, a plain GET form with a Fremdsprachen filter (Englisch 1594, Französisch 367, Italienisch
 * 329 across Tirol), but the Impressum (www.aektirol.at/impressum) allows use "ausschließlich zu
 * privatem, nichtkommerziellem Gebrauch", names "Nutzung der Inhalte dieser Webseite auf einer
 * anderen Webseite" as a use it covers, and adds "Die Vervielfältigung von Informationen oder
 * Daten ... bedarf der vorherigen Zustimmung der Ärztekammer für Tirol." Also a source to ask.
 *
 * THE RULES
 *
 * Graz is the city of Graz, not Styria: a practice counts where the chamber files it under one of
 * the seventeen "Graz - <district>" districts AND its postcode is 8010 to 8063. The two tests are
 * both kept because they disagree at the edges: 8054 is also Seiersberg-Pirka and 8061 to 8063 are
 * St. Radegund, Kumberg and Eggersdorf, all in the district Graz-Umgebung, outside the city.
 * One exception, because the chamber files the same address under two districts: a practice filed
 * under Graz-Umgebung counts where the chamber files the same street and postcode under a Graz
 * district for another doctor (see propose). The district is read from the detail page, because a
 * short result list (8 for Arabic) is printed flat, with no districts at all.
 *
 * German is never published. It is the local language, the register does not list it (it is a
 * list of foreign languages), and a German speaker abroad is not who the directory is for.
 *
 * A language is published only where the detail page names it outright. The chamber's field has
 * no level or hedge today; if an entry ever carries one ("Grundkenntnisse", "etwas", anything in
 * brackets), it is not an exact language name, so it is refused and listed rather than read.
 *
 * Languages the directory has no code for (Bosnisch, Kurdisch, Pashto, Igbo, Isländisch,
 * Azerbajdjanisch, Okzitanisch) are dropped from the row and counted, and so are two that are not
 * one language: "Indisch" (Indian, which names a country) and "Gebärdensprache" (sign language,
 * without saying which). Flämisch is Dutch.
 *
 * More than six languages refuses the doctor, as everywhere else in the directory.
 *
 * One row per doctor. A doctor with two practices in Graz has one set of languages at the chamber,
 * so the row takes the first practice (the chamber's rfolge order) for its address and page, and
 * the other practice's page is kept in the proposal for the ingest to decide on.
 *
 * Category from the specialty the chamber prints under the name, never from a diploma: Zahn- or
 * Kieferorthopädie is a dentist, Psychiatrie or Psychotherapie/psychotherapeutische Medizin in the
 * specialty is therapy, everything else is a doctor (Physikalische Medizin included; a GP holding
 * the ÖÄK-Diplom Psychotherapeutische Medizin is still a GP).
 *
 * THREE STAGES
 *
 *   list     node scripts/read_aek_steiermark.cjs list --cache <dir>
 *              reads the language list from the search form, then asks the search for each
 *              language (the whole state comes back in one page) and keeps the Graz practices.
 *   fetch    node scripts/read_aek_steiermark.cjs fetch --cache <dir> [--conc 3]
 *              fetches each Graz practice's detail page once, gzipped into the cache. Resumable.
 *   propose  node scripts/read_aek_steiermark.cjs propose --cache <dir>
 *              writes <dir>/proposals.json and <dir>/refused.json.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://www.aekstmk.or.at';
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';

const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'aek-steiermark')));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CITY = 'graz';
const FORM_URL = `${BASE}/cms/cms.php?pageName=46`;
const listUrl = (code) => `${BASE}/cms/cms.php?pageName=46&search=search&sprache=${code}`;
const detailUrl = (arztnr, rfolge) => `${BASE}/46?arztnr=${arztnr}&rfolge=${rfolge}`;
const inGraz = (bezirk, plz) => /^Graz - /.test(bezirk) && plz >= 8010 && plz <= 8063;

// The chamber's language names, as its form and detail pages spell them. null: not published,
// with the reason in the comment block above.
const LANG = {
  Albanisch: 'sq', Arabisch: 'ar', Bulgarisch: 'bg', Chinesisch: 'zh', Englisch: 'en', Estnisch: 'et',
  Finnisch: 'fi', Flämisch: 'nl', Französisch: 'fr', Griechisch: 'el', Holländisch: 'nl', Niederländisch: 'nl',
  Italienisch: 'it', Katalanisch: 'ca', Kroatisch: 'hr', Lettisch: 'lv', Norwegisch: 'no',
  'Persisch (farsi)': 'fa', Persisch: 'fa', Polnisch: 'pl', Portugiesisch: 'pt', Rumänisch: 'ro',
  Russisch: 'ru', Schwedisch: 'sv', Serbisch: 'sr', Slowakisch: 'sk', Slowenisch: 'sl', Spanisch: 'es',
  Tschechisch: 'cs', Türkisch: 'tr', Ukrainisch: 'uk', Ungarisch: 'hu',
  Dänisch: 'da', Hebräisch: 'he', Japanisch: 'ja', Koreanisch: 'ko', Vietnamesisch: 'vi', Litauisch: 'lt',
  Hindi: 'hi', Urdu: 'ur',
  Deutsch: null, Bosnisch: null, Kurdisch: null, Pashto: null, Igbo: null, Isländisch: null,
  Azerbajdjanisch: null, Okzitanisch: null, Indisch: null, Gebärdensprache: null,
};

const MAX_LANGS = 6;

const decode = (s) => String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
  .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü').replace(/&szlig;/g, 'ß')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (h) => decode(String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const cachePath = (key) => path.join(CACHE, 'pages', key.replace('|', '_') + '.html.gz');

async function getText(url) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 200) return await r.text();
    } catch (e) { /* retried below */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}

// ---- list -------------------------------------------------------------------
function parseLanguages(html) {
  const sel = (html.match(/<select[^>]*name="sprache"[^>]*>([\s\S]*?)<\/select>/) || [])[1] || '';
  return [...sel.matchAll(/<option[^>]*value="(\d+)"[^>]*>([^<]*)/g)]
    .filter((m) => m[1] !== '0').map((m) => ({ code: m[1], name: decode(m[2]).trim() }));
}

// One block per practice:
// <a href="/46?arztnr=N&rfolge=R...">Surname, Given</a> ... <span class="marowf">Street,<br>PLZ Ort</span>
// A long result is grouped under district headings (<div class="bezirk">); a short one (Arabic, 8
// in the state) is a flat list with no district at all. Reading only the grouped shape read 0 of
// 8 and printed it as "0 in Graz" without complaint, which is why the read count is checked
// against the count the page states. With no district in the list, the district test waits for
// the detail page, which always prints one.
function parseList(html) {
  const out = [];
  const parts = html.includes('<div class="bezirk">') ? html.split('<div class="bezirk">').slice(1)
    : [html.slice(html.indexOf('<div id="ordi_res">'))];
  for (const part of parts) {
    const bezirk = part.startsWith('<div id="ordi_res">') ? '' : decode((part.match(/<a[^>]*>([^<]*)<\/a>/) || [])[1] || '').trim();
    for (const m of part.matchAll(/arztnr=(\d+)&(?:amp;)?rfolge=(\d+)[^>]*>([^<]*)<\/a>[\s\S]*?<span class="marowf">([\s\S]*?)<\/span>/g)) {
      const addr = text(m[4]);
      const plz = Number((addr.match(/\b(\d{4}) [^,]*$/) || [])[1] || 0);
      out.push({ arztnr: m[1], rfolge: m[2], listName: decode(m[3]).trim(), bezirk, address: addr, plz });
    }
  }
  return out;
}

async function list() {
  fs.mkdirSync(CACHE, { recursive: true });
  const form = await getText(FORM_URL);
  if (!form) throw new Error('search form did not answer');
  const langs = parseLanguages(form);
  console.log(`${langs.length} languages on the form`);
  const entries = {}; const perLang = {}; const edge = [];
  for (const { code, name } of langs) {
    const html = await getText(listUrl(code));
    if (!html) { console.log(`${code} ${name}: no answer`); perLang[code] = { name, failed: true }; continue; }
    // "1 Arzt gefunden" in the singular, "8 Ärzte gefunden" otherwise.
    const stated = Number((text(html).match(/(\d+) (?:Ärzt|Arzt)\S* gefunden/) || [])[1] || 0);
    const rows = parseList(html);
    if (rows.length !== stated) console.log(`  ! ${code} ${name}: the page says ${stated}, ${rows.length} read`);
    let graz = 0;
    for (const r of rows) {
      // Every practice with a Graz postcode is kept as a candidate, whatever its district: the
      // district test is made in propose, on the detail page, where the address rule below can
      // see every practice at once.
      const cityPlz = r.plz >= 8010 && r.plz <= 8063;
      if (!cityPlz) continue;
      if (r.bezirk && !/^Graz - /.test(r.bezirk)) edge.push({ ...r, lang: name });
      if (/^Graz - /.test(r.bezirk)) graz += 1;
      const key = r.arztnr + '|' + r.rfolge;
      const e = entries[key] || (entries[key] = { ...r, listed: [] });
      if (!e.listed.includes(name)) e.listed.push(name);
    }
    perLang[code] = { name, stated, read: rows.length, graz };
    console.log(`${code} ${name}: ${stated} in Styria, ${rows.length} read, ${graz} filed under a Graz district`);
    await sleep(700);
  }
  fs.writeFileSync(path.join(CACHE, 'list.json'), JSON.stringify({
    listed: new Date().toISOString().slice(0, 10), languages: langs, perLang, entries,
    edge: [...new Map(edge.map((e) => [e.arztnr + '|' + e.rfolge, e])).values()],
  }, null, 1));
  console.log(`${Object.keys(entries).length} practices with a Graz postcode, ${new Set(Object.values(entries).map((e) => e.arztnr)).size} doctors`);
}

// ---- fetch ------------------------------------------------------------------
async function fetchAll() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  fs.mkdirSync(path.join(CACHE, 'pages'), { recursive: true });
  const todo = Object.keys(L.entries).filter((k) => !fs.existsSync(cachePath(k)));
  console.log(`${todo.length} pages to fetch`);
  let i = 0; let ok = 0; let bad = 0;
  const worker = async () => {
    while (i < todo.length) {
      const key = todo[i++];
      const [n, r] = key.split('|');
      const t = await getText(detailUrl(n, r));
      // Without rfolge, or with a stale one, the page answers 200 with the search's intro and no
      // practice; the container is what says a practice came back.
      if (t && t.includes('id="ordi_container"')) { fs.writeFileSync(cachePath(key), zlib.gzipSync(t)); ok += 1; } else bad += 1;
      if ((ok + bad) % 100 === 0) console.log(`  ${ok + bad}/${todo.length} (${bad} failed)`);
      await sleep(400);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, Number(val('--conc', '3'))) }, worker));
  console.log(`fetched ${ok}, failed ${bad}`);
}

// ---- parse ------------------------------------------------------------------
function sectionOf(box, heading) {
  const i = box.indexOf(`<h3 class="aef_detail_h3">${heading}</h3>`);
  if (i < 0) return null;
  const j = box.indexOf('<h3 class="aef_detail_h3">', i + 10);
  return box.slice(i, j < 0 ? box.length : j);
}
const pairs = (sec) => [...String(sec || '').matchAll(/<td class="ordi_bezeichnung">([\s\S]*?)<\/td>\s*<td class="[^"]*">([\s\S]*?)<\/td>/g)]
  .map((m) => ({ label: text(m[1]).replace(/:$/, ''), value: m[2] }));

function parsePage(html) {
  const s = html.indexOf('<div id="ordi_container">');
  const box = html.slice(s, html.indexOf('class="back_button"', s));
  const o = {};
  o.name = text((box.match(/<h2>([\s\S]*?)<\/h2>/) || [])[1]);
  // Under the name: one line per specialty, each optionally followed by a small bracketed focus
  // ("(Sporttraumatologie)").
  const spec = (box.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/) || [])[1] || '';
  o.specialties = spec.split(/<br\s*\/?>/i).map((x) => x.replace(/<span[\s\S]*?<\/span>/g, '')).map(text).filter(Boolean);
  o.focus = [...spec.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]).replace(/^\(|\)$/g, '')).filter(Boolean);
  const adr = Object.fromEntries(pairs(sectionOf(box, 'Adresse')).map((p) => [p.label, text(p.value)]));
  o.street = adr.Strasse || ''; o.plz = adr.Plz || ''; o.ort = adr.Ort || ''; o.bezirk = adr.Bezirk || '';
  const contact = pairs(sectionOf(box, 'Kontakt'));
  o.contactLabels = contact.map((p) => p.label);
  // The practice website, where the doctor gave one: any link in the contact block that is not a
  // phone number or an email address.
  const web = contact.map((p) => (p.value.match(/href="(https?:\/\/[^"]+|www\.[^"]+)"/) || [])[1]).filter(Boolean)[0] ||
    contact.filter((p) => /homepage|internet|web/i.test(p.label)).map((p) => text(p.value).replace(/^>\s*/, ''))[0] || null;
  o.homepage = web ? (/^https?:\/\//.test(web) ? web : 'https://' + web.replace(/^\/+/, '')) : null;
  o.langRaw = pairs(sectionOf(box, 'Fremdsprachen')).map((p) => text(p.value)).filter(Boolean);
  return o;
}

function categoryOf(specialties) {
  const s = specialties.join(' | ');
  if (/Zahn|Kieferorthop/i.test(s)) return 'dentist';
  if (/Psychiatrie|Psychotherap/i.test(s)) return 'therapy';
  return 'doctor';
}

// ---- propose ----------------------------------------------------------------
function propose() {
  const L = JSON.parse(fs.readFileSync(path.join(CACHE, 'list.json'), 'utf8'));
  const tally = {}; const count = (k, n = 1) => { tally[k] = (tally[k] || 0) + n; };
  const refused = []; const dropped = {}; const hedged = []; const mismatch = []; const sameDoc = [];
  const byDoctor = {};
  const pages = [];
  for (const [key, e] of Object.entries(L.entries)) {
    const f = cachePath(key);
    if (!fs.existsSync(f)) { count('not fetched'); continue; }
    pages.push({ key, e, f, o: parsePage(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8')) });
  }
  // The chamber does not file one address under one district. Berthold-Linder-Weg 15, 8047 (the
  // Privatklinik Ragnitz) is "Graz - Ries-Ragnitz" for twenty doctors and "Graz-Umgebung" for one.
  // So a practice filed under Graz-Umgebung still counts where the chamber files the same street
  // address and postcode under a Graz district for someone else. What that lets in is the
  // chamber's own reading of the address, not ours; an address it never files in the city (8055
  // Seiersberg-Pirka, 8062 Kumberg) stays out.
  const addrKey = (o) => (o.street + '|' + o.plz).toLowerCase().normalize('NFKC').replace(/straße/g, 'str').replace(/[^a-z0-9äöü|]+/g, '');
  const grazAddr = new Set(pages.filter((p) => inGraz(p.o.bezirk, Number(p.o.plz))).map((p) => addrKey(p.o)));
  for (const { key, e, f, o } of pages) {
    const byDistrict = inGraz(o.bezirk, Number(o.plz));
    const byAddress = !byDistrict && Number(o.plz) >= 8010 && Number(o.plz) <= 8063 && grazAddr.has(addrKey(o));
    if (!byDistrict && !byAddress) {
      count('outside the city on its detail page');
      refused.push({ arztnr: e.arztnr, name: o.name, why: `outside the city: ${o.street}, ${o.plz} ${o.ort} (${o.bezirk})` });
      continue;
    }
    if (byAddress) { count('in the city by address, filed under ' + o.bezirk); o.cityByAddress = true; }
    (byDoctor[e.arztnr] = byDoctor[e.arztnr] || []).push({ key, e, o, checked: fs.statSync(f).mtime.toISOString().slice(0, 10) });
  }
  const rows = [];
  for (const [arztnr, practices] of Object.entries(byDoctor)) {
    practices.sort((a, b) => Number(a.e.rfolge) - Number(b.e.rfolge));
    const first = practices[0];
    const { o } = first;
    // The detail page is the claim; the search listing it under a language is the same claim read
    // another way, so a disagreement is reported, not resolved.
    const raw = [...new Set(practices.flatMap((p) => p.o.langRaw))];
    if (practices.length > 1 && practices.some((p) => p.o.langRaw.join() !== o.langRaw.join())) sameDoc.push({ arztnr, name: o.name, langs: practices.map((p) => p.o.langRaw) });
    const listed = [...new Set(practices.flatMap((p) => p.e.listed))];
    const a = [...listed].sort().join(); const b = raw.filter((x) => x !== 'Deutsch').sort().join();
    if (a !== b) mismatch.push({ arztnr, name: o.name, listed, page: raw });
    const codes = []; const unknown = [];
    for (const l of raw) {
      if (!(l in LANG)) { unknown.push(l); continue; }
      if (LANG[l] === null) { dropped[l] = (dropped[l] || 0) + 1; continue; }
      if (!codes.includes(LANG[l])) codes.push(LANG[l]);
    }
    if (unknown.length) hedged.push({ arztnr, name: o.name, entries: unknown });
    if (!o.name) { count('no name on page'); refused.push({ arztnr, why: 'no name on page' }); continue; }
    if (!codes.length) {
      count('no publishable language');
      refused.push({ arztnr, name: o.name, why: 'no publishable language', page: raw });
      continue;
    }
    if (codes.length > MAX_LANGS) {
      count('more than ' + MAX_LANGS + ' languages');
      refused.push({ arztnr, name: o.name, why: codes.length + ' languages', page: raw });
      continue;
    }
    const category = categoryOf(o.specialties);
    rows.push({
      id: 'aekstmk|' + arztnr,
      city: CITY,
      name: o.name,
      category,
      languages: codes,
      url: o.homepage || undefined,
      sourceUrl: detailUrl(arztnr, first.e.rfolge),
      evidence: 'official',
      checked: first.checked,
      area: [o.street, o.plz].filter(Boolean).join(', ') || first.e.address,
      district: o.bezirk || first.e.bezirk,
      cityByAddress: o.cityByAddress || undefined,
      specialty: o.specialties.join('; '),
      focus: o.focus.length ? o.focus.join('; ') : undefined,
      otherPractices: practices.length > 1 ? practices.slice(1).map((p) => ({ sourceUrl: detailUrl(arztnr, p.e.rfolge), area: [p.o.street, p.o.plz].filter(Boolean).join(', ') })) : undefined,
    });
    count('proposed');
  }
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify({ written: new Date().toISOString().slice(0, 10), pageNote: PAGE_NOTE, rows }, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify({ refused, hedged, mismatch, practicesDisagree: sameDoc, dropped }, null, 1));
  console.log(tally);
  const by = {}; const byLang = {};
  rows.forEach((r) => { by[r.category] = (by[r.category] || 0) + 1; r.languages.forEach((l) => { byLang[l] = (byLang[l] || 0) + 1; }); });
  console.log('by category', by);
  console.log('by language', byLang);
  console.log('languages dropped (no code, or not one language)', dropped);
  console.log(`${hedged.length} doctors with an entry that is not a plain language name, ${mismatch.length} where the search and the page disagree, ${sameDoc.length} whose Graz practices list different languages`);
}

// Printed once per page, beside the rows it covers; it names the chamber in its own name and says
// what the field is, in the chamber's words.
const PAGE_NOTE = 'Some of these are listed in the doctor search of the Ärztekammer für Steiermark, ' +
  'the statutory doctors\' chamber of Styria. A language is shown where the chamber lists it among ' +
  'the doctor\'s foreign languages, which its search describes as languages the doctor has command of.';

module.exports = { parseList, parsePage, parseLanguages, categoryOf, inGraz, LANG, PAGE_NOTE };

if (require.main === module) {
  (async () => {
    if (cmd === 'list') return list();
    if (cmd === 'fetch') return fetchAll();
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_aek_steiermark.cjs <list|fetch|propose> --cache <dir>');
    process.exit(2);
  })();
}
