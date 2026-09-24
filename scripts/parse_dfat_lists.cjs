/**
 * Reads the lists Australia's missions publish (DFAT, *.embassy.gov.au), in all five of the shapes
 * they come in, plus the Austrian embassy Mexico's labelled translator sheet, which has the same
 * "label, value" build as DFAT's Egypt list.
 *
 * DFAT has one template and prints it five ways, and no reader here could see an entry in any of
 * them (every registered parser was run over all 22 files on 2026-09-24 and the best got 55 of
 * Germany's 109, named "Contact: Peter Zuriel"):
 *
 *   --shape pdf-grid     "Contact List - Lawyers - Qatar": a three-column table, Name | Address |
 *                        Contact Details, the first column itself a little labelled stack:
 *                            Crowell & Moring Law Firm        PO Box 22632, Doha      B: ...
 *                            Contact: Ms Lana                 West Bay ...            Fax: ...
 *                            Languages: English/Arabic        Doha                    Email: ...
 *                            Speciality: Corporate Cases
 *                        Read from pdftotext -layout, cut into columns per page (the columns move
 *                        from page to page: 41 on page one of the Qatar file, 36 on page two).
 *   --shape html-rows    the same template as an HTML table, one <tr> per entry (Germany), or a
 *                        two-cell row, entry left and practice + languages right (Italy lawyers).
 *   --shape html-cells   one <td> per entry, two entries to a row (Italy doctors).
 *   --shape html-strong  running paragraphs, each entry opened by its name in bold (France,
 *                        Greece, Romania, Bulgaria). A bold line followed straight by another bold
 *                        line is a heading ("ATHENS:", "SPECIALITY: CRIMINAL LAW"), not an entry.
 *   --shape xlsx         a workbook with one sheet per Brazilian state and a header row in each
 *                        (Name | Legal practice areas | Languages | ... | Address, or for doctors
 *                        Name | Contact type | Speciality | Languages | Phone | City | Address).
 *   --shape pdf-labels   "Frau HEMMERLING Dorothea / Sprachen ... / Adresse ..." (Austria, Mexico).
 *
 * WHAT IT RETURNS: name, area (the address), languages, languagesText, specialty (practice area
 * or medical speciality, for categorisation only), heading, url. It never returns a role, because
 * the ingest prints role as the card's note and a practice area like "Criminal Law" repeats down a
 * whole section: the note gate refuses any sentence on three cards.
 *
 * LANGUAGES, and the traps in them
 *   - Only the entry's own "Languages:" field (or column) is read. A roster claim ("English-speaking
 *     Lawyers in Germany") is added with --roster, and only where the page makes it.
 *   - A generalisation is not a claim. The Philippine lawyer lists fill the field with "Philippine
 *     lawyers are generally fluent in English" on 51 entries across the two lists: that is a sentence about a country's
 *     bar, not about this lawyer, and it gives nothing. "Fluent in English" on the next entry is a
 *     claim about that entry and is read.
 *   - A hedged language is dropped and the rest kept: "Lao, English, Hmong, Thai, Basic Chinese"
 *     gives no Chinese; "English - fair, Thai - fair, Lao - mother tongue" gives Lao alone;
 *     "Thai (basic)" gives no Thai.
 *   - "Languages: Good" (Nepal, four times) names no language and gives nothing.
 *   - More than six languages ("All European and Asian languages" or a list of eight) is refused
 *     whole, the directory's standing rule.
 *   - --drop <code> removes the country's own language, which the directory never publishes.
 *
 * NAMES
 *   - "Contact:" is a person at the firm. The first line of the entry is the firm or the person and
 *     is the name; where the entry opens with "Contact:" (Germany's criminal-law sections) its value is.
 *     A contact of several people ("Ralph Dupre, Jorg Schmidt or Peter D'Oleire") is not one name,
 *     and the firm line under it is taken instead where there is one.
 *   - Greece writes "Makri, Despoina (Ms)". The form of address comes off and the order is turned
 *     round, "Despoina Makri", because the ingest refuses a name with a bracket in it and a comma
 *     between surname and given name reads as two people on a card.
 *   - A web address or an e-mail on the first line (Germany prints the firm's site above "Contact:")
 *     is not a name and is skipped.
 *
 * ADDRESSES
 *   - pdf-grid and html-rows (three cells) take the whole Address column. Elsewhere the address is
 *     the lines between the name and the first contact line that carry a digit or an address label,
 *     at most three of them, so a practice-area sentence above the street is not glued onto it.
 *   - Brazil's doctor sheet has a City column and most addresses leave the city out
 *     ("Rua das Acacias 470, Pituba"); the column is the entry's own field, not a heading, so it is
 *     appended where the address does not already name it.
 *
 *   --shape pdf-margin   "ENGLISH SPEAKING LAWYERS IN EGYPT": the name at the left margin, a label
 *                        column ("Address", "Mobile", "Languages") and the value beside it.
 *
 * OPTIONS
 *   --roster <code>         the page's own claim, added to an entry that states no language of its own
 *   --drop <code>           the country's own language, never returned
 *   --skip / --only <re>    on the heading path ("ROME (Region Lazio) > PHARMACIES")
 *   --spec heading          categorise by the section heading only (single-profession lists)
 *   --heading-cat 're=word' add a category word under a heading the ingest's table does not know
 *   --contact-name          pdf-grid: every entry opens with "Contact:" (Germany's Munich/Hamburg PDFs)
 *   --doctor-contact        pdf-grid: one named doctor in Contact is the entry (Philippine doctors)
 *   --json
 *
 * TRAPS PAID FOR, all 2026-09-24
 *   - pdftotext closes an overflowing cell to one space, so the column cut prefers a space before
 *     what opens an address ("PO Box", a house number) over the nearest one.
 *   - The Contact column drifts a whole entry out of line on the German PDFs; an entry's top is
 *     its name row plus up to two address rows above it, never the "B:" line.
 *   - The disclaimer paragraph at the top of every page ran into the first name ("accept any
 *     liability if you choose to"); the whole paragraph is skipped.
 *   - Two PDFs set ligatures with no Unicode mapping: "Law Oce", "2 oor" (see unligature).
 *   - "00181 Roma" is a postcode, not an international number.
 *
 * Usage: node scripts/parse_dfat_lists.cjs <file> --shape <shape> [options] [--json]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));

const argv = process.argv.slice(2);
const file = argv[0];
if (!file || !fs.existsSync(file)) { console.error('usage: node scripts/parse_dfat_lists.cjs <file> --shape <shape> [options] [--json]'); process.exit(2); }
const opt = (n) => { const i = argv.indexOf(n); return i > 0 ? argv[i + 1] : ''; };
const opts = (n) => argv.map((a, i) => (a === n ? argv[i + 1] : null)).filter(Boolean);
const SHAPE = opt('--shape');
const ROSTER = opts('--roster');
const DROP = new Set(opts('--drop'));
const SKIP = opt('--skip') ? new RegExp(opt('--skip'), 'i') : null;
const ONLY = opt('--only') ? new RegExp(opt('--only'), 'i') : null;
const CONTACT_NAME = argv.includes('--contact-name');
// Only on a doctors' list is the Contact the person the entry is about. On a lawyers' list a "Dr" in
// Contact is a partner of the firm, and "Marut Bunnag International Law Office" became "Dr Rujira
// Bunnag" before this was a switch.
const DOCTOR_CONTACT = argv.includes('--doctor-contact');
/**
 * Two DFAT PDFs set "fi", "fl" and "ffi" as ligatures with no Unicode mapping, and pdftotext drops
 * them: "Ruengsak Law Oce", "2 oor". Only the repairs that cannot be anything else are made.
 */
