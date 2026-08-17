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
 * Handles classic `N 0 obj` files and the newer form where most objects are packed into
 * compressed object streams (/ObjStm). Streams themselves are never inside an ObjStm, so the
 * font programs and content stay where they are; only the dictionaries move, which is why this
 * needs unpacking at all: the /ToUnicode references live in them.
 *
 * When it cannot do the job it says so and exits rather than emitting mush.
 *
 * Usage: node scripts/pdf_text.cjs <file.pdf>
 */

// KNOWN GAP, isolated 2026-08-17. Two consular PDFs still come out as noise, the German
// consulate list for Shanghai and the French embassy list of francophone doctors in Portugal.
// The cause is now known rather than guessed: their ToUnicode tables ARE found and read (the
// French file has 289 glyph mappings across eight fonts), but their fonts are Identity-H, whose
// CMap declares a two-byte codespace, <0000> <FFFF>. The decoder below reads text codes one byte
// at a time, so every lookup misses and the output is rubbish that the final check then refuses.
//
// Attempted and reverted on the same day: hex strings turn out to be read in two-byte units
// already, so the remaining suspect was the literal ( ) branch, which passes its bytes through
// without ever consulting the table. Sending those through the CMap in pairs when the font uses
// two-byte codes did not open either file, and cost five lines of correctly decoded text in the
// Australia list, so it went back. Whatever these two files do is not that.
//
// Also tried and fixed, and it did not open them either: a page's /Font mapping is local to that
// page, and this file maps /F1 to object 11 on one page and 19 on the next, so a global "first
// table wins" decodes later pages with the wrong subset. Each page's own map is now used,
// following /Contents arrays and indirect /Resources, both of which that file uses.
//
// So four plausible causes have been tried. Whatever remains is further down than the font wiring,
// and the next attempt should print one decoded run beside the glyph ids it was handed rather than
// keep fixing things that look likely. This matters because these are the non-English sources:
// 95% of this directory's 2,637 rows carry English and 2,126 come from two British sources.
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/pdf_text.cjs <file.pdf>'); process.exit(2); }
const buf = fs.readFileSync(file);
const raw = buf.toString('latin1');

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
  // Not every stream is compressed. The French embassy's Portugal list stores its ToUnicode CMaps
  // as << /Length 338 >> with no /Filter at all, so inflating them fails with "incorrect header
  // check" and this returned null, which is why a file with eight readable tables produced none.
  const head = raw.slice(o.start, s);
  if (!/\/Filter/.test(head)) return buf.subarray(a, b).toString('latin1');
  try { return zlib.inflateSync(buf.subarray(a, b)).toString('latin1'); } catch (e) { return null; }
}

// Objects unpacked out of /ObjStm containers. A container holds N objects; the first /First
// bytes are pairs of "objectNumber byteOffset", then the objects themselves back to back.
const packed = new Map();
for (const [num, o] of objects) {
  const end = raw.indexOf('endobj', o.start);
  const head = raw.slice(o.start, end === -1 ? o.start + 2000 : end);
  if (!/\/Type\s*\/ObjStm/.test(head)) continue;
  const body = streamOf(num);
  if (!body) continue;
  const n = Number((head.match(/\/N\s+(\d+)/) || [])[1]);
  const first = Number((head.match(/\/First\s+(\d+)/) || [])[1]);
  if (!n || !Number.isFinite(first)) continue;
  const nums = body.slice(0, first).trim().split(/\s+/).map(Number);
  for (let i = 0; i < n; i++) {
    const objNum = nums[i * 2];
    const off = nums[i * 2 + 1];
    const nextOff = i + 1 < n ? nums[i * 2 + 3] : body.length - first;
    if (!Number.isFinite(objNum) || !Number.isFinite(off)) continue;
    packed.set(objNum, body.slice(first + off, first + nextOff));
  }
}

