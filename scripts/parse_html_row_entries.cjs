/**
 * Reads a consular list set as tables that name no columns, one entry per row.
 *
 * scripts/parse_diplo_table_list.cjs reads a grid by its header: "Name und Anschrift | Sprachen |
 * Sprechstunde" tells it what every cell below holds, and where that header is missing it can see
 * nothing at all. Thirty-odd missions publish without one. They use the table for layout rather than
 * for tabulation: a run of small tables, a row per doctor or per firm, the whole entry stacked
 * inside one or two cells as paragraphs.
 *
 *     <tr><td>
 *       <p><strong>Dr. Giorgio G. Alberti</strong></p>
 *       <p>Piazza Lega Lombarda 1, 20154 Milano</p>
 *       <p>Tel./Fax: 02-347059</p>
 *     </td><td>
 *       <p>Psychiater/Psychotherapeut</p>
 *       <p>(deutsch-, englischsprachig)</p>
 *     </td></tr>
 *
 * What the header would have said is said by position instead, and the positions are the same on
 * every one of these lists: the first line of the first cell is the name, the lines under it are the
 * address until a contact line ends it, and anything in a second cell describes the work. The
 * language claim is the one thing that moves. Milan and Lisbon put it in brackets, Budapest inside
 * the brackets that also carry a job title, Amsterdam and Milan's translators under a label of their
 * own: "Korrespondenzsprachen:", "Arbeitssprachen:", "Muttersprache:".
 *
 * A row that holds one short line and no digits is a section heading, not an entry. It is also the
 * only thing on the Budapest list that says what the people under it do: the entries themselves say
 * "Dr. Zoller, Rezso" and nothing more, and "Allgemeinaerzte" three rows above is the whole of the
 * evidence that they are general practitioners.
 *
 * Usage: node scripts/parse_html_row_entries.cjs <page.html> [--json]
 */
const fs = require('fs');
const path = require('path');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_html_row_entries.cjs <page.html> [--json]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');

// --- getting text out of a cell -------------------------------------------------------------------
// Every block-level close is a line break, because these entries are stacked paragraphs and joining
// them into one string loses the only structure the row has.
const lines = (frag) => String(frag || '')
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .split('\n')
  .map((l) => T.unentity(l).replace(/\s+/g, ' ').trim())
  .filter(Boolean);

// --- what a line is -------------------------------------------------------------------------------
const CONTACT = /^\s*(?:Tel|Telefon|Telef|Tlf|Fax|Mobil|Mob|Handy|Cell|E-?Mail|Mail|Internet|Homepage|Website|Webseite|Web|Skype|WhatsApp)\b\s*[.:]?|^\s*[☎✉\u{1F4DE}\u{1F4E7}\u{1F4E0}\u{1F310}]|^\s*(?:www\.|https?:)|^[\w.+-]+@[\w.-]+\.\w{2,}$/iu;
const LANG_LABEL = /^\s*(Sprachen?|Korrespondenz(?:sprachen?)?|Arbeitssprachen?|Muttersprache|Fremdsprachen?|Languages?|Langues?|Idiomas?|Lingue)\s*[:：]\s*(.+)$/i;
const WORK_LABEL = /^\s*(Fachrichtungen?|Fachgebiete?|Fachbereiche?|Spezialgebiete?|Schwerpunkte?|T[äa]tigkeitsschwerpunkte?|Rechtsgebiete\w*|Specialit\w*|Sp[ée]cialit\w*)\s*[:：]\s*(.*)$/i;

/**
 * A bracketed language claim, and the two ways of getting it wrong.
 *
 * Milan writes "(deutsch- und englischsprachig)", Lisbon "(engl., franz.)", Budapest
 * "(Kooperationsarzt der Botschaft, deutsch und englisch)", where the brackets carry a job title as
 * well. So the test cannot be that the whole bracket is languages.
 *
 * It cannot be "contains a language word" either, because the German for a country begins with the
 * German for its language and these pages are full of countries: "Rechtsanwalt (Deutschland)",
 * "zugelassen in (Spanien)". Read as a language list those give German and Spanish on no evidence at
 * all. The countries are named here and taken out before the claim is read.
 */
const COUNTRY_WORD = /^(deutschland|osterreich|oesterreich|schweiz|frankreich|spanien|portugal|niederlande|england|grossbritannien|belgien|polen|ungarn|griechenland|turkei|tuerkei|russland|japan|china|korea|brasilien|argentinien|mexiko|kolumbien|chile|indien|thailand|vietnam|usa|eu)$/;