const unligature = (l) => l.replace(/\bLaw Oce(s?)\b/g, 'Law Office$1').replace(/\b(\d+(?:st|nd|rd|th)?)\s+oor\b/g, '$1 floor');
/**
 * What the ingest may categorise an entry by.
 *
 * On a list of one profession the practice areas are a trap: a Paris lawyer who handles
 * "harcelement psychologique" and a Bangkok firm listing "psychological injury" claims were both
 * filed as therapists, because the ingest's category table meets "psycholog" before "lawyer".
 * --spec heading keeps only the section heading, and the manifest's single category does the rest.
 * --heading-cat 'Accountants=tax' adds a category word to a heading that names a profession the
 * table does not know (Germany's "English-speaking Accountants"); the word is never printed.
 */
const SPEC_MODE = opt('--spec') || 'all';
const HEADING_CAT = opts('--heading-cat').map((x) => { const i = x.lastIndexOf('='); return [new RegExp(x.slice(0, i), 'i'), x.slice(i + 1)]; });
const specialtyOf = (heading, text) => {
  const h = String(heading || '').split(' > ').pop();
  const extra = HEADING_CAT.filter(([re]) => re.test(h)).map(([, w]) => w);
  return clean([h, ...extra, SPEC_MODE === 'heading' ? '' : text].filter(Boolean).join(' / ')).slice(0, 400);
};
const unknown = new Set();

// ---------------------------------------------------------------- lines and labels

// The shared unentity knows the accented letters and not these, and "Theodorstra&szlig;e" went out
// as written. A dash is a hyphen here: the site prints no long dashes.
const clean = (s) => T.unentity(String(s || '').replace(/&szlig;/g, 'ß').replace(/&[lr]squo;|&#8217;/g, "'")
  .replace(/&[lr]dquo;|&bdquo;/g, '"').replace(/&[nm]dash;/g, '-').replace(/&hellip;/g, '...'))
  .normalize('NFKC').replace(new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']', 'g'), '-')
  .replace(/\[email\s*protected\]/gi, ' ')
  .replace(/\u00a0/g, ' ').replace(/[\u200b\ufeff]/g, '').replace(/\uFFFD/g, ' ')
  .replace(/\s+/g, ' ').trim();

const LABEL = /^(Contact|Languages?(?:\s+spoken)?|Speciality|Specialty|Specialisation|Other countries|Services provided|Jurisdiction|Managing Partners?|Contact type|Sprachen|Adresse|Telefon|Email|E-?mail|Website|Web|Tel|Fax|Mob(?:ile)?|Ph|B|M|T|Portable|Home|Whatsapp(?: business)?|Office hours)\b\.?\s*:?/i;
const CONTACT_LINE = /^(?:Tel|T[ée]l|Telephone|Emergency telephone|Phone|Ph|B|M|T|Fax|Mob(?:ile)?|Cell|Portable|Home|Whatsapp(?: business)?|E-?mail|Email|Website|Web|Office hours)\b\.?\s*:?|^\+\d|^00\d[\d\s().\/-]{6,}$|^www\.|^https?:|@/i;
// "00181 Roma" is a Roman postcode, not a number dialled from abroad: the plain "00" test threw
// every Rome address out after its street line.
const LANG_LABEL = /^(?:Languages?(?:\s+spoken)?|Langues?|Sprachen)\s*:?\s*/i;
const SPEC_LABEL = /^(?:Speciality|Specialty|Specialisation|Services provided)\s*:?\s*/i;
const ADDR_LABEL = /^(?:Address|Adresse|Office|Law firm|Cairo office|Located in \w+)\s*:?\s*/i;

