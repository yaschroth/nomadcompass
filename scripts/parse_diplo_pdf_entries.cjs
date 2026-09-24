/**
 * Reads a German mission's list published as a PDF whose entries run on one after another, a name
 * over an address over labelled lines, with nothing but the next name to say where one ends.
 *
 * About twenty of the diplo.de lists read on 2026-09-24 are in this shape: the doctor lists for
 * Mexico City and Santo Domingo, the lawyer lists for Dar es Salaam, Abidjan, Amman, Rabat, Asuncion
 * and Dushanbe, the translator lists for Cairo, Pretoria and La Paz. The existing PDF readers each
 * expect something these do not have: parse_diplo_pdf_list.cjs a two-column grid with a shared gap,
 * parse_diplo_block_list.cjs a blank line under each name, parse_labelled_blocks.cjs the US labels.
 * On Mexico City's 143 doctors, every one of which states its languages, the three together found
 * none.
 *
 * What holds an entry together here:
 *
 *   - `pdftotext -raw` keeps the order the page was written in, which on these Word-made PDFs is
 *     each text box top to bottom. The two columns of the Mexico list come out one after the other,
 *     not interleaved, which -layout cannot do.
 *   - An entry starts on a plain line that follows the labelled lines of the one before it
 *     ("Tel.:", "E-Mail:", "Korrespondenzsprachen:"), or a line that follows a language line. The
 *     language line is usually the last thing an entry says.
 *   - A section heading is a plain line with no digits that is followed by a name with a title
 *     ("Allergologie" over "Dra. Monica Rodriguez"), or a line that is a specialty word, or a line
 *     that is only the name of a city. It is handed on as `specialty`; a city heading is also handed
 *     on as `detail` with --place-from-heading, for the ingest to place the entries under it.
 *
 * The language claim is read three ways, all per entry: a label ("Korrespondenzsprachen: Englisch,
 * Suaheli"), a line that is nothing but languages ("deutsch, spanisch, englisch", Mexico's way), and
 * a bracket ("(eng, d esp., frz.)" is NOT read: a lone "d" is a letter, not a claim). The hedges are
 * taken out before reading, the same rules as scripts/parse_diplo_entry_blocks.cjs: "englisch,
 * spanisch und etwas deutsch" is English and Spanish, and "Deutsch (Grundkenntnisse)" is not German.
 * A bracket that is about somebody else is not the entry's claim either: Santo Domingo writes
 * "Spanisch, Englisch, (seine Frau Gianna spricht Deutsch)" under a paediatrician, and his wife is
 * not on the list.
 *
 * Usage: node scripts/parse_diplo_pdf_entries.cjs <file.pdf> [--json] [--layout-left N] [--place-from-heading]
 *   --layout-left N  read `pdftotext -layout` and keep only the first N characters of each line: for a
 *                    list set in two languages side by side (Cairo prints German left, Arabic right).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_pdf_entries.cjs <file.pdf> [--json] [--layout-left N] [--place-from-heading]'); process.exit(2); }
const leftAt = process.argv.indexOf('--layout-left');
const LEFT = leftAt > 0 ? +process.argv[leftAt + 1] : 0;
const PLACE_FROM_HEADING = process.argv.includes('--place-from-heading');
// --title-names: only a line that opens with Dr., Dra., Prof., Frau, Herr and the like starts an entry.
const TITLE_NAMES = process.argv.includes('--title-names');

let text;
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'pdfentries-' + path.basename(file).replace(/\W+/g, '') + (LEFT ? '-l' : '-r') + '.txt');
  try {
    execFileSync('pdftotext', [LEFT ? '-layout' : '-raw', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) { console.error('pdftotext could not read this file'); process.exit(1); }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}
// --bullet-names: a line opening with a bullet glyph is a name. Cairo marks each translator that way
// (a private-use glyph from a Wingdings font) and prints Arabic beside the German, which is dropped.
const BULLET_NAMES = process.argv.includes('--bullet-names');
const BULLET = /^\s*[•●▪]\s*/;
const NAME_MARK = '\u0001';
let lines = text.split(/\r?\n/).map((l) => (LEFT ? l.slice(0, LEFT) : l))
  .map((l) => l.replace(/[؀-ۿ‎‏‪-‮]+/g, ' '))
  .map((l) => (BULLET_NAMES && BULLET.test(l) ? NAME_MARK + l.replace(BULLET, '') : l.replace(/[•●]/g, ' ')))
  .map((l) => l.replace(/[ \t]+/g, ' ').trim());
