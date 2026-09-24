/**
 * Reads a gov.uk "list of medical facilities" publication page (UK FCDO) into one row per facility.
 *
 * scripts/parse_fcdo_table.cjs reads the same lists, but from a text dump, one field per line, and
 * it writes a file of its own rather than answering --json, so the batch ingest cannot run it. This
 * one reads the HTML attachment itself, where the table structure is still there, and answers in the
 * shape scripts/ingest_verified_sources.cjs expects: { name, area, languages, specialty, url }.
 *
 * The lists share a template, "Name of medical facility | Email | Telephone | Address | English
 * speaking staff | Main specialisation | Public/Private facility", but the columns move, get renamed
 * and come and go, so every table is read by its own header and never by position:
 *   - Belgium prints the address before the telephone, China after it.
 *   - Belarus adds a City column and Brunei a Regions served column, both of which are where the
 *     town is, so they go into the address the ingest places the row by.
 *   - Uzbekistan and the Palestinian list have a Languages column instead of, or as well as, the
 *     English tick. That column is read for what it names, and nothing more.
 *   - Several tables (Ecuador, Moldova, Cyprus) have no <thead> and carry the header as their first
 *     row. A first row that names a column the way a header does is read as the header.
 *   - A page may split one list into a table per city, and a later table may repeat no header at
 *     all. It then inherits the header of the table before it, but only when the cell counts agree.
 *
 * The language rule is the FCDO's own. A row gets English only when its English column says Yes.
 * "-", an empty cell, "No", "Some", "Limited" and "On request" are not a claim and give nothing, so
 * the ingest leaves those rows out on a per-entry source. A list that has no English column at all
 * is not read as a roster here either: whether the whole list may carry English is the manifest's
 * decision (claimType roster, with the quote), not the parser's.
 *
 * Traps paid for while writing this:
 *   - Suriname's rows hold one cell more than the header (the website and the email that the header
 *     calls "Website or Email" are two cells), which slid Yes into the specialisation. The English
 *     cell is found by looking for the Yes/No answer within one cell either side of where the header
 *     puts it, and every column from the email on shifts by the same amount.
 *   - The name cell carries the Chinese name after the English one ("Beijing United Family Hospital
 *     北京和睦家医院") and, once, a stray "#" after the link. Only the Latin part is kept.
 *   - Pharmacies are listed in the same tables or in a section of their own. The ingest has no word
 *     for a pharmacy in its category table, and a manifest that says "doctor" would file every one of
 *     them as a doctor. So they are left out by default and are the ONLY thing read with --pharmacies.
 *   - A section heading is where a table says what its rows are ("Dental clinics", "Pharmacies",
 *     "Hospitals in Almaty"). It is taken from the nearest heading above the table in document order,
 *     never from a heading below it, which is the mistake the French readers make.
 *
 * Usage: node scripts/parse_fcdo_lists.cjs <page.html|pdf.txt|fap.json> [--pharmacies] [--roster] [--country "<Country>"] [--json]
 *   --country keeps only rows whose address names one of the site's cities in that country (the
 *   city names plus local spellings), so a country-wide list filed under one city cannot put a
 *   hospital from a town we do not cover into the city it was found for.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));

const args = process.argv.slice(2);
const file = args[0];
if (!file || !fs.existsSync(file)) {
  console.error('usage: node scripts/parse_fcdo_lists.cjs <page.html|pdf.txt|fap.json> [--pharmacies] [--roster] [--country "<Country>"] [--json]');
  process.exit(2);
}
const PHARMACIES = args.includes('--pharmacies');
// The page's own title is the claim ("List of English-speaking doctors in Iraq") and the table has no
// English column: rows are emitted without languages for the manifest's roster claim to cover.
const ROSTER = args.includes('--roster');
const countryAt = args.indexOf('--country');
const COUNTRY = countryAt > 0 ? args[countryAt + 1] : '';
const IS_JSON = /\.json$/i.test(file);
const html = IS_JSON ? '' : fs.readFileSync(file, 'utf8');
// Only the languages the directory has. The lists name Lao, Uzbek and Tigrinya, which it does not,
// and the ingest does not check a row's own codes, so an unknown one would go straight onto a card.
const SUPPORTED = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'service-languages.json'), 'utf8'))._languages;
/**
 * The local language of the country, which is never published: "a Czech-speaking translator in
 * Prague" tells a reader nothing. The site's own table (service_data LOCAL) decides where it has an
 * answer. It only lists countries that already hold rows, so the countries these lists bring in for
 * the first time are answered here, and the same values are proposed for LOCAL in the report. null
 * means no single local language the directory has a code for (Kazakhstan and Uzbekistan are
 * already null on the site for that reason).
 */