// ---------------------------------------------------------------- languages

/**
 * What an entry's language field says about the entry, and nothing it merely implies.
 */
const HEDGE = /\b(basic|fair|some|limited|little|a bit|conversational|beginner|elementary|on request|via|interpret(?:er|ation) (?:available|on)|if needed)\b/i;
const GENERALISATION = /\bgenerally\b|\blawyers in the philippines\b|\bphilippine lawyers\b/i;
// English names the shared lexicon does not have yet (it has the German ones), and only for codes
// the directory supports. Reported as a patch for lib/languages_spoken.cjs; kept here meanwhile.
const EXTRA = { bulgarian: 'bg', lithuanian: 'lt', latvian: 'lv', estonian: 'et', slovene: 'sl', slovenian: 'sl', slovakian: 'sk', catalan: 'ca', arabi: 'ar', englsih: 'en', 'only english': 'en' };
const readLangs = (text) => {
  let t = clean(text).replace(LANG_LABEL, '').replace(LANG_LABEL, '');
  if (!t || GENERALISATION.test(t)) return [];
  // Cut the field where the next label starts, when the column reader ran them together.
  t = t.split(/\s(?:Speciality|Specialty|Contact|B|M|Fax|Email)\s*:/i)[0];
  const parts = t.split(/[,;/&]|\band\b|\by\b|\bund\b|\bet\b|\s-\s(?=[A-Z])/i).map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (HEDGE.test(p)) continue;
    // "English - fair" arrives as two parts once the dash has split it: a lone hedge word is
    // dropped above, and the language before it has to go with it.
    const bare = p.replace(/\((?:[^)]*)\)/g, (m) => (HEDGE.test(m) ? ' HEDGED ' : ' ')).trim();
    if (/HEDGED/.test(bare)) continue;
    const english = bare.toLowerCase().replace(/^(?:fluent(?:ly)?|speakw*|good|proficient)s+(?:ins+)?/, '').trim();
    if (EXTRA[english]) { if (!out.includes(EXTRA[english])) out.push(EXTRA[english]); continue; }
    const got = L.readLanguages(bare.replace(/^(?:fluent(?:ly)?|speak\w*|good|proficient)\s+(?:in\s+)?/i, '').replace(/\s+(?:mother tongue|native)$/i, ''), false, unknown);
    got.forEach((g) => { if (!out.includes(g)) out.push(g); });
  }
  // "English - fair, Thai - fair": the hedge sits after a dash, in its own part.
  const pairs = t.split(/[,;]/).map((s) => s.trim());
  pairs.forEach((s) => {
    const m = s.match(/^(.+?)\s*-\s*(.+)$/);
    if (m && HEDGE.test(m[2])) L.readLanguages(m[1], false, new Set()).forEach((g) => { const i = out.indexOf(g); if (i >= 0) out.splice(i, 1); });
  });
  if (out.length > 6) return [];
  return out;
};

// ---------------------------------------------------------------- names

const fixName = (raw) => {
  // "Rechtsanwaltin Dr. Katja Schumann": the profession in front of one person is a title, not
  // part of the name. The plural in front of a firm ("Rechtsanwaelte Mertens & Partner") stays.
  // "Plan B | Die Fachanwaltskanzlei" and "LEXCASE - Societe d'avocats | PARIS - LYON - MARSEILLE":
  // what follows the bar is a strapline or a list of offices, and the name ends at the bar.
  let n = clean(raw).split(/\s*\|\s*/)[0].replace(/^Contact\s*:\s*/i, '').replace(/^(?:Rechtsanw(?:a|ä)lt(?:in)?|Attorney|Atty\.?)\s+(?=\S+\s+\S)/i, '').replace(/\*+[^*]*\*+/g, ' ').replace(/\s+,/g, ',').trim();
  // "Makri, Despoina (Ms)" and "Anagnostakis, A. (Mr)": Greece writes surname first.
  const form = /\s*\((?:Mr|Mrs|Ms|Miss|Dr)\)\s*$/i;
  if (form.test(n)) {
    n = n.replace(form, '');
    const m = n.match(/^([^,]+),\s*(.+)$/);
    if (m && !/&|\b(law|firm|office|associates|partners)\b/i.test(m[1])) n = m[2] + ' ' + m[1];
  }
  // "Economou, Miltiades (Miltos)": a nickname in brackets.
  n = n.replace(/\s*\(([A-Z][a-z]+)\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  // "BEDOIS BEKISSA lawyers (France Bekissa -Avocate a la Cour)": a job title in brackets goes.
  n = n.replace(/\s*\((?=[^)]*\b(?:avocat\w*|lawyer|attorney|solicitor|notaire)\b)[^)]*\)\s*/i, ' ').trim();
  // "ALARIS (David HARTMAN)": a firm and the person to ask for.
  n = n.replace(/\s*\(([^)]+)\)\s*$/, ', $1');
  // What a list writes after the name about the person rather than as the name: ", Attorney-at-Law"
  // (Bulgaria, every entry), ", notaire", ", Responsable Droit et Fiscalite Internationale",
  // "founded by Mona Al Mutawa", ", Mr Hani Garana" and "Veirano Advogados Mr Marcelo Reinecken".
  n = n.replace(/,?\s*Attorney[- ]at[- ]Law\b.*$/i, '').replace(/,\s*(?:notaire|Responsable\b|Managing\b|Head of\b).*$/i, '')
    .replace(/\s+founded by\b.*$/i, '').replace(/(\S)(?:,\s*|\s+)(?:Mr|Mrs|Ms)\.?\s+[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)*$/, '$1');
  return n.replace(/[\s,;:-]+$/, '');
};
const isName = (l) => l && !LABEL.test(l) && !CONTACT_LINE.test(l) && /[A-Za-z]{2}/.test(l) && !/^\d/.test(l);

