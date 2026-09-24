/**
 * Reads provider lists whose columns only exist as positions on the page.
 *
 * WHY THIS READER
 *
 * Every other PDF reader here works from pdftotext's TEXT: -raw gives the content stream order,
 * -layout pads it into a monospaced grid, -table tries harder at the same grid. Fourteen embassy
 * lists defeated all three, each the same way underneath: a table whose cells are set on their own,
 * vertically centred, wrapped at different line counts, or split into sub-cells, so that a line of
 * text on the page is not a line of any record. What was lost is where each word sits. Three
 * examples of what that did:
 *   - U.S. Embassy Santo Domingo: the "Lang." cell is centred in its row, so "English," lands on the
 *     line of one doctor and "Spanish" on the next doctor's, and every text reading paired languages
 *     with the wrong people.
 *   - German Embassy Rabat: the language column (D, F, E, S) runs straight into the practice-area
 *     column, which uses the same letters (F = Familienrecht), so "F, E, S H, Inv," cannot be split
 *     into languages and specialties from the text alone. By x position it splits cleanly at 439pt.
 *   - U.S. Embassy Abu Dhabi: one firm per page as a form, the label in one cell and its value
 *     centred in the next, so "Languages Spoken:" and "English-extensive / Arabic, Urdu, French" are
 *     three lines apart in any reading.
 * With coordinates each of these is ordinary: a word belongs to the column its left edge is in, and
 * to the row between the two ruling lines around it.
 *
 * WHERE THE COORDINATES COME FROM
 *
 * The pdftotext on this machine is Xpdf 4.00, which has no -bbox or -bbox-layout (that is
 * Poppler's), and node_modules holds no pdf.js. PyMuPDF (python -c "import fitz") is installed, so
 * this script runs a short Python program through it that returns every word with its box, bold and
 * italic flags, and every ruling line (thin filled rectangles, stroked lines, and the edges of
 * stroked boxes) as JSON. The JSON is cached per file under --cache (default: the OS temp dir), so
 * the ingest calling this once per manifest entry does not re-extract the same PDF.
 *
 * A Word document needs no coordinates, because its table cells and paragraphs are explicit in
 * word/document.xml. The one .docx here (U.S. Embassy Ulaanbaatar) is read from that XML with its
 * drawing anchors removed: an inline picture's offset numbers ("033972500") were being read as
 * part of the clinic name by the older readers.
 *
 * THE RULES THIS READER KEEPS (the same ones as every reader in this directory)
 *   - A language is published only where the list states it for that entry, or where the list's own
 *     title states it for everybody (a roster, declared in the manifest, not here).
 *   - A hedge is not a claim: "Fair English", "etwas Deutsch", "(D) = Dolmetscher fuer D" (works
 *     through a German interpreter) are all dropped, and the rest of the line is kept.
 *   - A row is a provider. Program labels ("VA Foreign Medical Services"), section headings, column
 *     headers and the embassy's own address block are not, and are skipped here where the layout
 *     makes them recognisable; the ingest's name gates catch the rest.
 *   - Placement stays with the ingest. This reader reports the address as printed. The one thing it
 *     adds is the section's town where the list's own section heading names it and the address does
 *     not (Santo Domingo), and it says so in the layout's comment.
 *
 * Usage:
 *   node scripts/parse_pdf_positions.cjs <file> --layout <name> [--section <regex>] [--json]
 *       rows, the way scripts/ingest_verified_sources.cjs calls every parser (file first, --json last)
 *   node scripts/parse_pdf_positions.cjs words <file.pdf> [--page N]
 *       every line with the x position of each run, bold (B) and italic (I) marked, and the rules:
 *       the view to read before writing a layout, and the one to check a row against
 *   node scripts/parse_pdf_positions.cjs layouts
 *       the layouts this file knows and which list each was written for
 * Common flag: --cache <dir> for the extraction cache.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CACHE = path.resolve(val('--cache', path.join(os.tmpdir(), 'pdf-positions')));

// ---------------------------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------------------------

/**
 * Words are built from characters, not taken from PyMuPDF's own word list, because the word list
 * drops the font: a word has to know it is bold to tell "CHAJAI" (the surname, bold) from
 * "Abdeljaber, 1, Av. des F.A.R." (first name and street, regular) on the Rabat list, where the
 * two sit on one line with nothing else between them.
 *
 * Rules are collected three ways because tables are drawn three ways: as hairline filled
 * rectangles (Word's exports), as stroked lines, and as stroked cell boxes. A box contributes its
 * four edges.
 */
const PY = String.raw`
import sys, json, fitz
doc = fitz.open(sys.argv[1])
pages = []
for page in doc:
    words = []
    for b in page.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                f = s['font'].lower()
                bold = bool(s['flags'] & 16) or 'bold' in f or 'black' in f
                italic = bool(s['flags'] & 2) or 'italic' in f or 'oblique' in f
                cur = None
                for c in s['chars']:
                    ch = c['c']
                    if ch.isspace():
                        if cur: words.append(cur); cur = None
                        continue
                    x0, y0, x1, y1 = c['bbox']
                    if cur is None:
                        cur = [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1), ch, bold, italic, round(s['size'], 1)]
                    else:
                        cur[1] = min(cur[1], round(y0, 1)); cur[2] = round(x1, 1); cur[3] = max(cur[3], round(y1, 1)); cur[4] += ch
                if cur: words.append(cur)
    hr = []; vr = []
    def seg(x0, y0, x1, y1):
        if y1 - y0 < 3 and x1 - x0 > 8: hr.append([round(x0, 1), round((y0 + y1) / 2, 1), round(x1, 1)])
        elif x1 - x0 < 3 and y1 - y0 > 5: vr.append([round((x0 + x1) / 2, 1), round(y0, 1), round(y1, 1)])
    for d in page.get_drawings():
        stroked = 's' in (d.get('type') or '')
        for it in d['items']:
            if it[0] == 're':
                r = it[1]
                if (r.y1 - r.y0 < 3) or (r.x1 - r.x0 < 3): seg(r.x0, r.y0, r.x1, r.y1)
                elif stroked:
                    seg(r.x0, r.y0, r.x1, r.y0); seg(r.x0, r.y1, r.x1, r.y1)
                    seg(r.x0, r.y0, r.x0, r.y1); seg(r.x1, r.y0, r.x1, r.y1)
            elif it[0] == 'l':
                p, q = it[1], it[2]
                seg(min(p.x, q.x), min(p.y, q.y), max(p.x, q.x), max(p.y, q.y))
    pages.append({'w': page.rect.width, 'h': page.rect.height, 'words': words, 'hr': hr, 'vr': vr})
sys.stdout.buffer.write(json.dumps(pages).encode('ascii'))
`;

const loadPdf = (file) => {
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
  const cached = path.join(CACHE, path.basename(file).replace(/\W+/g, '_') + '-' + hash + '.json');
  let pages;
  if (fs.existsSync(cached)) pages = JSON.parse(fs.readFileSync(cached, 'utf8'));
  else {
    let out;
    try {
      out = execFileSync('python', ['-c', PY, file], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      console.error('PyMuPDF could not read ' + file + ': ' + String(e.stderr || e.message).split('\n').slice(-2).join(' '));
      process.exit(1);
    }
    pages = JSON.parse(out);
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(cached, JSON.stringify(pages));
  }
  return pages.map((p, i) => ({ ...p, n: i + 1, words: tidyWords(p.words) }));
};

/**
 * Two repairs to the words before anything reads them.
 *
 * Fake bold: the Stockholm list draws some text twice at the same spot to thicken it, and read
 * naively "Erik LENNARTSSON" became "Erik Erik LENNARTSSON LENNARTSSON". A word with the same text
 * within a point of another is the same word.
 *
 * Split words: a change of font inside a word ends the span, so "Stra" + "sse" can arrive as two
 * words touching each other. Words closer than 0.6pt on one line are one word.
 */
const tidyWords = (raw) => {
  const ws = raw.map(([x0, y0, x1, y1, t, bold, italic, size]) => ({ x0, y0, x1, y1, t, bold, italic, size, yc: (y0 + y1) / 2 }));
  const kept = [];
  for (const w of ws) {
    if (kept.some((k) => k.t === w.t && Math.abs(k.x0 - w.x0) < 1 && Math.abs(k.y0 - w.y0) < 1)) continue;
    kept.push(w);
  }
  kept.sort((a, b) => a.yc - b.yc || a.x0 - b.x0);
  const out = [];
  for (const w of kept) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.yc - w.yc) < 1.5 && w.x0 - last.x1 >= -0.5 && w.x0 - last.x1 < 0.6) {
      last.t += w.t; last.x1 = w.x1; last.y0 = Math.min(last.y0, w.y0); last.y1 = Math.max(last.y1, w.y1);
      continue;
    }
    out.push({ ...w });
  }
  /**
   * Superscripts: "2nd Floor" is set as "2" and a raised, smaller "nd", which sits three points
   * higher and was read into the line above ("Grupo Medico Naco nd"). A small ordinal suffix that
   * starts where a larger word ends belongs to that word.
   */
  const gone = new Set();
  out.forEach((w, i) => {
    if (!/^(st|nd|rd|th|er|e|ème|eme|o|a)$/i.test(w.t)) return;
    const host = out.find((h) => h !== w && !gone.has(h) && h.size > w.size * 1.2 && Math.abs(h.x1 - w.x0) < 1.5 && Math.abs(h.yc - w.yc) < 7);
    if (host) { host.t += w.t; host.x1 = w.x1; gone.add(w); }
    void i;
  });
  return out.filter((w) => !gone.has(w));
};