const LOCAL_EXTRA = {
  Madagascar: 'fr', Gabon: 'fr', Senegal: 'fr', 'Ivory Coast': 'fr', Benin: 'fr', Burundi: 'fr', Djibouti: 'fr',
  Monaco: 'fr', Cameroon: null, Rwanda: null, Pakistan: 'ur', Bangladesh: 'bn', Iraq: 'ar', Kuwait: 'ar',
  Qatar: 'ar', Bahrain: 'ar', 'Saudi Arabia': 'ar', Lebanon: 'ar', Algeria: 'ar', Mauritania: 'ar',
  Palestine: 'ar', Cyprus: 'el', Moldova: 'ro', 'Bosnia and Herzegovina': null, Kosovo: 'sq', Slovakia: 'sk',
  Finland: 'fi', Iceland: null, Azerbaijan: null, Belarus: null, Kyrgyzstan: null, Tajikistan: 'tg',
  Turkmenistan: null, Mongolia: null, Iran: 'fa', Maldives: null, Brunei: 'ms', Cuba: 'es',
  'Dominican Republic': 'es', Honduras: 'es', Panama: 'es', Suriname: 'nl', Angola: 'pt', Mozambique: 'pt',
  'Timor-Leste': 'pt', Andorra: 'ca', Eritrea: null, Vanuatu: null,
};
let LOCAL_LANG;
if (COUNTRY) {
  const M0 = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
  LOCAL_LANG = COUNTRY in M0.LOCAL ? M0.LOCAL[COUNTRY] : LOCAL_EXTRA[COUNTRY];
}
const supported = (codes) => codes.filter((c) => SUPPORTED[c] && c !== LOCAL_LANG);

// Only the publication body. The page furniture has tables of its own (cookie banners do not, but
// the "related content" sidebar has headings that would otherwise become section names).
const bodyStart = html.search(/<div[^>]*class="[^"]*govspeak[^"]*"/);
const body = bodyStart >= 0 ? html.slice(bodyStart) : html;

const text = (frag) => T.unentity(String(frag || '')
  .replace(/<br\s*\/?>/gi, ', ')
  .replace(/<\/(p|div|li)>/gi, ', ')
  .replace(/<[^>]*>/g, ' '))
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .replace(/(\s*,\s*)+/g, ', ')
  .replace(/^[\s,]+|[\s,]+$/g, '');