// ---------------------------------------------------------------- one entry from its lines

/**
 * The generic reading of an entry that is a run of lines. The grid shapes pass their columns
 * instead, so that nothing has to be guessed about which line is the address.
 */
const fromLines = (lines, heading, given = {}) => {
  lines = lines.map(clean).filter(Boolean);
  if (!lines.length) return null;
  let name = '';
  let i = 0;
  if (/^Contact\s*:/i.test(lines[0])) {
    name = lines[0];
    // Several people are not one name; the firm line underneath is.
    if (/,|\bor\b|\band\b|\bund\b|&/.test(name.replace(/^Contact\s*:\s*/i, ''))) name = lines[1] && isName(lines[1]) && FIRM.test(lines[1]) ? lines[1] : '';
  } else {
    while (i < lines.length && !isName(lines[i])) i++;
    name = lines[i] || '';
    if (!name && given.contact) name = given.contact;
  }
  let langText = '';
  let specText = '';
  let url = '';
  const addr = [];
  let seenContact = false;
  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    if (l === name) continue;
    if (LANG_LABEL.test(l)) { langText += ' ' + l; continue; }
    if (SPEC_LABEL.test(l)) { specText += ' ' + l.replace(SPEC_LABEL, ''); continue; }
    const w = l.match(/(?:^|\s)((?:https?:\/\/|www\.)[^\s|]+)/i);
    if (w && !url) url = w[1];
    if (CONTACT_LINE.test(l)) { seenContact = true; continue; }
    if (/^Contact\s*:/i.test(l)) continue;
    if (given.addr) continue;
    if (seenContact || addr.length >= 3) continue;
    if (ADDR_LABEL.test(l) || (/\d/.test(l) && l.length < 110)) addr.push(l.replace(ADDR_LABEL, '').replace(T.ADDRESS_LABEL, ''));
    else if (addr.length && /^[A-Z]/.test(l) && l.length < 40 && !/,.*,.*,/.test(l)) addr.push(l); // "75002 Paris" split, or "Frankfurt am Main"
    else if (!addr.length) specText += ' ' + l;
  }
  const area = (given.addr || addr).map(clean).filter(Boolean).join(', ')
    .replace(/\s*\|\s*/g, ', ').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  let languages = readLangs(given.langText || langText);
  // The roster claim covers an entry that says nothing about its languages. One that does has said
  // it: Brazil's "English-speaking doctors" sheet lists the suicide line CVV as "Portuguese", and
  // the page title does not overrule the row.
  if (!clean(given.langText || langText).replace(LANG_LABEL, '')) ROSTER.forEach((r) => { if (!languages.includes(r)) languages.push(r); });
  languages = languages.filter((l) => !DROP.has(l));
  // Declared, and nothing left once the country's own language is off: the entry has said it does
  // not speak the roster's language, and the ingest must not hand it the roster claim back.
  const saidNothingElse = !!clean(given.langText || langText).replace(LANG_LABEL, '') && !languages.length && !!ROSTER.length;
  return {
    heading: heading || '',
    specialty: specialtyOf(heading, given.specText || specText),
    name: fixName(name),
    languages,
    languagesText: clean(given.langText || langText).replace(LANG_LABEL, ''),
    area,
    url: given.url || url,
    ...(saidNothingElse ? { saidNothingElse: true } : {}),
  };
};

// ---------------------------------------------------------------- HTML

const htmlLines = (html) => T.unentity(html
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<span class="__cf_email__"[^>]*>[\s\S]*?<\/span>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|tr|td|th|h[1-6])>/gi, '\n')
  .replace(/<[^>]*>/g, ' '))
  .split('\n').map(clean).filter(Boolean);