// ---------------------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------------------

/** Words into lines: a line is the words whose vertical centres are within `tol` of its first. */
const linesOf = (words, tol = 2.5) => {
  const sorted = words.slice().sort((a, b) => a.yc - b.yc || a.x0 - b.x0);
  const lines = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(w.yc - last.yc) <= tol) last.words.push(w);
    else lines.push({ yc: w.yc, words: [w] });
  }
  lines.forEach((l) => { l.words.sort((a, b) => a.x0 - b.x0); l.text = joinWords(l.words); l.x0 = l.words[0].x0; });
  return lines;
};
const joinWords = (ws) => ws.map((w) => w.t).join(' ').replace(/\s+([,.;:])/g, '$1');

/** The y positions of horizontal rules crossing most of [x0, x1], merged within 2.5pt. */
// A row rule is usually drawn cell by cell, four segments end to end at one height, so the test is
// how much of the range the segments at that height cover together, not whether one of them does.
const rulesAcross = (page, x0, x1, share = 0.6) => {
  const need = (x1 - x0) * share;
  const byY = [];
  page.hr.slice().sort((a, b) => a[1] - b[1]).forEach(([a, y, b]) => {
    const g = byY.find((k) => Math.abs(k.y - y) <= 1);
    const cover = Math.max(0, Math.min(b, x1) - Math.max(a, x0));
    if (g) g.cover.push([Math.max(a, x0), Math.min(b, x1), cover]); else byY.push({ y, cover: [[Math.max(a, x0), Math.min(b, x1), cover]] });
  });
  const covered = (segs) => {
    const s = segs.filter(([, , c]) => c > 0).map(([a, b]) => [a, b]).sort((p, q) => p[0] - q[0]);
    let total = 0; let end = -Infinity;
    s.forEach(([a, b]) => { if (b > end) { total += b - Math.max(a, end); end = b; } });
    return total;
  };
  const ys = byY.filter((g) => covered(g.cover) >= need).map((g) => g.y).sort((a, b) => a - b);
  const out = [];
  ys.forEach((y) => { if (!out.length || y - out[out.length - 1] > 2.5) out.push(y); });
  return out;
};

/** The x positions of vertical rules that cross the band [y0, y1], merged within 3pt. */
const vrulesAcross = (page, y0, y1) => {
  const xs = page.vr.filter(([, a, b]) => a <= y0 + 2 && b >= y1 - 2).map(([x]) => x).sort((a, b) => a - b);
  const out = [];
  xs.forEach((x) => { if (!out.length || x - out[out.length - 1] > 3) out.push(x); });
  return out;
};

/** Which column a word is in: the last column whose left edge is at or left of the word's. */
const colOf = (cols, x) => {
  let c = cols[0];
  for (const k of cols) if (x + 1.5 >= k.x) c = k;
  return c;
};

/**
 * A record's words, split into cells and the cells into lines.
 * cells[key] = [{text, bold, words}] top to bottom.
 */
const cellsOf = (words, cols) => {
  const by = {};
  words.forEach((w) => { const c = colOf(cols, w.x0); (by[c.key] = by[c.key] || []).push(w); });
  const cells = {};
  Object.entries(by).forEach(([k, ws]) => {
    cells[k] = linesOf(ws).map((l) => ({ text: l.text, words: l.words, yc: l.yc, bold: l.words.every((w) => w.bold), anyBold: l.words.some((w) => w.bold) }));
  });
  return cells;
};
const cellText = (cells, k, sep = ' ') => (cells[k] || []).map((l) => l.text).join(sep).replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------------------------

/**
 * A hedge takes back the language it is attached to and nothing else. "Fair English and French"
 * on the Laos list is one hedged claim covering both, so a hedge word anywhere in a Laos cell
 * empties it; on a comma list ("Schwedisch, Englisch, etwas Deutsch") only the part carrying the
 * hedge goes.
 */
const HEDGE = /\b(basic|fair|some|limited|little|a bit|conversational|beginner|elementary|on request|via|interpret\w*|if needed|etwas|grundkenntnisse|basiskenntnisse|notions?|un peu|poco|b[aá]sico|dolmetscher)\b/i;
const unknownLangs = new Set();
const langsOf = (text, { letters = false } = {}) => {
  const parts = String(text || '').split(/[,;/|+&]|\s+-\s+|(?<=[a-zäöüé])-(?=[a-zäöüé])|\band\b|\bund\b|\bet\b|\by\b|\be\b|\bou\b|\n/i);
  const kept = parts.filter((p) => p.trim() && !HEDGE.test(p));
  const out = [];
  // A word that grades a claim upward is not part of the language's name, and the lexicon reads a
  // part by its first word: "Fluent English" and "English (extensive)" have to arrive as "English".
  const bare = (p) => p.replace(/[()]/g, ' ').replace(/\b(fluent|fluently|good|very|excellent|native|extensive|full|professional)\b/gi, ' ').trim();
  kept.forEach((p) => L.readLanguages(bare(p), letters, unknownLangs).forEach((c) => { if (!out.includes(c)) out.push(c); }));
  return out;
};

// ---------------------------------------------------------------------------------------------
// Names and addresses
// ---------------------------------------------------------------------------------------------

const CONTACT = /^(Tel|Tél|Telf|Telefon|Tel\.\/Fax|Phone|Ph|Fax|Mobil|Mobile|Cel|Cell|E-?mail|Mail|Web|Website|Homepage|HP|WhatsApp|WP)\b|@|https?:|www\./i;
const tidy = (s) => String(s || '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/,(\s*,)+/g, ',').replace(/^[\s,;:\u2013/-]+|[\s,;:\u2013/-]+$/g, '').trim();
/**
 * Accents off, the way scripts/ingest_verified_sources.cjs folds a name for display, including the
 * letters with a stroke through them, which NFD leaves whole (o-slash, l-stroke, eszett).
 *
 * The address is folded here, before the ingest sees it, because the ingest reads the town out of
 * the address with an ASCII pattern and folds only afterwards for display. "43130 Molndal" with its
 * umlaut did not look like a town to it, so a Gothenburg dentist fell back to the list's own city
 * and was about to be published in Stockholm; "2100 Kobenhavn" with its o-slash matched none of
 * Copenhagen's spellings and all three Copenhagen translators were refused. Folded, both read right.
 */
const STROKED = [[/ß/g, 'ss'], [/ẞ/g, 'SS'], [/ł/g, 'l'], [/Ł/g, 'L'], [/ø/g, 'o'], [/Ø/g, 'O'], [/đ/g, 'd'], [/Đ/g, 'D'],
  [/ı/g, 'i'], [/İ/g, 'I'], [/æ/g, 'ae'], [/Æ/g, 'Ae'], [/œ/g, 'oe'], [/Œ/g, 'Oe'], [/å/g, 'a'], [/Å/g, 'A']];
const asciiText = (s) => STROKED.reduce((t, [re, r]) => t.replace(re, r), String(s || '')).normalize('NFD').replace(/[̀-ͯ]/g, '');
const fold = (s) => asciiText(s).toLowerCase();
/** "Latour, Patricia" is how the U.S. lists write a person; the card prints "Patricia Latour". */
const personOrder = (n) => {
  const m = String(n).match(/^([^,]{2,40}),\s*([^,]{2,40})$/);
  if (!m || /\b(LLC|Ltd|S\.?A\.?|SAS|Inc|&|Associates|Abogados|Law|Legal)\b/i.test(n)) return n;
  return m[2].trim() + ' ' + m[1].trim();
};
/** Letters after a name that are a qualification, and one list's own annotation (SNAG). */
const CREDENTIALS = /,?\s*\b(MD|M\.D\.|VD|DVM|PhD|FAAFAS|ASSM|EP-C|CKTP|CMAT|SNAG)\b\.?/g;
const noParens = (s) => tidy(String(s).replace(/\([^)]*\)/g, ' ').replace(/\s{2,}/g, ' '));

// ---------------------------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------------------------

/**
 * Records from a ruled table: each band between two rules that cross the key column is one record.
 *
 * `cols` is the column set in force, `rowsX` the x-range whose rules separate rows. Rules that only
 * cross another column are underlines (every e-mail address on the Santo Domingo list has one) or
 * inner cell borders, and are not row boundaries. A band may be claimed as a header or a heading by
 * `onBand` returning 'skip'.
 */
