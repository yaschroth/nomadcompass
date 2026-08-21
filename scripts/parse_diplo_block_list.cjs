/**
 * Reads a German consular list whose entries are blocks under a region heading.
 *
 * This is the shape the missions use for their Anwaltsliste and their Ärzteliste when the list runs
 * across a whole country: a heading naming the state, then one entry per firm, and inside an entry a
 * name on a line of its own, an address, then labelled lines. Australia's is typical:
 *
 *     Rechtsanwälte in New South Wales (NSW)
 *
 *     Asquith Legal
 *
 *     Mr Markus Christmann
 *     Suite 1, Ground Floor, Innovations Campus, Squires Way
 *     North Wollongong NSW 2500
 *
 *     Tel.: (02) 4208 0403
 *     E-Mail: markus@asquithlegal.com.au
 *
 *     Spezialgebiete: Internationales Erb- und Nachlassrecht
 *     Korrespondenz: Deutsch und Englisch
 *
 * The three readers already here each made something different of it. The table reader found no
 * grid. The block reader treated every blank line as an entry boundary, so one firm came out as six
 * entries and the disclaimer came out as a lawyer. The labelled reader knows this structure but its
 * labels are the English ones the US missions use, and it wants a name in capitals, which a firm
 * called Hall & Wilcox is not: it read 44 entries and not one language.
 *
 * What holds an entry together is the name, not the blank lines. A name here is a line by itself
 * with a blank line under it, and the entry is everything from there to the next such line. That
 * survives an entry split over four blocks and an entry written as one.
 *
 * "Korrespondenz:" is why it is worth reading at all. It is a per-entry language claim, in a country
 * where every other source would only ever have said English.
 *
 * Usage: node scripts/parse_diplo_block_list.cjs <file.pdf|file.txt> [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_block_list.cjs <file.pdf|file.txt> [--json]'); process.exit(2); }

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'diploblock-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try { execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) {
    console.error('pdftotext could not read this file'); process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

// --- the German labels these lists use ------------------------------------------------------------
const LABEL = /^\s*(Tel\.?|Telefon|Fax|Mobil|Handy|E-?Mail|Homepage|Internet|Website|Webseite|Web|Spezialgebiete?|T[äa]tigkeitsschwerpunkte?|Fachgebiete?|Fachbereiche?|Fachrichtungen?|Rechtsgebiete(?: und Fachbereiche)?|Sprachen?|Korrespondenz(?:sprachen?)?|Anschrift|Adresse|Postadresse|Postanschrift|B[üu]rozeiten|Sprechzeiten|Ansprechpartner(?:in)?)\s*[:：]\s*(.*)$/i;
const FIELD = {
  tel: 'phone', telefon: 'phone', fax: 'fax', mobil: 'mobile', handy: 'mobile',
  email: 'email', homepage: 'url', internet: 'url', website: 'url', webseite: 'url', web: 'url',
  spezialgebiet: 'practice', spezialgebiete: 'practice', tatigkeitsschwerpunkt: 'practice',
  tatigkeitsschwerpunkte: 'practice', fachgebiet: 'practice', fachgebiete: 'practice',
  rechtsgebiete: 'practice', rechtsgebieteundfachbereiche: 'practice',
  fachbereich: 'practice', fachbereiche: 'practice',
  fachrichtung: 'practice', fachrichtungen: 'practice',
  sprache: 'languages', sprachen: 'languages', korrespondenz: 'languages',
  korrespondenzsprache: 'languages', korrespondenzsprachen: 'languages',
  anschrift: 'address', adresse: 'address', postadresse: 'address', postanschrift: 'address',
  // The named contact is a person inside the firm, and the firm is the provider. Mapped so the line
  // is recognised as a label and does not run on into whichever value came before it.
  ansprechpartner: 'contact', ansprechpartnerin: 'contact',
};
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();
const fieldOf = (label) => FIELD[fold(label).replace(/[^a-z]/g, '')] || '';

// A heading names a profession and a place: "Rechtsanwälte in New South Wales (NSW)". It is also the
// only thing that says which part of the list we are in, and a list often ends with a section for
// the home country, whose entries are not in this country at all.
const HEADING = /^\s*(Rechtsanw[äa]lte|Anw[äa]lte|[ÄA]rzt(?:e|innen)?|Zahn[äa]rzte|Psychotherapeut\w*|[ÜU]bersetzer\w*|Dolmetscher\w*|Notare?|Bestatter)\b[^\n]*?\bin\s+(.+?)\s*$/i;

// Furniture: page numbers, the running head, and the blocks of prose every one of these lists opens
// with. None of it is an entry and all of it looks like one to a reader that only counts blank lines.
const FURNITURE = /^\s*(\d{1,3}|Seite \d+|Stand:.*|Haftungsausschluss:?)\s*$/i;

/**
 * A German sentence standing on its own between two blank lines, which is not a firm.
 *
 * These lists annotate their entries the same way they annotate themselves, and the notes sit alone
 * exactly as a name does. "Nimmt Rechtsreferendare an" trails eleven of Australia's entries and was
 * read as a firm that had stolen the next one's address; "Erreichbarkeit des Generalkonsulats
 * Sydney" published the German consulate itself as a lawyer. Both open with a word no name opens
 * with, so the opener is the test. It costs a firm called "Die Kanzlei" and saves the rest.
 */
