/**
 * Reads a German mission's list whose entries are blocks of labelled lines, wherever the language
 * claim sits in the block.
 *
 * This is the commonest shape of an Anwaltsliste outside Europe, and on 2026-09-24 about forty of the
 * lists the German missions publish for Turkey, Panama, Norway, Qatar, China, Ecuador, Peru, Paraguay,
 * Moldova, Iceland, Cambodia, Mozambique and Uzbekistan were in it. An entry is a firm or a person
 * set in bold, an address, contact lines and then a label:
 *
 *     Anadolu Hukuk & Danismanlik          <- bold
 *     Mustafa DORA LL.M Augsburg            <- bold
 *     Sezenler Cad.16 Kat: 4/1
 *     06400 Cankaya - Ankara
 *     Tel.: 0090-312-231 51 76
 *     Korrespondenzsprachen:                <- the label, alone on its line
 *     Deutsch, Englisch                     <- the claim, on the line under it
 *     Fachrichtung:
 *     Handelsrecht, Vertragsrecht
 *
 * scripts/parse_diplo_bold_run.cjs knows where these entries start and it read 27 of the Ankara
 * firms, and not one language: its label test wants the value on the same line as the label, and
 * the missions put it on the next one more often than not. The table reader wants a header row, and
 * most of these tables have none: they are tables used for layout, one firm per row, the address in
 * the first cell and the claim in the second.
 *
 * What this reader does that the others do not:
 *
 *   - A label on its own line takes the line under it as its value. That one rule is most of the
 *     languages on these lists.
 *   - A table row is a boundary. An entry never runs from one row into the next, so a cell of
 *     notes in the last row cannot become the address of the firm above it. A row that holds two
 *     bold names is two entries, which is how Panama sets its translators, two to a row.
 *   - A hedge is not a claim. "Englisch, Deutsch (Grundkenntnisse), Suaheli" is a lawyer who
 *     writes English and Swahili; "etwas Deutsch" and a language put in brackets on its own,
 *     "Tuerkisch, (Englisch)", are the same. The shared lexicon reads every one of those as the
 *     language, so the hedged part is taken out before it is read, and the entry keeps the rest.
 *   - The claim is also read where it is not labelled at all but is all the line says: the German
 *     mission in Ecuador writes "(Sprachen: spanisch, deutsch)" after the name, Paraguay writes
 *     "Korrespondenz in Deutsch, Spanisch und Englisch." and Mozambique puts "Deutsch, Portugiesisch"
 *     on a line of its own under the translator. A bare line counts only when every word on it is a
 *     language or a joining word, because a line that also says anything else is a sentence, and a
 *     language word in a sentence is not a claim.
 *
 * What it does not do: decide which city an entry is in or what it is. It hands on the section
 * heading as `specialty` and the address as `area`, and the ingest decides both, as it does for every
 * other reader.
 *
 * Usage: node scripts/parse_diplo_entry_blocks.cjs <page.html> [--json] [--names-not-bold]
 *   --names-not-bold  a paragraph whose first line is not a label, a contact or an address starts an
 *                     entry even when it is not bold. For the few pages that set no name in bold.
 */
const fs = require('fs');
const path = require('path');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_entry_blocks.cjs <page.html> [--json] [--names-not-bold]'); process.exit(2); }
const NAMES_NOT_BOLD = process.argv.includes('--names-not-bold');
const NAMES_ARE_HEADINGS = process.argv.includes('--names-are-headings');
let html = fs.readFileSync(file, 'utf8').replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ');

// The same guard as the bold-run reader: the premise is the ministry's CMS markup, and a page that
// does not use it is somebody else's list, which this reader has no business reading.
if (!/\brte__/.test(html)) {
  if (process.argv.includes('--json')) console.log(JSON.stringify({ rows: [] }, null, 1));
  else console.log('0 entries: this page does not use the German missions\' CMS markup');
  process.exit(0);
}
// The article only. The navigation and the footer are the same CMS and hold bold text too.
const mainAt = html.indexOf('<main');
if (mainAt > 0) html = html.slice(mainAt, html.lastIndexOf('</main>') > mainAt ? html.lastIndexOf('</main>') : undefined);

/**
 * Words the shared lexicon does not hold and these lists use. Kept here rather than added there,
 * because that file is shared by every reader and a change to it changes all of them; the lead can
 * move them across. Only languages the dataset has a code for: Azerbaijani and Uzbek are named on
 * these lists and have no code, so they are left unread rather than mapped to something near.
 */
const EXTRA = { tadschikisch: 'tg', kisuaheli: 'sw', georgisch: 'ka', lettisch: 'lv', litauisch: 'lt',
  estnisch: 'et', katalanisch: 'ca', slowenisch: 'sl', mazedonisch: '', hindi: 'hi', urdu: 'ur',
  bengalisch: 'bn', nepalesisch: 'ne', birmanisch: 'my', tagalog: 'tl', filipino: 'tl', malaiisch: 'ms' };

