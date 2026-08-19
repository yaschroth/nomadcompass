/**
 * Reads a German mission's list that is written as running text rather than as a table of columns.
 *
 * Lisbon publishes "Liste deutschsprachiger Aerzte in Portugal" as headings and blocks: an h2 names
 * the region (Grossraum LISSABON, Nordportugal, Suedportugal), an h3 names the profession
 * (ZAHNAERZTE, PHYSIOTHERAPEUTEN, PSYCHOLOGEN), and under them each entry runs
 * "Dr. Arnaldo Matos (engl., franz.) Rua Julio Dinis, 247". There are no columns to read, so the
 * structure has to come from the headings and from where one entry ends and the next begins.
 *
 * Two claims live in such a page and they are not the same. The title is a roster claim: everyone
 * on it speaks German. The parenthetical is that entry's own, and it adds languages rather than
 * replacing the roster's. The roster language is passed in explicitly with --roster rather than
 * guessed from the title, because a parser that reads a claim out of a headline will eventually
 * read one that is not there.
 *
 * Usage: node scripts/parse_diplo_flat_list.cjs <page.html> --roster de [--json]
 */
const fs = require('fs');

const file = process.argv[2];
const rosterAt = process.argv.indexOf('--roster');
const ROSTER = rosterAt > 0 ? String(process.argv[rosterAt + 1] || '').split(',').filter(Boolean) : [];
if (!file || !ROSTER.length) {
  console.error('usage: node scripts/parse_diplo_flat_list.cjs <page.html> --roster de[,pt] [--json]');
  process.exit(2);
}

const dec = (s) => String(s || '')
  .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/td>|<\/tr>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#8217;/g, "'")
  .replace(/&quot;|&(l|r)dquo;/g, '"')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
  .replace(/\n{2,}/g, '\n').trim();

// The abbreviations these lists use in a parenthetical: "(engl., franz.)".
const LANG = {
  dt: 'de', deutsch: 'de', german: 'de', alem: 'de',
  engl: 'en', english: 'en', ingl: 'en',
  franz: 'fr', frz: 'fr', french: 'fr', franc: 'fr',
  span: 'es', spanisch: 'es', esp: 'es',
  ital: 'it', port: 'pt', holl: 'nl', niederl: 'nl', russ: 'ru', poln: 'pl',
  griech: 'el', tuerk: 'tr', turk: 'tr', arab: 'ar', chin: 'zh', japan: 'ja',
  schwed: 'sv', norweg: 'no', daen: 'da', dan: 'da', finn: 'fi', tschech: 'cs',
  ungar: 'hu', kroat: 'hr', serb: 'sr', rum: 'ro', bulgar: 'bg', hebr: 'he',
};
const foldWord = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();
const readLanguages = (inside) => {
  const out = [];
  foldWord(inside).split(/[,;/|]+|\bund\b|\band\b/).map((p) => p.trim().replace(/\.$/, '')).filter(Boolean)
    .forEach((p) => {
      const hit = Object.keys(LANG).find((k) => p.startsWith(k));
      if (hit && !out.includes(LANG[hit])) out.push(LANG[hit]);
    });
  return out;
};

// An entry starts where a name starts: a title, or a capitalised word followed by another.
const ENTRY_START = /^(Dr\.?|Dra\.?|Prof\.?|Prof\. Dr\.?|Med\.|Herr|Frau|Clinica|Cl[ií]nica|Centro|Hospital|Casa)\b|^[A-ZÀ-Þ][a-zà-ÿ'-]+\s+[A-ZÀ-Þ]/;
// A line that is only contact detail belongs to the entry above it, not to a new one.
const CONTACT = /^(Tel|Telef|Fax|Mob|E-?Mail|www\.|http|@)/i;
// Nor does a line that names a profession: "Haut-und Geschlechtskrankheiten" is what the doctor
// above does, and read as a new entry it becomes a person by that name on the published page.
const IS_PROFESSION = /^(Fach[äa]rzt|Facharzt|[ÄA]rzt|Spezialist|Haut|Innere|Hals|Kinder|Augen|Zahn|Chirurg|Psych|Physio|Allgemein|Praxis|Sprechstunde|Klinik f)/i;
// Where a name stops and the job begins, on a line that runs the two together.
const ROLE_START = /\s+(Fach[äa]rzt\w*|Spezialist\w*|Praxis f[üu]r|Klinik f[üu]r|Ober[äa]rzt\w*|Leiter\w*|Dipl\.|Psycholog\w*|Psychotherapeut\w*|Psychoanalytiker\w*|Psychiater\w*|Kinder[äa]rzt\w*|Zahn[äa]rzt\w*)\b/i;

const html = fs.readFileSync(file, 'utf8');
const parts = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>|<h3[^>]*>([\s\S]*?)<\/h3>|<table[\s\S]*?<\/table>/g)];
const NOT_CONTENT = /navigation|seitennavigation|men[üu]|suchen|skiplinks|kontakt|inhalt/i;