// The Latin part of a name. CJK, Arabic, Cyrillic and the like are the local-script name printed
// beside the English one; the card prints the English one.
const latinName = (s) => text(s)
  .replace(/[^\u0000-ɏ‘’“”–—]+/g, ' ')
  .replace(/#\s*$/, '')
  // A bracket in a name is an abbreviation or an aside, "(IMC)", "(CMC)", "(supported by the French
  // Embassy)", "(i.e. Anhui Mental Health Centre)". The ingest refuses any name with a bracket in it,
  // and the name without the aside is still the name.
  .replace(/\s*\([^()]*\)/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/^[\s,.;:-]+|[\s,;:-]+$/g, '');

/**
 * What a facility does, in a form the ingest's category table reads correctly.
 *
 * A hospital's specialisation cell is a list of every department it has, "Accident & Emergency,
 * Cardiology, Dental, Diagnostic Radiology ...", and the ingest, finding both a doctor word and a
 * dentist word, prefers the one that is not doctor: the Aga Khan Hospital in Dar es Salaam and the
 * Kilimanjaro Christian Medical Centre both came out as dentists. A cell that lists three or more
 * fields, or says "all specialisations", is a general facility, and is passed on as that.
 */
const specialityOf = (cell) => {
  const c = String(cell || '').replace(/^.*?(specialisations? (are )?(in|as)|specialist services include|speciali[sz](ing|ation) in)\s*/i, '').trim();
  if (!c || c === '-') return '';
  const parts = c.split(/[,;•]|\band\b/).map((x) => x.trim()).filter((x) => x.length > 2);
  // Unless the list is all one trade: Moldova's Denta Vita lists "Dental treatment; dental products;
  // surgery and implants", which is three fields of one dental practice, not a hospital.
  const dental = parts.filter((x) => /dent|orthodon|implant|stomatolog|oral|teeth|tooth/i.test(x)).length;
  if (parts.length >= 3 && dental * 2 >= parts.length) return 'Dental';
  if (parts.length >= 3 || /\ball\s+(specialisations?|specializations?|health ?care|medical)\b|general hospital|multi-?special/i.test(c)) return 'General medical';
  return c;
};

// --- the document in order: headings and tables -----------------------------------------------
const tokens = [];
const re = /<h([2-4])[^>]*>([\s\S]*?)<\/h\1>|<table[\s\S]*?<\/table>/gi;
let m;
while ((m = re.exec(body))) {
  if (m[1]) tokens.push({ kind: 'h', level: +m[1], text: text(m[2]) });
  else tokens.push({ kind: 'table', html: m[0] });
}

const rowsOf = (tableHtml) => (tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [])
  .map((tr) => (tr.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || []).map((c) => ({
    html: c,
    text: text(c.replace(/^<t[hd][^>]*>|<\/t[hd]>$/gi, '')),
  })));

// Which column a header cell names. Order matters: "Name of doctor/medical facility" is a name
// even though it contains "medical facility", and "English speaking staff" is the English column
// even though "Languages" might also match further down.
const COLS = [
  ['english', /\benglish\b/i],
  ['languages', /^languages?\b|language\(s\)/i],
  ['email', /e-?mail|website/i],
  ['phone', /telephone|phone|\bcell\b|mobile|contact/i],
  ['address', /^address|\baddress\b/i],
  ['city', /^(city|town|region|regions served|areas? covered|locations?|area)\b/i],
  ['speciality', /speciali[sz]|specialty|type of (medical )?facility|services provided|^services\b|treat/i],
  ['name', /^name|company|facility$|^hospital|^clinic|^doctor|practitioner/i],
];
const labelOf = (t) => { const hit = COLS.find(([, r]) => r.test(t)); return hit ? hit[0] : null; };
const looksLikeHeader = (cells) => {
  const labels = cells.map((c) => labelOf(c.text));
  return labels.includes('name') && (labels.includes('phone') || labels.includes('address') || labels.includes('email'))
    && cells.every((c) => c.text.length < 60);
};

// What an English cell says. The lists do not all write Yes: Guatemala writes "English speaking
// staff", Latvia "They have English speaking staff", Gabon "Speaks English", Uruguay once "Most
// staff speaks English". Those are the list answering yes in its own words. What is NOT a yes:
// "Some", "Some staff may speak English", "Upon request", "Understands English", "Understands and
// speaks some English", "They DON'T have English speaking staff", "Yes, limited", and a bare "-".
// A hedge is not a claim.
const YES = /^\s*(yes\b|(they\s+have\s+)?english[- ]speaking(\s+staff)?\s*$|speaks english\s*$|most staff speaks? english\s*$)/i;
const HEDGE = /\b(some|may|limited|partial|basic|request|understands?|little|few|not|don.?t|no)\b/i;
const isYes = (cell) => YES.test(cell) && !HEDGE.test(cell.replace(/^\s*yes\b/i, ''));
// Any answer at all, used only to find the English cell when a row has slid by one.
const GRADED = /^\s*(yes|no|some|limited|partial|basic|upon request|on request)\b|english/i;

const PHARMACY = /pharmac|drugstore|drug store|chemist|apotek|farmacia|pharmacie/i;

const localTown = (() => {
  if (!COUNTRY) return null;
  const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
  // The spellings these lists actually use for our cities, where the site's name is not it.
  const EXTRA = {
    kualalumpur: ['kuala lumpur'], hochiminhcity: ['ho chi minh', 'hcmc', 'saigon'],
    addisababa: ['addis ababa', 'addis abeba'], daressalaam: ['dar es salaam', 'dar-es-salaam'],
    santodomingo: ['santo domingo'], puntacana: ['punta cana', 'bavaro'], sanjosecr: ['san jose'],
    santacruz: ['santa cruz'], lapaz: ['la paz'], stonetown: ['stone town'], montegobay: ['montego bay'],
    bandarseribegawan: ['bandar seri begawan'], georgetownguyana: ['georgetown'], portofspain: ['port of spain'],
    andorralavella: ['andorra la vella'], ulaanbaatar: ['ulan bator', 'ulaanbaatar'], nukualofa: ["nuku'alofa", 'nukualofa'],
    portvila: ['port vila'], stgeorges: ["st george's", 'st georges', 'st. george'], male: ['male', "male'"],
    abudhabi: ['abu dhabi'], rasalkhaimah: ['ras al khaimah', 'ras al-khaimah'], luangprabang: ['luang prabang'],
    vangvieng: ['vang vieng'], nosybe: ['nosy be'], sanpedrobelize: ['san pedro'], hongkong: ['hong kong'],
    clujnapoca: ['cluj-napoca', 'cluj napoca', 'cluj'], telaviv: ['tel aviv', 'tel-aviv'], chiangmai: ['chiang mai'],
    victoriafalls: ['victoria falls'], capecoast: ['cape coast'], banjaluka: ['banja luka'], hercegnovi: ['herceg novi'],
    novisad: ['novi sad'], velikotarnovo: ['veliko tarnovo'], karlovyvary: ['karlovy vary'], ceskykrumlov: ['cesky krumlov'],
    mexicocity: ['mexico city', 'ciudad de mexico', 'cdmx'], buenosaires: ['buenos aires'], saopaulo: ['sao paulo'],
    puntadeleste: ['punta del este'], wadimusa: ['wadi musa'], wadirum: ['wadi rum'], sidibousaid: ['sidi bou said'],
    portsaid: ['port said'], phnompenh: ['phnom penh'], siemreap: ['siem reap'], kampongcham: ['kampong cham'],
    lakeatitlan: ['atitlan', 'panajachel'], quetzaltenango: ['quetzaltenango', 'xela'],
    chisinau: ['chisinau', 'kishinev'], tbilisi: ['tbilisi'], erbil: ['erbil', 'arbil', 'hawler'],
    kuwait: ['kuwait city'], doha: ['doha'], muscat: ['muscat'], manama: ['manama'],
    // Two of our "cities" are named after their country, and an address that ends in the country's
    // name says nothing about the town. Those are matched on their towns only (see below).
    cyprus: ['nicosia', 'lefkosia', 'limassol', 'larnaca'], mauritius: ['port louis'], mahe: ['victoria'],
    panama: ['panama city', 'ciudad de panama'],
    // Albanian writes the town in its definite form in half the addresses: "Rruga e Dibres 372, Tirane".
    tirana: ['tirane'], shkoder: ['shkodra'], vlore: ['vlora'], gjirokaster: ['gjirokastra'], sarande: ['saranda'], kruja: ['kruje'],
    yerevan: ['erevan'], bishkek: ['biskek'], ashgabat: ['ashkhabad'], dushanbe: ['dushanbeh'],
    santacruz: ['santa cruz de la sierra', 'santa cruz'],
  };
  const inCountry = Object.values(M.CITY).filter((c) => c.country === COUNTRY);
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const needles = inCountry.map((c) => ({
    id: c.id,
    words: [...new Set([c.name === c.country ? '' : fold(c.name), ...(EXTRA[c.id] || []).map(fold)])].filter((w) => w.length >= 4),
  }));
  const word = (t, w) => new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])').test(t);
  return (where) => {
    const t = fold(where);
    const hits = needles.filter((n) => n.words.some((w) => word(t, w)));
    return hits.length === 1 ? hits[0].id : (hits.length ? 'ambiguous' : '');
  };
})();

