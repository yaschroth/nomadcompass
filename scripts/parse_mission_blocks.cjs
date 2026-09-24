/**
 * Reads a consular provider list written as a run of entries, one block of lines each, where the
 * shape is described on the command line rather than guessed.
 *
 * Written on 2026-09-24 for the lists the Italian (esteri.it), Polish (gov.pl) and Spanish
 * (exteriores.gob.es) missions publish. Fifty of them were waiting and the existing readers found
 * next to nothing in them, each for its own reason:
 *
 *   - The Italian consulate in Munich prints 180 sworn translators as "AGOSTA Antonio" over
 *     "Schutzenstr. 3 - 80335 Munchen" over a telephone line, with no blank line anywhere and the
 *     e-mail set to the right of the name. The block readers want blank lines; the column readers
 *     want a gutter. Read with pdftotext -raw the list is perfectly regular: an entry opens at a
 *     surname in capitals.
 *   - The Polish lists write the claim in Polish ("Jezyki: z/na j. polski, j. turecki", "(j. polski)")
 *     and head their professions in Polish (adwokat, radca prawny, tlumacz, notariusz), none of which
 *     the shared lexicon or the ingest's category table can read.
 *   - The Italian lists for Egypt, Tunisia and India make no claim for the list as a whole. They
 *     mark the entries that speak Italian, "(*)" or "(PARLA ITALIANO)", and an unmarked entry on
 *     such a list has no claim at all.
 *
 * So the manifest says what an entry looks like, with parserArgs, and this reader applies it. It
 * never decides whether a list is a roster: a roster's language is the manifest's rosterLanguage,
 * and a row from here carries only what its own entry says.
 *
 * Usage: node scripts/parse_mission_blocks.cjs <file.pdf|.docx|.html|.txt> [options] [--json]
 *
 * Text:
 *   --layout             pdftotext -layout instead of -raw. -raw keeps the order the entry was
 *                        written in and is the default; -layout is for a list whose columns are one
 *                        entry each and whose raw order interleaves them.
 *   --from <re>          ignore everything before the first line matching <re> (the page's own
 *                        preamble, the disclaimer, the site's menu on an HTML page).
 *   --until <re>         ignore everything from the first line matching <re> after the start.
 *   --skip <re>          drop every line matching <re> (page furniture: running titles, page numbers).
 * Entries:
 *   --start <re>         a line matching <re> opens an entry and is its name.
 *   --blank              no start pattern: entries are blocks separated by blank lines (a Word table
 *                        row is one block, so this is the setting for a .docx table).
 *   --heading <re>       a line matching <re> is a section heading, not an entry or part of one.
 *   --name-join <re>     lines right under the name that match <re> are the rest of the name: the
 *                        Lithuanian list sets the surname over the given name, "Aganauskiene" over
 *                        "Agata", and the Greek list "ASSIMAKIS" over "Georgios".
 *   --name-re <re>       group 1 of <re> on the opening line is the name; whatever else the line
 *                        holds is read as the entry's next line (a town set in front of the name,
 *                        a street set after it).
 *   --name-at <n>        the name is the entry's line <n> (0-based) rather than its first, for a list
 *                        whose entries open with a label ("Tlumacz", "Specializzazione: ...").
 *   --name-label <re>    the name is the value of the line labelled <re> ("Nome e Cognome:").
 * Fields:
 *   --addr-label <re>    the address is the value of the line labelled <re> and the unlabelled lines
 *                        under it; without it the address is the run of lines that look like one.
 *   --lang-label <re>    a line starting with <re> holds a list of languages ("Lingue", "Jezyki",
 *                        "Languages", "Idiomas"). Read with the lexicon below; a hedged language
 *                        ("base", "podstawowy", "basic") is dropped, not kept.
 *   --mark <re>=<codes>  an entry whose text matches <re> speaks <codes> ("\(\*\)=it"). Repeatable.
 *   --drop <codes>       languages never returned, comma-separated: the country's own. A Latvian
 *                        lawyer's Latvian is true and useless here, and it is what the directory
 *                        promises never to print.
 *   --spec-label <re>    the value of the line labelled <re> is the entry's specialty.
 *   --place-from-heading pass the section heading along as `detail`, for a list that heads each town
 *                        and leaves it out of the address. Only for lists whose headings are towns.
 *
 * Each row: { name, area, languages, specialty, heading, detail?, url?, lines }.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));

const argv = process.argv.slice(2);
const file = argv[0];
if (!file || !fs.existsSync(file)) { console.error('usage: node scripts/parse_mission_blocks.cjs <file> [options] [--json]'); process.exit(2); }
const opt = (k) => { const i = argv.indexOf(k); return i > 0 ? argv[i + 1] : ''; };
const opts = (k) => argv.map((a, i) => (a === k ? argv[i + 1] : null)).filter((x) => x != null);
const re = (k, flags = 'iu') => (opt(k) ? new RegExp(opt(k), flags) : null);
const START = re('--start', 'u');
const HEADING = re('--heading', 'u');
const NAME_JOIN = re('--name-join', 'u');
const NAME_RE = re('--name-re', 'u');
const NAME_AT = opt('--name-at') ? Number(opt('--name-at')) : 0;
const NAME_LABEL = re('--name-label');
const ADDR_LABEL = re('--addr-label');
const LANG_LABEL = re('--lang-label');
const SPEC_LABEL = re('--spec-label');
const SKIP = re('--skip', 'u');
const FROM = re('--from', 'u');
const UNTIL = re('--until', 'u');
const END = re('--end', 'u');
const OFFICE = re('--office-label');
const PERSON_GUARD = argv.includes('--person-guard');
const COLS = opt('--cols');
const REFUSE = re('--refuse', 'u');
const LANG_TAIL = argv.includes('--lang-tail');
const NAME_CUT = re('--name-cut', 'u');
const LANG_PAREN = argv.includes('--lang-paren');
const INLINE = argv.includes('--inline');
// --nl-postcode: a Dutch postcode is four digits and two letters, "1017 CA Amsterdam", and the ingest
// reads the letters as the town. Written without the space, as the Dutch also write it, the town
// after it is found by name.
const NL_POSTCODE = argv.includes('--nl-postcode');
const BLANK = argv.includes('--blank');
const PLACE_FROM_HEADING = argv.includes('--place-from-heading');
const DROP = new Set(opt('--drop').split(',').filter(Boolean));
const MARKS = opts('--mark').map((m) => { const i = m.lastIndexOf('='); return { re: new RegExp(m.slice(0, i), 'u'), codes: m.slice(i + 1).split(',') }; });

// ---------------------------------------------------------------- text
// The named entities for the letters these lists use: the Oslo page writes "Br&oslash;ttorkaia".
const NAMED = { oslash: 'ø', Oslash: 'Ø', aelig: 'æ', AElig: 'Æ', aring: 'å', Aring: 'Å', auml: 'ä', Auml: 'Ä', ouml: 'ö', Ouml: 'Ö', uuml: 'ü', Uuml: 'Ü', szlig: 'ß',
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È', ecirc: 'ê', agrave: 'à', Agrave: 'À', aacute: 'á', acirc: 'â', iacute: 'í', igrave: 'ì', icirc: 'î', oacute: 'ó', ograve: 'ò', ocirc: 'ô',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç', euml: 'ë', iuml: 'ï', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', hellip: '...', middot: '·', bdquo: '„', sbquo: ',', ndash: '-', mdash: '-', rsquo: "'" };
const unesc = (s) => s.replace(/&([A-Za-z]+);/g, (x, n) => (NAMED[n] !== undefined ? NAMED[n] : x)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ').replace(/&#8211;|&ndash;/g, '-').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8203;/g, '')
  .replace(/&#(\d+);/g, (x, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&');
const textOf = () => {
  if (/\.pdf$/i.test(file)) {
    // -table is Xpdf's reading for a real table: every row of every column on one line. The
    // Lithuanian list's cells are vertically centred and -layout and -raw both drift them apart.
    const mode = argv.includes('--table') ? '-table' : argv.includes('--layout') ? '-layout' : '-raw';
    const out = path.join(os.tmpdir(), 'mblk-' + path.basename(file).replace(/\W+/g, '') + mode + '.txt');
    execFileSync('pdftotext', [mode, '-enc', 'UTF-8', file, out], { stdio: ['ignore', 'ignore', 'pipe'] });
    return fs.readFileSync(out, 'utf8');
  }
  if (/\.docx$/i.test(file)) {
    // A Word field code is text the document never shows: the Hamburg list's hyperlinks arrive as
    // 'HYPERLINK "mailto:..."' in front of the address they link, so instrText goes before anything.
    const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8', maxBuffer: 1 << 28 });
    // A table row ends in a blank line and nothing else does: a cell's empty paragraphs would
    // otherwise cut one row into several entries for --blank.
    const t = unesc(xml.replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '')
      .replace(/<\/w:tr>/g, '\u0003').replace(/<\/w:tc>/g, '\n').replace(/<w:br\s*\/?>/g, '\n')
      .replace(/<w:tab\s*\/?>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, ''));
    return /\u0003/.test(t) ? t.replace(/(?:[ \t ]*\n)+/g, '\n').replace(/\u0003/g, '\n\n') : t;
  }
  if (/\.html?$/i.test(file)) {
    const h = fs.readFileSync(file, 'utf8');
    // A table row ends in a blank line, so that --blank reads one row as one entry.
    // A newline in the HTML source is only a space; the page's own breaks are its tags.
    // Every other run of breaks is one break, so a cell's own empty paragraphs do not split a row;
    // a blank line then means a row ended, or a paragraph that the page itself left empty.
    return unesc(h.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/\s*\n\s*/g, ' ')
      .replace(/<\/tr>/gi, '\u0003').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|td|th|ul|ol|table|section|article)>/gi, '\n')
      .replace(/<(p|div|li|h\d|tr|td|th)\b[^>]*>/gi, '\n').replace(/<(?:strong|b)\b[^>]*>/gi, '\u0002').replace(/<[^>]+>/g, ''))
      .replace(/(?:[ \t ​]*\n)+/g, '\n').replace(/\u0003/g, '\n\n');
  }
  return fs.readFileSync(file, 'utf8');
};