let region = '';
let specialty = '';
const rows = [];
for (const m of parts) {
  if (m[1] !== undefined) {
    const h = dec(m[1]).replace(/\s+/g, ' ');
    if (h && !NOT_CONTENT.test(h)) { region = h; specialty = ''; }
    continue;
  }
  if (m[2] !== undefined) {
    const h = dec(m[2]).replace(/\s+/g, ' ');
    if (h && !NOT_CONTENT.test(h)) specialty = h;
    continue;
  }
  // Everything in this table, as lines, grouped into entries.
  const lines = dec(m[0]).split('\n').map((l) => l.trim()).filter(Boolean);
  let current = null;
  const flush = () => {
    if (!current) return;
    const text = current.join(' ').replace(/\s+/g, ' ').trim();
    const paren = text.match(/\(([^)]*)\)/);
    const own = paren ? readLanguages(paren[1]) : [];
    // A parenthetical that holds no language at all is a note about the practice, and the entry
    // keeps it as part of its address rather than losing it.
    // The address starts at the first house number or street word, and the name ends there. The
    // abbreviations run into the street name with no space, "R.Alvaro Casteloes", so the boundary
    // is the abbreviation itself and not the space after it.
    // The street abbreviations are followed by a lower-case particle as often as by a capital,
    // "Av. da Boavista", so the letter after the dot cannot be required to be a capital.
    const ADDRESS_START = /\s(?=\d{1,4}[.,]?\s)|\s?(?=(?:R|Av|Pct|Trav|Urb|Edif|Lg|Estr)\.\s?[A-Za-zÀ-ÿ])|\s(?=Rua\b|Avenida\b|Pra[cç]a\b|Praceta\b|Largo\b|Estrada\b|Alameda\b)/;
    const name = text.slice(0, paren && own.length ? paren.index : undefined)
      .replace(/\s*,\s*$/, '')
      .split(ADDRESS_START)[0]
      .replace(/\s*Tel\.?:?.*$/i, '')
      .split(ROLE_START)[0]
      .replace(/\b\d{4}-?\d{0,3}\b.*$/, '')
      .replace(/[,\s]+$/, '')
      .replace(/\s+/g, ' ').trim();
    const rest = text.slice(name.length).replace(/^\s*\([^)]*\)\s*/, '').replace(/^[,\s]+/, '');
    if (name.length >= 4 && name.length <= 70) {
      rows.push({
        region,
        specialty,
        name,
        languages: [...new Set([...ROSTER, ...own])],
        ownLanguages: own,
        area: rest.split(/\s(?:Tel|Telef|Fax|E-?Mail|www\.)/i)[0].replace(/[,\s]+$/, '').slice(0, 120),
        // The postcode can sit past the phone number or on a later line, so the whole entry is read.
        postcode: (text.match(/\b(\d{4}-\d{3})\b/) || text.match(/\b(\d{4,5})\b/) || [])[1] || '',
        url: (rest.match(/\b((?:https?:\/\/|www\.)[^\s,)]+)/) || [])[1] || '',
      });
    }
    current = null;
  };
  // A line that opens with a street is the address of the entry above it, however much it looks
  // like a new one: "Rua Julio Dinis, 247-6.-Sala 13" was being published as a person.
  const IS_ADDRESS = /^(Rua\b|R\.|Av\.|Avenida\b|Pra[cç]a\b|Praceta\b|Largo\b|Lg\.|Estrada\b|Estr\.|Alameda\b|Urb\.|Edif|Pct\.|Trav\.|\d)/;
  for (const line of lines) {
    if (CONTACT.test(line)) { if (current) current.push(line); continue; }
    if (IS_ADDRESS.test(line)) { if (current) current.push(line); continue; }
    if (IS_PROFESSION.test(line)) { if (current) current.push(line); continue; }
    if (ENTRY_START.test(line)) { flush(); current = [line]; continue; }
    if (current) current.push(line);
  }
  flush();
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, roster: ROSTER }, null, 2));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.ownLanguages.length).length
    + ' naming languages of their own beyond the roster, ' + rows.filter((r) => r.postcode).length + ' with a postcode');
  const by = {};
  rows.forEach((r) => { by[r.region + ' / ' + r.specialty] = (by[r.region + ' / ' + r.specialty] || 0) + 1; });
  Object.entries(by).forEach(([k, n]) => console.log('   ' + String(n).padStart(3) + '  ' + k.slice(0, 60)));
  rows.slice(0, 6).forEach((r) => console.log('  e.g. ' + r.name.slice(0, 32).padEnd(34)
    + r.languages.join(',').padEnd(10) + r.area.slice(0, 40)));
}