const out = [];
const stats = { tables: 0, noHeader: 0, rows: 0, noClaim: 0, pharmacySkipped: 0, notPharmacy: 0, noTown: 0, ambiguousTown: 0, noName: 0 };
const unknownLangs = new Set();
let heading = '';
let lastHeader = null;
for (const tok of tokens) {
  if (tok.kind === 'h') { heading = tok.text; continue; }
  stats.tables++;
  const rows = rowsOf(tok.html).filter((r) => r.length);
  if (!rows.length) continue;
  let header = null;
  let data = rows;
  const theadRow = /<thead/i.test(tok.html) ? rowsOf((tok.html.match(/<thead[\s\S]*?<\/thead>/i) || [''])[0])[0] : null;
  if (theadRow && looksLikeHeader(theadRow)) { header = theadRow; data = rows.slice(1); }
  else if (looksLikeHeader(rows[0])) { header = rows[0]; data = rows.slice(1); }
  else if (lastHeader && rows[0].length === lastHeader.length) { header = lastHeader; }
  if (!header) { stats.noHeader++; continue; }
  lastHeader = header;
  const labels = header.map((c) => labelOf(c.text));
  const at = (k) => labels.indexOf(k);
  const tablePharmacy = PHARMACY.test(heading) || PHARMACY.test(header[0].text);

  for (const r of data) {
    if (r.every((c) => !c.text || c.text === '-')) continue;
    stats.rows++;
    // Where the English answer really is. See the Suriname note at the top.
    let shift = 0;
    const e = at('english');
    if (e >= 0 && !GRADED.test((r[e] || {}).text || '')) {
      if (GRADED.test((r[e + 1] || {}).text || '')) shift = 1;
      else if (GRADED.test((r[e - 1] || {}).text || '')) shift = -1;
    }
    const pivot = at('email') >= 0 ? at('email') : at('name');
    const cell = (k) => {
      const i = at(k);
      if (i < 0) return null;
      const j = i > pivot ? i + shift : i;
      return r[j] || null;
    };
    const nameCell = cell('name') || r[0];
    const name = latinName(nameCell.html.replace(/^<t[hd][^>]*>|<\/t[hd]>$/gi, ''));
    const url = ((nameCell.html.match(/href="(https?:\/\/[^"]+)"/i) || [])[1]
      || (((cell('email') || {}).html || '').match(/href="(https?:\/\/[^"]+)"/i) || [])[1] || '');
    const address = (cell('address') || {}).text || '';
    const town = (cell('city') || {}).text || '';
    const englishCell = (cell('english') || {}).text || '';
    const langCell = (cell('languages') || {}).text || '';
    const speciality = (cell('speciality') || {}).text || '';

    const isPharmacy = tablePharmacy || PHARMACY.test(name) || /^\s*(pharmac|chemist|drugstore)/i.test(speciality);
    if (PHARMACIES && !isPharmacy) { stats.notPharmacy++; continue; }
    if (!PHARMACIES && isPharmacy) { stats.pharmacySkipped++; continue; }

    const languages = [];
    if (isYes(englishCell)) {
      languages.push('en');
      // "Yes, and French" is the list naming a second language for this row, in its own words.
      L.readLanguages(englishCell.replace(YES, ''), false, unknownLangs).forEach((c) => { if (!languages.includes(c)) languages.push(c); });
    }
    if (langCell) L.readLanguages(langCell, false, unknownLangs).forEach((c) => { if (!languages.includes(c)) languages.push(c); });
    // A roster page (--roster) with no column of its own: the row inherits the page's claim in the
    // ingest and carries nothing here. Where the table does have a column, the column decides.
    const rosterRow = ROSTER && e < 0 && at('languages') < 0;
    if (!languages.length && !rosterRow) { stats.noClaim++; continue; }
    // More than six languages for one entry is a list nobody can vouch for; the rule is to refuse it.
    if (languages.length > 6) { stats.noClaim++; continue; }

    if (!name || name.length < 4) { stats.noName++; continue; }

    // A separate town column is the town; the address may not repeat it.
    const area = [address, town && !address.toLowerCase().includes(town.toLowerCase()) ? town : '']
      .filter(Boolean).join(', ');
    let hit = '';
    if (localTown) {
      hit = localTown(area);
      if (!hit) { stats.noTown++; continue; }
      if (hit === 'ambiguous') { stats.ambiguousTown++; continue; }
    }

    const langs = supported(languages);
    // Only the local language, or only languages the directory has no code for.
    if (!langs.length && !rosterRow) { stats.onlyLocal = (stats.onlyLocal || 0) + 1; continue; }
    out.push({
      name,
      town: hit,
      area,
      languages: langs,
      specialty: PHARMACIES ? 'Pharmacy' : [heading, specialityOf(speciality)].filter((s) => s && s !== '-').join(' - '),
      ...(url ? { url } : {}),
      englishCell,
    });
  }
}

/**
 * The pages with no table at all: Laos, Myanmar, Lebanon and Bahrain set each facility as a heading
 * followed by its details, and the language claim as a sentence in a bullet list under it:
 *
 *   ## Alliance International Medical Centre
 *   Honda Complex, Souphanuvong Road, ... Vientiane Capital, Lao P.D.R.
 *   Tel: ... / Email: ... / Website: ...
 *   This hospital has told us the following things:
 *     - They have English speaking staff
 *     - ... they speak English, Lao, Thai
 *
 * A heading with no contact line under it is a section ("Vientiane", "2. List of medical
 * facilities"), not a facility. Bahrain gives no per-entry sentence: its section heading is "List of
 * medical facilities with English-speaking staff", and that heading is the claim for every entry
 * under it, in the page's own words. A heading anywhere else that merely mentions English is not.
 *
 * "they speak English, French, Dutch, German, Russian, Japanese, Lao, Thai" names eight languages,
 * and a list of more than six is refused whole. The separate "They have English speaking staff"
 * bullet is a claim of its own and still stands.
 */
if (!tokens.some((t) => t.kind === 'table')) {
  const flat = body
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => '\n@@H ' + text(t) + '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const lines = T.unentity(flat).split('\n').map((s) => s.replace(/[•●▪]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const CONTACT = /^(tel|telephone|phone|mobile|emergency|fax|e-?mail|website|web|24\/7|whatsapp)\b/i;
  const blocks = [];
  let cur = null;
  lines.forEach((l) => {
    if (l.startsWith('@@H ')) { cur = { head: l.slice(4), lines: [] }; blocks.push(cur); return; }
    if (cur) cur.lines.push(l);
  });
  let section = '';
  let sectionClaim = false;
  for (const b of blocks) {
    const isEntry = b.lines.some((l) => CONTACT.test(l.replace(/^[*\-\s]+/, '')));
    if (!isEntry) {
      section = b.head;
      // Only a heading that says the entries under it have English-speaking staff.
      sectionClaim = /english[- ]speaking\s+(staff|doctors|medical|facilit)|with english[- ]speaking/i.test(b.head);
      continue;
    }
    stats.rows++;
    const name = latinName(b.head.replace(/^\d+(\.\d+)*\.?\s+/, '').replace(/\s*\((private|public|government)\)\s*$/i, ''));
    const labelled = (re) => { const l = b.lines.find((x) => re.test(x)); return l ? l.replace(re, '').replace(/^\s*[:\-]\s*/, '').trim() : ''; };
    const address = labelled(/^(address|location)\s*:?/i)
      || b.lines.find((l) => !CONTACT.test(l) && !/told us|^they |^it.s |^you |^their |^specialis|^main |^public|^open|^family|^staff/i.test(l)) || '';
    const speciality = labelled(/^(main specialisation|specialisations? (are )?(in|as)?|they offer)\s*/i);
    const url = (b.lines.map((l) => (l.match(/https?:\/\/\S+|www\.\S+/i) || [])[0]).find(Boolean) || '').replace(/[.,)]+$/, '');
    const all = b.lines.join(' \n ');
    const isPharmacy = PHARMACY.test(name) || PHARMACY.test(section);
    if (PHARMACIES && !isPharmacy) { stats.notPharmacy++; continue; }
    if (!PHARMACIES && isPharmacy) { stats.pharmacySkipped++; continue; }

    const languages = [];
    // "They have English speaking staff", and Laos's longer form of it, "They have English, French,
    // Thai, Vietnam, Russian speaking staff". "They have some / very few / less English speaking
    // staff" (Myanmar) is a hedge and does not match, because the list has to start at English or
    // at another language name directly after "have".
    const HAVE = /\bthey have ((?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+))*English(?:(?:\s*,\s*|\s+and\s+)[A-Z][a-z]+)*)\s+speaking staff\b/i;
    const haveLine = b.lines.map((l) => l.match(HAVE)).find((x) => x && !/\b(some|few|less|limited)\b/i.test(x[1]));
    const yesLine = !!haveLine || b.lines.some((l) => /english[- ]speaking staff\s*:\s*yes\b/i.test(l));
    if (yesLine || sectionClaim) languages.push('en');
    if (haveLine) {
      const named = haveLine[1].split(/,|\band\b/).map((s) => s.trim()).filter(Boolean).length;
      if (named <= 6) L.readLanguages(haveLine[1], false, unknownLangs).forEach((c) => { if (!languages.includes(c)) languages.push(c); });
      else stats.overSix = (stats.overSix || 0) + 1;
    }
    // "Staff speak English, French, Arabic" / "... they speak English, Lao, Thai".
    const spoken = all.match(/\b(?:staff|they)\s+speak\s+([A-Za-z ,/&]+?)(?:\.|\n|$)/i);
    if (spoken) {
      const got = L.readLanguages(spoken[1], false, unknownLangs);
      const named = spoken[1].split(/,|\band\b|\//).map((s) => s.trim()).filter(Boolean).length;
      if (named <= 6) got.forEach((c) => { if (!languages.includes(c)) languages.push(c); });
      else stats.overSix = (stats.overSix || 0) + 1;
    }
    if (!languages.length) { stats.noClaim++; continue; }
    if (!name || name.length < 4) { stats.noName++; continue; }
    let hit = '';
    if (localTown) {
      hit = localTown(address);
      if (!hit) { stats.noTown++; continue; }
      if (hit === 'ambiguous') { stats.ambiguousTown++; continue; }
    }
    const kind = (all.match(/this (hospital|clinic|practice|centre|center|pharmacy|dentist)/i) || [])[1] || '';
    const langs = supported(languages);
    // Only the local language, or only languages the directory has no code for.
    if (!langs.length) { stats.onlyLocal = (stats.onlyLocal || 0) + 1; continue; }
    out.push({
      name,
      town: hit,
      area: address,
      languages: langs,
      specialty: PHARMACIES ? 'Pharmacy' : [section, kind, specialityOf(speciality)].filter(Boolean).join(' - '),
      ...(url ? { url: /^https?:/.test(url) ? url : 'http://' + url } : {}),
      englishCell: yesLine ? 'They have English speaking staff' : (sectionClaim ? section : ''),
    });
  }
}

