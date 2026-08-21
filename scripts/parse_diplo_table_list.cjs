/**
 * Reads a German mission's doctor list of the kind that names its own columns.
 *
 * Several missions publish one table per specialty with a header row that says what each column
 * holds: "Name | Praxis | Sprachen | Krankenhaus | Sprechstunde". That header is worth more than any
 * guess a parser could make, and it carries the one column this directory exists for: Sprachen,
 * the languages of that entry, stated per person rather than for the roster as a whole.
 *
 * A roster-level claim says "this is a list of German-speaking doctors" and every row inherits it.
 * A per-entry column says this doctor speaks German, English, Greek and French, and that is a
 * different and better thing. Where the column exists this parser reads it and nothing is inherited.
 *
 * The Paris lists are a different shape and have their own parser, scripts/parse_diplo_fr_list.cjs.
 *
 * Usage: node scripts/parse_diplo_table_list.cjs <page.html> [--json]
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_table_list.cjs <page.html> [--json]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');

const dec = (s) => String(s || '')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;|&(l|r)dquo;/g, '"')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
  .replace(/\n{2,}/g, '\n').trim();

// What the mission calls a column, and what we call it.
const COLUMN = [
  // "Name und Anschrift" is one column holding two things, and it is the commonest header on these
  // lists. Reading it as a name alone threw the address away, and the ingest then refused 907 rows
  // for having no address: Milan and Rome, whose lists are headed exactly that, lost every row.
  [/^name.*\b(anschrift|adresse|address|indirizzo|direccion|direcci)/i, 'nameAddress'],
  // Not only "Name": Istanbul heads its column "Titel, Vor- und Nachname", and once its header row
  // became visible the parser could see the languages column but not the names, and read nothing.
  [/^name|vor-?\s*und\s*nachname|nachname|^titel\b|^nome\b|^nom\b|^cognome/i, 'name'],
  [/praxis|adresse|anschrift|kontakt/i, 'practice'],
  [/sprach|language/i, 'languages'],
  [/krankenhaus|klinik|hospital/i, 'hospital'],
  [/sprechstunde|termin|opening/i, 'hours'],
  [/fach|spezial|specialit/i, 'specialty'],
];

// The languages a Sprachen cell can name. Anything not in here is reported rather than dropped
// silently, because an unrecognised language is a gap in this table, not a fact about the doctor.
const LANG = {
  deutsch: 'de', german: 'de', allemand: 'de',
  englisch: 'en', english: 'en', anglais: 'en',
  griechisch: 'el', greek: 'el', ellinika: 'el',
  franz: 'fr', french: 'fr', francais: 'fr',
  italienisch: 'it', italian: 'it',
  spanisch: 'es', spanish: 'es', span: 'es',
  portugiesisch: 'pt', portuguese: 'pt',
  russisch: 'ru', russian: 'ru',
  niederl: 'nl', dutch: 'nl',
  polnisch: 'pl', polish: 'pl',
  tuerkisch: 'tr', turkisch: 'tr', turkish: 'tr',
  arabisch: 'ar', arabic: 'ar',
  kroatisch: 'hr', serbisch: 'sr', bulgarisch: 'bg', rumaenisch: 'ro', rumanisch: 'ro',
  schwedisch: 'sv', daenisch: 'da', danisch: 'da', norwegisch: 'no', finnisch: 'fi',
  tschechisch: 'cs', ungarisch: 'hu', hebraeisch: 'he', hebraisch: 'he',
  japanisch: 'ja', chinesisch: 'zh', koreanisch: 'ko', thai: 'th', vietnamesisch: 'vi',
  hindi: 'hi', persisch: 'fa', albanisch: 'sq', ukrainisch: 'uk',
  slowakisch: 'sk', slovak: 'sk', slowenisch: 'sl',
  // Two spellings the Athens list gets wrong. Both are unambiguous, and dropping a language because
  // the mission mistyped it would understate what the doctor speaks.
  deutch: 'de', italienenisch: 'it',
};
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();

// Zagreb has no languages column. It writes the claim into the name itself, one entry at a time:
// "Dr. Ingrid Kakarigi (spricht Deutsch)", "Dr. Lena Kotrulja (spricht Englisch)". That is a
// per-entry claim and it is worth more than the page's own heading, which offers "deutsch- bzw.
// englischsprachige Aerzte": an either/or that says nothing about any particular doctor. Rows
// without a note get nothing, because the heading cannot be split between them.
const INLINE_NOTE = /\((?:spricht|spricht auch|speaks|parla|habla)\s+([^)]+)\)|\((deutschsprachig|englischsprachig|francophone|germanophone)\)/i;
// Under a German "Sprachen:" label a bare letter is that language's German initial. Milan writes
// "Sprachen: D / E / F / Chinesisch", and reading only the spelled-out word gave a lawyer whose one
// language was Chinese: not merely incomplete but wrong, since it would have taken him off the
// German page and put him on a Chinese one. The mixed line is what proves the convention: the list
// spells out the unusual language and abbreviates the ones its readers expect.
const LETTER = { d: 'de', e: 'en', f: 'fr', i: 'it', s: 'es', p: 'pt', n: 'nl', r: 'ru' };
const unknownLangs = new Set();
const readLanguages = (cell, allowLetters) => {
  const out = [];
  fold(cell).split(/[,;/|]+|\band\b|\bund\b/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
    const hit = Object.keys(LANG).find((k) => p.startsWith(k));
    if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); return; }
    if (allowLetters && p.length === 1 && LETTER[p]) { if (!out.includes(LETTER[p])) out.push(LETTER[p]); return; }
    if (p.length > 2 && p.length < 24 && !/^\(|^[0-9]/.test(p)) unknownLangs.add(p);
  });
  return out;
};

// "SCHLUETER, Christian, Dr." -> "Dr. Christian SCHLUETER". Same convention as the Paris lists.
// A doctorate goes in front of the name because that is where a reader expects it. A professional
// qualification does not: "MD FEBOphth Maria DARAVAGKA" reads as a job advert, so MD, FEBO and the
// rest are pulled out of the name and left to the role line.
const TITLE_TOK = /^(Prof\.|Dr\.|Dre\.|med\.|Med\.|dent\.|Dent\.|MD|PhD|Ph\.D\.|FEBO\w*|MSc|MBA)$/;
const KEEP_TITLE = /^(Prof\.|Dr\.|Dre\.|med\.|Med\.|dent\.|Dent\.)$/;
// Some missions put the form of address on its own line above the name.
const SALUTATION = /^(Herr|Frau|Mr\.?|Mrs\.?|Ms\.?|Sr\.?|Sra\.?|Sig\.?|Sig\.ra)$/i;
const properName = (raw) => {
  const line = (raw.split('\n').find((l) => l.trim() && !SALUTATION.test(l.trim())) || '')
    // A parenthetical is a second given name or a note, and leaving it in makes the name look like
    // three given names, which is the shape this refuses to swap.
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bDr\.\s*med\.\s*dent\./gi, 'Dr. med. dent.').replace(/\bDr\.\s*med\./gi, 'Dr. med.')
    .replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
  if (!line || line.length < 4) return '';
  // A line with no comma is already in reading order, but some of them run straight on into what the
  // person does: "Prof. Dr. Marko Banic Kooperationsarzt der Botschaft". The job starts where the
  // name ends.
  const ROLE_START = /\s+(Kooperations\w+|Facharzt|Fach[äa]rztin|Zahn[äa]rzt\w*|Chirurg\w*|Professor|Praxis|Klinik|Spezialist\w*|Leiter\w*|Ober[äa]rzt\w*)\b/i;
  if (!line.includes(',')) {
    const cut = line.search(ROLE_START);
    return (cut > 5 ? line.slice(0, cut) : line).trim().slice(0, 70);
  }
  const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
  const titles = [];
  const given = [];
  // A comma-separated part is one of three things, and counting words cannot tell them apart:
  // "Christian" is a given name, "Dr. med." is a title, and "Facharzt fuer Neurologie" or
  // "MIC II, DEGUM I" is what the person does. Only something shaped like a name is taken as one.
  const GIVEN = /^[A-ZÄÖÜÀ-Þ][a-zà-ÿ'-]+(?:[- ][A-ZÄÖÜÀ-Þ][a-zà-ÿ'-]+)?$/;
  // A job title is capitalised in German, so "Konstantinos Professor" passes the shape test above
  // while plainly not being a name.
  const JOB = /\b(Professor|Zahn|Fach|Arzt|Ärztin|Arztin|Psycho|Chirurg|Doktor|Praxis|Klinik)/i;
  parts.slice(1).forEach((p) => {
    if (p.split(/\s+/).every((t) => TITLE_TOK.test(t))) { titles.push(...p.split(/\s+/)); return; }
    if (GIVEN.test(p) && !JOB.test(p)) { given.push(p); return; }
    // A part that mixes a title with a given name, as in "Dr. med. Vasileios".
    const keep = [];
    p.split(/\s+/).forEach((t) => (TITLE_TOK.test(t) ? titles.push(t) : keep.push(t)));
    if (keep.length && GIVEN.test(keep.join(' ')) && !JOB.test(keep.join(' '))) given.push(keep.join(' '));
  });
  // "Dr. Prof. Dr. med. Konstantinos" is the list repeating itself, not four qualifications.
  const front = [...new Set(titles.filter((t) => KEEP_TITLE.test(t)))];
  // With no given name found the surname cell is already in reading order, or it is a name this
  // parser cannot take apart. Either way the raw first part is the honest answer.
  // A qualification trailing the fallback name is not part of it either: "Krithymos Thomas MD".
  const core = (given.length ? given.join(' ') + ' ' + parts[0] : parts[0])
    .replace(/\s+(MD|PhD|MSc|MBA|FEBO\w*|FRCS\w*)\.?$/i, '');
  return ((front.length ? front.join(' ') + ' ' : '') + core).replace(/\s+/g, ' ').trim().slice(0, 70);
};

/**
 * What the columns hold, worked out from the cells, for the missions that print no header row.
 *
 * Istanbul's list has everything Athens has, in the same order, and simply never says so. Reading
 * it by fixed position would be a guess that breaks on the next mission; reading it by what the
 * cells contain is the same judgement a person makes looking at the table. A column is the language
 * column when most of its cells are language words and nothing else, and the rule is deliberately
 * strict, because inventing a language column is the one mistake this directory cannot afford.
 */
