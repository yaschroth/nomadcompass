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
  [/^name/i, 'name'],
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
const unknownLangs = new Set();
const readLanguages = (cell) => {
  const out = [];
  fold(cell).split(/[,;/|]+|\band\b|\bund\b/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
    const hit = Object.keys(LANG).find((k) => p.startsWith(k));
    if (hit) { if (!out.includes(LANG[hit])) out.push(LANG[hit]); }
    else if (p.length > 2 && p.length < 24 && !/^\(|^[0-9]/.test(p)) unknownLangs.add(p);
  });
  return out;
};

// "SCHLUETER, Christian, Dr." -> "Dr. Christian SCHLUETER". Same convention as the Paris lists.
// A doctorate goes in front of the name because that is where a reader expects it. A professional
// qualification does not: "MD FEBOphth Maria DARAVAGKA" reads as a job advert, so MD, FEBO and the
// rest are pulled out of the name and left to the role line.
const TITLE_TOK = /^(Prof\.|Dr\.|Dre\.|med\.|Med\.|dent\.|Dent\.|MD|PhD|Ph\.D\.|FEBO\w*|MSc|MBA)$/;
const KEEP_TITLE = /^(Prof\.|Dr\.|Dre\.|med\.|Med\.|dent\.|Dent\.)$/;
const properName = (raw) => {
  const line = raw.split('\n')[0]
    // A parenthetical is a second given name or a note, and leaving it in makes the name look like
    // three given names, which is the shape this refuses to swap.
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bDr\.\s*med\.\s*dent\./gi, 'Dr. med. dent.').replace(/\bDr\.\s*med\./gi, 'Dr. med.')
    .replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
  if (!line || line.length < 4) return '';
  if (!line.includes(',')) return line.slice(0, 70);
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

const rows = [];
let specialty = '';
for (const t of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
  let cols = null;
  for (const r of t[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => dec(c[1]));
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
    const name = properName(get('name'));
    if (!name || /^name$/i.test(name)) continue;
    const practice = get('practice');
    const languages = readLanguages(get('languages'));
    const flat = cells.join(' ').replace(/\n/g, ' ');
    rows.push({
      specialty,
      name,
      // Everything under the name after the first line is what the person is, not who.
      role: get('name').split('\n').slice(1).join(', ').replace(/\s+/g, ' ').trim(),
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