const unspace = (s) => s.replace(/\b(?:[A-Za-zÀ-ž] ){2,}[A-Za-zÀ-ž]\b/g, (m) => m.replace(/ /g, ''));
const text = (frag) => unspace(T.unentity(String(frag || '').replace(/<[^>]*>/g, ' ')).replace(/[\s​]+/g, ' ').trim());
const linesOf = (frag) => String(frag || '').replace(/<br\s*\/?>/gi, '\n').split('\n').map(text).filter(Boolean);

/**
 * A hedge taken out of a language line before it is read.
 *
 * Each pattern names the language it qualifies, so only that language goes. "Grundkenntnisse" and
 * "basic" in brackets after a language, "etwas" or "ein wenig" in front of one, and a language that
 * is nothing but a bracket of its own: "Tuerkisch, (Englisch)" is Antalya's way of saying some
 * English, and the brackets are the whole of how it says it.
 */
const LANGWORD = '[A-Za-zÄÖÜäöüß]{4,}';
const HEDGES = [
  new RegExp('\\b' + LANGWORD + '\\s*\\((?:[^()]*?(?:grundkenntnisse|basis|basic|etwas|wenig|gering|rudiment|passiv|auf nachfrage|auf anfrage|nach absprache|nach vereinbarung|on request|upon request|bei bedarf|schriftlich nicht|nur m[üu]ndlich|anf[äa]nger|einfach)[^()]*)\\)', 'gi'),
  new RegExp('\\b(?:und\\s+|sowie\\s+)?(?:etwas|ein\\s+wenig|wenig|ein\\s+bisschen|grundkenntnisse\\s+in|grundkenntnisse|basic|some|a\\s+little|limited|rudiment[äa]res)\\s+' + LANGWORD, 'gi'),
  new RegExp('\\(\\s*' + LANGWORD + '\\s*\\)', 'g'),
];
const withoutHedges = (s) => HEDGES.reduce((t, re) => t.replace(re, ' '), String(s || ''));

/**
 * The claim as the lexicon can read it.
 *
 * Panama writes its doctors' languages as a bracket on a line of its own, "(engl.)" or
 * "(deutschsprachig)", and once "(spanisch-, englisch- und griechischsprachig)". A bracket that is
 * the whole line is the claim, not a hedge on one, so it is unwrapped before the hedges are looked
 * for. The -sprachig ending and the hyphen of a shortened compound come off, and "deutschspr." is
 * German.
 */
const normaliseClaim = (s) => String(s || '').trim()
  .replace(/^\(\s*([^()]+?)\s*\)\.?$/, '$1')
  .replace(/([A-Za-zÄÖÜäöüß]+)sprachig(?:e|er|en)?\b/g, '$1')
  .replace(/([A-Za-zÄÖÜäöüß]+)spr\./g, '$1')
  .replace(/([A-Za-zÄÖÜäöüß]{3,})-(?=\s*(?:,|und\b|oder\b|$))/g, '$1');

