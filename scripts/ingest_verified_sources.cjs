/**
 * Reads a batch of verified consular lists into data/service-languages.json.
 *
 * The finding and the checking are done elsewhere, by people or by agents, and what arrives here is
 * a manifest: which file, from which URL, published by whom, with which language claim, verified by
 * whom. Nothing in this script decides whether a source is good. It decides only what a parser can
 * read out of it, which city each row belongs to, and whether the row is safe to publish.
 *
 * Three rules do most of the work:
 *   - A row with no language of its own may only inherit the roster claim where the manifest says
 *     the source HAS a roster claim. On a per-entry source, an unannotated row gets nothing and is
 *     left out. Half the mistakes in this directory would have been that one rule missing.
 *   - The city comes from the address, not from the manifest, whenever the address names one of our
 *     cities. A country-wide list holds Sao Paulo and Rio in one table, and the manifest can only
 *     say which city it was found for.
 *   - Anything that cannot be placed, categorised or named is counted and reported, never guessed.
 *
 * Usage: node scripts/ingest_verified_sources.cjs <manifest.json> [--preview] [--only <city>]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'scripts', 'lib', 'service_data.cjs'));
const P = require(path.join(ROOT, 'scripts', 'lib', 'service_prose.cjs'));
const manifestPath = process.argv[2];
if (!manifestPath) { console.error('usage: node scripts/ingest_verified_sources.cjs <manifest.json> [--preview] [--only <city>]'); process.exit(2); }
const PREVIEW = process.argv.includes('--preview');
const onlyAt = process.argv.indexOf('--only');
const ONLY = onlyAt > 0 ? process.argv[onlyAt + 1] : '';

const F = path.join(ROOT, 'data', 'service-languages.json');
const db = JSON.parse(fs.readFileSync(F, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const CHECKED = new Date().toISOString().slice(0, 10);

const CAT = [
  // \b matters on both sides of tier: without it the Montreal law firm Neville-Warren Cloutier
  // was filed as a vet, and Gauthier, Pelletier and Poitier were all waiting behind it.
  [/\btier|veterin|\bvet\b/i, 'vet'],
  [/zahn|kiefer|dental|dentist|odonto/i, 'dentist'],
  [/physiotherap|krankengymnast|osteopath|chiroprakt|physical therap|logop/i, 'physio'],
  [/psycholog|psychotherap|psychiatr|psychoanaly|therapeut(in)?\b/i, 'therapy'],
  [/optiker|optometr|augenoptik/i, 'optician'],
  [/anwalt|anw[äa]lt|rechtsanw|avocat|abogad|lawyer|attorney|notar|legal|studio legale|erbrecht|familienrecht|strafrecht|handelsrecht|gesellschaftsrecht|arbeitsrecht|immobilienrecht|vertragsrecht|mietrecht|verkehrsrecht|steuerrecht|solicitor|barrister|advocate|\blaw\b|\bavocat\b/i, 'legal'],
  [/[üu]bersetz|dolmetsch|translat|interpret|traduct/i, 'translator'],
  [/steuerberat|tax|contador|wirtschaftspr/i, 'tax'],
  [/[äa]rzt|arzt|medizin|doctor|m[eé]dic|klinik|clinic|hospital|krankenhaus|chirurg|derma|gyn|kardio|neurolog|orthop|urolog|p[äa]diatr|hno|hals|augen|innere|allgemein/i, 'doctor'],
];
/**
 * What a translation agency translates is not what it is.
 *
 * "Uebersetzungen: Ingenieurwesen, Politik, Wirtschaft, Medizin u. Tiermedizin, Pharmazeutik" is a
 * list of subjects, and Tiermedizin is veterinary medicine, so a Porto translation agency called
 * Ad-Verbum was filed as a vet. Everything after that label describes the work, not the worker.
 */
const SUBJECT_LIST = /(?:[üu]bersetzung|traduç|traducc|traduzion|translation)\w*\s*:/i;
const categorise = (text, fallback) => {
  if (SUBJECT_LIST.test(text || '')) return 'translator';
  const hits = CAT.filter(([re]) => re.test(text || '')).map(([, c]) => c);
  if (hits.length > 1 && hits.includes('doctor')) return hits.find((h) => h !== 'doctor');
  return hits[0] || fallback || '';
};