const ruledBands = (pages, { rowsX, top = 0, bottom = Infinity, keep = () => true }) => {
  const bands = [];
  for (const page of pages) {
    const ys = rulesAcross(page, rowsX[0], rowsX[1]);
    const words = page.words.filter((w) => w.yc > top && w.yc < Math.min(bottom, page.h) && keep(w, page));
    const edges = [-Infinity, ...ys, Infinity];
    for (let i = 0; i < edges.length - 1; i += 1) {
      const ws = words.filter((w) => w.yc > edges[i] && w.yc < edges[i + 1]);
      if (ws.length) bands.push({ page, y0: edges[i], y1: edges[i + 1], words: ws, ruledAbove: i > 0, ruledBelow: i < edges.length - 2 });
    }
  }
  return bands;
};

const LAYOUTS = {};

/**
 * U.S. Embassy Santo Domingo, "Providers List 2025" (Medical-Resources-and-Hospitals-in-the-
 * Dominican-Republic-2.pdf).
 *
 * A run of ruled tables, each opened by a header row: "Hospital | Numbers | Location | Lang." for
 * hospitals and "<Specialty> | E-mail | Numbers | Location | Section | Lang." for each specialty.
 * The header row sets the columns (from the vertical rules that cross it, because the labels are
 * centred and their own x says nothing about where a column starts) and its first cell is the
 * category for every row under it. Tables continue across pages and keep their columns.
 *
 * The language is the Lang. cell of the row. "Spanish" alone is the local language and the ingest
 * refuses it; "English, Spanish" gives English.
 *
 * Not providers, skipped: pharmacies, laboratories and imaging centres (no Lang. column), the
 * masseuses and the nutritionists (neither is one of our categories, and "Nutritionist" would have
 * fallen back to doctor), and the two Veterans Affairs program labels whose cell names a program,
 * "VA FOREIGN MEDICAL SERVICES (private clinics not affiliated with ...)", not a clinic.
 *
 * Town: the Santo Domingo sections ("Medical Providers in Santo Domingo", "General medical services
 * in Santo Domingo") write street and neighbourhood only ("Calle Max Enriquez Urena 31", Section
 * "Naco"). The address is given ", Santo Domingo" from that section heading when it names no town;
 * the section heading is the list's own statement of where these are. The first section, "Medical
 * Services outside of Santo Domingo", writes its towns and gets nothing added.
 */
