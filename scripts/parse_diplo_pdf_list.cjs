/**
 * Reads a German mission's list that is published as a two-column PDF.
 *
 * The Barcelona consulate's "Auswahl deutschsprachiger Aerzte" puts the name, the practice and the
 * address down the left of the page and the specialty, the phone, the e-mail and, on some entries,
 * a "Sprachen:" line down the right. pdftotext -layout keeps that geometry as spacing, so the two
 * columns can be split apart again by finding the gap they share, rather than by guessing a fixed
 * offset that the next mission would break.
 *
 * The languages are the reason to bother. The list is roster-level German by its own title, and
 * about a third of its entries also state their languages one by one, which is a stronger claim
 * about that entry than the title can make about anyone.
 *
 * Usage: node scripts/parse_diplo_pdf_list.cjs <file.pdf|file.txt> [--json]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_pdf_list.cjs <file.pdf|file.txt> [--json]'); process.exit(2); }

let text;
if (/\.pdf$/i.test(file)) {
  const out = path.join(os.tmpdir(), 'diplo-' + path.basename(file).replace(/\W+/g, '') + '.txt');
  try {
    execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error('pdftotext could not read this file: ' + String(e.stderr || e).slice(0, 200));
    process.exit(1);
  }
  text = fs.readFileSync(out, 'utf8');
} else {
  text = fs.readFileSync(file, 'utf8');
}

const lines = text.split(/\r?\n/);

/**
 * Where the right-hand column starts, measured rather than assumed: for every run of three or more
 * spaces inside a line, the position after it is a candidate, and the position that occurs on most
 * lines is the gutter. A mission that lays its page out differently gets a different number, and one
 * with no second column at all gets none.
 */
const gutter = (() => {
  const votes = {};
  lines.forEach((l) => {
    if (l.trim().length < 20) return;
    for (const m of l.matchAll(/ {3,}(?=\S)/g)) {
      const at = m.index + m[0].length;
      if (at > 20 && at < 110) votes[at] = (votes[at] || 0) + 1;
    }
  });
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 8 ? Number(best[0]) : 0;
})();

// A line that repeats on every page is furniture, not content.
const seen = {};
lines.forEach((l) => { const k = l.trim(); if (k) seen[k] = (seen[k] || 0) + 1; });
const FURNITURE = /^(Seite \d+ von \d+|-+|\s*)$|alle Angaben sind ohne Gew|Auswahl deutschsprachiger|Amtsbezirk des Generalkonsulats|^Stand[: ]|Haftungsausschluss/i;
const isFurniture = (l) => FURNITURE.test(l.trim()) || (seen[l.trim()] >= 3 && l.trim().length > 12);

const HEADING = /^(Fachrichtung|Fachgebiet|Fachaerzte|Fach[äa]rzte f[üu]r)\s+(.+)$/i;
const LANGS = {
  deutsch: 'de', englisch: 'en', spanisch: 'es', franz: 'fr', italienisch: 'it', katalanisch: 'ca',
  portugiesisch: 'pt', niederl: 'nl', russisch: 'ru', schwedisch: 'sv', d: null,
};
const readLanguages = (s) => {
  const out = [];
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .split(/[,;/|]+|\bund\b/).map((p) => p.trim()).filter(Boolean)
    .forEach((p) => {
      const hit = Object.keys(LANGS).find((k) => LANGS[k] && p.startsWith(k));
      if (hit && !out.includes(LANGS[hit])) out.push(LANGS[hit]);
    });
  return out;
};

// A person, not a practice. The practice sits on the line under the name, and treating a clinic
// name as a new entry cut every doctor who has one in half: "Dr. Michael Holder" and then
// "Clinica Els Poblets" as if the clinic were a second doctor.
const NAME_START = /^(Dr\.|Dra\.|Prof\.|Dipl\.[-\w]*|Herr|Frau|Sra?\.)\s+[A-ZÄÖÜÁÉÍÓÚ]|^[A-ZÄÖÜÁÉÍÓÚ][a-zäöüáéíóúñ'-]+\s+[A-ZÄÖÜÁÉÍÓÚ]{3,}\b/;

let specialty = '';
const rows = [];
let block = null;
const flush = () => {
  if (!block || !block.left.length) { block = null; return; }
  const left = block.left;
  const right = block.right.join(' ').replace(/\s+/g, ' ').trim();
  const name = left[0].replace(/\s+/g, ' ').trim();
  if (!NAME_START.test(name) || name.length < 5 || name.length > 70) { block = null; return; }
  const addr = left.slice(1).join(', ').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^,\s*|,\s*$/g, '');
  const langLine = (right.match(/Sprachen?\s*:?\s*([^.]{2,60})/i) || [])[1] || '';
  rows.push({
    specialty,
    name,
    area: addr.slice(0, 120),
    postcode: (addr.match(/\b(\d{5})\b/) || [])[1] || '',
    languages: readLanguages(langLine),
    languageLine: langLine.trim(),
    url: (right.match(/\b((?:https?:\/\/|www\.)[^\s,)]+)/) || [])[1] || '',
    phone: (right.match(/(?:Tel\.?|T)\s*:?\s*([0-9 ().+-]{7,})/i) || [])[1] || '',
    detail: right.slice(0, 200),
  });
  block = null;
};

for (const raw of lines) {
  if (isFurniture(raw)) { if (!raw.trim()) flush(); continue; }
  // The gutter moves from page to page, so it is found per line instead: the first run of four
  // or more spaces past column 20 is where the right-hand column begins on THAT line. Slicing every
  // page at one measured offset put half of 'Hotelbesuche' into a doctor's name.
  const cut = (() => {
    const m = raw.slice(20).match(/ {4,}(?=\S)/);
    return m ? 20 + m.index + m[0].length : 0;
  })();
  const leftPart = cut ? raw.slice(0, cut).trimEnd() : raw;
  const rightPart = cut ? raw.slice(cut).trim() : '';

  const head = leftPart.trim().match(HEADING) || raw.trim().match(HEADING);
  if (head) { flush(); specialty = head[2].replace(/\s+/g, ' ').trim(); continue; }

  if (!leftPart.trim() && !rightPart) { flush(); continue; }
  if (leftPart.trim() && NAME_START.test(leftPart.trim()) && block && block.left.length) {
    // A new name in the left column starts a new entry even without a blank line between them.
    const looksLikeAddress = /^\d|\bCarrer\b|\bCalle\b|\bC\/|\bAv\b|\bPasseig\b|\bRonda\b|\bPlaza\b|\bPza\b/i.test(leftPart.trim());
    if (!looksLikeAddress) flush();
  }
  block = block || { left: [], right: [] };
  if (leftPart.trim()) block.left.push(leftPart.trim());
  if (rightPart) block.right.push(rightPart);
}
flush();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, gutter }, null, 2));
} else {
  console.log(rows.length + ' entries (column gutter at ' + (gutter || 'none found') + '), '
    + rows.filter((r) => r.languages.length).length + ' stating their own languages, '
    + rows.filter((r) => r.postcode).length + ' with a postcode');
  const by = {};
  rows.forEach((r) => { by[r.specialty] = (by[r.specialty] || 0) + 1; });
  Object.entries(by).forEach(([s, n]) => console.log('   ' + String(n).padStart(3) + '  ' + (s || '(no heading yet)').slice(0, 46)));
  rows.slice(0, 8).forEach((r) => console.log('  e.g. ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(12) + r.postcode.padEnd(7) + r.area.slice(0, 40)));
}