// Which of our cities an address names. A country-wide list is one table holding several cities, and
// the manifest can only name the one it was found for.
/**
 * Spellings the sources use that are not the name we print.
 *
 * This is not a nicety. A consular list writes the city in its own language, so an address in Rome
 * says Roma and one in Vienna says Wien, and the placement test compared those against "Rome" and
 * "Vienna" and threw the row out as belonging somewhere else. 503 rows were refused that way,
 * including every lawyer on the Rome and Milan lists.
 */
const ALIASES = {
  rome: ['roma'],
  milan: ['milano', 'mailand'],
  florence: ['firenze', 'florenz'],
  naples: ['napoli', 'neapel'],
  turin: ['torino'],
  venice: ['venezia', 'venedig'],
  genoa: ['genova'],
  bologna: ['bologna'],
  lisbon: ['lisboa', 'lissabon'],
  porto: ['oporto'],
  seville: ['sevilla'],
  vienna: ['wien'],
  munich: ['munchen', 'muenchen'],
  cologne: ['koln', 'koeln'],
  prague: ['praha', 'prag'],
  warsaw: ['warszawa', 'warschau'],
  krakow: ['krakau'],
  copenhagen: ['kobenhavn', 'kopenhagen'],
  gothenburg: ['goteborg'],
  brussels: ['bruxelles', 'brussel', 'brussels'],
  antwerp: ['antwerpen', 'anvers'],
  geneva: ['geneve', 'genf'],
  zurich: ['zuerich'],
  belgrade: ['beograd'],
  bucharest: ['bucuresti', 'bukarest'],
  athens: ['athen', 'athina'],
  nicosia: ['lefkosia', 'lefkosa'],
  moscow: ['moskva', 'moskau'],
  marrakesh: ['marrakech'],
  bogota: ['bogota'],
  medellin: ['medellin'],
  santiago: ['santiago de chile'],
  dublin: ['baile atha cliath'],
  hochiminh: ['ho chi minh', 'hcmc', 'saigon'],
  saopaulo: ['sao paulo'],
  riodejaneiro: ['rio de janeiro'],
  mexicocity: ['mexico, d.f.', 'ciudad de mexico', 'cdmx', 'mexico city'],
  buenosaires: ['buenos aires'],
  capetown: ['cape town', 'kapstadt'],
  telaviv: ['tel aviv', 'tel-aviv'],
  kualalumpur: ['kuala lumpur'],
  tbilisi: ['tiflis'],
  almaty: ['almaty', 'alma-ata'],
  yerevan: ['jerewan', 'eriwan'],
  seoul: ['seoul'],
  taipei: ['taipeh'],
  bali: ['denpasar', 'kuta', 'ubud', 'seminyak'],
  chiangmai: ['chiang mai'],
};
/**
 * Every city the site covers, not every city this directory already holds.
 *
 * M.cities is built from the rows, so it names the 295 cities that already have a provider. Reading
 * the place test off it made the first row for a city unreachable: an address in Sydney matched no
 * city, fell back to the manifest, and the same test then refused it. Australia's whole lawyer list
 * was rejected 27 rows out of 29 that way, and it is why 415 of the 710 cities had stayed empty
 * however many sources were read. M.CITY is the site's own list of cities and is the right question.
 */
const CITY_NAMES = Object.values(M.CITY).map((c) => ({
  id: c.id,
  // Match on the printed name, accents folded, plus a couple of spellings missions actually use.
  needles: [c.name, c.name.replace(/\s+/g, ''), ...(ALIASES[c.id] || [])]
    .map((n) => String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()),
}));
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const matchCity = (t) => CITY_NAMES.slice().sort((a, b) => b.needles[0].length - a.needles[0].length)
  .find((c) => c.needles.some((n) => n.length > 3 && t.includes(n)));

/**
 * Which of our cities an address names, or nothing if it names none.
 *
 * The town at the end of an address outranks a city name anywhere in it, because streets are named
 * after cities. "Level 9, 231 Adelaide Terrace, Perth WA 6000" is in Perth, and scanning the whole
 * string put it in Adelaide, which is 2,100 km away; "2/37 Canberra Avenue, Forrest ACT" only
 * reached Canberra by way of the street. Reading the locality first gets both right for the same
 * reason.
 */