// A line that is the claim itself, with nothing else on it: every part a language word.
const JOIN = /^(?:und|and|sowie|oder|y|e|et|,|;|\/|-|–|&|\+)$/i;
const langOfWord = (w) => {
  const f = L.fold(w).replace(/[^a-z]/g, '');
  if (!f) return null;
  if (Object.prototype.hasOwnProperty.call(EXTRA, f)) return EXTRA[f] || '';
  // An abbreviation only where the source wrote its full stop, as the shared reader does.
  if (/\.$/.test(w) && L.ABBREV[f]) return L.ABBREV[f];
  const hit = Object.keys(L.LANG).filter((k) => f.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  if (hit && f.length <= hit.length + 7) return L.LANG[hit];
  return null;
};
/**
 * Codes from a claim, after the hedges are out. The shared reader first, then the words it leaves
 * over looked up in EXTRA, so a line that names Tajik is not read as naming nothing.
 */
const readClaimValue = (value) => {
  /**
   * A hedge in front of a whole list qualifies all of it, or it may: "spricht etwas Deutsch,
   * Englisch, Franzoesisch, Arabisch" (an Algiers orthopaedist) does not say which of the four the
   * "etwas" is about. Where the source leaves it open the claim is not read at all.
   */
  if (/^\s*(?:etwas|ein\s+wenig|wenig|ein\s+bisschen|grundkenntnisse|basic|some|a\s+little|limited)\b/i.test(normaliseClaim(value))) return [];
  const clean = withoutHedges(normaliseClaim(value));
  const got = L.readLanguages(clean, false, unknownLangs);
  clean.split(/[,;/|+&]+|\bund\b|\band\b|\bsowie\b/i).forEach((p) => {
    const w = L.fold(p).replace(/[^a-z]/g, '');
    if (EXTRA[w] && !got.includes(EXTRA[w])) got.push(EXTRA[w]);
  });
  return got;
};
const isBareLanguageLine = (line) => {
  const s = normaliseClaim(String(line).replace(/^\*+|\*+$/g, '').replace(/:\s*$/, '').trim());
  if (!s || s.length > 140 || /\d|@|www\.|http/i.test(s)) return false;
  // Hedges and brackets are allowed on the line, since withoutHedges takes them off before reading.
  const tokens = withoutHedges(s).split(/(\s+|,|;|\/|–|-|&|\+)/).map((x) => x.trim()).filter(Boolean);
  if (!tokens.length) return false;
  let langs = 0;
  for (const t of tokens) {
    if (JOIN.test(t)) continue;
    const c = langOfWord(t);
    if (c === null) return false;
    langs += 1;
  }
  return langs > 0;
};

/**
 * The labels an entry's lines carry. The value may be on the same line or, where the label stands
 * alone, on the line below it.
 */
const LABEL = /^\s*\**\s*(Tel|Telefon|Telefonnummer|Telefax|Fax|Mobil|Mobiltelefon|Handy|Mob|Cel|Celular|Phone|WhatsApp|E-?Mail|Mail|Email|Homepage|Internet|Website|Webseite|Web|Anschrift|Adresse|Address|Postanschrift|Sprachen?|Sprachkenntnisse|Korrespondenz(?:sprachen?)?|Arbeitssprachen?|Fremdsprachen?|Languages?|Idiomas?|Fachrichtung(?:en)?|Fachgebiete?|Fachbereiche?|Spezialgebiete?|Spezialisierung(?:en)?|T[äa]tigkeitsschwerpunkte?|T[äa]tigkeitsbereiche?|Rechtsgebiete?|Schwerpunkte?|Qualifikationen|Sprechzeiten|B[üu]rozeiten|[ÖO]ffnungszeiten|Ansprechpartner(?:in)?|Kontakt(?:person)?|Sachgebiete?|Besucheradresse|Bereitschaft\b[^:：]*|Aufnahme\b[^:：]*|Rechtsreferendar\w*[^:：]*|Zulassung\w*|Notfall\w*)\.?\s*\**\s*[:：]\s*\**\s*(.*)$/i;
const FIELD = (label) => {
  const f = L.fold(label).replace(/[^a-z]/g, '');
  if (/^(sprache|sprachen|sprachkenntnisse|korrespondenz|korrespondenzsprachen?|arbeitssprachen?|fremdsprachen?|languages?|idiomas?)$/.test(f)) return 'languages';
  if (/^(tel|telefon|telefonnummer|mobil|mobiltelefon|handy|mob|cel|celular|phone|whatsapp|notfall)/.test(f)) return 'phone';
  if (/^(telefax|fax)$/.test(f)) return 'fax';
  if (/^(email|mail)$/.test(f)) return 'email';
  if (/^(homepage|internet|website|webseite|web)$/.test(f)) return 'url';
  if (/^(anschrift|adresse|address|postanschrift)$/.test(f)) return 'address';
  if (f === 'besucheradresse') return 'visit';
  if (/^sachgebiete?$/.test(f)) return 'practice';
  if (/^(fach|spezial|tatigkeit|rechtsgebiet|schwerpunkt|qualifikation)/.test(f)) return 'practice';
  return 'other';
};
// A label with nothing after it: its value is the next line.
const BARE_LABEL = /^\s*\**\s*(Sprachen?|Sprachkenntnisse|Korrespondenz(?:sprachen?)?|Arbeitssprachen?|Fremdsprachen?|Languages?|Idiomas?|Fachrichtung(?:en)?|Fachgebiete?|Fachbereiche?|Spezialgebiete?|Rechtsgebiete?|T[äa]tigkeitsschwerpunkte?|Schwerpunkte?|Anschrift|Adresse|Address|Bereitschaft\b[^:：]*|Aufnahme\b[^:：]*)\s*\**\s*[:：]?\s*\**\s*$/i;

// "Korrespondenz in Deutsch, Spanisch und Englisch." and "(Sprachen: spanisch, deutsch)": the claim
// written into a sentence or a bracket rather than set as a label.
const CLAIM_IN_LINE = [
  /\bKorrespondenz(?:sprachen?)?\s+(?:in|auf)\s+([^.()]+)/i,
  /\(\s*(?:Sprachen?|Sprachkenntnisse|Korrespondenzsprachen?)\s*[:：]\s*([^()]+)\)/i,
  /\b(?:spricht|sprechen|verstehen|versteht)\s+((?:[A-ZÄÖÜa-zäöüß]+(?:\s*(?:,|und|&)\s*)?){1,4})\s*[).]?\s*$/,
];

/**
 * A bold run that is not a name: the covering note's subheadings, a question, a date, a label.
 */