const inferColumns = (dataRows) => {
  if (!dataRows.length) return null;
  // Scoring calls readLanguages on every cell of every column, which would otherwise fill the
  // unknown-word report with names and addresses. Only a real read should add to it.
  const knownBefore = new Set(unknownLangs);
  const width = Math.max(...dataRows.map((r) => r.length));
  const score = (test) => Array.from({ length: width }, (_, i) => {
    const cells = dataRows.map((r) => (r[i] || '').trim()).filter(Boolean);
    return cells.length ? cells.filter(test).length / cells.length : 0;
  });
  const langish = score((c) => c.length < 70 && readLanguages(c).length > 0
    && !/\d{3}|@|Tel|Fax|Str\.|Cad\.|www\./i.test(c));
  const telish = score((c) => /^(Tel|Fax|Mobil|E-Mail|Mob)\b|\+\d{1,3}[ .(]/i.test(c));
  const addrish = score((c) => /\b\d{4,6}\b|Cad\.|Sok\.|Str\.|\brue\b|\bvia\b|\bcalle\b|\bav\.|No[.:]/i.test(c));
  const best = (arr, min, taken) => {
    let at = -1;
    let top = min;
    arr.forEach((v, i) => { if (v > top && !taken.includes(i)) { top = v; at = i; } });
    return at;
  };
  const taken = [];
  const cols = new Array(width).fill(null);
  const langAt = best(langish, 0.55, taken);
  if (langAt >= 0) { cols[langAt] = 'languages'; taken.push(langAt); }
  const telAt = best(telish, 0.5, taken);
  if (telAt >= 0) taken.push(telAt);
  const addrAt = best(addrish, 0.4, taken);
  if (addrAt >= 0) { cols[addrAt] = 'practice'; taken.push(addrAt); }
  // The name is the first column left over, which on most lists of this kind is column 0. Not on
  // all of them: Zagreb puts the specialty first and the name second, and taking column 0 filed
  // every entry under a person called "Dermatologie". Where entries carry a language note, the
  // column holding those notes is the column holding the names, and that beats position.
  const noteish = score((c) => INLINE_NOTE.test(c));
  const noteAt = best(noteish, 0, taken);
  if (noteAt >= 0) { cols[noteAt] = 'name'; taken.push(noteAt); }
  const nameAt = cols.includes('name') ? -1 : cols.findIndex((c, i) => !c && !taken.includes(i));
  if (nameAt >= 0) { cols[nameAt] = 'name'; taken.push(nameAt); }
  // Whatever is left and is not the phone column describes what the person does.
  const specAt = cols.findIndex((c, i) => !c && !taken.includes(i));
  if (specAt >= 0) cols[specAt] = 'specialty';
  unknownLangs.clear(); knownBefore.forEach((w) => unknownLangs.add(w));
  if (!cols.includes('name')) return null;
  if (cols.includes('languages')) return cols;
  // No column, but the claim may sit inside the entries themselves. Two rows carrying it is the
  // floor: one could be an aside, two is how the list works.
  const noted = dataRows.filter((r) => r.some((c) => INLINE_NOTE.test(c))).length;
  return noted >= 2 ? cols : null;
};

const rows = [];
let specialty = '';
// Some lists put the specialty in a row of the table, some in a heading above it. Zagreb's private
// dentists are under an h2, and reading tables alone left five of them with nothing saying they are
// dentists. Headings and tables are walked together, in document order, so the last heading seen is
// available as a fallback.
let sectionHeading = '';
const NOT_A_SPECIALTY = /befinden sich hier|navigation|inhalt|suche|kontakt|stand:|seitennavigation/i;
// A bold line counts as a heading too, but only where it falls outside a table: the alternation
// consumes a table whole, so anything bold inside one never reaches this branch. London's doctor
// list is why. It marks every section with an h3 except the dentists, who get a <strong>, and five
// of them were read under the psychiatry heading above them, one of them filed as a therapist.
for (const t of html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>|<strong[^>]*>([\s\S]*?)<\/strong>|<table[\s\S]*?<\/table>/g)) {
  if (t[1] !== undefined || t[2] !== undefined) {
    const head = dec(t[1] !== undefined ? t[1] : t[2]).replace(/\s+/g, ' ').trim();
    if (head && head.length < 70 && !NOT_A_SPECIALTY.test(head)) sectionHeading = head;
    continue;
  }
  let cols = null;
  // A row can carry attributes, and the one that matters usually does: Rome marks its header
  // <tr class="bab-table--head">, so a pattern requiring a bare <tr> never saw the column names and
  // read nothing at all from a table of 51 doctors.
  const all = [...t[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((r) => [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => dec(c[1])));
  // A table that names its columns is read by its header. One that does not is read by what its
  // cells hold, and if that cannot find a name and a language column the table is left alone.
  const named = all.some((cells) => cells.map((c) => (COLUMN.find(([re]) => re.test(c)) || [])[1])
    .filter(Boolean).length >= 2 && cells.every((c) => c.length < 40));
  if (!named) cols = inferColumns(all.filter((c) => c.filter((x) => x.trim()).length >= 3));
  for (const cells of all) {
    if (!cells.length) continue;
    // The row above the header is the specialty this table lists. Some of them are a single cell
    // and some are one cell followed by empty ones, and reading only the first shape made two
    // tables inherit the specialty above them: a page then said a dermatologist was under surgery.
    const filled = cells.filter((c) => c.trim());
    if (filled.length === 1 && filled[0].length < 60) { specialty = filled[0].replace(/\n/g, ' '); continue; }
    // The header row names the columns. Until one is found, this table is not one we can read.
    const asHeader = cells.map((c) => (COLUMN.find(([re]) => re.test(c)) || [])[1]);
    if (asHeader.filter(Boolean).length >= 2 && cells.every((c) => c.length < 40)) { cols = asHeader; continue; }
    if (!cols) continue;
    const get = (what) => { const i = cols.indexOf(what); return i < 0 ? '' : (cells[i] || ''); };
    // Where one column holds the name and the address, the first line is the name and the rest is
    // where to find them.
    const joined = get('nameAddress');
    const nameCell = joined ? joined.split('\n')[0] : get('name');
    const addressFromName = joined ? joined.split('\n').slice(1).join('\n') : '';
    const name = properName(nameCell);
    if (!name || /^name$/i.test(name)) continue;
    const practice = get('practice') || addressFromName;
    // The column if there is one, otherwise the entry's own parenthetical note.
    const noteSource = joined || get('name');
    const inline = (noteSource.match(INLINE_NOTE) || [])[1] || (noteSource.match(INLINE_NOTE) || [])[2] || '';
    // Three places a language claim can sit, in order of how plainly it is stated: a column of its
    // own, a labelled line inside another cell ("Korrespondenzsprachen: Deutsch, Italienisch,
    // Englisch", which is how Rome and Milan write it), or a parenthetical on the name.
    const labelled = (cells.join('\n').match(/(?:Korrespondenz|Arbeits|Verhandlungs)?[Ss]prachen?\s*:\s*([^\n]{2,80})/) || [])[1] || '';
    const languages = readLanguages(get('languages')).length
      ? readLanguages(get('languages'))
      : (readLanguages(labelled, true).length
        ? readLanguages(labelled, true)
        : readLanguages(inline.replace(/sprachig/i, 'sch')));
    const flat = cells.join(' ').replace(/\n/g, ' ');
    // Athens puts the specialty in a heading above the table, Istanbul in a column beside the name.
    // Both are the same fact and the row needs it either way, or every entry arrives with nothing
    // to say what the person does and cannot be filed under anything.
    const inRow = get('specialty').replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
    rows.push({
      specialty: specialty || inRow || sectionHeading,
      name,
      // Everything under the name after the first line is what the person is, not who.
      // With the address in the name cell, the lines under the name are the address, not a role.
      role: [joined ? '' : get('name').split('\n').slice(1).join(', '), specialty ? inRow : '']
        .filter(Boolean).join(', ').replace(/\s+/g, ' ').replace(/^,\s*|,\s*$/g, '').trim(),
      area: practice.split('\n').filter((l) => !/^(Tel|Fax|Mob|E-Mail|www\.|http)/i.test(l)).join(', '),
      postcode: (practice.match(/\b(\d{3} ?\d{2}|\d{5})\b/) || [])[1] || '',
      languages,
      hospital: get('hospital').split('\n')[0] || '',
      url: (flat.match(/\b((?:https?:\/\/|www\.)[^\s|,)]+)/) || [])[1] || '',
      hasLanguageColumn: cols.includes('languages'),
    });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, unknownLanguageWords: [...unknownLangs] }, null, 2));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length + ' with languages of their own, '
    + rows.filter((r) => r.postcode).length + ' with a postcode, ' + rows.filter((r) => r.url).length + ' with a website');
  const by = {};
  rows.forEach((r) => { by[r.specialty] = (by[r.specialty] || 0) + 1; });
  Object.entries(by).forEach(([s, n]) => console.log('   ' + String(n).padStart(3) + '  ' + s.slice(0, 50)));
  rows.slice(0, 6).forEach((r) => console.log('  e.g. ' + r.name.slice(0, 28).padEnd(30)
    + (r.languages.join(',') || '-').padEnd(14) + r.postcode.padEnd(7) + r.area.slice(0, 34)));
  if (unknownLangs.size) console.log('  words in a language column this parser does not know: ' + [...unknownLangs].slice(0, 12).join(' | '));
}
