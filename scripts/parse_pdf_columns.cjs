/**
 * Reads a consular list laid out as two columns with a gutter between them.
 *
 * The Italian consulates write their lists this way: the person on the left with what they do under
 * their name, the firm, address and contacts on the right, and an entry ending at a blank line.
 * Sydney's lawyers are typical:
 *
 *     CALABRESE Joseph                                    Calabrese Lawyers
 *                                                         Level 1, 22/103 Majors Bay Road, Concord NSW 2137
 *     diritto ereditario/penale/famiglia/civile           Tel: (02) 9743 1333 - Fax: (02) 9743 1700
 *                                                         Email: info@calabreselaw.com.au
 *
 * Every reader here made nonsense of it, and each in its own way. The block reader reads a page a
 * line at a time, so it glued the practice areas onto the address and gave the name as "MARANO
 * Annamaria Marano Family Lawyers". The table reader found no grid. parse_pdf_blocks --columns cuts
 * each line at its own widest gap, which is not the same as cutting every line in the same place:
 * where a line has no gap it keeps the whole line, and the columns interleave.
 *
 * The gutter is a property of the page, not of a line. It is the band of character positions where
 * almost every line has a space, and once it is found the page is two pages side by side.
 *
 * Usage: node scripts/parse_pdf_columns.cjs <file.pdf|file.txt> [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_pdf_columns.cjs <file.pdf|file.txt> [--json]'); process.exit(2); }

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'pdfcols-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try { execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) {
    console.error('pdftotext could not read this file'); process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

const lines = text.split(/\r?\n/).map((l) => l.replace(/\f/g, '').trimEnd());

/**
 * Where the gutter is: the band of blank positions that has text on BOTH sides of it.
 *
 * Blankness alone finds the margin. Past the longest line every position is blank on every line, so
 * the widest blank band on any page is the empty right-hand side, and cutting there gives one column
 * and an empty one. What distinguishes a gutter is that the page continues after it: the band is
 * scored by how many lines have text to its left and text to its right, and the margin scores zero
 * by definition.
 *
 * 85% blank rather than 100%, because one long line always overruns into the gutter.
 */
function findGutter(rows) {
  const body = rows.filter((l) => l.trim().length > 20);
  if (body.length < 4) return 0;
  const width = Math.max(...body.map((l) => l.length));
  const blankAt = [];
  for (let p = 0; p < width; p += 1) {
    blankAt[p] = body.filter((l) => (l[p] === undefined ? ' ' : l[p]) === ' ').length / body.length;
  }

  const straddles = (start, len) => body.filter((l) =>
    l.slice(0, start).trim() && l.slice(start + len).trim()).length / body.length;

  let best = { start: 0, len: 0, score: 0 };
  let run = 0;
  // 0.6 rather than 0.85: the disclaimer, the headings and the footer all run the width of the page
  // and put text in the gutter, and on Sydney's lawyer list that is a quarter of the lines.
  for (let p = 12; p < width; p += 1) {
    if (blankAt[p] >= 0.6) {
      run += 1;
      // Wide enough to be a gutter rather than the space between two words.
      if (run >= 3) {
        const start = p - run + 1;
        const score = straddles(start, run);
        if (score > best.score || (score === best.score && run > best.len)) best = { start, len: run, score };
      }
    } else run = 0;
  }
  // A third of the lines having text on both sides is what a two-column list looks like once the
  // page-wide furniture is counted in.
  if (best.score < 0.3) return 0;

  /**
   * The band is where the page is usually blank; the cut belongs where the right column starts.
   *
   * They are not the same. A long practice line runs on past the band, so the band ends before the
   * right column begins, and cutting at the band's start took 42 characters off "diritto
   * ereditario/testamentario/immobiliare/trasporti". Only the lines that are blank right across the
   * band can say where the second column begins, and the commonest answer is the answer.
   */
  const starts = {};
  body.forEach((l) => {
    if (l.slice(best.start, best.start + best.len).trim()) return;
    const after = l.slice(best.start + best.len);
    if (!after.trim()) return;
    const at = best.start + best.len + after.search(/\S/);
    starts[at] = (starts[at] || 0) + 1;
  });
  const mode = Object.entries(starts).sort((a, b) => b[1] - a[1])[0];
  const cut = mode ? Number(mode[0]) : best.start;

  /**
   * Refuse a cut that goes through a word.
   *
   * A gutter separates the columns; a wrong cut runs down the middle of the text and takes a slice
   * out of every line. It is visible in the output and unmistakable: Istanbul's heading came out as
   * "AVVOCATI SPECIALIZZATI NEL SETTORE COMMER" with "CIALE" on the other side, and a Bangkok
   * address as "atburana" for Rat Burana. The page itself says which it is, so the reader can tell:
   * at a real gutter almost no line has a letter on both sides of the cut.
   */
  // Count the lines the cut lands cleanly on, a space before it and text at it, against the lines it
  // lands inside a word on. Over the fifteen files a reader sweep proposed this reader for, the two
  // it can actually read give 4.8 and 2.7 clean lines per mangled one and the other thirteen give
  // 1.1 or less: the two populations do not overlap. A page-wide disclaimer crosses any cut, which
  // is why this is a ratio and not a count.
  const through = body.filter((l) => l[cut - 1] && l[cut - 1] !== ' ' && l[cut] && l[cut] !== ' ').length;
  const clean = body.filter((l) => (l[cut - 1] === ' ' || l[cut - 1] === undefined) && l[cut] && l[cut] !== ' ').length;
  if (clean < through * 2) return 0;
  return cut;
}

