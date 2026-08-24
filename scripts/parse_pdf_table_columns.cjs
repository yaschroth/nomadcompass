/**
 * Reads a provider list set as a real table, by asking pdftotext to treat it as one.
 *
 * The Swedish missions publish theirs as three columns, NAMN | ADRESS | TEL/FAX/EPOST/WEBBPLATS,
 * and every other reader here got them wrong in the same expensive way. The default extraction
 * returns the columns in reading order, which looks perfect and is not: one run of it put Jurgen
 * Busch and Nils Gruske at Truls Hebrant's postcode, because the three entries' lines arrived
 * interleaved. -layout keeps the columns apart but not aligned to each other, because the
 * typesetter let each column flow on its own, so the first address block begins two lines above the
 * name it belongs to and zipping the streams drifts after five entries.
 *
 * The fix was not a cleverer reader. It was the right flag: this is Xpdf's pdftotext, which has
 * -table, "similar to -layout, but optimized for tables", and with it every entry's name, office
 * and telephone land on one line. Busch comes out at Kurfurstendamm 29 and Gruske at kallan, which
 * is where they are.
 *
 * There is still no gutter to cut the page at. A long practice-area line crosses into the address
 * column on some line of every page, so no character position is blank throughout. What is stable
 * is where cells START: splitting each line on runs of two or more spaces and counting the start
 * offsets over the whole document gives three tight clusters, at 0, at 35-39 and at 66-70 for this
 * file, and a cell belongs to whichever cluster it starts nearest. That never cuts a word in half,
 * which fixed-offset slicing does.
 *
 * An entry begins where the first column holds a name and the line under it states a role. It runs
 * to the next such line, and everything in the other two columns between those points is that
 * entry's office and contact details. A person can appear twice: Truls Hebrant keeps an office in
 * Berlin and another in Karlsruhe, and both are real.
 *
 * Usage: node scripts/parse_pdf_table_columns.cjs <file.pdf> [--json]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_pdf_table_columns.cjs <file.pdf> [--json]'); process.exit(2); }

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'tablecols-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try {
    execFileSync('pdftotext', ['-table', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error('pdftotext could not read this file, or does not support -table');
    process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));

// Every run of non-space text, with where it starts.
const cellsOf = (l) => {
  const out = [];
  const re = /\S(?:.*?\S)?(?=\s{2,}|$)/g;
  let m;
  while ((m = re.exec(l))) out.push({ at: m.index, text: m[0].trim() });
  return out;
};

/**
 * The columns, from where cells start rather than from where the page is blank.
 *
 * Offsets are counted over the whole document and grouped: any two within six characters of each
 * other are the same column, because a column's cells do not all start on the same character. A
 * column has to hold several cells to count, or one stray indent becomes a fourth column.
 */
const columnEdges = () => {
  const hist = {};
  lines.forEach((l) => cellsOf(l).forEach((c) => { hist[c.at] = (hist[c.at] || 0) + 1; }));
  const offsets = Object.keys(hist).map(Number).sort((a, b) => a - b);
  const groups = [];
  offsets.forEach((o) => {
    const last = groups[groups.length - 1];
    if (last && o - last.to <= 6) { last.to = o; last.n += hist[o]; } else groups.push({ from: o, to: o, n: hist[o] });
  });
  const real = groups.filter((g) => g.n >= 4);
  // The boundary between two columns sits halfway between where one ends and the next begins.
  const edges = [];
  for (let i = 1; i < real.length; i += 1) edges.push(Math.round((real[i - 1].to + real[i].from) / 2));
  return { edges, groups: real };
};

const { edges, groups } = columnEdges();
const colOf = (at) => { let c = 0; while (c < edges.length && at >= edges[c]) c += 1; return c; };
const NCOL = groups.length;

const rowsOfCols = lines.map((l) => {
  const cols = new Array(Math.max(NCOL, 1)).fill('');
  cellsOf(l).forEach((c) => { const i = Math.min(colOf(c.at), cols.length - 1); cols[i] = (cols[i] ? cols[i] + ' ' : '') + c.text; });
  return cols;
});

