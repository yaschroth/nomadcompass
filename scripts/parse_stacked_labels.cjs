/**
 * Reads a list whose labels sit on their own line, above the value they name.
 *
 * Austria's foreign ministry publishes its Vertrauensaerzte and Vertrauensanwaelte this way at every
 * one of its posts, and none of the readers here could see an entry in it, because every one of them
 * looks for "Label: value" on a single line and this page has the colon at the end of one line and
 * the value at the start of the next:
 *
 *     Vertrauensanwalt
 *     Maximilian Carl Gerold PREIMESBERGER
 *     Kanzlei:
 *     LASCAR Rechtsanwaelte
 *     Strasse:
 *     Kurfuerstendamm 62
 *     Stadt:
 *     Berlin 10707
 *     Sprachkenntnisse:
 *     Deutsch, Englisch, Franzoesisch
 *
 * What marks the start of an entry is the role, written out in the singular over the person's name.
 * That is worth more than any blank-line rule here, because the page is a navigation menu with a
 * list buried in the middle of it and 180 of its 287 lines are menu items: "Auslandsoesterreicher-
 * Fonds", "Grenzueberschreitende Kindesentziehung". None of them is preceded by "Vertrauensanwalt"
 * on a line of its own, and the plural the menu itself uses, "Vertrauensanwaelte und
 * Vertrauensanwaeltinnen", is not the singular an entry opens with.
 *
 * An entry is kept only if a label followed the name. That is what stops the sentence "Der
 * Vertrauensanwalt kann fuer Auskuenfte ein Honorar fordern" from becoming a lawyer.
 *
 * Usage: node scripts/parse_stacked_labels.cjs <page.html|page.txt> [--json]
 */
const fs = require('fs');
const path = require('path');

const L = require(path.join(__dirname, 'lib', 'languages_spoken.cjs'));
const T = require(path.join(__dirname, 'lib', 'service_text.cjs'));
const unknownLangs = new Set();

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/parse_stacked_labels.cjs <page.html|page.txt> [--json]'); process.exit(2); }
const raw = fs.readFileSync(file, 'utf8');

const lines = (/<\/?(html|body|div|p|table)\b/i.test(raw) ? raw
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|li|tr|td|th|h[1-6]|dt|dd)>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  : raw)
  .split('\n')
  .map((l) => T.unentity(l).replace(/\s+/g, ' ').trim())
  .filter(Boolean);

// The role each entry opens with, in the singular. The plural forms are menu items on the same page.
const ROLE = /^(Vertrauensanw[äa]lt(?:in)?|Vertrauens[äa]rzt(?:in)?|Vertrauens[üu]bersetzer(?:in)?|Honorarkonsul(?:in)?|Gerichtsdolmetscher(?:in)?)$/i;

/**
 * The label, with or without its colon.
 *
 * Austria writes "Strasse:" and the German embassy in Tel Aviv writes "Adresse" with nothing after
 * it, the value still on the line below. A bare word is only a label when the line holds that word
 * and nothing else, which is what keeps a street called Adresse or a sentence beginning "Telefon"
 * from being read as one.
 */
const LABEL = /^(Kanzlei|Institution|Ordination|Praxis|Firma|Bezeichnung|Stra[ßs]{1,2}e|Adresse|Anschrift|Postfach|Stadt|Ort|Land|Telefon|Telefonnummer|Telefax|Tel|Fax|Mobil|Handy|E-?Mail|Web|Homepage|Internet|Arbeitsgebiet|Fachgebiet|Fachrichtung|T[äa]tigkeitsbereich|Sprachkenntnisse|Sprachen|Amtssprache)\s*[:：]?$/i;
const FIELD = {
  kanzlei: 'practiceName', institution: 'practiceName', ordination: 'practiceName',
  praxis: 'practiceName', firma: 'practiceName',
  // The Tel Aviv list names each entry under a label instead of over a role: "Bezeichnung" and then
  // the doctor on the next line. It is the field that starts an entry there.
  bezeichnung: 'name',
  telefonnummer: 'phone', fachrichtung: 'practice',
  strasse: 'street', strae: 'street', adresse: 'street', anschrift: 'street', postfach: 'street',
  stadt: 'town', ort: 'town', land: 'country',
  telefon: 'phone', telefax: 'fax', tel: 'phone', fax: 'fax', mobil: 'mobile', handy: 'mobile',
  email: 'email', web: 'url', homepage: 'url', internet: 'url',
  arbeitsgebiet: 'practice', fachgebiet: 'practice', tatigkeitsbereich: 'practice',
  sprachkenntnisse: 'languages', sprachen: 'languages', amtssprache: 'languages',
};
const fieldOf = (label) => FIELD[L.fold(label).replace(/[^a-z]/g, '')] || '';

