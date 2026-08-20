/**
 * Reads a provider list published as an XLSX spreadsheet.
 *
 * Two consular lists are spreadsheets rather than pages: the French embassy in Budapest publishes
 * its doctors with a "LANGUE(S) PARLEE(S)" column, and the Italian embassy there publishes Italian-
 * speaking lawyers. Between them they hold about 375 providers for one city, and no reader here
 * could open either.
 *
 * An XLSX is a zip. The strings live once in xl/sharedStrings.xml and the sheet refers to them by
 * index, so both have to be read and joined. That is the whole trick, and it needs no library.
 *
 * The header row is given rather than guessed, because these files put it at row 9 and row 2 and a
 * parser that hunts for it will eventually pick a merged band title instead.
 *
 * Usage:
 *   node scripts/parse_xlsx_list.cjs <file.xlsx> --header-row 9 [--json]
 *   node scripts/parse_xlsx_list.cjs <file.xlsx> --raw          # what is in it, to find the header
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_xlsx_list.cjs <file.xlsx> --header-row N [--json]'); process.exit(2); }
const at = process.argv.indexOf('--header-row');
const HEADER_ROW = at > 0 ? Number(process.argv[at + 1]) : 1;
const RAW = process.argv.includes('--raw');

const unzip = (member) => {
  try {
    return execFileSync('unzip', ['-p', file, member], { encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (e) { return ''; }
};

const unescape = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

// Shared strings, in order. A string can be split across several <t> runs when part of it is
// styled, and joining them is the difference between "Dr." and the whole name.
const shared = [...unzip('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
  .map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unescape(t[1])).join(''));

const sheetName = (() => {
  const names = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).split(/\r?\n/)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
  return names[0] || 'xl/worksheets/sheet1.xml';
})();
const sheet = unzip(sheetName);

const colOf = (ref) => (ref.match(/^([A-Z]+)/) || ['', ''])[1];
const rows = {};
for (const m of sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
  const n = Number(m[1]);
  const cells = {};
  for (const c of m[2].matchAll(/<c[^>]*r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const type = (c[2].match(/t="([^"]+)"/) || [])[1] || '';
    const inner = c[3];
    let value = '';
    if (type === 's') {
      const i = Number((inner.match(/<v>(\d+)<\/v>/) || [])[1]);
      value = shared[i] || '';
    } else if (type === 'inlineStr') {
      value = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unescape(t[1])).join('');
    } else {
      value = unescape((inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || '');
    }
    cells[colOf(c[1])] = value.replace(/\s+/g, ' ').trim();
  }
  rows[n] = cells;
}

const numbers = Object.keys(rows).map(Number).sort((a, b) => a - b);
if (RAW) {
  console.log(sheetName + ', ' + numbers.length + ' rows with content, ' + shared.length + ' shared strings');
  numbers.slice(0, 14).forEach((n) => {
    const c = rows[n];
    console.log('  row ' + String(n).padStart(3) + ': ' + Object.keys(c).sort().map((k) => k + '=' + c[k].slice(0, 26)).join(' | ').slice(0, 190));
  });
  process.exit(0);
}

const header = rows[HEADER_ROW] || {};
const columns = Object.keys(header).filter((k) => header[k]);
const out = [];
numbers.filter((n) => n > HEADER_ROW).forEach((n) => {
  const c = rows[n];
  if (!Object.values(c).some((v) => v)) return;
  const row = {};
  columns.forEach((k) => { row[header[k]] = c[k] || ''; });
  // A row where only one cell is filled is a band title, not a provider: these sheets separate
  // their sections with a merged strip carrying a heading.
  row._filled = Object.values(row).filter(Boolean).length;
  row._rowNumber = n;
  out.push(row);
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ file, sheet: sheetName, header, rows: out }, null, 1));
} else {
  console.log(out.length + ' rows under the header at row ' + HEADER_ROW);
  console.log('  columns: ' + columns.map((k) => k + '=' + header[k]).join(' | '));
  console.log('  band or empty rows (one cell only): ' + out.filter((r) => r._filled <= 1).length);
  out.filter((r) => r._filled > 1).slice(0, 6).forEach((r) => console.log('  e.g. '
    + Object.entries(r).filter(([k]) => !k.startsWith('_')).map(([k, v]) => v).filter(Boolean).join(' | ').slice(0, 150)));
}