LAYOUTS['us-do-medical'] = (pages) => {
  const LABELS = [[/^e-?mail$/i, 'email'], [/^numbers$/i, 'phone'], [/^location$/i, 'area'], [/^section$/i, 'section'], [/^lang\.?$/i, 'lang']];
  const isHeader = (line) => ['Numbers', 'Location'].every((k) => line.words.some((w) => w.t === k));
  const SKIP_CAT = /pharmac|laborator|imaging|mri|masseuse|nutrition/i;
  const NOTE = /U\.S\. insurance|accepted,? always|always confirm|with the hospital|ensure coverage|^coverage\.?$|Tricare|^\(?open at|^\(?24\/7\)?$/i;
  // What a name cell says about the doctor under the name: "Cardiologist Interventionist", "Pediatric".
  const DESCRIPTOR = /^(pediatric|pediatrics|general|interventionist|cardiologist|outpatient medical center|podiatrist|hand surgeon|imagenes and biopsies-?|main lab.*|mastologist.*|infertility.*|general\/?\s*implants.*|oral rehab|pediatric, general|pediatrics, general)$/i;
  const rows = [];
  let cols = null; let cat = ''; let townFromSection = '';
  const bands = ruledBands(pages, { rowsX: [45, 120], top: 70, bottom: 725 });
  for (const band of bands) {
    const lines = linesOf(band.words);
    // Section titles sit outside the tables, in bands of their own.
    const title = lines.map((l) => l.text).join(' ');
    if (/Medical Services Outside Santo Domingo/i.test(title)) { townFromSection = ''; continue; }
    if (/PAYMENTS ARE DUE|Medical Providers in/i.test(title)) { townFromSection = 'Santo Domingo'; continue; }
    const header = lines.find(isHeader);
    // A specialty table opened by a bold label alone and no column header ("Masseuse").
    if (!header && lines.length === 1 && lines[0].words.every((w) => w.bold)) { cat = lines[0].text; continue; }
    if (header) {
      const xs = vrulesAcross(band.page, header.yc - 3, header.yc + 3);
      const labelAt = (w) => { let k = xs.length - 2; while (k > 0 && w.x0 < xs[k]) k -= 1; return k; };
      const set = {};
      header.words.forEach((w) => { const k = labelAt(w); (set[k] = set[k] || []).push(w.t); });
      cols = Object.entries(set).map(([k, ts]) => {
        const label = ts.join(' ');
        const hit = LABELS.find(([re]) => re.test(label));
        return { x: xs[Number(k)], key: hit ? hit[1] : 'name', label };
      }).sort((a, b) => a.x - b.x);
      cat = (cols.find((c) => c.key === 'name') || {}).label || '';
      continue;
    }
    if (!cols || !band.ruledAbove || !band.ruledBelow || SKIP_CAT.test(cat) || !cols.some((c) => c.key === 'lang')) continue;
    const cells = cellsOf(band.words, cols);
    const nameLines = (cells.name || []).map((l) => l.text).filter((t) => !NOTE.test(t));
    if (/^VA FOREIGN MEDICAL|^Medical Care for Veterans/i.test(nameLines.join(' '))) continue;
    // "Surname, First" on the first line is a doctor, and the lines under it are what the doctor
    // does or where ("Cardiologist Interventionist", "CarlinoVision"): the name is that line, or two
    // lines when the first ends on its comma ("Giraldez Casasnovas, / Juan"). Anything else is a
    // practice written over several lines ("Ginecologia y / Obstetricia Moderna / Dra. Elisa ...").
    // A one-word line that is the local part of the row's e-mail is the practice's brand, not a name.
    const email = cellText(cells, 'email').toLowerCase();
    const plain = nameLines.map((t) => t.replace(CREDENTIALS, ' ').replace(/\s+/g, ' ').replace(/[\s,]+$/, (m) => (/,/.test(m) ? ',' : '')).trim()).filter(Boolean);
    let name;
    const own = plain.filter((t) => !DESCRIPTOR.test(t));
    if (!/^Hospital$/i.test(cat) && /,/.test(own[0] || '')) {
      name = personOrder(/,$/.test(own[0]) && own[1] ? own[0] + ' ' + own[1] : own[0]);
    } else {
      name = own.filter((t) => !(/^\S+$/.test(t) && email.includes(t.toLowerCase()))).join(' ');
    }
    name = noParens(name.replace(/\s+-\s*$/, ''));
    // Every table here is a medical one, and the ingest's category words are German and French as
    // much as English: "ENT Specialist", "Surgeons", "Allergists" and "Ophthalmologists" matched
    // none of them and seven doctors went uncategorised. "doctor" is what each of these is; where
    // the header names something narrower (Dentists, Veterinarian, Psych Counseling, Physical
    // Therapist) the ingest prefers the narrower category over doctor.
    const specialty = [cat, /psych/i.test(cat) ? 'psychotherapy' : '', ...nameLines.filter((t) => DESCRIPTOR.test(t)), 'doctor'].join(' ');
    // A doctor who keeps two offices writes both in one cell, each opened by its hours in brackets
    // ("Clinica Abreu (M/W/F 9-1)" ... "Abel Gonzalez (Tu/Th 8-12)"): the first office is kept.
    let locLines = (cells.area || []).map((l) => l.text);
    const opened = locLines.map((t, i) => (/\(.*\d.*\)/.test(t) ? i : -1)).filter((i) => i >= 0);
    const twoOffices = opened.length > 1;
    if (twoOffices) locLines = locLines.slice(0, opened[1]);
    const areaLines = locLines
      .filter((t) => !CONTACT.test(t) && !/^(Monday|Mon[\s/-]|Has associate|General Urology|General$|Pediatric$|Family Counseling|Psychotherapy$|\(open)/i.test(t)
        && !/\d{1,2}:\d{2}\s*(am|pm)/i.test(t))
      .map((t) => t.replace(/\([^)]*\)/g, ' '));
    const section = twoOffices ? ((cells.section || [])[0] || {}).text || '' : cellText(cells, 'section');
    const loc = areaLines.join(' ');
    const repeated = section && fold(loc).includes(fold(section));
    let area = tidy([loc, repeated ? '' : section].filter(Boolean).join(', '));
    if (townFromSection && !/Santo Domingo/i.test(area)) area = tidy(area + ', ' + townFromSection);
    const langLine = cellText(cells, 'lang');
    rows.push({ name, specialty, area, languages: langsOf(langLine), languageLine: langLine, page: band.page.n });
  }
  return rows;
};

/**
 * U.S. Embassy Vientiane, "List of Local Hospitals and Doctors" (May 2025).
 *
 * One ruled table, Specialty | Name | Phone # | Address | Language, with province sections
 * (LUANG PRABANG PROVINCE, VIENTIANE CAPITAL, VANG VIENG, CHAMPASAK) as bold rows across it.
 * Language cells read "Fluent English", "Good English" or "Fair English"; Fair is a hedge and gives
 * nothing, which leaves six rows. The Address cells hold a place and a clinic name, never a street
 * ("Vientiane Capital / Psy-med Center"), so every row reaches the ingest without the house number
 * it requires: parsed, and expected to be refused there as having no address.
 *
 * The THAILAND block on page 2 is a different table in the same grid (a hospital's whole address in
 * the Phone column) and is read as such: name is the first line of that column.
 */
LAYOUTS['us-la-medical'] = (pages) => {
  const cols = [{ x: 36, key: 'specialty' }, { x: 144, key: 'name' }, { x: 265, key: 'phone' }, { x: 422, key: 'area' }, { x: 513, key: 'lang' }];
  const rows = [];
  let section = '';
  // Page 3 is air ambulance companies in Thailand and the United States, not providers here.
  const bands = ruledBands(pages.filter((p) => p.n <= 2), { rowsX: [150, 250], top: 60, bottom: 760 });
  for (const band of bands) {
    const cells = cellsOf(band.words, cols);
    const all = Object.values(cells).flat();
    const heading = all.length && all.every((l) => l.bold) ? all.map((l) => l.text).join(' ') : '';
    if (heading && !/Specialty|Alliance/i.test(heading)) { section = heading.replace(/:$/, ''); continue; }
    if (/Specialty/.test(cellText(cells, 'specialty')) && /Language/.test(cellText(cells, 'lang'))) continue;
    const langLine = cellText(cells, 'lang');
    if (!langLine) continue;
    let name = cellText(cells, 'name');
    let area = cellText(cells, 'area', ', ');
    if (/THAILAND/i.test(section)) {
      // One cell holds a hospital, then its address down to the first telephone line, then the next
      // hospital; only the first has a Language cell beside it.
      const block = (cells.phone || []).map((l) => l.text);
      name = block[0] || '';
      const addr = [];
      for (const t of block.slice(1)) { if (CONTACT.test(t)) break; addr.push(t); }
      area = tidy(addr.join(', '));
      section = '';
    }
    if (/Alliance International/i.test(name + cellText(cells, 'phone'))) {
      name = (cells.phone || []).filter((l) => l.bold).map((l) => l.text).join(' ');
    }
    rows.push({ name: tidy(name), specialty: cellText(cells, 'specialty') || 'hospital', area: tidy(area + (section ? ', ' + section : '')),
      languages: HEDGE.test(langLine) ? [] : langsOf(langLine), languageLine: langLine, page: band.page.n });
  }
  return rows;
};

/**
 * U.S. Embassy Abu Dhabi, "List of Lawyers" (Rev. June 23, 2026).
 *
 * One firm per page, a three-column form: bold labels (Law Firm Name, Address, Contact
 * Information, Education, Professional Association, Office Hours, Languages Spoken, Personally
 * visit US citizens in jail?, Lawyers) in 85-214pt, their values centred in 214-575pt, and a
 * Specialties column at 576-720pt. The label cells are ruled at 85-214pt, and a value belongs to
 * the label whose ruled cell its vertical centre falls in; that is the whole fix. A label that wraps
 * ("Personally visit US / Citizens in jail?") is one cell and is read whole.
 *
 * Languages Spoken is per firm and in the lawyers' own words ("English-extensive", "English
 * (extensive) / Arabic, Urdu, French"). Arabic is the local language.
 */
LAYOUTS['us-ae-lawyers'] = (pages) => {
  const rows = [];
  for (const page of pages) {
    // The three columns move from page to page (the label column ends at 178, 203, 208 or 214pt),
    // so they are read off this page's own top rule, which is drawn one segment per column.
    const topY = Math.min(...page.hr.filter(([a, , b]) => b - a > 60).map(([, y]) => y));
    const segs = page.hr.filter(([, y]) => Math.abs(y - topY) <= 1).map(([a]) => a).sort((x, y) => x - y)
      .filter((x, i, arr) => i === 0 || x - arr[i - 1] > 20);
    if (segs.length < 3) continue;
    const cols = [{ x: 0, key: 'label' }, { x: segs[1] - 1, key: 'value' }, { x: segs[2] - 1, key: 'spec' }];
    const ys = rulesAcross(page, segs[0] + 3, segs[1] - 3);
    if (ys.length < 4) continue;
    const fields = {};
    let spec = [];
    for (let i = 0; i < ys.length - 1; i += 1) {
      const ws = page.words.filter((w) => w.yc > ys[i] && w.yc < ys[i + 1]);
      const cells = cellsOf(ws, cols);
      const label = cellText(cells, 'label').replace(/:$/, '').toLowerCase();
      if (label) fields[label] = (cells.value || []).map((l) => l.text);
      spec = spec.concat((cells.spec || []).map((l) => l.text));
    }
    const get = (re) => { const k = Object.keys(fields).find((x) => re.test(x)); return k ? fields[k] : []; };
    const name = get(/^law firm name/).join(' ');
    if (!name) continue;
    const contact = get(/^contact/);
    const url = (contact.join(' ').match(/\bwww\.[\w.-]+|https?:\/\/\S+/) || [])[0];
    const langLine = get(/^languages/).join(', ');
    // A firm with two offices writes both in the Address cell, each opening with its emirate
    // ("Dubai, Sheikh Zayed Road ..." then "Abu Dhabi, Office No. 804 ..."). Each is a row, so the
    // ingest can place each in its own city; one address that merely ends with the emirate is one.
    const offices = [];
    get(/^address/).forEach((t) => {
      const opensOffice = /^(Dubai|Abu Dhabi|Sharjah|Ajman|Ras Al Khaimah)\b/i.test(t) && !/^(Dubai|Abu Dhabi|Sharjah|Ajman|Ras Al Khaimah)[.,\s]*(UAE)?\.?$/i.test(t);
      if (!offices.length || opensOffice) offices.push([t]); else offices[offices.length - 1].push(t);
    });
    offices.forEach((o) => rows.push({ name: tidy(name), specialty: 'Lawyer', practice: spec.filter((t) => !/^Specialties$/i.test(t)).join(' '),
      area: tidy(o.join(' ').replace(/,?\s*P\.?\s?O\.?\s*Box\s*\d+/gi, '')), languages: langsOf(langLine), languageLine: langLine, ...(url ? { url } : {}), page: page.n }));
  }
  return rows;
};

/**
 * U.S. Consulate General Krakow, "List of English Speaking Attorneys in Krakow" (Rev. Dec. 2023).
 *
 * A ruled three-column table: NAME OF ATTORNEY | ADDRESS & TELEPHONE No. | TYPE OF CASES HANDLED.
 * The name column is itself split in two at 111pt on most rows, and that split is what the text
 * readings could not see: "Kancelaria / Adwokacka / Miroslaw / Kleber" on the left and "Miroslaw /
 * Kleber" on the right came out interleaved word by word. By position the two halves are separate:
 *   - a firm in the left half and its partners in the right ("CMG Kancelaria Prawnicza" | "S. Cabala,
 *     P. Mazur, M. Grochowska"): the name is the firm;
 *   - a first name left and a surname right ("Teresa" | "Kielar"): the name is both, in order.
 * "Attorney at Law" and "Adwokat" under a name are the role, not the name.
 *
 * The claim is the title's, a roster of English-speaking attorneys: the manifest declares it, and
 * the rows here carry no language of their own.
 */
LAYOUTS['us-pl-krakow-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'nameA' }, { x: 111, key: 'nameB' }, { x: 205, key: 'area' }, { x: 367, key: 'cases' }];
  const ROLE = /^(Attorney at Law|Attorney-at-Law|Adwokat|Radca Prawny|Legal Counsel)$/i;
  const rows = [];
  const bands = ruledBands(pages, { rowsX: [40, 530], top: 60, bottom: 800 });
  for (const band of bands) {
    if (!band.ruledAbove) continue;
    // The halves are told apart by line, not by word: a word belongs to the right half only where it
    // starts past 111pt after a gap, because a long name on the left runs across the split ("dr
    // Magdalena Makiela" would otherwise lose its surname to the right half).
    const cells = cellsOf(band.words, cols.filter((c) => c.key !== 'nameB'));
    const halves = { A: [], B: [] };
    (cells.nameA || []).forEach((l) => {
      let side = 'A';
      const parts = { A: [], B: [] };
      l.words.forEach((w, i) => {
        if (w.x0 >= 109 && (i === 0 || w.x0 - l.words[i - 1].x1 > 6)) side = 'B';
        parts[side].push(w);
      });
      ['A', 'B'].forEach((k) => { if (parts[k].length) halves[k].push({ text: joinWords(parts[k]), yc: l.yc }); });
    });
    cells.nameA = halves.A; cells.nameB = halves.B;
    if (/NAME OF ATTORNEY/.test(cellText(cells, 'nameA'))) continue;
    // The left half holds the firm as its first paragraph and sometimes the partners under it after a
    // gap ("Nartowski Trojanowska Adwokaci Spolka Partnerska" ... "Wojciech Nartowski"): the firm is
    // the first paragraph. Collapse "Kancelaria Kancelaria", a two-line cell set on one baseline.
    const aLines = (cells.nameA || []).filter((l) => !ROLE.test(l.text));
    const para = [];
    aLines.forEach((l, i) => { if (i === 0 || l.yc - aLines[i - 1].yc < 20) para.push(l.text); else para.push('\u0000', l.text); });
    // A left half made only of the words for a law office ("Kancelaria Adwokacka") names nobody:
    // the lawyer is either in the next paragraph under it or on the right. One word on the left is a
    // first name, with the surname on the right.
    const OFFICE = /^(Kancelaria|Adwokacka|Prawnicza|Radcy|Prawnego|Adwokaci|\s)+$/i;
    const paras = para.join(' ').split('\u0000').map((t) => t.replace(/\s+/g, ' ').trim().replace(/^(\S+) \1\b/, '$1')).filter(Boolean);
    let a = paras[0] || '';
    for (let k = 1; k < paras.length && OFFICE.test(a); k += 1) a += ' ' + paras[k];
    const b = (cells.nameB || []).map((l) => l.text).filter((t) => !ROLE.test(t)).join(' ');
    // "Magdalena Kasprzyk \u2013 / Chevriaux" is one double surname broken over two lines; the dash is a
    // hyphen, and left spaced it reaches the card as a comma ("Kasprzyk, Chevriaux").
    const name = (b && (a.split(/\s+/).length < 2 || OFFICE.test(a)) ? a + ' ' + b : a).replace(/\s*[\u2013\u2014]\s*/g, '-');
    const PHONE = /^[+(]{1,2}\d.*\d{2}|^\d{3} \d{2} \d{2}|^(Ph|Mob|Mobile|Cell|phone no|emails?|e-mails?)\b/i;
    const URLISH = /^[\w.-]*\/[\w./-]*$|^[\w-]+\.(pl|com|net|eu)\b|^m\.pl|^wokaci/i;
    // The address is the cell's lines down to the first contact line; everything after is telephone,
    // e-mail and a web address wrapped over two lines ("http://www.adwokatkleber.pl/e" / "n.html").
    const areaLines = [];
    for (const t of (cells.area || []).map((l) => l.text)) {
      if (CONTACT.test(t) || PHONE.test(t) || URLISH.test(t) || /^(e-mail|tel\.?\/fax\.?)/i.test(t)) break;
      areaLines.push(t);
    }
    // The address cell sometimes repeats the firm on its first line ("Kancelaria Adwokacka").
    const area = tidy(areaLines.filter((t) => !/^Kancelaria|^Realno/i.test(t)).join(', ').replace(/,?\s*(tel|ph)\.?[:/].*$/i, '').replace(/,\s*,/g, ',').replace(/\/,/g, ','));
    rows.push({ name: tidy(name), specialty: 'Attorney at law', practice: cellText(cells, 'cases'), area, languages: [], page: band.page.n });
  }
  return rows;
};

/**
 * German Embassy Rabat, "Rechtsanwaltsliste Marokko" (Stand 05/2023), pages 4 and 5.
 *
 * Four ruled columns: the entry (71-396pt), Fremdsprachen (397-439), Spezialgebiete (439-495) and
 * CS, admission to the Supreme Court (496-523). The language letters are the page's own legend:
 * D Deutsch, F Franzoesisch, E Englisch, S Spanisch, A Arabisch, and "(D) = Dolmetscher fuer D",
 * a German interpreter, which is a hedge and gives nothing. The legend is why the letters may be
 * read at all; outside that column a lone F is Familienrecht.
 *
 * The entry cell is "SURNAME (bold) Firstname, street, town" then Tel./E-Mail lines. The name ends
 * at the first comma after the last bold word, which also keeps two-lawyer firms whole ("Cabinet
 * RUTILI Pierre, IMZIL Mohamed"). A record without a bold start at the top of a page is the tail of
 * the one before (EL GHARMOUL's telephone and e-mail run onto page 5).
 */
LAYOUTS['de-ma-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'entry' }, { x: 397, key: 'lang' }, { x: 439.5, key: 'spec' }, { x: 496, key: 'cs' }];
  const LETTERS = { D: 'de', F: 'fr', E: 'en', S: 'es', A: 'ar' };
  const rows = [];
  let section = '';
  const bands = ruledBands(pages.filter((p) => p.n >= 4), { rowsX: [400, 436], top: 60, bottom: 760 });
  for (const band of bands) {
    const cells = cellsOf(band.words, cols);
    const entry = cells.entry || [];
    if (!entry.length) continue;
    if (entry.length === 1 && entry[0].bold && !cells.lang) { section = entry[0].text; continue; }
    const first = entry[0];
    if (!first.anyBold || !first.words[0].bold) {
      const prev = rows[rows.length - 1];
      if (prev) prev.area = prev.area; // a tail of contact lines: nothing in it is an address
      continue;
    }
    if (/^(Telefon|aus Deutschland)/.test(first.text)) continue;
    // The first line, and the next ones up to the first contact line, are "name, address".
    const headLines = [];
    for (const l of entry) { if (CONTACT.test(l.text)) break; headLines.push(l); }
    const ws = headLines.flatMap((l) => l.words);
    const lastBold = ws.reduce((k, w, i) => (w.bold ? i : k), -1);
    let cut = ws.findIndex((w, i) => i >= lastBold && /,$/.test(w.t));
    if (cut < 0) cut = lastBold;
    // "CWAssocies & MIDEAST|Law" writes its brand with a bar and "17 rue El Bouhtouri | Quartier
    // Gauthier" separates address parts with one; neither is text a card should show.
    const name = noParens(joinWords(ws.slice(0, cut + 1)).replace(/,$/, '').replace(/\s+,/g, ',').replace(/\s*\|\s*/g, ' '));
    const area = tidy(joinWords(ws.slice(cut + 1)).replace(/\s*\|\s*/g, ', '));
    const langLine = cellText(cells, 'lang');
    const languages = [];
    langLine.replace(/\([A-Z]\)/g, ' ').split(/[,\s]+/).forEach((t) => { if (LETTERS[t] && !languages.includes(LETTERS[t])) languages.push(LETTERS[t]); });
    rows.push({ name, specialty: 'Rechtsanwalt', practice: cellText(cells, 'spec'), area: tidy(area + (section && !new RegExp(section.slice(0, 5), 'i').test(area) ? ', ' + section : '')),
      languages, languageLine: langLine, section, page: band.page.n });
  }
  return rows;
};

/**
 * Unruled lists whose entries begin with a bold name in the first column: a new record starts at
 * every line whose first word is bold and sits in the name column. Section headings (a bold line
 * alone, matched by `heading`) set the section and are not records.
 */
const boldStartRecords = (pages, { cols, top = 0, bottom = Infinity, heading, skip = () => false, nameCol = 'name' }) => {
  const records = [];
  let section = '';
  for (const page of pages) {
    const t = typeof top === 'function' ? top(page) : top;
    const lines = linesOf(page.words.filter((w) => w.yc > t && w.yc < Math.min(bottom, page.h)));
    for (const line of lines) {
      if (skip(line)) continue;
      if (heading && heading(line)) { section = line.text; records.push(null); continue; }
      const startsName = line.words[0].bold && colOf(cols, line.words[0].x0).key === nameCol;
      if (startsName || !records.length || records[records.length - 1] === null) {
        if (!startsName) continue;
        records.push({ section, page: page.n, words: [] });
      }
      records[records.length - 1].words.push(...line.words);
    }
  }
  return records.filter(Boolean).map((r) => ({ ...r, cells: cellsOf(r.words, cols) }));
};

/**
 * German Embassy La Paz, "Uebersetzer/innen- und Dolmetscher/innenliste" (Stand Februar 2025).
 *
 * Five unruled columns at fixed positions: Name, Vorname (36pt) | Qualifikation (206) | Sprachen
 * (355) | Fachgebiet (461) | Adresse (603). The column boundaries are set here from the page rather
 * than from the header, because the header on page 3 is indented seven points further than the
 * cells under it. A bold surname in the first column starts an entry; LA PAZ, COCHABAMBA, SANTA
 * CRUZ DE LA SIERRA, TARIJA and POTOSI are sections. Sprachen is a code line, "DE/EN/ES", with the
 * Spanish spelled out below it: the codes are read, Spanish is local.
 *
 * Hugo Miranda Quiroga is printed under both COCHABAMBA and SANTA CRUZ with an address in Buena
 * Vista, Provincia Ichilo, a hundred kilometres from either; --section keeps each manifest entry to
 * its own section and the ingest then refuses him in Cochabamba for naming Santa Cruz.
 */
LAYOUTS['de-bo-translators'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }, { x: 204, key: 'qual' }, { x: 353, key: 'lang' }, { x: 459, key: 'subject' }, { x: 600, key: 'area' }];
  const recs = boldStartRecords(pages, {
    // Page 1 opens with the embassy's letterhead and a notice in bold; its first entry is below 400pt.
    cols, top: (p) => (p.n === 1 ? 400 : 30), bottom: 580,
    heading: (l) => l.words.every((w) => w.bold) && l.x0 < 40 && /^[A-ZÁÉÍÓÚ .]+$/.test(l.text) && l.words.length <= 5,
    skip: (l) => /Name, Vorname|apellido, nombre/.test(l.text),
  });
  return recs.map((r) => {
    const name = personOrder(cellText(r.cells, 'name').replace(/\(Lic\..*$|\(Traduct.*$|Jurada\)/g, ''));
    const codes = ((cellText(r.cells, 'lang').match(/\b[A-Z]{2}(?:\/[A-Z]{2})+\b/) || [''])[0]).split('/');
    const MAP = { DE: 'de', EN: 'en', ES: 'es', PT: 'pt', FR: 'fr', IT: 'it' };
    const areaLines = (r.cells.area || []).map((l) => l.text).filter((t) => !CONTACT.test(t) && !/^solicitar/i.test(t));
    // The section is the list's statement of the town, and most La Paz addresses name only the
    // district ("Calacoto", "Achumani"): the town is added from the section where the address has
    // none, so that each manifest entry's rows name their city. An address in a province ("Buena
    // Vista, Prov. Ichilo, Santa Cruz") is in a provincial town and is not given a city at all.
    const town = r.section.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()).replace(/ De La /, ' de la ');
    let area = tidy(areaLines.join(', '));
    const inProvince = /\bProv\./.test(area);
    if (area && !inProvince && !new RegExp('\\b' + town.split(' ').slice(0, 2).join(' '), 'i').test(area)) area = tidy(area + ', ' + town);
    return { name: tidy(name), specialty: 'Uebersetzer ' + cellText(r.cells, 'qual'), area: inProvince ? '' : area,
      languages: codes.map((c) => MAP[c]).filter(Boolean), languageLine: cellText(r.cells, 'lang'), section: r.section, page: r.page,
      ...(inProvince ? { refused: 'address in a provincial town: ' + area } : {}) };
  });
};

