/**
 * Extracts readable text from a PDF, with no dependencies.
 *
 * Written because consulates publish their lists of German-speaking, French-speaking and
 * English-speaking providers as PDFs, poppler is not installed here, and the alternative is to
 * take names off a search summary. This directory does not do that: it has already produced one
 * row for a business the cited article never named.
 *
 * The part that matters is the font handling. Text in these files is stored as subset-font
 * character ids, not as characters: in the Cape Town list the glyph id that prints "M" decodes
 * naively to "a", which is how "Dr Marcus Brauer" came out as "5r aarcus .rauer". Each font
 * carries its own /ToUnicode CMap, and a document mixes several. So this resolves /Fx -> font
 * object -> its CMap, follows the `Tf` operator through the content stream, and decodes each run
 * with the table of the font that was actually selected.
 *
 * Handles: classic `N 0 obj` files with FlateDecode streams, which is what these government PDFs
 * are. Does NOT handle cross-reference streams with compressed object streams (/ObjStm); it says
 * so rather than emitting mush.
 *
 * Usage: node scripts/pdf_text.cjs <file.pdf>
 */
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/pdf_text.cjs <file.pdf>'); process.exit(2); }
const buf = fs.readFileSync(file);
const raw = buf.toString('latin1');

if (/\/ObjStm/.test(raw)) {
  console.error('This PDF stores its objects in compressed object streams (/ObjStm), which this');
  console.error('extractor does not read. Do not guess at the contents: find another source.');
  process.exit(1);
}

// ---- objects ------------------------------------------------------------------------------
// Byte offsets, so a stream's bytes can be sliced out of the buffer rather than the latin1 copy.
const objects = new Map();
const objRe = /(\d+) 0 obj/g;
let m;
while ((m = objRe.exec(raw))) objects.set(Number(m[1]), { start: m.index, header: m[0] });

function streamOf(num) {
  const o = objects.get(num);
  if (!o) return null;
  const end = raw.indexOf('endobj', o.start);
  const s = raw.indexOf('stream', o.start);
  if (s === -1 || (end !== -1 && s > end)) return null;
  let a = s + 6;
  if (buf[a] === 0x0d) a++;
  if (buf[a] === 0x0a) a++;
  const b = raw.indexOf('endstream', a);
  if (b === -1) return null;
  try { return zlib.inflateSync(buf.subarray(a, b)).toString('latin1'); } catch (e) { return null; }
}

function dictOf(num) {
  const o = objects.get(num);
  if (!o) return '';
  const end = raw.indexOf('endobj', o.start);
  return raw.slice(o.start, end === -1 ? o.start + 4000 : end);
}

// ---- one ToUnicode table per font -----------------------------------------------------------
const hexToStr = (h) => {
  let s = '';
  for (let i = 0; i + 3 < h.length; i += 4) s += String.fromCharCode(parseInt(h.substr(i, 4), 16));
  return s;
};

function cmapOf(fontNum) {
  const d = dictOf(fontNum);
  const ref = d.match(/\/ToUnicode\s+(\d+) 0 R/);
  // A composite font keeps its ToUnicode on the parent, but its widths and encoding on a
  // descendant; the CMap we want is the parent's, so only that ref is followed.
  if (!ref) return null;
  const cm = streamOf(Number(ref[1]));
  if (!cm) return null;
  const table = new Map();
  let mm;
  const charRe = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((mm = charRe.exec(cm))) {
    const pairs = mm[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const p of pairs) {
      const x = p.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      table.set(parseInt(x[1], 16), hexToStr(x[2]));
    }
  }
  // bfrange has two destination forms and both appear in these files. Reading only the first one
  // is what lost every capital A and every space: this document maps them together as
  // <0003> <0004> [<0020> <0041>], the array form.
  const rangeRe = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((mm = rangeRe.exec(cm))) {
    const body = mm[1];
    const rowRe = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:\[([\s\S]*?)\]|<([0-9A-Fa-f]+)>)/g;
    let r;
    while ((r = rowRe.exec(body))) {
      const lo = parseInt(r[1], 16), hi = parseInt(r[2], 16);
      if (r[3] !== undefined) {
        const dsts = r[3].match(/<([0-9A-Fa-f]+)>/g) || [];
        for (let i = 0; i <= hi - lo && i < dsts.length; i++) {
          table.set(lo + i, hexToStr(dsts[i].slice(1, -1)));
        }
      } else {
        const base = parseInt(r[4], 16);
        for (let i = lo; i <= hi && i - lo < 65536; i++) table.set(i, String.fromCharCode(base + (i - lo)));
      }
    }
  }
  return table.size ? table : null;
}