// A bar or chamber is where to complain, not a firm to hire: Istanbul lists the Istanbul Barosu and the
// Noterler Birligi above its lawyers, and on a roster page they would inherit the roster language.
const NOT_A_FIRM = /Barosu|Baro Ba|Noter(?:ler)? (?:Odas|Birli)|Bar Association|Law Society|kammer|Colegio de Abogados|Ordre des avocats|Legal Aid/i;
const NOT_AN_ENTRY = /^(Listen?\b|ADVERTENCIA|Aviso\b|Disclaimer|Deutschsprachige|Adressbuch|Sie befinden|Verzeichnis\b|Rechtsanw[äa]lte(?:\s+(?:in|im|und)\b|\s*:?\s*$)|Anw[äa]lte(?:\s+(?:in|im|und)\b|\s*:?\s*$)|[ÄA]rzt\w*\b|Zahn[äa]rzt\w*\b|[ÜU]bersetzer\w*\b|[ÜU]bersetzende|Dolmetscher\w*\b|Notare?\b|Kanzleien\b|Krankenh[äa]user\b|Vorwahl\b|Hinweis\b|Achtung\b|Bitte\b|Stand\b|Haftungsausschluss|Allgemeine|Wichtig|Die |Der |Das |Diese |Dieser |Wir |Sie |Es |Im |In |Bei |Nach |Zur |Zum |Für |Fuer |Von |Wie |Welche |Inwieweit|Bestehen|Gibt |Kann |Können |Sind |Ist |Hier |Weitere |I+\.\s|[IVX]+\.\s|\d+\.\s|[a-z]\)\s|Notruf|Rettungs|Polizei|Feuerwehr|Ambulanz|Name und|Name\b|Fachrichtung|Adresse|Kontakt|Tel\b|E-?Mail|Sprachen|Korrespondenz|Hotline|Notfall|Emergency|Information|Kooperations)/i;
// A bold list of practice areas is not a firm: Asuncion bolds "Strafrecht, Zivilrecht, Migration"
// under each lawyer, and each one came out as a lawyer of its own.
const PRACTICE_LIST = /^(?![^,]*(?:kanzlei|anwalt|anw[äa]lt|law|legal|abogad))(?:[^,]*recht\b[^,]*,|[^,]*,[^,]*recht\b|[A-ZÄÖÜ][a-zäöüß-]*recht(?:s\w*)?$)/i;
const BRANCH = /^(?:B[üu]ro|Zweigstelle|Zweigb[üu]ro|Niederlassung|Filiale|Au[ßs]enstelle|Branch|Weitere[s]? B[üu]ro)\b/i;
const IS_A_HEADING_WORD = /^(?:[ÄA]rzt(?:e|innen)?|Anw[äa]lte|Rechtsanw[äa]lte|Partner|Kontakt|Adresse|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Termine|Sprechzeiten|[ÖO]ffnungszeiten|ja|nein|yes|no)[,:]?$/i;

// The page, as a flat run of blocks with the table, row and cell they sit in.
const TOKEN = /<(\/?)(h[2-6]|p|li|tr|td|th|table|hr)\b([^>]*)>/gi;
const blocks = [];
{
  let row = 0;
  let table = 0;
  let cell = -1;
  let open = null;
  let m;
  const flush = (end) => {
    if (open) {
      const inner = html.slice(open.start, end);
      // A cell's loose text has no <br> to break it, and its source lines are the lines it shows.
      const lines = open.tag === 'td' && !/<br/i.test(inner) ? inner.split(/\n/).map(text).filter(Boolean) : linesOf(inner);
      blocks.push({ tag: open.tag, inner, lines, body: text(inner), row, table, cell });
    }
    open = null;
  };
  while ((m = TOKEN.exec(html))) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (/^(tr|table|hr)$/.test(tag)) {
      flush(m.index);
      if (!closing) {
        row += 1;
        if (tag === 'table') table += 1;
        if (tag === 'tr') cell = -1;
        blocks.push({ tag: 'boundary', lines: [], body: '', row, table, cell });
      } else if (tag === 'table') {
        // After a table the page is not in a cell any more.
        row += 1;
        cell = -1;
        blocks.push({ tag: 'boundary', lines: [], body: '', row, table, cell });
      }
      continue;
    }
    // Text set straight into a cell, with no paragraph around it, is a block of its own. Ankara's
    // POLATER entry writes its whole language cell that way, and a reader of paragraphs alone
    // found the firm and not its languages.
    if (/^(td|th)$/.test(tag)) { flush(m.index); if (!closing) { cell += 1; open = { tag: 'td', start: m.index + m[0].length }; } continue; }
    if (closing) { if (open && open.tag === tag) flush(m.index); continue; }
    flush(m.index);
    open = { tag, start: m.index + m[0].length };
  }
  flush(html.length);
}