const gutter = findGutter(lines);
if (!gutter) {
  if (process.argv.includes('--json')) console.log(JSON.stringify({ rows: [] }, null, 1));
  else console.log('no gutter found: this page is not in two columns');
  process.exit(0);
}

const left = lines.map((l) => l.slice(0, gutter).trim());
const right = lines.map((l) => l.slice(gutter).trim());

/**
 * A second name in the left column starts a second entry, blank line or not.
 *
 * The columns go out of step: Sydney's list puts "NASTI Salvatore" in the left column while MASI
 * Anna's email is still running down the right, with no blank line between them. Read on blank lines
 * alone that is one entry with two names, and the entry after it takes a practice line as its name.
 *
 * The shape these lists write a name in is what tells them apart: a shouted surname and then a given
 * name in ordinary case. "DIRITTO DI FAMIGLIA" is all capitals and does not match.
 */
const A_NAME = /^[A-ZÀ-Þ][A-ZÀ-Þ'’.\- ]{2,}\s+[A-ZÀ-Þ][a-zà-ÿ]+/;

// --- cut into entries at a blank line, or at the next name ----------------------------------------
const entries = [];
let cur = null;
for (let i = 0; i < lines.length; i += 1) {
  if (!left[i] && !right[i]) { if (cur) { entries.push(cur); cur = null; } continue; }
  if (cur && cur.left.length && left[i] && A_NAME.test(left[i])) { entries.push(cur); cur = null; }
  if (!cur) cur = { left: [], right: [] };
  if (left[i]) cur.left.push(left[i]);
  if (right[i]) cur.right.push(right[i]);
}
if (cur) entries.push(cur);

const CONTACT = /^(Tel|Telefono|Telefon|Fax|Mob|Mobile|Cell|Cellulare|E-?mail|Email|Sito|Web|Website|www\.|http)/i;
const LANG_LINE = /^\(?\s*(lingue|lingua|languages?|idiomas?)\s*:?\s*(.+?)\)?$/i;

const rows = entries.map((e) => {
  const name = e.left[0] || '';
  const rest = e.left.slice(1);
  // A parenthetical under the name is the language pair on the translator lists.
  const langLine = rest.map((l) => (l.match(LANG_LINE) || [])[2] || '')
    .filter(Boolean).join(', ')
    || (rest[0] && /^\(.+\)$/.test(rest[0]) ? rest[0].replace(/^\(|\)$/g, '') : '');
  const practice = rest.filter((l) => !LANG_LINE.test(l)).join(' ').replace(/\s+/g, ' ').trim();
  const address = e.right.filter((l) => !CONTACT.test(l)).join(', ').replace(/\s+/g, ' ').trim();
  const contacts = e.right.filter((l) => CONTACT.test(l)).join(' ');
  return {
    name: name.replace(/[,;:]\s*$/, ''),
    languages: langLine ? L.readLanguages(langLine, false, unknownLangs) : [],
    languagesText: langLine,
    languageLine: langLine,
    // The specialities go in role: the ingest reads role for the category and detail for the
    // address, and putting three hundred characters of practice areas in the address moves the town.
    role: practice.slice(0, 200),
    area: address.slice(0, 160),
    postcode: (address.match(/\b([A-Z]{2,3}\s+\d{4}|\d{5})\b/) || [])[1] || '',
    phone: (contacts.match(/(?:Tel|Telefono|Phone)[.:\s]*([+\d][\d\s()\/.-]{6,})/i) || [])[1] || '',
    email: (contacts.match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    url: (contacts.match(/\b((?:https?:\/\/|www\.)[^\s,;)]+)/) || [])[1] || '',
  };
}).filter((r) => r.name && (r.area || r.email || r.phone));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries at a gutter on column ' + gutter + ', '
    + rows.filter((r) => r.languages.length).length + ' stating what they work in, '
    + rows.filter((r) => r.area).length + ' with an address');
  rows.slice(0, 12).forEach((r) => console.log('  ' + r.name.slice(0, 26).padEnd(28)
    + (r.languages.join(',') || '-').padEnd(9) + r.area.slice(0, 52)));
  if (unknownLangs.size) console.log('  words in a language line this lexicon does not hold: ' + [...unknownLangs].join(' | '));
}