const mainOf = (html) => {
  const a = html.search(/id="main"|<h1\b/i);
  const b = html.search(/<footer\b|id="footer"|class="footer/i);
  return html.slice(a > 0 ? a : 0, b > a ? b : html.length);
};

// A bold line that is only a heading: short, shouted or ending in a colon.
const HEADING_TEXT = (t) => /:$/.test(t) || /^SPECIALITY\b/i.test(t) || (t === t.toUpperCase() && /[A-Z]{3}/.test(t) && !/\d/.test(t));

const readHtml = (html) => {
  const main = mainOf(html);
  const rows = [];
  // Headings sit outside the tables as <p><strong>CAPS</strong></p> or <h2..h4>.
  const tokens = [];
  const re = /<table\b[\s\S]*?<\/table>|<h[2-4]\b[\s\S]*?<\/h[2-4]>|<p\b[\s\S]*?<\/p>/gi;
  let m;
  while ((m = re.exec(main))) tokens.push(m[0]);
  const path_ = [];
  const setHeading = (t) => {
    // A city heading resets the specialty under it; a specialty heading sits under the city.
    const isPlace = /\(Region|^[A-Z .'-]+:?$/.test(t) && !/SPECIAL|DOCTOR|LAWYER|DENTIST|HOSPITAL|PRONTO|AID|AMBULANCE|PHARMAC|LABORATOR|THERAP|PSYCH|PAEDIAT|SURGERY|GYNAE|ORTHO|OPTHAL|OPHTHAL|CARDIO|EAR|DERMA|CHIRO|PERIO|NOTAIRE|GENERAL|PRACTITIONER|JURISDICTION|SERVICES/i.test(t);
    if (isPlace) path_.length = 0;
    else if (path_.length > 1) path_.length = 1;
    path_.push(t.replace(/:$/, ''));
  };
  const headingNow = () => path_.join(' > ');
  const keep = () => !(SKIP && SKIP.test(headingNow())) && !(ONLY && !ONLY.test(headingNow()));

  if (SHAPE === 'html-strong') {
    // Each <p> is a block; an entry is a bold-led block and the plain blocks after it.
    const blocks = tokens.filter((t) => /^<p/i.test(t)).map((t) => ({
      bold: /^<p[^>]*>\s*<strong>/i.test(t),
      lines: htmlLines(t),
    })).filter((b) => b.lines.length);
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b.bold) continue;
      const next = blocks[i + 1];
      const own = b.lines.slice(1);
      if (!own.length && (!next || next.bold)) { setHeading(b.lines[0]); continue; }
      if (!own.length && HEADING_TEXT(b.lines[0]) && /^[A-Z ]+:$|^SPECIALITY/.test(b.lines[0])) { setHeading(b.lines[0]); continue; }
      const lines = b.lines.slice();
      for (let j = i + 1; j < blocks.length && !blocks[j].bold; j++) lines.push(...blocks[j].lines);
      if (keep()) rows.push(fromLines(lines, headingNow()));
    }
    return rows;
  }

  for (const t of tokens) {
    if (/^<table/i.test(t)) {
      for (const tr of t.match(/<tr\b[\s\S]*?<\/tr>/gi) || []) {
        const cells = (tr.match(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi) || []).map(htmlLines);
        if (SHAPE === 'html-cells') {
          cells.forEach((c) => { if (c.length > 1 && keep()) rows.push(fromLines(c, headingNow())); });
          continue;
        }
        const flat = cells.flat();
        if (flat.length < 2) { if (flat.length === 1 && HEADING_TEXT(flat[0])) setHeading(flat[0]); continue; }
        if (!keep()) continue;
        // DFAT's three-cell template: the middle cell is the address, whole.
        const three = cells.length === 3 && cells[2].some((l) => /^(T|B|M|Fax|E-?Mail|Website|Email)\s*:/i.test(l));
        rows.push(three ? fromLines([...cells[0], ...cells[2]], headingNow(), { addr: cells[1].filter((l) => !CONTACT_LINE.test(l)) })
          : fromLines(flat, headingNow()));
      }
    } else {
      const lines = htmlLines(t);
      if (lines.length === 1 && lines[0].length < 90 && (/^<h/i.test(t) || /^<p[^>]*>\s*<strong>/i.test(t)) && HEADING_TEXT(lines[0].replace(/\s*\(Region[^)]*\)/i, ''))) setHeading(lines[0]);
    }
  }
  return rows;
};

// ---------------------------------------------------------------- PDF grid

const layoutText = (f) => execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', f, '-'], { encoding: 'utf8', maxBuffer: 1 << 27 });

const COUNTRY_LINE = /^(Germany|Deutschland|Qatar|State of Qatar|Philippines|Laos|Lao PDR|Nepal|Thailand|Morocco|Egypt|Australia).?$/i;
const PAGE_JUNK = /^(Contact List\b|The names and contact details|Department of Foreign Affairs|any of the|endorse any|liability if you|the Department of|DFAT from|does not accept|you choose to|Australian Embassy$|An online directory|website: https:\/\/lavocat|Page \d+ of \d+|Name\s+Address\s+Contact Details|Translators and Interpreters$|Morocco$|Australian Embassy in|lawyers appearing|provides no guarantees)/i;

const mode = (xs) => {
  const c = {};
  xs.forEach((x) => { c[x] = (c[x] || 0) + 1; });
  return +Object.entries(c).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
};

// Cut one layout line into the three columns, where the columns start at s2 and s3.
const cut = (line, s2, s3) => {
  const segs = [];
  const re = /\S+(?: \S+)*/g;
  let m;
  while ((m = re.exec(line))) segs.push({ x: m.index, t: m[0] });
  const col = ['', '', ''];
  const put = (c, t) => { col[c] = (col[c] ? col[c] + ' ' : '') + t; };
  for (const s of segs) {
    let { x, t } = s;
    let forced = -1;
    // A cell that ran over the next column's start without two spaces: cut at the space nearest
    // the boundary. "Khalid Al-Attiya Legal and Consultant PO Box 9228, Doha, State of Qatar".
    for (const [c, edge] of [[0, s2], [1, s3]]) {
      const colOf = forced >= 0 ? forced : x < s2 - 2 ? 0 : x < s3 - 2 ? 1 : 2;
      if (colOf !== c) continue;
      const end = x + t.length;
      if (end > edge + 3) {
        // pdftotext closes the gap to one space and the join is rarely exactly at the column start,
        // so the nearest space loses: "Khalid Al-Attiya Legal and Consultant PO | Box 9228" was the
        // first cut. A space followed by what opens an address wins over a nearer one.
        const OPENS = /^(?:P\.?\s?O\.?\b|PO\b|\d|Unit\b|Suite\b|Level\b|Floor\b|Room\b|Bldg\b|Building\b|No\.|Rua\b|Av\.|Avenida\b|Calle\b|Street\b|St\.|Tower\b)/;
        let best = -1;
        const score = (k) => Math.abs(x + k + 1 - edge) - (OPENS.test(t.slice(k + 1)) ? 10 : 0);
        for (let k = 0; k < t.length; k++) if (t[k] === ' ' && Math.abs(x + k + 1 - edge) <= 6 && (best < 0 || score(k) < score(best))) best = k;
        if (best > 0) { put(c, t.slice(0, best)); x = x + best + 1; t = t.slice(best + 1); forced = c + 1; }
      }
    }
    put(forced >= 0 ? forced : x < s2 - 2 ? 0 : x < s3 - 2 ? 1 : 2, t);
  }
  return col;
};