const namedIn = (text) => {
  const town = localityOf(text);
  if (town) {
    const byTown = matchCity(fold(town));
    if (byTown) return byTown.id;
    // The address names a town and it is not one of ours. Whatever else the string contains is a
    // street or a landmark, not where this provider is.
    return '';
  }
  const hit = matchCity(fold(text));
  return hit ? hit.id : '';
};

const placeOf = (text, fallback) => {
  const t = fold(text);
  if (!t) return fallback;
  const named = namedIn(text);
  const hit = named ? CITY_NAMES.find((c) => c.id === named) : null;
  // A country-wide list may name another of its own cities, and that is worth following. A word
  // that happens to match a city on another continent is not: an address in Bangkok was matching
  // Hamburg and Turin, and the row would have been published there.
  if (!hit) return fallback;
  const home = M.CITY[fallback];
  if (home && M.CITY[hit.id] && M.CITY[hit.id].country !== home.country) return fallback;
  return hit.id;
};

/**
 * The town an address names, if it names one at all.
 *
 * Requiring the target city's name in every address is too blunt: the Tbilisi list writes districts
 * and clinics and never the city, and the rule threw away 25 correct rows. Ignoring the address is
 * worse: the Taiwan list's third section is headed "medical facilities outside Taipei" and filed
 * hospitals in Keelung and Taichung as Taipei.
 *
 * So the question is not whether the address names the city, it is whether it names a DIFFERENT
 * one. "Keelung City", "5345433 Givataim" and "Ramla 7240627" all do, and those rows belong to
 * their own town, not to the city the list was found for. An address with no town in it at all is
 * left to the list's own city, which is the only claim available.
 */
const localityOf = (text) => {
  const s = String(text || '');
  const m =
    // "<town>, <PROVINCE>, <postal code>", tried before the others because it is the most specific
    // and because the patterns below mistake a North American street number for a postcode:
    // "1200-805 West Broadway, Vancouver, BC" gave the town as West Broadway, and every Vancouver
    // firm on the Canadian list was refused for being somewhere else. The separators are commas as
    // often as spaces, which is what Canada writes and Australia does not.
    s.match(/\b([A-Z][A-Za-z'’.-]+(?:\s+[A-Z][A-Za-z'’.-]+){0,2})[,\s]+(?:ACT|NSW|NT|QLD|SA|TAS|VIC|WA|BC|AB|ON|QC|MB|NS|NB|SK|NL|PE|YT|NU|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WV|WI|WY|DC)[,\s]+[A-Z0-9]{3,5}(?:\s?[A-Z0-9]{3})?\b/)
    || s.match(/\b([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)\s+City\b/)
    // Up to eight digits: Israeli postcodes are seven, and a six-digit cap matched nothing on that
    // list, so every suburb in it passed as Tel Aviv.
    // A Brazilian postcode is five digits, a hyphen and three more, and requiring whitespace right
    // after the digits missed every one of them: two Porto Alegre firms were filed under Sao Paulo
    // because "90010-000 Canoas" did not look like a town to this.
    || s.match(/\b\d{4,8}(?:-\d{3})?\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)/)
    || s.match(/,\s*([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)[,\s]+\d{4,8}\b/);
  if (!m) return '';
  const word = m[1].trim();
  // Words that turn up in this position and are not towns.
  // A state or province code is not a town. "201 Elizabeth Street, Sydney, NSW 2000" puts a comma
  // where the pattern expects the town, so the town came out as NSW and a Sydney firm was placed
  // nowhere. Returning nothing here sends the address back to be read whole, which finds Sydney.
  if (/^(ACT|NSW|NT|QLD|SA|TAS|VIC|WA|BC|AB|ON|QC|MB|NS|NB|SK|NL|PE|YT|NU)$/.test(word)) return '';
  if (/^(Str|Street|Rd|Road|Ave|Avenue|Floor|Fl|Tower|Suite|Apt|Building|Clinic|Hospital|Center|Centre|Website|Web|Tel|Fax|Email|Mobile|Sec|Lane|No|Dist|District)$/i.test(word)) return '';
  return word;
};