// The running header and footer of every page: "Aerzteliste Deutsche Botschaft Santo Domingo 2".
const counts = {};
lines.forEach((l) => { const k = l.replace(/\d+/g, '#'); if (l) counts[k] = (counts[k] || 0) + 1; });
lines = lines.filter((l) => l && !(counts[l.replace(/\d+/g, '#')] >= 3 && /Botschaft|Seite|Page|Liste|Stand|^#+$/i.test(l.replace(/\d+/g, '#'))) && !/^\d{1,3}$/.test(l));

// --- the language claim, as in parse_diplo_entry_blocks.cjs -------------------------------------------
const EXTRA = { tadschikisch: 'tg', kisuaheli: 'sw', georgisch: 'ka', lettisch: 'lv', litauisch: 'lt',
  estnisch: 'et', katalanisch: 'ca', slowenisch: 'sl', hindi: 'hi', urdu: 'ur', bengalisch: 'bn',
  nepalesisch: 'ne', tagalog: 'tl', filipino: 'tl', wolof: '', lingala: '', usbekisch: '', aserbaidschanisch: '' };
const LANGWORD = '[A-Za-zÄÖÜäöüßÀ-ÿ]{4,}';
const HEDGES = [
  new RegExp('\\b' + LANGWORD + '\\s*\\((?:[^()]*?(?:grundkenntnisse|basis|basic|etwas|wenig|gering|rudiment|passiv|auf nachfrage|auf anfrage|nach absprache|nach vereinbarung|on request|upon request|bei bedarf|anf[äa]nger|einfach)[^()]*)\\)', 'gi'),
  new RegExp('\\b(?:und\\s+|sowie\\s+)?(?:etwas|ein\\s+wenig|wenig|ein\\s+bisschen|grundkenntnisse\\s+in|grundkenntnisse|basic|some|a\\s+little|limited)\\s+' + LANGWORD, 'gi'),
  // A bracket about somebody else: "(seine Frau Gianna spricht Deutsch)".
  /\([^()]*\b(?:seine|ihre|sein|ihr|Frau|Mann|Ehefrau|Ehemann|Kollegin|Kollege|Mitarbeiter\w*|Assistent\w*|Sekret\w*|Personal)\b[^()]*\)/gi,
  // Anything else in brackets is a note, not a language: "(keine Kinder)", "24/7".
  /\([^()]*\)/g,
];
const withoutHedges = (s) => HEDGES.reduce((t, re) => t.replace(re, ' '), String(s || ''));
const langOfWord = (w) => {
  const f = L.fold(w).replace(/[^a-z]/g, '');
  if (!f) return null;
  if (Object.prototype.hasOwnProperty.call(EXTRA, f)) return EXTRA[f] || '';
  if (/\.$/.test(w) && L.ABBREV[f]) return L.ABBREV[f];
  const hit = Object.keys(L.LANG).filter((k) => f.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  if (hit && f.length <= hit.length + 7) return L.LANG[hit];
  return null;
};
// Words that may stand on a language line and are not languages: Mexico ends some with "24/7".
const FILLER = /^(?:und|and|sowie|oder|y|e|et|,|;|\/|-|–|&|\+|24\/7)$/i;
const isLanguageLine = (line) => {
  const s = withoutHedges(line).replace(/[.:]\s*$/, '').trim();
  if (!s || s.length > 140 || /@|www\.|http/i.test(s)) return false;
  const tokens = s.split(/(\s+|,|;|\/(?!7)|–|-(?!\d))/).map((x) => x.trim()).filter(Boolean);
  let n = 0;
  for (const t of tokens) {
    if (FILLER.test(t)) continue;
    const c = langOfWord(t);
    if (c === null) return false;
    n += 1;
  }
  return n > 0;
};
const readClaim = (value) => {
  if (/^\s*(?:etwas|ein\s+wenig|wenig|grundkenntnisse|basic|some)\b/i.test(value)) return [];
  const clean = withoutHedges(value);
  const out = [];
  clean.split(/[,;/|+&]+|\bund\b|\band\b|\bsowie\b|\s+-\s+|\s+/i).forEach((p) => {
    const c = langOfWord(p.trim());
    if (c && !out.includes(c)) out.push(c);
  });
  return out;
};

const LANG_LABEL = /^(?:Korrespondenzsprachen?|Korrespondenz|Sprachen?|Sprachkenntnisse|Arbeitssprachen?|Fremdsprachen?|Languages?|Langues?|Idiomas?)\s*[:：]\s*(.*)$/i;
const LABEL = /^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .\/&-]{0,34}?)\s*[:：]\s*(.*)$/;
const CONTACT = /^(?:Tel|Telefon|Tél|Fax|Mobil|Handy|Mob|Cel|Celular|Móvil|Phone|WhatsApp|E-?Mail|Email|Mail|Homepage|Internet|Website|Webseite|Web|Instagram|Notdienst|Notfall|Termine?)\b/i;
const TITLE = /^(?:Dr|Dra|Dres|Prof|Frau|Herr|Hr|Fr|Mme|Mr|Mrs|Ms|Ma[iî]tre|Me|Lic|Abg|Sra?)\.?\s/;
const SPECIALTY_HEADING = /(?:logie|heilkunde|medizin|chirurgie|[äa]rzte|therapie|iatrie|p[äa]die|Hausbesuche|Kooperations\w*|Krankenh[äa]user|Labore|Impf|Notrufe?|Hebamme|Zahn\w*|Physiotherap\w*|Psycholog\w*|Veterin\w*|Tier[äa]rzt\w*|Rechtsanw[äa]lte|Anw[äa]lte|[ÜU]bersetzer\w*|Dolmetscher\w*|Notare)\b/i;
const CITY_WORDS = (() => {
  const M = require(path.join(__dirname, 'lib', 'service_data.cjs'));
  return new Set(Object.values(M.CITY).map((c) => L.fold(c.name)));
})();
const isCityLine = (l) => CITY_WORDS.has(L.fold(l).replace(/[^a-z ]/g, '').trim());
const looksLikeAddress = (l) => /\d/.test(l) || /\b(?:Calle|Av\.?|Avenida|Avenue|Road|Rd|Street|St\.|Rue|Bd|Boulevard|Plot|Box|Col\.|Ensanche|Hospital|Cl[ií]nica|Centro|Torre|Edif\w*|Building|Plaza|Immeuble|Imm\.|Résidence|Quartier|Cit[ée])\b/i.test(l);

// --- cut into entries ----------------------------------------------------------------------------------
const entries = [];
let current = null;
let heading = '';
let spec = ''; // the last heading that names a specialty; a heading that does not (a street, a web address) leaves it
let place = '';
let inPractice = false;
let closed = true; // the current entry has had its labels or its language line and a plain line starts the next
for (let i = 0; i < lines.length; i++) {
  if (BULLET_NAMES) {
    const raw = lines[i];
    if (raw.startsWith(NAME_MARK)) {
      current = { heading, spec, place: PLACE_FROM_HEADING ? place : '', name: raw.slice(1).trim(), lines: [] };
      entries.push(current); closed = false; continue;
    }
    if (/^(?:[IVX]+\.|Die o\.g\.)/.test(raw)) { heading = raw; current = null; continue; }
    if (current) current.lines.push(raw);
    continue;
  }
  const l = lines[i];
  const next = lines[i + 1] || '';
  // Checked before anything else, because a heading can start in lower case: Mexico's "ehemals
  // Lufthansa Kooperationsarzt" over Dr. Armin Reimers was read as the tail of the dentist above him,
  // and he was filed as a dentist.
  if (!/\d|@/.test(l) && SPECIALTY_HEADING.test(l) && TITLE.test(next) && !TITLE.test(l) && !LABEL.test(l)) {
    heading = l; spec = l; current = null; closed = true; continue;
  }
  const isLabel = LABEL.test(l) || CONTACT.test(l);
  const isLang = isLanguageLine(l) && !TITLE.test(l);
  const continuation = /^[a-zäöü(]|@|^\+?[\d\s()/.-]{6,}$|^[,;&]/.test(l) || (current && /[,;&-]\s*$/.test(current.lines[current.lines.length - 1] || ''));
  // A list of practice areas runs over as many lines as it needs and none of them is a name: Amman's
  // "Fachrichtungen:" goes on for four lines, and each line after the first started an entry.
  const practiceGoesOn = current && inPractice && !isLabel && !isLang && !TITLE.test(l) && !/@|\d{3,}/.test(l)
    && (/recht|,\s*$|^[a-zäöü/(-]|\/|\bund\b/i.test(l) || l.split(' ').length <= 4);
  if (practiceGoesOn) { current.lines.push(l); continue; }
  inPractice = false;
  if (/^(?:Bereitschaft|Aufnahme|Nimmt)\b/i.test(l)) { if (current) closed = true; continue; }
  if (isLabel || isLang || (continuation && current && closed)) {
    if (/^(?:Fach|Spezial|Schwerpunkt|T[äa]tigkeit|Rechtsgebiet)\w*\s*[:：]/i.test(l)) inPractice = true;
    if (current) { current.lines.push(l); if (isLabel || isLang) closed = true; }
    if (isLang) closed = true;
    continue;
  }
  // A plain line: a heading, the start of an entry, or more of the current one.
  // A numbered section of the covering note, "2. Angaben zu den Anwaelten:", is never a name.
  if (/^(?:\d{1,2}|[IVX]{1,4}|[a-h])[.)]\s+\S/.test(l) && !/@/.test(l) && l.length <= 90) { heading = l; current = null; closed = true; continue; }
  const headingHere = !/\d|@/.test(l) && l.length <= 80 && !TITLE.test(l)
    && (isCityLine(l) || (SPECIALTY_HEADING.test(l) && (TITLE.test(next) || !current || closed)) || (closed && TITLE.test(next) && !looksLikeAddress(next) && !/[a-z]{2,}\s[A-Z]/.test(l.split(' ')[0] + ' ' + (l.split(' ')[1] || ''))));
  // A specialty over a titled name is a heading even inside an entry that never closed: Mexico's
  // "Wochenende Intensivkurs Geburtsvorbereitung" note has no labels under it, and without this the
  // "Innere Medizin" heading and Dr. Tom Ubbelohde below it were read as more of that note.
  if (!/\d|@/.test(l) && SPECIALTY_HEADING.test(l) && TITLE.test(next) && !TITLE.test(l)) {
    heading = l; spec = l; if (isCityLine(l)) place = l; current = null; closed = true; continue;
  }
  // A line that opens with a title is a new person, whatever came before it.
  if (TITLE.test(l) && current && current.lines.length) closed = true;
  // --title-names: on a list where every person carries a title, a plain line that does not is
  // never a name. It ends the entry above and starts nothing.
  if (TITLE_NAMES && (closed || !current) && !TITLE.test(l) && !headingHere) { current = null; closed = true; continue; }
  if (headingHere && (closed || !current)) {
    heading = l; if (SPECIALTY_HEADING.test(l)) spec = l;
    if (isCityLine(l)) place = l; else if (PLACE_FROM_HEADING && SPECIALTY_HEADING.test(l) && !isCityLine(l)) { /* a specialty keeps the place */ }
    current = null;
    closed = true;
    continue;
  }
  // A job title is not a name: "Advocate / Managing Partner" stood where a Zanzibar lawyer's name
  // belongs, with the name itself two lines further down.
  if (/^(?:Advocates?|Attorneys?|Managing Partner|Senior Partner|Partner|Associates?|Notaries Public|Commissioners? for Oaths?)\b[\s/,&-]*(?:Advocates?|Managing|Partner|Notar\w*|Commissioners?|$)/i.test(l)) {
    if (current) current.lines.push(l);
    continue;
  }
  if (!current || closed) {
    current = { heading, spec, place: PLACE_FROM_HEADING ? place : '', name: l, lines: [] };
    entries.push(current);
    closed = false;
    continue;
  }
  current.lines.push(l);
}

/**
 * --hospital-addresses: the list's own directory of hospitals, used to give an address to a doctor
 * whose entry names only the hospital.
 *
 * Mexico City writes "Hospital Espanol, cons. 1003" under half its doctors and says so at the top:
 * "Die Anschriften sind am Ende der Aerzteliste aufgefuehrt", the addresses are at the end. They are,
 * in a closing section headed "Krankenhaeuser", and without them 57 doctors were refused for having
 * no address. The street added is the one the same page prints for that hospital, nothing looked up.
 */
const HOSPITAL_ADDRESSES = process.argv.includes('--hospital-addresses');
const hospitals = [];
if (HOSPITAL_ADDRESSES) {
  const start = lines.map((l, i) => (/^Krankenh[äa]user\b/i.test(l) ? i : -1)).filter((i) => i >= 0).pop();
  let h = null;
  for (let i = (start || lines.length) + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^(?:Hospital|Centro M[ée]dico|Cl[ií]nica)\b/i.test(l) && !/\|/.test(l) && (!h || h.address.length)) {
      h = { key: L.fold(l).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim(), address: [] };
      hospitals.push(h);
      continue;
    }
    if (!h || /^(?:Tel|Notdienst|Ambulanz|Fax|http|www)/i.test(l) || /\(|\|/.test(l)) continue;
    if (/\d|^Col\.|^Edo\./.test(l)) h.address.push(l);
  }
}
const hospitalAddress = (area) => {
  const f = L.fold(area).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ');
  // The full name first. A name shortened by its last word ("Hospital Medica Sur" for "Hospital Medica
  // Sur Tlalpan") only where one hospital alone begins that way: "Centro Medico ABC" is two of them.
  const short = (h) => h.key.split(' ').slice(0, -1).join(' ');
  const hit = hospitals.find((h) => f.startsWith(h.key))
    || hospitals.find((h) => h.key.split(' ').length >= 4 && f.startsWith(short(h)) && hospitals.filter((o) => o.key.startsWith(short(h))).length === 1);
  return hit && hit.address.length ? hit.address.join(', ') : '';
};

// --- read each entry -------------------------------------------------------------------------------------
const rows = entries.map((e) => {
  const claims = [];
  const area = [];
  const role = [];
  let url = '';
  for (let i = 0; i < e.lines.length; i++) {
    const l = e.lines[i];
    const lm = l.match(LANG_LABEL);
    if (lm) {
      let v = lm[1];
      while (/[,;]\s*$/.test(v) && e.lines[i + 1] && !LABEL.test(e.lines[i + 1])) { v += ' ' + e.lines[i + 1]; i += 1; }
      claims.push(v || e.lines[++i] || '');
      continue;
    }
    if (isLanguageLine(l)) { claims.push(l); continue; }
    const web = l.match(/\b(?:https?:\/\/|www\.)\S+/i);
    if (web && !url && !/@/.test(web[0])) url = web[0];
    if (CONTACT.test(l) || /@/.test(l) || /^\+?[\d\s()/.-]{6,}$/.test(l)) continue;
    const lab = l.match(LABEL);
    if (lab) {
      if (/^(?:Fach|Spezial|Schwerpunkt|T[äa]tigkeit|Rechtsgebiet)/i.test(lab[1])) role.push(lab[2]);
      else if (/^(?:Adresse|Anschrift|Address|Adresse physique|Besucheradresse)$/i.test(lab[1])) area.push(lab[2]);
      continue;
    }
    if (!looksLikeAddress(l) && !area.length) { role.push(l); continue; }
    // Areas of law are what the firm does, wherever in the entry they turn up.
    if (!/\d/.test(l) && /recht|beratung|Schlichtung|Mediation|Prozess|Vertrieb|Joint/i.test(l)) { role.push(l); continue; }
    area.push(l);
  }
  // The claim in brackets after the name: Dar es Salaam writes "Dr John S. KASONTA (deutsch -
  // englisch - kisuaheli)".
  const inName = e.name.match(/\(([^()]+)\)\s*$/);
  if (inName && isLanguageLine(inName[1].replace(/\s+[-–]\s+/g, ', '))) {
    claims.push(inName[1].replace(/\s+[-–]\s+/g, ', '));
    e.name = e.name.slice(0, inName.index).trim();
  }
  const languages = [];
  claims.forEach((c) => readClaim(c).forEach((x) => { if (x && !languages.includes(x)) languages.push(x); }));
  let name = e.name.replace(/\s+[-–]\s+(?:Psychiater\w*|Psychotherapeut\w*|Psychoanalytiker\w*|Climedi)\s*$/i, '').replace(/\s+[-–]\s+auch\s*$/i, '');
  return {
    heading: e.heading,
    specialty: [e.spec || e.heading, role[0] || ''].filter(Boolean).join(', ').slice(0, 120),
    role: role.join(', ').replace(/\s+/g, ' ').slice(0, 200),
    name: name.slice(0, 100),
    languages,
    languageLine: claims.join(' | '),
    area: T.tidyAddress((HOSPITAL_ADDRESSES && area.length && !/\d{4,}/.test(area.join(' ')) && hospitalAddress(area[0])
      ? [...area, hospitalAddress(area[0])] : area).join(', ')).slice(0, 200),
    ...(e.place ? { detail: e.place } : {}),
    url,
  };
}).filter((r) => r.name.length > 2);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length + ' with languages of their own');
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 40).padEnd(42) + (r.languages.join(',') || '-').padEnd(12)
    + r.area.slice(0, 50).padEnd(52) + '[' + r.heading.slice(0, 24) + ']'));
}