const ZW = new RegExp('[' + String.fromCharCode(0x200b, 0x200c, 0x200d, 0xfeff, 0x00ad) + ']', 'g');
const WIDE = new RegExp('[' + String.fromCharCode(0x00a0, 0x2007, 0x202f, 0x3000) + '\\t]', 'g');
// Runs of spaces are kept on a -layout reading, because there they are the columns (--name-re can
// cut a name off at them), and folded everywhere else.
const LAYOUT = argv.includes('--layout') || argv.includes('--table');
let lines = textOf().split(/\r?\n/).map((l) => l.replace(/\f/g, '').replace(ZW, '').replace(WIDE, ' ').replace(LAYOUT ? /\s+$/ : /\s+/g, ' ').trim());
// --bold-start: on an HTML page, an entry opens at a line that begins in bold (the Oslo page sets
// each firm's name in <strong> and nothing else about it). The mark is kept at the start of a line
// only, where the start test sees it, and taken off everywhere else before anything is read.
const BOLD_START = argv.includes('--bold-start');
const BOLD = String.fromCharCode(2);
lines = lines.map((l) => { const b = BOLD_START && l.trimStart().startsWith(BOLD) && l.replace(/[\u0002\s]/g, ''); return (b ? BOLD : '') + l.split(BOLD).join('').trim(); });
const plain = (l) => l.split(BOLD).join('');
// --replace <from>=<to>, repeatable: a literal repair of what the PDF's font did to a word. The
// Copenhagen list's font draws the Danish o-with-stroke as a zero, "2100 K0benhavn 0", and no
// town reads out of that.
opts('--replace').forEach((r) => { const i = r.indexOf('='); const a = r.slice(0, i); const b = r.slice(i + 1); lines = lines.map((l) => l.split(a).join(b)); });
if (FROM) { const i = lines.findIndex((l) => FROM.test(plain(l))); if (i >= 0) lines = lines.slice(i + 1); }
if (UNTIL) { const i = lines.findIndex((l) => UNTIL.test(plain(l))); if (i >= 0) lines = lines.slice(0, i); }
if (SKIP) lines = lines.map((l) => (SKIP.test(plain(l)) ? '' : l));
// A page number alone on a line is furniture on every list.
lines = lines.map((l) => (/^(?:\d{1,3}|\d+\s*\/\s*\d+|-\s*\d+\s*-|pag(?:e|ina)?\.? \d+(?: (?:of|di|z|de) \d+)?)$/i.test(l) ? '' : l));

// ---------------------------------------------------------------- languages
/**
 * The words for a language in Polish, and the Italian ones the shared lexicon does not yet hold.
 *
 * scripts/lib/languages_spoken.cjs is the lexicon and these belong in it; they are here because
 * this file was written while another reader was being edited against it. A Polish adjective
 * declines ("polski", "polskim", "polskiego"), so these are stems and are matched as the start of
 * a word. Folded: accents off and the stroked l read as l, because NFD leaves the stroke on.
 */