/**
 * The FCDO's "Find a professional service abroad" results, as scripts/fetch_fcdo_professionals.cjs
 * saved them: law_<Country>.json and tr_<Country>_<lang>.json, { service, country, url, rows }.
 *
 * The JSON and not the HTML beside it, because the HTML is only the first results page: the service
 * shows ten providers a page, and the fetcher walks the rest into the JSON alone. Reading the HTML
 * would have taken ten of Pakistan's 63 lawyers and looked complete.
 *
 * Lawyers carry no language of their own. The service says of every one of them "All lawyers on the
 * lists have confirmed they can provide services in English", so that is a roster claim, and the
 * manifest makes it (claimType roster, rosterLanguage en). The row carries none, and nothing that
 * would categorise it wrongly either: the practice areas ("Corporate, Family, Tax") are left out of
 * the row, because the ingest would read "Tax" in them and file a law firm as a tax adviser.
 *
 * Translators name their languages per person, in ISO 639 English names, and several of those names
 * have a comma inside them: "Greek, Modern (1453-)", "Bokmal, Norwegian; Norwegian Bokmal". Split
 * on commas first and Greek becomes two languages, one of them "Modern". Those names are taken out
 * whole before the split. Every translator on the service "can translate and/or interpret to and
 * from English", so English is added to what the entry names, and the local language comes off.
 * An entry that names more than six languages is refused whole: that is an agency's catalogue, not a
 * claim anyone can check. The count is of what the source printed, before anything is added or
 * taken off.
 *
 * A translation provider may be listed under several language sweeps of the same country
 * (tr_Czechia_cs and tr_Czechia_de), so every sweep file for the country beside the one named is
 * read and the entries merged by name.
 */
