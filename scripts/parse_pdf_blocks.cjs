/**
 * Reads a provider list from a PDF that is written as blocks rather than as a grid.
 *
 * Most consular PDFs are not tables. They are runs of little blocks: a name, then the street, then
 * the postcode and town, then the phone, with a blank line between one entry and the next, and a
 * centred heading every so often naming a region or a profession. Vienna's translators, Athens's
 * attorneys and Berlin's translators are all this shape and none of them could be read here.
 *
 * Two things make it work. Blocks are separated by blank lines, which pdftotext preserves. And some
 * of these pages are set in two columns, which pdftotext keeps as two blocks of text side by side
 * on the same line: with --columns the line is cut at its widest gap first, so the left column is
 * read to the end before the right one starts, instead of every entry being glued to its neighbour.
 *
 * Usage:
 *   node scripts/parse_pdf_blocks.cjs <file.pdf> [--columns] [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_pdf_blocks.cjs <file.pdf> [--columns] [--json]'); process.exit(2); }
const COLUMNS = process.argv.includes('--columns');

let text = '';
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'blocks-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try {
    execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error('pdftotext could not read this file');
    process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

let lines = text.split(/\r?\n/).map((l) => l.replace(/\f/g, '').trimEnd());

if (COLUMNS) {
  // Two columns, read one after the other rather than across. The cut is the widest run of spaces
  // on the line, which is where the gap between the columns is.
  const left = [];
  const right = [];
  lines.forEach((l) => {
    if (l.trim().length < 3) { left.push(''); right.push(''); return; }
    const gaps = [...l.matchAll(/ {4,}/g)].filter((m) => m.index > 15);
    const widest = gaps.sort((a, b) => b[0].length - a[0].length)[0];
    if (!widest) { left.push(l); right.push(''); return; }
    left.push(l.slice(0, widest.index).trimEnd());
    right.push(l.slice(widest.index + widest[0].length).trimEnd());
  });
  lines = left.concat(['', ''], right);
}

// A line that repeats on most pages is furniture.
const seen = {};
lines.forEach((l) => { const k = l.trim(); if (k) seen[k] = (seen[k] || 0) + 1; });
const FURNITURE = /^(seite|page|pagina|strona)\s*\d|^\d+\s*(von|of|di|z)\s*\d+$|^stan na:|^stand[: ]|^aggiornat|^mise à jour|^last updated/i;

// A heading is a short line with no contact detail in it, often centred or in capitals.
const looksLikeHeading = (l) => {
  const t = l.trim();
  if (!t || t.length > 60) return false;
  if (/\d{3}|@|www\.|tel|fax|str\.|straße|strasse|ulica|via |rue /i.test(t)) return false;
  // A surname-first name is mostly capitals too: "CLEMENTSCHITSCH Guenther, Dr." was being read as
  // a section heading and its entry lost. A heading does not carry a comma, and a line of dots is a
  // table of contents rather than a section.
  if (t.includes(',') || /\.{3,}|…/.test(t)) return false;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 3) return false;
  const upper = t.replace(/[^A-ZÀ-Þ]/g, '').length;
  return upper / letters.length > 0.7 || /:$/.test(t);
};

const blocks = [];
let current = [];
let heading = '';
const flush = () => {
  if (current.length) blocks.push({ heading, lines: current.slice() });
  current = [];
};
for (const raw of lines) {
  const l = raw.trim();
  if (!l) { flush(); continue; }
  if (FURNITURE.test(l) || (seen[l] >= 3 && l.length > 15)) continue;
  if (looksLikeHeading(l)) { flush(); heading = l.replace(/:$/, '').trim(); continue; }
  current.push(l);
}
flush();

/**
 * A block that opens with a bullet belongs to the entry above it.
 *
 * Sweden's Indian list sets each firm as a block and then its notes as bullets after a blank line,
 * and a blank line is what ends an entry here, so the one thing worth having ended up in a block of
 * its own: "All our staff and lawyers speak fluent English", "The firm has English and Hindi
 * speaking staff". Sixteen such blocks, every one separated from the firm it describes. Only a block
 * that STARTS with a bullet moves, and only onto a block that exists, so a page that begins with one
 * is left where it is rather than attached to nothing.
 */
const OPENS_WITH_BULLET = /^[•·▪‣]\s*\S/;
for (let i = blocks.length - 1; i > 0; i -= 1) {
  if (!OPENS_WITH_BULLET.test(blocks[i].lines[0] || '')) continue;
  if (blocks[i - 1].heading !== blocks[i].heading) continue;
  blocks[i - 1].lines = blocks[i - 1].lines.concat(blocks[i].lines);
  blocks.splice(i, 1);
}

const CONTACT = /\b(tel|telefon|telefono|phone|fax|mobil|cell|e-?mail|www\.|http)\b/i;
const rows = blocks.filter((b) => b.lines.length >= 2).map((b) => {
  const joined = b.lines.join(' ');
  // The address and the phone are often one line: "Au 190, 2880 KIRCHBERG, tel: ..., e-mail: ...".
  // Dropping any line that mentions a phone therefore dropped the address with it, and every Vienna
  // entry came back with nowhere to go.
  // A bullet is a note about the firm, not part of where it is. They are merged into the entry
  // above so their language claim can be read, and they have no business in the address.
  const address = b.lines.slice(1).filter((l) => !OPENS_WITH_BULLET.test(l))
    .map((l) => l.split(/\b(?:tel|telefon|telefono|phone|fax|mobil|cell|e-?mail|www\.|http)\b/i)[0].replace(/[,;\s]+$/, ''))
    .filter(Boolean).join(', ');
  return {
    heading: b.heading,
    // The heading is what says what these people are, and the ingest reads specialty rather than
    // heading. Without it the three Sydney GPs arrived with only a surname to categorise and were
    // refused as uncategorised, while their section was headed MEDICI GENERICI all along.
    specialty: b.heading,
    name: b.lines[0].replace(/[,;]\s*$/, ''),
    area: address.slice(0, 140),
    postcode: (joined.match(/\b(\d{4,5}(?:-\d{3})?)\b/) || [])[1] || '',
    phone: (joined.match(/(?:tel|telefon|phone)[.:\s]*([+\d][\d\s()\/.-]{6,})/i) || [])[1] || '',
    email: (joined.match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    // A block may say what its people speak in a sentence rather than a list: Sweden's Indian list
    // writes "The firm has English and Hindi speaking staff" in a bullet under the address. Only a
    // sentence carrying a speaking verb is read, so a practice area that mentions English law is
    // not mistaken for a claim about the staff.
    languages: L.readLanguagesProse(joined),
    url: (joined.match(/\b((?:https?:\/\/|www\.)[^\s,;)]+)/) || [])[1] || '',
    lines: b.lines,
  };
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' blocks with two lines or more, ' + rows.filter((r) => r.postcode).length
    + ' with a postcode, ' + rows.filter((r) => r.email).length + ' with an e-mail');
  const by = {};
  rows.forEach((r) => { by[r.heading] = (by[r.heading] || 0) + 1; });
  Object.entries(by).slice(0, 10).forEach(([h, n]) => console.log('   ' + String(n).padStart(3) + '  ' + (h || '(no heading)').slice(0, 46)));
  rows.slice(0, 6).forEach((r) => console.log('  e.g. ' + r.name.slice(0, 34).padEnd(36) + r.area.slice(0, 52)));
}