const opensBold = (inner) => /^\s*(?:<(?!strong|b\b)[a-z]+\b[^>]*>\s*|<br\s*\/?>\s*)*<(?:strong|b)\b/i.test(inner);
const boldText = (inner) => linesOf((inner.match(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/i) || [])[1] || '')[0] || '';
const underlineText = (inner) => text((inner.match(/<[a-z]+\b[^>]*underline[^>]*>([\s\S]*?)<\/[a-z]+>/i) || [])[1] || '');
const isHeading = (b) => /^h[2-6]$/.test(b.tag) || (() => { const u = underlineText(b.inner); return !!u && u.length >= b.body.length - 1; })();
const looksLikeContactOrAddress = (l) => LABEL.test(l) || /\d/.test(l) || /@|www\.|https?:/i.test(l);

/**
 * A table that names its columns.
 *
 * Bolivia heads its doctor tables "Name | Fachrichtung | Sprachen" and puts each doctor's languages
 * in the third cell one per line, "Spanisch / Englisch / Deutsch". Read as loose lines those are
 * three bare language words and come out right; but the Fachrichtung cell, "Physiotherapeutin",
 * arrived as part of the address, where it was no use to the ingest deciding what she is. Where a
 * table's first row names its columns, each later cell is read as what its column says it is.
 */
const COLUMN_TYPE = (t) => {
  const f = L.fold(t).replace(/[^a-z ]/g, ' ').trim();
  if (/^(name|namen|vor ?und nachname|titel|kanzlei|arzt|arztin|nombre)\b/.test(f)) return 'name';
  if (/^(sprachen?|sprachkenntnisse|korrespondenzsprachen?|languages?|idiomas?)\b/.test(f)) return 'languages';
  if (/^(fachrichtung|fachgebiet|spezialisierung|specialty|speciality|especialidad|facharzt)/.test(f)) return 'specialty';
  if (/^(adresse|anschrift|kontakt|kontaktdaten|telefon|e ?mail|address|contact)/.test(f)) return 'contact';
  return '';
};
const columns = {};
{
  const byRow = {};
  blocks.forEach((b) => { if (b.tag === 'td') (byRow[b.table + ':' + b.row] = byRow[b.table + ':' + b.row] || []).push(b); });
  const seen = new Set();
  Object.values(byRow).forEach((cells) => {
    const t = cells[0].table;
    if (seen.has(t)) return;
    seen.add(t);
    const kinds = cells.map((c) => (c.body.length <= 40 && !/\d|@/.test(c.body) ? COLUMN_TYPE(c.body) : ''));
    // Istanbul heads its table "Name und Anschrift | Fachrichtung" and writes the claim inside the
    // Fachrichtung cell, so a name and a specialty column are enough.
    if ((kinds.includes('languages') && kinds.some((k) => k === 'name' || k === 'specialty'))
      || (kinds.includes('name') && kinds.includes('specialty'))) {
      columns[t] = { headerRow: cells[0].row, kinds: [] };
      cells.forEach((c, i) => { columns[t].kinds[c.cell] = kinds[i]; });
    }
  });
}
const columnOf = (b) => (columns[b.table] && b.row !== columns[b.table].headerRow ? columns[b.table].kinds[b.cell] || '' : null);

// --- cut the page into entries -----------------------------------------------------------------------
const entries = [];
let heading = '';
/**
 * --place-from-heading: the city a section heading names, handed on as `detail` so that the ingest
 * can place an entry whose address gives only a district. La Paz lists its doctors under "LA PAZ",
 * "AERZTE - MEDICOS COCHABAMBA" and "AERZTE - MEDICOS SANTA CRUZ" and most of the addresses under
 * them say "Calacoto" or "Obrajes" and never the city. The heading is the page's own statement of
 * where the entries under it are, so it is evidence, and it goes in `detail`, which the ingest reads
 * for placement and never prints. A heading that names none of our cities clears it, so a section
 * called "Beirut Suburb-Matn" cannot lend its entries to Beirut: it names Beirut, and that is why the
 * option is per list and chosen by someone who has read the headings.
 */
const PLACE_FROM_HEADING = process.argv.includes('--place-from-heading');
const CITY_WORDS = (() => {
  if (!PLACE_FROM_HEADING) return [];
  const M = require(path.join(__dirname, 'lib', 'service_data.cjs'));
  return Object.values(M.CITY).map((c) => L.fold(c.name)).filter((n) => n.length > 3).sort((a, b) => b.length - a.length);
})();
const placeNamedIn = (t) => {
  const f = ' ' + L.fold(t).replace(/[^a-z]+/g, ' ') + ' ';
  return CITY_WORDS.find((n) => f.includes(' ' + n.replace(/[^a-z]+/g, ' ') + ' ')) || '';
};
let place = '';
const setPlace = (t) => { if (PLACE_FROM_HEADING) place = placeNamedIn(t); };
let current = null;
/**
 * What a row says before its name, for a table that does not name its columns: the specialty cell
 * some missions put to the left of the name.
 */