const EXTRA = {
  angielsk: 'en', niemieck: 'de', polsk: 'pl', rosyjsk: 'ru', francusk: 'fr', hiszpansk: 'es',
  wlosk: 'it', litewsk: 'lt', lotewsk: 'lv', tureck: 'tr', arabsk: 'ar', chinsk: 'zh', greck: 'el',
  norwesk: 'no', dunsk: 'da', niderlandzk: 'nl', holendersk: 'nl', ukrainsk: 'uk', czesk: 'cs',
  slowack: 'sk', wegiersk: 'hu', szwedzk: 'sv', portugalsk: 'pt', japonsk: 'ja', albansk: 'sq',
  hebrajsk: 'he', finsk: 'fi', estonsk: 'et', rumunsk: 'ro', bulgarsk: 'bg', chorwack: 'hr',
  serbsk: 'sr', slowensk: 'sl', gruzinsk: 'ka', koreansk: 'ko', wietnamsk: 'vi',
  lettone: 'lv', lituano: 'lt', sloveno: 'sl', esloveno: 'sl', estone: 'et', georgiano: 'ka',
  sloveni: 'sl', ebraic: 'he', catalano: 'ca',
};
const fold = (s) => String(s || '').replace(/[łŁ]/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const KEYS = Object.entries({ ...L.LANG, ...EXTRA }).filter(([k]) => k.length >= 4 || ['lao'].includes(k)).sort((a, b) => b[0].length - a[0].length);
const codeOfWord = (w) => { const hit = KEYS.find(([k]) => w.startsWith(k)); return hit ? hit[1] : ''; };
// A level that is not a claim. "italiano (base)", "angielski w stopniu podstawowym", "Spanish (basic)".
const HEDGE = /\b(bas[ei]|basic\w*|basico|scolastic\w*|elementar\w*|podstaw\w*|komunikatywn\w*|biern\w*|limit\w*|poco|un po|some|little|intermediate|intermedio|sredni\w*|nozion\w*|pasiv\w*)\b/;
// The ISO codes themselves, which a list may write instead of names: "Obsluga w jezyku: EN, FR, NL,
// ES, PL" (the Leuven notary on the Belgian list). Read only where the whole value is codes.
const ISO = new Set(Object.values({ ...L.LANG, ...EXTRA }));
const readLangs = (value) => {
  const keep = []; const drop = [];
  if (/^\s*[A-Z]{2}(?:\s*[,/;]\s*[A-Z]{2})+\.?\s*$/.test(value)) {
    value.match(/[A-Z]{2}/g).map((c) => c.toLowerCase()).forEach((c) => { if (ISO.has(c) && !keep.includes(c)) keep.push(c); });
    return { keep, drop };
  }
  // Cut into groups at commas and the words for and; a level in brackets stays with its group.
  fold(value).replace(/\)\s*/g, '),').split(/[,;/|+&]+|\s(?:i|e|y|and|oraz|und|et)\s/).forEach((seg) => {
    const words = seg.replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).filter((w) => w.length >= 3 && !/^(jezyk\w*|lingu\w*|idioma\w*|language\w*|parla\w*|habla\w*|mowi\w*|posluguj\w*|biegl\w*|fluent\w*|madrelingua|nativ\w*|ojczyst\w*|spoken)$/.test(w));
    const codes = [...new Set(words.map(codeOfWord).filter(Boolean))];
    if (!codes.length) return;
    (HEDGE.test(seg) ? drop : keep).push(...codes);
  });
  return { keep: [...new Set(keep)].filter((c) => !drop.includes(c)), drop: [...new Set(drop)] };
};

// ---------------------------------------------------------------- entries
const entries = [];
let heading = '';
const isHeading = (l) => !!HEADING && HEADING.test(plain(l));
if (COLS) {
  /**
   * --cols <n>[,<m>]: a table whose first column (characters 0 to n) is the name and whose second
   * (n to m) is the address and contacts; a third column, if any, is the practice and is not read.
   * The name is --name-lines lines of the first column (default 2: the Lithuanian list sets the
   * surname over the given name), plus one more for each line that ends on a dash, "Juskeviciute -"
   * over "Viliene" over "Agne". An entry runs until the next name starts.
   */
  const [c1, c2] = opt('--cols').split(',').map(Number);
  const want = opt('--name-lines') ? Number(opt('--name-lines')) : 2;
  let cur = null;
  const raw = textOf().split(/\r?\n/).map((l) => l.replace(/\f/g, '').replace(ZW, '').replace(WIDE, ' '));
  let from = FROM ? raw.findIndex((l) => FROM.test(l)) + 1 : 0;
  let to = UNTIL ? raw.findIndex((l, k) => k >= from && UNTIL.test(l)) : -1;
  if (to < 0) to = raw.length;
  for (const l of raw.slice(Math.max(from, 0), to)) {
    if (SKIP && SKIP.test(l)) continue;
    // With n = 0 the first column is whatever a line holds at the margin up to its first gap of two
    // spaces: the column's width moves from page to page and "Juskeviciute -" fills it.
    const cut = c1 ? c1 : (/^\S/.test(l) ? ((l.match(/\s{2,}/) || { index: l.length }).index) : 0);
    const left = l.slice(0, cut).trim();
    const mid = l.slice(cut, c2 || undefined).trim();
    if (left && (!cur || cur.nameParts.length >= cur.want)) {
      if (cur) entries.push(cur);
      // A whole name on one line ("Aneta Blazevic") is the whole name; waiting for a second line
      // took the next lawyer's surname as her given name and shifted every pair after it.
      cur = { heading, nameParts: [], want: (/\S\s+\S/.test(left) && !/[-\u2013]$/.test(left)) ? 1 : want, lines: [] };
    }
    if (!cur) continue;
    if (left && cur.nameParts.length < cur.want) {
      cur.nameParts.push(left);
      if (/[-\u2013]$/.test(left)) cur.want += 1;
    }
    if (mid) cur.lines.push(mid);
  }
  if (cur) entries.push(cur);
  // A name over two or more lines is surname over given name, the Lithuanian Bar's order
  // ("Aganauskiene" over "Agata"); a name on one line is already in reading order ("Aneta Blazevic").
  entries.forEach((e) => {
    const parts = e.nameParts.length > 1 ? [e.nameParts[e.nameParts.length - 1], ...e.nameParts.slice(0, -1)] : e.nameParts;
    e.lines = [parts.join(' ').replace(/\s*[-\u2013]\s+/g, '-').replace(/\s+-/g, '-'), ...e.lines];
  });
} else if (BLANK) {
  let block = [];
  const flush = () => { if (block.length) entries.push({ heading, lines: block }); block = []; };
  for (const l of lines) {
    if (!l) { flush(); continue; }
    if (!block.length && isHeading(l)) { heading = l.split(/\s{2,}/)[0]; continue; }
    block.push(l);
  }
  flush();
} else if (END && !START) {
  // --end <re>: a line matching <re> is the last line of an entry, and the next entry opens on the
  // line after it. The Italian embassy's Bratislava table closes every row with the e-mail and has
  // nothing else that marks where one translator stops.
  let cur = [];
  for (const l of lines) {
    if (!l) continue;
    if (!cur.length && isHeading(l)) { heading = l.split(/\s{2,}/)[0]; continue; }
    // A second e-mail right after the first is the same translator's, not a translator of its own.
    if (!cur.length && END.test(l) && entries.length) { entries[entries.length - 1].lines.push(l); continue; }
    cur.push(l);
    if (END.test(l)) { entries.push({ heading, lines: cur }); cur = []; }
  }
  if (cur.length) entries.push({ heading, lines: cur });
} else {
  if (!START) { console.error('give --start <re>, --end <re> or --blank'); process.exit(2); }
  let cur = null;
  for (const l of lines) {
    if (!l) continue;
    if (isHeading(l)) { if (cur) entries.push(cur); cur = null; heading = l.split(/\s{2,}/)[0]; continue; }
    // A name set over two or three lines in capitals ("ALARFAJ & PARTNERS LAW" / "FIRM") matches the
    // start pattern on every line of it. While nothing but name has been read, a line that --name-join
    // accepts is more of the same name, not the next entry.
    if (cur && cur.nameOnly && NAME_JOIN && NAME_JOIN.test(l)) { cur.lines.push(l); continue; }
    if (START.test(l)) { if (cur) entries.push(cur); cur = { heading, lines: [l], nameOnly: true }; continue; }
    if (cur) { cur.lines.push(l); cur.nameOnly = false; }
  }
  if (cur) entries.push(cur);
}

entries.forEach((e) => { e.lines = e.lines.map(plain); if (e.heading) e.heading = plain(e.heading); });