// --- cut the page into entries ---------------------------------------------------------------------
const entries = [];
let current = null;
for (let i = 0; i < lines.length; i += 1) {
  const l = lines[i];
  if (ROLE.test(l)) {
    const name = lines[i + 1] || '';
    // A role line with a label or another role under it is a stray, not an entry.
    if (!name || LABEL.test(name) || ROLE.test(name)) { current = null; continue; }
    current = { role: l, name, fields: {} };
    entries.push(current);
    i += 1;
    continue;
  }
  if (!LABEL.test(l)) continue;
  const f = fieldOf(l.replace(/[:：]\s*$/, ''));
  const value = lines[i + 1] || '';
  // A label with nothing under it: Dr. Max Wieland's Sprachkenntnisse is empty and the next line is
  // the next entry's role. Reading it would have given him a language called Vertrauensanwalt.
  if (!f || !value || LABEL.test(value) || ROLE.test(value)) continue;
  // The name label opens an entry of its own, and what stands above it is the specialty: the Tel
  // Aviv list writes "Neurologe" over "Bezeichnung" over "Dr. Benninger, Felix".
  if (f === 'name') {
    current = { role: lines[i - 1] && !LABEL.test(lines[i - 1]) ? lines[i - 1] : '', name: value, fields: {} };
    entries.push(current);
    i += 1;
    continue;
  }
  if (!current) continue;
  current.fields[f] = current.fields[f] ? current.fields[f] + ', ' + value : value;
  i += 1;
}

// --- read one entry ----------------------------------------------------------------------------------
const rows = entries.filter((e) => Object.keys(e.fields).length).map((e) => {
  const f = e.fields;
  const area = T.tidyAddress([f.practiceName, f.street, f.town, f.country].filter(Boolean).join(', '));
  return {
    heading: e.role,
    specialty: e.role,
    role: (f.practice || '').slice(0, 200),
    practice: (f.practice || '').slice(0, 200),
    name: e.name.replace(/[,;:]\s*$/, '').slice(0, 80),
    languages: L.readLanguages(f.languages || '', false, unknownLangs),
    languagesText: f.languages || '',
    languageLine: f.languages || '',
    area: area.slice(0, 160),
    // Austria writes the postcode after the town, and abroad it writes the country code in front of
    // it: "Berlin 10707", "Saarbruecken DE-66111", "Budapest H -1037".
    postcode: ((f.town || '').match(/\b([A-Z]{1,2}\s?-\s?)?(\d{4,6})\b/) || [])[2] || '',
    phone: f.phone || f.mobile || '',
    // The page writes an e-mail with (at) where the @ belongs, which is a spam measure and not part
    // of the address.
    email: (f.email || '').replace(/\s*\(at\)\s*/i, '@').replace(/\s*\(dot\)\s*/gi, '.'),
    url: f.url || '',
  };
}).filter((r) => r.name.length > 2 && (r.area || r.phone || r.email));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows }, null, 1));
} else {
  console.log(rows.length + ' entries, ' + rows.filter((r) => r.languages.length).length
    + ' with languages of their own, ' + rows.filter((r) => r.area).length + ' with an address');
  rows.slice(0, 14).forEach((r) => console.log('  ' + r.name.slice(0, 30).padEnd(32)
    + (r.languages.join(',') || '-').padEnd(16) + r.area.slice(0, 54)));
  if (unknownLangs.size) console.log('  words a language line used that this lexicon does not hold: ' + [...unknownLangs].slice(0, 24).join(' | '));
}