/**
 * German Embassy Pretoria, "Deutschsprachige vereidigte Uebersetzer (Sworn Translators)" (Mai 2025).
 *
 * Three sections, one per page: "in Johannesburg", "in Pretoria", "in Kwa-Zulu Natal". Two
 * columns: the person (bold) and street on the left, languages and contacts on the right at 319pt.
 * The languages are hyphenated, "deutsch-englisch-afrikaans". Every Johannesburg address is a
 * suburb with its postcode (Sandton 2057, Randburg 2194), which is why the ingest could not place
 * them: the manifest entry is metro and --section "Johannesburg" keeps the Pretoria and KwaZulu-Natal
 * pages out of it.
 */
LAYOUTS['de-za-translators'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }, { x: 315, key: 'right' }];
  const out = [];
  for (const page of pages) {
    const heading = linesOf(page.words).find((l) => /^in\s/.test(l.text) && l.words[0].bold);
    const section = heading ? heading.text.replace(/\s*\(Stand.*$/, '').replace(/^in\s+/, '') : '';
    // Each page ends with the same disclaimer ("Diese Angaben sind unverbindlich ..."), higher up on
    // the short KwaZulu-Natal page, where a fixed cut let it run into the one entry and drop it.
    const disclaimer = linesOf(page.words).find((l) => /^Diese Angaben/.test(l.text));
    const recs = boldStartRecords([page], { cols, top: heading ? heading.yc + 5 : 0, bottom: disclaimer ? disclaimer.yc - 3 : page.h });
    recs.forEach((r) => {
      const right = (r.cells.right || []).map((l) => l.text);
      const langLine = right[0] || '';
      const left = (r.cells.name || []).map((l) => l.text);
      if (/Diese Angaben|Haftung/.test(left.join(' '))) return;
      out.push({ name: tidy(left[0]), specialty: 'Uebersetzer', area: tidy(left.slice(1).join(', ')), languages: langsOf(langLine),
        languageLine: langLine, section, page: page.n });
    });
  }
  return out;
};