/**
 * The name to use out of a Contact field. One person is a name. Several ("Dirk Ewald, Bernhard
 * Haenel, Andreas Baatz EHB Rechtsanwaelte") are the firm's partners, and the firm is the name when
 * the field carries it; without one the entry is left unnamed rather than filed under one partner.
 */
const FIRM = /(Rechtsanw\S*|Kanzlei|\bLaw\b|Legal|Partner\S*|Associates|Attorneys|Advogados|Avocats|GbR|PartG\S*|LLP|Ltd|& Co)/i;
const pickContact = (lines) => {
  lines = lines.map(clean).filter(Boolean);
  if (!lines.length) return '';
  // One person on the first line is the name, whatever the lines under it add ("Maximilian Richter"
  // over "Dollinger Richter Koellner Kleinherne, Partnerschaft" was about to be filed as a firm
  // called "Partnerschaft").
  if (!/,|\bor\b|\band\b|\bund\b|&/.test(lines[0])) return lines[0];
  const firm = lines.slice(1).find((l) => FIRM.test(l) && !/,/.test(l));
  return firm || '';
};

const readPdfGrid = (text) => {
  const rows = [];
  for (const page of text.split('\f')) {
    const lines = page.split(/\r?\n/);
    const head = lines.find((l) => /Name\s{2,}Address\s{2,}Contact Details/.test(l));
    let s2, s3;
    if (head) { s2 = head.indexOf('Address'); s3 = head.indexOf('Contact Details'); } else {
      const c3 = [];
      lines.forEach((l) => { for (const m of l.matchAll(/(?:^|\s{2,})((?:B|M|Fax|Email|Website):)/g)) c3.push(m.index + m[0].indexOf(m[1])); });
      if (!c3.length) continue;
      s3 = mode(c3.filter((x) => x > 30));
      const c2 = [];
      lines.forEach((l) => { for (const m of l.matchAll(/\s{2,}(\S)/g)) { const x = m.index + m[0].length - 1; if (x > 18 && x < s3 - 6) c2.push(x); } });
      s2 = mode(c2);
    }
    if (!s2 || !s3) continue;
    // The disclaimer every page opens with runs over three to five lines, and its tail ("accept any
    // liability if you choose to") was read as the name of the first entry on the page. The whole
    // paragraph goes, from its first words to the blank line after it.
    let inDisclaimer = false;
    for (const l of lines) {
      if (/^s*The names and contact details/i.test(l)) inDisclaimer = true;
      if (inDisclaimer) { if (!l.trim()) inDisclaimer = false; rows.push(['', '', '']); continue; }
      if (!l.trim() || PAGE_JUNK.test(l.trim())) { rows.push(['', '', '']); continue; }
      rows.push(cut(unligature(l), s2, s3).map((c) => c.trim()));
    }
  }
  // Anchors: every entry has a Languages line in the first column.
  const anchors = rows.map((r, i) => (/^Languages?\s*:/i.test(r[0]) ? i : -1)).filter((i) => i >= 0);
  const nameRowOf = (a, floor) => {
    // Up from the Contact line (or the Languages line), over rows whose first column is empty, then
    // the run of lines above that is the name.
    let k = a;
    for (let j = a; j > floor; j--) if (/^Contact\s*:/i.test(rows[j][0])) { k = j; break; }
    // Where every entry opens with its Contact line (Germany's criminal and family law PDFs), what
    // stands above it is the tail of the previous entry's specialities, never a name.
    if (CONTACT_NAME) return { top: k, contactRow: k };
    let j = k - 1;
    while (j > floor && !rows[j][0]) j--;
    let top = k;
    let n = 0;
    while (j > floor && rows[j][0] && !LABEL.test(rows[j][0]) && n < 3) { top = j; j--; n++; }
    return { top, contactRow: k };
  };
  let floor = -1;
  const found = [];
  anchors.forEach((a, idx) => {
    const { top, contactRow } = nameRowOf(a, floor);
    found.push({ a, top, contactRow });
    floor = a;
  });
  /**
   * Where an entry's rows begin. The first column is top-aligned but the address is not always:
   * Munich's "Renatastrasse 71" sits a row above "Contact: Tomas Hacker", and every Moroccan entry
   * starts its address one or two rows above the lawyer's name. Those rows (first column empty, an
   * address in the second) belong to the entry below, as long as the address column is empty just
   * above them, which is what says the previous entry's address had finished.
   *
   * The Contact column is no guide. On the German PDFs it drifts a whole entry out of line, and
   * reading "B:" as the top of an entry cut every address in two.
   */
  const leadOf = (top) => {
    let lead = 0;
    while (lead < 2 && top - lead - 1 >= 0 && !rows[top - lead - 1][0] && rows[top - lead - 1][1]) lead++;
    if (lead && top - lead - 1 >= 0 && rows[top - lead - 1][1]) lead = 0;
    return lead;
  };
  found.forEach((e) => { e.start = e.top - leadOf(e.top); });
  found.forEach((e, idx) => {
    const next = found[idx + 1];
    const start = e.start;
    const end = next ? next.start : rows.length;
    const span = rows.slice(start, end);
    const c1 = span.map((r) => r[0]).filter(Boolean);
    // The first column's lines in their labelled groups: name, Contact, Languages, Speciality.
    const nameLines = rows.slice(e.top, e.contactRow).map((r) => r[0]).filter(Boolean);
    let contact = '';
    const contactLines = [];
    let lang = '';
    let spec = '';
    let cur = '';
    for (const l of c1) {
      if (/^Contact\s*:/i.test(l)) { cur = 'c'; contact += ' ' + l.replace(/^Contact\s*:\s*/i, ''); contactLines.push(l.replace(/^Contact\s*:\s*/i, '')); continue; }
      if (/^Languages?\s*:/i.test(l)) { cur = 'l'; lang += ' ' + l; continue; }
      if (/^Special(?:i)?ty\s*:/i.test(l)) { cur = 's'; spec += ' ' + l.replace(SPEC_LABEL, ''); continue; }
      if (cur === 'c') { contact += ' ' + l; contactLines.push(l); } else if (cur === 'l') lang += ' ' + l; else if (cur === 's') spec += ' ' + l;
    }
    // The address ends at the country line. Whatever comes under it in the column is the next
    // entry's street, printed higher than its name.
    const addr = [];
    for (const r of span) { if (!r[1]) continue; addr.push(r[1]); if (COUNTRY_LINE.test(r[1])) break; }
    const contactCol = span.map((r) => r[2]).filter(Boolean).join(' ');
    const url = (contactCol.match(/Website:\s*((?:https?:\/\/|www\.)\S+(?:-\s?\S+)?)/i) || [])[1] || '';
    let name = nameLines.join(' ');
    if (!name.trim()) name = pickContact(contactLines);
    // The Philippine doctor list puts the practice in the Name column ("Own Clinic", "St. Paul's
    // Hospital" four times over) and the doctor in Contact, and it is the doctor whom "Fluent in
    // English" describes. One named doctor becomes the entry; the practice leads the address, the
    // way the Italian list writes "Rome American Hospital, Via Longoni 69".
    const doctor = DOCTOR_CONTACT ? pickContact(contactLines) : '';
    if (/^(?:Dr|Dra|Doctor|Prof)\b\.?\s+\S+\s+\S/i.test(doctor) && !/,|&|\/|\band\b/.test(doctor)) {
      if (!/^own clinic$/i.test(clean(name))) addr.unshift(clean(name));
      name = doctor;
    }
    if (/^own clinic$/i.test(clean(name))) name = '';
    if (process.env.DBG) console.error(JSON.stringify({ top: e.top, a: e.a, start, end, nameLines, contactLines, name }));
    // The heading is the nearest first-column line that sits on its own above the entry: Morocco's
    // "Casablanca", Philippines' region names are in the address instead.
    const row = fromLines([name], '', { addr, langText: lang, specText: spec, url: url.replace(/\s+/g, '') });
    if (row) { row.contact = clean(contact); found[idx].row = row; }
  });
  return found.map((f) => f.row).filter(Boolean);
};