// A provider is a person or a practice. These are the things that keep arriving instead: the
// mission's own address block, a job description, a department, a street.
// A professional body is not a professional. Every one of these lists closes by naming the bar
// association or the medical council to complain to, and reading the whole registry through put the
// Anwaltskammer der Republik Armenien on the site as a Yerevan law firm.
const NOT_A_PROVIDER = /\b(Botschaft|Embassy|Ambassade|Konsulat|Consulate|Consolato|Generalkonsulat|Department|Abteilung|Executive|Marketing|Sekretariat|Praktische|Fach[äa]rzt|Notfall|Ext\b|Hotline|Sprechstunde|Auswaertiges|Auswärtiges)\b|\b(Anwaltskammer|Rechtsanwaltskammer|Bar Association|Law Society|Legal Aid|Legal Services Commission|Ordine degli|Colegio de Abogados|Ordre des avocats|Medical Association|Medical Council|Chamber of|Kammer|Academy|Akademie|Law School|School of Law|Faculty of)\b|^\d|\b(Road|Rd\.|Street|Soi|Avenue|Ave\.|Strasse|Str\.)\b|@|^Tel/i;

// The address glued onto the end of the name, and the sentence that carries on from the entry above.
// "Dr. PALMISANO Ebertystr. 31" is a translator and a street run together; "Also available c/o
// clinic Le Betulle in Appiano Gentile, 22070 Como" is a note about whoever was named on the line
// before, and the town it names is Como rather than the Milan it was about to be filed under.
const NAME_IS_NOT_A_NAME = /\b\w{3,}(str|gasse|weg|platz|allee)\.?\s*\d|\bc\/o\b|^(also|auch|anche|aussi|additionally|siehe|vedi|see)\b|\d\s*$/i;

// A name made only of the words for what the business is, "Studio Legale" or "Law Office" with no
// firm in front of it, is a name the parser failed to find. It reached the directory once and the
// duplicate gate caught it, because it is contained in six real firms on the same page.
// Reading the whole registry through added the second half of this: "SPECIALIZED HOSPITALS", which
// is a section heading, and "Dental hygienist", which is a job rather than anybody who holds it.
const GENERIC_WORD = /^(studio|legale|legal|law|office|offices|firm|avvocat[oi]|avvocata|abogad[oa]s?|notai[oa]|notar|notary|rechtsanwal\w*|kanzlei|anwaltskanzlei|praxis|clinic|clinica|klinik|centro|center|centre|medical|dental|dr|und|and|e|y|de|the|specialized|specialised|hospital|hospitals|hygienist|hygienists|doctor|doctors|dentist|dentists|physician|physicians|lawyer|lawyers|attorney|attorneys|translator|translators|interpreter|interpreters|general|specialist|specialists|also|available|other|others)$/i;
const isGenericName = (s) => String(s).split(/[^A-Za-zÀ-ÿ]+/).filter(Boolean).every((w) => GENERIC_WORD.test(w));

/**
 * A letter with a stroke through it is one letter, not a letter plus an accent, so NFD leaves it
 * whole and the "drop anything not printable ASCII" step then deletes it outright. Rocławski came
 * out as Rocawski and Jarosław as Jarosaw: not a name with the accents taken off, a name with a
 * letter missing. These are the ones the consular lists actually contain.
 */
const STROKED = [[/[łŁ]/g, 'l'], [/[øØ]/g, 'o'], [/[đĐ]/g, 'd'], [/[ıİ]/g, 'i'], [/[æÆ]/g, 'ae'],
  [/[œŒ]/g, 'oe'], [/[åÅ]/g, 'aa'], [/[þÞ]/g, 'th'], [/[ðÐ]/g, 'd'], [/[ħĦ]/g, 'h']];
const asciiFold = (s) => STROKED.reduce((t, [re, r]) => t.replace(re, r), String(s || '')).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’]/g, "'").replace(/[“”«»„]/g, '"').replace(/[–—]/g, ', ').replace(/[°º]/g, '')
  .replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '');

const TITLE_WORD = /^(dr|dra|dre|prof|med|dent|phil|phd|llm|mba|ma|dipl|mme|mr|mrs|ms|m|maitre|mtre|sr|sra)$/;
const key = (s) => fold(s).replace(/ae/g, 'a').replace(/ue/g, 'u').replace(/oe/g, 'o')
  .split(/[^a-z0-9]+/).filter(Boolean).filter((w) => !TITLE_WORD.test(w)).sort().join(' ');

const seenByCity = {};
db.providers.forEach((p) => { (seenByCity[p.city] = seenByCity[p.city] || new Map()).set(key(p.name), p); });