function dictOf(num) {
  const o = objects.get(num);
  if (o) {
    const end = raw.indexOf('endobj', o.start);
    return raw.slice(o.start, end === -1 ? o.start + 4000 : end);
  }
  return packed.get(num) || '';
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
// Font dictionaries live in the file directly in older PDFs and inside the unpacked object
// streams in newer ones, so both are searched.
const haystack = raw + String.fromCharCode(10) + [...packed.values()].join(String.fromCharCode(10));
// Two ways a page names its fonts, and only handling the first is why the French embassy's list of
// francophone doctors in Portugal, and the German consulates' lists for Shanghai and Madrid, all
// came out as noise. They write the resource as an indirect reference, /Font 12 0 R, so the inline
// pattern below never matches and not one ToUnicode table is found, in files that carry them.
const fontDicts = [];
const inlineRe = /\/Font\s*<<([^>]*)>>/g;
while ((m = inlineRe.exec(haystack))) fontDicts.push(m[1]);
const indirectRe = /\/Font\s+(\d+) 0 R/g;
while ((m = indirectRe.exec(haystack))) fontDicts.push(dictOf(Number(m[1])));

for (const dict of fontDicts) {
  const pairs = dict.match(/\/(\w+)\s+(\d+) 0 R/g) || [];
  for (const p of pairs) {
    const x = p.match(/\/(\w+)\s+(\d+) 0 R/);
    const t = cmapOf(Number(x[2]));
    if (!t) continue;
    allTables.push(t);
    if (!byName.has(x[1])) byName.set(x[1], t);
  }
}

const lookup = (font, id, strict) => {
  if (font && font.has(id)) return font.get(id);
  // The fallback pool is for documents where the font could not be identified. When the page's own
  // resource dictionary told us exactly which font is selected, borrowing a glyph from a different
  // subset is not a rescue, it is an invention: in the French embassy's Portugal list, ids missing
  // from the selected font came back as letters from another one, and the wrong letters buried the
  // correctly decoded text under enough noise for the readability check to reject the whole file.
  if (strict) return '';
  for (const t of allTables) if (t.has(id)) return t.get(id);
  return '';
};

// Parsing the /Font dictionary is fragile: its value can hold a nested dictionary, so a pattern
// that stops at the first ">" truncates before reaching the /F1 5 0 R pairs. The French embassy's
// Portugal list has four such dictionaries and eight ToUnicode tables, and none were being read.
// So every object that carries a /ToUnicode is also taken directly into the fallback pool, which
// lookup() already consults for any id the named font does not define.
for (const num of objects.keys()) {
  if (!/\/ToUnicode\s+\d+ 0 R/.test(dictOf(num))) continue;
  const t = cmapOf(num);
  if (t && !allTables.includes(t)) allTables.push(t);
}

// No tables is not automatically a failure: a PDF whose fonts use a standard encoding stores its
// text as ordinary ( ) strings that need no mapping at all. Only hex strings are unreadable
// without a table, and those are skipped rather than guessed at. If nothing readable comes out,
// the check at the end says so.
if (!byName.size && !allTables.length) {
  console.error('note: no /ToUnicode tables in this file; only plain ( ) strings can be read.');
}

// ---- decode the content streams --------------------------------------------------------------
function unescapePdf(s) {
  return s
    .replace(/\\([nrtbf])/g, (x, c) => ({ n: '\n', r: '\r', t: '\t', b: '', f: '' }[c]))
    .replace(/\\([0-7]{1,3})/g, (x, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\(.)/g, '$1');
}

// Font names are per page, not per document. The French embassy's Portugal list maps /F1 to object
// 11 on its first page and to object 19 on its second, and letting the first table win globally
// decodes every later page with the wrong subset: plausible letters, wrong ones. So each page's
// own /Resources mapping is kept and used for that page's content stream.
const pageFonts = new Map();
for (const num of objects.keys()) {
  const d = dictOf(num);
  if (!/\/Type\s*\/Page\b/.test(d)) continue;
  // /Contents is a single reference or an array of them, and /Resources is usually its own object
  // rather than an inline dictionary, so both forms have to be followed.
  const cRaw = (d.match(/\/Contents\s*(\[[^\]]*\]|\d+ 0 R)/) || [])[1] || '';
  const contents = [...cRaw.matchAll(/(\d+) 0 R/g)].map((x) => Number(x[1]));
  const resRef = (d.match(/\/Resources\s+(\d+) 0 R/) || [])[1];
  const resDict = resRef ? dictOf(Number(resRef)) : d;
  const fontBlock = resDict.match(/\/Font\s*<<([^>]*)>>/);
  if (!contents.length || !fontBlock) continue;
  const map = new Map();
  for (const p of fontBlock[1].match(/\/(\w+)\s+(\d+) 0 R/g) || []) {
    const x = p.match(/\/(\w+)\s+(\d+) 0 R/);
    const t = cmapOf(Number(x[2]));
    if (t) map.set(x[1], t);
  }
  if (map.size) contents.forEach((cn) => pageFonts.set(cn, map));
}

let out = '';
for (const num of objects.keys()) {
  const c = streamOf(num);
  if (!c || !/(Tj|TJ)/.test(c)) continue;
  const pageMap = pageFonts.get(num) || byName;

  let font = null;
  // Split on the operators that end a text run, keeping line structure roughly intact.
  for (const part of c.split(/\bET\b|\bT\*\b|\bTd\b|\bTD\b/)) {
    const tf = [...part.matchAll(/\/(\w+)\s+[\d.]+\s+Tf/g)].pop();
    if (tf && pageMap.has(tf[1])) font = pageMap.get(tf[1]);

    let line = '';
    // Three token kinds matter: hex <..> for subset fonts, literal (..) for the rest, and the
    // kerning numbers inside a TJ array. Those numbers are how these files encode a space
    // between words; without reading them every line came back as onelongrunofwords.
    for (const tok of part.match(/<[0-9A-Fa-f]*>|\([^)]*\)|-?[\d.]+/g) || []) {
      if (tok[0] === '<') {
        const h = tok.slice(1, -1);
        for (let i = 0; i + 3 < h.length; i += 4) {
          line += lookup(font, parseInt(h.substr(i, 4), 16), pageFonts.has(num));
        }
      } else if (tok[0] === '(') {
        line += unescapePdf(tok.slice(1, -1));
      } else if (Number(tok) < -120 && !/\s$/.test(line) && line) {
        // A wide negative adjustment is a word gap. Small ones are ordinary kerning.
        line += ' ';
      }
    }
    // Some streams are not page content at all: embedded font programs contain the byte pairs
    // "Tj" and "TJ" by coincidence and decode to tens of thousands of NULs and control
    // characters. Dropping those here keeps the output clean and lets the check at the end mean
    // something: before this, 60,000 NULs from one font drowned the real text and the readability
    // guard rejected a page that had decoded perfectly.
    line = line.replace(/[ --]/g, '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    // Letters, not just "characters": a line of punctuation and spaces would pass any test
    // that counted those as readable, which is exactly what the undecodable Barcelona list
    // produces. Real prose in these documents runs about 75% letters.
    const letters = (line.match(/\p{L}/gu) || []).length;
    if (letters / line.length < 0.45) continue;
    out += line + '\n';
  }
}

// A PDF can hand back plenty of bytes that are not text: fonts with a private encoding and no
// /ToUnicode store glyph indices in ordinary ( ) strings, so the Barcelona consulate list decodes
// to "! \" \" # $ %" and so on. Emitting that would be worse than refusing, because it looks like
// content. Anything under two thirds letters, digits, spaces and ordinary punctuation is treated
// as undecoded.
// Counting letters is not enough. The German embassy Beijing list decodes to a stream of accented
// single characters that is exactly 45% letters, slips past a ratio test, and holds four real
// words in five hundred characters. What separates text from noise is whether the letters group
// into words, so the test is the share of the output sitting inside a run of three or more
// letters. They have to be ASCII letters: the noise is full of accented characters, which count
// as letters under p{L} and let the garbage pass. Real prose here is well above 50%.
const inWords = (out.match(/[A-Za-z]{3,}/g) || []).join('').length;
const ratio = out.length ? inWords / out.length : 0;
if (!out.trim() || ratio < 0.35) {
  console.error('Nothing readable came out of this PDF (' + Math.round(ratio * 100) + '% of it sits inside words).');
  console.error('Its fonts most likely use a private encoding with no /ToUnicode table. Find another');
  console.error('source rather than guessing at the contents.');
  process.exit(1);
}

process.stdout.write(out);