// ---------------------------------------------------------------- PDF labels (Austria Mexico)

const readPdfLabels = (text) => {
  const out = [];
  let heading = '';
  let cur = null;
  const flush = () => { if (cur && keepH(cur.heading)) out.push(fromLines([cur.name, ...cur.lines], cur.heading, { langText: cur.lang, addr: cur.addr })); cur = null; };
  const keepH = (h) => !(SKIP && SKIP.test(h)) && !(ONLY && !ONLY.test(h));
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    const m = l.match(/^(Frau|Herr|Firma)\s{2,}(.+)$/);
    if (m) { flush(); cur = { name: m[2].replace(/\s*\(offiziell[^)]*\)/i, ''), lines: [], lang: '', addr: [], heading }; continue; }
    const lab = l.match(/^(Sprachen|Adresse|Telefon|Email|Website)\s{2,}(.+)$/);
    if (lab && cur) {
      // A label twice in one entry is the reader running into a block whose labels and values have
      // slipped a row (Emporium Translation Services puts its name beside "Sprachen" and its
      // languages beside "Telefon"). That block is dropped and the entry above it closed first,
      // or Daniel Gonzalez Menez went out speaking "Emporium Translation Services".
      if ((lab[1] === 'Sprachen' && cur.lang) || (lab[1] === 'Adresse' && cur.addr.length)) { flush(); continue; }
      if (lab[1] === 'Sprachen') cur.lang = lab[2];
      else if (lab[1] === 'Adresse') cur.addr.push(lab[2]);
      else cur.lines.push(lab[1] + ': ' + lab[2]);
      continue;
    }
    // A line on its own at the left margin, with no label, is a place heading ("Mexiko-Stadt").
    if (/^\S/.test(raw) && !/\s{2,}/.test(l) && l.length < 60 && !/^Stand|^\*|^Die |^Informationsblatt|^Sierra|^Col\.|^Alcald|^11000|bmeia/i.test(l)) { flush(); heading = l; continue; }
  }
  flush();
  return out;
};

// ---------------------------------------------------------------- PDF margin labels (DFAT Egypt)

/**
 * "ENGLISH SPEAKING LAWYERS IN EGYPT": the name at the left margin, then "Address", "Mobile",
 * "Email", "Services provided", "Languages", "Jurisdiction" as a label column with the value beside
 * it. The values slip against their labels ("Languages: Union / Jurisdiction: Arabic & English"),
 * so the per-entry language is not read at all here: the page's own title is the claim, and
 * --roster carries it. Only the first office's address is taken (Khaled Abo Shamya lists Cairo,
 * Luxor and Hurghada; the first is where the list sends a reader).
 */
