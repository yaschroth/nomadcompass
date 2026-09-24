/**
 * Reads five official registers in Western and Northern Europe that list, per named person, the
 * foreign languages the state has examined or authorised them in, and proposes directory rows for
 * our cities there.
 *
 * WHY THESE FIVE, AND WHY NOT THE BARS
 *
 * The task was every bar, notary, accountant and sworn-translator register with a per-member
 * language field in France, Belgium, the Netherlands, Luxembourg, Switzerland, Austria, the Nordics
 * and Iceland. Most bars publish a language field and then forbid the use we would make of it:
 * the Paris bar, the CNB, the NOvA, the Flemish bars (advocaat.be), the Austrian bar (ORAK), the
 * Austrian notaries and tax advisers, and the French accountants all reserve reproduction or
 * storage "unter Verwendung elektronischer Systeme" to their written permission. They are listed
 * as ASK PERMISSION in the agent report with the clause quoted, and nothing is read from them here.
 *
 * What is left are registers a public body keeps by law so that the public can find and hire the
 * people on them, with no clause against reuse:
 *
 *   at  Austria, Gerichtsdolmetscherliste, Federal Ministry of Justice (justizonline.gv.at).
 *       Court-certified interpreters and translators, per language, with a certification end date.
 *       The ministry's IWG terms grant reuse "fuer kommerzielle und nichtkommerzielle Zwecke" with
 *       the source named as "Republik Oesterreich vertreten durch das BMJ" and any change marked;
 *       CC BY 4.0 applies subsidiarily. The public search answers at most 100 rows per request and
 *       says automated use should go through the IWG API, whose token needs an ID Austria
 *       application; 8 requests read the whole list, and a refresh should use the token.
 *   se  Sweden, register of authorised translators, Kammarkollegiet. Published by ordinance
 *       (1985:613) 12 section, "sokbart och tillgangligt for allmanheten", and described by the
 *       agency itself as "ett rekryteringsinstrument". Two JSON requests (to and from Swedish).
 *   fi  Finland, register of authorised translators (AKR), Finnish National Agency for Education.
 *       One open JSON file behind its public search engine, "Rekisterin julkisesta hakukoneesta voi
 *       etsia auktorisoituja kaantajia".
 *   no  Norway, Nasjonalt tolkeregister, IMDi. An "offentlig innsynsregister" of qualified
 *       interpreters, "Du kan kontakte tolker fra registeret direkte". One JSON request.
 *   is  Iceland, the lawyer list of Logmannafelag Islands, membership of which is compulsory by the
 *       Lawyers Act 77/1998, with a language field per lawyer. The site has no terms of use at all.
 *       List pages per language, then one detail page per lawyer for the town and the languages.
 *
 * THE RULE
 *
 * A language is published where the register records it for that person, and only while it is
 * current: Austria's certification and Sweden's authorisation both carry an end date, and a lapsed
 * one is not a claim. Norway's register is qualification-graded (A to E); every grade meets the
 * Interpreting Act's formal minimum, so all are read, and the grade is kept on the row for the
 * ingest to decide on.
 *
 * The local language is never published, and in Finland that means Finnish AND Swedish, both
 * national languages: a Finland-Swedish translator's Swedish is local there. A translator whose
 * only pair is Finnish-Swedish therefore produces no row. Every register here is "X and the local
 * language", so the local side is the register's frame, not a claim.
 *
 * Sign language, written-Norwegian "skrivetolking", Sami, Kurdish, Bosnian, Armenian and every
 * other language without a code in data/service-languages.json are dropped from a row, never
 * mapped to a neighbour: "Afghanisch (Dari und Pashtu)" is not Persian, and "Burgenlaendisch-
 * Kroatisch" is not Croatian.
 *
 * CITIES
 *
 * The city field is matched to the municipality, not the region. Espoo, Vantaa and Kauniainen are
 * not Helsinki; Solna and Nacka are not Stockholm; Hart bei Graz is not Graz. Stockholm's and
 * Gothenburg's own district post towns (Bromma, Enskede, Vastra Frolunda, Askim...) are inside the
 * city and are kept. Norway's register gives the county, not the town; Oslo is the one county that
 * is a single city, and elsewhere the town is read from the address only where the interpreter
 * chose to show it. Sweden's interpreter register gives the county alone, so it is not read.
 *
 *   node scripts/read_west_registers.cjs fetch   --cache <dir> [--only at,se,fi,no,is]
 *   node scripts/read_west_registers.cjs propose --cache <dir>
 *
 * propose writes <dir>/proposals.json (one object per source, rows inside) and <dir>/refused.json.
 * Nothing under data/ is written.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UA = 'Mozilla/5.0 (compatible; nomadhq-research; +https://thenomadhq.com/methodology)';
const argv = process.argv.slice(2);
const cmd = argv[0];
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CACHE = path.resolve(val('--cache', path.join(ROOT, '.cache', 'west-registers')));
const ONLY = new Set(val('--only', 'at,se,fi,no,is').split(','));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const MAX_LANGS = 6;

const SUPPORTED = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'))._languages));
const { CITY } = require('./lib/service_data.cjs');

async function get(url, opts = {}) {
  for (let a = 0; a < 4; a += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
      if (r.status === 200) return await r.text();
      if (r.status === 404) return null;
    } catch (e) { /* retried */ }
    await sleep(3000 * (a + 1));
  }
  return null;
}
const save = (name, text) => { fs.mkdirSync(path.dirname(path.join(CACHE, name)), { recursive: true }); fs.writeFileSync(path.join(CACHE, name), text); };
const load = (name) => { const f = path.join(CACHE, name); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ---- Austria ----------------------------------------------------------------
const AT_SEARCH = 'https://justizonline.gv.at/jop/service/exl/jo/v2/search/expert?type=DO&span=100&sort=NAME_ASC&offset=';
const AT_LANG = {
  Englisch: 'en', Französisch: 'fr', Italienisch: 'it', Spanisch: 'es', Portugiesisch: 'pt', Russisch: 'ru', Ukrainisch: 'uk',
  Polnisch: 'pl', Tschechisch: 'cs', Slowakisch: 'sk', Ungarisch: 'hu', Rumänisch: 'ro', Bulgarisch: 'bg', Kroatisch: 'hr',
  Serbisch: 'sr', Slowenisch: 'sl', Albanisch: 'sq', Griechisch: 'el', Türkisch: 'tr', Arabisch: 'ar', Hebräisch: 'he',
  'Persisch (= Farsi)': 'fa', 'Chinesisch(= Putonghua)': 'zh', Japanisch: 'ja', Koreanisch: 'ko', Vietnamesisch: 'vi',
  Thailändisch: 'th', Indonesisch: 'id', 'Indisch (= Hindi)': 'hi', 'Pakistanisch (= Urdu)': 'ur', 'Pandschabi (=Punjabi)': 'pa',
  'Bengalisch (= Bengali = Bangla)': 'bn', 'Philippinisch (= Tagalog, Pilipino)': 'tl', Kambodschanisch: 'km', Georgisch: 'ka',
  Niederländisch: 'nl', Dänisch: 'da', Schwedisch: 'sv', Norwegisch: 'no', Finnisch: 'fi', Estnisch: 'et', Lettisch: 'lv', Litauisch: 'lt',
};
// Only the city itself. "Graz-Andritz" is a Graz district; "Hart bei Graz" is its own municipality.
function atCity(c) {
  const s = String(c || '').trim();
  if (/^Wien(\s|$|,)/i.test(s)) return 'vienna';
  if (/^Graz($|-)/i.test(s)) return 'graz';
  if (/^Innsbruck\b/i.test(s)) return 'innsbruck';
  if (/^Salzburg$/i.test(s)) return 'salzburg';
  if (/^Klagenfurt\b/i.test(s)) return 'klagenfurt';
  if (/^Bregenz$/i.test(s)) return 'bregenz';
  if (/^Hallstatt$/i.test(s)) return 'hallstatt';
  return null;
}
async function fetchAt() {
  const first = JSON.parse(await get(AT_SEARCH + 0));
  const pages = Math.ceil(first.total / 100);
  let all = first.list;
  // offset counts pages, not rows: offset=1 is rows 101-200. offset=100 returned "Invalid content".
  for (let p = 1; p < pages; p += 1) { await sleep(1500); all = all.concat(JSON.parse(await get(AT_SEARCH + p)).list); }
  save('at.json', JSON.stringify({ fetched: TODAY, total: first.total, list: all }));
  console.log(`at: ${all.length} of ${first.total} interpreters`);
}
function proposeAt(out, refused) {
  const raw = load('at.json'); if (!raw) return;
  const { list, fetched } = JSON.parse(raw);
  for (const x of list) {
    if (x.status !== 'APPROVED' || x.certificateExpired) { refused.push({ src: 'at', name: x.displayName, why: 'not approved or certificate expired' }); continue; }
    if (x.suspendedFrom && x.suspendedFrom.slice(0, 10) <= TODAY && (!x.suspendedTo || x.suspendedTo.slice(0, 10) >= TODAY)) { refused.push({ src: 'at', name: x.displayName, why: 'suspended (ruhend)' }); continue; }
    const contact = x.contacts.find((c) => c.type === 'BUSINESS') || x.contacts.find((c) => c.addressForService) || x.contacts[0];
    const city = contact && atCity(contact.city);
    if (!city) continue;
    const current = x.languageAssignments.filter((a) => !a.certifiedUntil || a.certifiedUntil.slice(0, 10) >= TODAY);
    const langs = [...new Set(current.map((a) => AT_LANG[a.language.name]).filter(Boolean))].filter((l) => l !== 'de' && SUPPORTED.has(l));
    const dropped = current.map((a) => a.language.name).filter((n) => !AT_LANG[n]);
    if (!langs.length) { refused.push({ src: 'at', name: x.displayName, why: 'no supported current language: ' + current.map((a) => a.language.name).join(', ') }); continue; }
    if (langs.length > MAX_LANGS) { refused.push({ src: 'at', name: x.displayName, why: langs.length + ' languages' }); continue; }
    const hp = x.homepage ? (/^https?:\/\//.test(x.homepage) ? x.homepage : 'https://' + x.homepage.replace(/^\/+/, '')) : undefined;
    out.push({
      city, name: `${x.firstName} ${x.lastName}`.replace(/\s+/g, ' ').trim(), registerName: x.displayName, category: 'translator', languages: langs,
      url: hp, sourceUrl: `https://justizonline.gv.at/jop/web/exl/${x.code}`, evidence: 'official', checked: fetched,
      quote: current.map((a) => `${a.language.name}, zertifiziert bis ${String(a.certifiedUntil || '').slice(0, 10)}${a.verbalOnly ? ' (nur Dolmetschen)' : ''}`).join('; '),
      verbalOnlyAll: current.every((a) => a.verbalOnly) || undefined, droppedLanguages: dropped.length ? dropped : undefined, src: 'at',
    });
  }
}

// ---- Sweden -----------------------------------------------------------------
const SE_PAGE = 'https://www.kammarkollegiet.se/vara-tjanster/oversattare/sok-oversattare-i-vart-register';
const SE_URL = (dir) => SE_PAGE + '?sv.target=12.21789faa18d8279ffd2191cb&sv.12.21789faa18d8279ffd2191cb.route=/search&query=&reverse_sort=false&filters=' +
  encodeURIComponent(JSON.stringify([{ field: 'FromTo', value: dir }])) + '&svAjaxReqParam=ajax';
// ISO 639-2/3 as the register uses them. "bos,hrv,srp" arrives as one competence and is dropped
// whole rather than guessed into one of the three.
const SE_LANG = { eng: 'en', fra: 'fr', deu: 'de', spa: 'es', ita: 'it', por: 'pt', rus: 'ru', ukr: 'uk', pol: 'pl', ces: 'cs', slk: 'sk', hun: 'hu', ron: 'ro', bul: 'bg', slv: 'sl', sqi: 'sq', gre: 'el', ell: 'el', tur: 'tr', ara: 'ar', heb: 'he', pes: 'fa', fas: 'fa', zho: 'zh', cmn: 'zh', jpn: 'ja', kor: 'ko', vie: 'vi', tha: 'th', ind: 'id', hin: 'hi', urd: 'ur', pan: 'pa', ben: 'bn', tgl: 'tl', mya: 'my', dan: 'da', nor: 'no', fin: 'fi', est: 'et', lav: 'lv', lit: 'lt', nld: 'nl', isl: null, kat: 'ka', nep: 'ne', swa: 'sw', som: null };
// Stockholm, Gothenburg and Malmo municipality post towns only; Solna, Nacka, Taby, Molndal,
// Lund are separate municipalities.
const SE_CITY = {
  stockholm: 'stockholm', bromma: 'stockholm', enskede: 'stockholm', enskededalen: 'stockholm', hagersten: 'stockholm', johanneshov: 'stockholm', spanga: 'stockholm', skondal: 'stockholm',
  farsta: 'stockholm', arsta: 'stockholm', alvsjo: 'stockholm', bandhagen: 'stockholm', skarholmen: 'stockholm', vallingby: 'stockholm', hasselby: 'stockholm', kista: 'stockholm', skarpnack: 'stockholm', 'stockholm-globen': 'stockholm',
  goteborg: 'gothenburg', 'vastra frolunda': 'gothenburg', askim: 'gothenburg', 'hisings backa': 'gothenburg', 'hisings karra': 'gothenburg', angered: 'gothenburg', torslanda: 'gothenburg', billdal: 'gothenburg',
  malmo: 'malmo', limhamn: 'malmo', umea: 'umea',
};
async function fetchSe() {
  const h = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' };
  const from = await get(SE_URL('from'), { headers: h }); await sleep(1500);
  const to = await get(SE_URL('to'), { headers: h });
  save('se.json', JSON.stringify({ fetched: TODAY, from: JSON.parse(from).search_hits.result, to: JSON.parse(to).search_hits.result }));
  console.log('se: fetched');
}
function proposeSe(out, refused) {
  const raw = load('se.json'); if (!raw) return;
  const { from, to, fetched } = JSON.parse(raw);
  const by = new Map();
  for (const x of [...from, ...to]) {
    const p = by.get(x.interpreterId);
    if (p) p.competences = p.competences.concat(x.competences); else by.set(x.interpreterId, { ...x, competences: [...x.competences] });
  }
  for (const x of by.values()) {
    const city = SE_CITY[fold(x.city)];
    if (!city) continue;
    // The to-Swedish and from-Swedish answers each repeat the person's full competence list, so a
    // merged person carries every competence twice.
    const seen = new Set();
    const cur = x.competences.filter((c) => (!c.validTo || c.validTo >= TODAY) && !seen.has(JSON.stringify(c)) && seen.add(JSON.stringify(c)));
    const langs = [...new Set(cur.map((c) => SE_LANG[c.langugage]).filter(Boolean))].filter((l) => l !== 'sv' && SUPPORTED.has(l));
    const name = `${x.givenname} ${x.surname}`.trim();
    if (!langs.length) { refused.push({ src: 'se', name, why: 'no supported current language: ' + cur.map((c) => c.langugage).join(',') }); continue; }
    if (langs.length > MAX_LANGS) { refused.push({ src: 'se', name, why: langs.length + ' languages' }); continue; }
    out.push({
      city, name, category: 'translator', languages: langs, url: x.homepage || undefined,
      sourceUrl: SE_PAGE, evidence: 'official', checked: fetched,
      quote: `Translatorsnummer ${x.interpreterId}: ` + cur.map((c) => `${c.fromlanguage} till ${c.tolanguage}, giltig till ${c.validTo}`).join('; '),
      src: 'se',
    });
  }
}

// ---- Finland ----------------------------------------------------------------
const FI_API = 'https://akr.opintopolku.fi/akr/api/v1/translator';
const FI_PAGE = 'https://akr.opintopolku.fi/akr/';
const FI_TOWN = { helsinki: 'helsinki', helsingfors: 'helsinki', tampere: 'tampere', tammerfors: 'tampere', turku: 'turku', abo: 'turku', oulu: 'oulu', uleaborg: 'oulu', kuopio: 'kuopio', vaasa: 'vaasa', vasa: 'vaasa' };
async function fetchFi() { const t = await get(FI_API); save('fi.json', JSON.stringify({ fetched: TODAY, ...JSON.parse(t) })); console.log('fi: fetched'); }
function proposeFi(out, refused) {
  const raw = load('fi.json'); if (!raw) return;
  const { translators, fetched } = JSON.parse(raw);
  for (const x of translators) {
    if (x.country && x.country !== 'FIN') continue; // lives abroad
    const city = FI_TOWN[fold(x.town)];
    if (!city) continue;
    const codes = new Set();
    for (const p of x.languagePairs) for (const c of [p.from, p.to]) codes.add(String(c).toLowerCase());
    const langs = [...codes].filter((c) => c !== 'fi' && c !== 'sv' && SUPPORTED.has(c));
    const name = `${x.firstName} ${x.lastName}`.trim();
    if (!langs.length) { refused.push({ src: 'fi', name, why: 'only local or unsupported languages: ' + [...codes].join(',') }); continue; }
    if (langs.length > MAX_LANGS) { refused.push({ src: 'fi', name, why: langs.length + ' languages' }); continue; }
    out.push({
      city, name, category: 'translator', languages: langs, sourceUrl: FI_PAGE, evidence: 'official', checked: fetched,
      quote: x.languagePairs.map((p) => `${p.from}-${p.to}`).join(', '), src: 'fi',
    });
  }
}

// ---- Norway -----------------------------------------------------------------
const NO_API = 'https://www.tolkeregisteret.no/api/search?LanguageCode=ALL&Name=&TolkID=';
const NO_LANG = { ENG: 'en', FRA: 'fr', DEU: 'de', SPA: 'es', ITA: 'it', POR: 'pt', RUS: 'ru', UKR: 'uk', POL: 'pl', LIT: 'lt', LAV: 'lv', EST: 'et', FIN: 'fi', SWE: 'sv', DAN: 'da', NLD: 'nl', HUN: 'hu', RON: 'ro', BUL: 'bg', ELL: 'el', TUR: 'tr', ARB: 'ar', PES: 'fa', PRS: 'fa', URD: 'ur', PAN: 'pa', HIN: 'hi', TAM: 'ta', NEP: 'ne', SIN: 'si', VIE: 'vi', THA: 'th', TGL: 'tl', IND: 'id', MYA: 'my', CMN: 'zh', YUE: 'zh', JPN: 'ja', KOR: 'ko', KAT: 'ka', SWH: 'sw', ALN: 'sq', MKD: null };
// "CES Tsjekkisk, slovakisk" and "HBS Bosnisk, kroatisk, serbisk, montenegrinsk" name more than one
// language under one entry; neither is split into a guess. PRS (Dari) is recorded by the register
// as its own language and is not folded into Persian here either.
delete NO_LANG.PRS;
const NO_TOWN = { oslo: 'oslo', bergen: 'bergen', trondheim: 'trondheim', stavanger: 'stavanger', tromso: 'tromso' };
async function fetchNo() { const t = await get(NO_API + '0'); save('no.json', JSON.stringify({ fetched: TODAY, ...JSON.parse(t) })); console.log('no: fetched'); }
function proposeNo(out, refused) {
  const raw = load('no.json'); if (!raw) return;
  const { personResults, fetched } = JSON.parse(raw);
  const GRADE = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
  for (const x of personResults) {
    let city = null;
    if (x.domiciliated === 'Oslo') city = 'oslo';
    else if (x.showAdressInSearch && x.adress) { const m = x.adress.match(/\d{4}\s+([^,]+)$/); if (m) city = NO_TOWN[fold(m[1])] || null; }
    if (!city) continue;
    const spoken = x.languages.filter((l) => l.tolktype === 'Talespråktolk');
    const langs = [...new Set(spoken.map((l) => NO_LANG[l.code]).filter(Boolean))].filter((l) => l !== 'no' && SUPPORTED.has(l));
    const name = (x.chosenname || [x.firstname, x.middlename, x.lastname].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim()
      .toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    if (!langs.length) { refused.push({ src: 'no', name, why: 'no supported spoken language: ' + x.languages.map((l) => l.name).join(', ') }); continue; }
    if (langs.length > MAX_LANGS) { refused.push({ src: 'no', name, why: langs.length + ' languages' }); continue; }
    out.push({
      city, name, category: 'translator', languages: langs, sourceUrl: NO_API + x.tolkId, evidence: 'official', checked: fetched,
      quote: spoken.map((l) => `${l.name} (kategori ${GRADE[String(l.qualificationRank)[0]] || l.qualificationRank})`).join('; '),
      grade: Math.min(...spoken.filter((l) => NO_LANG[l.code]).map((l) => Number(String(l.qualificationRank)[0]))), src: 'no',
    });
  }
}

// ---- Iceland ----------------------------------------------------------------
const IS_BASE = 'https://www.lmfi.is';
const IS_LANG = { enska: 'en', danska: 'da', franska: 'fr', italska: 'it', norska: 'no', polska: 'pl', saenska: 'sv', spaenska: 'es', thyska: 'de' };
const IS_IDS = { 1: 'en', 2: 'da', 3: 'no', 4: 'sv', 5: 'de', 6: 'fr', 7: 'es', 8: 'pl', 9: 'it' };
const isFold = (s) => fold(s).replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/ð/g, 'd').replace(/ö/g, 'o');
const decodeHtml = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
async function fetchIs() {
  const ids = new Set();
  for (const id of Object.keys(IS_IDS)) {
    const h = await get(`${IS_BASE}/logmannalisti?language=${id}&name=&surname=&practice=&stadur=&category=`);
    for (const m of (h || '').matchAll(/href="\/logmannalisti\/(\d+\/[^"#]+)#lawyer"/g)) ids.add(m[1]);
    await sleep(1200);
  }
  console.log(`is: ${ids.size} lawyers list a language`);
  for (const id of ids) {
    const f = 'is/' + id.replace(/\//g, '_') + '.html';
    if (load(f)) continue;
    const h = await get(`${IS_BASE}/logmannalisti/${id}`);
    if (h) save(f, h);
    await sleep(1200);
  }
  save('is.json', JSON.stringify({ fetched: TODAY, ids: [...ids] }));
}
function proposeIs(out, refused) {
  const raw = load('is.json'); if (!raw) return;
  const { ids, fetched } = JSON.parse(raw);
  for (const id of ids) {
    const h = load('is/' + id.replace(/\//g, '_') + '.html'); if (!h) continue;
    const t = decodeHtml(h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    const body = t.slice(t.indexOf('Leita', t.indexOf('Allir Málaflokkar')) + 5);
    const name = body.trim().split(' Lögmaður')[0].trim();
    const town = (body.match(/Staður: (.*?) Sími:/) || [])[1] || '';
    const post = (body.match(/Póstnúmer: (\d+)/) || [])[1] || '';
    // The language field is followed by whatever the lawyer filled in next ("Vefsíða: ...",
    // "Erlend tengsl: Lex Mundi", or the practice-area list with no label at all), so it is read as
    // the leading run of words that are language names. Every Icelandic language name ends in -ska
    // (enska, danska, þýska); one that is not in our list is consumed and dropped, not mapped.
    const after = ((body.split('Tungumál:')[1]) || '').trim().split(/\s+/);
    const run = []; for (const w of after) { const c = w.replace(/[,.;]$/, ''); if (/ska$/i.test(c) || c === 'og') run.push(c); else break; }
    const langsRaw = run.join(' ');
    const firm = ((body.match(/Lögmannsstofa: (.*?) Aðsetur:/) || [])[1] || '').trim();
    const web = (body.match(/Vefsíða: (\S+)/) || [])[1];
    // Reykjavik municipality is post codes 101 to 162; Kopavogur (200), Gardabaer (210) and
    // Hafnarfjordur (220) are their own towns.
    const city = (/^reykjav/i.test(isFold(town)) && Number(post) >= 101 && Number(post) <= 162) ? 'reykjavik' : null;
    if (!city) continue;
    const words = langsRaw.split(/\s+/).filter(Boolean);
    const langs = [...new Set(words.map((w) => IS_LANG[isFold(w)]).filter(Boolean))];
    if (!langs.length) { refused.push({ src: 'is', name, why: 'no language on detail page: ' + langsRaw }); continue; }
    if (langs.length > MAX_LANGS) { refused.push({ src: 'is', name, why: langs.length + ' languages' }); continue; }
    out.push({
      city, name, category: 'legal', languages: langs, url: web ? (/^https?:/.test(web) ? web : 'https://' + web) : undefined,
      sourceUrl: `${IS_BASE}/logmannalisti/${id}`, evidence: 'official', checked: fetched, firm: firm || undefined,
      quote: 'Tungumál: ' + langsRaw, src: 'is',
    });
  }
}

// ---- sources ----------------------------------------------------------------
const SOURCES = {
  at: {
    publisher: 'Republik Österreich, vertreten durch das Bundesministerium für Justiz', url: 'https://justizonline.gv.at/jop/web/expertensuche/DO',
    licenceOrTermsQuote: 'IWG Nutzungsbedingungen: "Die Weiterverwendung (=die Nutzung durch Rechtsträger für kommerzielle und nichtkommerzielle Zwecke ...) wird unter folgenden Bedingungen gewährt ... Als Quelle der Datenbankinhalte ist bei der Weiterverwendung die Republik Österreich vertreten durch das BMJ anzugeben. Jede Veränderung oder Anreicherung der Datenbankinhalte ist in einer für den Endnutzer deutlich erkennbaren Form zu vermerken." Subsidiarily CC BY 4.0. https://justizonline.gv.at/jop/web/iwg/terms',
    pageNote: 'Some of these are on the list of court-certified interpreters and translators kept by Austria\'s Federal Ministry of Justice (source: Republik Österreich, vertreten durch das BMJ). A language is listed while its court certification is current; German, the other side of every certification, is left out.',
  },
  se: {
    publisher: 'Kammarkollegiet (Legal, Financial and Administrative Services Agency, Sweden)', url: SE_PAGE,
    licenceOrTermsQuote: 'Kept under 12 § förordningen (1985:613); "Sedan den 1 januari 2016 ska registret vara sökbart och tillgängligt för allmänheten." "Översättarregistret är både ett kontrollverktyg och ett rekryteringsinstrument". No reuse restriction found on kammarkollegiet.se.',
    pageNote: 'Some of these are on the register of authorised translators that Kammarkollegiet, a Swedish government agency, keeps by law. Each language is one the translator is authorised to translate to or from Swedish, while the authorisation is valid.',
  },
  fi: {
    publisher: 'Opetushallitus (Finnish National Agency for Education)', url: FI_PAGE,
    licenceOrTermsQuote: '"Rekisterin julkisesta hakukoneesta voi etsiä auktorisoituja kääntäjiä ja jättää heille yhteydenottopyynnön käännöstoimeksiantoa varten." No reuse restriction found in the service or its privacy statement.',
    pageNote: 'Some of these are on the register of authorised translators kept by Finland\'s National Agency for Education. Each language is one the translator is authorised to translate to or from Finnish or Swedish.',
  },
  no: {
    publisher: 'Integrerings- og mangfoldsdirektoratet (IMDi), Nasjonalt tolkeregister', url: 'https://www.tolkeregisteret.no/',
    licenceOrTermsQuote: '"Nasjonalt tolkeregister er et offentlig innsynsregister over kvalifiserte tolker i Norge." "Du kan kontakte tolker fra registeret direkte." No reuse restriction found; an API for systems is offered on registration.',
    pageNote: 'Some of these are interpreters on Norway\'s national register of qualified interpreters, kept by the Directorate of Integration and Diversity. Each language is one the interpreter is registered to interpret between it and Norwegian.',
  },
  is: {
    publisher: 'Lögmannafélag Íslands (Icelandic Bar Association)', url: IS_BASE + '/logmannalisti',
    licenceOrTermsQuote: 'No terms of use are published on lmfi.is (checked 2026-09-24); membership is compulsory under the Lawyers Act 77/1998.',
    pageNote: 'Some of these are on the lawyer list of the Icelandic Bar Association, to which every practising lawyer in Iceland must belong. The languages are the ones the lawyer has registered with the association.',
  },
};

// Rows already in the directory under another source: same city and same name, in any order of
// first and last name, since registers print "SURNAME Given" and embassy lists "Given Surname".
function alreadyListed(rows) {
  const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'));
  const key = (s) => fold(s).replace(/,.*$/, '').split(/[^a-z]+/).filter((w) => w.length > 1).sort().join(' ');
  const known = new Map(db.providers.map((p) => [p.city + '|' + key(p.name), p]));
  for (const r of rows) { const k = known.get(r.city + '|' + key(r.name)); if (k) r.alreadyListedAs = `${k.name} [${k.languages.join(',')}]`; }
}

function propose() {
  const all = {}; const refused = [];
  const fns = { at: proposeAt, se: proposeSe, fi: proposeFi, no: proposeNo, is: proposeIs };
  for (const [k, fn] of Object.entries(fns)) {
    const rows = []; fn(rows, refused);
    rows.forEach((r) => { if (!CITY[r.city]) throw new Error('not our city ' + r.city); });
    alreadyListed(rows);
    all[k] = { source: SOURCES[k], rows };
    const by = {}; rows.forEach((r) => { by[r.city] = (by[r.city] || 0) + 1; });
    console.log(k, rows.length, JSON.stringify(by), rows.filter((r) => r.alreadyListedAs).length, 'already listed');
  }
  fs.writeFileSync(path.join(CACHE, 'proposals.json'), JSON.stringify(all, null, 1));
  fs.writeFileSync(path.join(CACHE, 'refused.json'), JSON.stringify(refused, null, 1));
  console.log(refused.length, 'refused');
}

module.exports = { atCity, AT_LANG, SE_LANG, NO_LANG, SOURCES };

if (require.main === module) {
  (async () => {
    fs.mkdirSync(CACHE, { recursive: true });
    if (cmd === 'fetch') {
      if (ONLY.has('at')) await fetchAt();
      if (ONLY.has('se')) await fetchSe();
      if (ONLY.has('fi')) await fetchFi();
      if (ONLY.has('no')) await fetchNo();
      if (ONLY.has('is')) await fetchIs();
      return;
    }
    if (cmd === 'propose') return propose();
    console.error('usage: node scripts/read_west_registers.cjs <fetch|propose> --cache <dir> [--only at,se,fi,no,is]');
    process.exit(2);
  })();
}