// /F3 -> table, collected from every /Font << >> dict in the file. Two pages can map the same
// name to different font objects, so the first table wins for lookups and the rest are kept as a
// fallback pool: without it, one glyph missing from the winning table silently swallowed every
// capital A, turning "V&A Waterfront" into "V&Waterfront" and "Arbeitsmedizin" into
// "rbeitsmedizin". The fallback only fires for ids the selected font does not define, so it
// cannot reintroduce the wholesale mis-mapping that merging all tables together caused.
const byName = new Map();
const allTables = [];
const fontDictRe = /\/Font\s*<<([^>]*)>>/g;
while ((m = fontDictRe.exec(raw))) {
  const pairs = m[1].match(/\/(\w+)\s+(\d+) 0 R/g) || [];
  for (const p of pairs) {
    const x = p.match(/\/(\w+)\s+(\d+) 0 R/);
    const t = cmapOf(Number(x[2]));
    if (!t) continue;
    allTables.push(t);
    if (!byName.has(x[1])) byName.set(x[1], t);
  }
}

const lookup = (font, id) => {
  if (font && font.has(id)) return font.get(id);
  for (const t of allTables) if (t.has(id)) return t.get(id);
  return '';
};

if (!byName.size) {
  console.error('No /ToUnicode tables found. Without them the character ids cannot be turned into');
  console.error('text, and anything printed would be a guess. Find another source.');
  process.exit(1);
}

// ---- decode the content streams --------------------------------------------------------------
function unescapePdf(s) {
  return s
    .replace(/\\([nrtbf])/g, (x, c) => ({ n: '\n', r: '\r', t: '\t', b: '', f: '' }[c]))
    .replace(/\\([0-7]{1,3})/g, (x, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\(.)/g, '$1');
}

let out = '';
for (const num of objects.keys()) {
  const c = streamOf(num);
  if (!c || !/(Tj|TJ)/.test(c)) continue;

  let font = null;
  // Split on the operators that end a text run, keeping line structure roughly intact.
  for (const part of c.split(/\bET\b|\bT\*\b|\bTd\b|\bTD\b/)) {
    const tf = [...part.matchAll(/\/(\w+)\s+[\d.]+\s+Tf/g)].pop();
    if (tf && byName.has(tf[1])) font = byName.get(tf[1]);

    let line = '';
    // Three token kinds matter: hex <..> for subset fonts, literal (..) for the rest, and the
    // kerning numbers inside a TJ array. Those numbers are how these files encode a space
    // between words; without reading them every line came back as onelongrunofwords.
    for (const tok of part.match(/<[0-9A-Fa-f]*>|\([^)]*\)|-?[\d.]+/g) || []) {
      if (tok[0] === '<') {
        const h = tok.slice(1, -1);
        for (let i = 0; i + 3 < h.length; i += 4) {
          line += lookup(font, parseInt(h.substr(i, 4), 16));
        }
      } else if (tok[0] === '(') {
        line += unescapePdf(tok.slice(1, -1));
      } else if (Number(tok) < -120 && !/\s$/.test(line) && line) {
        // A wide negative adjustment is a word gap. Small ones are ordinary kerning.
        line += ' ';
      }
    }
    line = line.replace(/\s+/g, ' ').trim();
    if (line) out += line + '\n';
  }
}

process.stdout.write(out);