/**
 * German Embassy Stockholm, "Aerzteliste" (Stand 18.08.2025).
 *
 * Specialty headings in bold italic (Chiropraktikerin, Gynaekologie, Psychiatrie, Psychotherapie,
 * Zahnmedizin Zahnaerzte), then one ruled two-cell row per doctor: left 55-255pt the name (first
 * name regular, SURNAME bold), practice and address; right 257-539pt the specialty, how to book,
 * and "Sprachen: ...". The text readings alternated the two cells line by line, which is how a
 * booking note became a name. "Schwedisch, Englisch, etwas Deutsch" keeps English only.
 */
LAYOUTS['de-se-doctors'] = (pages) => {
  const cols = [{ x: 0, key: 'left' }, { x: 256, key: 'right' }];
  const rows = [];
  let cat = '';
  for (const page of pages) {
    const ys = rulesAcross(page, 60, 250, 0.8);
    const lines = linesOf(page.words);
    lines.filter((l) => l.words.every((w) => w.bold && w.italic)).forEach((l) => { l.isHeading = true; });
    const edges = [-Infinity, ...ys, Infinity];
    for (let i = 0; i < edges.length - 1; i += 1) {
      const ws = page.words.filter((w) => w.yc > edges[i] && w.yc < edges[i + 1]);
      const heads = linesOf(ws).filter((l) => l.words.every((w) => w.bold && w.italic));
      if (heads.length) cat = heads[heads.length - 1].text;
      const body = ws.filter((w) => !(w.bold && w.italic));
      const cells = cellsOf(body, cols);
      const right = (cells.right || []).map((l) => l.text).join(' ');
      const m = right.match(/Sprachen:\s*(.+)$/);
      const left = (cells.left || []).map((l) => l.text);
      if (!m || !left.length) continue;
      const nameAt = (cells.left || []).findIndex((l) => l.anyBold);
      if (nameAt < 0) continue;
      const name = cells.left[nameAt].text;
      // The cell also holds the doctor's titles and training ("Leg. Kiropraktor", "Psychiaterin"),
      // so the address is picked out rather than taken whole: from the first line with a house
      // number to the postcode line ("114 26 Stockholm"), plus the practice's own name on the line
      // before the street where it has one ("Eliva Clinic", "Sophiahemmet Hospital").
      const body2 = left.slice(nameAt + 1).filter((t) => !CONTACT.test(t) && !/@|^Termine|^Praxis:?$/.test(t) && !/^[\d\s\u2013-]+$/.test(t));
      const street = body2.findIndex((t) => /[A-Za-zåäöÅÄÖé]{3,}\S*\s+\d+\s*[A-Za-z]?\b/.test(t) && !/^\d{3}\s?\d{2}\s/.test(t));
      const post = body2.findIndex((t) => /^\d{3}\s?\d{2}\s+[A-ZÅÄÖ]/.test(t) || /,\s*\d{3}\s?\d{2}\s+[A-ZÅÄÖ]/.test(t));
      let areaLines = [];
      if (street >= 0) {
        const from = street > 0 && /clinic|klinik|hospital|mottagning|akademin|praxis|\bAB\b|center|centrum/i.test(body2[street - 1]) ? street - 1 : street;
        areaLines = body2.slice(from, Math.max(post, street) + 1);
      }
      rows.push({ name: tidy(name.replace(/\bDC$/, '')), specialty: cat + ' ' + right.replace(/Sprachen:.*$/, ''), area: tidy(areaLines.join(', ')),
        languages: langsOf(m[1]), languageLine: m[1], page: page.n });
    }
  }
  return rows;
};

/**
 * German Embassy Tegucigalpa, "Anwaltsliste" (Stand Januar 2023).
 *
 * Ruled rows across 83-544pt, two columns split at 295pt: left the firm (bold), the lawyers and the
 * address; right the practice areas in German, then in Spanish (italic), then the languages in
 * German ("spanisch, deutsch, englisch, italienisch, russisch") and in Spanish (italic). The
 * language line is the right-column line made only of language words. Sections I. TEGUCIGALPA to
 * V. Roatan are bold numbered headings; Roatan's heading shares a row with its only firm.
 */
