/**
 * Reads a German mission's list where the entries run on and the markup says where each one starts.
 *
 * This is the third arrangement the missions publish in, after the header-driven table and the table
 * used for layout, and about twenty-five verified sources are in it: Riga, Zagreb, Warsaw, Krakow,
 * Belgrade, Stockholm, Dublin, Taipei, Singapore. In the rendered text an entry is a name, an
 * address under it and then labelled lines, with nothing at all between one entry and the next:
 *
 *     HNO
 *     Dr. Kaspars Peksis
 *     Klinik Headline
 *     Kalnciema iela 98-16, Riga
 *     Tel.: 67 47 30 45
 *     Sprache: Deutsch
 *     Innere Medizin/Kardiologie
 *     Dr. Gustavs Latkovskis
 *
 * scripts/parse_diplo_block_list.cjs knows this structure and cannot read it, because what marks an
 * entry for it is a blank line and the flattened text has none.
 *
 * Reading the boundary out of the text was tried first and thrown away: taking "the next unlabelled
 * line after a labelled one" reads Zagreb well and misreads everything else, because a second office
 * address sits under the first telephone number and looks exactly like the next firm. It published a
 * lawyer called "Billrothstrasse 86".
 *
 * The boundary is not in the text. It is in the markup, and the ministry's CMS is consistent about
 * it: the name of an entry is a paragraph that opens with <strong>, and a section heading is the
 * same thing underlined. Everything else is that entry's body.
 *
 *     <p class="rte__paragraph"><strong><span class="rte__underline">HNO</span></strong></p>
 *     <p class="rte__paragraph"><strong>Dr. Kaspars Peksis</strong></p>
 *     <p class="rte__paragraph">Klinik Headline</p>
 *
 * Not every post underlines its headings; where none is underlined the bold paragraphs are all
 * names, and a heading, if the page has one, is a real heading element.
 *
 * Usage: node scripts/parse_diplo_bold_run.cjs <page.html> [--json]
 */
const fs = require('fs');
const path = require('path');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_diplo_bold_run.cjs <page.html> [--json]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8')
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');

/**
 * This reader refuses a page the German missions did not publish.
 *
 * It has to. What it looks for is a bold paragraph, and every publisher bolds something, so on the
 * French embassy's Spanish list it found 382 "entries" against the 284 real ones a reader of that
 * page finds. On a roster source nothing states its own language, so the two reads score alike and
 * the larger number wins: a wrong reader beats a right one by being wronger.
 *
 * The whole premise here is that the ministry's CMS is consistent about the markup, so the CMS is
 * also the evidence. Its class prefix appears on all 89 of the German mission pages in the registry
 * and on none of the 60 pages published by anybody else.
 */
if (!/\brte__/.test(html)) {
  if (process.argv.includes('--json')) console.log(JSON.stringify({ rows: [] }, null, 1));
  else console.log('0 entries: this page is not one of the German missions, it does not use their CMS markup');
  process.exit(0);
}

/**
 * Zagreb letter-spaces the town it is in: "10000 Z a g r e b", and Dubrovnik, Pula, Zadar and Krk
 * the same way. Nothing downstream can read that. It is not the city the manifest names either: the
 * list covers the whole country, so leaving the spacing in would have put a Dubrovnik firm 500 km
 * away in Zagreb by falling back to the manifest.
 *
 * Three or more single letters in a row with no full stop between them. The full stop is what keeps
 * "J. R. R. Tolkien" and "Via A. B. Cairoli" out of it.
 */