const NOTE = /^(Nimmt|Zugelassen|Erreichbarkeit|[ÖO]ffnungszeiten|Sprechzeiten|Hinweis|Anmerkung|Achtung|Bitte|Stand|Haftungsausschluss|Die|Der|Das|Ein|Eine|Es|Alle|Diese|Dieser|Dieses|Sie|Wir|Im|In|Am|Auf|F[üu]r|Bei|Nach|Vor|Zur|Zum)\b/;

/**
 * The same note, met inside an entry rather than between two.
 *
 * Narrower than the test above on purpose. Up there a leading "Im" marks a sentence; down here it
 * could be the start of a street, and dropping "Im Zentrum 5" would cost the entry its address. Only
 * the words that annotate an entry are listed, and stopping at them is what keeps the language line
 * from reading "Deutsch und Englisch Nimmt Rechtsreferendare an".
 */
const ENTRY_NOTE = /^(Nimmt|Zugelassen|Erreichbarkeit|[ÖO]ffnungszeiten|Sprechzeiten|Hinweis|Anmerkung|Achtung|Bitte)\b/;

const rawLines = text.split(/\r?\n/).map((l) => l.replace(/\f/g, '').trimEnd());

// --- where the entries start ----------------------------------------------------------------------
// Everything before the first heading is the covering note: the disclaimer, the fee explanation and
// the embassy's own address, which a block reader published as three lawyers.
const firstHeading = rawLines.findIndex((l, i) => i > 0 && HEADING.test(l) && /\S{3}/.test(l));
const lines = firstHeading > 0 ? rawLines.slice(firstHeading) : rawLines;

/**
 * A name is a line on its own with nothing above or below it.
 *
 * Not a label, not an address, not a sentence. The blank line under it is what separates a firm
 * name from the person's name on the first line of the address block, which reads exactly the same.
 */