/**
 * The two ways these lists delimit the claim.
 *
 * Budapest uses both and mostly the second: "Prof. Dr. Hirschberg, Andor (englisch)" on one row and
 * "Dr. Hajnaczky, Andras /deutsch, englisch, ungarisch, franzoesisch, spanisch/" on the next. Eight
 * of its entries were read as stating no language at all because only the brackets were looked at.
 * A slash pair carries other things too, "Medve Medical Egeszsegkozpont /Private Praxis", and those
 * simply hold no language and are read as holding none.
 */
const DELIMITED = /\(([^()]{2,120})\)|\/([^/\n]{3,120})\//g;

const readBracket = (text) => {
  const out = [];
  const brackets = String(text || '').match(DELIMITED) || [];
  for (const b of brackets) {
    const inner = b.slice(1, -1);
    // A part is only a language if it is one on its own. Dropping the country words first is what
    // stops "(Deutschland)" from becoming a claim about German.
    const kept = inner.split(/[,;/|+&]|\bund\b|\band\b|\bou\b|\be\b/i)
      .filter((p) => !COUNTRY_WORD.test(L.fold(p).replace(/[^a-z]/g, '')))
      .join(', ');
    L.readLanguages(kept, false, unknownLangs).forEach((c) => { if (!out.includes(c)) out.push(c); });
  }
  return out;
};

/**
 * A heading row: the section the entries under it belong to.
 *
 * One cell, one line, short, no street number and no contact in it. The digit test is what keeps
 * "1015 Budapest, Hattyu utca 14" from being read as a heading on the rows where the mission omitted
 * the name.
 */
const isHeading = (cells) => cells.length <= 2 && cells.filter((c) => c.length).length === 1
  && cells.some((c) => c.length === 1 && c[0].length <= 64 && !/\d/.test(c[0]) && !CONTACT.test(c[0]));

// --- cut the page into rows -----------------------------------------------------------------------
const rows = [];
let heading = '';
const tables = html.split(/<table\b/i).slice(1).map((t) => t.split(/<\/table>/i)[0]);
for (const table of tables) {
  const trs = table.split(/<tr\b/i).slice(1).map((r) => r.split(/<\/tr>/i)[0]);
  for (const tr of trs) {
    const cells = tr.split(/<t[dh]\b/i).slice(1)
      .map((c) => c.split(/<\/t[dh]>/i)[0])
      // The opening tag's own attributes are still on the front of the cell after the split.
      .map((c) => c.replace(/^[^>]*>/, ''))
      .map(lines);
    if (!cells.length || !cells.some((c) => c.length)) continue;
    if (isHeading(cells)) { heading = cells.find((c) => c.length)[0]; continue; }
    rows.push({ heading, cells });
  }
}