const runParser = (script, args) => {
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', script), ...args, '--json'],
      { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
    const j = JSON.parse(out);
    return Array.isArray(j) ? j : (j.rows || []);
  } catch (e) { return []; }
};

// A file the manifest lists for more than one city is a country-wide list, and the manifest cannot
// say which of its rows belongs where. Without this, the Bangkok page was read once for Bangkok and
// once for Chiang Mai and put the same five doctors in both: a reader in Chiang Mai would have been
// sent 700 km. On those files the address has to name the city, or the row is left out.
const fileCount = {};
manifest.forEach((s) => { fileCount[s.file] = (fileCount[s.file] || 0) + 1; });

const fresh = [];
const report = [];
for (const src of manifest) {
  if (ONLY && src.city !== ONLY) continue;
  if (!fs.existsSync(src.file)) { report.push({ src, kept: 0, why: 'file missing' }); continue; }

  // Which parser: the shape the verifier recorded, with the others tried as a fallback, and the
  // one that finds the most languages of its own wins. A shape label is a hint, not a promise.
  const isPdf = /\.pdf$/i.test(src.file);
  // Only the parsers that understand a page's structure. The running-text reader was tried here
  // once and it is not safe in a batch: on pages it does not understand it returns the embassy's own
  // address as a provider, a job title as a name and a Phuket clinic under Bangkok. It stays a
  // hand-driven tool for pages someone has looked at.
  // The block reader is offered alongside the PDF one because a consular PDF is either a grid or a
  // run of blocks and the manifest's shape label is a hint. Australia's lawyer list is blocks: the
  // grid reader found 15 entries, none with a language, and the block reader found 22 with one.
  // A manifest may name its reader. The defaults below are the ones safe to try on anything, and a
  // source whose shape none of them fits should not be a reason to loosen them for all 310: the
  // block reader that reads the Italian consular PDFs for Sydney also returns the disclaimer as a
  // doctor on pages it does not understand, which is why it is opt-in per source rather than tried
  // everywhere. The row filters still apply either way.
  const candidates = src.parser
    ? [[src.parser, [src.file]]]
    : (isPdf
      ? [['parse_diplo_pdf_list.cjs', [src.file]], ['parse_diplo_block_list.cjs', [src.file]]]
      : [['parse_diplo_table_list.cjs', [src.file]], ['parse_diplo_block_list.cjs', [src.file]]]);
  let rows = [];
  let used = '';
  for (const [script, args] of candidates) {
    const got = runParser(script, args);
    const withLang = got.filter((r) => (r.languages || []).length).length;
    const bestSoFar = rows.filter((r) => (r.languages || []).length).length;
    if (withLang > bestSoFar || (withLang === bestSoFar && got.length > rows.length)) { rows = got; used = script; }
  }
  if (!rows.length) { report.push({ src, kept: 0, why: 'no parser could read it' }); continue; }

  /**
   * Which language a roster claim is a claim about.
   *
   * This was the literal string 'de'. Every roster source was read as a list of German speakers, and
   * of the 97 in the registry only about half are German: three rows off the U.S. Embassy Budapest
   * list, whose own words are "Each lawyer on the list speaks English sufficiently well", went out
   * as German-speaking with a note on the page saying the list was published as a list of German
   * speakers. It was not. A roster source has to declare it now, and one that does not is refused
   * rather than guessed at.
   */
  const rosterLangs = [].concat(src.rosterLanguage || []).filter(Boolean);
  if (/^roster/i.test(src.claimType || '') && !rosterLangs.length) {
    report.push({ src, kept: 0, why: 'a roster source with no rosterLanguage: say which language the claim is about' });
    continue;
  }
  if (rosterLangs.some((l) => !db._languages[l])) {
    report.push({ src, kept: 0, why: 'rosterLanguage names a language the dataset does not have: ' + rosterLangs.join(', ') });
    continue;
  }

  const stats = { placedElsewhere: 0, noLanguage: 0, noCategory: 0, already: 0, noName: 0, kept: 0 };
  for (const r of rows) {
    const text = [r.name, r.area, r.specialty, r.role, r.detail, r.languageLine].filter(Boolean).join(' ');
    // No address, no city. The Indonesia lawyer list names thirteen firms and prints no address for
    // any of them, and the manifest could only say the list was found while looking for Bali: those
    // rows would have been published as being in Bali on no evidence at all. Most of them are in
    // Jakarta.
    // r.role only when there is no r.area, never as well as it.
    //
    // Several readers put the address in role, because in a two-column table the second column is
    // the address and in a labelled list it is what the person does. Lisbon's translator table is
    // the plainest case: 84 rows, every one with a street in role and area empty, and all 84
    // refused for having no address. Summed over the registry that mismatch was 1,734 rows.
    //
    // As a fallback rather than an addition, because appending role to a real address is what moved
    // Canberra's one firm out of Canberra: three hundred characters of German practice areas in the
    // string changed which town the placement read.
    const where = [r.area || r.role, r.hospital, r.detail].filter(Boolean).join(' ').trim();
    if (where.length < 8) { stats.noAddress = (stats.noAddress || 0) + 1; continue; }
    // And it has to be an address, not a phone number. Several parsers put the contact column in
    // the address field, and "Tel. 91 388 44 34, Mobil: 689 ..." tells a reader nothing about where
    // to go and tells this script nothing about which city the row belongs to.
    // A phone number is digits too, so the contact details come off first and the test runs on what
    // is left. "Tel. 91 562 94 29, Mobil: 691 ..." then has nothing in it that looks like a place.
    const withoutContact = where.replace(/\b(Tel|Telf|Telefon|Fax|Mobil|Mob|Cel|E-?Mail|Email|Web|www\.|http)\b[\s.:]*[^,;]*/gi, ' ').trim();
    // A British postcode has no run of four digits in it and a British street is as likely to be a
    // Court or a Crescent as a Street. "1 Rutland Court, Edinburgh EH3 8EY" satisfied none of the
    // tests below and three German-speaking Edinburgh firms were refused for having no address.
    const ukPostcode = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/;
    const looksLikeAddress = /\b\d{4,8}\b|\b(str|strasse|street|calle|carrer|rua|via|avda|avenida|av|rue|blvd|road|rd|weg|platz|plaza|piazza|lane|utca|ulica|ulice|gatan|court|crescent|square|terrace|gardens|mews|quay|wharf|boulevard|parade|close|drive)\b\.?/i.test(withoutContact)
      || ukPostcode.test(withoutContact);
    if (!looksLikeAddress) { stats.noAddress = (stats.noAddress || 0) + 1; continue; }
    const city = placeOf(where, src.city);
    // A city we cover, whether or not it holds anything yet. This is the test that lets a city get
    // its first provider.
    if (!M.CITY[city]) { stats.placedElsewhere++; continue; }
    // If the address names a town, it has to be this one.
    //
    // Unless the source says otherwise. A consular list for a big city is a list for its metro area
    // and writes the suburb, not the city: the Italian Consulate General in Sydney heads its
    // doctors "MEDICI GENERICI - GPS - AREA METROPOLITANA (SYDNEY)" and then gives addresses in
    // Concord and West Pennant Hills. Refusing those would throw away almost every row on it.
    //
    // So a manifest may set "metro": true, which says the source states its rows are in this city's
    // metro area, and the quote for that goes in claimQuote or notes like any other claim. It only
    // ever admits a town we do not otherwise cover: a suburb, never another city. Taipei's list,
    // whose third section is headed "medical facilities outside Taipei", does not set it, and the
    // rows it put in Keelung and Taichung are refused exactly as before.
    const town = localityOf(where);
    if (town) {
      const target = M.CITY[city];
      const names = [target.name, ...(ALIASES[city] || [])].map(fold);
      const isTarget = names.some((n) => fold(town).includes(n) || n.includes(fold(town)));
      const elsewhereWeCover = !isTarget && !!matchCity(fold(town));
      if (!isTarget && (elsewhereWeCover || !src.metro)) { stats.placedElsewhere++; continue; }
    }
    // The address has to name the city, always. The manifest can only say which city a list was
    // found for, and these lists cover regions: the Taiwan list's third section is headed
    // "medical facilities outside Taipei", and taking the manifest's word for it filed 33 hospitals
    // in Keelung, Taoyuan, Hsinchu, Miaoli, Taichung and Kaohsiung as if they were in Taipei, under
    // a language claim the page does not make about them.
    // Comparing the placed city with the manifest's was not the test it reads as: where the address
    // names no town at all, placeOf returns the manifest's city and the two are equal by
    // construction. One Wollongong firm was accepted that way into all seven Australian cities the
    // list was filed under. The address itself has to name the city.
    if (fileCount[src.file] > 1 && !src.metro && namedIn(where) !== src.city) { stats.placedElsewhere++; continue; }

    // The rule that matters: a roster claim covers every row, a per-entry source covers only the
    // rows it annotates. Inheriting a per-entry source's claim would be inventing one.
    let languages = (r.languages || []).slice();
    if (!languages.length) {
      if (!/^roster/i.test(src.claimType || '')) { stats.noLanguage++; continue; }
      languages = rosterLangs;
    }

    /**
     * A row that names only the local language has nowhere to sit in a directory organised by
     * language. "English-speaking lawyer in Glasgow" is not a finding about Glasgow, and one such
     * row was enough to publish a whole city page that said it. The German consulate's Scottish
     * list records that firm's correspondence language as English, which is true and useless here.
     *
     * Countries whose LOCAL is null, India and Canada and Singapore among them, have no single local
     * language to measure against and are unaffected.
     */
    const localLang = M.LOCAL[(M.CITY[city] || {}).country];
    if (localLang && languages.every((l) => l === localLang)) {
      stats.onlyLocal = (stats.onlyLocal || 0) + 1;
      continue;
    }

    // The practice name is evidence too: "Korea Dental Clinic" is a dentist even when the table it
    // sits in is headed Aerzte, and without it those rows were filed as doctors.
    // The row has to say what the provider does. Falling back to the source's category list filed
    // every doctor on the Madrid list as a dentist, because dentist happened to be the first
    // category the verifier recorded for that page.
    // The name counts too where it says what the business is: "Studio Legale", "Law Office",
    // "Zahnarztpraxis". What must not count is the source's own category list, which is what filed
    // every Madrid doctor as a dentist.
    const ownWords = [r.specialty, r.role, r.hospital, r.detail, r.name].filter(Boolean).join(' ');
    const cat = ownWords.trim() ? categorise(ownWords, '') : '';
    if (!cat) { stats.noCategory++; continue; }

    // A form of address is not part of a name. Nor is a dash and a lower-case phrase after it, which
    // is what the entry does rather than who it is: the Polish list for Berlin writes "Rechtsanwalt
    // Jaroslaw Delekta - prawo cywilne", and the practice area belongs in the note with the rest of
    // the detail rather than on the card as part of his name.
    const name = asciiFold(r.name).replace(/^(Frau|Herr|Mr\.?|Mrs\.?|Ms\.?|Sra?\.)\s+/i, '')
      .replace(/\s+-\s+[a-z][^A-Z]*$/, '').trim();
    const k = key(name);
    if (!k || k.split(' ').length < 2 || /[:(\[]|,$/.test(name) || NOT_A_PROVIDER.test(name) || NAME_IS_NOT_A_NAME.test(name) || isGenericName(name)) { stats.noName++; continue; }
    const map = (seenByCity[city] = seenByCity[city] || new Map());
    if (map.has(k)) { stats.already++; continue; }

    const bits = [`On the ${src.publisher} list${r.specialty ? ', under ' + asciiFold(r.specialty).replace(/\.$/, '') : ''}.`];
    if (r.role) bits.push(asciiFold(r.role).replace(/\.$/, '') + '.');
    bits.push(/^roster/i.test(src.claimType || '')
      ? `The list is published as a list of ${P.list(rosterLangs.map((l) => db._languages[l]))}-speaking providers, which is a claim about the roster rather than a note about this entry.`
      : `The list states the languages of each entry, and this one names ${languages.map((l) => db._languages[l] || l).join(', ')}.`);
    if (src.statedDate) bits.push(`The list is dated ${asciiFold(src.statedDate).replace(/\s*-\s*Artikel.*$/, '')}.`);

    const row = {
      city,
      name,
      category: cat,
      languages: [...new Set(languages)].sort(),
      ...(r.url ? { url: (/^https?:/.test(r.url) ? r.url : 'http://' + r.url).replace(/[.,)]+$/, '') } : {}),
      sourceUrl: src.url,
      evidence: 'official',
      checked: CHECKED,
      // What goes on the card is the address, not the phone book entry that followed it.
      area: asciiFold((r.area || '').split(/\b(?:Tel|Telf|Telefon|Fax|Mobil|Mob|Cel|E-?Mail|Email|Web|www\.|http)\b/i)[0]
        || withoutContact).replace(/[,\s]+$/, '').slice(0, 120),
      note: bits.join(' ').replace(/\s+/g, ' ').trim(),
    };
    if (/[^\x20-\x7E]/.test(JSON.stringify(row))) { stats.noName++; continue; }
    // Last look at what the card will actually show. A row whose address came out as a URL or as a
    // list of treatments is a row the parser did not understand, whatever the earlier tests said.
    if (/^https?:/i.test(row.area) || !/\d/.test(row.area) || row.area.length < 10) {
      stats.noAddress = (stats.noAddress || 0) + 1;
      continue;
    }
    map.set(k, row);
    fresh.push(row);
    stats.kept++;
  }
  report.push({ src, used, read: rows.length, ...stats });
}

report.sort((a, b) => (b.kept || 0) - (a.kept || 0));
report.forEach((x) => {
  console.log(String(x.kept || 0).padStart(4) + ' kept  ' + String(x.src.city).padEnd(13)
    + String(x.src.claimType).padEnd(10) + String(x.used || x.why || '').replace('parse_diplo_', '').replace('_list.cjs', '').padEnd(8)
    + 'read ' + String(x.read || 0).padStart(4)
    + '  elsewhere ' + String(x.placedElsewhere || 0).padStart(3)
    + '  no lang ' + String(x.noLanguage || 0).padStart(3)
    + '  no cat ' + String(x.noCategory || 0).padStart(3)
    + '  local only ' + String(x.onlyLocal || 0).padStart(3)
    + '  no addr ' + String(x.noAddress || 0).padStart(3)
    + '  no name ' + String(x.noName || 0).padStart(3)
    + '  dup ' + String(x.already || 0).padStart(3)
    + '  ' + path.basename(x.src.file));
});
const per = {};
fresh.forEach((r) => { per[r.city] = (per[r.city] || 0) + 1; });
console.log('\n' + fresh.length + ' rows to add across ' + Object.keys(per).length + ' cities: '
  + Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', '));