LAYOUTS['de-hn-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'left' }, { x: 290, key: 'right' }];
  const rows = [];
  let section = '';
  const bands = ruledBands(pages.filter((p) => p.n >= 2), { rowsX: [90, 540], top: 60, bottom: 800 });
  for (const band of bands) {
    const cells = cellsOf(band.words, cols);
    let left = (cells.left || []).slice();
    const sec = left.findIndex((l) => /^[IVX]+\.\s/.test(l.text));
    if (sec >= 0) {
      section = left[sec].text.replace(/^[IVX]+\.\s*/, '').replace(/\s+\u2013.*$/, '');
      left = left.filter((_, i) => i !== sec);
    }
    if (!left.length || /^Anschrift/.test(left[0].text)) continue;
    const langLines = (cells.right || []).filter((l) => !l.words.some((w) => w.italic)).map((l) => l.text)
      .filter((t) => t.split(/[,\s]+/).filter(Boolean).every((w) => /^(spanisch|deutsch|englisch|franz[öo]sisch|italienisch|russisch|portugiesisch|chinesisch|arabisch)$/i.test(w)));
    const langLine = langLines.join(', ');
    const nameLines = left.filter((l) => l.bold && !/^(Casa|Priemra|La Ceiba)/.test(l.text) && !CONTACT.test(l.text)).map((l) => l.text);
    const rest = left.filter((l) => !(l.bold && nameLines.includes(l.text))).map((l) => l.text);
    const areaLines = rest.filter((t) => !CONTACT.test(t) && !/^Abogad[oa]\b/.test(t) && !/^[\w.-]+@|^\w+\.\w+\/|^maalvarado/.test(t));
    const url = ((cells.left || []).map((l) => l.text).join(' ').match(/(?:Homepage:\s*)(\S+)/) || [])[1];
    rows.push({ name: tidy(nameLines.join(' ')), specialty: 'Rechtsanwalt', practice: (cells.right || []).filter((l) => !l.words.some((w) => w.italic)).map((l) => l.text).join(' '),
      area: tidy(areaLines.join(', ')), languages: langsOf(langLine), languageLine: langLine, section, ...(url ? { url } : {}), page: band.page.n });
  }
  return rows;
};

/**
 * German Embassy Dushanbe, "Liste von Rechtsanwaelten im Amtsbezirk" (Stand 20.11.2025), from the
 * heading "Anwaltsliste" on page 2.
 *
 * Unruled: a bold firm name across the page, then two columns split at 296pt, the address and
 * contacts on the left, Fachrichtung and Korrespondenzsprachen on the right. The covering note to
 * the Bar is the last block and is not a firm.
 */
LAYOUTS['de-tj-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }, { x: 296, key: 'right' }];
  let started = false;
  const pagesFrom = pages.map((p) => {
    if (started) return { ...p, words: p.words.filter((w) => w.yc > 60 && w.yc < 760) };
    const h = p.words.find((w) => w.t === 'Anwaltsliste' && w.bold);
    if (!h) return { ...p, words: [] };
    started = true;
    return { ...p, words: p.words.filter((w) => w.yc > h.yc + 5 && w.yc < 760) };
  });
  const recs = boldStartRecords(pagesFrom, { cols, skip: (l) => /^Weitere Auskünfte|^die folgende Stelle/.test(l.text) });
  return recs.map((r) => {
    const left = (r.cells.name || []);
    const name = left.filter((l) => l.bold).map((l) => l.text).join(' ');
    const right = (r.cells.right || []).map((l) => l.text).join(' ');
    const m = right.match(/Korrespondenzsprachen:\s*(.+?)(?:Bereitschaft|$)/);
    const areaLines = left.filter((l) => !l.bold).map((l) => l.text).filter((t) => !CONTACT.test(t) && !/^Ansprechpartner|^mobil|@/.test(t));
    return { name: tidy(name), specialty: 'Rechtsanwalt', practice: right.replace(/Korrespondenzsprachen.*$/, ''), area: tidy(areaLines.join(', ')),
      languages: m ? langsOf(m[1]) : [], languageLine: m ? m[1] : '', page: r.page };
  }).filter((r) => !/Präsidium|Kollegium/.test(r.name));
};

/**
 * German Embassy Abidjan, "Liste der Uebersetzer / Liste des traducteurs" (Stand Dezember 2025).
 *
 * Four ruled rows, two columns split at 312pt: the translator (bold) and contacts left, the
 * language pair right in German then French ("Franzoesisch / Deutsch / Englisch"). The first name
 * was lost to the covering note in the text reading because the note and the first row share a
 * block; the rule at 436pt separates them. French is the local language.
 */
LAYOUTS['de-ci-translators'] = (pages) => {
  const cols = [{ x: 0, key: 'left' }, { x: 312, key: 'right' }];
  const rows = [];
  const bands = ruledBands(pages, { rowsX: [80, 300], top: 430, bottom: 750 });
  for (const band of bands) {
    if (!band.ruledAbove) continue;
    const cells = cellsOf(band.words, cols);
    const left = cells.left || [];
    if (!left.length || !left[0].bold) continue;
    const langLine = (cells.right || [])[0] ? cells.right[0].text : '';
    const areaLines = left.slice(1).map((l) => l.text).filter((t) => !CONTACT.test(t) && !/^\+?\d[\d\s/]+$/.test(t) && !/^Responsable/.test(t));
    rows.push({ name: tidy(left[0].text), specialty: 'Uebersetzer', area: tidy(areaLines.join(', ')), languages: langsOf(langLine), languageLine: langLine, page: band.page.n });
  }
  return rows;
};

/**
 * Consulat general de France a Washington, "Liste d'avocats francais ou francophones" (liste de
 * notoriete, 2026-09-11).
 *
 * Six ruled columns: Nom et Prenom (9-68pt) | Specialite juridique (70-155) | Adresse du cabinet
 * (158-233) | Coordonnees (235-454) | Langues parlees (457-510) | Zone de competence (513-573).
 * Rows are double-ruled (two rules 2pt apart), and every cell is centred on its own, which is why
 * the text readings put Friedman's languages beside Haar's name. The name cell is SURNAME then
 * first name on separate lines; the address cell also carries the firm on its first lines.
 */
LAYOUTS['fr-us-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }, { x: 69, key: 'spec' }, { x: 156.5, key: 'area' }, { x: 234, key: 'contact' }, { x: 455.5, key: 'lang' }, { x: 511.5, key: 'zone' }];
  const rows = [];
  const bands = ruledBands(pages, { rowsX: [12, 66], top: 60, bottom: 820 });
  for (const band of bands) {
    if (!band.ruledAbove || !band.ruledBelow) continue;
    const cells = cellsOf(band.words, cols);
    const nameLines = (cells.name || []).map((l) => l.text);
    if (/^Nom et/.test(nameLines[0] || '') || !nameLines.length) continue;
    // SURNAME (capitals) and first name, in whichever order the lines came.
    const upper = nameLines.filter((t) => t === t.toUpperCase());
    const other = nameLines.filter((t) => t !== t.toUpperCase());
    // "Edward B.FRIEDMAN": the initial and the surname are two lines set without a space between.
    const name = tidy([...other, ...upper].join(' ').replace(/\b([A-Z])\.(?=[A-Z])/g, '$1. '));
    const langLine = cellText(cells, 'lang');
    const areaAll = (cells.area || []).map((l) => l.text);
    const contact = cellText(cells, 'contact');
    const url = ((contact.match(/\bwww\.[\w.-]+/) || [])[0] || '').replace(/\.$/, '');
    const badUrl = /\.(com|net|org)\.(com|net|org)$/i.test(url);
    rows.push({ name, specialty: 'Avocat', practice: cellText(cells, 'spec'), area: tidy(areaAll.join(' ')), languages: langsOf(langLine), languageLine: langLine,
      zone: cellText(cells, 'zone'), ...(url && !badUrl ? { url } : {}), page: band.page.n });
  }
  return rows;
};

/**
 * Ambassade de France au Danemark, "Liste de traducteurs jures ayant depose leur signature au
 * consulat" (mise a jour decembre 25).
 *
 * One ruled row per translator: Nom (46pt) | Societe/Site (173) | Adresse (336) | E-mail (520) |
 * Telephone (691). The rows carry no language: the claim is the page that publishes the list,
 * "Traducteurs et interpretes francophones", declared in the manifest as a roster of French.
 */
LAYOUTS['fr-dk-translators'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }, { x: 170, key: 'firm' }, { x: 333, key: 'area' }, { x: 518, key: 'email' }, { x: 688, key: 'phone' }];
  const rows = [];
  const bands = ruledBands(pages, { rowsX: [50, 160], top: 180, bottom: 480 });
  for (const band of bands) {
    if (!band.ruledAbove) continue;
    const cells = cellsOf(band.words, cols);
    const name = cellText(cells, 'name');
    if (!name || /^Nom$/.test(name)) continue;
    const firm = cellText(cells, 'firm');
    const url = /^(https?:|www\.)/.test(firm) ? firm : '';
    rows.push({ name: tidy(name), specialty: 'traducteur ' + (url ? '' : firm), area: cellText(cells, 'area'), languages: [], languageLine: '', ...(url ? { url } : {}), page: band.page.n });
  }
  return rows;
};

/**
 * U.S. Embassy Bogota, "Attorneys List" (Updated June 2026). Not a layout problem: the existing
 * reader separates the entries. Read here only to count what the list holds per city section,
 * because no entry has a postal address and the ingest (rightly) refuses a row it cannot show one
 * for. Rows come out with the section heading as `section` and an empty area.
 */