const looksLikeName = (l) => {
  const t = l.trim();
  if (!t || t.length < 3 || t.length > 70) return false;
  if (LABEL.test(t) || HEADING.test(t) || FURNITURE.test(t) || NOTE.test(t)) return false;
  if (/^[\d(]/.test(t) || /@|www\.|https?:/i.test(t)) return false;
  if (/[.!?]$/.test(t) && !/\b[A-Z]\.$/.test(t)) return false;
  if (!/^[A-ZÄÖÜÀ-Þ„"']/.test(t)) return false;
  // A sentence that happens to start with a capital. Six words of running German is not a firm.
  if (/\b(der|die|das|und|oder|von|f[üu]r|bei|mit|ist|sind|wird|werden|k[öo]nnen|nicht|auch|sich)\b/i.test(t)
      && t.split(/\s+/).length > 5) return false;
  return /[A-Za-zÀ-ÿ]{3}/.test(t);
};

const isBlank = (i) => i < 0 || i >= lines.length || !lines[i].trim();

// --- cut the list into entries ---------------------------------------------------------------------
const entries = [];
let region = '';
let headingFull = '';
let current = null;
const close = () => { if (current && (current.lines.length || current.name)) entries.push(current); current = null; };

for (let i = 0; i < lines.length; i += 1) {
  const l = lines[i].trim();
  const h = l.match(HEADING);
  if (h && isBlank(i + 1)) { close(); region = h[2].replace(/\s*\(.*\)\s*$/, '').trim(); headingFull = l; continue; }
  if (!l || FURNITURE.test(l)) continue;
  /**
   * Where an entry starts: after a blank line, on something that reads like a name, and with the
   * entry's labels close enough behind it to prove it is one.
   *
   * The blank line below the name is not enough on its own. Australia isolates the firm name that
   * way, but Canada runs the labels straight on under it, so requiring a blank below read the
   * province as the provider and glued every firm in British Columbia into one row. Looking two
   * lines ahead for a label covers both, and the two-line gap is what lets a name carry a subtitle:
   * "HOLMES STEWART VON ANTAL" over "Barristers and Solicitors" over "Ansprechpartner:".
   *
   * It also still refuses the line under an Australian firm name, "Mr Markus Christmann" above a
   * street, because no label follows it either.
   */
  const labelWithinTwo = LABEL.test(lines[i + 1] || '') || LABEL.test(lines[i + 2] || '');
  if (isBlank(i - 1) && (isBlank(i + 1) || labelWithinTwo) && looksLikeName(l)) {
    close();
    current = { name: l, region, headingFull, lines: [] };
    continue;
  }
  if (current) current.lines.push(l);
}
close();

// --- read one entry ---------------------------------------------------------------------------------
const rows = entries.map((e) => {
  const fields = {};
  const plain = [];
  let last = '';
  for (const l of e.lines) {
    if (ENTRY_NOTE.test(l)) { last = ''; continue; }
    const m = l.match(LABEL);
    if (m) {
      const f = fieldOf(m[1]);
      if (!f) { last = ''; continue; }
      const val = m[2].trim();
      // Four Australian entries carry their Korrespondenz line twice, once under the specialities
      // and once at the foot, and joining them gave "Deutsch und Englisch Deutsch und Englisch".
      if (!fields[f]) fields[f] = val;
      else if (val && !fields[f].includes(val)) fields[f] += ' ' + val;
      last = f;
      continue;
    }
    // A labelled value wraps: the specialities run over three lines on half these entries. Before
    // any label has been seen, a plain line is still part of the address.
    //
    // Not every field wraps, though. A language line is one line by convention in these lists, and
    // letting it run on gave "Englisch und Deutsch McManus & Co. Lawyers Ms" where the next firm's
    // name had followed it without a blank line between.
    if (last === 'languages') { last = ''; plain.push(l); continue; }
    if (last) fields[last] += ' ' + l;
    else plain.push(l);
  }
  const address = (fields.address ? fields.address + ', ' : '') + plain.join(', ');
  return {
    heading: e.region,
    // The heading with its profession left on, because that is what says what these people do.
    // Stripping it to the state left the ingest with "New South Wales" to categorise and it filed
    // five Sydney lawyers under nothing at all.
    specialty: e.headingFull || e.region,
    // The specialities go in role, not in detail. Both feed the category test, but the ingest also
    // builds the address out of detail, and three hundred characters of German practice areas in
    // the address moved the town the placement reads: Canberra's one firm stopped being in Canberra.
    role: (fields.practice || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    name: e.name.replace(/[,;:]\s*$/, ''),
    // Read under an explicit label, so a lone "D" is German rather than an initial. Sydney's one
    // seven-language entry, "Englisch, Deutsch, Französisch, Italienisch, Arabisch, Sinhala, Bemba",
    // is the reason the lexicon is shared rather than copied: Bemba is still missing from it and is
    // reported as missing instead of being quietly dropped or guessed at.
    languages: L.readLanguages(fields.languages || '', true, unknownLangs),
    languagesText: (fields.languages || '').replace(/\s+/g, ' ').trim(),
    languageLine: (fields.languages || '').replace(/\s+/g, ' ').trim(),
    area: address.replace(/\s+/g, ' ').replace(/^,\s*|,\s*$/g, '').slice(0, 140),
    // Australia writes four digits, Germany five, and the state code sits in front of both.
    postcode: (address.match(/\b([A-Z]{2,3}\s+\d{4}|\d{5})\b/) || [])[1] || '',
    practice: (fields.practice || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    phone: (fields.phone || '').split(/\s{2,}/)[0] || '',
    email: (fields.email || '').split(/\s+/)[0] || '',
    url: (fields.url || '').split(/\s+/)[0] || '',
  };
}).filter((r) => r.name && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languagesText).length + ' stating what they work in, '
    + rows.filter((r) => r.area).length + ' with an address');
  const by = {};
  rows.forEach((r) => { by[r.heading] = (by[r.heading] || 0) + 1; });
  Object.entries(by).forEach(([h, n]) => console.log('   ' + String(n).padStart(3) + '  ' + (h || '(no region)').slice(0, 46)));
  rows.slice(0, 10).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(20) + r.area.slice(0, 44)));
  if (unknownLangs.size) console.log('  words in a language line this lexicon does not hold: ' + [...unknownLangs].join(' | '));
}