const unspace = (s) => s.replace(/\b(?:[A-Za-zÀ-ž] ){2,}[A-Za-zÀ-ž]\b/g, (m) => m.replace(/ /g, ''));
const text = (frag) => unspace(T.unentity(String(frag || '')
  .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
/**
 * The lines inside a paragraph.
 *
 * Stockholm writes a whole entry as one paragraph with soft breaks in it, and flattening those to
 * spaces buried "Sprachen: Deutsch, Englisch, Schwedisch" in the middle of a sentence about the
 * doctor's specialism, where nothing would look for a label. Every one of its eleven entries lost
 * its languages that way.
 */
const linesOf = (frag) => String(frag || '').replace(/<br\s*\/?>/gi, '\n').split('\n')
  .map(text).filter(Boolean);

// The paragraphs and headings of the page, in the order they appear.
const CHUNK = /<(p|li|h[2-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const chunks = [...html.matchAll(CHUNK)].map((m) => ({
  tag: m[1].toLowerCase(),
  inner: m[3],
  body: text(m[3]),
  lines: linesOf(m[3]),
}));

// A paragraph that opens with bold text.
const opensBold = (inner) => /^\s*(?:<(?!strong)[a-z]+\b[^>]*>\s*)*<strong\b/i.test(inner);
const boldText = (inner) => text((inner.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i) || [])[1] || '');
/**
 * A section heading, which the CMS writes as an underline and not always as a bold one.
 *
 * Riga underlines inside the bold, "<strong><span class=underline>HNO</span></strong>". Stockholm
 * underlines without bolding at all, so its "Kooperationsaerztin" and "Chiropraktik" were read as
 * body text and ended up in the address of whichever entry stood above them. The test is that the
 * paragraph holds an underline and says nothing outside it.
 */
const underlineText = (inner) => text((inner.match(/<[a-z]+\b[^>]*underline[^>]*>([\s\S]*?)<\/[a-z]+>/i) || [])[1] || '');
const isHeadingChunk = (c) => {
  const u = underlineText(c.inner);
  return !!u && u.length >= c.body.length - 1;
};

const LABEL = /^\s*(Tel|Telefon|Telefax|Fax|Mobil|Handy|Mob|E-?Mail|Mail|Homepage|Internet|Website|Webseite|Web|Anschrift|Adresse|Postanschrift|Sprachen?|Sprachkenntnisse|Korrespondenz(?:sprachen?)?|Fremdsprachen?|Fachrichtungen?|Fachgebiete?|Fachbereiche?|Spezialgebiete?|T[äa]tigkeitsschwerpunkte?|Rechtsgebiete\w*|Schwerpunkte?|Spezialisierungen?|Sprechzeiten|B[üu]rozeiten|[ÖO]ffnungszeiten|Ansprechpartner(?:in)?)\b[^:：]{0,24}[:：]\s*(.*)$/i;
const FIELD = {
  tel: 'phone', telefon: 'phone', telefax: 'fax', fax: 'fax', mobil: 'phone', handy: 'phone', mob: 'phone',
  email: 'email', mail: 'email', homepage: 'url', internet: 'url', website: 'url', webseite: 'url', web: 'url',
  anschrift: 'address', adresse: 'address', postanschrift: 'address',
  sprache: 'languages', sprachen: 'languages', sprachkenntnisse: 'languages',
  korrespondenz: 'languages', korrespondenzsprache: 'languages', korrespondenzsprachen: 'languages',
  fremdsprache: 'languages', fremdsprachen: 'languages',
  fachrichtung: 'practice', fachrichtungen: 'practice', fachgebiet: 'practice', fachgebiete: 'practice',
  fachbereich: 'practice', fachbereiche: 'practice', spezialgebiet: 'practice', spezialgebiete: 'practice',
  spezialisierung: 'practice', spezialisierungen: 'practice',
  tatigkeitsschwerpunkt: 'practice', tatigkeitsschwerpunkte: 'practice',
  rechtsgebiete: 'practice', schwerpunkt: 'practice', schwerpunkte: 'practice',
  sprechzeiten: 'hours', burozeiten: 'hours', offnungszeiten: 'hours',
  ansprechpartner: 'contact', ansprechpartnerin: 'contact',
};
const fieldOf = (label) => FIELD[L.fold(label).replace(/[^a-z]/g, '')] || '';

/**
 * A bold paragraph that is not an entry.
 *
 * These pages bold the covering note's own subheadings as well: "Liste von Rechtsanwaltskanzleien",
 * "Rechtsanwaelte in Zagreb", "Vorwahl fuer Kroatien aus Deutschland: 00 385". Each is a sentence or
 * a section title, not a firm, and each would otherwise open an entry and take the next firm's
 * address.
 */
const NOT_AN_ENTRY = /^(Liste\b|Rechtsanw[äa]lte in\b|[ÄA]rzt\w* in\b|[ÜU]bersetzer\w* in\b|Notare? in\b|Vorwahl\b|Hinweis\b|Achtung\b|Bitte\b|Stand\b|Haftungsausschluss|Allgemeine|Die |Der |Das |Wir |Sie |Es |Im |In |Bei |Nach |Zur |Zum |I+\.\s|[IVX]+\.\s|Niederlassung\b|Zweigstelle\b|Filiale\b)/;
/**
 * A bold word that is a heading of the entry's own, matched whole.
 *
 * Riga bolds the day of the week over a second surgery's opening hours and Warsaw bolds "Anwaelte"
 * over the partners' names. Anchored at both ends on purpose: a firm called "Anwaelte Mueller &
 * Partner" keeps its name and a line that says only "Anwaelte" does not become one.
 */
const IS_A_HEADING_WORD = /^(?:[ÄA]rzt(?:e|innen)?|Anw[äa]lte|Rechtsanw[äa]lte|Partner|Kontakt|Adresse|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Montags|Dienstags|Mittwochs|Donnerstags|Freitags|Samstags|Sonntags|Termine|Sprechzeiten|[ÖO]ffnungszeiten)[,:]?$/i;

// --- cut the page into entries -----------------------------------------------------------------------
const entries = [];
let heading = '';
let current = null;
for (const c of chunks) {
  if (!c.body) continue;
  if (/^h[2-6]$/.test(c.tag) || isHeadingChunk(c)) { heading = c.body.slice(0, 80); current = null; continue; }
  if (c.tag === 'p' && opensBold(c.inner)) {
    const name = boldText(c.inner);
    const tail = c.lines[0] === name ? '' : (c.lines[0] || '').slice(name.length).replace(/^[\s,;:-]+/, '');
    /**
     * A bold run that is not a name.
     *
     * These pages bold for emphasis inside their covering note as well as for an entry, and the two
     * are told apart by what follows. A name stands at the end of its line or over an address; a
     * bolded first word runs straight on in lower case, "Rechtsberatung erfolgt in Kroatien gegen
     * Gebuehren". Warsaw bolds its labels the same way, "Fachrichtungen:" over the practice areas,
     * and Zagreb published five sentences as law firms before this test existed.
     */
    const runsOn = /^[a-zäöüß]/.test(tail);
    const isLabel = LABEL.test(name + ':') || /^[:：]/.test((c.lines[0] || '').slice(name.length).trim());
    if (!name || runsOn || isLabel || NOT_AN_ENTRY.test(name) || IS_A_HEADING_WORD.test(name)) { current = null; continue; }
    current = { heading, name, lines: [], fields: {} };
    entries.push(current);
    // A name paragraph can carry the rest of the entry under it, split by its soft breaks.
    if (tail) current.lines.push(tail);
    current.lines.push(...c.lines.slice(1));
    continue;
  }
  if (!current) continue;
  current.lines.push(...c.lines);
}

// --- read one entry -----------------------------------------------------------------------------------
const rows = entries.map((e) => {
  const plain = [];
  for (const l of e.lines) {
    const m = l.match(LABEL);
    if (m) {
      const f = fieldOf(m[1]);
      if (f && m[2]) e.fields[f] = e.fields[f] ? e.fields[f] + ', ' + m[2] : m[2];
      continue;
    }
    plain.push(l);
  }
  const area = T.tidyAddress([e.fields.address, ...plain].filter(Boolean).join(', '));
  return {
    heading: e.heading,
    specialty: e.heading,
    role: (e.fields.practice || '').replace(/\s+/g, ' ').slice(0, 200),
    practice: (e.fields.practice || '').replace(/\s+/g, ' ').slice(0, 200),
    name: e.name.replace(/[,;:]\s*$/, '').slice(0, 80),
    languages: L.readLanguages(e.fields.languages || '', false, unknownLangs),
    languagesText: e.fields.languages || '',
    languageLine: e.fields.languages || '',
    area: area.slice(0, 160),
    postcode: (area.match(/\b(\d{4,6}(?:-\d{3})?)\b/) || [])[1] || '',
    phone: (e.fields.phone || '').slice(0, 60),
    email: e.fields.email || (e.lines.join(' ').match(/[\w.+-]+@[\w.-]+\.\w{2,}/) || [])[0] || '',
    url: e.fields.url || '',
  };
}).filter((r) => r.name.length > 2 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length
    + ' with languages of their own, ' + rows.filter((r) => r.area).length + ' with an address');
  const by = {};
  rows.forEach((r) => { by[r.heading] = (by[r.heading] || 0) + 1; });
  Object.entries(by).slice(0, 14).forEach(([k, n]) => console.log('   ' + String(n).padStart(3) + '  ' + (k || '(no section)').slice(0, 50)));
  rows.slice(0, 12).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(18) + r.area.slice(0, 48)));
  if (unknownLangs.size) console.log('  words a language line used that this lexicon does not hold: ' + [...unknownLangs].slice(0, 20).join(' | '));
}