// --- read one row ---------------------------------------------------------------------------------
const entries = rows.map(({ heading: h, cells }) => {
  const first = cells.find((c) => c.length) || [];
  const rest = cells.slice(cells.indexOf(first) + 1).flat();
  const all = [...first, ...rest];

  // The name, with the claim taken off it: Budapest carries the language claim and the job in the
  // same brackets as the name, and what is left, "Dr. Timar, Tibor Allgemeinarzt, Facharzt fuer
  // Kinderheilkunde, Facharzt fuer HNO, macht Hausbesuche", is not what anybody is called either.
  //
  // So the name also stops at the first word that names a medical specialism. Those words follow a
  // person on these lists and never open a business, which is why the cut is only made past the
  // first word: "Zahnarztpraxis Mueller" keeps its name and "Dr. Timar, Tibor Allgemeinarzt" loses
  // the half that is a job.
  const SPECIALISM = /\s(Allgemein[aä]rzt\w*|Fach[aä]rzt\w*|Zahn[aä]rzt\w*|Kinder[aä]rzt\w*|Augen[aä]rzt\w*|Frauen[aä]rzt\w*|Haus[aä]rzt\w*|Internist\w*|Chirurg\w*|Psychiater\w*|Psychologe\w*|Psychotherapeut\w*|Physiotherapeut\w*|Heilpraktiker\w*|Hebamme\w*|Radiolog\w*|Dermatolog\w*|Kardiolog\w*|Neurolog\w*|Urolog\w*|Orthop[aä]d\w*)\b/;
  const nameLine = first[0] || '';
  const stripped = nameLine.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\/[^/\n]{3,120}\/\s*/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const cut = stripped.match(SPECIALISM);
  const name = (cut && cut.index > 0 ? stripped.slice(0, cut.index) : stripped)
    .replace(/[,;:]\s*$/, '').trim().slice(0, 80);

  // The address: the lines under the name, stopping at the first contact line. Lisbon's Dr. Grebe
  // lists six further clinics under his phone number, each with its own street and postcode, and
  // running them all together made one address 300 characters long naming six towns. The first one
  // is his; the rest are where he also holds a surgery.
  //
  // A contact line before the address has begun is skipped rather than treated as the end of it.
  // Lisbon prints Dr. Hammer-Stoll's e-mail above her clinic, and stopping at the first contact line
  // wherever it fell left her with no address and cost the row.
  const addr = [];
  for (const l of first.slice(1)) {
    if (CONTACT.test(l)) { if (addr.length) break; continue; }
    if (LANG_LABEL.test(l) || WORK_LABEL.test(l)) break;
    // The bracketed language claim sits on a line of its own on the Lisbon list, between the name
    // and the street. It is not part of the address.
    if (/^[(/].*[)/][.,]?$/.test(l) && L.readLanguages(l, false).length) continue;
    addr.push(l);
  }

  const labelled = all.map((l) => l.match(LANG_LABEL)).filter(Boolean).map((m) => m[2]);
  const work = all.map((l) => l.match(WORK_LABEL)).filter(Boolean).map((m) => m[2]).filter(Boolean);

  // A labelled claim is worth more than a bracketed one, and both are read: Milan's translators
  // state a mother tongue on one line and their working languages on the next, and a translator
  // works in both.
  const languages = [];
  labelled.forEach((v) => L.readLanguages(v, false, unknownLangs)
    .forEach((c) => { if (!languages.includes(c)) languages.push(c); }));
  if (!labelled.length) {
    readBracket(nameLine + ' ' + rest.join(' ') + ' ' + first.slice(1).join(' '))
      .forEach((c) => { if (!languages.includes(c)) languages.push(c); });
  }

  const languageLine = labelled.length
    ? labelled.join('; ')
    : (((nameLine + ' ' + rest.join(' ') + ' ' + first.slice(1).join(' ')).match(DELIMITED) || [])
      .filter((b) => L.readLanguages(b, false).length).join(' '));

  // What the row says about the work: the section it sits under, whatever a Fachrichtung label
  // holds, and the second cell's own lines, which on the Milan doctor list are the specialty and
  // nothing else.
  const role = [...work, ...rest.filter((l) => !CONTACT.test(l) && !LANG_LABEL.test(l) && !WORK_LABEL.test(l))]
    .join('; ').replace(/\s+/g, ' ').trim().slice(0, 200);

  const area = T.tidyAddress(addr.join(', '));
  const contact = all.filter((l) => CONTACT.test(l)).join(' ');
  return {
    heading: h,
    specialty: h,
    role,
    practice: role,
    name,
    languages,
    languagesText: languageLine,
    languageLine,
    area: area.slice(0, 160),
    postcode: (area.match(/\b(\d{4,5}(?:-\d{3})?)\b/) || [])[1] || '',
    phone: (contact.match(/(?:Tel|Telefon|Mobil|Handy|Fax)\b[\s.:]*([+(\d][\d\s()/.+-]{5,})/i) || [])[1] || '',
    email: (all.join(' ').match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    url: (all.join(' ').match(/(?:https?:\/\/|www\.)[\w.-]+\.\w{2,}[^\s,;]*/i) || [])[0] || '',
  };
}).filter((r) => r.name && r.name.length > 2 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows: entries }, null, 1));
} else {
  console.log(entries.length + ' entries, ' + entries.filter((r) => r.languages.length).length
    + ' with languages of their own, ' + entries.filter((r) => r.area).length + ' with an address');
  const by = {};
  entries.forEach((r) => { by[r.heading] = (by[r.heading] || 0) + 1; });
  Object.entries(by).forEach(([k, n]) => console.log('   ' + String(n).padStart(3) + '  ' + (k || '(no section)').slice(0, 50)));
  entries.slice(0, 14).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(16) + r.area.slice(0, 52)));
  if (unknownLangs.size) console.log('  words a language line used that this lexicon does not hold: ' + [...unknownLangs].slice(0, 30).join(' | '));
}