const MARGIN_LABEL = /^(Address|Mobile|Email|E-mail|Tel|Fax|Website|Hotline|Languages?|Jurisdiction|Services provided|Services)\b|^(?!.*\bLaw\b)(?:[A-Z]\w*,?\s+){1,4}[Oo]ffice(?:\s+Address)?(?=\s{2,}|\s*$)/;
// "Cairo office", "Maadi, Cairo office" and "Kasr El Ainy, Cairo office" are labels for a second
// address; "Mr Samy El Sayed Law Office" is a firm, and the word Law is what tells them apart.
const readPdfMargin = (text) => {
  const out = [];
  let cur = null;
  let label = '';
  const flush = () => {
    if (cur) {
      const row = fromLines([cur.name], '', { addr: cur.addr, langText: '', specText: cur.spec });
      if (row) out.push(row);
    }
    cur = null;
  };
  let inDisclaimer = false;
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.replace(/\s+$/, '');
    if (/^\s*The names and contact details/i.test(l)) inDisclaimer = true;
    if (inDisclaimer) { if (!l.trim()) inDisclaimer = false; continue; }
    // A blank line ends an address: Shady Abdellatif gives two offices under one label.
    if (!l.trim()) { if (cur && cur.addr.length) cur.addrDone = true; continue; }
    if (/^\s*\d+\s*$/.test(l) || /ENGLISH SPEAKING LAWYERS/i.test(l)) continue;
    if (/^\S/.test(l) && !MARGIN_LABEL.test(l)) {
      // "United Group       26A Sherif Street ...": the name, then the address beside it.
      const [n, rest] = l.split(/\s{3,}/);
      flush();
      cur = { name: n, addr: rest ? [rest.trim()] : [], spec: '', addrDone: !!rest };
      label = rest ? 'Address' : '';
      continue;
    }
    if (!cur) continue;
    const m = l.match(/^(\S.*?)(?:\s{2,}(.*))?$/);
    if (/^\S/.test(l) && MARGIN_LABEL.test(l)) {
      label = m[1];
      const v = (m[2] || '').trim();
      if (/Address|office/i.test(label)) { if (!cur.addr.length || !cur.addrDone) { if (v) cur.addr.push(v); } } else if (cur.addr.length) cur.addrDone = true;
      if (/Services/i.test(label)) cur.spec += ' ' + v;
      continue;
    }
    const v = l.trim();
    if (/Address|office/i.test(label) && !cur.addrDone) cur.addr.push(v);
    else if (/Services/i.test(label)) cur.spec += ' ' + v;
  }
  flush();
  return out;
};

// ---------------------------------------------------------------- XLSX

const readXlsx = (f) => {
  const uz = (m) => execFileSync('unzip', ['-p', f, m], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const un = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, ' ');
  const ss = [...uz('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => un([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')));
  const wb = uz('xl/workbook.xml');
  const rels = uz('xl/_rels/workbook.xml.rels');
  const out = [];
  for (const m of wb.matchAll(/<sheet name="([^"]*)"[^>]*r:id="([^"]*)"/g)) {
    const t = rels.match(new RegExp('Id="' + m[2] + '"[^>]*Target="([^"]*)"')) || rels.match(new RegExp('Target="([^"]*)"[^>]*Id="' + m[2] + '"'));
    if (!t) continue;
    const x = uz('xl/' + t[1].replace(/^\/?xl\//, ''));
    let header = null;
    for (const r of x.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = {};
      for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const v = (c[3] || '').match(/<v>([\s\S]*?)<\/v>/);
        const is = (c[3] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/);
        let val = v ? v[1] : (is ? is[1] : '');
        if (/t="s"/.test(c[2])) val = ss[+val];
        if (val) cells[c[1]] = clean(un(String(val)));
      }
      const vals = Object.values(cells);
      if (vals.includes('Name') && vals.includes('Languages')) { header = Object.fromEntries(Object.entries(cells).map(([k, v]) => [v, k])); continue; }
      if (!header || !cells[header.Name]) continue;
      const g = (h) => cells[header[h]] || '';
      let addr = g('Address');
      const city = g('City');
      if (city && !/all cities/i.test(city) && addr && !new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(addr)) addr += ', ' + city;
      const heading = m[1];
      if ((SKIP && SKIP.test(heading + ' > ' + g('Contact type'))) || (ONLY && !ONLY.test(heading))) continue;
      const row = fromLines([g('Name')], heading, {
        addr: addr ? [addr] : [],
        langText: g('Languages'),
        specText: [g('Contact type'), g('Speciality'), g('Legal practice areas')].filter(Boolean).join(' / '),
        url: g('Website'),
      });
      if (row) out.push(row);
    }
  }
  return out;
};

// ---------------------------------------------------------------- run

let rows = [];
if (SHAPE === 'xlsx') rows = readXlsx(file);
else if (SHAPE === 'pdf-grid') rows = readPdfGrid(/\.pdf$/i.test(file) ? layoutText(file) : fs.readFileSync(file, 'utf8'));
else if (SHAPE === 'pdf-margin') rows = readPdfMargin(/.pdf$/i.test(file) ? layoutText(file) : fs.readFileSync(file, 'utf8'));
else if (SHAPE === 'pdf-labels') rows = readPdfLabels(/\.pdf$/i.test(file) ? layoutText(file) : fs.readFileSync(file, 'utf8'));
else if (/^html-/.test(SHAPE)) rows = readHtml(fs.readFileSync(file, 'utf8'));
else { console.error('unknown --shape ' + SHAPE); process.exit(2); }
rows = rows.filter((r) => r && r.name && !r.saidNothingElse);

if (argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ rows, unknownLanguageWords: [...unknown] }, null, 1));
} else {
  rows.forEach((r) => console.log([r.name.slice(0, 40).padEnd(41), r.languages.join(',').padEnd(12), r.area.slice(0, 60).padEnd(61), r.heading.slice(0, 30)].join(' ')));
  console.log(rows.length + ' rows, ' + rows.filter((r) => r.languages.length).length + ' with a language' + (unknown.size ? '; unread words: ' + [...unknown].join(' | ') : ''));
}