const CITY_HEAD = /^[A-ZÄÖÜÅÉ][A-ZÄÖÜÅÉ '.-]{2,}$/;
const ROLE = /^(Rechtsanw|Rechtanw|Advokat|advokat|Fachanw|Notar|Attorney|Avocat|Abogad|Avvocat|Lawyer|Solicitor|Barrister|Steuerberat|Tolk|Translat)/;
const HEADER = /^(NAMN|NAME|ADRESS|ADDRESS|TEL)\b/i;

/**
 * A qualification on its own line is the rest of the name above it, not a name of its own.
 *
 * "Dr. Thomas Kaiser-Stockmann" is followed by "LL.M." and only then by his role, so looking for the
 * role on the very next line missed him and found "LL.M." instead, which then took his office at
 * Grafestr. 74 and pushed the next man onto a firm that is not his. Two entries wrong from one line.
 */
const CONTINUES_NAME = /^(LL\.? ?[MB]\.?|M\.?A\.?|MBA|EMBA|Ph\.?D\.?|Dipl\.-?\w*|Mag\.|\([A-Z][a-zA-Z]+\))[.,]?$/;

// Where each entry starts: a name in the first column with a role stated under it.
const startsAt = [];
const nameSpan = {};
for (let i = 0; i < rowsOfCols.length; i += 1) {
  const own = rowsOfCols[i][0];
  if (!own || HEADER.test(own) || ROLE.test(own) || CONTINUES_NAME.test(own)) continue;
  if (CITY_HEAD.test(own) && !rowsOfCols[i].slice(1).some(Boolean)) continue;
  if (/^[(a-zäöüå]/.test(own)) continue;
  let j = i + 1;
  const carried = [];
  while (j < rowsOfCols.length && (!rowsOfCols[j][0] || (CONTINUES_NAME.test(rowsOfCols[j][0]) && carried.length < 2))) {
    if (rowsOfCols[j][0]) carried.push(rowsOfCols[j][0]);
    j += 1;
  }
  if (j < rowsOfCols.length && ROLE.test(rowsOfCols[j][0])) { startsAt.push(i); nameSpan[i] = carried; }
}

// The city each entry sits under, taken from the last heading above it.
const cityAt = [];
let city = '';
for (let i = 0; i < rowsOfCols.length; i += 1) {
  const own = rowsOfCols[i][0];
  if (own && CITY_HEAD.test(own) && !HEADER.test(own) && !rowsOfCols[i].slice(1).some(Boolean)) city = own;
  cityAt[i] = city;
}

const rows = [];
startsAt.forEach((from, n) => {
  const to = n + 1 < startsAt.length ? startsAt[n + 1] : rowsOfCols.length;
  const own = [];
  const office = [];
  const contact = [];
  for (let i = from; i < to; i += 1) {
    const c = rowsOfCols[i];
    if (c[0] && !HEADER.test(c[0]) && !(CITY_HEAD.test(c[0]) && !c.slice(1).some(Boolean))) own.push(c[0]);
    if (c[1] && !HEADER.test(c[1])) office.push(c[1]);
    if (c[2] && !HEADER.test(c[2])) contact.push(c[2]);
  }
  let name = own.shift() || '';
  (nameSpan[from] || []).forEach((extra) => {
    name += ' ' + extra;
    const at = own.indexOf(extra);
    if (at >= 0) own.splice(at, 1);
  });
  name = name.replace(/\s+/g, ' ').trim();
  const said = own.join(' ');
  const paren = (said.match(/\(([^)]*)\)/g) || []).join(' ');
  const all = contact.join(' ');
  rows.push({
    name,
    role: said.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
    languages: L.readLanguages(paren || said),
    languageLine: paren.replace(/[()]/g, '').replace(/\s+/g, ' ').trim(),
    area: office.join(', ').replace(/\s{2,}/g, ' ').trim(),
    /**
     * The heading a person is listed under, reported and deliberately kept out of the address.
     *
     * The ingest places a row by what its address names, and it reads `detail` as part of that
     * address. Putting the heading there let the heading do the placing, which is the one thing that
     * rule exists to prevent: the Swedish list files Insa-Marie Lohse-Chonewicz under HAMBURG and her
     * office is on Bahnhofstr. 5 in 24558 Henstedt-Ulzburg, 25 km outside it, and she went in as a
     * Hamburg lawyer on the strength of the heading alone. The heading is the mission's own grouping
     * and worth seeing; it is not evidence of where somebody works.
     */
    listedUnder: cityAt[from],
    phone: (all.match(/(?:Tel|Telefon)\.?[:\s]*([+(\d][\d\s()/+-]{6,})/i) || [, ''])[1].trim(),
    email: (all.match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [''])[0],
    url: (all.match(/(?:www\.[^\s]+|https?:\/\/[^\s]+)/i) || [''])[0],
  });
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log('columns at ' + groups.map((g) => g.from + '-' + g.to).join(', ') + '; boundaries ' + edges.join(', '));
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 26).padEnd(28) + (r.languages.join(',') || '-').padEnd(13)
    + String(r.listedUnder).slice(0, 11).padEnd(13) + r.area.slice(0, 56)));
  console.log('\n' + rows.length + ' rows, ' + rows.filter((r) => r.languages.length).length + ' with a language of their own, '
    + rows.filter((r) => r.area).length + ' with an address');
}