if (IS_JSON) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const isTranslators = /translators/.test(j.service || '') || /^tr_/.test(path.basename(file));
  let rows = j.rows || [];
  if (isTranslators) {
    const prefix = path.basename(file).replace(/_[a-z]{2}\.json$/, '_');
    const siblings = fs.readdirSync(path.dirname(file)).filter((f) => f.startsWith(prefix) && /_[a-z]{2}\.json$/.test(f));
    const byName = new Map();
    siblings.forEach((f) => {
      JSON.parse(fs.readFileSync(path.join(path.dirname(file), f), 'utf8')).rows.forEach((r) => {
        const e = byName.get(r.name);
        if (!e) { byName.set(r.name, { ...r }); return; }
        // Two sweeps print the same entry; the languages are the same list, keep the longer one.
        if ((r.languages || '').length > (e.languages || '').length) e.languages = r.languages;
      });
    });
    rows = [...byName.values()];
    stats.sweeps = siblings.length;
  }

  // ISO 639 English names as the service prints them, including the ones with commas inside.
  const ISO_WITH_COMMA = [/Greek, Modern \(1453-\)/g, /Bokm.l, Norwegian; Norwegian Bokm.l/g, /Norwegian Nynorsk; Nynorsk/g];
  const ISO = {
    english: 'en', german: 'de', french: 'fr', spanish: 'es', russian: 'ru', georgian: 'ka', hebrew: 'he',
    japanese: 'ja', korean: 'ko', thai: 'th', turkish: 'tr', portuguese: 'pt', italian: 'it', polish: 'pl',
    dutch: 'nl', vietnamese: 'vi', indonesian: 'id', chinese: 'zh', catalan: 'ca', hungarian: 'hu',
    arabic: 'ar', hindi: 'hi', urdu: 'ur', tamil: 'ta', bengali: 'bn', malayalam: 'ml', ukrainian: 'uk',
    persian: 'fa', tajik: 'tg', finnish: 'fi', swedish: 'sv', estonian: 'et', czech: 'cs', greek: 'el',
    afrikaans: 'af', serbian: 'sr', malay: 'ms', romanian: 'ro', danish: 'da', burmese: 'my',
    'central khmer': 'km', khmer: 'km', tagalog: 'tl', filipino: 'tl', bulgarian: 'bg', croatian: 'hr',
    swahili: 'sw', sinhala: 'si', latvian: 'lv', lithuanian: 'lt', nepali: 'ne', slovenian: 'sl',
    albanian: 'sq', norwegian: 'no', 'norwegian bokmal': 'no', slovak: 'sk', panjabi: 'pa', punjabi: 'pa',
    kannada: 'kn', telugu: 'te',
  };
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const readIso = (line) => {
    let s = String(line || '');
    const whole = [];
    ISO_WITH_COMMA.forEach((re) => { s = s.replace(re, (x) => { whole.push(x); return ' '; }); });
    const names = whole.concat(s.split(',').map((x) => x.trim()).filter(Boolean));
    const codes = names.map((n) => {
      const first = fold(n.split(';')[0].replace(/\(.*\)/, '').replace(/,.*$/, ''));
      const c = ISO[first];
      if (!c) unknownLangs.add(first);
      return c;
    }).filter(Boolean);
    return { printed: names.length, codes: [...new Set(codes)] };
  };

  // The name as the card should print it: the service appends the kind of practice in brackets.
  const cleanName = (n) => String(n || '').replace(/\s*\((Independent\/sole practitioner|Company|Freelance[^)]*|Agency[^)]*|[^)]*practitioner[^)]*|Small firm[^)]*|Medium firm[^)]*|Large firm[^)]*)\)\s*$/i, '').trim();
  // The source prints a damaged name for at least one entry: a dropped umlaut made "Sulke Thyssen"
  // into "S Lke Thyssen" on the service itself. A lone capital first, then a short broken fragment.
  const looksDamaged = (n) => /^[A-Z]\s[A-Z][a-z]{1,3}(\s|$)/.test(n);

  for (const r of rows) {
    stats.rows++;
    const name = cleanName(T.unentity(r.name));
    if (!name || name.length < 4 || looksDamaged(name)) { stats.noName++; continue; }
    const address = T.unentity(r.address || '').replace(/\s+-\s+/g, ', ').replace(/\s+/g, ' ').trim();
    let hit = '';
    if (localTown) {
      hit = localTown(address);
      if (!hit) { stats.noTown++; continue; }
      if (hit === 'ambiguous') { stats.ambiguousTown++; continue; }
    }
    let languages = [];
    if (isTranslators) {
      const { printed, codes } = readIso(r.languages);
      if (printed > 6) { stats.overSix = (stats.overSix || 0) + 1; continue; }
      languages = supported(['en', ...codes]);
      if (!languages.length) { stats.onlyLocal = (stats.onlyLocal || 0) + 1; continue; }
    }
    out.push({
      name,
      town: hit,
      area: address,
      languages,
      ...(isTranslators ? { specialty: 'Translation' } : {}),
      ...(r.website && /^https?:/.test(r.website) && !/linkedin|facebook/i.test(r.website) ? { url: r.website } : {}),
      languageCell: isTranslators ? (r.languages || '') : '',
    });
  }
}