let rowBefore = [];
for (const b of blocks) {
  if (b.tag === 'boundary') { current = null; rowBefore = []; continue; }
  if (!b.body) continue;
  if (columns[b.table] && b.row === columns[b.table].headerRow) continue;
  /**
   * --names-are-headings: Manila sets each firm's name as an h3 and everything about it in the
   * paragraphs under it. There the h3 is the entry, not a section.
   */
  if (NAMES_ARE_HEADINGS && /^h[3-6]$/.test(b.tag) && b.body.length >= 4 && b.body.length <= 120 && !NOT_AN_ENTRY.test(b.body)
    && !/^Seite\b/.test(b.body)) {
    current = { heading, place, specialty: '', name: b.body, lines: [], persons: [], row: b.row };
    entries.push(current);
    continue;
  }
  if (isHeading(b)) { heading = b.body.slice(0, 80); setPlace(heading); current = null; rowBefore = []; continue; }
  // "LA PAZ" over a table, in capitals on the first line of an ordinary paragraph, is a heading too.
  if (PLACE_FROM_HEADING && !current && /^[A-ZÄÖÜÁÉÍÓÚÑ][A-ZÄÖÜÁÉÍÓÚÑ .\-–]{2,40}$/.test(b.lines[0] || '') && placeNamedIn(b.lines[0])) {
    heading = b.lines[0]; setPlace(heading); rowBefore = []; continue;
  }
  // A rule drawn with underscores or dashes ends an entry. Algiers separates its doctors that way and
  // sets no name in bold, so without it one entry ran into the next.
  if (/^[_\-‐-―=.\s]{5,}$/.test(b.body)) { current = null; continue; }
  // A paragraph that is bold from end to end and is not a name is a section: "Augenaerzte",
  // "Kooperationsaerzte:". The next name starts a new entry under it.
  if (!(current && current.row === b.row && b.cell >= 0) && !BARE_LABEL.test(b.body) && !LABEL.test(b.body + ':')
    && opensBold(b.inner) && boldText(b.inner).length >= b.body.replace(/\s*\(.*\)\s*$/, '').length - 1
    && (NOT_AN_ENTRY.test(b.body) || /:\s*$/.test(b.body) || /(?:[äa]rzte|logen|iater|urgen|p[äa]den|heilkunde|medizin|therapeuten|labore)\b/i.test(b.body))) {
    heading = b.body.slice(0, 80); setPlace(heading); current = null; rowBefore = []; continue;
  }
  const col = columnOf(b);
  if (col === 'languages') {
    if (current) current.lines.push('Sprachen: ' + b.lines.join(', '));
    continue;
  }
  if (col === 'specialty') {
    if (current) { current.specialty = (b.lines[0] || '').slice(0, 120); current.lines.push(...b.lines.slice(0)); }
    else rowBefore.push(...b.lines);
    continue;
  }
  /**
   * The rest of a name cell is about the person, never where they are. Izmir writes the title and
   * the line "Bereitschaft deutsche Rechtsreferendare zur Ausbildung: JA" under each lawyer's name,
   * and read as loose lines that sentence became the first half of every address.
   */
  // Only where the table has a contact column of its own; Bolivia keeps the address in the name cell.
  const nameCellIsName = col === 'name' && columns[b.table].kinds.includes('contact');
  if (nameCellIsName && current && current.row === b.row) { current.persons.push(...b.lines); continue; }
  const bold = opensBold(b.inner) ? boldText(b.inner) : '';
  const first = b.lines[0] || '';
  let name = '';
  if (bold) {
    const tail = first === bold ? '' : first.slice(bold.length).replace(/^[\s,;:-]+/, '');
    const runsOn = /^[a-zäöüß]/.test(tail);
    const isLabel = LABEL.test(bold + ':') || BARE_LABEL.test(bold) || /^[:：]/.test(first.slice(bold.length).trim());
    if (!runsOn && !isLabel && !NOT_AN_ENTRY.test(bold) && !IS_A_HEADING_WORD.test(bold) && !/\?\s*$/.test(bold)
      && !isBareLanguageLine(bold) && !/@|^www\.|^https?:/i.test(bold) && !PRACTICE_LIST.test(bold) && !NOT_A_FIRM.test(bold) && bold.length >= 4 && bold.length <= 120) name = bold;
    else if (!current) continue;
  } else if ((NAMES_NOT_BOLD || col === 'name') && !current && !looksLikeContactOrAddress(first) && !isBareLanguageLine(first)
    && !NOT_AN_ENTRY.test(first) && first.length <= 90) {
    name = first;
  } else if (NAMES_NOT_BOLD && !current && /^(?:\d+\.\s*)?(?:Dr|Dra|Prof|Frau|Herr|Me|Ma[iî]tre)\.?\s/.test(first)) {
    // "1. Dr. Myriam REMILA Mob.: 0550 85 87 98": the number in front and the telephone behind are not
    // part of her name.
    name = first.replace(/^\d+\.\s*/, '').replace(/\s+(?:Mob|Tel|Fax|Mobil|Handy)\b.*$/i, '').trim();
  }
  // A second office of the firm above is not a firm of its own. Ankara sets "Buero/Zweigstelle in
  // Istanbul" in bold under a firm, and read as a name it took that firm's language cell. Its lines
  // are kept off the address as well: an entry has one address, the first one it gives.
  if (bold && BRANCH.test(bold)) { if (current) current.branch = true; continue; }
  /**
   * A second bold name straight under the first, in the same cell and before any address, is a
   * person at that firm: Guangzhou sets "ETR Law Firm Guangzhou" and then "Herr Florian LIANG" as two
   * bold paragraphs, and read as two entries the firm got nothing and the lawyer got its address.
   */
  if (name && current && !current.lines.length && current.row === b.row && current.cell === b.cell && b.cell >= 0) {
    current.persons.push(name);
    const restP = b.lines.slice(1);
    current.lines.push(...restP);
    continue;
  }
  if (name) {
    const before = rowBefore.join(', ');
    current = { heading, place, specialty: before && before.length <= 80 && !/\d|@/.test(before) ? before : '', name, lines: [], persons: [], row: b.row, cell: b.cell };
    rowBefore = [];
    entries.push(current);
    const rest = b.lines.slice(0);
    // A first line that is nothing but titles is the front of the name, not all of it: Istanbul writes
    // "Fr. Prof. Dr. Jur. Habil." over "Guelsuen AYHAN AYGOERMEZ".
    if (col === 'name') {
      rest.shift();
      while (/^(?:(?:Hr|Fr|Herr|Frau|Prof|Dr|Dres|Jur|Iur|Habil|h\.\s?c|Doç|Doc|Av|RA|RAin|med|LL\.?M)\.?\s*)+$/i.test(current.name) && rest.length) {
        current.name = current.name + ' ' + rest.shift();
      }
      // "Fr. Zuhal" over "DOENMEZER CAKIROGLU": a given name alone, and the surname in capitals below.
      const given = current.name.replace(/^(?:(?:Hr|Fr|Herr|Frau|Prof|Dr|Dres|Jur|Iur|Habil)\.?\s+)+/i, '');
      if (rest.length && given.split(/\s+/).length <= 2 && /^[A-ZÄÖÜÇŞĞİ][A-ZÄÖÜÇŞĞİ\s-]{2,}$/.test(rest[0]) && !/\d/.test(rest[0])) {
        current.name = current.name + ' ' + rest.shift();
      }
    }
    if (nameCellIsName) { current.persons.push(...rest); continue; }
    if (col === 'name') { current.lines.push(...rest); continue; }
    // The name's own line goes, and so does anything the name line carried after the bold.
    if (rest[0] === name) rest.shift(); else if (rest[0]) rest[0] = rest[0].slice(rest[0].indexOf(name) + name.length).replace(/^[\s,;:-]+/, '');
    /**
     * The other bold lines under a firm's name are its lawyers, not its address. "ARIHAN Law Office"
     * is followed by "Taylan ARIHAN" and "Can ARIHAN" in bold, and they arrived in front of the
     * street as though the street were called Can Arihan.
     */
    const bolds = [...b.inner.matchAll(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi)].map((x) => text(x[1])).filter(Boolean);
    while (rest.length && bolds.includes(rest[0]) && !/\d/.test(rest[0])) current.persons.push(rest.shift());
    current.lines.push(...rest.filter(Boolean));
    continue;
  }
  if (!current) { rowBefore.push(...b.lines); continue; }
  if (current.branch) { current.lines.push(...b.lines.filter((l) => LABEL.test(l) || BARE_LABEL.test(l) || isBareLanguageLine(l))); continue; }
  current.lines.push(...b.lines);
}