fresh.slice(0, 12).forEach((r) => console.log('   ' + r.city.padEnd(13) + r.category.padEnd(11)
  + r.name.slice(0, 30).padEnd(32) + r.languages.join(',').padEnd(12) + r.area.slice(0, 30)));
if (PREVIEW) process.exit(0);

/**
 * Nothing goes into the directory straight from a parser any more.
 *
 * The batch that taught this lesson wanted to add 1,015 rows across 42 cities and almost all of it
 * was wrong: the embassy's own address as a provider, a job description as a name, a Phuket clinic
 * under Bangkok. It was caught because I happened to read a dry run. A proposal is that dry run,
 * written down: what would be added, and per source what was refused and for which reason, so the
 * next person reviews a diff instead of remembering to look.
 */
const dir = path.join(ROOT, 'data', 'proposals');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const name = path.basename(manifestPath).replace(/\.json$/, '') + '-' + CHECKED + '.json';
const proposalFile = path.join(dir, name);
fs.writeFileSync(proposalFile, JSON.stringify({
  manifest: manifestPath,
  written: CHECKED,
  rows: fresh,
  perSource: report.map((x) => ({
    city: x.src.city,
    url: x.src.url,
    parser: x.used || '',
    read: x.read || 0,
    kept: x.kept || 0,
    refused: {
      placedElsewhere: x.placedElsewhere || 0,
      noAddress: x.noAddress || 0,
      onlyLocal: x.onlyLocal || 0,
      noLanguage: x.noLanguage || 0,
      noCategory: x.noCategory || 0,
      noName: (x.noName || []).length || 0,
      alreadyHeld: x.already || 0,
    },
    why: x.why || '',
  })),
}, null, 1) + '\n');
console.log('\nproposal written: data/proposals/' + name);

if (!process.argv.includes('--apply')) {
  console.log('Nothing was added. Read it, then run again with --apply to take it.');
  process.exit(0);
}
db.providers = db.providers.concat(fresh);
fs.writeFileSync(F, JSON.stringify(db, null, 2) + '\n');
console.log('applied. total ' + db.providers.length);