// ---------------------------------------------------------------- fields
// "Str. internetowa:" is the Polish for web page, not a street (the Riga list).
const CONTACT = /^(?:tel|tel\.|telefon\w*|tfno|telf|phone|fax|faks|fax\.|cell|cel|cellulare|mobile?|mob|kom|kom\.|gsm|e-?mail|email|mail|web|www\.|https?:|sito|strona|str\.\s*internetowa|pec|recapit\w*|whatsapp|m:|t:|f:|e:|w:)/i;
// A bullet opens a statement about the provider, never a line of its address.
const BULLET = /^[•·▪➢●*-]\s/u;
const LABELLED = /^[\p{L} ./()-]{2,40}:\s*/u;
// What an address line looks like in these lists: a postcode, a house number after a street word,
// or one of the street words the Italian, Polish, Spanish and local addresses use.
const STREETISH = /\b(ul\.|ulica|al\.|aleja|pl\.|str\.|stra(?:ss|ß)e|strasse|weg|platz|gasse|allee|ring|via|viale|piazza|piazzale|corso|largo|vicolo|rue|avenue|av\.|avda|boulevard|bd\.|blvd|street|st\.|road|rd\.|lane|drive|terrace|square|calle|c\/|plaza|paseo|carrer|rua|g\.|gatve|iela|bulvaris|bulvāris|laukums|prospekts|cad\.|caddesi|sok\.|sokak|mah\.|mahallesi|level|suite|floor|piano|piętro|pietro|building|bldg|tower|p\.?o\.? box|namesti|nam\.|trg|ulica|ulice|vei|veien|gate|gata|gade|vej|odos|leoforos|chome|bis)(?:(?<=\.)|\b)/iu;
// The German street word is the end of a longer one, "Vangerowstrasse 33", where \b cannot see it.
const STREET_SUFFIX = /\p{Ll}(?:str\.?|stra(?:ss|ß)e|weg|platz|gasse|allee|ring|damm|ufer|markt|graben)\s*\d/u;
// A street with no street word, only a name and a house number: "Politechniou 47", "Sfakion 60".
// The whole line and nothing else, so a sentence with a number in it is not an address.
const STREET_BARE = /^\p{Lu}[\p{L}.'’ -]{2,40} \d{1,4}[\p{L}]?,?$/u;
// The last is an Irish Eircode, "D02 AK51", which has no run of digits for the others to find.
const POSTCODE = /\b(?:[A-Z]{1,2}-)?\d{2}-\d{3}\b|\b\d{3} ?\d{2,3}\b|\b\d{4,6}\b|\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b|\b[AC-FHKNPRTV-Y]\d{2}\s?[AC-FHKNPRTV-Y\d]{4}\b/;
// A postcode and a town after it: the line an address ends on.
// Or the English-speaking order, town then state or county code then postcode: "Los Angeles, CA 90025",
// "Sydney NSW 2000".
// And the Indian, town then a six-digit PIN: "Pune 411 007", "Mumbai - 400010".
const TOWN_LINE = /(?:\b(?:[A-Z]{1,2}-)?\d{2}-\d{3}|\b\d{3} ?\d{2}|\b\d{4,6})\s+[\p{Lu}][\p{L}.'’-]+|\p{L},?\s+[A-Z]{2,3}\s+\d{4,5}\b|\b\p{Lu}\p{L}+,?\s*[-\u2013]?\s*\d{3}\s?\d{3}\b|\b\p{Lu}\p{L}+\s+(?:\d{1,2}\s+)?[AC-FHKNPRTV-Y]\d{2}\s?[AC-FHKNPRTV-Y\d]{4}\b/u;
// But a house number at the start of a line with a street word in it is a street, not a postcode:
// "12121 Wilshire Blvd., suite 1103" is followed by "Los Angeles, CA 90025".
const US_STREET = /\b(?:Blvd|Boulevard|Ave|Avenue|Street|St|Road|Rd|Drive|Dr|Lane|Ln|Way|Place|Pl|Parkway|Pkwy|Highway|Hwy|Terrace|Court|Ct|Plaza|Circle|Suite|Ste|Floor)\b/i;
// A British postcode closes an address too: "32-36 May Street, Belfast, BT1 4NZ".
const isTownLine = (l) => {
  if (/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/.test(String(l))) return true;
  const m = String(l).match(TOWN_LINE);
  if (!m) return false;
  if (m.index === 0 && /^\d/.test(l) && US_STREET.test(l)) return /\p{L},?\s+[A-Z]{2,3}\s+\d{4,5}\b/u.test(l);
  return true;
};
// Judged with the e-mail and the web address taken off: a -layout line carries them to the right of
// the town, "65185 WIESBADEN   0178 9807711   acitog@googlemail.com".
// And with the telephone numbers taken off. The Spanish list for Baden-Wuerttemberg sets them on the
// street's line, "Wilhelmstr. 14 0049-7131-2040082 Fax", and a number is the one thing on it that
// looks most like a postcode. A number here starts with + or 00 or a 0 trunk prefix and runs on.
// Also the Polish "22/ 8413675" (area code, slash, number) and a bare run of nine digits.
const PHONE = /(?:^|\s)(?:(?:\+|00)\s?\d[\d\s()/.\u2013-]{5,}\d|0\d{2,5}\s?[/-]?\s?\d[\d\s/\u2013-]{3,}\d|\d{2,3}\/\s?\d{6,8}|\d{9})(?:\s*(?:Fax|fax|M[oó]vil|Secretariado|\(?(?:cell|mob)\.?\)?))?/g;
const noPhones = (l) => String(l).replace(PHONE, ' ').replace(/\s{2,}/g, ' ').trim();
// A web address written without http or www: "stuttgart-anwaltskanzlei.com/alexander-fischer.html"
// put a firm in Stuttgart by way of its domain before its own town was read.
const BARE_DOMAIN = /\b[\w-]+(?:\.[\w-]+)*\.(?:com|de|es|it|pl|net|org|eu|info|at|ch|fr|gr|uk|ae|sa|lt|lv|hr|sk|si|be|nl|no|dk|au|in|jp|tn|ma|eg|dz|lb|cy|ie|al|tr|cn|hu|il|jo)(?:\/\S*)?(?=\s|$)/gi;
// The e-mail leaves a mark behind rather than a space, so that the telephone before it cannot run on
// into the postcode after it: "+36 30 4635453 csapo@gmail.com 1125, Budapest" lost its 1125.
const noLinks = (l) => noPhones(String(l).replace(/[\w.+-]+@[\w.-]+\.\w{2,}/g, ' ; ').replace(/\b(?:https?:\/\/|www\.)\S+/gi, ' ; ').replace(BARE_DOMAIN, ' ; '))
  .replace(/(?:\s*;\s*)+/g, '  ').replace(/\s{2,}/g, '  ').replace(/^[\s,]+|[\s,]+$/g, '').trim();
const looksLikeAddress = (l0) => {
  const l = noLinks(l0);
  // A Japanese block number opens the line: "1-3-7 Shiromi, Chuo-ku".
  return !!l && !CONTACT.test(l) && !/@/.test(l) && (STREETISH.test(l) || STREET_SUFFIX.test(l) || POSTCODE.test(l) || STREET_BARE.test(l) || /^\d{1,4}(?:-\d{1,4}){1,2}\s+\p{Lu}/u.test(l)) && !/^[+(]?\d[\d\s()./-]{7,}$/.test(l);
};

// The Polish, Italian and Spanish words for what a provider is, glossed in English for the ingest's
// category table, which reads English, German and French. "adwokat" is not "avocat".
const GLOSS = [
  [/\b(adwokat\w*|radc\w* prawn\w*|prawni\w*|kancelari\w* (?:adwokack|prawn|radcowsk)\w*|avvocat\w*|studio legale|studi legali|legale|abogad\w*|despacho\w*)\b/iu, 'lawyer'],
  [/\b(notariusz\w*|kancelari\w* notarialn\w*|notai[oa]?|notaio|notario)\b/iu, 'notary'],
  [/\b(t[lł]umacz\w*|biur\w* t[lł]umacze\w*|tradutt\w*|interpret\w*|traductor\w*|int[eé]rprete\w*)\b/iu, 'translator'],
  [/\b(lekarz\w*|medic[oi]|medico|medica|m[eé]dic[oa]s?|doktor)\b/iu, 'doctor'],
  [/\b(\w*odontist\w*|dentyst\w*|stomatolog\w*|dentist[ai]|odontoiatr\w*|odont[oó]log\w*)\b/iu, 'dentist'],
  [/\b(psycholog\w*|psicolog\w*|psycolog\w*|psicoterap\w*|psychoterap\w*)\b/iu, 'psychologist'],
  // The specialties in Italian, Spanish and Polish that the ingest's table, written from German,
  // English and French lists, does not see: "Fisioterapia", "Ginecologia", "Oftalmologia".
  [/\b(fisioterap\w*|fizjoterap\w*|osteopat\w*|kinesiolog\w*|logoped\w*)\b/iu, 'physiotherapist'],
  [/\b(ginecolog\w*|ostetric\w*|oftalmolog\w*|oculist\w*|pediatr\w*|internist\w*|medicina interna|anestesiolog\w*)\b/iu, 'doctor'],
  [/\b(veterinar\w*|weterynar\w*)\b/iu, 'veterinary'],
  [/\b(accountants?|commercialist\w*|consulenza\s+(?:societaria,\s+)?fiscale|doradc\w* podatkow\w*|asesor\w* fiscal\w*)\b/iu, 'tax adviser'],
];
const gloss = (s) => GLOSS.filter(([r]) => r.test(s || '')).map(([, w]) => w);

const BUSINESS = /\b(LAW|LEGAL|STUDIO|CLINIC|DENTAL|HOSPITAL|MEDICAL|CENTER|CENTRE|GROUP|PARTNERS?|ASSOCIATES|OFFICE|LLC|LLP|FIRM|KANCELARIA|BIURO|ADVOKAT\w*|AVVOCATI|TRANSLATIONS?|SERVICES?|& |AND)\b/;
const tc = (s) => s.toLowerCase().replace(/(^|[ '’-])(\p{Ll})/gu, (x, a, b) => a + b.toUpperCase());
const cleanName = (n) => {
  // The letters the ingest's ASCII fold gets wrong in capitals: it writes both the Polish L-with-stroke
  // and the Turkish dotted I as small letters, so "MARSZALEK" came out "MARSZAlEK" and "IMGE" "imge".
  // Quotation marks are dropped: a card cannot close a quote that the name only opens.
  let out = String(n).replace(/Ł/g, 'L').replace(/ł/g, 'l').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/Đ/g, 'D').replace(/đ/g, 'd')
    .replace(/Ø/g, 'O').replace(/ø/g, 'o').replace(/Æ/g, 'AE').replace(/æ/g, 'ae').replace(/["“”„«»]/g, '')
    .replace(/^\s*(?:[•·▪*\-]\s*)+/, '')
    .replace(/^\d{1,3}\s*[.)]\s*/, '')
    // What the lawyer practises, set after a dash: "D'Amore Michael (parla italiano) - civilista".
    .replace(/\s+[\u2013-]\s+(?:\*\*)?\p{Ll}.*$/u, '')
    .replace(/\s*[\u2013\u2014-]\s*$/, '')
    .replace(/[\s,;:]+$/, '');
  // A bracket after the name says what the person is or speaks, "(adwokat)", "(j. polski)",
  // "(PARLA ITALIANO)". The ingest refuses a bracket in a name, and it is not part of one.
  // A colon inside a caps firm name is typography, "ASSESSEUR: LAW FIRM AND CONSULTANCY", and the
  // ingest refuses a name holding one.
  out = out.replace(/\s*\([^()]*\)\s*/g, ' ').replace(/:\s+/g, ' ').replace(/\s*\(\*?\)?\s*$/, '').replace(/\s*\*+\s*/g, ' ').replace(/\s+/g, ' ').trim();
  // "SURNAME Given" (Munich, Frankfurt, Slovakia) reads "Given SURNAME", which is how the directory
  // prints the Italian and Polish lists it already holds. Not where the capitals name a business.
  // The Spanish courtesy titles, "Dna. Maria Eugenia CASTRO PEREZ, Abogada" and "D. Jose Ramon TENT",
  // and the profession after the comma. "D." only before a written-out name, so that "D. H. Law
  // Associates" keeps its initials.
  out = out.replace(/^D(?:ñ|n)a\.?\s+/u, '').replace(/^D\.\s+(?=\p{Lu}\p{Ll})/u, '')
    .replace(/,\s*(?:Abogad[oa]s?|Notari[oa]s?|Avocat(?:e)?|Rechtsanw\w*)\b.*$/iu, '');
  // A profession after a dash is what the person is, not part of who: "Laurent de Vuyst - Notariusz".
  out = out.replace(/\s+[-\u2013]\s+(?:notariusz|adwokat|radca prawny|t[lł]umacz|notai[oa]|avvocat[oa]|notario|abogad[oa])\w*$/iu, '');
  // "Kancelaria CAP Lawyers [PRUSZYNSKA Iwona]": the Australian list names the firm and, in square
  // brackets, the lawyer in it who speaks Polish. The claim is the lawyer's, so the lawyer is the name.
  const sq = out.match(/\[([^\]]+)\]\s*$/);
  if (sq) out = sq[1].trim();
  // "Esq." closes an American lawyer's name, and on the Los Angeles list the firm runs on straight
  // after it: "ALESSANDRA TARISSI DE JACOBIS, ESQ.AxM- Business and Legal Affairs Boutique".
  out = out.replace(/,?\s*\bEsq\b\.?.*$/i, '');
  // A degree after the name is not part of it: "GRAU Adriana LL.M." on the Hamburg list.
  out = out.replace(/,?\s*\b(?:LL\.?\s?M\.?|M\.?A\.?|Ph\.?D\.?|MBA)(?=\s|$)/g, '').trim();
  // A title in front stays in front, and the rest is turned round: "Dr. BIENIEK Reinhard".
  const t = out.match(/^((?:Dr|Prof|Avv|Mgr|Adw|Lic|Dott)\.?\s+)(.*)$/u);
  const title = t ? t[1] : '';
  if (t) out = t[2];
  const m = out.match(/^((?:(?:DE|DI|DA|DEL|DELLA|DALL'|DALLA|LO|LA|LE|VAN|VON|MC)\s*)?[\p{Lu}][\p{Lu}ß'’-]+(?:[ -][\p{Lu}][\p{Lu}ß'’-]+)*),?\s+((?:Dr\.?\s+|Prof\.?\s+)?[\p{Lu}][\p{Ll}][\p{L}.'’ -]*)$/u);
  // Nor where what follows is the kind of firm it is: "KNAP Lawyers", "PIETRZAK Solicitors".
  if (m && !BUSINESS.test(m[1]) && !/\b(?:Office|Translations?|Services|Clinic|Centre|Center|Group|Company)\b/.test(m[2]) && !/^(?:Lawyers|Solicitors|Legal|Law|Associates|Partners|Kancelaria|Avvocati|Abogados|Rechtsanw\w*)\b/i.test(m[2]) && m[1].replace(/[^\p{Lu}]/gu, '').length >= 2) out = m[2].trim() + ' ' + m[1];
  // --surname-first: the Polish lists for Brussels, Vilnius, Copenhagen and Belfast write a person
  // "Bogucka Ewa", surname first in ordinary case, where no capitals say which word is which. The
  // list says it, so the option does: the last word, the given name, goes to the front. Only a name
  // of two or three words with nothing in it that names a business.
  if (argv.includes('--surname-first') && !title && /^\p{Lu}[\p{L}'’-]+(?: \p{Lu}[\p{L}'’-]+){1,2}$/u.test(out)
    && !/\b(?:Law|Legal|Lawyers|Kancelaria|Advokat\w*|Adwokat\w*|Partners?|Associates|Solicitors|Firm|Office|Group|Konsulent|KONSULENT)\b/i.test(out)) {
    const w = out.split(' ');
    out = [w[w.length - 1], ...w.slice(0, -1)].join(' ');
  }
  // Quotation marks round a firm's name are typography: '"Cobalt Legal"' on the Riga list.
  return (title + out).replace(/^[\s"'“”„«»]+|[\s"'“”„«»]+$/g, '').replace(/\s+/g, ' ').trim();
};
const valueOf = (l, labelRe) => l.replace(labelRe, '').replace(/^[\s:.\-]+/, '').trim();

const rows = [];
const refused = [];
for (const e of entries) {
  let ls = e.lines.slice();
  // --refuse <re>: an entry the list holds that is not a provider this directory lists, or whose
  // claim is about somebody else. The Belgian list carries a licensed private detective, and a
  // lawyer whose note says only that "a person in the office speaks Polish".
  if (REFUSE && REFUSE.test(ls.join('\n'))) { refused.push({ name: ls[0], why: 'refused by --refuse' }); continue; }
  // Whether the name's own line went on into something else. If it did, the line under it is that
  // something continuing ("Tomas Kopecky Kadnarova" over "2530/50"), never the rest of the name.
  let hadRest = false;
  // --prefix-place: what the opening line holds in front of the name is the town, and it is added
  // to the end of the address. The Italian embassy's Poland table puts the town in its own column
  // ("WARSZAWA Renata CHLEBIO TALEVI ul. Ksiazkowa 7E/417") and the street never repeats it.
  let prefixPlace = '';
  if (NAME_RE) {
    const m = ls[0].match(NAME_RE);
    if (m) {
      const before = ls[0].slice(0, m.index).trim();
      const after = ls[0].slice(m.index + m[0].length).trim();
      hadRest = !!after;
      if (argv.includes('--prefix-place')) { prefixPlace = before; ls = [m[1], ...(after ? [after] : []), ...ls.slice(1)]; }
      else { const rest = (before + ' ' + after).trim(); ls = [m[1], ...(rest ? [rest] : []), ...ls.slice(1)]; }
    } else {
      // The opening line is not in the shape the list uses for a name. Printing the whole line as
      // one would publish "KRAKOW J.KORNECKA KACZMARCZYK", town and all; it is refused instead.
      refused.push({ name: ls[0], why: 'name not in the list shape' });
      continue;
    }
  }
  let nameIdx = NAME_AT;
  if (NAME_LABEL) { const k = ls.findIndex((l) => NAME_LABEL.test(l)); if (k < 0) continue; ls[k] = valueOf(ls[k], NAME_LABEL); nameIdx = k; }
  let name = ls[nameIdx] || '';
  const used = new Set([nameIdx]);
  // A profession alone on the opening line ("Rechtsanwalt", "Rechtsanwaelte und Notare") has the
  // name on the line under it; --name-re leaves the name empty and the next line is taken.
  if (!name.trim() && ls[nameIdx + 1]) { name = ls[nameIdx + 1]; used.add(nameIdx + 1); nameIdx += 1; }
  for (let j = nameIdx + 1; NAME_JOIN && !hadRest && j < ls.length && NAME_JOIN.test(ls[j]) && !looksLikeAddress(ls[j]) && !CONTACT.test(ls[j]); j += 1) {
    name += (/[-\u2013]$/.test(name) ? '' : ' ') + ls[j]; used.add(j);
  }
  // A name that stops on "&" or a hyphen goes on to the next line whatever that line looks like:
  // "Roggelin &" over "Partner Hamburg", "WLODARCZYK -ZIMNY" over "Aleksandra".
  if (!hadRest && /(?:&|\s-\p{Lu}+|[-\u2013])\s*$/u.test(name) && ls[nameIdx + 1] && !used.has(nameIdx + 1) && !looksLikeAddress(ls[nameIdx + 1]) && !CONTACT.test(ls[nameIdx + 1])) {
    name += ' ' + ls[nameIdx + 1]; used.add(nameIdx + 1);
  }
  // --name-cut <re>: the name stops where <re> begins, after any joining: "Bitter Advocatuur - Avv.
  // Jan Willem Bitter" is the firm, and "Avv. Umit Arslan Diritto Civile" is a lawyer and his field.
  if (NAME_CUT) { const m = name.match(NAME_CUT); if (m && m.index > 2) name = name.slice(0, m.index); }
  const body = ls.filter((x, j) => !used.has(j));
  const text = ls.join('\n');

  // Languages: the labelled list, then the entry's own markers.
  let keep = []; let hedged = [];
  if (LANG_LABEL) {
    for (let j = 0; j < body.length; j += 1) {
      if (!LANG_LABEL.test(body[j])) continue;
      let v = valueOf(body[j], LANG_LABEL);
      // A list that runs on to the next line: "Jezyki: lotewski, angielski," / "rosyjski, polski."
      // Or one that goes on in lower case: "Jezyki: wszystkie podstawowe" over "jezyki, w tym z/na j. polski".
      for (let k = j + 1; k < body.length && (/[,&]\s*$|\b(?:i|e|y|and|oraz)\s*$/i.test(v) || !v || (/^\p{Ll}/u.test(body[k]) && !LABELLED.test(body[k]))); k += 1) v += ' ' + body[k];
      const r = readLangs(v);
      keep.push(...r.keep); hedged.push(...r.drop);
    }
  }
  // Tested on the entry as the source wrote it: --name-re takes "(parla italiano)" off the name line.
  MARKS.forEach((mk) => { if (mk.re.test(e.lines.join('\n'))) keep.push(...mk.codes); });
  // --also <codes>: added to an entry that names languages of its own, for a roster list whose
  // entries name only their OTHER languages. The Jerusalem list is titled as translators between
  // Hebrew and Italian and each entry adds "Altre lingue: Francese, Inglese"; the ingest gives a row
  // with languages of its own nothing from the roster, so without this those translators would go
  // out as French and English only. Only where the entry named some: an empty one takes the roster
  // in the ingest, as before.
  if (keep.length && opt('--also')) keep.push(...opt('--also').split(','));
  // --lang-paren: the entry's languages in brackets and nothing else in them: "(inglese, arabo)",
  // "(italiano; inglese; arabo)" on the Cairo list. A bracket with any other word in it, "(Diritto di
  // Famiglia)", is not read at all.
  if (LANG_PAREN) {
    for (const m of text.replace(/\n/g, ' ').matchAll(/\(([^()]{3,120})\)/g)) {
      const words = fold(m[1]).split(/[^a-z]+/).filter((w) => w.length >= 1);
      const content = words.filter((w) => !/^(e|i|y|and|et|oraz)$/.test(w));
      const codes = content.map((w) => (w.length >= 4 ? codeOfWord(w) : ''));
      if (content.length && codes.every(Boolean) && !HEDGE.test(fold(m[1]))) keep.push(...codes);
    }
  }
  // --lang-tail: the list gives each entry's languages as a bare run of language names at the end of
  // a line, with no label: the Italian consulate in Los Angeles ends its second column
  // "...workers compensationITALIAN, SPANISH, ENGLISH". Read from the end of the line back for as
  // long as every word is a language (or "and"); a line that ends in anything else holds none.
  if (LANG_TAIL) {
    for (const l of body) {
      const words = l.replace(/([a-z])([A-Z]{3,})/g, '$1 $2').replace(/[|.]+\s*$/, '').split(/[\s,]+/).filter(Boolean);
      const tail = [];
      for (let w = words.length - 1; w >= 0; w -= 1) {
        const f = fold(words[w]).replace(/[^a-z]/g, '');
        if (/^(and|e|y|i)$/.test(f)) { tail.unshift(null); continue; }
        const c = f.length >= 4 ? codeOfWord(f) : '';
        if (!c || !KEYS.some(([k]) => f === k || (f.startsWith(k) && f.length - k.length <= 3))) break;
        tail.unshift(c);
      }
      const codes = tail.filter(Boolean);
      if (codes.length) keep.push(...codes);
    }
  }
  // More than six is counted on what the source claimed, the country's own language included:
  // dropping Arabic first would let a seven-language claim through as six.
  const tooMany = [...new Set(keep)].filter((c) => !hedged.includes(c)).length > 6;
  keep = [...new Set(keep)].filter((c) => !hedged.includes(c) && !DROP.has(c));
  hedged = [...new Set(hedged)];

  // Address: a labelled value, or the first run of lines that look like one.
  const isLang = (l) => LANG_LABEL && LANG_LABEL.test(l);
  const addressOf = (body) => {
  let addr = [];
  if (INLINE) {
    /**
     * --inline: the entry is one paragraph and the address sits in the middle of it, between the
     * practice areas and the telephone numbers: "Avv. Alaa Dakroury (Diritto Penale) - 39 Kasr El
     * Nile St. Mostafa Kamel Sq. - Cairo. Tel. +20 ...". The contacts and brackets come out, the
     * rest is cut into clauses, and the clauses that read as an address are kept, in order.
     */
    // The number goes with its label first, so that "Melbourne VIC 3000 Tel: 9600 2450" keeps the
    // postcode: taking the label off first left "3000  9600 2450" to be read as one number.
    const t = noLinks(body.join(' ').replace(/\b(?:Tel|Tel\.|Fax|Cell|Mob|Mobile|WhatsApp|Telefono|Cellulare)\b\s*[:.]?\s*[+(]?\d[\d\s()/.\u2013-]*\d/gi, ' '))
      .replace(/\([^()]*\)/g, ' ')
      .replace(/\b(?:Tel|Tel\.|Fax|Cell|Mob|E-?mail|Email|Website|Web|WhatsApp|indirizzo(?: al \p{L}+)?|Adresse|Lingua parlata e scritta)\b\s*[:.]?/giu, ' ')
      .replace(/[+(]?\d[\d\s()/.-]{7,}\d/g, ' ')
      .replace(/\s{2,}/g, ' ');
    const parts = t.split(/\s[\u2013-]\s|\.\s+(?=\p{Lu}|\d)|;\s*|\*/u).map((s) => s.replace(/^[\s,.:\u2013-]+|[\s,.:\u2013-]+$/g, '')).filter(Boolean);
    const isSpec = (s) => /\b(?:diritto|avv\.|partner|cassazione|penale|civile|commerciale|arbitrato|studio legale|law firm)\b/i.test(s) && !/\d/.test(s.replace(/\b(?:\d+(?:st|nd|rd|th)?)\b.*$/, ''));
    // A clause that opens with the practice areas and runs into the street keeps only the street:
    // "Diritto tributario, commerciale, ... arbitrato 12, Marashly Str. Zamalek".
    const trimmed = parts.map((s) => {
      if (!isSpec(s) && !/^(?:diritto|specializ)/i.test(s)) return s;
      const m = s.match(/(?:^|\s)(\d+[\p{L}]?,?\s+\p{Lu}.*)$/u);
      return m ? m[1] : s;
    });
    const kept = trimmed.filter((s) => !isSpec(s) && (looksLikeAddress(s) || /\d/.test(s) || (/^\p{Lu}[\p{L} .'-]{2,30}$/u.test(s) && !BUSINESS.test(s))));
    // A place name alone is only kept after something that already reads as an address.
    const out = [];
    kept.forEach((s) => { if (/\d/.test(s) || looksLikeAddress(s) || out.length) out.push(s); });
    return out.join(', ').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').slice(0, 160);
  }
  const labelled = ADDR_LABEL ? body.findIndex((l) => ADDR_LABEL.test(l)) : -1;
  if (labelled >= 0) {
    const k = labelled;
    addr.push(valueOf(body[k], ADDR_LABEL));
    // Stopped by the next field's label, a word of four letters or more and a colon: not by
    // "Sk. No:14/B", which is the Turkish way of writing a house number.
    for (let j = k + 1; j < body.length && j <= k + 3 && !CONTACT.test(body[j]) && !isLang(body[j]) && !/@/.test(body[j]) && !BULLET.test(body[j]) && !addr.some((a) => isTownLine(a)); j += 1) {
      // The town and the next field's label on one line: "Lausanne Telefon: +41 21 ..." (Swiss list).
      const cut = body[j].split(/\s(?:Telefon\w*|Tel\.?|Fax|e-?Mail|Homepage|Website)\s*:/i)[0];
      if (cut !== body[j]) { if (cut.trim()) addr.push(cut.trim()); break; }
      if (/^\p{L}{4,}[\p{L} ]*:\s/u.test(body[j])) break;
      addr.push(body[j]);
    }
  } else {
    // No label in this part of the entry (a second office of a firm whose first carried the
    // label): the address is read from what the lines look like, as on an unlabelled list.
    // --person-guard: a line that names somebody else ("KROSNO Marta FALUSZCZAK ul. Batorego 45A")
    // is the next row of a table whose columns slipped, not this entry's address. On the Poland
    // list it would have given Bozena Topolska of Krakow a street in Krosno.
    const other = (l) => PERSON_GUARD && /(?:^|\s)\p{Lu}\p{Ll}+(?: \p{Lu}\.?)? \p{Lu}[\p{Lu}-]{2,}(?:\s|$)/u.test(l);
    const k = body.findIndex((l) => looksLikeAddress(l) && !isLang(l) && !other(l));
    if (k >= 0) {
      // The street may sit on the line above the postcode with no number of its own, "Residence
      // Simenon" over "Rue Berckmans 89": take one line back where it is not the name or a label.
      let j0 = k;
      if (k > 0 && !CONTACT.test(body[k - 1]) && !LABELLED.test(body[k - 1]) && !isLang(body[k - 1]) && /\d/.test(body[k]) && !STREETISH.test(body[k]) && POSTCODE.test(body[k])) j0 = k - 1;
      // It ends at the line that gives the postcode and the town. Caterina Buratin has two offices on
      // the Munich list and the second one was read into the first as one address.
      // A telephone or an e-mail line between the street and the town is stepped over, not taken
      // as the end: the Spanish Heidelberg entry runs street, phone, "Secretariado", web, town.
      let bare = false;
      for (let j = j0; j < body.length && j < j0 + 6 && !isLang(body[j]) && !BULLET.test(body[j]); j += 1) {
        const l = noLinks(body[j]);
        if (j > k && other(body[j])) break;
        if (j > k && !looksLikeAddress(body[j])) {
          if (!l || CONTACT.test(body[j]) || /^(?:Fax|Secretariado|M[oó]vil)$/i.test(l)) continue;
          // A line of place name alone, with no postcode yet: "Politechniou 47" over "Salonicco"
          // (Greece), or "Office N. 14" over "Soham Complex" over "D.P. Road, Aundh" over
          // "Pune 411 007" (India). Taken, and the reading goes on, but only once: a second line
          // that is neither an address nor a contact ends it.
          if (!bare && addr.length && !addr.some((a) => isTownLine(a)) && /^\p{Lu}[\p{L} .'’-]{1,29}[\p{L}.]$/u.test(l) && !BUSINESS.test(l)) { addr.push(l); bare = true; continue; }
          break;
        }
        // The tail of a firm's name ahead of its street: 'Bersekersko kontora" Antakalnio g. 94-33'.
        // What follows the closing quote is the address; so is what follows an "Adres:" label.
        addr.push(l.replace(/^.*[”“"»]\s*,?\s*(?=\S*\s*\S)/u, '').replace(/^(?:Adres|Indirizzo|Direcci[oó]n|Address)\s*:\s*/i, ''));
        if (isTownLine(l)) break;
        // A postcode alone at the end of its line has its town on the next: "Usiakova 2, 841 01"
        // over "Bratislava" on the Slovak list.
        // And "A. Mickeviciaus g. 8, LT-44312" over "Kaunas, Lietuva".
        if (/(?:^|\s)\d{3} ?\d{2}$|(?:^|[\s-])\d{4,6}$/.test(l) && /^\p{Lu}[\p{L} .,'-]{2,30}$/u.test(body[j + 1] || '')) { addr.push(body[j + 1]); break; }
      }
    }
  }
  // The telephone that a layout reading leaves on the town's line goes too: "65185 WIESBADEN
  // 0178 9807711". Only a run at the very end, with seven digits in it and no letter, so that
  // "Tritis Septemvriou 124, 104 34 Atene" keeps its postcode.
  // A bullet after the town starts the practice areas: "60320 Frankfurt +49 ... * Diritto penale".
  // The contact labels are cut line by line, not on the joined address: "Kralja Drzislava 4/11
  // Cell.: ..." over "10000 Zagreb" lost the town when the cut was made after the join.
  let area = addr.map((l) => l.split(/\s[•▪➢●]\s/)[0].split(/(?:^|\s)(?:Tel|Tel\.|Telefon|Fax|Cell|Mobile?|kom\.|GSM|E-?mail)\b/i)[0].replace(/[,;\s]+$/, '')).filter(Boolean).join(', ')
    .replace(/[\w.+-]+@[\w.-]+\.\w{2,}/g, ' ').replace(/\b(?:https?:\/\/|www\.)\S+/gi, ' ')
    .replace(/\s+/g, ' ').replace(/[,;\s_]+$/, '').trim();
  for (let n = 0; n < 3; n += 1) {
    const m = area.match(/\s[+(]?0?[+0][\d\s()/.-]*$/);
    if (!m || (m[0].match(/\d/g) || []).length < 7) break;
    area = area.slice(0, m.index).replace(/[,;\s/-]+$/, '').trim();
  }
  if (prefixPlace && area && !fold(area).includes(fold(prefixPlace))) area += ', ' + prefixPlace;
  if (NL_POSTCODE) area = area.replace(/\b(\d{4}) ([A-Z]{2})\b/g, '$1$2');
  // Accents off, as the ingest takes them off for the card anyway. It matters for the placing: the
  // ingest reads the town after a postcode with [A-Za-z], so "1211 Geneve 3" was read as "Gen" and
  // a Geneva lawyer was refused for being somewhere else.
  area = area.replace(/[łŁ]/g, (c) => (c === 'ł' ? 'l' : 'L')).replace(/ø/g, 'o').replace(/Ø/g, 'O').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
  return area;
  };
  // --office-label <re>: a firm with several offices, each under a label ("Shanghai Office:",
  // "Hangzhou Office:"), is one row per office, because the Hangzhou office is where a reader in
  // Hangzhou goes. Without the option, or with one office, the first address is the entry's.
  const officeAt = OFFICE ? body.map((l, j) => (OFFICE.test(l) ? j : -1)).filter((j) => j >= 0) : [];
  const areas = officeAt.length > 1
    // From the label's own line, which on the Beirut list holds the address ("Indirizzo 2: Corniche
    // El Mazraa, Beirut"); a label line with nothing after it ("Shanghai Office:") reads as nothing.
    ? officeAt.map((j, n) => addressOf([body[j].replace(OFFICE, '').replace(/^[^:]{0,30}:\s*/, ''), ...body.slice(j + 1, officeAt[n + 1] || body.length)])).filter(Boolean)
    : [addressOf(body)];

  const specLine = SPEC_LABEL ? (body.find((l) => SPEC_LABEL.test(l)) || '') : '';
  const spec = specLine ? valueOf(specLine, SPEC_LABEL) : '';
  // Glossed from the heading, the specialty, the name's own bracket and the line under the name.
  const glosses = gloss([e.heading, spec, name.match(/\(([^)]*)\)/) ? name.match(/\(([^)]*)\)/)[1] : '', body[0] || ''].join(' '));
  const url = ((text.match(/\b((?:https?:\/\/|www\.)[^\s,;)]+)/i) || [])[1] || '').replace(/[.]+$/, '');
  for (const area of areas) {
  const row = {
    // --name-fix <read>=<right>, repeatable: a name the list sets against its own convention. The
    // Vilnius list puts surname over given name except for two lawyers whose given name comes first.
    name: opts('--name-fix').reduce((n, f) => { const i = f.indexOf('='); return n === f.slice(0, i) ? f.slice(i + 1) : n; }, cleanName(name)),
    area: area.slice(0, 160),
    languages: tooMany ? [] : keep.sort(),
    specialty: [e.heading, spec, ...new Set(glosses)].filter(Boolean).join(' / ').slice(0, 200),
    heading: e.heading,
    ...(PLACE_FROM_HEADING && e.heading ? { detail: e.heading } : {}),
    ...(url && !/esteri\.it|gov\.pl|exteriores\.gob\.es|justiz-dolmetscher|bravsearch/i.test(url) ? { url } : {}),
    lines: ls,
  };
  if (!row.name) continue;
  // A row whose claim was read and came to nothing is refused here rather than left empty, so that
  // a roster cannot hand it the list's language after its own entry hedged it.
  if (!row.languages.length && (hedged.length || tooMany)) { refused.push({ name: row.name, hedged, tooMany }); continue; }
  rows.push(row);
  }
}

if (argv.includes('--json')) {
  console.log(JSON.stringify({ rows, refused }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length + ' with a language of their own, ' + refused.length + ' refused');
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 38).padEnd(40) + (r.languages.join(',') || '-').padEnd(12)
    + r.area.slice(0, 58).padEnd(60) + (r.specialty || '').slice(0, 40)));
  refused.forEach((r) => console.log('  REFUSED ' + r.name + ' ' + JSON.stringify(r)));
}