// --- read one entry -----------------------------------------------------------------------------------
const rows = entries.map((e) => {
  const fields = {};
  const plain = [];
  const claims = [];
  const lines = e.lines.map((l) => l.replace(/^\*+\s*|\s*\*+$/g, '').trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const bare = l.match(BARE_LABEL);
    if (bare && lines[i + 1] !== undefined && !LABEL.test(lines[i + 1])) {
      const f = FIELD(bare[1]);
      let value = lines[i + 1];
      i += 1;
      // A value that ends on a comma carries on over the next line: Ankara breaks its practice
      // areas mid-list, and the second half was read as part of the firm's address.
      // A practice label heads a whole list, one item to a line: Guangzhou bullets them.
      while (lines[i + 1] !== undefined && !LABEL.test(lines[i + 1]) && !BARE_LABEL.test(lines[i + 1])
        && (/[,;-]\s*$/.test(value) || (f === 'practice' && !/\d|@/.test(lines[i + 1]) && !isBareLanguageLine(lines[i + 1])))) {
        value += ' ' + lines[i + 1];
        i += 1;
      }
      if (f === 'languages') claims.push(value);
      else fields[f] = fields[f] ? fields[f] + ', ' + value : value;
      continue;
    }
    const m = l.match(LABEL);
    if (m) {
      const f = FIELD(m[1]);
      if (f === 'languages') { if (m[2]) claims.push(m[2]); continue; }
      if (m[2]) fields[f] = fields[f] ? fields[f] + ', ' + m[2] : m[2];
      continue;
    }
    // A bracket at the start of a line that holds nothing but languages is the claim: Algiers writes
    // "(Deutsch, Franzoesisch und etwas Englisch) Email: ...".
    const lead = l.match(/^\(([^()]+)\)/);
    if (lead && isBareLanguageLine(lead[1])) { claims.push(lead[1]); const rest = l.slice(lead[0].length).trim(); if (rest && !LABEL.test(rest) && !/@/.test(rest)) plain.push(rest); continue; }
    const inline = CLAIM_IN_LINE.map((re) => l.match(re)).find(Boolean);
    if (inline) { claims.push(inline[1]); const rest = l.replace(inline[0], '').trim(); if (rest.length > 3 && !/^[(),.;\s]+$/.test(rest)) plain.push(rest); continue; }
    if (isBareLanguageLine(l)) { claims.push(l); continue; }
    if (/@|^www\.|^https?:/i.test(l)) { if (!fields.url && /www\.|https?:/i.test(l) && !/@/.test(l)) fields.url = l; continue; }
    // A post box is where letters go, not where the office is: Oslo writes "Pb. 1448 Vika, 0115 Oslo"
    // first and the street under "Besucheradresse", and a box number reads as a postcode to anything
    // that places the row.
    if (/^(?:Pb\.?|Postboks|Postfach|Postadresse|P\.?\s?O\.?\s?Box|Box)\b/i.test(l)) continue;
    // Areas of law written with no label ("Zivil-, Familien- und Erbrecht") are what the firm does,
    // not where it is.
    if (!/\d/.test(l) && /[a-zäöü]recht(?:s\w*)?\b|\bRecht\b|beratung\b|Mediation|Nimmt\b|Referendar/i.test(l)) {
      fields.practice = fields.practice ? fields.practice + ', ' + l : l;
      continue;
    }
    // The people in a firm, set on lines of their own under it. Not part of its address.
    if (!/\d/.test(l) && /\b(?:Advokat|Rechtsanw\w*|Rechtanw\w*|Partner(?:in)?|RAin|Anw[äa]lt\w*|Notar\w*|Juristin|Jurist)\b|\bRA\//.test(l)) { e.persons.push(l); continue; }
    plain.push(l);
  }
  // The name may carry its own claim in brackets: "Dr. Angel Torres (Englisch)".
  let name = e.name;
  const inName = name.match(/\(([^()]+)\)\s*$/);
  if (inName && isBareLanguageLine(inName[1].replace(/\s*\/\s*/g, ', '))) {
    claims.push(inName[1].replace(/\s*\/\s*/g, ', '));
    name = name.slice(0, inName.index).trim();
  }
  const languages = [];
  claims.forEach((c) => readClaimValue(c).forEach((x) => { if (x && !languages.includes(x)) languages.push(x); }));
  // The visiting address, where the page gives one, is the address.
  const area = T.tidyAddress((fields.visit ? [fields.visit] : [fields.address, ...plain]).filter(Boolean).join(', '));
  return {
    heading: e.heading,
    specialty: e.specialty || e.heading,
    role: (fields.practice || e.practice || '').replace(/\s+/g, ' ').slice(0, 200),
    name: name.replace(/[,;:]\s*$/, '').slice(0, 100),
    languages,
    languageLine: claims.join(' | '),
    area: area.slice(0, 200),
    phone: (fields.phone || '').slice(0, 60),
    email: (e.lines.join(' ').match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    ...(e.place ? { detail: e.place } : {}),
    url: (fields.url || '').replace(/^.*?(https?:\/\/\S+|www\.\S+).*$/i, '$1'),
  };
}).filter((r) => r.name.length > 2 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length + ' with languages of their own');
  rows.forEach((r) => console.log('  ' + r.name.slice(0, 40).padEnd(42) + (r.languages.join(',') || '-').padEnd(14)
    + r.area.slice(0, 60) + (r.heading ? '  [' + r.heading.slice(0, 20) + ']' : '')));
  if (unknownLangs.size) console.log('  words a language line used that the lexicon does not hold: ' + [...unknownLangs].slice(0, 30).join(' | '));
}