/**
 * The PDF lists (Tanzania, Tunisia), read from `pdftotext -layout` output saved as .txt.
 *
 * They are the block pages again, printed: a name at the left margin, the address and contact lines
 * under it, then "This hospital has told us the following:" and an indented run of statements, one
 * of which is the language claim ("The staff speak Swahili and English", "English speaking staff who
 * also speak French and Arabic"). The told-us sentence is the anchor: an entry is whatever sits
 * between the end of the previous entry's statements and it. An entry with no told-us sentence (the
 * Aga Khan satellite clinics listed under the hospital) has made no claim and gives nothing. A
 * header line that ends in a colon ("Aga Khan Medical Centres in Dar es Salaam:") or is all
 * capitals ("CENTRAL PROVINCE - RIYADH") is a section, not a name.
 */
if (/\.txt$/i.test(file)) {
  const raw = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim() && !/^\s*(UNCLASSIFIED|OFFICIAL)\s*$/.test(l) && !/^\s*\d+\s*$/.test(l));
  const indent = (l) => l.match(/^\s*/)[0].length;
  const CONTACT = /^(tel|telephone|phone|mobile|emergency|fax|e-?mail|website|webiste|web|contact|medical director|client|front line|patient)\b/i;
  let from = 0;
  for (let i = 0; i < raw.length; i++) {
    if (!/has told us the following/i.test(raw[i])) continue;
    stats.rows++;
    const anchorLine = raw[i];
    const bullets = [];
    let j = i + 1;
    while (j < raw.length && indent(raw[j]) >= 3) { bullets.push(raw[j].trim()); j++; }
    const header = raw.slice(from, i).map((l) => l.trim())
      .filter((l) => !/:\s*$/.test(l) && !(/^[A-Z0-9 ,&\-/]{6,}$/.test(l) && !/\d{3}/.test(l)));
    from = j;
    i = j - 1;
    // The name is the first line after the previous entry's statements. Before the first entry sits
    // the page's own introduction, which ends with "This list is in alphabetical order", "Updated:"
    // or "Last Update:", so the first entry starts after the last of those. (Walking up from the
    // address instead took "Ocean Road / Barrack Obama Drive" as the Aga Khan Hospital's name.)
    const firstContact = header.findIndex((l) => CONTACT.test(l));
    let n = 0;
    const intro = header.map((l, k) => (/alphabetical order|^updated|^last update|should not be treated as such|^list of medical/i.test(l) ? k : -1)).filter((k) => k >= 0);
    if (intro.length) n = intro[intro.length - 1] + 1;
    if (n >= header.length || (firstContact >= 0 && n >= firstContact) || CONTACT.test(header[n] || '')) n = -1;
    if (n < 0) { stats.noName++; continue; }
    const name = latinName(header[n]);
    // A building is not a provider. Tunisia's ophthalmologist is printed as "Immeuble Maghrebia", the
    // block his practice is in, and his own name appears nowhere but in his e-mail address.
    if (/^(immeuble|residence|r[ée]sidence|building|tower|centre commercial|plot)\b/i.test(name)) { stats.noName++; continue; }
    const addressLines = header.slice(n + 1, firstContact > n ? firstContact : undefined).filter((l) => !CONTACT.test(l));
    const address = addressLines.join(', ').replace(/\s+/g, ' ').replace(/\.$/, '');
    // Joined with a bar, so that a claim stops at the end of its own statement and does not run on
    // into "they provide services in Mwanza, Dodoma, Iringa, Mbeya and Morogoro" on the next line.
    const all = bullets.join(' | ');
    const languages = [];
    if (/\benglish[- ]speaking staff\b/i.test(all) && !/\b(some|few|limited|no|not)\s+english/i.test(all)) languages.push('en');
    const said = all.match(/\b(?:staff|they)\s+(?:also\s+)?speak\s+([A-Za-z ,&]+?)(?:[.;|]|\s{2,}|$)/i);
    if (said) {
      const named = said[1].split(/,|\band\b|&/).map((s) => s.trim()).filter(Boolean).length;
      if (named <= 6) L.readLanguages(said[1], false, unknownLangs).forEach((c) => { if (!languages.includes(c)) languages.push(c); });
      else stats.overSix = (stats.overSix || 0) + 1;
    }
    if (!languages.length) { stats.noClaim++; continue; }
    if (!name || name.length < 4) { stats.noName++; continue; }
    let hit = '';
    if (localTown) {
      hit = localTown(address);
      if (!hit) { stats.noTown++; continue; }
      if (hit === 'ambiguous') { stats.ambiguousTown++; continue; }
    }
    const langs = supported(languages);
    if (!langs.length) { stats.onlyLocal = (stats.onlyLocal || 0) + 1; continue; }
    const kind = (anchorLine.match(/this (hospital|clinic|company|practice|centre|pharmacy)/i) || [])[1] || '';
    const spec = (bullets.find((b) => /speciali[sz]|services include/i.test(b)) || '');
    const url = ((header.find((l) => /^web/i.test(l)) || '').match(/(https?:\/\/|www\.)\S+/i) || [])[0] || '';
    const isPharmacy = PHARMACY.test(name);
    if (PHARMACIES !== isPharmacy) { stats[isPharmacy ? 'pharmacySkipped' : 'notPharmacy']++; continue; }
    out.push({
      name,
      town: hit,
      area: address,
      languages: langs,
      specialty: PHARMACIES ? 'Pharmacy' : [kind, specialityOf(spec)].filter(Boolean).join(' - '),
      ...(url ? { url: /^https?:/.test(url) ? url.replace(/[.,)]+$/, '') : 'http://' + url.replace(/[.,)]+$/, '') } : {}),
      englishCell: (bullets.find((b) => /speak/i.test(b)) || ''),
    });
  }
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ rows: out, stats, unknownLanguages: [...unknownLangs] }, null, 1));
} else {
  console.log(out.length + ' rows. ' + JSON.stringify(stats));
  if (unknownLangs.size) console.log('language words not recognised: ' + [...unknownLangs].join(', '));
  out.slice(0, 8).forEach((r) => console.log('  ' + r.name.slice(0, 40).padEnd(42) + r.languages.join(',').padEnd(8) + r.area.slice(0, 60)));
}