LAYOUTS['us-co-lawyers'] = (pages) => {
  const cols = [{ x: 0, key: 'name' }];
  const rows = [];
  let section = ''; let cur = null;
  for (const page of pages) {
    for (const l of linesOf(page.words.filter((w) => w.yc > 120 && w.yc < 760))) {
      if (l.words.every((w) => w.bold) && /\/|^ARCHIPI|^BOGOTA|^MEDELLIN|^CALI|^CARTAGENA|^SANTA MARTA|^BARRANQUILLA|^[A-Z ,.]+ \/ DEPARTMENT/.test(l.text) && !/:/.test(l.text)) { section = l.text; cur = null; continue; }
      if (l.words.every((w) => w.bold) && l.text === l.text.toUpperCase() && !/:/.test(l.text) && l.text.length > 3) {
        cur = { name: tidy(l.text), section, languageLine: '', specialty: 'Attorney', area: '', page: page.n }; rows.push(cur); continue;
      }
      if (cur && /^Languages:/.test(l.text)) cur.languageLine = l.text.replace(/^Languages:\s*/, '');
      if (cur && /^Specialization:/.test(l.text)) cur.specialty = 'Attorney ' + l.text.replace(/^Specialization:\s*/, '');
    }
  }
  rows.forEach((r) => { r.languages = langsOf(r.languageLine); });
  return rows.filter((r) => !/^(ATTORNEYS LIST|IMPORTANT)/.test(r.name));
  void cols;
};

// ---------------------------------------------------------------------------------------------
// Word documents
// ---------------------------------------------------------------------------------------------

/** Paragraphs of a .docx, with drawings removed and bold kept. */
const docxParagraphs = (file) => {
  let xml;
  try { xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 1 << 28 }); } catch (e) {
    console.error('not a readable .docx: ' + file); process.exit(1);
  }
  const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&');
  // An anchored picture carries its offsets as text nodes (<wp:posOffset>033972500</wp:posOffset>),
  // and so does the text box inside it. Both go before anything is read.
  const clean = xml.replace(/<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g, '').replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, '')
    .replace(/<w:pict>[\s\S]*?<\/w:pict>/g, '');
  return clean.split(/<\/w:p>/).map((p) => {
    const runs = [...p.matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)].map((m) => m[0]);
    const text = unesc(runs.map((r) => (r.match(/<w:t[^>]*>[^<]*<\/w:t>|<w:tab\/>|<w:br[^>]*\/>/g) || [])
      .map((t) => (/^<w:t/.test(t) ? t.replace(/<[^>]+>/g, '') : ' ')).join('')).join('')).replace(/\s+/g, ' ').trim();
    const bold = runs.length > 0 && runs.filter((r) => /<w:t/.test(r)).every((r) => /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(r) || /<w:pStyle w:val="Heading/.test(p));
    return { text, bold };
  }).filter((p) => p.text);
};

/**
 * U.S. Embassy Ulaanbaatar, "Medical Facilities Serving Foreigners in Ulaanbaatar" (Updated
 * February 10, 2025).
 *
 * Blocks: a bold facility name, "Location: ...", then prose, hours and phones. The language claim
 * is in the prose and only in four blocks ("Staff members speak English", "English is spoken by 85%
 * of staff", "a Mongolian dentist who speaks excellent English", "most of staff speak English"),
 * read with the lexicon's own speaking-sentence reader, so "Anhaar English" (an app) is not a claim.
 * The Public/State hospital blocks carry no claim and give nothing; the provincial ones are outside
 * Ulaanbaatar and have no address either.
 */
const DOCX_LAYOUTS = {};
DOCX_LAYOUTS['us-mn-medical'] = (paras) => {
  const LABEL = /^(Location|Office Hours|Work Hours|Phones?|Tel|Fax|Email|Emergenc\w*|Reception|Appointment Service|Website|Office Phone)\b/i;
  const recs = [];
  let cur = null;
  for (const p of paras) {
    const isName = p.bold && !LABEL.test(p.text) && p.text.length < 80 && !/^(MEDICAL FACILITIES|Public\/State|The following|Want to be|Download|A nurse|Saturday)/i.test(p.text)
      && !/^\S+:\s/.test(p.text) && !/^\d/.test(p.text);
    // A bold line straight after a name that reads as an address is the address of that block, not
    // a facility: the Zaisan branch of SOS Medica is written "SOS Medica Mongolia - Zaisan Branch"
    // then "Khan Uul District, 1 khoroo, Zaisan Center, Second Floor, Ulaanbaatar, Mongolia".
    const isAddress = cur && !cur.lines.length && /District|khoroo|Floor|Street|Ulaanbaatar/i.test(p.text);
    if (isName && !isAddress) { cur = { name: p.text.replace(/\s*[-\u2013]\s*$/, ''), lines: [] }; recs.push(cur); continue; }
    if (cur) cur.lines.push(isAddress && !/Location:/i.test(p.text) ? 'Location: ' + p.text : p.text);
  }
  // Erdenet is 320 km from Ulaanbaatar and the provincial hospitals further still.
  return recs.filter((r) => !/Erdenet|Province|Darkhan/i.test(r.name)).map((r) => {
    const loc = r.lines.find((t) => /Location:/i.test(t)) || '';
    const addr = loc.replace(/^.*?Location:\s*/i, '').split(/\.\s+(?=The |It )/)[0];
    const prose = r.lines.filter((t) => !LABEL.test(t)).join(' ');
    const languages = L.readLanguagesProse(prose);
    return { name: tidy(r.name), specialty: /dental/i.test(r.name) ? 'dental clinic' : 'medical clinic', area: tidy(addr), languages,
      languageLine: (prose.match(/[^.]*\bspeak[^.]*\./i) || prose.match(/[^.]*\bspoken[^.]*\./i) || [''])[0].trim() };
  });
};

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

const cmd = argv[0];
if (cmd === 'layouts') {
  console.log([...Object.keys(LAYOUTS), ...Object.keys(DOCX_LAYOUTS).map((k) => k + ' (docx)')].join('\n'));
  process.exit(0);
}
if (cmd === 'words') {
  const pages = loadPdf(argv[1]);
  const only = val('--page', '');
  for (const p of pages) {
    if (only && String(p.n) !== only) continue;
    console.log('=== page ' + p.n + ' (' + Math.round(p.w) + 'x' + Math.round(p.h) + ')');
    console.log('rules ' + [...new Set(p.hr.map(([a, y, b]) => 'y' + Math.round(y) + ':' + Math.round(a) + '-' + Math.round(b)))].join(' '));
    for (const l of linesOf(p.words)) {
      const runs = [];
      l.words.forEach((w) => {
        const st = (w.bold ? 'B' : '') + (w.italic ? 'I' : '');
        const last = runs[runs.length - 1];
        if (last && w.x0 - last.x1 < 4 && last.st === st) { last.t += ' ' + w.t; last.x1 = w.x1; } else runs.push({ x0: w.x0, x1: w.x1, t: w.t, st });
      });
      console.log(String(Math.round(l.yc)).padStart(5) + ' ' + runs.map((r) => '[' + Math.round(r.x0) + r.st + ']' + r.t).join('  '));
    }
  }
  process.exit(0);
}

const file = argv[0];
const layout = val('--layout', '');
if (!file || !layout) {
  console.error('usage: node scripts/parse_pdf_positions.cjs <file> --layout <name> [--section <regex>] [--json]\n'
    + '       node scripts/parse_pdf_positions.cjs words <file.pdf> [--page N]\n       node scripts/parse_pdf_positions.cjs layouts');
  process.exit(2);
}
let rows;
if (/\.docx$/i.test(file)) {
  if (!DOCX_LAYOUTS[layout]) { console.error('no docx layout ' + layout); process.exit(2); }
  rows = DOCX_LAYOUTS[layout](docxParagraphs(file));
} else {
  if (!LAYOUTS[layout]) { console.error('no layout ' + layout + '; see: layouts'); process.exit(2); }
  rows = LAYOUTS[layout](loadPdf(file));
}
const sectionRe = val('--section', '');
if (sectionRe) rows = rows.filter((r) => new RegExp(sectionRe, 'i').test(r.section || ''));

/**
 * The standing limit: a provider claiming more than six languages is refused whole, not trimmed.
 * Amal Alrashdi Lawyers (Abu Dhabi) lists English, Arabic, French, Urdu, Hindi, Punjabi, Tamil,
 * Sinhalese and Italian. The row is kept for the record with no language, so the ingest drops it
 * as unannotated, and says why.
 */
rows.forEach((r) => {
  if ((r.languages || []).length > 6) { r.refused = 'more than six languages: ' + r.languages.join(','); r.languages = []; }
});
// A roster-only list's rows have no language of their own; a claim is never made up here.
rows.forEach((r) => { r.languages = r.languages || []; if (r.languageLine === undefined) r.languageLine = ''; });
// See asciiText: the address is folded so the ingest's town reader can see the town.
rows.forEach((r) => { r.area = asciiText(r.area); });

if (has('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  rows.forEach((r) => console.log('  ' + String(r.name).slice(0, 38).padEnd(40) + (r.languages.join(',') || '-').padEnd(10)
    + String(r.area).slice(0, 60).padEnd(62) + '| ' + String(r.languageLine || '').slice(0, 30) + (r.section ? ' [' + r.section + ']' : '')));
  console.log('\n' + rows.length + ' rows, ' + rows.filter((r) => r.languages.length).length + ' with a language of their own'
    + (unknownLangs.size ? '; words not in the lexicon: ' + [...unknownLangs].join(', ') : ''));
}
